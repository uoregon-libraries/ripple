var combo = require('combohandler')
  , logger = require('./log');

var CM = {}
module.exports = CM;

CM.error = function (err, req, res, next) {
  if (err instanceof combo.BadRequest) {
    logger.warnPair("Combohandler", err);
    res.send('/* WARNING: Error combining scripts or Can not request truncated files with cache buster. */');
  } else {
    next(err);
  }
};
