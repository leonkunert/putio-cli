#! /usr/bin/env node

var putio       = require("./putio.js");
var querystring = require("querystring");
var args        = process.argv.slice(2);

switch (args[0]) {
    case "sync":
        putio.download_recursive(null, '');
        break;
    default:
        console.log("Allowed Parameters: foo, bar, baz [hu]");
        break;
}