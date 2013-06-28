var caterpillar = require("caterpillar")
  , CONFIG = require('./config-loader.js')
  , logger = new caterpillar.Logger()
  , logHelpers = require('./log-helpers')
  , color = caterpillar.cliColor;

// In all cases, we want console output
var transport = new caterpillar.ConsoleTransport;

// Use the modified console formatter to avoid not-so-useful debug output
var formatter = new logHelpers.ConsoleFormatter;
transport.formatter = formatter;
logger.transports = [transport];

// If a file is requested in const.js, use a custom transport class and a custom output formatter
if (CONFIG.SERVER("LOG_FILE")) {
  var transport = new logHelpers.FileTransport;
  transport.setFilename(CONFIG.SERVER("LOG_FILE"));
  logger.transports.push(transport);
}

// Set log level based on user-defined constant - if the constant isn't present, set to debug to
// ensure all messages are seen until the user specifically changes their config
var logLevel = CONFIG.SERVER("LOG_LEVEL");
if (!logLevel) {
  logLevel = 7;
}
logger.setLevel(logLevel);

Logger = {};

// Generates a function object for logging the given message at the given level
var makeLogger = function(level) {
  return function(message) {
    logger.log(level, message);
  }
}

// Generates a function object for logging key-value pairs in color
var makePairLogger = function(level) {
  return function(key, val) {
    // If using a file, avoid colors
    if (CONFIG.SERVER("LOG_FILE")) {
      logger.log(level, key + " :: " + val);
      return
    }

    logger.log(level, color.bold(key) + " :: " + color.cyan(val));
  }
}

// Build dynamic logging functions based on log level names
var _ref = logger.config.levels;
var __hasProp = {}.hasOwnProperty;
for (name in _ref) {
  if (!__hasProp.call(_ref, name)) continue;

  // Get the numeric code for the level
  var code = _ref[name];

  // Default method is Logger.log, not Logger.default
  if (name == "default") { name = "log" }

  Logger[name] = makeLogger(code);
  Logger[name + "Pair"] = makePairLogger(code);
}

exports = module.exports = Logger;
