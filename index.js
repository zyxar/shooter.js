(function () {
  var http = require('http');
  var fs = require('fs');
  var path = require('path');

  var getHash = function (filename) {
    var crypto = require('crypto');
    var fd;
    try {
      fd = fs.openSync(filename, 'r');
    } catch (e) {
      return null;
    }
    var hashList = [];
    var buffer = new Buffer(4096);
    var size = fs.fstatSync(fd).size;
    if (size < 4096 * 4) return null;
    [4096, size/3*2, size/3, size-8192].map(function (cur, idx, array) {
      var md5 = crypto.createHash('md5');
      var bytes = fs.readSync(fd, buffer, 0, 4096, cur);
      md5.update(buffer);
      hashList[idx] = md5.digest('hex');
    });
    return hashList.join(';');
  };

  var submit = function (ff, callback) {
    var qs = require('querystring');
    var payload = qs.stringify({
      filehash: ff.hash,
      pathinfo: ff.filename,
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
    var proxy = process.env.http_proxy || process.env.HTTP_PROXY;
    if (typeof proxy === 'string') {
      var url = require('url');
      proxy = url.parse(proxy);
      opt.host = proxy.hostname;
      opt.port = proxy.port;
      opt.path = 'http://shooter.cn/api/subapi.php';
    }
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

  function FilmFile (fullpath) {
    this.filename = null;
    this.directory = null;
    this.hash = null;
    if (typeof fullpath === 'string') {
      this.parse(fullpath);
    }
  }

  FilmFile.prototype.parse = function(fullpath) {
    this.filename = path.basename(fullpath);
    this.directory = path.dirname(fullpath);
    this.hash = getHash(fullpath);
    return this;
  };

  FilmFile.prototype.fetch = function(callback) {
    if (!this.hash) {
      if (typeof callback === 'function') {
        callback('cannot read hash of '+this.filename);
      }
      return;
    }
    var self = this;
    submit(self, function (status, body) {
      if (status !== 200) {
        if (typeof callback === 'function') {
          callback(status);
        }
        return;
      }
      if (body === '�') {
        if (typeof callback === 'function') {
          callback('subtitles not found');
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
      var url = require('url');
      var proxy = process.env.http_proxy || process.env.HTTP_PROXY;
      if (typeof proxy === 'string') {
        proxy = url.parse(proxy);
      }
      list.map(function(current, index, array) {
        if (!(current.Files instanceof Array)) {
          if (typeof callback === 'function') {
            callback('invalid iterm:' + JSON.stringify(current));
          }
          return;
        }
        var uri = current.Files[0].Link;
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
        if (typeof proxy === 'object' && proxy !== null) {
          opt.host = proxy.hostname;
          opt.port = proxy.port;
          opt.path = 'http://www.shooter.cn'+url.parse(uri).path;
        }
        http.request(opt, function (response) {
          if (response.statusCode !== 200) {
            if (typeof callback === 'function') {
              callback(response.statusCode);
            }
            return;
          }
          var filename = response.headers['content-disposition'] || response.headers['Content-Disposition'];
          if (typeof filename === 'string') {
            filename = filename.split('filename=')[1];
          } else {
            filename = self.filename+'.'+current.Files[0].Ext;
          }
          filename = path.resolve(self.directory, filename);
          var ext = path.extname(filename);
          filename = filename.substr(0, filename.length - ext.length);
          var suffix = ext;
          var suffix_id = 1;
          while(fs.existsSync(filename+suffix)) {
            suffix = '-'+suffix_id+ext;
            suffix_id++;
          }
          filename += suffix;
          var file = fs.createWriteStream(filename, {flags: 'wx'});
          file.on('error', function(err) {
            self.directory = path.resolve(process.env['HOME'], 'Desktop');
            filename = path.resolve(self.directory, path.basename(filename));
            console.log('Write to fallback dir:', self.directory);
            file = fs.createWriteStream(filename, {flags: 'wx'});
          });
          response.on('data', function (chunk) {
            file.write(chunk);
          });
          response.on('end', function() {
            file.end();
            callback(null, filename);
          });
        }).end();
      });
    });
  };

  var api = {};
  api.getHash = function (fullpath) {
    api.current_filmfile = new FilmFile(fullpath);
    return api.current_filmfile.hash;
  };

  api.submit = function (callback) {
    if (api.current_filmfile instanceof FilmFile) {
      return submit(api.current_filmfile, callback);
    }
    return callback('current processing file not found');
  };

  api.fetch = function (fullpath, callback) {
    var ff = new FilmFile(fullpath);
    return ff.fetch(callback);
  };

  exports = module.exports = {
    FilmFile: FilmFile,
    API: api
  };
}());
