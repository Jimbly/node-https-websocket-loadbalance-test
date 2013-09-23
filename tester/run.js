var HOST = '10.118.241.72'; // AWS internal
//var HOST = '23.22.4.234'; // external

var NUM_REQUESTS = 5000;
var CONCURRENCY = 10;
var DO_PAUSE = true;

var exec = require('child_process').exec;
var path = require('path');
var readline = require('readline');

var rl = readline.createInterface({input: process.stdin, output: process.stdout});

function pause(next) {
  rl.question("Press enter to continue. ", function(answer) {
    next();
  });
}

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
  'mesh.ibo',
  'index.html',
  'thumb.jpg',
  'mesh.cmesh',
  'texture.raw',
];

console.log('RUNNING TEST N=' + NUM_REQUESTS + ', C=' + CONCURRENCY);

var fi = 0;
var pi = 0;
function tryPair() {
  var start = Date.now();
  var prog = path.join(__dirname, '../httpd-2.4.6/support/ab') + ' -qdn ' + NUM_REQUESTS + ' -c ' + CONCURRENCY;
  var url = ports[pi][1] + '://' + HOST + ':' + ports[pi][0] + '/' + (ports[pi][3] || '') + files[fi];
  exec(prog + ' ' + url,
    function (error, stdout, stderr) {
      var end = Date.now();
      if (error || stderr) {
        console.warn(error, stderr);
        throw error;
      }
      var dt = (end - start) / 1000;
      console.log(('   ' + dt.toFixed(3)).slice(-7) + 's ' + ports[pi][2] + ' (' + url + ')');
      var do_pause = false;
      ++fi;
      if (fi === files.length) {
        do_pause = DO_PAUSE;
        fi = 0;
        ++pi;
        if (pi === ports.length) {
          return;
        }
      }
      if (do_pause) {
        pause(tryPair);
      } else {
        tryPair();
      }
    }
  );
}

tryPair();
