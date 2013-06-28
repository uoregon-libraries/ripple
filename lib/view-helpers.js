var VH = {}
  , fs = require('fs')
  , path = require('path')
  , GLOBALS = require('./globals');

module.exports = VH

// Adds "helpers" to the given object, which should be a request's locals object
VH.addLocals = function(req, res) {
  // Version string
  var versionFile = path.join(process.cwd(), "package.json");
  var package = require(versionFile);
  res.locals.versionString = package.version;

  // Request base URI
  res.locals.baseURI = req.protocol + "://" + req.host + ":" + req.app.settings.port;

  // Concatinate String into params
  res.locals.concatFiles = VH.concatFiles;

  // Convert Array to Objec
  res.locals.convertArrToObj = VH.convertArrToObj;

  // Convert Array into a path string for scripts
  res.locals.autoLoadScriptPaths = VH.autoLoadScriptPaths;

  // Remove HTML Tags from source
  res.locals.stripTags = GLOBALS.helperFn.stripTags;
};

VH.concatFiles = function(files){
	var filenames = ""
		, len = files.length;

	for (var i = 0; i < len; i++) {
    if( /^_=*$/.test( files[i] ) ) return;
		//Add names to list
    if (i !== 0) filenames += '&amp;';
		filenames += files[i];		
	};

	return filenames
};

VH.convertArrToObj = function(refArray, key){
  var newObj = {}
    , arrayLen = refArray.length
    , key = key || '';

  for( var i = 0; i < arrayLen ; i++){
    var currItem = refArray[i]
    key !== '' ? newObj[ currItem[key] ] = currItem : newObj[i] = currItem;
  }

  return newObj;
}

VH.autoLoadScriptPaths = function(refArray){
  var paths = {
        custom: [],
        js: [],
        plugins: [],
        external: []
      }
    , returnStr = "";

  // split by location
  for(i in refArray){
    var item = refArray[i]
      , itemPath = item.split("/")
      , isExternal = "https:" || "http:"

      //console.log("itemPath :: ", itemPath[0], itemPath[1]);
    switch( itemPath[0] ){
      case(""):
        switch( itemPath[1] ){
          case("js"):
            paths.js.push( reducePath(itemPath) );
            break
          case("custom"):
            paths.custom.push( reducePath(itemPath) );
            break;
          case("plugins"):
            paths.plugins.push( reducePath(itemPath) );
            break;
        }
        break;
      case(isExternal):
        paths.external.push( item );
        break
    }
  }
  returnStr = compileReturn();

  for (var i = paths.external.length - 1; i >= 0; i--) {
    returnStr += "<script src="+paths.external[i]+"></script>";
  };

  return returnStr;

  function reducePath(itemPath){
    var reducedArray = itemPath.splice(2, itemPath.length);

    return reducedArray.join("/");
  };
  
  function compileReturn(){
    var componentArr = ["js","plugins","custom"]
      , returnStr = "";
    for(i in componentArr){
      var component = componentArr[i]
        ,hasLen = paths[component].length > 0;
      if( hasLen ) {
        var filesPath = VH.concatFiles( paths[component] );
        returnStr += "<script src=/static/" + component + "?" + filesPath + "></script>";
      }
    }
    return returnStr;
  };
};
