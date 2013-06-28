// This file describes migrations needing to be run on the database to set up collections, install
// initial data seeds, etc.  A migration function must be in the MIGRATIONS list in order to be
// automatically run.  Once a user runs a given migration, their system will never run that
// migration again without intervention (manual modification of the migrations collection).
//
// **Please note**: Once published a migration must *never* change in any meaningful way.  If new
// features are added, they need to be in their own migration method so existing users get the
// changes.  Even renaming a function will cause things to break, because the function name is
// stored in the migrations collection.
var DB = require('../lib/db-manager.js')
  , logger = require('../lib/log')
  , async = require("async");

// Array describing migrations we need to run
var MIGRATIONS = [
  autoExpireRooms, addAudienceName, addAuthStructure, addAuthUIUpdates, createQTypes, 
  autoExpireSessions, sessionExpireIndex, responseExpireIndex, passResetExpireIndex,
  systemAlertVariable
];

DB.connect(function() {
  migrate(function() {
    DB.init.close();
  });
});

// Run all migrations not yet run
function migrate(callback) {
  var migrations = DB.init.collection("migrations");

  // Grab the current migration version
  migrations.find(function(err, cursor) {
    if (!cursor) {
      logger.err("ERROR: Unable to access migration collection - MIGRATIONS ABORTED");
      return;
    }

    cursor.toArray(function(err, docArray) {
      // Build a list of the names of already-run migrations so we can easily see what we haven't
      // already run
      var migrations_run = {};
      for (var x = 0; x < docArray.length; x++) {
        migrations_run[(docArray[x].name)] = docArray[x];
      }

      var x = 0;

      // We use async.whilst here so we can iterate over all the migration functions and mongo
      // save() calls asynchronously, but still know that the final callback is only hit after
      // all of this stuff is done.  This is done so we can properly close the DB connection - if
      // we don't close the DB connection at the right time, the node app simply hangs forever.
      async.whilst(
        // While counter is less than the number of migrations...
        function() {
          return x < MIGRATIONS.length;
        },

        // Grab the next migration in the list and run it if necessary
        function(asyncCB) {
          var func = MIGRATIONS[x++];
          var funcName = func.name;
          logger.debug("Found migration: " + funcName);
          if (!migrations_run[funcName]) {
            logger.info("Running migration " + funcName);
            func(function() {
              migrations.save({"name": funcName}, function() {
                logger.info("--Done");
                asyncCB();
              });
            });
          }
          else {
            logger.debug("Already run");
            asyncCB();
          }
        },

        // All items are completed - call the main callback which closes the DB
        function(err) {
          callback();
        }
      );
    });
  });
}

// Migration 1: sets up an index on the rooms collection to automatically expire the room based
// on its expireTime attribute
function autoExpireRooms(callback) {
  DB.init.collection("rooms").ensureIndex( { "expireTime": 1 }, { expireAfterSeconds: 60 }, callback);
}

// Migration 2: Creates audience name variable
function addAudienceName(callback) {
  DB.init.collection("variables").save({"name": "audience-name", "value": "Student / Audience"}, callback);
}

// Migration 3: Create Authorization Structure
function addAuthStructure(callback) {
  var authDocs = [
    {"systemRoles" : [ "admin", "presenter" ]},
    {"name" : "people", "roles" : ["admin"], "adminLock" : 1, "category" : "route", "menu" : "restricted"},
    {"name" : "grant", "roles" : ["admin"], "adminLock" : 1, "category" : "route", "menu" : "restricted"},
    {"name" : "plugin", "roles" : ["admin"], "category" : "route", "menu" : "restricted"}
  ]
  // Add auth docs to permissions collection
  DB.init.collection("permissions").save(authDocs, {safe: true}, callback);
}

// Migrate 4: 
function addAuthUIUpdates(callback) {
  // Add permission for route 
  DB.init.collection("permissions").save({name:"settings", roles:["admin"], adminLock: 1, category:"route", menu:"restricted"});
  // Add setting variables
  var variableDocs = [
    {name:"allow-registration", value:"1", type:"settings", category:"item", display:"Allow Registration", categoryType:"account", inputType:"button"},
    {name:"password-recovery", value:"1", type:"settings", category:"item", display:"Allow Password Recovery", categoryType:"account", inputType:"button"},
    {name:"password-change", value:"1", type:"settings", category:"item", display:"Allow Password Change", categoryType:"account", inputType:"button"},
    {name:"setting-category-general", value:"general", type:"settings", category:"category", display:"General", categoryType:"general"},
    {name:"setting-category-account", value:"account", type:"settings", category:"category", display:"Account", categoryType:"account"}
  ]
  DB.init.collection("variables").save(variableDocs);
  // Update Audience 
  DB.init.collection("variables").update({name:"audience-name"},{$set:{type:"settings", category:"item", display:"Audience Name", categoryType:"general"}});
  callback();
}

// Migrate 5:
function createQTypes(callback) {
  var qTypeDocs = [
    {name:"true-false", title:"True False", shortTitle:"T/F", icon:"icon-check", js:"/js/question-types/true-false.js"},
    {name:"multiple-choice", title:"Multiple Choice", shortTitle:"MC", icon:"icon-th-list", js:"/js/question-types/multiple-choice.js"},
    {name:"open-response", title:"Open Response", shortTitle:"Open", icon:"icon-font", js:"/js/question-types/open-response.js"},
    {name:"slider", title:"Slider", shortTitle:"Slider", icon:"icon-resize-horizontal", js:"/js/question-types/slider.js"},
    {name:"numeric", title:"Numeric", shortTitle:"Num", iconTxt:"#", js:"/js/question-types/numeric.js"},
    {name:"cloud", title:"Cloud", shortTitle:"Cloud", icon:"icon-cloud", js:"/js/question-types/cloud.js"},
  ]
  DB.init.collection("question_types").save(qTypeDocs, {safe:true}, callback);
}

// Migrate 6: sets up an index on the responses collection to automatically expire a response based
// on its expireTime attribute
function autoExpireSessions(callback){
  var responseVar = [
    {name:"setting-category-session", value:"session", type:"settings", category:"category", display:"Session", categoryType:"session"},
    {name:"session-expireTime", value:"0", type:"settings", category:"item", 
    display:"Auto Delete Sessions and associated client responses after:", categoryType:"session", displayNote:"Time in Days. (0 = Never delete session and client data)"}
  ];
  DB.init.collection("variables").save(responseVar, {safe: true}, callback);
}
function sessionExpireIndex(callback){
  DB.init.collection("sessions").ensureIndex( { "expireTime": 1 }, { expireAfterSeconds: 0 }, callback);
}
function responseExpireIndex(callback){
  DB.init.collection("responses").ensureIndex( { "expireTime": 1 }, { expireAfterSeconds: 0 }, callback);  
}

// Migrate 7: Create collection - "password-reset" and auto expire 
function passResetExpireIndex(callback){
  DB.init.collection("password_reset").ensureIndex( { "expireTime": 1 }, { expireAfterSeconds: 0 }, callback);
}

// Migrate 8: Add site notification
function systemAlertVariable(callback){
  var siteNoteDoc = {name:"system-alert", value:"", type:"settings", category:"item", display:"System Alert", categoryType:"general", displayNote:"Alert will display on login screen & admin dashboard."};
  DB.init.collection("variables").save(siteNoteDoc, {safe:true}, callback);
}