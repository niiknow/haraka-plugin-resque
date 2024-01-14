#!/bin/sh
#

cd /etc/haraka
npm install axios || TRUE

sed -i -e 's,^queue/smtp_forward,#queue/smtp_forward,' \
        /etc/haraka/config/plugins

grep -qxF 'resque' config/plugins || echo "resque" >> config/plugins

echo $HOSTNAME > /etc/haraka/config/me

exec /usr/local/bin/haraka -c /etc/haraka
