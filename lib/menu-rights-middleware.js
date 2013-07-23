var util = require('util')
  , logger = require('./log')
	, log = logger.logPair
	, DB = require('./db-manager.js')
	, AM = require('./account-manager')
	, async = require('async');

module.exports = function(req, res, next){
	// Check for session.user.roles
	if( req.session.hasOwnProperty('user') ) logger.debugPair("User", util.inspect(req.session.user));
	else {
		next();
		return;
	}
	var session = req.session;
	logger.debugPair("[menu-rights-middleware] Session Info", util.inspect(session) ); 
	logger.debugPair("[menu-rights-middleware] sessionStore", util.inspect(req.sessionID) );
	// Check to see if session has changed
	// NOTE: Currently could not get session to clear req.session array when 
	//       the browser closed so it made the menuRights persistent between 
	//       different users. 
	//       Currently system is more responsive but at the cost of an additional 
	//       query per url request.
	// if( session.hasOwnProperty('menuRights') ) {
	// 	log("Menu Rights", session.menuRights);
	// 	next();
	// 	return;
	// } 
	session.menuRights = [];


	logger.debug("Determining Menu Rights Object");
	// Find menu rights
	AM.permissions.find({menu:'restricted'}, function(err, cursor){
    if( cursor ){
      cursor.toArray( function(err, docArray){
        async.forEach(docArray, 
        	(parseRoles).bind(null, session), 
        	function(err){
        		if(err) log("Error", err);
        });
      });
    }

    next();
  });

};

var parseRoles = function(session, item, callback){
  var addRole = false;
	async.forEach(item.roles,
		(function(session, specificRole, callback){
      // General Rule for all accounts
      if( specificRole === 'presenter') addRole = true;
      else if ( contains(session.user.roles, specificRole) ) addRole = true;

      if( addRole === true ) {
        logger.debugPair("Found matching right",item.name);
        session.menuRights.push(item.name);        
      }
			callback();
		}).bind(null, session),
		function(err){
			if(err) {
				logger.errorPair("[parseRoles] Error", err);
				callback(err);
			}
		}
	);
};

/**** General Function ********/
var contains = function(obj, key) {
	if(typeof obj !== 'object') return false;
    var i = obj.length;
    while (i--) {
       if (obj[i] === key) {
           return true;
       }
    }
    return false;
}