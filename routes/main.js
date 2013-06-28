var AM = require('../lib/account-manager')
  , EM = require('../lib/email-dispatcher')
  , DB = require('../lib/db-manager')
  , GR = require('../lib/globals.js').routes
  , logger = require("../lib/log")
  , log = logger.logPair
  , plugin = require('../lib/plugins')
  , RoomManager = require('../lib/room-manager')
  , util = require('util');

/*
 * GET site index page.
 * @dependencies /lib/Account-Manager.js
 */
exports.index = function(req, res){
  // check if the user's credentials are saved in session //
  if (req.session.user == undefined || req.session.pass == undefined){
    var locals = {};
    plugin.invokeAll("auth.clientUI", locals);
    locals.title = 'Ripple';
    locals.audienceTitle = 'Audience';
    logger.log("Show Login");
    // Get alternative audience title
    var variables = DB.init.collection('variables');
    var variableItems = ['audience-name','password-recovery','password-change','allow-registration', 'system-alert'];
    variables.find({"name":{$in:variableItems}}, {name: 1, value: 1}, function(err, cursor){
      cursor.toArray( function(err, docArray){
        if(!err) {
          log('Variables', util.inspect(docArray) );
          locals.variables = {};
          docArray.forEach(function(item,index){
            // Pass system variable into locals for ejs 
            locals.variables[item.name] = item.value;
          })
          
          res.render('index', locals);
        } 
      });
    });
  } else {
    console.log('login Page', req.session.user);
    // attempt automatic login //
    AM.autoLogin(req.session.user, req.session.pass, function(o){
      if (o != null){
        console.log("Show Prof Page");
        req.session.user = o;
        res.redirect('/admin');
      } else{
        console.log("Show Login");
        res.render('index',{ title: 'Hello - Please Login To Your Account'});
      }
    });
  }
};

/**
 * Routes Admin Logins or Room Requests
 * @dependencies /lib/Account-Manager.js
 */
exports.indexPost = function(req, res){
  log("Params", util.inspect(req.param("login-type")));
  if (req.param("login-type") == "client") {
    clientLogin(req, res);
  }
  else if (req.param("login-type") == "presenter") {
    presenterLogin(req, res);
  }
  else if (req.param("login-type") == "password-recovery") {
    AM.passwordRecovery(req, function(err){
      if(err) res.send(String(err), 400);
      else res.send("Ok", 200);
    });
  }
};
 
function clientLogin(req, res) {
  var room = req.param("room-num");
  RoomManager.verifyRoom(room, function(err, room) {
    if (!room) {
      return res.send('{"status": "bad-room"}', 200);
    }
 
    // If nothing handles clientAuth, we just let user in
    if (plugin.handlers("auth.clientAuth").length == 0) {
      req.session.user = {};
      return res.send('{"status": "ok"}', 200);
    }
    
    // Otherwise, fire off whatever handler exists for auth
    var authData = {user: req.param("client"), password: req.param("client-pass")};
    plugin.invokeAll("auth.clientAuth", authData, function(err, userResponse) {
      // If an error is explicitly returned, that means the plugin couldn't authenticate for some
      // reason, and we have to deny access to the user since we currently don't have a local auth
      // system for clients.
      if (err) {
        return res.send('{"status": "bad-login"}', 200);
      }
    
      // Make sure there's no way the plugin can accidentally authenticate somebody as a presenter.
      // Only store name and username (login) in the session.
      req.session.user = {user: userResponse.user, name: userResponse.name};
      res.send('{"status": "ok"}', 200);
    });
  });
}
 
function presenterLogin(req, res) {
  logger.logPair("indexPost login", req.body.user);
  if (req.body.email != null){
    AM.getEmail(req.body.email, function(o){
      if (o){
        res.send('ok', 200);
        logger.logPair("Req Headers", util.inspect(req.headers) );
        EM.send(o, req.headers.origin, function(e, m){ console.log('error : '+e, 'msg : '+m)}); 
      } else{
        res.send('email-not-found', 400);
      }
    });
  } else{
  // attempt manual login //
    AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
      if (!o){
        res.send(e, 400);
      } else{
          req.session.user = o;
        if (req.param('remember-me') == 'true'){
          res.cookie('presenter.username', req.body.user, { maxAge: 14400 });
        }     
        res.send(o, 200);
      }
    });
  }
}; 

