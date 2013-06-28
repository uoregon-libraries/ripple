// Allow coverage reporting
var libpath = process.env['PLUGIN_COV'] ? '../lib-cov' : '../lib';

var should = require("should")
  , sinon = require("sinon")
  , util = require("util")
  , format = util.format
  , RoomManager = require(libpath + "/room-manager.js");

describe("RoomManager", function() {
  // Make sure db.findOne is never actually called since the DB probably won't be available in tests
  var findOneStub;

  beforeEach(function() {
    findOneStub = sinon.stub(RoomManager.rooms, "findOne");
  });

  afterEach(function() {
    findOneStub.restore();
  });

  describe(".randomizer", function() {
    it("should return a string", function() {
      RoomManager.randomizer().should.be.a.string;
    });

    it("should call Math.random() once per character in the returned string", function() {
      var randomSpy = sinon.spy(Math, "random");
      var string = RoomManager.randomizer();

      randomSpy.callCount.should.eql(string.length);
    });
  });

  describe(".getPresenterRoom", function() {
    var insertStub
      , user
      , callback
      , randomizerStub
      , verifyStub

    beforeEach(function() {
      // Fake user for easier testing
      user = {_id: "test"};

      // Dummy callback
      callback = function() {};

      // Stub insert to always work
      insertStub = sinon.stub(RoomManager.rooms, "insert");
      insertStub.yields(null, {});

      // Stub randomizer to always return known values
      randomizerStub = sinon.stub(RoomManager, "randomizer");
      randomizerStub.returns("abc123");

      // Stub verify method to assume no room exists
      verifyStub = sinon.stub(RoomManager, "verifyRoom");
      verifyStub.yields(null, null);
    });

    afterEach(function() {
      insertStub.restore();
      randomizerStub.restore();
      verifyStub.restore();
    });

    it("should register a new room for the presenter if one doesn't exist", function(done) {
      // Fake a DB query finding no results (i.e., no existing room for presenter)
      findOneStub.withArgs({presenterID: user._id}, sinon.match.func).yields(null, null);

      // Get the presenter's room and validate flow
      RoomManager.getPresenterRoom(user, function(err, room) {
        insertStub.calledOnce.should.be.true;
        insertStub.withArgs(sinon.match.has("presenterID", user._id)).calledOnce.should.be.true;
        insertStub.withArgs(sinon.match.has("roomString", "abc123")).calledOnce.should.be.true;

        done();
      });
    });

    it("should grab an existing room if one exists", function(done) {
      // Fake a DB query finding a room
      var fakeRoom = {fake: true, meaningfulData: false};
      findOneStub.withArgs({presenterID: user._id}, sinon.match.func).yields(null, fakeRoom);

      // Get the presenter's room and validate flow
      RoomManager.getPresenterRoom(user, function(err, room) {
        // We shouldn't have touched rooms.insert!
        insertStub.callCount.should.eql(0);

        room.should.eql(fakeRoom);

        done();
      });
    });

    it("should not register a new room with the same room string as an existing room", function(done) {
      // Hack Math.random because apparently there's NO WAY TO SEED THE RNG IN JS WOW
      //
      // Obviously any changes to this method, the number of calls to Math.random, or various other
      // factors I can't even predict could mess this up... tread lightly.
      var seed = 0.0;
      Math.random = function() {
        seed += 0.05;
        if (seed >= 1.0) { seed = 0.0; }
        return seed;
      };

      // Can't figure out how to make sinon due sequential returns, so we have to actually let the
      // random number generator do its thing here by seeding it with known values.
      randomizerStub.restore();

      // Fake a verifyRoom call that finds the first room our Math.random hack will produce
      var existingRoom = {roomString: "24579a", presenterID: "foo"}
      verifyStub.withArgs("24579a").yields(null, existingRoom);

      // Second call will find no room
      verifyStub.withArgs("cefhkl").yields("no-room", null);

      // Fake a DB query finding no room by presenter ID
      findOneStub.withArgs({presenterID: user._id}, sinon.match.func).yields(null, null);

      // Get the presenter's room and validate flow
      RoomManager.getPresenterRoom(user, function(err, room) {
        insertStub.calledOnce.should.be.true;
        insertStub.withArgs(sinon.match.has("presenterID", user._id)).calledOnce.should.be.true;
        insertStub.withArgs(sinon.match.has("roomString", "24579a")).calledOnce.should.be.false;
        insertStub.withArgs(sinon.match.has("roomString", "cefhkl")).calledOnce.should.be.true;

        done();
      });
    });
  });

  describe(".verifyRoom", function() {
    it("should callback with 'no-room' if the room doesn't exist", function(done) {
      findOneStub.yields(null, null);
      RoomManager.verifyRoom("foo", function(err, room) {
        err.should.eql("no-room");
        should.not.exist(room);

        done();
      });
    });

    it("should callback with the room if it exists", function(done) {
      findOneStub.yields(null, {});
      RoomManager.verifyRoom("foo", function(err, room) {
        should.not.exist(err);
        should.exist(room)

        done();
      });
    });
  });
});

