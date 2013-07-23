var GLOBALS = {}
  , util = require('util')
  , logger = require('./log')
  , log = logger.logPair;

module.exports = GLOBALS;

GLOBALS.routes = {};
GLOBALS.routes.sendErrorPage = function(res, errMsg){
  res.render('404', {title: 'ERROR', error: errMsg});
}; 

GLOBALS.helperFn = {};
GLOBALS.helperFn.isString = function(refString){
  var err = [];
  // Check for existance of param
  if( !refString )
    err.push("GLOBALS.helperFn.isString define parameter");

  var isString = typeof refString === "string"
    , isEmpty = refString === "";

  if( !isString ) 
    err.push("GLOBALS.helperFn.isString parameter must be a string");

  if( isEmpty )
    err.push("GLOBALS.helperFn.isString parameter can not be empty");

  return err.length > 0 ? err : true;
};
GLOBALS.helperFn.isEmptyObj = function (obj) {
  return !Object.keys(obj).length;
};

GLOBALS.helperFn.setSessionExpire = function(session){
  // Check for data
  logger.debugPair("session",util.inspect(session) );
  if(!session) return;

  var hasExpiration = session.hasOwnProperty('system') 
    && session.system.hasOwnProperty('session-expireTime') 
    && parseInt( session.system['session-expireTime'] ) > 0
    , expirationDate = new Date()
    , expiration;

  if( hasExpiration ) {
    logger.debugPair("system", session.hasOwnProperty('system'));
    logger.debugPair("expireTime", session.system.hasOwnProperty('session-expireTime'));
    logger.debugPair("expireTime",parseInt( session.system['session-expireTime'] ));
    var expireTime = parseInt( session.system['session-expireTime'] )
    // Add expiration days
    expiration = expirationDate.setDate( expirationDate.getDate() + expireTime);
    // Convert to ISO Date
    expiration = new Date(expiration);
    log('Session is set to expire at', expiration);
  } 

  return expiration
};
GLOBALS.helperFn.randomAlphaNum = function(length) {
  // http://www.broofa.com/Tools/Math.uuid.js
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    , returnStr = '';

  for (var i = length; i > 0; --i) returnStr += chars[Math.round(Math.random() * (chars.length - 1))];

  logger.debugPair("[GLOBALS.helperFn.randomAlphaNum] UUID Generated", returnStr)
  return returnStr;
};

GLOBALS.helperFn.stripTags = function(source) {
  var tags = /<(?:.|\n)*?>/gm
    , altered;
  if( !source ) return false;

  if (!Array.isArray(source)) {
    altered = source.replace(tags,"");
  } else {
    for(var i in source) {
      altered[i] = source[i].replace(tags,"");
    }
  }
  return altered;
};

GLOBALS.error = {};
GLOBALS.error.callbackAndLog = function(errMsg, errTitle, fnName, callback){
  var consoleMsg = fnName + " " + errMsg
    , uiMsg = errMsg + " " + fnName;
  if( errTitle ) logger.errorPair(errTitle, consoleMsg);
  else logger.error(consoleMsg);
  // Send Callback
  if( callback ) callback(uiMsg);
}