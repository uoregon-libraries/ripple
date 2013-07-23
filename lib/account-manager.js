var bcrypt = require('bcrypt')
  , DB = require('./db-manager.js')
  , EM = require('./email-dispatcher.js')
  , GLOBALS = require('./globals')
  , logger = require('./log')
  , log = logger.logPair
  , plugin = require('./plugins')
  , log = logger.logPair;

var util = require('util');

var AM = {}; 
AM.accounts = DB.init.collection('accounts');
AM.permissions = DB.init.collection('permissions');
AM.passReset = DB.init.collection('password_reset');

module.exports = AM;

// Subsequent Page logins 
AM.autoLogin = function(user, pass, callback){
  AM.accounts.findOne({user:user}, function(err, o) {
    if (o){
      o.pass == pass ? callback(o) : callback(null);
    } else{
      callback(null);
    }
  });
}

// If the given data is null or a blank string, calls callback with err and returns false,
// otherwise returns true.  Meant to be used synchronously - callback use is strictly to help
// the calling function return more easily.
//
// TODO: This belongs in a more generalized module
AM.isBlank = function(data, err, callback) {
  if (data === null || data === "") {
    callback(err);
    return true;
  }

  return false;
};

// Finds a user in the database with the given username.  We do this instead of just calling
// findOne because findOne doesn't give us any error feedback.
AM.findUserByName = function(username, callback) {
  AM.accounts.findOne({user:username}, function(err, user) {
    if (user === null) {
      callback('user-not-found');
    } else {
      callback(null, user)
    }
  });
}

// Validates the given password is valid for the given user
AM.validatePassword = function(password, user, callback) {
  bcrypt.compare(password, user.pass, function(err, res) {
    if (res) {
      callback(null, user);
    } else {
      callback('invalid-password');
    }
  });
}

// Initial Login that generates the session
AM.manualLogin = function(user, pass, callback) {
  var authData = {user: user, password: pass};

  // If no plugins handle authentication, just skip to local auth
  if (plugin.handlers("auth.presenterAuth").length == 0) {
    return AM.localAuth(authData, callback);
  }

  // TODO: Consider finding a way to invoke plugin handlers in some sort of cascading way such
  // that we send the message to handlers, and the first one that handles it stops the rest (and
  // stops our default handler).  If we don't do something like that, we'll never be able to allow
  // multiple auth types (LDAP or Facebook or local, for instance)
  /**
   * Whenever the account manager's "manualLogin" method is called, this is fired off with a single
   * object and a callback as parameters:
   * * An object containing "user" and "password" values for authentication.
   * * A callback which takes an error and a response object.  The error should be null if the
   *   authentication didn't have any critical errors.  The response object should be null to
   *   allow standard authentication to happen, or else be a user object with the following data:
   *     * "user": User id
   *     * "email": User's email address
   *     * "name": User's full name
   *     * "password": Password as stored in the database (generally hashed for real local accounts)
   *
   * Right now authentication happens in multiple places, and only the main sign-in has a handler
   * option.  The session verification still hits the local database.  This means overriding
   * authenticate also requires inserting a dummy record into the database.
   * 
   * @event presenterAuth
   * @for plugin-server.auth
   * @async
   * @param {object} authInfo 
   * @param {function} callback function(err, userObj){} 
   * if userObj is returned then external authenication was successful 
   */  
  plugin.invokeAll("auth.presenterAuth", authData, function(err, userResponse) {
    // If a user was returned, skip normal authentication
    if (userResponse) {
      return callback(null, userResponse);
    }

    // No user came from auth plugin, so continue with local user authentication
    return AM.localAuth(authData, callback);
  });
}

// Validates local account and local account rules.  App should call manualLogin unless we
// absolutely do not want plugins to check authentication.
AM.localAuth = function(authData, callback) {
  if (AM.isBlank(authData.user, "define-user", callback)) { return; }
  if (AM.isBlank(authData.password, "define-password", callback)) { return; }

  AM.findUserByName(authData.user, function(err, user) {
    if (err) {
      callback(err);
    }
    else {
      AM.validatePassword(authData.password, user, callback);
    }
  });
}

