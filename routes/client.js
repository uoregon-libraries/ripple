var AM = require('../lib/account-manager')
  , RoomManager = require('../lib/room-manager.js')
  , util = require('util')
  , logger = require("../lib/log")
  , log = logger.logPair;

exports.index = function(req, res){
  var room = req.params['id'];
  logger.debugPair('Room', room);
  req.session.type = "client";

  // Local variables
  var locals = {};
  plugin.invokeAll("auth.clientUI", locals);
    // Use Layout for Client
  locals.layout = 'layout-client';
  RoomManager.verifyRoom(room, function(err, room) {
    if (!room) {
      return res.render('client/room-error', {title: "Participant"});
    }

    locals.title = 'Room :: ' + room.roomString;
    req.session.room = room.roomString;
    locals.roomNum = room.roomString;
    // If authenication is on check for session information
    log("Params", util.inspect(req.session) );
    if( locals.hasOwnProperty('auth') || locals.auth === 'true'){
      if( req.session.hasOwnProperty('user') ) return res.render('client', locals );
      else return res.render('404', {title: 'ERROR', error: "You must be logged in to access this room."});
    }
    else {
      return res.render('client', locals )
    }
      
  });
};
