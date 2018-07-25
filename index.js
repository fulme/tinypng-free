var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var util = require('gulp-util');
var request = require('request');
var through = require('through2');

var SKIPPED = [];
var COMPRESSED = [];

var CATCH_FILE = './sign.json';
var PLUGIN_NAME = 'gulp-tinypng-free';
var log = util.log.bind(null, PLUGIN_NAME);

function tinypngFree(opt) {
  opt = opt || {};

  var sigFile = opt.sigFile || CATCH_FILE;
  var force = opt.force || false;
  var hasher = new Hasher(sigFile).populate();

  var stream = through.obj(function(file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(createError(file, 'Streaming not supported'));
    }

    if (file.isBuffer()) {
      var result = hasher.compare(file);

      if (result.match && !force) {
        var filename = path.basename(file.path);

        SKIPPED.push(filename);
        log(': [skipped]', util.colors.green('Ok ') + file.relative);

        return callback(null, null);
      }

      tinypng(file, function(data) {
        let tinyFile = file.clone();

        if (data) {
          tinyFile.contents = data;
          hasher.update(file, hasher.calc(file));
        }
        return callback(null, tinyFile);
      });
    }
  });

  stream.on('error', function(err) {
      log(': error ', util.colors.red(err));
    })
    .on('end', function() {
      let str = '';
      let total = 0;
      let originTotal = 0;
      let ratio;

      COMPRESSED.forEach(function(e) {
        total += e.size;
        originTotal += e.originSize;
      });

      ratio = (parseFloat(total / originTotal, 10).toFixed(4) * 100 || 0) + '%';

      str += ': ' + util.colors.blue('[compress completed] ');
      str += 'skiped: ' + util.colors.red(SKIPPED.length) + ' imgs, ';
      str += 'compressed: ' + util.colors.green(COMPRESSED.length) + ' imgs, ';
      str += 'totalSize: ' + util.colors.green(ratio);
      log(str);

      hasher.write()
    });

  return stream;
}

function Hasher(sigFile) {
  return {
    sigFile: sigFile || false,
    sigs: {},

    calc: function(file, cb) {
      var md5 = crypto.createHash('md5').update(file.contents).digest('hex');

      cb && cb(md5);

      return cb ? this : md5;
    },
    update: function(file, hash) {
      this.changed = true;
      this.sigs[file.path.replace(file.cwd, '')] = hash;

      return this;
    },
    compare: function(file, cb) {
      var md5 = this.calc(file),
        filepath = file.path.replace(file.cwd, ''),
        result = (filepath in this.sigs && md5 === this.sigs[filepath]);

      return cb ? this : {
        match: result,
        hash: md5
      };
    },
    populate: function() {
      var data = false;

      if (this.sigFile) {
        try {
          data = fs.readFileSync(this.sigFile, 'utf-8');
          if (data) data = JSON.parse(data);
        } catch (err) {
          // meh
        }

        if (data) this.sigs = data;
      }

      return this;
    },
    write: function() {
      if (this.changed) {
        try {
          fs.writeFileSync(this.sigFile, JSON.stringify(this.sigs));
        } catch (err) {
          // meh
        }
      }

      return this;
    }
  };
}

function tinypng(file, callback) {
  log(': [tinypng request]', file.relative);

  request({
    url: 'https://tinypng.com/web/shrink',
    method: "post",
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Connection": "keep-alive",
      "Host": "tinypng.com",
      "DNT": 1,
      "Referer": "https://tinypng.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
    },
    body: file.contents
  }, function(error, response, body) {
    var results, filename;

    if (!error) {
      filename = path.basename(file.path);
      results = JSON.parse(body);

      if (results.output && results.output.url) {
        request.get({
          url: results.output.url,
          encoding: null
        }, function(err, res, body) {
          if (err) {
            SKIPPED.push(filename);
            log('[error]: ', filename + ' ' + err);
          } else {
            var output = results.output;

            log(': [compressing]', util.colors.green('Ok ') +
              file.relative +
              util.colors.green(' (' + (output.ratio * 100).toFixed(1) + '%)'));

            COMPRESSED.push({
              name: filename,
              size: output.size,
              ratio: 1 - output.ratio,
              originSize: results.input.size
            });
          }

          callback(err ? null : new Buffer(body));
        });
      } else {
        log('[error]: ', filename + ' ' + results.message);
        callback(null);
      }
    } else {
      SKIPPED.push(filename);
      callback(null);
    }
  });
}

module.exports = tinypngFree;