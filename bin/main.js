#!/usr/bin/env node
// -*- js -*-

var Fn = require('..').API.fetch;
var path = require('path');

var args = process.argv;
// argv[0] === 'node'
// argv[1] === 'XXX/bin/main.js'
args = args.slice(2);

if (args.length === 0) {
  var package = require('../package');
  console.log(package.name, package.version);
  console.log(package.description+'\n');
  process.exit(0);
}

args.map(function (current, index, array) {
  Fn(current, function(err, res) {
    if (!err) {
      console.log('[DONE]', path.basename(current), '->', path.join(path.basename(path.dirname(res)), path.basename(res)));
    } else {
      console.log('[ERROR]', err);
    }
  });
});
