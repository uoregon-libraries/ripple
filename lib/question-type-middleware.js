var qType    = {}
  , DB = require('./db-manager.js')
  , qTypesDB = DB.init.collection('question_types')
  , util = require('util')
  , logger = require('./log')
  , log = logger.logPair;

module.exports = qType;
 
qType.load = function(req, res, next) {
  log("qType.load middleware","Loading Question Types");
  // Query for Questions Types
  qTypesDB.find({}, function(err, cursor){
    cursor.toArray( function(err, docArray){
      logger.debug("Question Type Records", util.inspect( docArray ));
      res.locals.questionTypes = docArray;
      next(err);
    });
  });
};
