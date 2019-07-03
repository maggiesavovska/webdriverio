"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.multiremote = exports.attach = exports.remote = void 0;

var _path = _interopRequireDefault(require("path"));

var _webdriver = _interopRequireDefault(require("webdriver"));

var _config = require("@wdio/config");

var _multiremote = _interopRequireDefault(require("./multiremote"));

var _constants = require("./constants");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Capability names that are defined in the W3C spec.
const W3C_CAPABILITY_NAMES = new Set(['acceptInsecureCerts', 'browserName', 'platformName', 'browserVersion', 'name', 'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior']);

function filterNonW3CCaps(capabilities) {
  let newCaps = JSON.parse(JSON.stringify(capabilities));

  for (let k of Object.keys(newCaps)) {
    // Any key containing a colon is a vendor-prefixed capability.
    if (!(W3C_CAPABILITY_NAMES.has(k) || k.indexOf(':') >= 0)) {
      delete newCaps[k];
    }
  }

  return newCaps;
}
/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */


const remote = async function (params = {}, remoteModifier) {
  const config = (0, _config.validateConfig)(_constants.WDIO_DEFAULTS, params);

  const modifier = (client, options) => {
    if (typeof remoteModifier === 'function') {
      client = remoteModifier(client, Object.assign(options, config));
    }

    Object.assign(options, config);
    return client;
  };

  if (params.user && params.key) {
    params = Object.assign({}, (0, _config.detectBackend)(params), params);
  }

  const myAPIName = params.capabilities.browser_api_name;
  params.capabilities = filterNonW3CCaps(params.capabilities);
  params.capabilities.browser_api_name = myAPIName;

  if (params.outputDir) {
    process.env.WDIO_LOG_PATH = _path.default.join(params.outputDir, 'wdio.log');
  }

  const prototype = (0, _utils.getPrototype)('browser');
  const instance = await _webdriver.default.newSession(params, modifier, prototype, _config.wrapCommand);
  /**
   * we need to overwrite the original addCommand and overwriteCommand
   * in order to wrap the function within Fibers
   */

  const origAddCommand = instance.addCommand.bind(instance);

  instance.addCommand = (name, fn, attachToElement) => origAddCommand(name, (0, _config.runFnInFiberContext)(fn), attachToElement);

  const origOverwriteCommand = instance.overwriteCommand.bind(instance);

  instance.overwriteCommand = (name, fn, attachToElement) => origOverwriteCommand(name, (0, _config.runFnInFiberContext)(fn), attachToElement);

  return instance;
};

exports.remote = remote;

const attach = function (params) {
  const prototype = (0, _utils.getPrototype)('browser');
  return _webdriver.default.attachToSession(params, null, prototype, _config.wrapCommand);
};

exports.attach = attach;

const multiremote = async function (params = {}) {
  const multibrowser = new _multiremote.default();
  const browserNames = Object.keys(params);
  /**
   * create all instance sessions
   */

  await Promise.all(browserNames.map(browserName => {
    const config = (0, _config.validateConfig)(_constants.WDIO_DEFAULTS, params[browserName]);

    const modifier = (client, options) => {
      Object.assign(options, config);
      return client;
    };

    const prototype = (0, _utils.getPrototype)('browser');

    const instance = _webdriver.default.newSession(params[browserName], modifier, prototype, _config.wrapCommand);

    return multibrowser.addInstance(browserName, instance);
  }));
  /**
   * use attachToSession capability to wrap instances around blank pod
   */

  const prototype = (0, _utils.getPrototype)('browser');
  const sessionParams = {
    sessionId: '',
    isW3C: multibrowser.instances[browserNames[0]].isW3C,
    logLevel: multibrowser.instances[browserNames[0]].options.logLevel
  };

  const driver = _webdriver.default.attachToSession(sessionParams, multibrowser.modifier.bind(multibrowser), prototype, _config.wrapCommand);
  /**
   * in order to get custom command overwritten or added to multiremote instance
   * we need to pass in the prototype of the multibrowser
   */


  const origAddCommand = driver.addCommand.bind(driver);

  driver.addCommand = (name, fn, attachToElement) => {
    origAddCommand(name, (0, _config.runFnInFiberContext)(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances);
  };

  const origOverwriteCommand = driver.overwriteCommand.bind(driver);

  driver.overwriteCommand = (name, fn, attachToElement) => {
    origOverwriteCommand(name, (0, _config.runFnInFiberContext)(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances);
  };

  return driver;
};

exports.multiremote = multiremote;