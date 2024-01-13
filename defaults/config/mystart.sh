#!/bin/bash
#

cd /etc/haraka
npm install axios
grep -qxF 'resque' config/plugins || echo "resque" >> config/plugins
