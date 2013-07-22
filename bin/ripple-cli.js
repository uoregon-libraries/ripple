#!/usr/bin/env node
;(function () { // wrapper in case we're in module_context mode

//Module dependencies.
var program = require('commander')
  , util = require('util')
  , path = require('path')
  , pkg = require('../package.json')
  , version = "v"+pkg.version
  , os = require('os')
  , HELP = {}
  , rippleOpts = {}
  , shell = require('shelljs')
  , installDir = path.resolve( '.' );

rippleOpts.skipdb = {
  options: '-s, --skipdb',
  desc: 'skip the upgrade of database files'
}


HELP.notify = function(msg){
  console.log(msg);
  console.log("use -h for help");
};

// CLI
program
  .version(version)
  .option('-d, --debug', 'debug ripple processing');

/**
 * Installs Ripple server at current location.
 * @class  command-line.install
 * @method install
 * @title install
 * @command ripple install {-s}
 */
program
  .command('install')
  .description('install Ripple')
  .option(rippleOpts.skipdb.options, rippleOpts.skipdb.desc)
  .action(function(params, options){
    var install = require('./install-cli.js');
     if( program.debug ) console.log("account args :: ", arguments);
    // if( program.debug ) console.log(program.install);
    install.app(params);
  });

/**
 * Updates Ripple server at current location.
 * @class  command-line.update
 * @title update
 * @method update
 * @command ripple update {-s, -a}
 */
program
  .command('update')
  .description('update Ripple core')
  .option(rippleOpts.skipdb.options, rippleOpts.skipdb.desc)
  .option('-a, --archive', 'archive current site during update')
  .action(function(params, options){
    var update = require('./update-cli.js');
    update.app(params);
  });

/**
 * Account command modifies ripple account information
 *
 * @class command-line.account
 * @title account
 * @command ripple account <i>option</i>
 */
program
  .command('account <action>')
  .description('adjust accounts')
  .action(function(action, options){
    var actHelp = "Command account needs an option";
    if( program.debug ) console.log("account args :: ", arguments);
    
    var utilCli = require('./util-cli.js');
    action = action.split(' ');
    /**
     * Account reset allow for an administrative account to be created or
     * will reset the password of the administrative account if it already exists
     * 
     * @method reset
     * @command Ripple account reset
     */
    if( action[0] === 'reset' ) utilCli.createAdmin();
    else HELP.notify( actHelp );

  })
  .on('--help', function(){
    console.log('  Actions:');
    console.log('    *** Atleast 1 action is required.')
    console.log('');
    console.log('    %s','reset','    admin account reset credentials');
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('    $ ripple account reset');
    console.log('');
  });

/**
 * Command starts ripple in interactive mode so terminal must stay 
 * open for application to continue to run.
 * 
 * @class  command-line.start
 * @title start
 * @method start
 * @command ripple start
 */
program
  .command('start')
  .description('start Ripple')
  .option('-x, --daemon', 'start Ripple in daemon mode')
  .action(function(params, options){
    var run = require('./run-cli.js');
    run.start(params);
  });

/**
 * Command looks for an existing interactive mode terminal session and ends 
 * that process
 * 
 * @class  command-line.stop
 * @title stop
 * @method stop
 * @command ripple stop
 */
program
  .command('stop')
  .description('stop Ripple')
  .action(function(params, options){
    var run = require('./run-cli.js');
    run.stop(params);
  });

/**
 * Searches for processes associated with Ripple server
 * 
 * @class  command-line.find
 * @title find
 * @method find
 * @command ripple find
 */
program
  .command('find')
  .description('find running processes Ripple')
  .action(function(params, options){
    var run = require('./run-cli.js');
    run.find(params);
  });

/**
 * Load Commands
 */
program.parse(process.argv);


// // Path
// var path = program.args.shift() || '.';

// // end-of-line code
// var eol = os.EOL

if( program.debug ) console.log( util.inspect(program) );
if( program.args.length === 0 && !program.debug ) program.help();

var CLI = {};

CLI.program = program;
module.exports = CLI;

})();

