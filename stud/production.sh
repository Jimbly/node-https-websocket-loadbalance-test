#On node servers:
./stud --daemon -b 127.0.0.1,3002 -f *,3006 --ssl --proxy-proxy -q -n 2 -u nobody ../keys/combined.pem
#On proxy
./stud --daemon -b 127.0.0.1,3008 -f *,3007 --ssl -q -n 2 -u nobody ../keys/combined.pem
