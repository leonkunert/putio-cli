#! /usr/bin/env node

var putio       = require("./putio.js");
var querystring = require("querystring");
var args        = process.argv.slice(2);

switch (args[0]) {
    case "list":
    case "ls":
        if (typeof args[1] !== 'string') {
            // Normal listing of Files
            putio.list_dir_with_file_id(null, function (err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                for (var i = res.files.length - 1; i >= 0; i--) {
                    console.log(res.files[i].name);
                };
            });
        } else {
            // List of directory
            console.log('List Dir '+args[1]);
            putio.list_dir(args[1], function (err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                for (var i = res.files.length - 1; i >= 0; i--) {
                    console.log(res.files[i].name);
                };
            });
        }
        break;
    case "download":
    case "get":
    case "dw":
        if (typeof args[1] !== 'string') {
            console.log('No Query given');
            break;
        }
        putio.download(args[1], function (err, res) {
            console.log(res);
        });
        break;
    case "find":
    case "search":
        if (typeof args[1] !== 'string') {
            console.log('No Query given');
            break;
        }
        putio.search(args[1], function (err, res) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(res);
        });
        break;
    case "rm":
    case "remove":
    case "delete":
        console.log("Delete file/folder");
        break;
    case "convert":
        console.log("Convert to mp4");
        break;
    case "subtitles":
        console.log("list subtitels");
        break;
    case "transfers":
        console.log("List Transfers");
        var url_ext = "transfers/list";
        putio.make_putio_request(base_url+url_ext+'?'+querystring.stringify(request_params), function (err, res) {
            console.log(res);
        });
        break;
    default:
        console.log("Allowed Parameters: foo, bar, baz [hu]");
        break;
}