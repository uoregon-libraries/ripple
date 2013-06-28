// Allow coverage reporting
var libpath = process.env['PLUGIN_COV'] ? '../lib-cov' : '../lib';

var should = require("should")
  , sinon = require("sinon")
  , SSM = require(libpath + "/session-manager.js")
  , DB = require(libpath + "/db-manager.js")
  , async = require("async");

if (typeof sinon === "object" && typeof sinon.timers === "object") {
  (function(){
    var nextTick = async.nextTick;
    async.nextTick = function(fn) {
      console.log("async.nextTick called");
      if (global.setTimeout === sinon.timers.setTimeout)
        nextTick(fn);
      else
        global.setTimeout(fn, 0);
    };
  })();
}

describe("Session Manager", function() {
  var collections;
  var oldCollections;

  beforeEach(function() {
    // Set up empty collection objects - tests must set up functions / stubs if needed
    collections = {
      session: {},
      response: {}
    }

    // Don't lose old collections and potentially blow up other tests
    oldCollections = {
      session: SSM.dbSession,
      response: SSM.dbResponse
    }

    SSM.dbSession = collections.session;
    SSM.dbResponse = collections.response;
  });

  afterEach(function() {
    SSM.dbSession = oldCollections.session;
    SSM.dbResponse = oldCollections.response;
  });

  describe("#questionSent", function() {
    var saveQuestion;
    var question;

    beforeEach(function() {
      question = {qSessionID: "qsessionid"};
      saveQuestion = sinon.stub(SSM, "saveQuestion");
    });

    afterEach(function() {
      saveQuestion.restore();
    });

    it("should call saveQuestion with the question's session id", function(done) {
      saveQuestion.yields();
      SSM.questionSent(question, function(err, qid, sid) {
        saveQuestion.callCount.should.eql(1);
        saveQuestion.withArgs("qsessionid", question, sinon.match.func).callCount.should.eql(1);
        done();
      });
    });

    it("should call callback with the qID and sessionID yielded by saveQuestion when saveQuestion is successful", function(done) {
      saveQuestion.withArgs("qsessionid", question, sinon.match.func).yields(null, "qid", "sid");
      SSM.questionSent(question, function(qid, sid) {
        qid.should.eql("qid");
        sid.should.eql("sid");
        done();
      });
    });

    it("should call callback with the null when saveQuestion is unsuccessful", function(done) {
      // Even with qid and sid, the presence of an error should keep them out of the callback
      saveQuestion.withArgs("qsessionid", question, sinon.match.func).yields("ERROR", "qid", "sid");
      SSM.questionSent(question, function(qid, sid) {
        should.not.exist(qid);
        should.not.exist(sid);
        done();
      });
    });
  });

  describe("#createSession", function() {
    var req;

    beforeEach(function() {
      req = {session: {}, user: {}};
    });

    describe("(when the request already has a Session ID)", function() {
      it("should call callback with the session's sessionID", function(done) {
          req.session.rippleSession = { id: "foo"}
          SSM.createSession(req, function(err, id) {
          should.not.exist(err);
          req.session.rippleSession.reload.should.eql(true);
          done();
        });
      });
    });

    describe("(when the request has no session data)", function() {
      var insert;

      beforeEach(function() {
        req = {session: {user: {_id: "user id"}}};

        // Make insert into a function so we can stub it
        collections.session.insert = function() {};

        insert = sinon.stub(collections.session, "insert");
      });

      it("should call insert on the session collection with a startTime and the request user as author", function(done) {
        insert.yields(null, [{}]);
        SSM.createSession(req, function(err, id) {
          insert.callCount.should.eql(1);
          var call = insert.getCall(0);
          var session = call.args[0];
          should.exist(session.startTime);
          session.author.should.eql("user id");

          done();
        });
      });

      describe("(when insert throws an error)", function() {
        it("should call callback with insert's error", function(done) {
          insert.yields("error!", [{}]);

          SSM.createSession(req, function(err, id) {
            should.not.exist(id);
            err.should.eql("error!");

            done();
          });
        });
      });

      describe("(when insert succeeds)", function() {
        it("should call callback with the inserted record's id", function(done) {
          insert.yields(null, [{_id: "id"}]);

          SSM.createSession(req, function(err, id) {
            should.not.exist(err);
            req.session.rippleSession.id.should.eql("id");

            done();
          });
        });
      });
    });
  });

  describe("#saveQuestion", function() {
    var sid;
    var question;
    var update;
    var convertToObjID;
    var getObjID;

    beforeEach(function() {
      question = {qSessionID: "qsession id", authorID: "author id", item: "value", item2: "value 2"};

      // Make update into a function so we can stub it
      collections.session.update = function() {};
      update = sinon.stub(collections.session, "update");

      // We don't worry about return from update, so we can set its yield here
      update.yields();

      // Stub DB methods so we have known object id returns
      convertToObjID = sinon.stub(DB, "convertToObjID");
      getObjID = sinon.stub(DB, "getObjID");
      convertToObjID.withArgs("session id").returns("converted session id");
      getObjID.withArgs().returns("new obj id");
    });

    afterEach(function() {
      update.restore();
      convertToObjID.restore();
      getObjID.restore();
    });

    it("should push a question into the questions array for the given session", function(done) {
      SSM.saveQuestion("session id", question, function(err, qid, sid) {
        update.callCount.should.eql(1);
        var call = update.getCall(0);
        call.args[0].should.eql({"_id": "converted session id"});
        call.args[1].should.eql({'$push':{'questions': {item: "value", item2: "value 2", qID: "new obj id"} }});

        done();
      });
    });

    it("should call callback with generated sid and qid", function(done) {
      SSM.saveQuestion("session id", question, function(err, qid, sid) {
        should.not.exist(err);
        qid.should.eql("new obj id");
        sid.should.eql("converted session id");

        done();
      });
    });
  });

  describe("#saveAnswer", function() {
    var sid
      , answer
      , nowQuestion
      , insert
      , convertToObjID
      , questionID
      , sessionID
      , dbSaveID;

    beforeEach(function() {
      answer = "True";
      questionID = "51391905be4b38eb2500000c";
      sessionID = "513918efbe4b38eb25000001";
      dbSaveID = "736574696431326368617273";

      nowQuestion = {qID: questionID, qSessionID: sessionID, authorID: "author id", type:"true-false"};

      // Make insert into a function so we can stub it
      collections.response.insert = function() {};
      insert = sinon.stub(collections.response, "insert");

      insert.yields(null, [{_id:dbSaveID}]);

      // Stub DB methods so we have known object id returns
      convertToObjID = sinon.stub(DB, "convertToObjID");
      convertToObjID.withArgs(questionID).returns("converted qID");
      convertToObjID.withArgs(sessionID).returns("converted sessionID");
    });

    afterEach(function() {
      insert.restore();
      convertToObjID.restore();
    });

    it("should validate parameters", function(done) {
      should.exist( SSM.saveAnswer );
      SSM.saveAnswer().should.be.false;
      SSM.saveAnswer(null, {}).should.be.false;
      SSM.saveAnswer(null, {qID: "", qSessionID: ""}).should.be.false;
      done();
    }); 

    // Having difficulty with sinon understanding async.waterfall because of 
      //  async call to database. For now will comment out test until
      //  can find solution.   
    // it("should return true after save to db", function(){
    //   var asyncResponse = SSM.saveAnswer(answer, nowQuestion, 'client');
    //   asyncResponse.should.be.true
    // })
    
    describe("#insertAnswerDB", function() {
      it("should save to record", function(done){
        should.exist(SSM.insertAnswerDB);
        SSM.insertAnswerDB(answer, nowQuestion, 'client', function(err, recordID, response){
          should.exist(response.time);
          response.answer.should.eql(answer);
          response.qID.should.eql("converted qID");
          response.qSessionID.should.eql("converted sessionID");
          response.clientName.should.eql("client");  
          convertToObjID.callCount.should.eql(2);      
          insert.callCount.should.eql(1);
          recordID.should.eql(dbSaveID);
          done();
        });
      });  
    });

  });

  describe(".VALID", function(){
    var answer;

    it("should validate true false questions", function(){
      should.exist(SSM.VALID.true);
      should.not.exist(SSM.VALID.true("True"));
      should.not.exist(SSM.VALID.true("False"));
      SSM.VALID.true("3").should.equal("True/False can not have the answer - 3");
    });

    it("should validate multiple choice questions", function(){
      should.exist(SSM.VALID.mc);
      should.not.exist(SSM.VALID.mc("a"));
      SSM.VALID.mc("as").should.equal("Multiple Choice can not have the answer - as");
    });

    it("should validate numeric answers", function(){
      should.exist(SSM.VALID.numeric);
      should.not.exist(SSM.VALID.numeric("3"));
      should.not.exist(SSM.VALID.numeric("4.76"));
      SSM.VALID.numeric("a3").should.equal("Answer is not a valid number - a3");
    });    

    it("should validate word cloud questions", function(){
      should.exist(SSM.VALID.singleWord);
      should.not.exist(SSM.VALID.singleWord("red"));
      SSM.VALID.singleWord("red3").should.equal("Answers can only contain letters.");
      SSM.VALID.singleWord("red blue").should.equal("Answers can only have word.");
    });      
  });

});
