var AM = require('../lib/account-manager')
  , SM = require('../lib/set-manager')
  , SSM = require('../lib/session-manager')
  , DB = require('../lib/db-manager')
  , util = require('util')
  , plugin = require('../lib/plugins')
  , async = require('async')
  , logger = require('../lib/log')
  , log = logger.logPair
  , RoomManager = require('../lib/room-manager.js');

// Set Up DB Collections
DB.pluginConfig = DB.init.collection('plugin_config');
DB.variables = DB.init.collection('variables');

// Main Presenter Screen
exports.dashboard = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    SM.sets.find({"authorID":userObj._id}, { limit : 5, sort:{_id:-1} }, function(err, cursor){
      cursor.toArray( function(err, docArray){
        //console.log(util.inspect(docArray));
        if( !err || records ) {
          var locals = convertUserObjToLocals(userObj, req.session);
          locals.title = "Dashboard";
          locals.docArray = docArray;

          res.render('admin/dashboard', locals);
        } 
      });
    });
  });
};

// Sessions Screen
exports.session = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    // Get a room for this presenter
    RoomManager.getPresenterRoom(userObj, function(err, room) {
      // No room available?  Not much can be done but return an error....
      if (err) {
        log("Room error", err);
        return res.render('admin/room-error', {
          title: "Room Error",
          name: userObj.name,
          user: userObj.user
        });
      }
      // If we got here, we were able to get a room, so we can set up the room and render the page
      req.session.room = room.roomString;

      // Create Generic locals
      var locals = convertUserObjToLocals(userObj, req.session);
      locals.userID = userObj._id;
      // Create SessionID
      SSM.createSession(req, function(err){
        if(err){
          sendErrorPage(res, err.message);
          return false;
        }
        // Update Session ID
        qSessionID = req.session.rippleSession.id;
        // Define locals
        locals.title = 'Room :: ' + req.session.room;
        locals.sessionID = qSessionID;
        locals.qSortedArray = [];
        if(req.session.rippleSession.reload) locals.sessionReload = true;
        // Note: qeustion-type-middleware adds locals.questionTypes
        //log("Session questionTypes",util.inspect(res.locals.questionTypes) );

        var setID = ( req.params.setID ) ? req.params.setID : "";
        if( setID ){
          var keysQuestionTypes = new Array();
          // Create Array of Question Type Names
          for(type in res.locals.questionTypes){
            var key = res.locals.questionTypes[type].name
            keysQuestionTypes.push( key );
          };
          
          log("Keys :: ", keysQuestionTypes);
          SM.getSetQuestions(setID, keysQuestionTypes, function(err, qSortedArray){
            if(!err){
              locals.qSortedArray = qSortedArray
              res.render('admin/session', locals);        
            } else sendErrorPage(res, err.message)
          })      ;
        } else {
          res.render('admin/session', locals);      
        }
      }); //End createSession
    }); //End getPresenterRoom
  }); //End userAuth
};

exports.sessionClose = function(req, res){
  SSM.closeSession(req, res, function(){
    console.log(util.inspect(req.query));
    if( req.query.hasOwnProperty('reload') ) res.redirect(req.query.reload);
    else res.render('admin/session-close',{title:'End Session'});
  });
};

// Question Set Start Form
exports.setStart = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    var locals = convertUserObjToLocals(userObj, req.session);
    locals.title = 'Question Set Info';

    res.render('admin/set-start', locals);
  });
};

// Question Set Start Form Submission
exports.setStartPost = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    //Save Set Creation Data to DB & Route
    SM.createSet(req, res, userObj);
  });
};

// Question Set Creation UI
exports.setCreate = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    logger.debugPair('Session', util.inspect( req.session.questionSet ));

    if( req.session.questionSet ) {
      // Get Set Info
      var setID = req.session.questionSet.id
      SM.getSet(setID, function(err, record){
        if( !err || record ) {
          var locals = convertUserObjToLocals(userObj, req.session);
          locals.title = "Question Set: " + record.name;
          locals.record = record;

          res.render('admin/set-create', locals);
        } else if (!record) sendErrorPage(res, 'Unable to find question set:'+setID);
        else sendErrorPage(res, 'Unable to find database:'+err);
      });
    } else res.redirect('/admin/set/start');
  });
};

