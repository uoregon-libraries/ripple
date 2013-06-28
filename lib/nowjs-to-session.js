var logger = require('./log')
  , util = require('util')
  , nowjs = require('now')
  , CONFIG = require('./config-loader.js');

var sessionAPI = {};
exports = module.exports = sessionAPI;

/**
 * Given a nowjs object, pulls cookie information to get at the session id, which is then looked
 * up to get at the actual underlying session object
 *
 * TODO: Long-term, this manual parsing of sid is a bad idea and probably should be replaced by
 * subclassing whatever session store we end up choosing, adding a method to properly convert
 * the connect.sid cookie into a session id.  This approach will likely break on updates to
 * connect / express, and isn't very secure in comparison (doesn't validate signed cookies).
 */
sessionAPI.getSession = function(nowInstance, sessionStore, callback) {
  var cookie = nowInstance.user.cookie;
  if (!cookie) {
    callback({name: "MissingCookie", message: "Unable to find cookie in getSession()"}, null);
    return;
  }

  var sid = cookie['connect.sid'];
  if (!sid) {
    callback({name: "MissingSID", message: "Unable to read connect.sid in getSession()"}, null);
    return;
  }

  sid = decodeURIComponent(sid);
  sid = sid.replace(/^s:/, "")
  sid = sid.replace(/\..*$/, "")

  sessionStore.get( sid, callback );
};
