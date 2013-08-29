var mongodb = require('mongodb').Db
  , Server = require('mongodb').Server
  , mongo = require('mongodb')
  , moment = require('moment')  
  , util = require('util')
  , logger = require('./log')
  , CONFIG = require('./config-loader.js');

var dbPort = CONFIG.SERVER('DB_PORT')
  , dbHost = CONFIG.SERVER('DB_HOST')
  , dbName = CONFIG.SERVER('DB_NAME');

var DB = {}; 
DB.init = new mongodb(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}, {}),{w:1});

logger.debugPair('DB.init',DB.init);

/**
 * Opens the database and, if successful, calls the given callback.  We assume here that the
 * database is necessary for the callback to run, allowing us to avoid making the caller handle
 * error and failure conditions.
 */
DB.connect = function(callback) {
  DB.init.open(function(e, d){
    if (e) {
      logger.err("Error", util.inspect(e));
      return;
    }

    logger.logPair('Connected to database', DB.init.databaseName);

    if (!CONFIG.SERVER("DB_AUTH_NAME") && !CONFIG.SERVER("DB_AUTH_PASS")) {
      callback();
      return;
    }

    checkAuth(callback);
  });
};

/**
 * Verifies db user/pass allow access to the database, only calling the callback if this is the
 * case.  Meant only to be used internally since we hard-code error responses.
 */
function checkAuth(callback) {
  var name = CONFIG.SERVER("DB_AUTH_NAME");
  var pass = CONFIG.SERVER("DB_AUTH_PASS");
  var database = CONFIG.SERVER("DB_NAME");

  DB.init.authenticate(name, pass, {authdb: database}, function(error, successful) {
    if (error) {
      logger.err("Error trying to authenticate: " + util.inspect(error));
      DB.init.close();
      return;
    }
    if (!successful) {
      logger.err("Unable to authenticate with the given username / password combination");
      DB.init.close();
      return;
    }

    logger.info("DB authentication successful");
    callback();
  });
}

// Create a set
DB.insertRec = function(collection, newData, callback){
  //Set Time of creation
  newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
  collection.insert(newData, {safe: true}, function(err, records){
    callback(err, records);
  });
};

DB.getObjID = function(objID){
  logger.log( objID );
  var BSON = mongo.BSONPure
    , ID = (objID) ? new BSON.ObjectID(objID) : new BSON.ObjectID();
  return ID;
}

DB.convertToObjID = function(string){
  var BSON = mongo.BSONPure;
  var newObj = new BSON.ObjectID(string)
  return newObj;
}

module.exports = DB;
