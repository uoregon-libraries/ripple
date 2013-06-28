/**
 * "static" class for managing all room registration and assignment
 */

var DB = require('./db-manager.js').init
  , Server = require('mongodb').Server
  , CONFIG = require('./config-loader.js')
  , moment = require('moment')
  , logger = require('./log')
  , util = require('util')

var RM = {}
var rooms = RM.rooms = DB.collection('rooms');

/**
 * Creates random string for use in rooms
 *
 * @return {string} random alphanumeric
 */
RM.randomizer = function() {
  var chars = "123456789abcdefghiklmnpqrstuvwxyz";
  // Determine Room String length
  var string_length = 6;
  var randomstring = '';

  // Create Random Room String
  for (var i=0; i<string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum,rnum+1);
  }
  return randomstring;
}

/**
 * Finds or creates a room for the given user (presenter)
 */
RM.getPresenterRoom = function(user, callback) {
  // Set up an internal method for recursively trying to requisition a room until a valid, unique
  // room string is found.  This is somewhat confusing, but we can't do a more typical "while"
  // statement because the condition (does room exist?) and the requisition call (create row in
  // database) are both asynchronous.  Even the async library's helper expects to at least have a
  // synchronous condition function.
  var requisitionRoom = function(roomObj, callback) {
    roomObj.roomString = RM.randomizer();
    RM.verifyRoom(roomObj.roomString, function(err, existingRoom) {
      // If we had a room, recursively call requisitionRoom again, hoping for the best....
      if (existingRoom) {
        return requisitionRoom(roomObj, callback);
      }

      // No room - create it and call the callback

      // This is stupid, but insert actually calls insertAll, which sends an array of objects to
      // the callback.  If we don't handle the callback manually, the API is inconsistent.
      rooms.insert(roomObj, function(err, docs) {
        var room = Array.isArray(docs) ? docs[0] : docs;
        return callback(null, room);
      });
    });
  };

  // Does this user already have a room registered?
  rooms.findOne({presenterID: user._id}, function(err, room) {
    // The mongo library doesn't return errors - it raises exceptions.  Therefore if we got here,
    // there was no error - just a room or no room.
    if (room) {
      return callback(null, room);
    }

    // No room just means we need to requisition a new, unique room.
    var newRoom = {}
    newRoom.presenterID = user._id
    newRoom.startTime = moment().toDate();
    newRoom.expireTime = moment().add("hours", CONFIG.SERVER("DEFAULT_ROOM_EXPIRATION_HOURS")).toDate();

    logger.debug("Requesting new room: " + util.inspect(newRoom));

    return requisitionRoom(newRoom, callback);
  });
}

/**
 * Verifies the existence of the given room string
 */
RM.verifyRoom = function(roomString, callback) {
  // Make sure the room is valid
  rooms.findOne({roomString: roomString}, function(err, room) {
    // No room?  Let user know and return.
    if (!room) {
      return callback("no-room", null);
    }

    return callback(null, room);
  });
};

exports = module.exports = RM;