// Question Set Edit
exports.setEdit = function(req,res){
  AM.userAuth({}, req, res, function(err, userObj){
    var setID = req.params['setID'].split("~")[0];
    req.session.questionSet = ( req.session.questionSet ) ? req.session.questionSet : {};
    req.session.questionSet.id = setID;
    log("Split to ID", setID);
    if( setID ) {
      // Get Set Info
      SM.getSet(setID, function(err, record){
        var session = req.session;
        if( !err && record ) {
          // Check for Permission
          if( !record.authorID ){
            sendErrorPage(res, 'The author of the set can not be verified!');
            return;
          };          
          var isAuthorized = String( record.authorID ) === String( session.user._id );
          if( !isAuthorized ){
            logger.warnPair("SECURITY ISSUE: Invalid access to set!!!", util.inspect(session.user));
            sendErrorPage(res, 'You do not permission to access this set!');
            return;
          };

          log("Record", util.inspect(record) );
          // Define locals
          var locals = convertUserObjToLocals(userObj, req.session);
          locals.title = "Set: " + record.name;
          locals.setName = record.name;
          locals.className = record.class;
          locals.record = record;
          locals.qArray = [];
          // Note: qeustion-type-middleware adds locals.questionTypes

          if( record.question ){
            SM.getQfromSet(record.question, function(err, qArray){
              if( !err || qArray ) {
                SM.sortQuestions(record.question, qArray, null, function(err, sorted) {
                  if(!err){
                    // Get Questions Info                    
                    locals.qArray = sorted;
                    res.render('admin/set-edit', locals);
                  } else sendErrorPage(res, 'System was unable to retrieve and order questions.'+ err);
                });
              } else sendErrorPage(res, 'Currently there is a problem with the system.');
            });
          } else res.render('admin/set-edit', locals);     
        } else if (!record) sendErrorPage(res, 'Currently you have not created a set.');
        else sendErrorPage(res, 'Unable to find database:'+err);
      });
    } else res.redirect('/admin/set/start');
  });
};

// Question Set Start Form Submission
exports.setEditPost = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    // Response is JSON
    res.contentType('json');
    var sessionID = req.session.questionSet.id
      , qSetID = req.body.hasOwnProperty('qSetID') ? req.body.qSetID : ''
      , qID = req.body.hasOwnProperty('qID') ? req.body.qID : '';

    // Check for Post Processes
    switch(req.body.process) {
    case 'new-question':
      SM.createQuestion(req, res, userObj, sessionID, function(err, record){
          if(err) sendJSONError(res, err);
          else res.send('{"success":"1","returnData":"' + record._id + '"}');
      })
      break;
    case 'update-question':
      var updateData = req.body
        , pk = updateData.pk
        , data = {};
      log("[setEditPost] data", util.inspect( updateData ) );
      delete updateData.process;
      delete updateData.pk;
      // Decode Strings
      for ( item in updateData) {
        updateData[item] = decodeURIComponent(updateData[item]);
      };
      if( updateData.name === "qTxt"){
        data[updateData.name] = updateData.value; 
      }else{
        // Convert Question Options to 1D object for mongodb save process
        data["qOptions."+updateData.name] = updateData.value;
      }
      log("[setEditPost] data save", util.inspect( data ) );
      //Post Data
      SM.updateQuestion(pk, data, function(err){
        if( !err ) sendJSONSuccess(res);
        else res.send("Database Error - Unable to update question.", 400);
      });     
      break;
    case 'remove-question':
      SM.removeQuestion(qID, qSetID, function(err, numberRecords){
        if( !err ) sendJSONSuccess(res);
        else sendJSONError(res, "Database Error - Saving Question Update.");        
      });
      break;
    case 'update-order':
      var qOrderArr = req.body.qOrderArr;

      log("qSetID", qSetID);
      log("qOrderArr", qOrderArr);

      SM.updateOrder(qSetID, qOrderArr, function(err){
        if( !err ) sendJSONSuccess(res);
        else sendJSONError(res, "Database Error - Saving Question Update.");        
      });
      break;
    case 'remove-set':
      log("Remove SetID", qSetID);

      if( qSetID ){
        // Get ID
        var setObj = DB.getObjID(qSetID);
        // Remove Document from collection
        if( setObj ) SM.sets.remove({_id:setObj}, function(err){
          if( !err ) sendJSONSuccess(res);
          else sendJSONError(res, "Database Error - " + err);        
        });
      } else sendJSONError(res, "Database Error - Set was not identifies.");
      break;
    case 'update-set':
      var updateData = req.body
        , pk = updateData.pk
        , data = {};
      log("updateData", util.inspect(updateData));
      delete updateData.process;
      delete updateData.pk;

      data[updateData.name] = updateData.value; 

      log("Update Set " + pk, util.inspect(data) );
      SM.updateSet(pk, data, function(err){
        if( !err ) sendJSONSuccess(res);
        else res.send("Database Error - Could not update title.", 400);        
      });
      break;
    default:
      sendJSONError(res, "Process was not identified.");
    }   
    // Save Set Creation Data to DB
    
  });
};

