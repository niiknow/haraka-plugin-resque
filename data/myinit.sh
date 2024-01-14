#!/bin/sh
#

cd /etc/haraka

# initialize data folder
if [ ! -f /data/config/plugins ]; then
  # cp -R -u -p /1defaults/plugins/. /data/plugins
  # cp -R -u -p plugins/. /data/plugins


  # copy our default config file
  cp -R -u -p /1defaults/config/. /data/config

  # copy existing config over to data config
  cp -R -u -p config/. /data/config

  # copy our resque.ini to /data/config
  cp -R -u -p /1config/resque.ini /data/config
fi

# https://stackoverflow.com/questions/10175812/how-to-generate-a-self-signed-ssl-certificate-using-openssl
SSL_DIR="/data/config"
HOST=$HOSTNAME

# Generate dummy self-signed certificate.
if [ ! -f $SSL_DIR/tls_cert.pem ] || [ ! -f $SSL_DIR/tls_key.pem ]
then
  echo "Generating dummy SSL certificate..."
  openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -nodes -keyout $SSL_DIR/tls_key.pem -out $SSL_DIR/tls_cert.pem -subj "/CN=$HOST" \
  -addext "subjectAltName=DNS:$HOST,DNS:*.$HOST,IP:10.0.0.1"
  echo "Complete"
fi
