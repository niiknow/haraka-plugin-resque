"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_plain_passwd = exports.hook_capabilities = exports.discard = exports.hook_rcpt = exports.do_resque = exports.load_resque_json = exports.register = void 0;
var axios_1 = __importDefault(require("axios"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var OK = 906;
var DENYDISCONNECT = 904;
var DENYSOFTDISCONNECT = 909;
/**
 * Convert stream to string
 *
 * @param {ReadableStream} stream
 */
function streamToString(stream) {
    return __awaiter(this, void 0, void 0, function () {
        var chunks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    chunks = [];
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            stream.on("data", function (chunk) {
                                return chunks.push(Buffer.from(chunk));
                            });
                            stream.on("error", function (err) { return reject(err); });
                            stream.on("end", function () { return resolve(Buffer.concat(chunks).toString("utf8")); });
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * init queue dir
 *
 * @param  {rescue}  plugin
 * @return void
 */
function resqueInitQueueDir(plugin) {
    var _a;
    plugin.loginfo(plugin, 'init queue_dir');
    plugin.cfg.main.queue_dir = (_a = plugin.cfg.main.queue_dir) !== null && _a !== void 0 ? _a : 'resque';
    var qDir = plugin.cfg.main.queue_dir;
    // perform full path if it's not relative
    if (qDir.substr(0, 1) !== path_1.default.sep) {
        qDir = path_1.default.join(process.cwd(), path_1.default.sep, qDir);
    }
    if (!fs_1.default.existsSync(qDir)) {
        fs_1.default.mkdirSync(qDir, { recursive: true });
    }
    plugin.qDir = qDir;
}
/**
 * init users
 *
 * @param  {rescue}  plugin
 * @return void
 */
function resqueInitUsers(plugin) {
    var _a;
    plugin.loginfo(plugin, 'init users');
    var users = (_a = plugin.cfg.users) !== null && _a !== void 0 ? _a : {};
    /*
    Object.keys(users).forEach(key => {
      // default url and apikey
      const user = users[key]
      user.url = user.url ?? plugin.cfg.main.api_key
      user.apikey = user.apikey ?? plugin.cfg.main.apikey
    })*/
    plugin.cfg.users = users;
}
// this will be required in once the plugin is loaded.
function register() {
    var plugin = this;
    plugin.logdebug(plugin, 'register called');
    // this allow us to handle authentication here
    plugin.inherits('auth/auth_base');
    plugin.load_resque_json();
    // based on our debug, queue_outbound is called before queue
    // so we can POST resque, then discard trans inside of queue
    plugin.register_hook('queue_outbound', 'do_resque');
    plugin.register_hook('queue', 'discard');
}
exports.register = register;
/**
 * Method use to load configuration
 */
function load_resque_json() {
    var plugin = this;
    plugin.loginfo(plugin, 'loading config');
    plugin.cfg = plugin.config.get('resque.json', {
        booleans: [
            '+enabled', // plugin.cfg.main.enabled=true
            '-keep_message', // plugin.cfg.main.keep_message=false
            '+rcpt_blackhole', // plugin.cfg.main.rcpt_blackhole=true
        ],
    }, plugin.load_resque_json);
    resqueInitQueueDir(plugin);
    resqueInitUsers(plugin);
}
exports.load_resque_json = load_resque_json;
/**
 * This is the main method of our plugin.
 *
 */
function do_resque(next, connection) {
    return __awaiter(this, void 0, void 0, function () {
        var plugin, transaction, auth, user, postData, filePath, ws_1, eml, emlMap, err_1, api_url, customHeaders, options, err_2, rsp;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    plugin = this;
                    transaction = connection.transaction;
                    auth = (_a = connection.results.get('auth')) === null || _a === void 0 ? void 0 : _a.user;
                    if (!auth) {
                        // auth failed if we don't have the credential
                        return [2 /*return*/, next(DENYDISCONNECT, '5.7.3 Authentication unsuccessful.')];
                    }
                    user = plugin.cfg.users[auth];
                    if (!auth) {
                        // If somehow user get there and we can't find user in config
                        // then it should fail
                        return [2 /*return*/, next(DENYDISCONNECT, '5.3.5 Incorrect authentication data.')];
                    }
                    postData = {
                        uuid: transaction.uuid,
                        'resque-user': auth,
                    };
                    plugin.logdebug(plugin, "Processing transaction '".concat(postData.uuid, " for user '").concat(auth, "'"));
                    filePath = path_1.default.join(plugin.qDir, transaction.uuid);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 5, , 6]);
                    // create temp file so we can read as string
                    plugin.logdebug(plugin, "Creating '".concat(filePath, "'"));
                    ws_1 = fs_1.default.createWriteStream(filePath);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            ws_1.on('finish', resolve).on('error', reject);
                            transaction.message_stream.pipe(ws_1);
                        })];
                case 2:
                    _e.sent();
                    ws_1.end(); // close the stream
                    eml = fs_1.default.readFileSync(filePath).toString();
                    if (!!plugin.cfg.main.keep_message) return [3 /*break*/, 4];
                    // cleanup file after success
                    plugin.logdebug(plugin, "Deleting '".concat(filePath, "'"));
                    return [4 /*yield*/, fs_1.default.promises.unlink(filePath)];
                case 3:
                    _e.sent();
                    _e.label = 4;
                case 4:
                    emlMap = (_b = plugin.cfg.map.message) !== null && _b !== void 0 ? _b : 'eml';
                    // map eml message base on configuration
                    postData[emlMap] = eml;
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _e.sent();
                    plugin.logerror(plugin, "Stream read error: '".concat(err_1, "'"));
                    return [2 /*return*/, next(DENYSOFTDISCONNECT, "458 \u2013 Unable to queue messages for node: '".concat(err_1, "'"))];
                case 6:
                    api_url = (_c = user.api_url) !== null && _c !== void 0 ? _c : plugin.cfg.main.api_url;
                    customHeaders = {
                        accept: 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': (_d = user.api_key) !== null && _d !== void 0 ? _d : plugin.cfg.main.api_key,
                        // fyi, NO need for content length
                    };
                    options = {
                        headers: customHeaders,
                    };
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, 9, , 10]);
                    plugin.logdebug(plugin, "Posting message to: ".concat(api_url));
                    return [4 /*yield*/, axios_1.default.post(api_url, postData, options)];
                case 8:
                    _e.sent();
                    return [3 /*break*/, 10];
                case 9:
                    err_2 = _e.sent();
                    if (err_2.response) {
                        rsp = JSON.stringify(err_2.response.data);
                        plugin.logerror(plugin, "HTTP ".concat(err_2.response.status, " error posting: '").concat(rsp, "'"));
                    }
                    else {
                        plugin.logerror(plugin, "Error posting message to resque: '".concat(err_2, "'"));
                    }
                    // blackhole this message as deny
                    return [2 /*return*/, next(DENYSOFTDISCONNECT, '458 – Unable to queue messages for node resque.')];
                case 10: 
                // successful POST, send next(OK) implies we blackhole this
                // message from downstream processing
                return [2 /*return*/, next(OK)];
            }
        });
    });
}
exports.do_resque = do_resque;
/**
 * Inbound email handling. Set main.rcpt_blackhole=true since
 * we only want to handle outbound email to queue.
 *
 * And let's pretend we can deliver mail to these recipients inbox.
 *
 * Solves: '450 I cannot deliver mail for {user@domain}'
 */
