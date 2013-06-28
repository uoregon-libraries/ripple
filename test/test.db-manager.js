// Allow coverage reporting
var libpath = process.env['PLUGIN_COV'] ? '../lib-cov' : '../lib';

var should = require("should")
  , sinon = require("sinon")
  , CONFIG = require(libpath + '/config-loader.js')
  , mongodb = require('mongodb').Db
  , Server = require('mongodb').Server
  , mongo = require('mongodb')
  , moment = require('moment')

// To ensure the db is set up, we wrap the whole test in an open() call.  This makes our test less
// isolated than I'd like, but the DB methods aren't really high-level enough to test easily without
// stubbing so much the tests are meaningless.  Let's call this an integration test ;)
var DB = require(libpath + "/db-manager.js");
DB.init.open(function(err, db) {
  describe("DB Manager", function(){
    describe("#insertRec", function() {
      var collection;
      var record;

      beforeEach(function() {
        collection = DB.init.collection("foo");
        record = {one: 1, two: "the number two"};
      });

      afterEach(function() {
        collection.remove({});
      });

      it("should have no errors", function(done) {
        DB.insertRec(collection, record, function(err, records) {
          should.not.exist(err);
          done();
        });
      });

      it("should add a datestamp", function(done) {
        DB.insertRec(collection, record, function(err, records) {
          should.exist(records[0].date);
          done();
        });
      });

      it("should return the added data in the callback", function(done) {
        DB.insertRec(collection, record, function(err, records) {
          for (var field in record) {
            if (record.hasOwnProperty(field)) {
              records[0][field].should.eql(record[field]);
            }
          }
          done();
        });
      });

      it("should add a new record", function(done) {
        DB.insertRec(collection, record, function(err, records) {
          collection.find(function(err, recordsFound) {
            should.not.exist(err);
            recordsFound.toArray(function(err, docArray) {
              should.not.exist(err);
              docArray.length.should.eql(1);
              for (var field in record) {
                if (record.hasOwnProperty(field)) {
                  docArray[0][field].should.eql(record[field]);
                }
              }
              done();
            });
          });
        });
      });
    });

    describe("#getObjID", function() {
      it("should return a known id if data is passed in", function() {
        DB.getObjID("123456789012").toString().should.eql("313233343536373839303132");
        DB.getObjID("this is gr8!").toString().should.eql("746869732069732067723821");
      });

      it("should return a generated id if no data is passed in", function() {
        var first = DB.getObjID().toString();
        var second = DB.getObjID().toString();

        first.should.be.a("string");
        second.should.be.a("string");

        first.should.not.eql(second);
      });
    });

    describe("convertToObjID", function() {
      it("should return a known id if data is passed in", function() {
        DB.convertToObjID("123456789012").toString().should.eql("313233343536373839303132");
        DB.convertToObjID("this is gr8!").toString().should.eql("746869732069732067723821");
      });
    });
  });
});
