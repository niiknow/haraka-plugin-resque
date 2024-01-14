'use strict'
const axios = require('axios')
const fs = require('fs')
const path = require('path')

exports.register = function () {
  this.inherits('auth/auth_base')
  this.logdebug('register called')
  this.load_resque_json()

  this.register_hook('queue_outbound', 'do_resque');
  this.register_hook('queue', 'discard');
}

/**
 * init queue dir
 *
 * @param  {rescue}  plugin
 * @return void
 */
function resqueInitQueueDir (plugin) {
  plugin.loginfo(plugin, 'init queue_dir')

  plugin.cfg.main.queue_dir = plugin.cfg.main.queue_dir ?? 'resque'

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

/**
 * init users
 *
 * @param  {rescue}  plugin
 * @return void
 */
function resqueInitUsers (plugin) {
  plugin.loginfo(plugin, 'init users')

  const users = plugin.cfg.users ?? {}
  /*
  Object.keys(users).forEach(key => {
    // default url and apikey
    const user = users[key]
    user.url = user.url ?? plugin.cfg.main.api_key
    user.apikey = user.apikey ?? plugin.cfg.main.apikey
  })*/

  plugin.cfg.users = users
}

exports.load_resque_json = function () {
  const plugin = this
  plugin.loginfo(plugin, 'loading config')

  plugin.cfg = plugin.config.get('resque.json', {
    booleans: [
      '+enabled',               // plugin.cfg.main.enabled=true
      '-keep_message',          // plugin.cfg.main.keep_message=false
      '+rcpt_blackhole'         // plugin.cfg.main.rcpt_blackhole=true
    ]
  }, plugin.load_my_plugin_ini)

  resqueInitQueueDir(plugin)
  resqueInitUsers(plugin)
}

// Hook to add to queue
exports.do_resque = async function (next, connection) {
  const plugin = this

  // get current user
  const auth = connection.results.get('auth')?.user
  if (!auth) {
    return next(DENYDISCONNECT, '5.7.3 Authentication unsuccessful.')
  }

  const user = plugin.cfg.users[auth]
  if (!auth) {
    return next(DENYDISCONNECT, '5.3.5 Incorrect authentication data.')
  }

  const transaction = connection.transaction
  const data = {
    "uuid": transaction.uuid,
    "resque-user": auth
  }

  plugin.loginfo(plugin, `Processing transaction '${data.uuid} for user '${auth}'`)

  const file = path.join(plugin.qDir, transaction.uuid)

  try {
    // create temp file so we can read as string
    plugin.loginfo(plugin, `Creating '${file}'`)
    const ws = fs.createWriteStream(file)

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve).on('error', reject)
      transaction.message_stream.pipe(ws)
    })
    ws.end() // close the stream
    const eml = fs.readFileSync(file).toString()

    if (! plugin.cfg.main.keep_message) {
      // cleanup file after success
      plugin.loginfo(plugin, `Deleting '${file}'`)
      await fs.promises.unlink(file)
    }

    if (plugin.cfg.map.message) {
      data[plugin.cfg.map.message] = eml
    }
  }
  catch (err) {
    transaction.results.add(plugin, `Error reading message_stream: '${err}'`)

    return next(DENYSOFT, `458 – Unable to queue messages for node: '${err}'`)
  }

  // https://oxylabs.io/blog/nodejs-fetch-api
  const api_url = user.api_url ?? plugin.cfg.main.api_url

  const customHeaders = {
    "accept": "application/json",
    "Content-Type": "application/json",
    "x-api-key": user.api_key ?? plugin.cfg.main.api_key
    // fyi, NO need for content length
  }

  const options = {
    headers: customHeaders
  }

  try {
    plugin.loginfo(plugin, `Posting message to: ${api_url}`)
    await axios.post(api_url, data, options)
  }
  catch (err) {
    if (err.response) {
      const rsp = JSON.stringify(err.response.data)
      plugin.logerror(plugin, `HTTP error posting message to resque: '${rsp}'`)
    }
    else {
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
 * Inbound email handling. Set main.rcpt_blackhole=true since
 * we only want to handle outbound email to queue.
 *
 * And let's pretend we can deliver mail to these recipients inbox.
 *
 * Solves: "450 I cannot deliver mail for {user@domain}"
 */
exports.hook_rcpt = function (next, connection) {
  const plugin = this

  // continue if blackhole is not configured
  if (! plugin.cfg.main.rcpt_blackhole) {
    return next()
  }

  return next(OK)
}

/**
 * Outbound email handling. Since the purpose of this plugin is
 * to simply queue the message, we discard all outbound by default.
 *
 * And let's pretend we sent out mail to outside servers.
 *
 * Solves: Prevent accidentally send out email and thereby getting our
 * server in trouble.
 */
exports.discard = function (next, connection) {
  return next(OK)
}

/**
 * Below is implementing AUTH which is a copy of auth flat_file
 * auth_method: PLAIN,LOGIN,CRAM-MD5
 *
 */
exports.hook_capabilities = function (next, connection) {
  if (!connection.remote.is_private && !connection.tls.enabled) {
    connection.logdebug(this, "Auth disabled for insecure public connection.")
    return next()
  }

  const methods = this.cfg.main?.auth_methods ? this.cfg.main?.auth_methods.split(',') : null
  if (methods && methods.length > 0) {
    connection.capabilities.push(`AUTH ${methods.join(' ')}`)
    connection.notes.allowed_auth_methods = methods
  }

  return next()
}

/**
 * Implement to get plain password.
 *
 * Password length must also be greater than 8 characters.
 */
exports.get_plain_passwd = function (user, connection, cb) {
  if (this.cfg.users[user]) {
    const pw = this.cfg.users[user].password ?? ''
    if (pw && pw.length > 8) {
      return cb(pw)
    }
  }

  return cb()
}

