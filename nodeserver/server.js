var path = require('path');
var http = require('http');
var fs = require('fs');
var express = require('express');


(function() {
  // Trivial server (theoretical maximum fastest response on node.js)
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><head><title>Test</title></head><body>'
      + 'Hello, world.'
      + '</body></html>'
    );
  }).listen(3000);
}());


(function() {
  // Simple express file server (slower, no disk caching other than the OS's
  // layer)
  var app = express();
  if (!'express') {
    app.use(express.compress());
    app.use(express.static(
      path.join(__dirname, '../data'),
      { maxAge: 86400000 }
    ));
    app.listen(3001);
  }
}());

(function() {
  // caching file server, serve files from memory
  // Not actually efficient, as without E-Tags and cache headers, the browser is
  // going to get the entire file every time, which is not good!  But for the
  // the purpose of benchmarking (never from cache), this is sufficient.
  var cache = {};
  function primeCache(file) {
    try {
      var data = cache[file] = fs.readFileSync(
        path.join(__dirname, '../data/', file)
      );
      console.log('Filled cache for file: ' + file);
      return data;
    } catch (e) {
      console.log('File not found: ' + file);
      return cache[file] = null;
    }
  }
  // Prime the cache early for the things we'll be benchmarking so the first benchmark is not slower than the rest
  // This also primes the OS disk cache for the express.static instance above to be fair!
  ['thumb.jpg', 'texture.raw', 'mesh.ibo', 'index.html', 'mesh.cmesh']
    .forEach(primeCache);
  http.createServer(function (req, res) {
    var file = path.basename(req.url);
    if (file === '/') {
      file = '/index.html';
    }
    var ext = path.extname(file);
    var data;
    if (Object.prototype.hasOwnProperty.call(cache, file)) {
      data = cache[file];
    } else {
      data = primeCache(file);
    }
    if (!data) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found: ' + file + '\n');
    } else {
      var headers = {'Content-Type': 'text/plain'};
      if (ext === '.html') {
        headers['Content-Type'] = 'text/html';
      }
      res.writeHead(200, headers);
      res.end(data);
    }
  }).listen(3002);
}());