/**
 * Sign Up - Display Account Form
 */
exports.signup = function(req, res){
  logger.logPair("locals",util.inspect(req.b) );
  var locals ={};
  var variables = DB.init.collection('variables');
  var variableItems = ['audience-name','password-recovery','allow-registration']
  variables.find({"name":{$in:variableItems}}, {name: 1, value: 1}, function(err, cursor){
    cursor.toArray( function(err, docArray){
      if(!err) {
        log('Variables', util.inspect(docArray) );
        locals.variables = {};
        docArray.forEach(function(item,index){
          // Pass system variable into locals for ejs 
          locals.variables[item.name] = item.value;
        })
        // Determine if allowed to register
        var cantRegister = !locals.variables['allow-registration'] || locals.variables['allow-registration'] === '0';
        if( cantRegister ){
          sendErrorPage(res, "Registration is disabled by the system.");
          return;
        }

        locals.variables['password-change'] = "1";
        locals.title = 'Create an Account';
        res.render('signup', locals);
      } else {
        sendErrorPage(res, err);
        return;
      }
    });
  });
};

/**
 * Password reset
 */

exports.resetPwd = function(req, res) {
  var guid = req.params.guid
  AM.validateLink(guid, function(err, doc){
    log("doc", doc)
    if ( err ){
      sendErrorPage(res, err);
    } else if (!doc) {
      sendErrorPage(res, "This link is no longer available");
    } else {
      log("Link is valid");
      res.render('reset',{
          title : 'Reset Password'
        }
      );
    }
  })
};
  
exports.resetPwdPost = function(req, res) {
  AM.setPassword(req.params.guid, req.body.pass, function(err, userObj){
    if (!err) 
      res.send('ok', 200);
    else
      res.send('unable to update password', 400);
  })
};

/**
 * Creation of Account on Post of Signup
 * @dependencies /lib/Account-Manager.js
 * @return [code 200 if completed & code 400 if failed]
 */
exports.signupPost = function(req, res){
  var post = req.body;
  log("Post Data", util.inspect(post) );
  var data = {
    name  : post.name,
    email : post.email,
    user  : post.user,
    pass  : post.pass,
    roles : []
  };
  // Correct format of roles data
  if( post.hasOwnProperty('roles') ) {
    log("Roles", post.roles);
    var roles = post.roles
      , pos = roles.indexOf(",");

    // Check for comma in roles
    if( pos === -1 ) data.roles.push(roles);
    else {
      rolesArray = roles.split(",");
      rolesArray.forEach(function(role, index){
        data.roles.push(role);
      })  
    }
    
  }
  log("Data Sent to db", util.inspect(data) );
  AM.signup(data, function(err, o){
    if(err){
      if( post.hasOwnProperty('redirect') || post.redirect == 'false' ) 
        res.json('{"success":"0","message":"' + err +'"}')
      else GR.sendErrorPage(res, err);
    }

    if( post.hasOwnProperty('redirect') || post.redirect == 'false' ) res.json({'status':'success'})
    else signUpAutoLogin(err, req, res, o, post);
  });
};

function signUpAutoLogin(err, req, res, o, post){
  if(err){
    res.send(e, 400);
    return;
  }
  var userObj = o[0];
  log("User Object", util.inspect(userObj) );
  if (err){
    res.send(e, 400);
  } else {
    log("Username", userObj.user)
    log("User Pass", post.pass)
    // Login w/ username and password
    AM.manualLogin(userObj.user, post.pass, function(err){
      if( !err ) {
        req.session.user = userObj;
        res.contentType('json');
        res.send('{"status":"success"}', 200);          
      }else res.send(err, 400);
    });        
  }
}

/**
 * Logout of User
 */
exports.logoutPost =  function(req, res){
  AM.logout(req, res, function(err){ 
    if(!err) res.send('ok', 200);
    else res.send(err, 400); 
  });
};

exports.logout = function(req, res){
  AM.logout(req, res, function(err){ 
    if(!err) res.render('logout',{title:'Logout'});
    else GR.sendErrorPage(res, 'Could Not Destroy Session :: ' + err);
  });
};

