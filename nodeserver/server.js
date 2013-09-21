var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var WebSocketServer = require('ws').Server;

// Allow disabling logging for benchmarking
var LOGGING = false;

if (!LOGGING) {
  console.log = function(){};
}

// Utility functions
function ipFromReq(request) {
  var remote_address = request.remote_address;
  // preparse event
  // if (!remote_address && request.preparse_data && request.preparse_data.remoteAddress) {
  //   if (request.client.remoteAddress !== '127.0.0.1') {
  //     // Someone spoofing a HAProxy line?!
  //     console.warn('Spoofed HAProxy PROXY line detected from ', request.client.remoteAddress);
  //   } else {
  //     // If using HAProxy PROXY protocol line with preparse event
  //     remote_address = request.preparse_data.remoteAddress;
  //     remote_port = request.preparse_data.remotePort;
  //     request.intermediate_address = request.client.remoteAddress;
  //     if (!request.intermediate_address && request.client.socket) {
  //       request.intermediate_address = request.client.socket.remoteAddress;
  //     }
  //   }
  // }

  // If using X-Forwarded-For headers from reverse proxy
  // Security note: must do this *only* if we know this request came from a reverse proxy
  // var forwarded_for = request.headers['x-forwarded-for'] || request.socket.__forwarded_for;
  // if (forwarded_for) {
  //   console.warn('X-Forwarded-For ' + forwarded_for + ' ' + request.url + ' :' + request.socket.remotePort);
  //   request.socket.__forwarded_for = forwarded_for;
  // } else {
  //   console.warn('NO X-Forwarded-For for ' + request.url + ' ' + (request.socket && (request.socket.remoteAddress ||
  //                     (request.socket.socket && request.socket.socket.remoteAddress))) + ' '
  //                     + ' :' + request.socket.remotePort);
  // }
  if (!remote_address) {
    remote_address = request.client.remoteAddress;
  }
  if (!remote_address && request.client.socket) {
    remote_address = request.client.socket.remoteAddress;
  }
  if (!remote_address) {
    // Socket disconnected before we got in here, so node won't tell us the
    // address, how rude!
    remote_address = 'disconnected_socket';
  }
  // Cache for later calls
  request.remote_address = remote_address;
  return remote_address;
}


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
  app.use(express.compress());
  app.use(express.static(
    path.join(__dirname, '../data'),
    { maxAge: 86400000 }
  ));
  app.listen(3001);
}());

(function() {
  // caching file server, serve files from memory
  // Not actually efficient, as without E-Tags and cache headers, the browser is
  // going to get the entire file every time, which is not good!  But for the
  // the purpose of benchmarking (never from cache), this is sufficient.
  var cache = {};
  cache['health'] = '1'; // Allow /health to return a success for HAProxy status checking
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

  function cachedFileServer(req, res) {
    var ip = ipFromReq(req);
    console.log(ip + ': ' + req.method + ' ' + req.url);
    var file = path.basename(req.url);
    if (file === '') {
      file = 'index.html';
    }
    var ext = path.extname(file);
    var data;
    if (Object.prototype.hasOwnProperty.call(cache, file)) {
      data = cache[file];
    } else {
      data = primeCache(file);
    }
    var headers = {'Content-Type': 'text/plain'};
    if (!data) {
      res.writeHead(404, headers);
      res.end('File not found: ' + file + '\n');
    } else {
      if (ext === '.html') {
        headers['Content-Type'] = 'text/html';
      }
      res.writeHead(200, headers);
      res.end(data);
    }
  }
  function addWebSocketEcho(server) {
    server.listen(3002);
    // also add a WebSocket echo server to ensure that data is getting proxied correctly.
    var ws_server = new WebSocketServer({ server: server });
    ws_server.on('connection', function(ws) {
      var ip = ipFromReq(ws.upgradeReq);
      console.log(ip + ': New WebSocket connection')
      ws.on('message', function(message) {
        ws.send(message);
      });
    });
  }
  var server = http.createServer(cachedFileServer).listen(3002);
  addWebSocketEcho(server);
  var options = {
    key: fs.readFileSync(path.join(__dirname, '../keys/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../keys/cert.pem'))
  };
  server = https.createServer(options, cachedFileServer).listen(3003);
  addWebSocketEcho(server);
}());