// Question Set Listing
exports.setList = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){

    SM.sets.find({"authorID":userObj._id}, { sort:{_id:-1} }, function(err, cursor){
      cursor.toArray( function(err, docArray){
        //console.log(util.inspect(docArray));

        if( !err || records ) {
          var locals = convertUserObjToLocals(userObj, req.session);
          locals.title = "Set List:";
          locals.docArray = docArray;
          
          res.render('admin/set-list', locals);
        } else sendErrorPage(res, 'Currently you have not created a set.');      

      });
    });
  });
};

/**
 * List of Plugins
 *
 * @dependencies /lib/plugins.js
 */
exports.pluginList = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "plugin"
  };
  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendErrorPage(res, err);
      return;
    }

    // Reinitialize Available Plugins
    plugin.loadDirectory("./");

    logger.debugPair("Plugins", util.inspect(plugin.modules));

    var locals = convertUserObjToLocals(userObj, req.session);
    locals.title = 'Available Plugins'; 
    res.render('admin/plugin-list', locals);      
  });
};

exports.pluginListPost = function(req, res){
  var pluginID = req.body.plugin;
  res.contentType('json');

  // Check to see if plugin is in system
  if( !plugin.modules.hasOwnProperty(pluginID) ){
    sendJSONError(res, "Plugin is not identified.")
    return false;
  }

  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "plugin"
  };

  AM.userAuth(authCheckObj, req, res, function(err, o){
    if(err) {
      sendErrorPage(res, err);
      return;
    }

    var pluginName = plugin.modules[pluginID]['meta']['name']
      , msg = "Plugin: " + pluginName + " has been "
      , reqState = req.body.state;

    // Enable or Disable Plugin
    log("Request Body", util.inspect( req.body ) );
    var pluginState = ( reqState === "1" ) ? "Enabled" : "Disabled";
    msg = msg + pluginState;

    if( reqState === "1" ) {
      plugin.enableModule(pluginID, {}, console.log);
      
      // Let the plugin know about the latest configuration in case it changed while disabled.
      DB.pluginConfig.findOne({name: pluginID}, function(err, document) {
        plugin.invoke(pluginID, "plugin.loadConfig", document);
      });
    }
    else if( reqState === "0") plugin.disableModule(pluginID, {}, console.log);

    // Save State
    DB.pluginConfig.update({name:pluginID},{$set:{status:reqState}},{upsert:true});

    sendJSONSuccessMessage(res, msg)
  });
};

