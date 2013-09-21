node-https-websocket-loadbalance-test
=====================================

Repository of various configurations for testing load balancing an https+websockets node server

Installation
============
Prerequisites
-------------
node 0.10.x

Some of the configuration files assume this repository has been cloned into
home/jimb/loadbalance.  To use other folders, you may need to adjust some
configuration files


nginx
-----
On Ubuntu, I installed nginx 1.4.1-1ppa1~precise this way:
```
sudo apt-get install python-software-properties
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt-get install nginx
cd /etc/nginx/sites-enabled
sudo rm default
sudo ln -s ~/loadbalance/nginx/default
(note: this config file has some absolute paths to the install directory)
```

Apache
------
Assuming Apache installed, but no existing SSL setup
```
cd ~/loadbalance
sudo mkdir /etc/apache2/ssl
sudo cp keys/* /etc/apache2/ssl
sudo a2enmod ssl
sudo nano /etc/apache2/sites-enabled/000-default
  Add duplicate the VirtualHost block and change it to be :443 and add these lines:
    SSLEngine on
    SSLCertificateFile /etc/apache2/ssl/cert.pem
    SSLCertificateKeyFile /etc/apache2/ssl/key.pem
sudo ln -s ~/loadbalance/data /var/www/loadbalancedata
sudo apachectl restart
```

Build stuff
-----------
```
cd ~/loadbalance
cd haproxy-ss-20130902
make TARGET=linux26
cd ../nodeserver
npm install
cd ../stud
sudo apt-get install libev-dev
sudo apt-get install libev4
make
cd ..
tar xzf httpd-2.4.6.tar.gz
cd httpd-2.4.6
sudo apt-get install libaprutil1-dev
sudo apt-get install libaprutil1
./configure
make
```

Ports
=====

node application server ports
-----------------------------
3000 dummy implementation (theoretical max speed on the node side)
3001 simple express static file serving app
3002 smarter (for the purpose of benchmarking) static file server with a file cache and a WebSocket echo server
3003 https with the same as 3002

nginx server ports
------------------
3004 http serving static files
3005 https serving static files

apache server ports
-------------------
80 http, with the test data symlinked to /loadbalancedata/
443 http, with the test data symlinked to /loadbalancedata/

other
----
3006 stud



References
==========
https://www.exratione.com/2013/06/websockets-over-ssl-with-nodejs-and-nginx/
