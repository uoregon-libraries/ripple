// Allow coverage reporting
var libpath = process.env['PLUGIN_COV'] ? '../lib-cov' : '../lib';

var should = require("should")
  , sinon = require("sinon")
  , fs = require("fs")
  , QTM = require(libpath + "/question-type-manager.js");

describe("Question Type Manager", function(){
	var collections, oldCollections, qTypeName;

	beforeEach(function(){
		// Set up empty collection objects - tests must set up functions / stubs if needed
    collections = {
      question_types: {}
    }
     // Don't lose old collections and potentially blow up other tests
    oldCollections = {
      question_types: QTM.qTypes,
    }

    QTM.qTypes = collections.question_types;
	})

  afterEach(function() {
    QTM.qTypes = oldCollections.question_types;
  });

	describe("#exists", function() {
    var findOne, qTypeName, findOneQuery;

    beforeEach(function() {
			qTypeName = "Some-Type-Name";
			findOneQuery = {name:"Some-Type-Name"};

			QTM.qTypes.findOne = function() {};
      findOne = sinon.stub(QTM.qTypes, "findOne");
    });

    afterEach(function() {
      findOne.restore();
    });

		it("function should exist", function(done){
			should.exist(QTM.exists);
			done();
		});

		describe("(when question type name undefined)", function(){
			it("should return error", function(done){
				QTM.exists(null, function(err, boolean){
					should.exist(err);
					done();
				});
			});
		});

		describe("(when question type is not found)", function(){	
			it("should empty doc", function(done){
				findOne.yields(null, null);
				QTM.exists( qTypeName, function(err, doc){
					findOne.callCount.should.eql(1);
					var args = findOne.getCall(0).args;
					args[0].should.eql(findOneQuery);
					should.not.exist(err);
					doc.should.eql(false);
					done();
				});		
			})
		});

		describe("(when question type is found)", function(){
			it("should return doc with id", function(done){
				var returnDoc = findOneQuery;
				returnDoc._id = 1
				findOne.yields(null,returnDoc)
				QTM.exists(qTypeName, function(err, doc){
					findOne.callCount.should.eql(1);
					should.not.exist(err);
					doc.should.eql(true);
				})
				done();
			})			
		});

		describe("(when db errors)", function(){
			it("should return err", function(done){
				findOne.yields("some error")
				QTM.exists(qTypeName, function(err, doc){
					findOne.callCount.should.eql(1);
					should.exist(err);
					should.not.exist(doc);
				})
				done();
			})			
		});

	});

	describe("#create", function(){
    var save, qTypeObj, saveQuery;

    beforeEach(function() {
			qTypeObj = {};
			saveQuery = {js:"/custom/filepath.js",title:"Example Title", name:"example-name", shortTitle:"Ex Title"};

			QTM.qTypes.save = function() {};
      save = sinon.stub(QTM.qTypes, "save");
    });

    afterEach(function() {
      save.restore();
    });

		it("function should create", function(done){
			should.exist(QTM.create);
			done();
		});		

		describe("(when question type object is null)", function(){
			it("should error", function(done){
				QTM.create(null, function(err, saved){
					should.exist(err);
					should.not.exist(saved);
					done();
				});
			});
		});

		describe("(when question type is empty)", function(){
			it("should error", function(done){
				QTM.create({}, function(err, saved){
					should.exist(err);
					should.not.exist(saved);
					done();
				});
			})
		});

		describe("(when question object is missing required property)", function(){
			it("should err", function(done){
				delete saveQuery["js"];
				QTM.create(saveQuery, function(err, saved){
					should.exist(err);
					should.not.exist(saved);
					done();					
				})
			})
		});

		describe("(doc save when save yields err)", function(){
			it("should err", function(done){
				save.yields("some err");
				QTM.create(saveQuery, function(err, saved){
					save.callCount.should.eql(1);
					should.exist(err);
					should.not.exist(saved);
					done();					
				})					
			})
		});

		describe("(when doc is saved)", function(){
			it("should return no error and saved doc", function(done){
				var yieldDoc = saveQuery;
				yieldDoc["_id"] = 1
				save.yields(null, yieldDoc);
				QTM.create(saveQuery, function(err, saved){
					save.callCount.should.eql(1);
					should.not.exist(err);
					saved.should.eql(yieldDoc);
					done();					
				})					
			})
		});			

	});

	describe("#remove", function(){
    var remove, qTypeName, removeQuery;

    beforeEach(function() {
			qTypeName = "example-name";
			removeQuery = {name:qTypeName};

			QTM.qTypes.remove = function() {};
      remove = sinon.stub(QTM.qTypes, "remove");
    });

    afterEach(function() {
      remove.restore();
    });

		it("function should create", function(done){
			should.exist(QTM.remove);
			done();
		});		

		describe("(when question type name is null)", function(){
			it("should error", function(done){
				QTM.remove(null, function(err, removed){
					should.exist(err);
					should.not.exist(removed);
					done();
				});
			});
		});

		describe("(when question type name is blank)", function(){
			it("should error", function(done){
				QTM.remove("", function(err, removed){
					should.exist(err);
					should.not.exist(removed);
					done();
				});
			});
		});

		describe("(when question type name is object)", function(){
			it("should error", function(done){
				QTM.remove("", function(err, removed){
					should.exist(err);
					should.not.exist(removed);
					done();
				});
			});
		});

		describe("(when question type name is removed with err)", function(){
			it("should error", function(done){
				remove.yields("error");
				QTM.remove("", function(err, removed){
					should.exist(err);
					should.not.exist(removed);
					done();
				});
			});
		});

		describe("(when question type name is removed)", function(){
			it("should return count", function(done){
				remove.yields(null, 1);
				QTM.remove(qTypeName, function(err, removed){
					should.not.exist(err);
					removed.should.eql(1);
					done();
				});
			});
		});
	});
});