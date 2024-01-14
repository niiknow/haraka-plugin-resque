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

  # copy our resque.json to /data/config
  cp -R -u -p /1config/resque.json /data/config
fi
