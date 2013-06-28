// Allow coverage reporting
var libpath = process.env['PLUGIN_COV'] ? '../lib-cov' : '../lib';

var should = require("should")
  , sinon = require("sinon")
  , fs = require("fs")
  , util = require("util")
  , format = util.format
  , bcrypt = require("bcrypt")
  , AM = require(libpath + "/account-manager.js");

describe("Account Manager", function(){
  // Make sure db.findOne is never actually called since the DB probably won't be available in tests
  var findOneStub;

  // Stub bcrypt.compare here so it's available for all tests that need it
  var compareStub;

  beforeEach(function() {
    findOneStub = sinon.stub(AM.accounts, "findOne");
    compareStub = sinon.stub(bcrypt, "compare")
  });

  afterEach(function() {
    findOneStub.restore();
    compareStub.restore();
  });


  describe("manualLogin:", function(){
    it("manualLogin function should exist", function(){
      AM.should.have.property('manualLogin');
      AM.manualLogin.should.be.a('function');
    });

    it("should callback 'define-user' if user is null", function(done){
      AM.manualLogin(null,null, function(err){
        err.should.equal('define-user');
        done();
      });
    });

    it("should callback 'define-user' if user is empty", function(done){
      AM.manualLogin("",null, function(err){
        err.should.equal('define-user');
        done();
      });
    });

    it("should callback 'define-password' if password is null", function(done){
      AM.manualLogin("fake",null, function(err){
        err.should.equal('define-password');
        done();
      });
    });

    it("should callback 'define-password' if password is empty", function(done){
      AM.manualLogin("fake","", function(err){
        err.should.equal('define-password');
        done();
      });
    });

    describe("(when user and password are defined)", function() {
      it("should call AM.accounts.findOne", function() {
        // Make findOne call its callback as if all was well
        findOneStub.callsArgWith(1, null, {pass: "password"});
        AM.manualLogin("fake", "fakepass", function() {});
        findOneStub.withArgs({user: "fake"}, sinon.match.func).calledOnce.should.be.true;
      });

      it("should callback 'user-not-found' if findOne doesn't return a user", function(done) {
        // Make findOne call its callback as if all was well
        findOneStub.callsArgWith(1, 'some error', null);
        AM.manualLogin("fake", "fakepass", function(err, o) {
          err.should.equal("user-not-found");
          done();
        });
      });

      it("should callback 'invalid-password' if password doesn't match", function(done) {
        // Make findOne call its callback as if all was well
        findOneStub.callsArgWith(1, null, {pass: "password"});

        // Make compare call its callback with an error
        compareStub.callsArgWith(2, "error", null)

        AM.manualLogin("fake", "fakepass", function(err, o) {
          err.should.equal("invalid-password");
          done();
        });
      });

      it("should return success and the user object if the password matches", function(done) {
        // Make findOne call its callback as if all was well
        var userObject = {pass: "password", name: "name"};
        findOneStub.callsArgWith(1, null, userObject);

        // Compare must call its callback with success
        compareStub.callsArgWith(2, null, {});

        AM.manualLogin("fake", "fakepass", function(err, o) {
          should.not.exist(err);
          o.should.equal(userObject);
          done();
        });
      });
    });
  });
});
