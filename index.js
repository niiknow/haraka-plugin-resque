'use strict'
const axios = require('axios')
const fs = require('fs')
const path = require('path')

exports.register = function () {
  this.logdebug('register called')
  this.load_resque_ini()
}

exports.load_resque_ini = function () {
  const plugin = this

  plugin.cfg = plugin.config.get('resque.ini', {
    booleans: [
      '+enabled',               // plugin.cfg.main.enabled=true
      '-keep_message',          // plugin.cfg.main.keep_message=false
      '+rcpt_blackhole',        // plugin.cfg.main.rcpt_blackhole=true
      '+feature_section.yes'    // plugin.cfg.feature_section.yes=true
    ]
  }, 
    // This closure is run a few seconds after my_plugin.ini changes
    // Re-run the outer function again
    plugin.load_my_plugin_ini
  )

  plugin.cfg.main.queue_dir ??= 'resque'

  let qDir = plugin.cfg.main.queue_dir

  // perform full path if it's not relative
  if (qDir.substr(0, 1) !== path.sep) {
    qDir = path.join(process.cwd(), path.sep, qDir)
  }

  if (!fs.existsSync(qDir)) {
    fs.mkdirSync(qDir, { recursive: true })
  }

  plugin.qDir = qDir
}

// Hook to add to queue
exports.hook_queue = async function (next, connection) {
  const plugin = this
  const transaction = connection.transaction
  const data = {
    "uuid": transaction.uuid
  }
  const file = path.join(plugin.qDir, transaction.uuid)

  try {
    // create temp file so we can read as string
    const ws = fs.createWriteStream(file)

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve).on('error', reject)
      transaction.message_stream.pipe(ws)
    })
    ws.end() // close the stream
    const eml = fs.readFileSync(file).toString()

    // cleanup file after success
    await fs.promises.unlink(file)

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
    plugin.loginfo(this, `Posting message to: ${url}`)
    await axios.post(url, data, options)
  }
  catch (err) {
    if (err.response) {
      plugin.logerror(plugin, `HTTP error posting message to resque: '${err.response.status}'`)
    } else {
      plugin.logerror(plugin, `Error posting message to resque: '${err}'`)
    }
    // transaction.results.add(this, {err})

    // blackhole this message as deny
    return next(DENYSOFT, '458 – Unable to queue messages for node resque.')
  }

  // transaction.results.add(this, { pass: 'message-queued' })
  // successful POST, send next(OK) implies we blackhole this message from further processing.
  return next(OK)
}

/**
 * Let's pretend we can deliver mail to these recipients.
 * 
 * Solves: "450 I cannot deliver mail for {user@domain}"
 */
exports.hook_rcpt = function(next, connection) {
  const plugin = this

  // continue if blackhole is not configured
  if (! plugin.cfg.main.rcpt_blackhole) {
    return next()
  }

  return next(OK)
}

