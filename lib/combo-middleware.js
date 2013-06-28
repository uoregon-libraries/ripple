var combo = require('combohandler');

var CM = {}
module.exports = CM;

CM.error = function (err, req, res, next) {
  if (err instanceof combo.BadRequest) {
    console.log("ERROR: Combohandler " + err)
    res.charset = 'utf-8';
    res.type('text/plain');
    res.send(400, 'Bad request.');
  } else {
    next();
  }
};
