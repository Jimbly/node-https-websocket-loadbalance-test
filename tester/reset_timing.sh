#!/bin/sh
sudo ps auwx | grep -E nginx\|apache2\|node\|haproxy\|stud
sudo service apache2 restart
sudo service nginx restart
sudo killall stud
cd ~/loadbalance/stud
./start.sh
cd ~/loadbalance/haproxy-ss-20130902
sudo killall haproxy
./start.sh
cd ~/loadbalance/nodeserver
sudo killall node
node server.js &
cd ~/loadbalance/tester
