/**
 * Module dependencies.
 */
var DB = require('../lib/db-manager')
  , util = require('util')
  , logger = require('./log');

// Load plugin system and set up core plugins
plugin = require("plugin-manager");
plugin.validateHookNames = true;
plugin.validHookNames = [
  // Question / answer interception
  "question.distribute", "answer.distribute",

  // Plugin configuration
  //Send an array of local plugin js/css files on page load of the plugin.
  "plugin.pageLoad",

  // Sent a single empty object which is expected to have an array of inputs as follows:
  //
  //     menu.inputs = [{}, {}, ...]
  //
  // Each input is an object which must have a key, label, placeholder text, and a default value
  "plugin.configMenuInputs",

  // Sends the configuration object to the plugin when the app starts and when settings are updated
  "plugin.loadConfig",
  "plugin.saveConfig",

  // Whenever the account manager's "manualLogin" method is called, this is fired off with a single
  // object and a callback as parameters:
  //
  // * An object containing "user" and "password" values for authentication.
  // * A callback which takes an error and a response object.  The error should be null if the
  //   authentication didn't have any critical errors.  The response object should be null to
  //   allow standard authentication to happen, or else be a user object with the following data:
  //   * "user": User id
  //   * "email": User's email address
  //   * "name": User's full name
  //   * "password": Password as stored in the database (generally hashed for real local accounts)
  //
  // If two plugins handle this event, I have no idea what will happen.  Don't do that.
  //
  // Right now authentication happens in multiple places, and only the main sign-in has a handler
  // option.  The session verification still hits the local database.  This means overriding
  // authenticate also requires inserting a dummy record into the database.
  "auth.presenterAuth",

  // Allows interception of the client login (viewers of a presentation).  Passed in a hash with
  // no data.  Currently allows setting only a "auth" object to true, which tells the client side
  // to show a user and password.  It is expected the plugin will then handle clientAuth (below).
  "auth.clientUI",

  // If you override clientUI to present user login, this hook will be used to get the
  // authentication and handle it.  This behaves very similarly to the presenterAuth hook, but as
  // there is no local auth for clients, not returning a user object becomes a fatal error which
  // is interpreted as a failed login.  The response object may contain a "user" attribute and a
  // "name" attribute.
  "auth.clientAuth",
];

// Error handlers for plugin system - pass things through our custom logger
plugin.api.logger = logger;

// API access to libraries
var QTM = require("./question-type-manager");
plugin.api.questionType = {
  exists: QTM.exists,
  create: QTM.create,
  remove: QTM.remove,
}

// Validate directory read loads modules once
logger.log("Reading custom plugins directory");

plugin.loadDirectory("./");

// Load all modules we found in the plugins directory
for (moduleName in plugin.modules) {
  logger.log("Loaded plugin " + moduleName);
}

// Find Modules that should be on
DB.init.collection('plugin_config').find({status:"1"}).toArray(function(err, documents){
  for(item in documents){
    var name = documents[item].name;
    logger.logPair("Enable onload plugin", name);
    plugin.enableModule(name);
    plugin.invoke(name, "plugin.loadConfig", documents[item]);
  }
});

module.exports = plugin;