exports.pluginConfig = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "plugin"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendErrorPage(res, err);
      return;
    }

    var pluginName = req.params['pluginName'];
    if( plugin.modules.hasOwnProperty( pluginName ) ) {
      var locals = convertUserObjToLocals(userObj, req.session);
      locals.title = pluginName + " - Configuration Menu";
      locals.pluginName = pluginName;
      
      // Use a temporary object to ensure locals only add inputs, otherwise the menu handler could
      // muck with all locals, potentially leading to hard-to-debug errors
      var menu = {};
      plugin.invoke(pluginName, "plugin.configMenuInputs", menu);
      locals.inputs = menu.inputs;

      DB.pluginConfig.findOne({name: pluginName}, function(err, obj) {
        if(err) {
          sendErrorPage(res, 'Unable to find database');
          return false;
        }
        locals.plugins = {};
        plugin.invoke(pluginName, "plugin.pageLoad", locals, req);
        if( obj == null){
          res.render('admin/pluginMenu', locals);
        } else {
          // log("DB Record", util.inspect(obj) );
          
          // Iterate through inputs
          async.forEach(locals.inputs, function(item, done){
            // log( "forEach Item",util.inspect(item) );
            var iKey = item.key;
            if( obj.hasOwnProperty(iKey) ) item['value'] = obj[iKey];
            done();
          }, function(err){
            // log("locals", util.inspect(locals));
            res.render('admin/pluginMenu', locals);
          });

        }
      });
      
    }else sendErrorPage(res, 'Unable to find plugin');
  });
};

/**
 * Configuration page for plugins
 *
 * @dependencies /lib/plugins.js
 */
exports.pluginConfigPost = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "plugin"
  };

  AM.userAuth(authCheckObj, req, res, function(err, user){
    if(err) {
      sendErrorPage(res, err);
      return;
    }
    
    logger.debugPair("Plugin Name", req.params['pluginName'] );
    logger.debugPair("Request Body", util.inspect(req.body) );
    DB.pluginConfig.findOne({name: req.params['pluginName']}, function(err, obj) {
      var record = req.body;
      res.contentType('json');
      if( obj == null ) {
        logger.debugPair('not found => insert', util.inspect(record));
        record.name = req.params['pluginName'];
        DB.pluginConfig.insert(record, function(err, result){
          pluginSaveCallback(err, record, req, res);
        });
      } else {
        logger.debugPair('found => update', util.inspect(record));
        DB.pluginConfig.update(obj, {$set:record}, function(err, result){
          pluginSaveCallback(err, record, req, res);
        });
      }
    });
  });
};

/**
 * Function that is called after document is inserted or updated
 * @param  String   err    The database err (null if successful)
 * @param  Object   result 
 */
pluginSaveCallback = function(err, record, req, res) {
  if(err) sendErrorPage(res, err);
  else {
    sendJSONSuccessMessage(res, "Configurations Saved");   
    var pluginName = req.params['pluginName'].toLowerCase();
    plugin.invoke(pluginName, "plugin.saveConfig", record);
  }
}


exports.profile = function(req, res) {
  AM.userAuth({}, req, res, function(err, userObj){
    var locals = convertUserObjToLocals(userObj, req.session);
    locals.title = 'Profile';
    locals.udata = req.session.user;
    locals.variables = {};
    DB.variables.findOne({name:'password-change'},function(err,doc){
      if( !err ){
        log("Variable password-change", util.inspect(doc) );
        locals.variables[doc.name] = doc.value;
        res.render('admin/profile', locals);
      } else sendErrorPage(res, err);
    })
    
  });
};

exports.profileUpdate = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    params = req.body;
    if ( params != undefined ) {
      AM.update(userObj, params, function(userObj){
        if (userObj){
          req.session.user = userObj;
          res.send('ok', 200);
        } else{
          res.send('error-updating-account', 400);
        }
      });
    }
  }) ;
};

exports.reportList = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    genReportList(userObj, function(err, userObj, docArray){
      if( !err || records ) {
        log('userObj', util.inspect(userObj, req.session));
        var locals = convertUserObjToLocals(userObj, req.session);
        locals.title = "Session Report List:";
        locals.docArray = docArray;
        log('locals', util.inspect(locals) );
        res.render('admin/report-list', locals);
      } 
      else sendErrorPage(res, 'Currently you do not have any reports to display.');
    });
  });
};

genReportList = function(userObj, fnCallback){
  // Get Sessions
  SSM.dbSession.find({"author":userObj._id}, { sort:{_id:-1} }, function(err, cursor){
    cursor.toArray( function(err, docArray){
      log("docArray", util.inspect(docArray));
      fnCallback(err, userObj, docArray);
    });
  });
};

