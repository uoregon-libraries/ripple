var program = require('commander')
  , UTIL = require('./util-cli') 
  , path = require('path')
  , shell = require('shelljs')
  , appPath = path.resolve( path.join( __dirname, '../' ) )
  , installDir = path.resolve( '.' )
  , rootFiles = path.join(installDir, "*")
  , updateDir = path.join(installDir, 'update')
  , updatePattern = new RegExp(updateDir)
  , archiveDir = path.join(installDir, 'archive')
  , archivePattern = new RegExp(archiveDir)
  , params = null;

// Files or Folders that hold customization by user
var customizedFiles = ['config.js', 'custom/', 'plugins/'];

var UPDATE = {}
module.exports = UPDATE;

UPDATE.app = function(programParams) {
  params = programParams;
  // Archive current root
  if( params.archive ) {
    UTIL.notify('Archiving Ripple Files into /archive');
    copyRootToArchive();
    UTIL.notify('Files archived');
  } else updateProcesses();

};

copyRootToArchive = function(){
  UTIL.emptyDirectory(archiveDir, function(empty){
    if (empty) {
      rootArchive();
    } else {
      program.confirm('archive is not empty, continue? ', function(ok){
        if (ok) {
          process.stdin.destroy();
          rootArchive();
        } else {
          UTIL.abort('Aborting');
        }
      });
    }
  });
};

rootArchive = function(){
  var archiveFiles = path.join(archiveDir, "*");

  if( shell.test('-d', archiveDir) ) shell.rm('-rf', archiveFiles)
  else shell.mkdir(archiveDir);

  cpOriginalFiles();  
};

updateProcesses = function(){
  if( process.debug ) console.log("Update Params ::", params);

  // Create temp directory
  shell.rm('-rf', updateDir);
  shell.mkdir( updateDir );

  // Install files into /tmp
  UTIL.copyFileSystem(updateDir);
  UTIL.npmInstall(updateDir);

  // Copy over user's custom folders - const.js, custom/, plugins/
  copyUserCustoms(installDir, updateDir);

  // RM everything in root except /tmp
  removeOriginalFiles();
 
  // Copy files back to root
  copyTmpToRoot();

  UTIL.notify("Completed Update of files");

  // MigrateDB
  if( !params.skipdb ) UTIL.updateDB();

  // Remove Update because process was complete
  UTIL.notify("Update Complete. Restart the app: ");
  console.log("          $ node app");
  console.log("");
  console.log("");
};

copyUserCustoms = function(srcPath, destPath) {
  var installDirFiles = path.join(path.resolve(destPath),'*')
    , patternStr, fileToCp = [];

  // Create test pattern from array
  patternStr = customizedFiles.join("|");
  patternStr = patternStr.replace(/\//g, "");
  patternStr = "^(" + patternStr + ").*$";

  var copyPattern = new RegExp(patternStr);
  UTIL.notify('Copy Customized Files...'); 

  shell.ls(srcPath).filter(function(file){
    if( !copyPattern.test(file) ) return false
    
    // Copy file to new directory
    var orgFile = UTIL.resolveFullPath( srcPath, file );
    var newFile = UTIL.resolveFullPath( destPath, file );
 
    // Copy Directories
    //if( shell.test('-d', orgFile) ) UTIL.copyFile(orgFile, newFile);
    fileToCp.push(orgFile);
    shell.cp('-rf', orgFile, destPath);

  });
  // Copy files
  console.log(fileToCp);
  UTIL.notify("Custom Copy Completed")
  UTIL.abort( shell.error());
};

removeOriginalFiles = function(){
  var pattern = new RegExp(updateDir)
    , pattern2 = new RegExp(archiveDir);
  removeFiles = shell.ls(installDir).filter(function(file){
    return reservedPath(file);
  });

  console.log(removeFiles);
  shell.rm('-rf', removeFiles);
};

cpOriginalFiles = function(){
  cpFiles = shell.ls(installDir).filter(function(file){
    return reservedPath(file);
  });

  if( program.debug ) console.log("File found ::", cpFiles);
  console.log("Coping Files...");
  shell.cp('-rf', cpFiles, archiveDir);    
  // Do the rest of the update
  updateProcesses();
};

copyTmpToRoot = function(){
  var tmpFiles = path.join(updateDir, "*");
  shell.cp('-rf', tmpFiles, installDir);
};


reservedPath = function(file){
  var fullPath = path.resolve(file);

  if( updatePattern.test(fullPath) ) return false
  if( archivePattern.test(fullPath) ) return false
  else return true;
};
