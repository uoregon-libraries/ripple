// use moment.js for pretty date-stamping //
var DB = require('./db-manager.js')
  , moment = require('moment')
  , logger = require('./log')
  , log = logger.logPair
  , async = require('async')
  , sanitize = require('validator').sanitize
  , GLOBALS = require('./globals');

var util = require('util');

var SSM = {}; 
SSM.dbSession = DB.init.collection('sessions');
SSM.dbQuestions = DB.init.collection('questions');
SSM.dbResponse = DB.init.collection('responses');

module.exports = SSM;

// Store question
SSM.questionSent = function(question, callback){
	var sessionID = question.qSessionID;
	SSM.saveQuestion(sessionID, question,function (err, qID, sessionID){
		if( !err ) {
			log('[SSM.questionSent] qID', qID);
			log('[SSM.questionSent] sessionID', sessionID);
			callback(qID, sessionID);
		} else {
			logger.errorPair('[SSM.questionSent] Error', err);
			callback(null, null);
		}
	});
}

SSM.createSession = function(req, fnCallback){
  req.session.rippleSession = req.session.rippleSession || {};
	var sessionID = req.session.rippleSession.id;

	// Check to see if session ID is already created
	if( !sessionID ) {
    // Clear out rippleSession Object
    req.session.rippleSession = {};
    
		logger.log("Creating Session ID");
		var session = {}
			, currentTime = new Date();

    // Define Session Data
		session.startTime = currentTime;
    session.author = req.session.user._id;

		
		req.session.question = req.session.question || {};
		// Determine Expire Time
    var expireTime = GLOBALS.helperFn.setSessionExpire(req.session);
    if( expireTime ) {
      req.session.rippleSession.expireTime = expireTime;
      session.expireTime = expireTime;
    }
		
		// Create Session
		SSM.dbSession.insert(session, function(err, record){
			if( !err ) {
				log('Session ID Created', record[0]._id)
				req.session.rippleSession.id = record[0]._id;
				fnCallback(null);
			} else fnCallback(err);
		})		
	} else {
		log('Session ID', sessionID);
    req.session.rippleSession.reload = true;
		fnCallback(null);
	}
}

SSM.saveQuestion = function(sessionID, question, fnCallback){
  var sID = DB.convertToObjID(sessionID);
 	var qID = DB.getObjID();
 	delete question.qSessionID;
 	delete question.authorID;
 	question.qID = qID;
 	log("SSM.saveQuestion Submitted Question Data",util.inspect(question) );
	SSM.dbSession.update({'_id': sID }, {'$push':{'questions':question}}, function(err, record) {
		if(!err) logger.log("Inserted Question Record in " + sessionID);
    fnCallback(err, qID, sID);
  });
}

SSM.saveAnswer = function(answer, nowQuestion, clientName){
	var err;
	log("Now Quesiton", util.inspect(nowQuestion) );
	// Check for need variables
	if( arguments.length === 0 ){
		logger.error("No parameters passed to function saveAnswer");
		return false;
	}
	if( typeof nowQuestion == "undefined"){
		logger.error("Question object is not found");
		return false;
	}
	if( !( nowQuestion.hasOwnProperty('qID') && nowQuestion.qID != '' ) ) {
		logger.error("Question ID is not present");
		return false;
	}
	if( !( nowQuestion.hasOwnProperty('qSessionID') && nowQuestion.qSessionID != '' ) ) {
		logger.error("Session ID is not present");
		return false;
	}

	// Validate and Save
	async.waterfall([
		(SSM.VALID.answer).bind(null, answer, nowQuestion, clientName),
		insertAnswerDB
	], function(err, result){
		if( !err ) {
			log("Response Saved to db", result);
			return true;
		} else {
			log("Error Saving Answer", err);

			return false;
		}
	});
}

