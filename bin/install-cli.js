var program = require('commander')
  , UTIL = require('./util-cli') 
  , path = require('path')
  , shell = require('shelljs')
  , appPath = path.resolve( path.join( __dirname, '../' ) )
  , installDir = path.resolve( '.' );


var INSTALL = {}
module.exports = INSTALL;

INSTALL.app = function(params) {
  UTIL.emptyDirectory(installDir, function(empty){
    if (empty) {
      INSTALL.createAppAt(params);
    } else {
      program.confirm('destination is not empty, continue? ', function(ok){
        if (ok) {
          process.stdin.destroy();
          INSTALL.createAppAt(params);
        } else {
          UTIL.abort('Aborting');
        }
      });
    }
  });
}

/**
 * Create application at the given directory `installDir`.
 */
INSTALL.createAppAt = function(params) {
  // Put in filesystem
  UTIL.copyFileSystem(installDir);
  
  // Install Modules
  UTIL.npmInstall(installDir);
  
  // Install DB
  if( !params.skipdb ) UTIL.updateDB();
  else {
    UTIL.notify("Database NOT installed!!!!");
    console.log("Don't forget to run: ");
    console.log("");
    console.log("        $ make db-migrate");
    console.log("");
  }

  UTIL.notify("Run the app: ");
  console.log("          $ node app");
  console.log("");
  console.log("");


  // Create First Administrator Account
  //  NOTE: Currently am not able to return child process prompts to be used.
  // UTIL.createAdmin();
  //installAdmin();
}

var installAdmin = function(){
  UTIL.notify("Creating Admin Account...");
  shell.exec('cd ' + installDir +' && ripple account reset');
  UTIL.abort( shell.error() );
  UTIL.notify("Admin Account Ready...");  
}





