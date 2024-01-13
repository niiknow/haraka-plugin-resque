
// node.js built-in modules
const assert = require('assert')
const { Readable } = require('stream')

// npm modules
const fixtures = require('haraka-test-fixtures')
const nock = require('nock')
const axios = require('axios')
const getRandomString = () => Math.random().toString(36).substring(4)

// start of tests
//    assert: https://nodejs.org/api/assert.html
//    mocha: http://mochajs.org
const host = 'http://localhost';
axios.defaults.host = host;
axios.defaults.baseURL = host;

beforeEach(function(done) {
  this.plugin = new fixtures.plugin('resque')
  done()  // if a test hangs, assure you called done()
})

describe('resque', function() {
  // this.timeout(10000)
  let plugin, connection

  beforeEach(function() {
    data = Buffer.from(getRandomString(), 'utf8')
    plugin = this.plugin
    plugin.register()
    connection = plugin.connection = fixtures.connection.createConnection({})
    connection.transaction = fixtures.transaction.createTransaction({})
    connection.transaction.uuid = getRandomString()
    connection.transaction.message_stream = Readable.from(data)
  })
/*
  it('hook_queue message stream error', function(done) {
    myStream = connection.transaction.message_stream
    const expected = `458 – Unable to queue messages for node: 'OOPS'`

    plugin.hook_queue((code, msg) => {
      assert.equal(expected, msg)

      // validate code is DENYSOFT
      assert.equal(DENYSOFT, code)
      done()
    }, connection)
    myStream.emit('error', 'OOPS')
    myStream.emit('end')
  })
*/

  it('hook_queue post with error', function(done) {
    nock(host)
      .post('/test')
      .reply(422, 'test data')

    const expected = `458 – Unable to queue messages for node resque.`

    plugin.hook_queue((code, msg) => {
      assert.equal(expected, msg)
      
      // validate code is DENYSOFT
      assert.equal(DENYSOFT, code)
      done()
    }, connection)
  })

  it('hook_queue post with success', function(done) {
    nock(host)
      .post('/test')
      .reply(202, 'test data')

    plugin.hook_queue((code) => {
      // validate code is OK
      assert.equal(OK, code)
      done()
    }, connection)
  })
})

describe('load_resque_ini', function() {
  it('loads resque.ini from config/resque.ini', function(done) {
    this.plugin.load_resque_ini()
    assert.ok(this.plugin.cfg)
    done()
  })

  it('initializes enabled boolean', function(done) {
    this.plugin.load_resque_ini()
    assert.equal(this.plugin.cfg.main.enabled, true, this.plugin.cfg)
    done()
  })
})

describe('uses test fixtures', function() {
  it('sets up a connection', function(done) {
    this.connection = fixtures.connection.createConnection({})
    assert.ok(this.connection.server)
    done()
  })

  it('sets up a transaction', function(done) {
    this.connection = fixtures.connection.createConnection({})
    this.connection.transaction = fixtures.transaction.createTransaction({})
    //console.log(this.connection.transaction)
    assert.ok(this.connection.transaction.header)
    done()
  })
})
