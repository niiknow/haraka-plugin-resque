'use strict'
const axios = require('axios')

function streamToString (stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

exports.register = function () {
  this.logdebug("initializing reque");
  this.load_resque_ini()

  // register hooks here. More info at https://haraka.github.io/core/Plugins/
  // this.register_hook('data_post', 'do_stuff_with_message')
}

exports.load_resque_ini = function () {
  const plugin = this

  plugin.cfg = plugin.config.get('resque.ini', {
    booleans: [
      '+enabled',               // plugin.cfg.main.enabled=true
      '-disabled',              // plugin.cfg.main.disabled=false
      '+feature_section.yes'    // plugin.cfg.feature_section.yes=true
    ]
  },
  function () {
    // plugin.load_example_ini()
    this.logdebug("config loaded");
  })
}

// Hook to add to queue
exports.hook_queue = async function (next, connection) {
  const plugin = this
  const transaction = connection.transaction
  const url = plugin.cfg.main.url
  let eml = '';

  try {
    eml = await streamToString(transaction.message_stream)
  }
  catch (err) {
    return next(DENYSOFT, '458 – Unable to queue messages for node; ' . err);
  }

  // https://oxylabs.io/blog/nodejs-fetch-api
  const data = {
    eml
  }
  const postData = JSON.stringify(data)
  const customHeaders = {
    "accept": "application/json",
    "Content-Type": "application/json",
    "x-api-key": plugin.cfg.main.apikey
    // fyi, NO need for content length
  }

  const options = {
    headers: customHeaders
  }

  try {
    const response = await axios.post(url, data, options)
  }
  catch (err) {
    if (err.response) {
      plugin.logdebug(JSON.encode(err.response));
    }

    // blackhole this message as deny
    return next(DENYSOFT, '458 – Unable to queue messages for node resque');
  }

  // successful POST, send next(OK) implies we blackhole this message from further processing.
  return next(OK, "Your message has been resqued.")
}

