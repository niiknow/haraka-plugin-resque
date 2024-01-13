'use strict'
const axios = require('axios')

function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

exports.register = function () {
  this.logdebug("initializing resque.")
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
    plugin.logdebug("resque config loaded.");
  })
}

// Hook to add to queue
exports.hook_queue = async function (next, connection) {
  const plugin = this
  const transaction = connection.transaction
  const data = {
    "uuid": transaction.uuid
  }

  try {
    const eml = await streamToString(transaction.message_stream)

    if (plugin.cfg.map.message) {
      data[plugin.cfg.map.message] = eml
    }
  }
  catch (err) {
    transaction.results.add(plugin, `Error reading message_stream: '${err}'`)

    return next(DENYSOFT, `458 – Unable to queue messages for node: '${err}'`)
  }

  // https://oxylabs.io/blog/nodejs-fetch-api
  
  const url = plugin.cfg.main.url

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
    transaction.loginfo(this, 'Posting message to resque.')
    await axios.post(url, data, options)
  }
  catch (err) {
    if (err.response) {
      transaction.logerror(plugin, `HTTP error posting message to resque: '${err.response.status}'`)
    } else {
      transaction.logerror(plugin, `Error posting message to resque: '${err}'`)
    }
    transaction.results.add(this, {err})

    // blackhole this message as deny
    return next(DENYSOFT, '458 – Unable to queue messages for node resque.')
  }

  transaction.results.add(this, { pass: 'message-queued' })
  // successful POST, send next(OK) implies we blackhole this message from further processing.
  return next(OK)
}

