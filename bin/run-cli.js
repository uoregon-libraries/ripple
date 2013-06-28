var program = require('commander')
  , UTIL = require('./util-cli') 
  , inspect = require('util').inspect
  , path = require('path')
  , shell = require('shelljs')
  , currentDir = path.resolve( '.' )
  , pidFile = path.join(currentDir,'custom','pid.txt');

var RUN = {}
module.exports = RUN;

RUN.start = function(params){
	//Check for PID File
  if( shell.test('-f', pidFile) ) {
  	program.confirm('Ripple looks to already have been start. Continue (y/n)? ', function(ok){
	    if (ok) {
	    	determineStart(params);
	      return;
	    } else {
	      UTIL.abort('Aborting Start');
	    }
	  });
  } else determineStart(params);
};

var determineStart = function(params){
	// Determine how to start Server
  if( params.daemon )
  	startDaemon();
  else
  	startServer();
};

var startDaemon = function(){
	// NOTE: We are assuming that ripple has been configure for upstart service
	//   so nohup will not be currently used
	//nohupCommand = 'nohup node '+currentDir+'/app.js > '+currentDir+'/ripple.log &';
	// var startCommand = 'service ripple start'
	// UTIL.notify( startCommand );
	// shell.exec(startCommand, function(code, output) {
	//   if( code ) {
	//   	console.log('Exit code:', code);
	//   	process.exit(code);
	//   }
	// });
	console.log('Currently still in development')
	
};

var startServer = function(){
	var process = shell.exec('node '+currentDir+'/app.js', function(code, output) {
	  console.log('Exit code:', code);
	  console.log('Program output:', output);
	});
	shell.echo(process.pid).to( pidFile );
};

RUN.stop = function(){
	//Check for PID File
	if( shell.test('-f', pidFile) ) {
		//Determine PID
		var pid = shell.cat(pidFile); 
		shell.exec('kill ' + pid);
		shell.rm(pidFile);
	} else UTIL.notify("Ripple can not be stop because process can not be determined");
};

RUN.find = function(){
	// Find process that include ripple name
	var find = 'ps aux | grep ripple';
	UTIL.notify( find )
	shell.exec( find );
}