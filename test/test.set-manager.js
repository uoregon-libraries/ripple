// Allow coverage reporting
var libpath = process.env['PLUGIN_COV'] ? '../lib-cov' : '../lib';

var should = require("should")
  , sinon = require("sinon")
  , SM = require(libpath + "/set-manager.js")
  , DB = require(libpath + "/db-manager.js")

describe("Set Manager", function() {
  var collections;
  var oldCollections;

  beforeEach(function() {
    // Set up empty collection objects - tests must set up functions / stubs if needed
    collections = {
      sets: {},
      questions: {}
    }

    // Don't lose old collections and potentially blow up other tests
    oldCollections = {
      sets: SM.sets,
      questions: SM.questions
    }

    SM.sets = collections.sets;
    SM.questions = collections.questions;
  });

  afterEach(function() {
    SM.sets = oldCollections.sets;
    SM.questions = oldCollections.questions;
  });

  describe("#createSet", function() {
    var req, res, o, insertRec, records;

    beforeEach(function() {
      req = {
        body: { name: "set name", class: "Foo 101" },
        session: {}
      };
      res = { redirect: function() {}, send: function() {} };
      o = {_id: "user id"};
      records = [ { _id: "set-id", name: "set name" } ];

      insertRec = sinon.stub(DB, "insertRec");
    });

    afterEach(function() {
      insertRec.restore();
    });

    it("should call insertRec with form data", function() {
      SM.createSet(req, res, o);
      insertRec.withArgs(SM.sets, {name: "set name", class: "Foo 101", authorID: "user id"}, sinon.match.func).callCount.should.eql(1);
    });

    describe("(when insertRec succeeds)", function() {
      beforeEach(function() {
        insertRec.yields(null, records);
      });

      it("should set the questionSet session data", function() {
        SM.createSet(req, res, o);
        req.session.questionSet.should.eql({id: "set-id"});
      });

      it("should redirect to the set's edit page", function() {
        var redirect = sinon.stub(res, "redirect");
        SM.createSet(req, res, o);
        redirect.callCount.should.eql(1);
        redirect.withArgs("admin/set/edit/set-id~set name").callCount.should.eql(1);
      });
    });

    describe("(when insertRec has errors)", function() {
      var err;

      beforeEach(function() {
        err = {name: "Error"};
        insertRec.yields(err);
      });

      it("should send an error", function() {
        var send = sinon.stub(res, "send");
        SM.createSet(req, res, o);
        send.callCount.should.eql(1);
        send.withArgs(err, 400).callCount.should.eql(1);
      });
    });
  });

  describe("#getSetQuestions", function() {
    var getSet, getQfromSet, sortQuestions, setRecord, setQuestions;

    beforeEach(function() {
      getSet = sinon.stub(SM, "getSet");
      getQfromSet= sinon.stub(SM, "getQfromSet");
      sortQuestions= sinon.stub(SM, "sortQuestions");

      setRecord = { _id: "set-id", question: [1,2,3] };
      setQuestions = [{_id: 1}, {_id: 2}, {_id: 3}];
    });

    afterEach(function() {
      getSet.restore();
      getQfromSet.restore();
      sortQuestions.restore();
    });

    it("should call getSet with the given setID", function(done) {
      // Hack in an error just to get through the function quickly - only looking to verify
      // function call here
      getSet.yields("err");
      SM.getSetQuestions("set-id", null, function(err, questions) {
        getSet.withArgs("set-id", sinon.match.func).callCount.should.eql(1);
        done();
      });
    });

    describe("(when getSet has an error)", function() {
      it("should call callback with an error object and no data", function(done) {
        getSet.yields("fake error message");
        SM.getSetQuestions("set-id", null, function(err, questions) {
          should.exist(err);
          err.name.should.eql("DatabaseError");
          done();
        });
      });
    });

    describe("(when no record is found)", function() {
      it("should call callback with an error object and no data", function(done) {
        getSet.yields(null, null);
        SM.getSetQuestions("set-id", null, function(err, questions) {
          should.exist(err);
          err.name.should.eql("NoRecord");
          done();
        });
      });
    });

    describe("(when a record is found)", function() {
      beforeEach(function() {
        getSet.yields(null, setRecord);
      });

      describe("(when the record has no questions)", function() {
        beforeEach(function() {
          setRecord.question = null;
        });

        it("should call callback with an empty array of questions", function(done) {
          SM.getSetQuestions("set-id", null, function(err, questions) {
            should.not.exist(err);
            questions.should.eql([]);
            done();
          });
        });
      });

      describe("(when the record has questions)", function() {
        it("should call SM.getQfromSet with the record's questions", function(done) {
          // As above, hack in an error to simplify testing the call
          getQfromSet.yields("error");

          SM.getSetQuestions("set-id", null, function(err, questions) {
            getQfromSet.withArgs(setRecord.question, sinon.match.func).callCount.should.eql(1);
            done();
          });
        });

        describe("(when SM.getQfromSet has an error)", function() {
          beforeEach(function() {
            getQfromSet.yields("error");
          });

          it("should call callback with an error", function(done) {
            SM.getSetQuestions("set-id", null, function(err, questions) {
              should.exist(err);
              err.name.should.eql("MissingQuestions");
              done();
            });
          });
        });

        describe("(when SM.getQfromSet finds no data)", function() {
          beforeEach(function() {
            getQfromSet.yields();
          });

          it("should call callback with an error", function(done) {
            SM.getSetQuestions("set-id", null, function(err, questions) {
              should.exist(err);
              err.name.should.eql("MissingQuestions");
              done();
            });
          });
        });

        describe("(when SM.getQfromSet finds questions)", function() {
          beforeEach(function() {
            getQfromSet.yields(null, setQuestions);
            sortQuestions.yields();
          });

          it("should dispatch callback to sortQuestions", function(done) {
            SM.getSetQuestions("set-id", null, function(err, questions) {
              sortQuestions.withArgs(setRecord.question, setQuestions, null, sinon.match.func).callCount.should.eql(1);
              done();
            });
          });
        });
      });
    });
  });

  describe("#getSet", function() {
    var findOne;

    beforeEach(function() {
      SM.sets.findOne = function() {};
      findOne = sinon.stub(SM.sets, "findOne");
    });

    afterEach(function() {
      findOne.restore();
    });

    it("should call findOne with the given record ID converted to an object id", function(done) {
      findOne.yields();
      SM.getSet("some id xyzz", function(err, record) {
        findOne.callCount.should.eql(1);
        var args = findOne.getCall(0).args;
        args[0].should.eql({ _id: DB.getObjID("some id xyzz") })
        done();
      });
    });

    it("should dispatch errors to callback", function(done) {
      findOne.yields("error");
      SM.getSet("some id xyzz", function(err, record) {
        err.should.eql("error");
        should.not.exist(record);
        done();
      });
    });

    it("should dispatch success to callback", function(done) {
      findOne.yields(null, "record");
      SM.getSet("some id xyzz", function(err, record) {
        should.not.exist(err);
        record.should.eql("record");
        done();
      });
    });
  });

  describe("#getQfromSet", function() {
    var find, qNumArray, cursor, toArray;

    beforeEach(function() {
      SM.questions.find = function() {};
      find = sinon.stub(SM.questions, "find");

      qNumArray = [1, 2, 3];
      cursor = {toArray: function() {}};
      toArray = sinon.stub(cursor, "toArray");
    });

    afterEach(function() {
      find.restore();
      toArray.restore();
    });

    it("should look for all questions with an id in the array passed in", function(done) {
      find.yields();
      SM.getQfromSet(qNumArray, function(err, records) {
        find.callCount.should.eql(1);
        var args = find.getCall(0).args;
        args[0].should.eql({_id: {$in: qNumArray}});
        done();
      });
    });

    describe("(when there is no cursor)", function() {
      it("should call callback with error", function(done) {
        find.yields("error");
        SM.getQfromSet(qNumArray, function(err, records) {
          err.should.eql("error");
          should.not.exist(records);
          done();
        });
      });

      it("should call callback with null if no error occurred", function(done) {
        find.yields();
        SM.getQfromSet(qNumArray, function(err, records) {
          should.not.exist(err);
          should.not.exist(records);
          done();
        });
      });
    });

    describe("(when there is a cursor)", function() {
      beforeEach(function() {
        find.yields(null, cursor);
      });

      it("should call cursor.toArray", function(done) {
        toArray.yields();
        SM.getQfromSet(qNumArray, function(err, records) {
          toArray.callCount.should.eql(1);
          done();
        });
      });

      it("should call callback with cursor.toArray results", function(done) {
        toArray.yields(1, "two");
        SM.getQfromSet(qNumArray, function(err, records) {
          err.should.eql(1);
          records.should.eql("two");
          done();
        });
      });
    });
  });

  describe("#sortQuestions", function() {
    var objects, ids;

    beforeEach(function() {
      objects = [
        {_id: 1, name: "one"},
        {_id: 2, name: "two"},
        {_id: 3, name: "three"},
        {_id: 4, name: "four"},
        {_id: 5, name: "five"},
        {_id: 6, name: "six"},
        {_id: 7, name: "seven"}
      ];

      ids = [1, 5, 2, 7, 4];
    });

    describe("(when successful)", function() {
      it("should call callback with the sorted array of objects", function(done) {
        SM.sortQuestions(ids, objects, null, function(err, sorted) {
          should.not.exist(err);

          // This is verbose, but more easy to debug sort issues
          sorted[0]._id.should.eql(1);
          sorted[0].name.should.eql("one");
          sorted[1]._id.should.eql(5);
          sorted[1].name.should.eql("five");
          sorted[2]._id.should.eql(2);
          sorted[2].name.should.eql("two");
          sorted[3]._id.should.eql(7);
          sorted[3].name.should.eql("seven");
          sorted[4]._id.should.eql(4);
          sorted[4].name.should.eql("four");

          sorted.length.should.eql(ids.length);
          done();
        });
      });
    });
  });

  describe("#createQuestion", function() {
    var insertRec, user, setUpdate, req, res, user, setID, insertRecords;

    beforeEach(function() {
      insertRec = sinon.stub(DB, "insertRec");
      SM.sets.update = function() {};
      setUpdate = sinon.stub(SM.sets, "update");

      // Parameters for the call to createQuestion
      req = {body: {qType: "qtype"}};
      res = {};
      user = {_id: "user-id"};
      setID = "setid12chars";

      // Records returned by insertRec
      insertRecords = [{_id: 1, name: "first"}, {_id: 2, name: "second"}];
    });

    afterEach(function() {
      insertRec.restore();
      setUpdate.restore();
    });

    it("should call insertRec to create a new question", function(done) {
      insertRec.yields(null, insertRecords);
      setUpdate.yields();
      SM.createQuestion(req, res, user, setID, function(err, record) {
        insertRec.callCount.should.eql(1);
        var args = insertRec.getCall(0).args;
        args[0].should.eql(SM.questions);
        args[1].should.eql({type: "qtype", authorID: "user-id", setID: DB.getObjID(setID)});
        done();
      });
    });

    it("should call update on the sets collection to add the new question to the end of the questions list", function(done) {
      insertRec.yields(null, insertRecords);
      setUpdate.yields();
      SM.createQuestion(req, res, user, setID, function(err, record) {
        setUpdate.callCount.should.eql(1);
        var args = setUpdate.getCall(0).args;
        args[0].should.eql({_id: DB.getObjID(setID)});
        args[1].should.eql({ $push: {question: insertRecords[0]._id} });
        done();
      });
    });

    it("should call callback with insertRec's err and first record", function(done) {
      insertRec.yields("error", insertRecords);
      setUpdate.yields();
      SM.createQuestion(req, res, user, setID, function(err, record) {
        err.should.eql("error");
        record.should.eql(insertRecords[0]);
        done();
      });
    });
  });

  describe("#updateQuestion", function() {
    var update, qid, updateData;

    beforeEach(function() {
      SM.questions.update = function() {};
      update = sinon.stub(SM.questions, "update");

      // Parameters for the call to updateQuestion
      qid = "qid 12 chars";
      updateData = {"qOptions.foo": "placeholder"};
    });

    afterEach(function() {
      update.restore();
    });

    describe("(when qTxt is present)", function() {
      beforeEach(function () {
        updateData.qTxt = "I am here!"
      });

      it("should call update on the questions with the passed-in update options", function(done) {
        update.yields();
        SM.updateQuestion(qid, updateData, function(err) {
          update.callCount.should.eql(1);
          var args = update.getCall(0).args;
          args[0].should.eql({_id: DB.getObjID(qid)});
          args[1].should.eql({ $set: {"qOptions.foo": "placeholder", qTxt: "I am here!"} });
          done();
        });
      });

      it("should call callback with update's error", function(done) {
        update.yields("my error!");
        SM.updateQuestion(qid, updateData, function(err) {
          err.should.eql("my error!");
          done();
        });
      });
    });

    describe("(when qTxt is not present)", function() {
      it("should call update on the questions without modifications to data", function(done) {
        update.yields();
        SM.updateQuestion(qid, updateData, function(err) {
          update.callCount.should.eql(1);
          var args = update.getCall(0).args;
          args[0].should.eql({_id: DB.getObjID(qid)});
          args[1].should.eql({ $set: {"qOptions.foo": "placeholder"} });
          done();
        });
      });

      it("should call callback with update's error", function(done) {
        update.yields("my error!");
        SM.updateQuestion(qid, updateData, function(err) {
          err.should.eql("my error!");
          done();
        });
      });
    });
  });

  describe("#removeQuestion", function() {
    var remove, qid, setid, setUpdate;

    beforeEach(function() {
      SM.questions.remove = function() {};
      remove = sinon.stub(SM.questions, "remove");
      SM.sets.update = function() {};
      setUpdate = sinon.stub(SM.sets, "update");

      // Parameters for the call to removeQuestion
      qid   = "qid 12 chars";
      setid = "setid12chars";
    });

    afterEach(function() {
      remove.restore();
      setUpdate.restore();
    });

    it("should call remove with the qid", function(done) {
      remove.yields();
      setUpdate.yields();
      SM.removeQuestion(qid, setid, function(err) {
        remove.callCount.should.eql(1);
        var args = remove.getCall(0).args;
        args[0].should.eql({_id: DB.getObjID(qid)});
        done();
      });
    });

    describe("(when remove call has an error)", function() {
      beforeEach(function () {
        remove.yields("removeErr");
      });

      it("should call callback with remove's error", function(done) {
        SM.removeQuestion(qid, setid, function(err) {
          err.should.eql("removeErr");
          done();
        });
      });

      it("shouldn't call set update", function(done) {
        SM.removeQuestion(qid, setid, function(err) {
          setUpdate.callCount.should.eql(0);
          done();
        });
      });
    });

    describe("(when remove call is successful)", function() {
      beforeEach(function () {
        remove.yields(null);
      });

      it("should call set update on setid to pull question qid", function(done) {
        setUpdate.yields();
        SM.removeQuestion(qid, setid, function(err) {
          setUpdate.callCount.should.eql(1);
          var args = setUpdate.getCall(0).args;
          args[0].should.eql({_id: DB.getObjID(setid)});
          args[1].should.eql({ $pull: {question: DB.getObjID(qid)} });
          done();
        });
      });

      it("should call callback with update's error", function(done) {
        setUpdate.yields("setUpdate err");
        SM.removeQuestion(qid, setid, function(err) {
          err.should.eql("setUpdate err");
          done();
        });
      });
    });
  });

  describe("#updateOrder", function() {
    var setUpdate, setid, ids;

    beforeEach(function() {
      SM.sets.update = function() {};
      setUpdate = sinon.stub(SM.sets, "update");

      // Parameters for the call to updateOrder
      setid = "setid12chars";
      ids = ["abcdefghijkl", "mnopqrstuvwx", "123456789012"];
    });

    afterEach(function() {
      setUpdate.restore();
    });

    it("should call update with the new qid array", function(done) {
      setUpdate.yields();
      SM.updateOrder(setid, ids, function(err) {
        setUpdate.callCount.should.eql(1);
        var args = setUpdate.getCall(0).args;
        args[0].should.eql({_id: DB.getObjID(setid)});
        args[1].should.eql({ $set: {question: [DB.getObjID(ids[0]), DB.getObjID(ids[1]), DB.getObjID(ids[2])]} });
        done();
      });
    });

    it("should call callback with update's err", function(done) {
      setUpdate.yields('error');
      SM.updateOrder(setid, ids, function(err) {
        err.should.eql("error");
        done();
      });
    });
  });
});
