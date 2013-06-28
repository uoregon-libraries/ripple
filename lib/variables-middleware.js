var VAR    = {}
  , DB = require('./db-manager.js')
  , variablesDB = DB.init.collection('variables')
  , util = require('util')
  , logger = require('./log')
  , log = logger.logPair;

module.exports = VAR;
 
VAR.load = function(req, res, next) {
  logger.debugPair("systemVariables.load middleware","Loading System Variables");
  // Query for Questions Types
  variablesDB.find({$and:[{type:'settings'},{category:'item'}]}, function(err, cursor){
    cursor.toArray( function(err, docs){
    	// Create Variables Object
    	var variablesObj = {};
			docs.forEach(function(item){
				variablesObj[item.name] = item.value;
			});
      res.locals.system = req.session.system = variablesObj
      next(err);
    });
  });
};




