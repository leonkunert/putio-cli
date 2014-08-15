var request_params = {
    // Your personal api token
    "oauth_token": ""
}
var base_url    = "https://api.put.io/v2/";

var querystring = require("querystring");
var request     = require("request");
var http        = require('http');
var url         = require('url');
var fs          = require("fs");
var ProgressBar = require('progress');
var DL_DIR      = '';

var putio = {
    make_putio_request: function (req_url, callback) {
        request(
            {
                "url": req_url,
                "json": true,
                "followRedirect": false
            },
            function (err, res, res_body) {

            if (!err && res.statusCode == 200) {
                callback(null, res_body);
            } else {
                callback(err, null);
            }
        });
    },
    get_file_id: function (query, callback) {
        putio.search(query, function (err, res) {
            for (var i = res.files.length - 1; i >= 0; i--) {
                if (res.files[i].name == query) {
                    callback(err, res.files[i].id);
                    break;
                }
            };
        })
    },
    list_dir: function (query, callback) {
        putio.get_file_id(query, function (err, res) {
            console.info('Found Folder with id '+res);
            putio.list_dir_with_file_id(res, function (err, res) {
                callback(err, res);
            });
        });
    },
    list_dir_with_file_id: function (file_id, callback) {
        if (file_id && (typeof file_id == 'string' || typeof file_id == 'number')) {
            request_params.parent_id = file_id;
        }
        putio.make_putio_request(base_url+'files/list'+'?'+querystring.stringify(request_params), function (err, res) {
            callback(err, res);
        });
    },
    search: function (query, callback) {
        console.log('searching for '+query);
        putio.make_putio_request(base_url+'files/search/'+query+'?'+querystring.stringify(request_params), function (err, res) {
            callback(err, res);
        });
    },
    get_download_link: function (file_id, callback) {
        request(
            {
                "url": base_url+'files/'+file_id+'/download?'+querystring.stringify(request_params),
                "followRedirect": false
            },
            function (err, res, res_body) {

            if (!err) {
                callback(null, res.headers.location);
            } else {
                callback(err, null);
            }
        });
    },
    get_zip_download_link: function (file_ids, callback) {
        request_params.file_ids = file_ids
        request(
            {
                "url": base_url+'files/zip?'+querystring.stringify(request_params),
                "followRedirect": false
            },
            function (err, res, res_body) {

            if (!err) {
                callback(null, res.headers.location);
            } else {
                callback(err, null);
            }
        });
    },
    download: function (query, callback) {
        putio.search(query, function(err, res) {
            for (var i = res.files.length - 1; i >= 0; i--) {
                if (res.files[i].name == query) {
                    var file_info = res.files[i];
                    if (file_info.content_type == 'application/x-directory') {
                        putio.list_dir_with_file_id(file_info.id, function (err, res) {
                            var file_ids = '';
                            var seperator = '';
                            var zipfile = {
                                "name": file_info.name+'.zip',
                                "size": 0
                            };
                            for (var i = res.files.length - 1; i >= 0; i--) {
                                file_ids += seperator+res.files[i].id;
                                seperator = ',';
                                zipfile.size += res.files[i].size;
                            }
                            putio.get_zip_download_link(file_ids, function (err, res) {
                                putio.download_to_file(res, zipfile, function (foo) {
                                    console.log('message');
                                })
                            });
                        });
                    } else {
                        putio.get_download_link(file_info.id, function (err, res) {
                            putio.download_to_file(res, file_info, function (foo) {
                                console.log('message');
                            })
                        });
                    }
                }
            }
        });
    },
    download_to_file: function (req_url, file_info, callback) {
        var file = fs.createWriteStream(DL_DIR + file_info.name);
        var options = {
            host: url.parse(req_url).host,
            port: 80,
            path: url.parse(req_url).path
        };
        var bar = new ProgressBar('downloading [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            total: file_info.size
        });
        http.get(options, function(res) {
            res.on('data', function(data) {
                file.write(data);
                bar.tick(data.length);
            }).on('end', function() {
                file.end();
                console.log(file_info.name + ' downloaded to ' + DL_DIR);
            });
        });
    }
}

module.exports = putio;
