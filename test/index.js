
// node.js built-in modules
const assert   = require('assert')

// npm modules
const fixtures = require('haraka-test-fixtures')

// start of tests
//    assert: https://nodejs.org/api/assert.html
//    mocha: http://mochajs.org

beforeEach(function (done) {
  this.plugin = new fixtures.plugin('resque')
  done()  // if a test hangs, assure you called done()
})

describe('resque', function () {
  it('loads', function (done) {
    assert.ok(this.plugin)
    done()
  })
})

describe('load_resque_ini', function () {
  it('loads resque.ini from config/resque.ini', function (done) {
    this.plugin.load_resque_ini()
    assert.ok(this.plugin.cfg)
    done()
  })

  it('initializes enabled boolean', function (done) {
    this.plugin.load_resque_ini()
    assert.equal(this.plugin.cfg.main.enabled, true, this.plugin.cfg)
    done()
  })
})

describe('uses text fixtures', function () {
  it('sets up a connection', function (done) {
    this.connection = fixtures.connection.createConnection({})
    assert.ok(this.connection.server)
    done()
  })

  it('sets up a transaction', function (done) {
    this.connection = fixtures.connection.createConnection({})
    this.connection.transaction = fixtures.transaction.createTransaction({})
    // console.log(this.connection.transaction)
    assert.ok(this.connection.transaction.header)
    done()
  })
})