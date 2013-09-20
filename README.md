node-https-websocket-loadbalance-test
=====================================

Repository of various configurations for testing load balancing an https+websockets node server

Installation
============
Prerequisites
-------------
node 0.10.x

Build stuff
-----------

```
cd haproxy-ss-20130902
make TARGET=linux26
cd ../nodeserver
npm install
```

Ports
=====

node application server ports
-----------------------------
3000 dummy implementation (theoretical max speed on the node side)
3001 simple express static file serving app
3002 smarter (for the purpose of benchmarking) static file server with a file cache
