// Start App
console.log("==============================================");
console.log('Starting Ripple...');

/**
 * Module dependencies.
 */

// Make sure CONFIG is loaded first, since the loader will auto-generate it if it doesn't exist
var CONFIG = require('./lib/config-loader.js');

// We have to force the DB connection to happen first - our application
// is completely reliant on having a DB connection right from the start.
var DB = require('./lib/db-manager.js')
  , logger = require('./lib/log');

DB.connect(run);

// This is intentionally NOT indented in order to make it clear this code is the main app and
// not just some random function.  This is created to satisfy the need for our DB to be ready
// when the app starts up while still dealing with the JS asynchronous nuances.
function run() {

console.log('Environment :: ', process.env.NODE_ENV );
console.log('DB          :: ', 'monogodb://' + CONFIG.SERVER('DB_HOST') + "/" + CONFIG.SERVER('DB_NAME') + ":" + CONFIG.SERVER('DB_PORT') );
console.log("==============================================");

var express = require('express')
  , MongoStore = require('connect-mongo')(express)
  , partials = require('express-partials')
  , http = require('http')
  , path = require('path')
  , fs = require("fs")
  , _ = require('underscore')
  , nowjs = require('now')
  , util = require("util")
  , combo = require('combohandler')
  , comboError = require('./lib/combo-middleware').error
  , plugin = require('./lib/plugins')
  , logger = require('./lib/log')
  , h5bp = require('./lib/h5bp-middleware')
  , systemVariables = require('./lib/variables-middleware')
  , log = logger.logPair
  , DB = require('./lib/db-manager.js')
  , SSM = require('./lib/session-manager.js')
  , menuRights = require('./lib/menu-rights-middleware.js')
  , qTypes = require('./lib/question-type-middleware.js')
  , sessionAPI = require('./lib/nowjs-to-session.js')
  , lessCompiler = require('./script/lessCompiler.js')
  , sanitize = require('validator').sanitize;

/**
 * Routing
 */

// Read in Routes
var routes = {}
  , routeDir = "./routes/";

fs.readdirSync(routeDir).forEach(function(filename) {
  if (filename.match(/\.js$/)) {
    var route = {};
    _.extend(route, module.require(routeDir + filename));
    routes[filename.replace(".js", "")] = route;
  }
});

logger.debugPair('Routes', util.inspect(routes));

/**
 * App Information & Configurations
 */

// These are folders that will be publically accessible
var app = module.exports = express();
var publicDir = path.join(__dirname, 'public');
var customDir = path.join(__dirname, 'custom');
var pluginDir = path.join(__dirname, 'plugins');

// Set up the session store, passing in the various database options we have
var sessionStore = new MongoStore({
  db:             CONFIG.SERVER("DB_NAME"),
  username:       CONFIG.SERVER("DB_AUTH_NAME"),
  password:       CONFIG.SERVER("DB_AUTH_PASS"),
  collection:     "web_sessions",
  clear_interval: 3600
})

app.configure(function(){
  // These are functions and properites that are global to the templating system
  // through the use of their locals object
  app.use(function(req, res, next) {
    require("./lib/view-helpers.js").addLocals(req, res);
    next();
  });
  // Ripple loads on port 3000 and 4000 for ssl if not defined
  app.set('www_port', process.env.PORT || CONFIG.SERVER('WWW_PORT') || 3000);
  app.set('ssl_port', process.env.SSL_PORT || CONFIG.SERVER('SSL_PORT') || 4000);
  app.set('views', __dirname + '/views');
  // Ripple use the ejs templating system 
  // @url http://embeddedjs.com/
  app.set('view engine', 'ejs');
  app.set("view options", { layout: "layout.ejs" });
  // Ripple also uses express partials for better reusability
  app.use( partials() );
  // Ripple uses html5 boilerplate code to modify the header so IE is set to edge
  // and to remove the powered by header info
  app.use( h5bp.ieEdgeChromeFrameHeader() );
  app.use( h5bp.removePoweredBy() );
  app.use( express.favicon() );
  app.use( express.logger('dev') );
  app.use( express.bodyParser() );
  app.use( express.methodOverride() );
  app.use( express.cookieParser( CONFIG.SERVER('SECRET_KEY')) );
  app.use( express.session({ secret : CONFIG.SERVER('SECRET_KEY'), store : sessionStore, cookie: {maxAge: 24 * 60 * 60 * 1000} }) );
  app.use( app.router );
  // Set up the static routes for publicly accessible folders
  app.use( '/', express.static(publicDir) );
  app.use( '/custom', express.static(customDir, 'custom') )
  app.use( '/plugins', express.static(pluginDir, 'plugins') )
  //app.use( comboError );
  //app.use( error404 );
});

// Setup default error routes
function error404(req, res, next) {
  var errorMsg = "Page Not Found"
    , locals = {
      title: errorMsg,
      error: "404 - " + errorMsg
    }
    res.status(404).render('404', locals);
};

var lessOptions = {
  "baseDir": __dirname
};
// Development only configurations of app
app.configure('development', function(){
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }) );
});
if( process.env.NODE_ENV === 'development'){
  lessOptions["watch"] = true;
}