// record insertion, update & deletion methods //
AM.signup = function(newData, callback) {
  AM.accounts.findOne({user:newData.user}, function(e, o) { 
    if (o){
      log("[AM.signup] User Signup", util.inspect(o) );
      callback('username-taken');
    } else{
      // External accounts get special treatment:
      // * We don't salt or hash the password to keep local auth from hitting this account
      // * We don't check for duped email addresses since there's currently no easy way to just
      //   "link" the local account with external accounts, and we don't do email validation to
      //   ensure a user actually has the email they claim to have.
      if (newData.external) {
        return AM.accounts.insert(newData, callback(null));
      }

      AM.accounts.findOne({email:newData.email}, function(e, o) {
        if (o){
          callback('email-taken');
        } else{
          AM.saltAndHash(newData.pass, function(hash){
            newData.pass = hash;
            AM.accounts.insert(newData, {safe: true}, callback);
          });
        }
      });
    }
  });
}

AM.update = function(o, newData, callback) {   
  o.name    = newData.name;
  o.email   = newData.email;
  logger.debugPair("[AM.update] User Previous Info", util.inspect(o) );
  log("[AM.update] Update User Info", util.inspect(newData) );
  if (newData.pass == ''){
    AM.accounts.save(o); callback(o);
  } else if ( !newData.hasOwnProperty("pass") ){
    AM.accounts.update({_id:o._id},{$set:newData}); callback(o);
  } else{
    AM.saltAndHash(newData.pass, function(hash){
      o.pass = hash;
      AM.accounts.save(o); callback(o);     
    });
  }
}

AM.updateUserObj = function(userID, userInfoObj, callback){  
  var userObjID = DB.convertToObjID(userID); 
  if (userInfoObj.pass === '' || !userInfoObj.hasOwnProperty('pass') ){
    // Remove password parameter
    delete userInfoObj.pass;

    AM.accounts.update({_id: userObjID}, {$set:userInfoObj}, {safe:true}, function(err, o){
      callback(err, o);
    }); 
  } else{
    AM.saltAndHash(userInfoObj.pass, function(hash){
      userInfoObj.pass = hash;
      AM.accounts.update({_id: userObjID}, userInfoObj, {safe:true}, function(err, o){
        callback(err, o);
      });     
    });
  }
};

AM.saltAndHash = function(pass, callback) {
  bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(pass, salt, function(err, hash) {
      callback(hash);
      });
  });
}

AM.delete = function(id, callback) {
  AM.accounts.remove({_id: this.getObjectId(id)}, callback);
}

// auxiliary methods //

AM.getEmail = function(email, callback) {
  AM.accounts.findOne({email:email}, function(e, o){ callback(o); });
}

AM.getObjectId = function(id) {
// this is necessary for id lookups, just passing the id fails for some reason // 
  return AM.accounts.db.bson_serializer.ObjectID.createFromHexString(id)
}

AM.getAllRecords = function(callback) {
  AM.accounts.find().toArray(
      function(e, res) {
    if (e) callback(e)
    else callback(null, res)
  });
};

AM.delAllRecords = function(id, callback) {
  AM.accounts.remove(); // reset accounts collection for testing //
}

// just for testing - these are not actually being used //

AM.findById = function(id, callback) {
  AM.accounts.findOne({_id: this.getObjectId(id)}, 
    function(e, res) {
    if (e) callback(e)
    else callback(null, res)
  });
};


AM.findByMultipleFields = function(a, callback) {
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
  AM.accounts.find( { $or : a } ).toArray(
      function(e, results) {
    if (e) callback(e)
    else callback(null, results)
  });
}

