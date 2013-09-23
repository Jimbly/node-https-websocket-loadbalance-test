var HOST = '10.118.241.72'; // AWS internal
//var HOST = '23.22.4.234'; // external

var NUM_REQUESTS = 100;
var CONCURRENCY = 2;

var exec = require('child_process').exec;
var path = require('path');

var ports = [
  [3000, 'http' , 'node_simple'],
  [3001, 'http' , 'node_express'],
  [3002, 'http' , 'node_cached'],
  [3003, 'https', 'ssl_node_cached'],
  [3004, 'http' , 'nginx'],
  [3005, 'https', 'ssl_nginx'],
  [80, 'http' , 'apache', 'loadbalancedata/'],
  [443, 'https', 'ssl_apache', 'loadbalancedata/'],
  [3006, 'https' , 'ssl_stud'],
  [3008, 'http', 'haproxy'],
  [3009, 'https', 'ssl_haproxy'],
];
var files = [
  // 'thumb.jpg',
  'texture.raw',
  // 'mesh.ibo',
  'index.html',
  // 'mesh.cmesh'
];

var fi = 0;
var pi = 0;
function tryPair() {
  var start = Date.now();
  var url = ports[pi][1] + '://' + HOST + ':' + ports[pi][0] + '/' + (ports[pi][3] || '') + files[fi];
  exec(path.join(__dirname, '../httpd-2.4.6/support/ab') + ' -dn ' + NUM_REQUESTS + ' -c ' + CONCURRENCY + ' ' + url,
    function (error, stdout, stderr) {
      var end = Date.now();
      if (error || stderr) {
        console.warn(error, stderr);
        throw error;
      }
      var dt = (end - start) / 1000;
      console.log(dt.toFixed(1) + 's: ' + ports[pi][2] + ' (' + url + ')');
      ++fi;
      if (fi === files.length) {
        fi = 0;
        ++pi;
        if (pi === ports.length) {
          return;
        }
      }
      tryPair();
    }
  );
}

tryPair();
