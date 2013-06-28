var less = require('less')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')
  , async = require('async')
  , logger = require('../lib/log')
  , log = logger.logPair;

var LC = {};

LC.init = function(options){
  LC.parsing = false;

  // Make sure options defaults to object
  options = options || {};

  // Set up path variables
  var baseDir = options.baseDir || __dirname;
  LC.lessDir = options.lessDir || path.join(baseDir, 'public', 'less');
  LC.cssDir = options.cssDir || path.join(baseDir, 'public', 'css');;
  // Set Options
  LC.options = options || {};
    // LESS Filename
  LC.filenames = options.lessFiles || ['style.less','admin.less','client.less'];

    // Compression by defualt
  LC.options.compress = options.compress || true;

    // By default do not watch for changes
  LC.options.watch = options.watch || false;
  var watch = LC.options.watch;

    // Run now
  LC.options.runNow = options.runNow || true;
  var runNow = LC.options.runNow;

  if( runNow ) LC.run();

  if( watch ) LC.watch();
}

LC.watch = function(){
    // Continually Watch Folder
  log("Watching for less changes in", LC.lessDir);
  fs.watch(LC.lessDir, function(e, file){
    var timer = LC.timer;
    if( !LC.parsing ) {
      log("---- Detected change & started to parse", file)
      // Set parsing to active state
      LC.parsing = true;
      // Run parser
      LC.run();
    }
  });
}

LC.run = function(){
  var filenames = LC.filenames
    , lessDir = LC.lessDir
    , options = LC.options
    , cssDir = LC.cssDir;

  async.forEach(
    filenames, 
    function(filename, callback){
      // Parses file
      var parser, contents;
      log('Parsing...', filename);

      fullPath = path.join(lessDir, filename);
      if(!filename.match(/\.less$/) || !fs.statSync(fullPath).isFile()) return;

      // LESS Parser Object
      parser = new (less.Parser)({
        paths: [ lessDir ],
        filename: filename
      });

      // Check contents of directory
      contents = fs.readFileSync(fullPath).toString();
      //log("contents", contents);
      
      // Parse LESS
      parser.parse(contents, function(err, tree){
        if(err) {
          if( err === Object(err)) 
            callback( util.inspect(err) );
          else 
            callback(err);
          return false;
        }
        var cssFilename = filename.replace(/less$/, 'css')
          , outputFile = path.join(cssDir, cssFilename);
        fs.writeFile(
          outputFile, 
          tree.toCSS({compress: options.compress}),
          function(err){
            if(err) callback(err);
            else {
              log("Parsed LESS into ", cssFilename);
              callback && callback();  
            }
        });
          
      });
    }, 
    function(err){
      LC.parsing = false;
      if(err) log("Error parsing LESS",err);
      else {
        logger.log("---- Parsing Complete");
        return true;
      }
    }
  );
}

module.exports = LC;
