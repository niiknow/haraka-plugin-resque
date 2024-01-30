'use strict'
const axios = require('axios')
const fs = require('fs')
const path = require('path')

exports.register = function () {
  this.logdebug(this, 'register called')

  // this allow us to handle authentication here
  this.inherits('auth/auth_base')
  this.load_resque_json()

  // based on our debug, queue_outbound is called before queue
  // so we can POST resque, then discard trans inside of queue
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

/**
 * Method use to load configuration
 *
 * @return void
 */
exports.load_resque_json = function () {
  const plugin = this
  plugin.loginfo(plugin, 'loading config')

  plugin.cfg = plugin.config.get('resque.json', {
    booleans: [
      '+enabled',               // plugin.cfg.main.enabled=true
      '-keep_message',          // plugin.cfg.main.keep_message=false
      '+rcpt_blackhole'         // plugin.cfg.main.rcpt_blackhole=true
    ]
  }, plugin.load_resque_json)

  resqueInitQueueDir(plugin)
  resqueInitUsers(plugin)
}

/**
 * This is the main method of our plugin.
 *
 */
exports.do_resque = async function (next, connection) {
  const plugin = this
  const transaction = connection.transaction

  // get current user
  const auth = connection.results.get('auth')?.user
  if (!auth) {
    // auth failed if we don't have the credential
    return next(DENYDISCONNECT, '5.7.3 Authentication unsuccessful.')
  }

  const user = plugin.cfg.users[auth]
  if (!auth) {
    // If somehow user get there and we can't find user in config
    // then it should fail
    return next(DENYDISCONNECT, '5.3.5 Incorrect authentication data.')
  }

  // proceed in prepping post data
  const postData = {
    "uuid": transaction.uuid,
    "resque-user": auth
  }

  plugin.logdebug(plugin, `Processing transaction '${postData.uuid} for user '${auth}'`)

  const filePath = path.join(plugin.qDir, transaction.uuid)

  try {
    // create temp file so we can read as string
    plugin.logdebug(plugin, `Creating '${filePath}'`)
    const ws = fs.createWriteStream(filePath)

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve).on('error', reject)
      transaction.message_stream.pipe(ws)
    })
    ws.end() // close the stream

    const eml = fs.readFileSync(filePath).toString()

    if (! plugin.cfg.main.keep_message) {
      // cleanup file after success
      plugin.logdebug(plugin, `Deleting '${filePath}'`)
      await fs.promises.unlink(filePath)
    }

    // map eml message base on configuration
    if (plugin.cfg.map.message) {
      postData[plugin.cfg.map.message] = eml
    }
  }
  catch (err) {
    plugin.logerror(plugin, `Stream read error: '${err}'`)
    return next(DENYSOFT, `458 – Unable to queue messages for node: '${err}'`)
  }

  // fallback main api_url if user doesn't have one
  const api_url = user.api_url ?? plugin.cfg.main.api_url

  // initialize our custom POST header
  const customHeaders = {
    "accept": "application/json",
    "Content-Type": "application/json",
    "x-api-key": user.api_key ?? plugin.cfg.main.api_key
    // fyi, NO need for content length
  }

  // build axios options
  const options = {
    headers: customHeaders
  }

  try {
    plugin.logdebug(plugin, `Posting message to: ${api_url}`)
    await axios.post(api_url, postData, options)
  }
  catch (err) {
    if (err.response) {
      const rsp = JSON.stringify(err.response.data)
      plugin.logerror(plugin, `HTTP ${err.response.status} error posting: '${rsp}'`)
    }
    else {
      plugin.logerror(plugin, `Error posting message to resque: '${err}'`)
    }

    // blackhole this message as deny
    return next(DENYSOFT, '458 – Unable to queue messages for node resque.')
  }

  // successful POST, send next(OK) implies we blackhole this
  // message from downstream processing
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
 * Implement to get plain password from configuration and is
 * required by Haraka.
 *
 * Password length must also be greater than 8 characters.
 */
exports.get_plain_passwd = function (user, connection, cb) {
  if (this.cfg.users[user]) {
    const pw = this.cfg.users[user].password ?? ''

    // password length must be greater than 8 characters
    if (pw && pw.length > 8) {
      return cb(pw)
    }
  }

  return cb()
}