// Production only configurations of app
app.configure('production', function(){
  app.use(express.errorHandler());
});
if( process.env.NODE_ENV === 'production'){
  lessOptions["watch"] = false;
}

// Compile LESS to CSS
lessCompiler.init(lessOptions);

// Admin Middleware Functions
var adminMiddleware = [menuRights, systemVariables.load];

/**
 * URIs in use
 */
/* Landing Area URLs */
app.get('/', routes.main.index);
app.post('/', routes.main.indexPost);
app.get('/signup', routes.main.signup);
app.post('/signup', routes.main.signupPost);
app.get('/logout', routes.main.logout);
app.post('/logout', routes.main.logoutPost);
app.get('/reset-password/:guid', routes.main.resetPwd);
app.post('/reset-password/:guid', routes.main.resetPwdPost);
/* Admin URLs */
app.get('/admin', adminMiddleware, routes.admin.dashboard);
app.get('/admin/session', adminMiddleware, qTypes.load, routes.admin.session);
app.get('/admin/session/close', routes.admin.sessionClose);
app.get('/admin/session/:setID', adminMiddleware, qTypes.load, routes.admin.session);
app.get('/admin/set/start', adminMiddleware, routes.admin.setStart);
app.post('/admin/set/start', routes.admin.setStartPost);
app.get('/admin/set/list', adminMiddleware, routes.admin.setList);
app.get('/admin/set/edit/:setID', adminMiddleware, qTypes.load, routes.admin.setEdit);
app.post('/admin/set/edit/:setID', routes.admin.setEditPost);
app.get('/admin/plugins', adminMiddleware, routes.admin.pluginList);
app.post('/admin/plugins', routes.admin.pluginListPost);
app.get('/admin/plugin/:pluginName', adminMiddleware, routes.admin.pluginConfig);
app.post('/admin/plugin/:pluginName', routes.admin.pluginConfigPost);
app.get('/admin/profile', adminMiddleware, routes.admin.profile);
app.post('/admin/profile', routes.admin.profileUpdate);
app.get('/admin/reports', adminMiddleware, routes.admin.reportList);
app.post('/admin/reports', adminMiddleware, routes.admin.reportListPost);
app.get('/admin/report/:sessionID', adminMiddleware, qTypes.load, routes.admin.reportItem);
app.get('/admin/report/:sessionID/csv', adminMiddleware, routes.admin.reportItemCSV);
app.get('/admin/permissions', adminMiddleware, routes.admin.permissions);
app.post('/admin/permissions', routes.admin.permissionsPost);
app.get('/admin/people', adminMiddleware, routes.admin.people);
app.post('/admin/people', routes.admin.peoplePost);
app.get('/admin/settings', adminMiddleware, routes.admin.settings);
app.post('/admin/settings', routes.admin.settingsPost);

/* Room URL */
app.get('/room/:id', qTypes.load, routes.client.index);

