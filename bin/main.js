#!/usr/bin/env node
// -*- js -*-

var Fn = require('..').fetch;
var path = require('path');

var args = process.argv;
// argv[0] === 'node'
// argv[1] === 'XXX/bin/main.js'
args = args.slice(2);

args.map(function (current, index, array) {
  Fn(current, function(err, res) {
    if (!err) {
      console.log(current, '->', res);
    } else {
      console.log(err);
    }
  });
});
