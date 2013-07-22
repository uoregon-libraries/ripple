var url = require('url')
	, util = require('util')
	, CONFIG = require('../config.js')
	, GLOBALS = require('./globals')
	, logger = require('./log');

var SMTP = {}
	, noSMTPMessage = "SMTP has not been configured!!!"
	, noSMTP = function(){logger.warn(noSMTPMessage)};
// Conditionally Load CONFIG.SMTP & set defualts
if( CONFIG.SMTP('HOST') ) SMTP.host = CONFIG.SMTP('HOST');
if( CONFIG.SMTP('USER') ) SMTP.user = CONFIG.SMTP('USER') ;
if( CONFIG.SMTP('PASSWORD') ) SMTP.password = CONFIG.SMTP('PASSWORD');
if( CONFIG.SMTP('SSL') ) SMTP.ssl = CONFIG.SMTP('SSL');
if( SMTP.host && SMTP.user ) SMTP.sender = CONFIG.SMTP('SENDER') || 'Ripple';
if( CONFIG.SMTP('PORT') ) SMTP.port = CONFIG.SMTP('PORT');
if( CONFIG.SMTP('DOMAIN') ) SMTP.domain = CONFIG.SMTP('DOMAIN');

// Log Config
if( GLOBALS.helperFn.isEmptyObj( SMTP ) ) noSMTP();
else logger.logPair("SMTP Config", util.inspect(SMTP) );

var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect(SMTP);

EM.send = function(credentials, url, callback){
	if( GLOBALS.helperFn.isEmptyObj( SMTP ) ) {
		noSMTP();
		callback(noSMTPMessage)
		return false;
	}
	EM.server.send({
	   from         : SMTP.sender,
	   to           : credentials.email,
	   subject      : 'Ripple Created Your Account',
	   text         : 'something went wrong... :(',
       attachment   : EM.drawEmail(credentials, url)
	}, callback );
}

EM.drawEmail = function(userObj, url){
	var html = "<html><body>";
		html += "Hi "+userObj.name+",<br><br>";
		html += "We have created you a new account on Ripple. Your username is :: <b>"+userObj.user+"</b><br><br>";
		html += "Cheers,<br>";
		html += "Ripple Administrator";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

EM.sendPassword = function(emailAddress, link, callback){
	if( GLOBALS.helperFn.isEmptyObj( SMTP ) ) {
		noSMTP();
		callback(noSMTPMessage)
		return false;
	}
	EM.server.send({
		from		: SMTP.sender,
		to			: emailAddress,
		subject : 'Ripple Email Password Recovery',
		text		: 'You can reset your password at '+link+'<br><br>IMPORTANT: The link is only good for approximately 5 minutes.<br/><br/>',
		attachment : EM.drawPassword(link)
	}, callback );
};


EM.drawPassword = function(link){
	var html = "<html><body>";
		html += "You have requested access to reset your password.";
		html += "Follow the link: "+link+"<br><br>";
		html += "IMPORTANT: The link is only good for approximately 5 minutes.<br/><br/>"
		html += "Cheers,<br>";
		html += "Ripple Administrator";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}