AM.passwordRecovery = function(req, callback){
  var emailAddress = req.body.email;
  log("Password Recovery requested for",emailAddress);
  // Query for email
  AM.accounts.findOne({email:emailAddress}, function(err, doc){
    if(err) {
      logger.errorPair("[AM.passwordRecovery] DB",err);
      callback(err);
    } else if( !isEmptyObj(doc) ) {
      logger.debugPair('Found Email sending password link for ', emailAddress);
      // Generate Account File for One-time access
      generatePasswordResetDB(doc, function(err, resetObj){
        if( !err ) {
          // Create link
          var link = req.headers.referer + "reset-password/"+resetObj.linkID;
          logger.debugPair('Password Email sent to ' + emailAddress, link);
          // Send One-time password link
          EM.sendPassword(emailAddress, link, function(err){
            if(err) logger.errorPair("[AM.passwordRecovery] Password Email was not sent", err);
            callback(err);
          });          
        } else {
          callback(err);
        }
      })

    } else {
      logger.warnPair('[AM.passwordRecovery] User not found', emailAddress);
      callback("[404] Email not found");
    }
  })
};

var generatePasswordResetDB = function(userObj, callback){
  var fnName = "[AM>generatePasswordResetDB]";
  logger.debugPair(fnName + " User ID", userObj._id );
  // Check for userObj
  if( !userObj ) {
    GLOBALS.error.callbackAndLog("Can not identify User", null, fnName, callback)    
    callback(errMsg + fnName);
    return false;
  }
  // Generate UUID
  var linkString = GLOBALS.helperFn.randomAlphaNum(25);
  // Check for Random String
  if( !linkString ) {
    GLOBALS.error.callbackAndLog("Link ID was not generated", null, fnName, callback)
    return false;
  }
  // Generate Expire Time for 5 minutes
  var time = new Date();
  expire = new Date( time.getTime() + 5*60000);
  // Check for Random String
  if( !expire ) {
    GLOBALS.error.callbackAndLog("Expiration time could not be generated", null, fnName, callback)    
    return false;
  }

  var resetDoc = {
    resetID:userObj._id,
    linkID: linkString,
    expireTime: expire
  }
  logger.debugPair("[AM>generatePasswordResetDB] Password Reset Access", util.inspect(resetDoc));
  // Save Record in DB
  AM.passReset.insert(resetDoc,{safe:true}, function(err){
    callback(err, resetDoc)
  });
  
};

AM.validateLink = function(guid, callback) {
  // Generate Expire Time for 5 minutes
  var time = new Date();
  expire = new Date( time.getTime() + 5*60000);
  // Update Expiration Time
  AM.passReset.findAndModify({linkID:guid}, [], {$set:{expireTime:expire}}, {}, function(err, doc){
    callback(err, doc);
  });
}

AM.setPassword = function(guid, newpass, callback) {
  var fnName = "AM.setPassword"
  logger.warnPair("[AM.setPassword] GUID - " + guid, newpass);
  // Verify GUID
  if(!guid){
    GLOBALS.error.callbackAndLog("Can not determine reset ID", null, fnName, callback);
    return false;    
  }
  // Verify new password
  if(!newpass){
    GLOBALS.error.callbackAndLog("Can not determine new password", null, fnName, callback);
    return false;    
  }
  // Find Reset Doc Object
  AM.passReset.findOne({linkID:guid}, function(err, resetObj){
    // Hash Password
    AM.saltAndHash(newpass, function(hash){
      // Update User Password
      AM.accounts.update({_id:resetObj.resetID}, {$set:{pass:hash}}, {safe:true}, function(err, cnt){
        // Remove reset doc
        if(!err) AM.passReset.remove({linkID:guid});
        callback(err, cnt);
      }); 
    });
  }); 
}

AM.routeAuthUser = function(o, req, res, callback){
  if (o != null){
    req.session.user = o;
    req.session.type = "presenter";

    logger.debugPair("[AM.routeAuthUser] " + o.user, req.url);
    // AM.renderAuthRoute(route, pageData, res);
    callback();
  } else{
    logger.debug("[AM.routeAuthUser] No user object found redirecting to login");
    res.redirect('/');
  } 
}

