// Init babel
require("babel-register");

//Load auto-stripper for JSON requires
require('autostrip-json-comments');

// Init Colors
require("colors");

// Timers
global.__timers = {main: +new Date()};
console.log("[FRAMEWORK]".bold.yellow, "Loading Main Module...".green);

// Load main
const Main = require('./_main.js').default;
new Main(err => console.log("[FRAMEWORK]".bold.yellow, "App initialized!".green, 'Reported Errors:'.red, err));
