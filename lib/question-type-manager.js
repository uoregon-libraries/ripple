var GLOBALS = require('./globals.js')
  , DB = require('./db-manager.js')
  , util = require('util')
  , logger = require('./log')
  , log = logger.logPair;

var QTM = {}; 
QTM.qTypes = DB.init.collection('question_types');

module.exports = QTM;

/**
 * @method exists
 * @for plugin-server.questionType
 * @param {object} questionType The question type object
 * @param {function} callback Callback function
 */
QTM.exists = function(qTypeName, callback){
  // Check for name as string
  var passCheck = GLOBALS.helperFn.isString(qTypeName);
  if(  passCheck !== true ){
    callback(passCheck);
    return false;
  }

  QTM.qTypes.findOne({name:qTypeName}, function(err, qTypeDoc) {
    if( err ){
      callback(err);
      return false;
    }
    if (qTypeDoc) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  });
};

/**
 * @method create
 * @for plugin-server.questionType
 * @param {object} questionType The question type object
 * @param {function} callback Callback function
 */
QTM.create = function(qTypeObj, callback){
  var required = ["js", "title", "name"]
    , optional = ["shortTitle", "icon", "iconTxt"]
    , docObj = {};
  if(!qTypeObj || GLOBALS.helperFn.isEmptyObj(qTypeObj) ) {
    callback("Define Question Type Object");
    return false;
  }
  // Check for required properties of qTypeObj
  var err = [];
  for (var i = required.length - 1; i >= 0; i--) {
    var property = required[i]
      , added = _addToObj(qTypeObj, docObj, property);
    if( added !== true) err = err.concat(added);
  };
  if( err.length > 0 ){
    callback(err);
    return false;
  }   

  // Add in optional properties
  for(var i = optional.length - 1; i >= 0; i--){
    var property = optional[i]
      , added = _addToObj(qTypeObj, docObj, property);
  }  

  log("[QTM.create] Create question type question w/ object", util.inspect(docObj));
  // Save new docObj to db
  QTM.qTypes.save(docObj, function(err, saved){
    if( err || !saved ) callback(err);
    else callback(null, saved);
  });
}

var _objCheckPropertyString = function(obj, property){
  var err = []
    , hasProperty = obj.hasOwnProperty(property) 
    , isString = GLOBALS.helperFn.isString(property);

  if( !hasProperty ) 
    err.push("Property " + property + " is not in QTM.create object.");
  if( isString !== true ) 
    err.push( isString );

  return err.length > 0 ? err : true;
};

var _addToObj = function(refObj, docObj, property){
  var passCheck = _objCheckPropertyString(refObj, property);
  if( passCheck === true ) {
    docObj[property] = refObj[property];
    return true;
  } else return passCheck;
}

/**
 * @method remove
 * @for plugin-server.questionType
 * @param {object} questionType The question type object
 * @param {function} callback Callback function
 */
QTM.remove = function(qTypeName, callback){
  // Check for name as string
  var passCheck = GLOBALS.helperFn.isString(qTypeName);
  if(  passCheck !== true ){
    callback(passCheck);
    return false;
  }

  QTM.qTypes.remove({name:qTypeName}, function(err, removed){
    if( err || !removed ) callback(err);
    else callback(null, removed);
  })
}