exports.reportListPost = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    log("reportListPost - Params",util.inspect(req.body) );
    // Remove Session
    SSM.removeSession(req.body.sessionID, function(err){
      if(!err) sendJSONSuccess(res);
      else sendJSON400(res, err);
    });  
  });
};

exports.reportItem = function(req, res){
  // Determine Session ID
  var sessionID = req.params.sessionID;

  // Check authorization to view report
  authCheckObj = {
    element: sessionID,
    type: 'session'
  }
  AM.userAuth(authCheckObj, req, res, function(err, userObj, sessionObj){
    if( !err ) {
      sessionID = DB.convertToObjID(sessionID);
      SSM.dbResponse.find({qSessionID:sessionID}, function(err, cursor){
        if( err ) {
          sendErrorPage(res, err);
          return;
        }
        cursor.toArray( function(err, docArray){
          // if( docArray.length === 0) {
          //   sendErrorPage(res, 'No results were found for that session.');
          //   return;
          // }
          // Find all question data
          //SSM.dbQuestion.find({});
          var locals = convertUserObjToLocals(userObj, req.session);
          locals.title = "Report for " + sessionObj.startTime.toString();
          locals.docArray = docArray;
          locals.sessionObj = sessionObj;
          locals.url = req.url;
          // Add to session store for use with csv
          req.session.report = {};
          req.session.report.sessionObj = sessionObj;
          req.session.report.answers = docArray;
          //log('locals', util.inspect(locals) );
          res.render('admin/report-item', locals);
        });
      })
    }
    else sendErrorPage(res, err);
  });
};

exports.reportItemCSV = function(req, res){
  // Determine Session ID
  var sessionID = req.params.sessionID;
  log("CSV SessionID", sessionID);
  // Check authorization to get CSV
  authCheckObj = {
    element: sessionID,
    type: 'session'
  }
  AM.userAuth(authCheckObj, req, res, function(err, userObj, sessionObj){
    if( typeof req.session.report === 'undefined' ) return;
    var r = req.session.report
      , s = r.sessionObj
      , a = r.answers
      , csv = ""
      , parsedItem = {};
    
    // Create CSV header info
    var sTime = new Date( r.sessionObj.startTime );
    csv += "Report for " + sTime.toDateString() + " " + sTime.toTimeString().substr(0,8) + ",\n";

    // Compile CSV
    var parseQuestions = function(item, callback){
      log("Parse Question", util.inspect(item) );
      log("Parse Answers Obj", util.inspect(parsedItem) );
      qID = item.qID;
      parsedItem[qID] = "";
      // Create Question info
      csv += '\n' + item.type + '\n';
      csv += '"' + String( item.qTxt ) + '"\n';
      log("CSV", csv)
      // Loop through responses
      async.forEach(a, parseAnswers, function(err){
        if(err) {
          log('Error',err);
          var errMsg = 'error-parsing-answers';
          callback(errMsg);
          res.send(errMsg, 400);
        } else {
          csv += parsedItem[qID];
          callback(null);
        }
      })
      
    }

    var parseAnswers = function(item, callback){
      if( item.qID === qID) {
        // create cvs row
        var row = ""
          , time = new Date(item.time);
        row += time.toTimeString().substr(0,8) + ",";
        row += '"' + item.clientName + '",';
        row += '"' + item.answer + '"\n';
        parsedItem[qID] += row;
        log("Answer Row", row);
      }
      callback(null);
    }

    // NOTE: This could be something to change into a stream so it is more async later
    // NOTE: May need to use forEachSeries so that order stays ???
    var reportDate = sTime.toDateString().replace(/ /g,"_")
      , reportTime = sTime.toTimeString().substr(0,5)
      , docName = 'report_'+reportDate+'_'+reportTime+'.csv';
    async.forEach(s.questions, parseQuestions, function(err){
      if( err ) {
        res.send('error-parsing-questions', 400);
        return
      } else {
        res.header('content-type','text/csv'); 
        res.header('content-disposition', 'attachment; filename='+docName);
        res.send(csv, 200);
      }
    })


  });
};

