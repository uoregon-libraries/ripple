/**
 * Loads config.js if it exists, creating it from config-example.js if it doesn't exist
 */

var fs        = require("fs")
,   path      = require("path")
,   crypto    = require("crypto")
,   util      = require("util")
,   basePath  = path.normalize(path.join(__dirname, ".."))
,   configPath = path.join(basePath, "config.js");

// If the config file is missing, generate it and stuff in a semi-secure (though not technically
// cryptographically secure) app secret.
//
// Nothing here needs to be synchronous, because the app cannot run without config.js, so we
// simplify things via xxxSync calls.  Plus, linkSync rhymes.
if (!fs.existsSync(configPath)) {
  var configText = fs.readFileSync(path.join(basePath, "config-example.js"), 'utf-8');
  var bytes = crypto.randomBytes(32);
  configText = configText.replace("'SECRET_KEY': 'CHANGEME!'", "'SECRET_KEY': '" + bytes.hexSlice() + "'")
  fs.writeFileSync(configPath, configText);

  // Ensure the config file is only writeable by the owner of app.js, and only readable by owner
  // and group
  fs.stat(path.join(basePath, "app.js"), function(err, stats) {
    // Avoid exceptions
    try {
      fs.chownSync(configPath, stats.uid, stats.gid);
      fs.chmodSync(configPath, "640");
    }
    catch (err) {
      console.error("Error trying to secure the config file: " + util.inspect(err));
    }
  });
}

exports = module.exports = require(configPath)
