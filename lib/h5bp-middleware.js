/* h5bp server-configs project
 *
 * maintainer: @xonecas
 * contributors: @niftylettuce
 *
*/
var h5bp    = {},
   _http    = require('http'),
   _parse   = require('url').parse;

module.exports = h5bp;
 
// send the IE=Edge and chrome=1 headers for IE browsers
// on html/htm requests.
h5bp.ieEdgeChromeFrameHeader = function () {
   return function (req, res, next) {
      var url = req.url,
         ua = req.headers['user-agent'];
      if (ua && ua.indexOf('MSIE') > -1) {
         res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
      }
      next();
   };
};

// block access to hidden files and directories.
h5bp.protectDotfiles = function () {
   return function (req, res, next) {
      var error;
      if (/(^|\/)\./.test(req.url)) {
         error = new Error(_http.STATUS_CODES[405]); // 405, not allowed
         error.status = 405;
      }
      next(error);
   };
};

// block access to backup and source files
h5bp.blockBackupFiles = function () {
   return function (req, res, next) {
      var error;
      if (/\.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)|~/.test(req.url)) {
         error = new Error(_http.STATUS_CODES[405]); // 405, not allowed
         error.status = 405;
      }
      next(error);
   };
};

// Do we want to advertise what kind of server we're running?
h5bp.removePoweredBy = function () {
   return function (req, res, next) {
      res.removeHeader('X-Powered-By');
      next();
   };
};