SSM.VALID = {};
SSM.VALID.answer = function(answer, nowQuestion, clientName, callback){
	var err = null;
	logger.log("Validating...")

	// Check for valid answers
	switch(nowQuestion.type){
		case 'true-false':
			err = SSM.VALID.true(answer);
			break
		case 'multiple-choice':
			err = SSM.VALID.mc(answer);
			break;		
		case 'slider':
			err = SSM.VALID.numeric(answer);
			break;
		case 'numeric':
			err = SSM.VALID.numeric(answer);
			break;
		case 'cloud':
			err = SSM.VALID.singleWord(answer);
			break;
	}
	if( err ) log("ERROR Validating", err)
	else log("Valid Answer", answer);
	callback(err, answer, nowQuestion, clientName);
}
SSM.VALID.true = function(answer){
	var errMsg = null;
	if( !(answer === "True" || answer === "False" ) ) errMsg = "True/False can not have the answer - " + answer;
	return errMsg;
}
SSM.VALID.mc = function(answer){
	var errMsg = null
	 	, pattern = /^[A-Za-z]{1}$/;
	if( !pattern.test(answer) ) errMsg = "Multiple Choice can not have the answer - " + answer;
	return errMsg;
}
SSM.VALID.numeric = function(answer){
	var errMsg = null;
	if( isNaN( parseFloat(answer) ) || !isFinite( answer ) ) errMsg = "Answer is not a valid number - " + answer;
	return errMsg;
}
SSM.VALID.singleWord = function(answer){
	var errMsg = null
		, patternWord = /[~`!#$%\^&*+=\-\[\]\\';,/{}|:<>\?\d]/
    , patternMultiWord = /^\s*([\w]+\s*){1}$/;

	if( patternWord.test(answer) ) {
		errMsg = "Answers can only contain letters.";
		return errMsg;
	}
  if ( !patternMultiWord.test(answer) ) {
  	errMsg = "Answers can only have word.";
  	return errMsg;
  }
}

insertAnswerDB = function(answer, nowQuestion, clientName, callback){
	// All variables available so create record
	var response = {};
	response.answer = answer;
	response.time = new Date();
	// response.qID = DB.getObjID( nowQuestion.qID );
	// response.qSessionID = DB.getObjID( nowQuestion.qSessionID );
	response.qID = DB.convertToObjID( nowQuestion.qID );
	response.qSessionID = DB.convertToObjID( nowQuestion.qSessionID );
	response.clientName = clientName;

  // Determine Expire Time
  log("insertAnswerDB nowQuestion", util.inspect(nowQuestion) );
  var expireProp = 'expireTime'
  	, hasExpire = nowQuestion.hasOwnProperty(expireProp) && nowQuestion[expireProp] !== "";
  if( hasExpire ) response.expireTime = new Date(nowQuestion[expireProp]);

	// Insert Document
	SSM.dbResponse.insert(response, {safe: true}, function(err, records){
		callback(err, records[0]._id, response);
	});	
}

// Export Private Functions for testing
if (process.env['NODE_ENV'] == 'test') {
  SSM.insertAnswerDB = insertAnswerDB;
}

SSM.removeSession = function(sessionID, callback){
	logger.debug("[SSM.removeSession] Params", util.inspect(arguments) );
	// Check for sessionID
	if( !sessionID ) {
		callback("No Session ID provided");
		return false;
	}
	//Convert ID to Obj
	var sessionIDObject = DB.convertToObjID(sessionID);
	SSM.dbSession.remove({_id:sessionIDObject},{safe:true}, function(err){
		if(!err) SSM.removeSessionAnswersDB(sessionIDObject, callback);
		else callback(err);
	})
};

SSM.removeSessionAnswersDB = function(sessionIDObject, callback){
	logger.debug("[SSM.removeSessionAnswersDB] Params", util.inspect(arguments) );
	// Check for sessionIDObect 
	if( !sessionIDObject ) {
		callback("No Session ObjectID provided");
		return false;
	}
	// Remove responses associated to the sessionID
	SSM.dbResponse.remove({qSessionID:sessionIDObject},{safe:true},callback)
};

SSM.closeSession = function(req, res, callback){
  // Delete GUI Session Information
  log('Session Closed', req.session.rippleSession.id);
  delete req.session.rippleSession.id;

  callback();
};