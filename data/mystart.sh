#!/bin/sh
#

cd /etc/haraka
npm install axios || TRUE

sed -i -e 's,^queue/smtp_forward,#queue/smtp_forward,' \
        /etc/haraka/config/plugins

sed -i -e 's,^# tls,tls,' \
        /etc/haraka/config/plugins
grep -qxF 'resque' config/plugins || echo "resque" >> config/plugins

echo $HOSTNAME > /etc/haraka/config/me

# https://stackoverflow.com/questions/10175812/how-to-generate-a-self-signed-ssl-certificate-using-openssl
SSL_DIR="/etc/haraka/config"
HOST=$HOSTNAME

# Generate dummy self-signed certificate.
if [ ! -f $SSL_DIR/tls_cert.pem ] || [ ! -f $SSL_DIR/tls_key.pem ]
then
  echo "Generating dummy SSL certificate..."
  openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -nodes -keyout $SSL_DIR/tls_key.pem -out $SSL_DIR/tls_cert.pem -subj "/CN=$HOST" \
  -addext "subjectAltName=DNS:$HOST,IP:10.0.0.1"
  echo "Complete"
fi

exec /usr/local/bin/haraka -c /etc/haraka