// Special Route for combining Client Side JS & CSS
app.get('/static', combo.combine({rootPath: publicDir}), function (req, res) {
    res.send(res.body);
});
app.get('/static/js', combo.combine({rootPath: publicDir + '/js'}), function (req, res) {
    res.send(res.body);
});
app.get('/static/plugins', combo.combine({rootPath: pluginDir}), function (req, res) {
    res.send(res.body);
});
app.get('/static/custom', combo.combine({rootPath: customDir}), function (req, res) {
    res.send(res.body);
});
app.get('/static/css', combo.combine({rootPath: publicDir + '/css'}), function (req, res) {
    res.send(res.body);
});

/**
 * HTTP Server setup - check for SSL and build redirect from non-SSL if SSL
 * has been set up
 */
var server;
var sslOpts = CONFIG.SERVER("SSL_CERTS");

if (sslOpts) {
  // Create an HTTP redirect
  var redirecter = http.createServer(function(req, res) {
    res.writeHead(200);
    var server = "https://" + req.headers.host.replace(/:\d*/, "") 
      , port = CONFIG.SERVER('SSL_SILENT_REDIRECT') ? "" : ":" + app.get('port')
      , url = req.url
      , newPath = server + port + url;
      
    log('SSL Silent', CONFIG.SERVER('SSL_SILENT_REDIRECT'));
    res.writeHead(302, {
      'Location': newPath
    });
    res.end("Redirecting to secure server at " + newPath);
  });

  redirecter.listen(app.get('www_port'));

  // Use SSL for our real server
  app.set('port', app.get('ssl_port'));
  https = require("https");
  server = https.createServer(sslOpts, app);
}
else {
  // No SSL Configuration found
  app.set('port', app.get('www_port'));
  server = http.createServer(app);
}

server.listen(app.get('port'), function(){
  // Change effective user / group to whoever owns the file
  fs.stat(__filename, function(err, stats) {
    // Avoid exceptions
    try {
      process.setgid(stats.gid);
      process.setuid(stats.uid);
    }
    catch (err) { }
    log("Effective uid", process.getuid());
  });

  log("Express server listening on port", app.get('port'));
});

/**
 * Now & Socket IO
 */
// Port is a necessity due to a very odd bug in nowjs where it assumes port 80 even if using the
// https protocol
var everyone = nowjs.initialize(server, {port: app.get('port')});

// Function fired on connect using websockets
nowjs.on('connect', function(){
  log("Client Initializing Connection", this.user.clientId);

  // Alias this for use in sessionStore callback scope
  var that = this;

  // Get the user's session so we can (fairly securely) set up user name, type, and room
  sessionAPI.getSession(that, sessionStore, function(err, session) {
    // If we had any errors, exit here
    if (err) {
      logger.error("Error retrieving session for nowjs connection [connect]: " + err.message);
      return;
    }

    // All users should have a type set on session
    that.now.type = session.type;

    // Only authenticated users currently have name stored in session
    if (session.user) {
      that.now.name = session.user.name;
    }
    that.now.room = session.room;

    // Join the room.  We don't attempt any error handling on this, as the session shouldn't
    // be set without already having checked the validity of the room
    var id = that.user.clientId;

    var group = nowjs.getGroup(session.room);
    group.addUser(id);

    // If this is the presenter, set presenter on the group object
    if (session.type == "presenter") {
      group.presenter = id;
    }

    logger.debugPair(id + " entered", that.now.room);
    logger.debugPair("[nowjs.on] connect now object", util.inspect(that.now));

    // Connect Initialization Function to run.
    nowjs.getClient(that.user.clientId, function(){
      if(that.now.hasOwnProperty('initialize') ) that.now.initialize();
    })
  });
});

// Function fired on close of websockets
nowjs.on('disconnect', function(){
  logger.debugPair("Client disconnected " + this.user.clientId, this.now.name);
});

everyone.now.setName = function(newName) {
  var that = this;
  sessionAPI.getSession(that, sessionStore, function(err, session) {
    // Report session errors and exit
    if (err) {
      logger.error("Error retrieving session for nowjs connection [setName]: " + err.message);
      return;
    }

    // Make sure we have session.user object
    if (!session.user) {
      session.user = {};
    }

    // Avoid changing a name that's already been set
    if (session.user.name && session.user.name !== "" && session.user.name !== newName) {
      logger.warn("Skipping name change for user: " + session.user.name +
          " (trying to change to " + newName + ")");
      return;
    }

    // Set session name and nowjs name
    logger.debug("Setting name for client " + that.user.clientId + " to " + newName);
    session.user.name = newName;
    that.now.name = newName;
  });
};

