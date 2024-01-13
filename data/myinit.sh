#!/bin/sh
#

cd /etc/haraka

# initialize data folder
if [ ! -f /data/config/plugins ]; then
  # cp -R -u -p /1defaults/plugins/. /data/plugins
  # cp -R -u -p plugins/. /data/plugins
 
  cp -R -u -p /1defaults/config/. /data/config
  cp -R -u -p config/. /data/config
  cp -R -u -p /1config/resque.ini /data/config
fi