function hook_rcpt(next, connection) {
    var plugin = this;
    if (plugin.cfg.main.rcpt_blackhole) {
        return next(OK);
    }
    // continue if not blackholed
    return next();
}
exports.hook_rcpt = hook_rcpt;
/**
 * Outbound email handling. Since the purpose of this plugin is
 * to simply queue the message, we discard all outbound by default.
 *
 * And let's pretend we sent out mail to outside servers.
 *
 * Solves: Prevent accidentally send out email and thereby getting our
 * server in trouble.
 */
function discard(next, connection) {
    return next(OK);
}
exports.discard = discard;
/**
 * Below is implementing AUTH (auth_method) which is simply
 * copying auth-flat_file: PLAIN,LOGIN,CRAM-MD5
 *
 */
function hook_capabilities(next, connection) {
    var _a, _b;
    var plugin = this;
    if (!connection.remote.is_private && !connection.tls.enabled) {
        connection.logdebug(plugin, 'Auth disabled for insecure public connection.');
        return next();
    }
    var methods = ((_a = plugin.cfg.main) === null || _a === void 0 ? void 0 : _a.auth_methods)
        ? (_b = plugin.cfg.main) === null || _b === void 0 ? void 0 : _b.auth_methods.split(',')
        : null;
    if (methods && methods.length > 0) {
        connection.capabilities.push("AUTH ".concat(methods.join(' ')));
        connection.notes.allowed_auth_methods = methods;
    }
    return next();
}
exports.hook_capabilities = hook_capabilities;
/**
 * Implement to get plain password from configuration and is
 * required by Haraka.
 *
 * Password length must also be greater than 8 characters.
 */
function get_plain_passwd(user, connection, cb) {
    var _a;
    var plugin = this;
    if (plugin.cfg.users[user]) {
        var pw = (_a = plugin.cfg.users[user].password) !== null && _a !== void 0 ? _a : '';
        // password length must be greater than 8 characters
        if (pw && pw.length > 8) {
            return cb(pw);
        }
    }
    return cb();
}
exports.get_plain_passwd = get_plain_passwd;