/**
 * Clear Client's UI & Now question variables
 */
everyone.now.distributeClear = function(){
  var that = this;

  sessionAPI.getSession(that, sessionStore, function(err, session) {
    // If we had any errors, exit here
    if (err) {
      logger.error("Error retrieving session for nowjs connection [distributeClear]: " + err.message);
      return;
    }

    if (session.type !== "presenter") {
      logger.error("Non-presenter trying to call distributeClear()!");
      return;
    }

    logger.debugPair('Question Clear Sent', that.user.clientId);
    logger.debugPair('distributeClear Now Object', util.inspect(that.now) );
    var group = nowjs.getGroup(session.room);
    group.now.clientClearQuestion();
    delete group.question;
    delete group.now.question;
    delete group.receiveAnswer;
  });
}

/**
 * Send out a message
 * @param  {String} message The text to be sent to entire virtual room
 */
everyone.now.distributeMessage = function(message){
  var that = this;
  sessionAPI.getSession(that, sessionStore, function(err, session) {
    if (err) {
      logger.error("Error retrieving session for nowjs connection [distributeMessage]: " + err.message);
      return;
    }
    // Send message
    nowjs.getGroup(session.room).now.receiveMessage(session.user.name, message);
  });
};

/**
 * Send out a question to virtual room
 * @param  {Object} question Question object with all client needed variables to display question to client.
 */
everyone.now.distributeQuestion = function(question){
  var that = this;
  sessionAPI.getSession(that, sessionStore, function(err, session) {
    // If we had any errors, exit here
    if (err) {
      logger.error("Error retrieving session for nowjs connection [distributeQuestion]: " + err.message);
      return;
    }

    if (session.type !== "presenter") {
      logger.error("Non-presenter trying to call distributeQuestion()!");
      return;
    }

    // Set current room
    var currentRoom = session.room;
    // Determine Group in virtual room
    var group = nowjs.getGroup(currentRoom);
    var recQFn = group.now.hasOwnProperty('receiveQuestion') || '' ;
    logger.debugPair("[distributeQuestion] Group", util.inspect(group) );

    // Allow reception of answers
    group.receiveAnswer = true;

    // Set Question Session ID
    question.qSessionID = session.rippleSession.id;

    logger.debugPair("[distributeQuestion] Room", currentRoom);
    logger.debugPair("[distributeQuestion] now object", util.inspect(that.now) );

    // Save Question to db
    logger.debugPair('Question Sent to db', new Date());
    SSM.questionSent(question, function(qID, sessionID){
      question.qID = String(qID);
      question.qSessionID = String(sessionID);

      // Set Expiration Time
      var expireProp = 'expireTime'
        , rippleSession = session.rippleSession
        , hasExpire = rippleSession.hasOwnProperty(expireProp) && rippleSession[expireProp] != ""
        , isSetExpire = group.now.hasOwnProperty(expireProp)
      logger.debugPair("distributeQuestion hasExpire", hasExpire);
      logger.debugPair("distributeQuestion isSetExpire", isSetExpire);

      if( hasExpire && !isSetExpire ) {
        question[expireProp] = rippleSession[expireProp];
      }
      
      // Server Side Question Object held private from client
      group.question = question;
      
      // Send Question to Client
      group.now.question = {
        type:     question.type,
        qTxt:     question.qTxt,
        authorID: question.authorID,
        qOptions: question.qOptions,
        qID:      question.qID,
      }
      group.now.receiveQuestion();
      logger.debugPair('Question Sent to client', util.inspect(group.now.question) );


      if(recQFn) recQFn(
        session.user.name
      );

      logger.debugPair("");
      log('Question Sent Complete', new Date() );
      logger.debugPair("");
    });
    /**
     * Hook fired when a question is distributed.
     *
     * @event distribute
     * @for plugin-server.question
     * @param {String} room The room that the question was distributed to
     * @param {Object} question A object that contains all the question information
     */
    plugin.invokeAll("question.distribute", currentRoom, question);
  });
};

