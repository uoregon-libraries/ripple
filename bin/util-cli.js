var program = require('commander')
  , UTIL = require('./util-cli') 
  , fs = require('fs')
  , path = require('path')
  , shell = require('shelljs')
  , appPath = path.resolve( path.join( __dirname, '../' ) )
  , bcrypt = require('bcrypt')
  , installDir = path.resolve( '.' );

var UTIL = {};
module.exports = UTIL;
/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

UTIL.emptyDirectory = function(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err;
    fn(!files || !files.length);
  });
}

/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */

UTIL.abort = function(err) {
  if(!err) return false;
  console.error(err);
  process.exit(1);
}

UTIL.testFilePattern = function(str){
  var pattern = new RegExp(/^\..*$/);
  return pattern.test(str);
};
UTIL.testDirPattern = function(str){
  var pattern = new RegExp(/^(\.git|bin|node_modules).*$/);
  return pattern.test(str);
};

UTIL.notify = function(msg){
  console.log(); console.log();
  console.log("========================================================================================");
  console.log("==>         "+msg+"                   <==");
  console.log("========================================================================================");  
  console.log(); console.log();
}

UTIL.copyFile =function(orgFile, newFile){
    // Copy Directory
    if( shell.test('-d', orgFile) ) {
      shell.mkdir('-p', orgFile, newFile);
      console.log("Created Directory :: ", newFile);
    }
    // Copy file
    if( shell.test('-f', orgFile) ) {
      shell.cp(orgFile, newFile);
      console.log("Created File :: ", newFile);
    }
}

UTIL.resolveFullPath = function(pathOfFile, file){
  return path.join( path.resolve(pathOfFile), file);
}

UTIL.copyFileSystem = function(destPath) {
  var installDirFiles = UTIL.resolveFullPath( destPath,'*')
    , copiedFiles = [];

  UTIL.notify('Install File System...'); 
  shell.rm('-rf', installDirFiles);
  UTIL.abort( shell.error());
  shell.ls(appPath).filter(function(file){
    //if( UTIL.testFilePattern(file) ) console.log( file )
    if( UTIL.testDirPattern(file) ) return false
    if( UTIL.testFilePattern(file) ) return false
    
    // Copy file to new directory
    var orgFile = UTIL.resolveFullPath( appPath, file );
    var newFile = UTIL.resolveFullPath( destPath, file );
    shell.cp('-rf', orgFile, destPath);
    //UTIL.copyFile(orgFile, newFile);
    copiedFiles.push(newFile);
  });
  console.log(copiedFiles);
  UTIL.abort( shell.error());
  UTIL.notify("File System Completed...");
};

UTIL.npmInstall = function(destPath){
  var prodFlag = ( process.env.NODE_ENV === "production" ) ? "--production" : ""
    , command = 'cd ' + destPath +' && npm install ' + prodFlag;

  UTIL.notify("Install Modules...");
  console.log("Command :: ", command)
  console.log("Env :: ", process.env.NODE_ENV)
  console.log();
  shell.exec(command);
  UTIL.abort( shell.error());
  UTIL.notify("Modules Ready...");
};

UTIL.createAdmin = function(){
  var dbLocalPath = path.join(path.resolve( '.' ),'lib','db-manager.js')
    , DB = require( dbLocalPath );
  console.log("DB Lib Path", dbLocalPath);

  DB.connect(function() {

    adminUserPrompt(function(err){
      if(err) UTIL.abort('Could not determine Admin Credentials.');

      console.log("User :: ", UTIL.user);
      saltAndHash(UTIL.password, function(hashedPwd){
        console.log("Hashed Pwd :: ", hashedPwd);
        // Create account in db
        adminObj = {
          name: "Administrator",
          pass: hashedPwd,
          roles: ['admin']
        };
        DB.init.collection("accounts").update({user:UTIL.user},{$set:adminObj},{upsert:true}, function(err){
          if(err) UITL.abort('Could not update Admin Account');
          console.log("Admin account updated");
          UTIL.user = null;
          UTIL.password = null;
          DB.init.close();          
        })

      });
    });
    
  });
};

// Collection Admin username
var adminUserPrompt = function(callback){
  program.prompt('Admin username: ', function(name){
    if(!name) {
      console.error("Username cannot be blank.")
      adminUserPrompt(callback);
    } else {
      UTIL.user = name;
      adminPwdPrompt(callback);
    }
  });
};

// Colection Admin password
var adminPwdPrompt = function(callback){
  program.password('Password: ', '*', function(pass){
    if(!pass) {
      console.log("Password cannot be blank");
      adminPwdPrompt(callback);
    } else if (pass.length < 6){
      console.error("Password must be atleast 6 characters.");
      adminPwdPrompt(callback);
    } else {
      UTIL.password = pass;
      callback(null);
    }
  });
};

var saltAndHash = function(pass, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(pass, salt, function(err, hash) {
    callback(hash);
    });
  });
}

UTIL.updateDB = function(){
  UTIL.notify("Install Database...");
  shell.exec('cd ' + installDir +' && make db-migrate');
  UTIL.abort( shell.error() );
  UTIL.notify("Database Ready...");
};