exports.permissions = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "grant"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendErrorPage(res, err);
      return;
    }
    // res.send("Ok", 200); 
    
    // Find all users
    AM.permissions.find({$or: [{category:'route'},{"systemRoles":{$exists:1}}]},function(err,cursor){
      cursor.toArray( function(err, docArray){
        if( docArray.length === 0) {
          sendErrorPage(res, 'No records found.');
          return;
        }
        if( !err || records ) {
          // Determine roles
          var systemRoles = [];
          docArray.sort(compareByKeyName);
          docArray.forEach(function(item, index){
            if( item.hasOwnProperty("systemRoles") ){
              systemRoles = item.systemRoles;
              log("System Roles", systemRoles);
              return;
            }
          });
          var locals = convertUserObjToLocals(userObj, req.session);
          locals.title = "Permissions";
          locals.docArray = docArray;
          locals.systemRoles = systemRoles;
          res.render('admin/permissions', locals);
        }       
      });
    });
  });
}

exports.permissionsPost = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "grant"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendErrorPage(res, err);
      return;
    }
    log('Posted Variables', util.inspect(req.body) );

    var permissionRecord = DB.convertToObjID(req.body.objid)
      , action = false;
    if( req.body.action === 'add' ) action = {$push:{'roles':req.body.role}};
    else if( req.body.action === 'remove' ) action = {$pull:{'roles':req.body.role}};
    log('Action', util.inspect(action) );
    if( !action ) res.send("Action not defined", 200);

    AM.permissions.update({_id:permissionRecord}, action, function(){
      sendJSONSuccessMessage(res, "Account was updated");
    })
  });
}


exports.userSearchPost = function(req, res){
  AM.userAuth({}, req, res, function(err, userObj){
    if( typeof req.body.s === "undefined" ) {
      sendErrorPage("Please define search");
      return;
    }
    res.send(s, 200);
    //AM.accounts.find()
  });

};

exports.people = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "people"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendErrorPage(res, err);
      return;
    }

    // Find User Array
    AM.accounts.find({}, function(err, cursor){
      cursor.toArray( function(err, docArray){
        if( docArray.length === 0) {
          sendErrorPage(res, 'No records found.');
          return;
        }
        // Remove Passwords
        docArray.forEach(function(item){
          if( item.hasOwnProperty("pass") ) {
            delete item.pass;
          }
        })
        if( !err ) {
          // Find System Roles
          AM.permissions.findOne({systemRoles:{$exists:true}}, function(err, record){
            log("User Array", util.inspect(docArray));
            var locals = convertUserObjToLocals(userObj, req.session);
            locals.docArray = docArray;
            locals.title = "People";
            locals.systemRoles = record.systemRoles;
            locals.variables = {};
            locals.variables["password-change"] = "1";
            log(util.inspect(locals) );
            res.render('admin/people', locals);
            return true
          });      
        }else sendErrorPage(err);
      });
    });
  });
};

exports.peoplePost = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "people"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendJSON400(res, err);
      return;
    }

    var params = req.body;
    log("Params", util.inspect(params) );
    // Check for action
    if( typeof params.action === "undefined") 
      sendJSON400(res, "Action is not defined.");

    switch(params.action){
      case "update":
        params = req.body;
        if ( typeof params === "undefined" ) {
          sendJSON400(res, "Parameters are not defined.");
        }
        if ( !params.hasOwnProperty('personID') || params.personID == 0){
          sendJSON400(res, "Person ID is not defined.");
        }
        // Correct format of roles data
        if( params.hasOwnProperty('roles') ) {
          var roles = params.roles
            , data = [];
          rolesArray = roles.split(",");
          rolesArray.forEach(function(role, index){
            data.push(role);
          })
          // Override roles in params
          params.roles = data;    
        }else params.roles = [];

        // Delete excess params
        if( params.hasOwnProperty('action') ) delete params.action;
        var personID = params.personID
        delete params.personID;

        // Update db
        AM.updateUserObj(personID, params, function(err, o){
          if( o ) sendJSONSuccess(res);
          else sendJSON400(res, err);
        });
        break;
      case "remove":
        removeUserAccount(params,function(err,numberDeleted){
          if(err){
            sendJSON400(res, err);
            return;
          } else {
            sendJSONSuccess(res);
          }
        });
        break;
      default:
        sendJSON400(res, "Route not found.");
    }
  });
};