/**
 * Client sent in answer
 * @param  {Object} data Object that contains answer information
 */
everyone.now.distributeAnswer = function(data){
  var that = this;

  // Ensure we have data before trying to use it
  if (!data.qID) {
    logger.warn("Invalid answer submission - missing Question ID");
    return;
  }
  if (!data.hasOwnProperty('answer')) {
    logger.warn("Invalid answer submission - missing answer");
    return;
  }

  sessionAPI.getSession(that, sessionStore, function(err, session) {
    var clientNowObj;
    nowjs.getClient(that.user.clientId, function(){
      clientNowObj = this.now
    })
    var room = session.room
      , name = session.hasOwnProperty('user') ? session.user.name : clientNowObj.name
      , group = nowjs.getGroup(room)
      , answer = data.answer
      , qID = data.qID;

    log('Answer Sent: ' + name + ' - ' + that.user.clientId, util.inspect(data));

    // If we had any errors, exit here
    if (err) {
      logger.error("Error retrieving session for nowjs connection [distributeAnswer]: " + err.message);
      return;
    }

    // Ensure that answer are allowed to be received
    if (!group.hasOwnProperty('receiveAnswer') ||  !group.receiveAnswer ){
      logger.warn("Invalid answer submission - currently not taking answers");
      return;
    }
    
    // Clean data
    answer = cleanAnswer(answer, group.question);

    // Verify qID
    if (group.question.qID != qID) {
      logger.info("Answer submitted for wrong qID");
      return;
    }

    // Send Answer to Admin
    var presenter = nowjs.users[group.presenter];
    presenter.now.receiveAnswer(that.user.clientId, name, answer);

    // Save Answer to DB
    SSM.saveAnswer(answer, group.question, name)

    // Send Answer to plugins
    /**
     * Hook fired when a answer is received.
     *
     * @event distribute
     * @for plugin-server.answer
     * @param {String} room The room that the question was distributed to
     * @param {String} clientID The client's id who submitted the answer
     * @param {String} name The client's name who submitted the answer
     * @param {Object} question An object with all the question information
     * @param {String} answer The answer submitted by the client
     */
    plugin.invokeAll("answer.distribute", room, that.user.clientId, name, group.question, answer);
  });
};

/**
 * Santize Answers
 * @param  {Object} answer      Answer from client
 * @param  {Object} question    Question responded to
 * @return {Object} cleanAnswer Santized answer
 */
var cleanAnswer = function(answer, question){
  var translation = 'string';

  // Remove XSS vulnerbilities
  answer = sanitize(answer).xss();

  // Truncate long answers first to avoid DB storage issues, logging giant strings, and sending
  // huge blobs of data to presenter
  if (answer.length > 500) {
    answer = answer.substring(0, 500);
  }

  // For security reason, answer is stongly typed
  switch(question.type){
    case 'slider':
      translation = 'numeric';
      break;
    case 'numeric':
      translation = 'numeric';
      break;
  }

  switch(translation){
    case 'string':
      // Make sure it is a string
      answer = String( answer ).replace(/<\/?[^>]+(>|$)/g, "")
      //answer = sanitize( answer ).escape();
      break;
    case 'numeric':
      answer = sanitize( answer ).toFloat();
  }
  logger.debugPair("Answer typed to", translation);
  
  return answer;

}

/**
 * Set whether answers can or can not be received
 * @param  {String} status The current status of polling
 */
everyone.now.distributePolling = function(status){
  var that = this;
  sessionAPI.getSession(that, sessionStore, function(err, session) {
    // If we had any errors, exit here
    if (err) {
      logger.error("Error retrieving session for nowjs connection [distributePolling]: " + err.message);
      return;
    }

    if (session.type !== "presenter") {
      logger.error("Non-presenter trying to call distributePolling()!");
      return;
    }

    var group = nowjs.getGroup(session.room)
    group.now.clientSetPolling(status);
    group.now.question.polling = status;

    // Determine reception of answers status
    if( status === 'on' ) group.receiveAnswer = true;
    else group.receiveAnswer = false;
    
  });
}
console.log("==============================================");
console.log("Ripple app.js executed");
console.log("==============================================");

} // end "run" function
