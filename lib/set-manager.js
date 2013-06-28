var DB = require('./db-manager.js')
  , mongo = require('mongodb')
  , moment = require('moment')
  , async = require('async')
  , logger = require('./log')
  , log = logger.logPair;

var util = require('util');

var SM = {};

SM.sets = DB.init.collection('sets');
SM.questions = DB.init.collection('questions');

// Create Routing
SM.createSet = function(req, res, o){
  // Put Post Params into the session
  log("Params", util.inspect(req.body) );

  // Define data in set initially
  var data = {
    name: req.body.name,
    class: req.body.class,
    authorID: o._id
  };

  // Create Record
  DB.insertRec(SM.sets, data, function(err, records){
    if (err) {
      res.send(err, 400);
      return;
    }

    log("Record", util.inspect(records) );
    req.session.questionSet = {
      id: records[0]._id
    };
    res.redirect('admin/set/edit/'+records[0]._id+'~'+records[0].name);
  });
};

SM.getSetQuestions = function(setID, filter, callback){
  log("Set ID", setID);
  // Get Set Info
  SM.getSet(setID, function(err, record){
    if (err) {
      return callback({name: "DatabaseError", title: 'Error 404', message: 'Unable to find database:'+err});
    }
    if (!record) {
      return callback({name: "NoRecord", title: 'No Sets Found', message: 'Currently you have not created a set.'});
    }
    if (!record.question) {
      return callback(null, []);
    }

    log("Record", util.inspect(record) );

    SM.getQfromSet(record.question, function(err, qArray){
      if (err || !qArray) {
        return callback({name: "MissingQuestions", title: 'No Questions Found', message: 'Currently there is a problem with the system.'});
      }

      SM.sortQuestions(record.question, qArray, filter, callback);
    });
  });
};

SM.getSet = function(recID, callback){
  // Get Record
  log("Set ID",recID);
  var BSON = mongo.BSONPure;
  var o_ID = new BSON.ObjectID(recID);
  SM.sets.findOne({_id:o_ID}, function(err, record){
    log('Found Set', record);
    callback(err, record);
  });
};

SM.getQfromSet = function(qNumArray, callback){
  log("Question Number Array", qNumArray);
  //Query for Questions
  SM.questions.find({ _id:{ $in:qNumArray } }, function(err, cursor){
    if (!cursor) {
      return callback(err);
    }

    cursor.toArray( function(err, docArray){
      log("Question Records", util.inspect( docArray ));
      callback(err, docArray);
    });
  });
};

// Sorts an array of questions by the order of the question ids in the set
SM.sortQuestions = function(questionIDs, questions, filter, callback) {
  var qSortedArray = [];

  // Create a string array of question IDs
  var stringIDs = [];
  for (var i = 0; i < questionIDs.length; i++) {
    stringIDs.push(String(questionIDs[i]));
  }

  // Iterate over questions, and if their ID is in questionIDs, put them into the sorted array at
  // the same position they're found in questionIDs
  for (var i = 0; i < questions.length; i++) {
    var idx = stringIDs.indexOf(String(questions[i]._id));
    if (idx != -1) {
      if( filter ){
        if( filter.indexOf( questions[i].type ) !== -1) qSortedArray[idx] = questions[i];
      } else qSortedArray[idx] = questions[i];
    }
  }
  // Remove any empty array values for question types that are no longer valid
  for(var i = 0; i < qSortedArray.length; i++){
    if(typeof qSortedArray[i] === 'undefined') qSortedArray.splice(i,1);
  }
  log("qSortedArray",qSortedArray);
  callback(null, qSortedArray);
};

SM.createQuestion = function(req, res, o, dbObjID, callback){
  // Put Post Params into the session
  log("Params", util.inspect(req.body) );

  // Convert DB Object ID
  var BSON = mongo.BSONPure;
  var o_ID = new BSON.ObjectID(dbObjID);

  // Create Document
  var data = {
    type: req.body.qType,
    authorID: o._id,
    setID: o_ID
  }

  //Create Document
  DB.insertRec(SM.questions, data, function(err, records){
    SM.sets.update({_id: o_ID}, {$push: {question:records[0]._id} }, function(err,results){});
    callback(err, records[0]);
  });
};

SM.updateQuestion = function(qID, updateData, callback){
  // Convert DB Object ID
  var BSON = mongo.BSONPure;
  var o_ID = new BSON.ObjectID(qID);

  SM.questions.update({ _id:o_ID }, { $set: updateData}, {safe:true}, function(err, updated){
    if( err || !updated ) {
      log("ERROR",err);
    }
    else log("Updated Question Options");
    callback(err);
  });
};

SM.removeQuestion = function(qID, qSetID, callback){
  log("Question ID", qID);
  log("Set ID", qSetID);
  var o_ID = DB.getObjID(qID);

  //Remove Question
  SM.questions.remove({_id: o_ID}, {safe:true}, function(err){
    if (err) {
      return callback(err);
    }

    var so_ID = DB.getObjID(qSetID);
    log("Set ID", so_ID);
    SM.sets.update({_id: so_ID}, {$pull: {question:o_ID} }, function(err){
      callback(err);
    });
  });
};

SM.updateSet = function(setID, updateData, callback){
  if(!setID){
    logger.error('[SM.updateSet] Set ID not found');
    callback('Set ID could not be identified.')
  }
  // Convert DB Object ID
  var o_ID = DB.convertToObjID(setID);

  // Update Record
  log("Update Set ", util.inspect(updateData) );
  if( !updateData ) callback("No data available to processes.")

  SM.sets.update({ _id:o_ID }, { $set: updateData}, {safe:true}, function(err, updated){
    if( err || !updated ) {
      log("ERROR",err);
    }
    else log("Updated Question Options");
    callback(err);
  });
};

SM.updateOrder = function(qSetID, qOrderArr, callback) {
  // Turn IDs into ObjectIDs
  var so_ID = DB.getObjID(qSetID);
  var qOrderObjArr =  [];
  for (var i = qOrderArr.length - 1; i >= 0; i--) {
    qOrderObjArr[i] = DB.getObjID( qOrderArr[i] );
  };
  log("qOrderObjArr", qOrderObjArr);

  // Set Order in DB
  SM.sets.update({_id: so_ID}, {$set: { question: qOrderObjArr } }, function(err){
    log("Order Updated");
    callback(err);
  });
};


module.exports = SM;
