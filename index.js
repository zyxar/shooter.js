(function () {
  var http = require('http');
  var fs = require('fs');
  var api = {};
  var file_hash = '';
  var file_name = '';
  api.getHash = function (filename) {
    var crypto = require('crypto');
    var fd;
    try {
      fd = fs.openSync(filename, 'r');
    } catch (e) {
      return null;
    }
    file_name = filename;
    var hashList = [];
    var buffer = new Buffer(4096);
    var size = fs.fstatSync(fd).size; // TODO: size check
    [4096, size/3*2, size/3, size-8192].map(function (cur, idx, array) {
      var md5 = crypto.createHash('md5');
      var bytes = fs.readSync(fd, buffer, 0, 4096, cur);
      md5.update(buffer);
      hashList[idx] = md5.digest('hex');
    });
    file_hash = hashList.join(';');
    return file_hash;
  };
  api.submit = function (callback) {
    var qs = require('querystring');
    var payload = qs.stringify({
      filehash: file_hash,
      pathinfo: file_name,
      format: 'json'
    });
    var opt = {
      host: 'shooter.cn',
      port: 80,
      path: '/api/subapi.php',
      method: 'POST',
      headers: {
        "Host": "shooter.cn",
        "Connection": "keep-alive",
        "Content-Length": payload.length,
        "Origin": "http://shooter.cn",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36",
        "Content-type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "Referer": "http://shooter.cn/"
      }
    };
    var req = http.request(opt, function (response) {
      var data = '';
      response.on('data', function (chunk) {
        data += chunk;
      });
      response.on('end', function () {
        if (typeof callback === 'function') {
          callback(response.statusCode, data);
        }
      });
    });
    req.write(payload);
    req.end();
  };
  api.fetch = function (file, callback) {
    api.getHash(file);
    api.submit(function (status, body) {
      if (status !== 200) {
        if (typeof callback === 'function') {
          callback(status);
        }
        return;
      }
      var list = [];
      try {
        list = JSON.parse(body);
      } catch (e) {
        if (typeof callback === 'function') {
          callback(e);
        }
        return;
      }
      if (list.length > 0) {
        var uri = list[0].Files[0].Link;
        var opt = {
          host: 'www.shooter.cn',
          port: 80,
          path: uri.split('shooter.cn')[1],
          method: 'GET',
          headers: {
            "Host": "www.shooter.cn",
            "Connection": "keep-alive",
            "Origin": "http://shooter.cn",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36",
            "Content-type": "application/x-www-form-urlencoded",
            "Accept": "*/*",
            "Referer": "http://shooter.cn/"
          }          
        };
        http.request(opt, function (response) {
          var filename = response.headers['content-disposition'] || response.headers['Content-Disposition'];
          if (typeof filename === 'string') {
            filename = filename.split('filename=')[1];
          } else {
            filename = file_name+'.'+list[0].Files[0].Ext;
          }
          if (response.statusCode !== 200) {
            if (typeof callback === 'function') {
              callback(response.statusCode);
            }
            return;
          }
          var file = fs.createWriteStream(filename);
          response.on('data', function (chunk) {
            file.write(chunk);
          });
          response.on('end', function() {
            file.end();
            callback(null, 'OK');
          });
        }).end();
      }
    });
  };
  exports = module.exports = api;
}());