exports.settings = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "settings"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendErrorPage(res, err);
      return;
    }
    displaySettings(req, res, userObj);
  })
}
displaySettings = function(req, res, userObj){
  DB.variables.find({type:"settings"}, function(err,cursor){
    cursor.toArray( function(err, settings){
      if( settings.length === 0) {
        sendErrorPage(res, 'No settings found.');
        return;
      }
      if( !err && settings ) {
        logger.debugPair("Settings",util.inspect(settings));
        var locals = convertUserObjToLocals(userObj, req.session);
        locals.title = "System Settings";
        locals.settings = settings;
        // seperate the settings
        locals.categories = []
        locals.variables = [];
        settings.forEach(function(item,index){
          if( item.category === "category" ) locals.categories.push(item);
          else if( item.category === "item" ) locals.variables.push(item);
        });
        // sort variables
        res.render('admin/settings', locals);
      }
    });
  });
}

exports.settingsPost = function(req, res){
  // Check for plugin permissions
  var authCheckObj = {
    type: "permissions",
    component: "settings"
  };

  AM.userAuth(authCheckObj, req, res, function(err, userObj){
    if(err) {
      sendJSON400(res, err);
      return;
    }
    saveSettings(req, res, userObj);
  })
}
saveSettings = function(req, res, userObj){
  var params = req.body;

  log("Post Params",util.inspect(params) );
  // Check for data
  if( !params ) {
    sendJSON400(res, "No Post Parameters");
    return;
  }
  // Iterator over Params
  // for(key in params ) {
  //   // Convert ID to ObjID
  //   var ObjID = DB.convertToObjID(key);
  //   log("key", ObjID);
  //   // Create Query for each variable
  //   var query = "{_id:"+ObjID+",{$set:{value:"+params[key]+"}}}";
  //   log("query", query);
  //   updateQuery.push(query);
  // }
  async.forEach(
    Object.keys(params),
    function(key,callback){
      log("Param Key",key);
      log("Param Value", params[key]);
      // Convert ID to ObjID
      var ObjID = DB.convertToObjID(key);
      // Create Query for each variable
      DB.variables.update({_id:ObjID}, {$set: {value:params[key]} },callback);
    },
    function(err){
      if( !err) sendJSONSuccessMessage(res, "Settings Saved");
      else sendJSONError(res, err);
    }
  );
  
  
}

// Reusable Functions
removeUserAccount = function(params, callback){
  // Check for User ID
  if( typeof params.personID === "undefined" || params.personID.length === 0) {
    callback("Account ID is not defined");
    return;
  }

  // Remove Account from db
  AM.delete( params.personID, callback );
  
}

convertUserObjToLocals = function(userObj, session){
  var locals = {};
  locals.user = userObj.user;
  locals.name = userObj.name;
  locals.roles = userObj.roles;
  locals.menuRights = session.menuRights;
  locals.layout = 'layout-admin';
  return locals;
}


/** General Functions **/
sendJSON = function (res, data){
  res.contentType('json');
  res.send(data, 200);
}
sendErrorPage = function(res, errMsg){
  res.render('404', {title: 'ERROR', error: errMsg});
}

sendJSONSuccess = function(res){
  sendJSON(res, '{"success":"1"}');
}
sendJSONSuccessMessage = function(res, message){
  var data = '{"success":"1","message":"' + message +'"}';
  sendJSON(res, data);
};

sendJSONError =function(res, message){
  var data = '{"success":"0","message":"' + message +'"}';
  sendJSON(res, data);
};
sendJSON400 = function(res, err){
  res.contentType('json');
  res.send('{"error":"'+err+'"}', 400);
}


function compareByKeyName(a,b) {
  if (a["name"]< b["name"])
     return -1;
  if (a["name"] > b["name"])
    return 1;
  return 0;
}

