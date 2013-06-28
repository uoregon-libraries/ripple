/**
 * This file contains all the helper classes used with the caterpillar logging module
 */

var fs = require("fs")
  , caterpillar = require("caterpillar")
  , cliColor = caterpillar.cliColor
  , moment = require("moment");

// A lot of this work is copied from caterpillar's code, which is coffeescript and generates a lot
// of very special code that I am relying on
var __hasProp = {}.hasOwnProperty;
var __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

/**
 * Caterpillar transport class for file-based logs.  A filename must be set up prior to use, and
 * all logging writes to that file.  The file will be created if it doesn't already exist.
 */
FileTransport = (function(_super) {
  __extends(FileTransport, _super);

  function FileTransport() {
    var val = FileTransport.__super__.constructor.apply(this, arguments);
    this.formatter = new FileFormatter;
    return val;
  }

  /**
   * Sets up the log file name
   */
  FileTransport.prototype.setFilename = function(name) {
    this.filename = name;
  };

  /**
   * Writes to the log file only the most basic information.  This is extremely inflexible compared
   * to building the appropriate formatter infrastructure, but it works for now.
   */
  FileTransport.prototype.write = function(levelCode, levelName, message) {
    message = FileTransport.__super__.write.call(this, levelCode, levelName, message);
    if (message) {
      fs.appendFile(this.filename, message + "\n");
    }
  };

  return FileTransport;

})(caterpillar.Transport);

/**
 * Special no-colors-allowed version of the console formatter for use when writing to a file
 */
FileFormatter = (function(_super) {
  __extends(FileFormatter, _super);

  function FileFormatter() {
    return FileFormatter.__super__.constructor.apply(this, arguments);
  }

  FileFormatter.prototype.format = function(levelCode, levelName, args) {
    var _ref = this.details(levelCode, levelName, args)
      , levelName = _ref.levelName
      , message = _ref.message;

    if (!message) {
      return message;
    }

    // Format message with datestamp, level, and message text
    var now = moment().format("YYYY-MM-DD HH:mm:ss ZZ");
    var messageString = "[" + now + "] " + levelName.toUpperCase() + " - " + message;
    return messageString;
  };

  return FileFormatter;
})(caterpillar.Formatter);

/**
 * Copied and slightly modified console formatter - basically this is just Caterpillar's internal
 * class without the extra line of file info.  Since we centralize all logging, that file info is
 * always exactly the same.
 *
 * @todo: Look into storing a stack trace rather than file info?
 */
ConsoleFormatter = (function(_super) {
  __extends(ConsoleFormatter, _super);

  function ConsoleFormatter() {
    return ConsoleFormatter.__super__.constructor.apply(this, arguments);
  }

  ConsoleFormatter.prototype.format = function(levelCode, levelName, args) {
    var _ref = this.details(levelCode, levelName, args)
      , color = _ref.color
      , levelName = _ref.levelName
      , message = _ref.message;

    if (!message) {
      return message;
    }

    color = color && (cliColor != null ? cliColor[color] : void 0) || function(str) {
      return str;
    };

    levelName = color(levelName + ':');
    var messageFormatter = color && (cliColor != null ? cliColor.bold : void 0);
    var messageString = "" + levelName + " " + message;

    if (messageFormatter) {
      messageString = messageFormatter(messageString);
    }

    return messageString;
  };

  return ConsoleFormatter;
})(caterpillar.Formatter);

exports = module.exports = {
    FileTransport: FileTransport
  , ConsoleFormatter: ConsoleFormatter
}