AM.userAuth = function(authObj, req, res, callback){
  if (req.session.user == null){
    // if user is not logged-in redirect back to login page //
    res.redirect('/');
  }  else {
    var session = req.session.user;
    AM.autoLogin(session.user, session.pass, function(userObj){
      logger.debugPair("AM.userAuth Object", util.inspect(userObj) );
      if( userObj != null ){
        if( isEmptyObj(authObj) ) {
          AM.routeAuthUser(userObj, req, res, function(){
            callback(null, userObj);
          });  
        } else {
          // Authorization Object needs to be checked
          logger.debugPair("[AM.userAuth] Checking Permissions", util.inspect(authObj) );
          AM.authCheck(authObj, userObj, req, res, callback);        
        }
      } else {
        logger.errorPair("AM.userAuth Error", "No User Object found");
        res.redirect('/');
        //callback("No User Object found [AM.userAuth]");
      }
    }); 
  }
}
AM.authCheck = function(authObj, userObj, req, res, callback){
  logger.debugPair("[AM.authCheck] check on", authObj.type);
  switch (authObj.type) {
    case 'session':
      authCheckSession(authObj, userObj, req, res, callback);
      break;
    case 'permissions':
      authCheckPermissions(authObj, userObj, req, res, callback);
      break;
  }
}
authCheckSession = function(authObj, userObj, req, res, callback){
  // Make sure that there is are needed properties
  if( typeof authObj !== 'object') callback('ERROR :: authCheckSession not object.');
  if( !userObj.hasOwnProperty('_id') || userObj._id === '') callback('ERROR :: authCheckSession no user defined.');
  if( !authObj.hasOwnProperty('element') || authObj.element === '') callback('ERROR :: authCheckSession no user defined.');

  // Query db for rights
  logger.debugPair('[authCheckSession] element', authObj.element);
  // Convert string to objectID
  elemID = DB.convertToObjID(authObj.element);
  DB.init.collection('sessions').findOne({'_id':elemID}, function(err, record){
    if( !err ) {
      if(!record){
        callback("ERROR: No record returned in authCheckSession");
      }
      logger.debugPair('[authCheckSession] Records', util.inspect(record));
      logger.debugPair('[authCheckSession] User', userObj._id );
      logger.debugPair('[authCheckSession] Author', record.author );
      if( record.author.toString() === userObj._id.toString() ) callback(null, userObj, record);
      else callback("ERROR: authCheckSession user does not have rights for content.");
    }
    else callback(err);
  })
}

authCheckPermissions = function(authObj, userObj, req, res, callback){
  logger.debugPair("[AM-authCheckPermissions] Permission Object to verify",util.inspect(authObj) );
  var permission = false;

  // Look up role permission
  AM.permissions.findOne({name:authObj.component}, function(err, record){
    if( err ) {
      callback(err);
      return;
    }
    if( !record ){
      callback("No permission found for component");
      return;
    }

    // Compare role to role permissions   
    logger.debugPair("AuthCheckPermissions Record", util.inspect(record));
    var roles = record.roles;

    if( typeof roles === "undefined") {
      callback("Component's roles not defined.");
      return;
    }
    roles.forEach(function(item, index){ 
      // Exit loop if found role match
      if( permission ) return;
      else if( item === 'presenter'){
        permission = true;
        // Log Permission
        logger.debugPair('Permission Status for ' + item, permission);
        return
      } else if( typeof userObj.roles !== 'undefined'){
        userObj.roles.forEach(function(authRole){
          // Exit loop if found role match
          if( permission ) return;
          if( item === 'presenter' || item == authRole ) {
            // Role Found
            permission = true;
          }       
        });        
      }
      // Log Permission
      logger.debugPair('Permission Status for ' + item, permission);
    })
     
    if( permission ) {
      AM.routeAuthUser(userObj, req, res, function(){
        callback(null, userObj);
      });
    }
    else callback('You do not have permission to access component: ' + authObj.component);
  })

};

AM.logout = function(req, res, callback){
    res.clearCookie('connect.sid');
    req.session.destroy( callback );  
}


isEmptyObj = function(obj) {
   for(var key in obj) {
      if (obj.hasOwnProperty(key)) return false;
   }
   return true;
};
