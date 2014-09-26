var request_params = {
    // Your personal api token
    "oauth_token": "N395ZSCU"
}

var querystring = require("querystring");
var request     = require("request");
var http        = require('http');
var url         = require('url');
var fs          = require("fs");
var ProgressBar = require('progress');

var putio = {
    base_url: "https://api.put.io/v2/",
    DL_DIR: '/media/tmp/',
    download_list: [],
    downloading: false,
    reruncount: 0,
    make_putio_request: function (req_url, callback) {
        request({
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
    get_download_link: function (file_id, callback) {
        request({
                "url": putio.base_url+'files/'+file_id+'/download?'+querystring.stringify(request_params),
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
    list_dir_with_file_id: function (file_id, callback) {
        if (file_id && (typeof file_id == 'string' || typeof file_id == 'number')) {
            request_params.parent_id = file_id;
        }
        putio.make_putio_request(putio.base_url+'files/list'+'?'+querystring.stringify(request_params), function (err, res) {
            callback(err, res);
        });
    },
    add_file_to_download_list: function (file_info) {
        putio.download_list.push(file_info);
        if (!putio.downloading) {
            putio.downloading = true;
            putio.download_files_in_dowload_list();
        }
    },
    download_files_in_dowload_list: function () {
        if (!putio.download_list.length) {
            console.log('Download list empty');
            putio.reruncount++;
            if (putio.reruncount == 3) {
                return;
            } else {
                setTimeout(function() {
                    putio.download_files_in_dowload_list();
                }, 2000);
                return;
            }
        }
        var file_info = putio.download_list.pop();
        if (!fs.existsSync(putio.DL_DIR + file_info.path + '/' + file_info.name)) {
            putio.get_download_link(file_info.id, function (err, res) {
                putio.download_to_file(res, file_info, function () {
                    putio.download_files_in_dowload_list();
                });
            });
        } else {
            putio.download_files_in_dowload_list();
        }
    },
    download_recursive: function (file_id, path) {
        putio.list_dir_with_file_id(file_id, function (err, res) {
            var files = res.files;
            while (true) {
                if (files.length === 0) {
                    break;
                }
                var file_info = files.pop()
                file_info.path = path;
                if (file_info.content_type == "application/x-directory") {
                    // If it is a folder call recursive
                    if (!fs.existsSync(putio.DL_DIR + path + '/' + file_info.name)) {
                        fs.mkdirSync(putio.DL_DIR + path + '/' + file_info.name);
                    }
                    putio.download_recursive(file_info.id, path + '/' + file_info.name);
                } else {
                    // Add File to downloadlist
                    putio.add_file_to_download_list(file_info);
                }
            }
        });
    },
    download_to_file: function (req_url, file_info, callback) {
        console.log(putio.DL_DIR + file_info.path + file_info.name);
        var file = fs.createWriteStream(putio.DL_DIR + file_info.path + '/' + file_info.name);
        var options = {
            host: url.parse(req_url).host,
            port: 80,
            path: url.parse(req_url).path
        };
        var bar = new ProgressBar('dw '+file_info.name.substr(0, 30)+' [:bar] :percent :etas', {
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
                console.log(file_info.name + ' downloaded to ' + putio.DL_DIR);
                callback();
            });
        });
    }
}

module.exports = putio;
