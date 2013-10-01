node-https-websocket-loadbalance-test
=====================================

Repository of various configurations for testing load balancing an https+websockets node server

Check out the full blog post with detailed analysis at http://blog.cloudparty.com/2013/09/30/efficient-load-balancing-and-ssl-termination-for-websockets-and-node-js/

Installation
============
Prerequisites
-------------
node 0.10.x

Some of the configuration files assume this repository has been cloned into
home/ubuntu/loadbalance.  To use other folders, you may need to adjust some
configuration files

AMI on AWS
----------
Used the latest Ubuntu LTS (Precise) AMI

Install required packages, node, etc
```
sudo apt-get install git
sudo apt-get install make
sudo apt-get install g++
git clone https://github.com/Jimbly/node.git
cd node
git checkout railgun
./configure
make
sudo make install
cd
```

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
```
sudo apt-get install apache2
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
make
cd ..
tar xzf httpd-2.4.6.tar.gz
cd httpd-2.4.6
sudo apt-get install libaprutil1-dev
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
3006 stud ssl -> node http port 3002
3007 stud ssl -> haproxy port 3008
3008 HAProxy http (would be live production port 80)
3009 HAProxy https (would be live production port 443)



References
==========
https://www.exratione.com/2013/06/websockets-over-ssl-with-nodejs-and-nginx/
