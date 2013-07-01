var path      = require("path")
,   basePath  = __dirname

/**
 * @namespace Contains all constants globally available for use by system
 */
var CONFIG = (function() {
  /**
   * Constants related to SERVER Configuration
   */
  var server = {
      'WWW_PORT': 8080
    , 'SECRET_KEY': 'CHANGEME!'
    , 'DB_PORT':  27017
    , 'DB_HOST': 'localhost'
    , 'DB_NAME': 'ripple'

    // Database authentication requires mongo to be started with a special configuration option -
    // see http://docs.mongodb.org/v2.2/tutorial/control-access-to-mongodb-with-authentication/
    // for details.  If DB_AUTH_NAME and DB_AUTH_PASS are set, the user and password MUST have
    // read+write access to the database specified in DB_NAME.
    // , DB_AUTH_NAME: "ripple"
    // , DB_AUTH_PASS: "PASSWORD"

    // Log level for the logger - in production, this should be "warn" to avoid unnecessary debug
    // Other settings, from least to most verbosity (note that you must use the numeric value):
    // * "emerg"        "emergency"         0
    // * "alert"                            1
    // * "crit"         "critical"          2
    // * "err"          "error"             3
    // * "warn"         "warning"           4
    // * "note"         "notice"            5
    // * "info"                             6
    // * "debug"                            7
    , 'LOG_LEVEL': 4

    // If this is set, most logs will go to the specified file instead of the terminal, and
    // colorized logging will be disabled
    , 'LOG_FILE': path.normalize(basePath + "/ripple.log")

    // If running the app via the upstart script, use this location instead:
    // , 'LOG_FILE': "/var/log/ripple.log"

    // Default to four hours for room expiration
    , "DEFAULT_ROOM_EXPIRATION_HOURS": 4

    // Optional but recommended - if present, runs the server in secure (https) mode
    // Use "make generate-cert" to create a self-signed certificate
    //, 'SSL_PORT': 8443
    //, 'SSL_SILENT_REDIRECT':false
    // If using self-signed cert uncomment below
    //, "SSL_CERTS": {
    //  key: require("fs").readFileSync(path.normalize(basePath + "/custom/key.pem")),
    //  cert: require("fs").readFileSync(path.normalize(basePath + "/custom/cert.pem"))
    //}

    // Highly recommended for production - if present, runs the server in secure (https) mode
    // If using signed cert, replace pathToIntermidateCert, pathToKey, pathToSignedCert
    // with their associated paths to those files
    //, "SSL_CERTS": {
    //  ca: require("fs").readFileSync(pathToIntermidateCert + "/intermedia-cert.crt"),
    //  key: require("fs").readFileSync(pathToKey + "/key.pem"),
    //  cert: require("fs").readFileSync(pathToSignedCert + "/cert.pem")
    //}    
  };

  /**
   * Constants for smtp connection if server is to send emails
   */
  var smtp = {
    // Require to send email
    //  'HOST': "smtp.gmail.com"
    // , 'USER': "username"
    // , 'PASSWORD': "password"
    
    // Optional but recommended
    // , 'SSL': true
    // , 'SENDER': 'Ripple <example@gmail.com>'
    
    // Optional smtp configurations
    //  documentation at https://github.com/eleith/emailjs
    //, 'PORT':
    //, 'DOMAIN':
  }

  /**
   * Constants are ONLY readable through their methods
   * @return Methods of SERVER, & UI to retrieve related constants
   *
   */
  return {
    SERVER: function(name) { return server[name]; },
    SMTP: function(name){ return smtp[name]; }
  };
})();

module.exports = CONFIG;
