"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "webdriverMonad", {
  enumerable: true,
  get: function () {
    return _monad.default;
  }
});
Object.defineProperty(exports, "getPrototype", {
  enumerable: true,
  get: function () {
    return _utils.getPrototype;
  }
});
exports.default = void 0;

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _lodash = _interopRequireDefault(require("lodash.merge"));

var _config = require("@wdio/config");

var _monad = _interopRequireDefault(require("./monad"));

var _request = _interopRequireDefault(require("./request"));

var _constants = require("./constants");

var _utils = require("./utils");

var _webdriver = _interopRequireDefault(require("../protocol/webdriver.json"));

var _jsonwp = _interopRequireDefault(require("../protocol/jsonwp.json"));

var _mjsonwp = _interopRequireDefault(require("../protocol/mjsonwp.json"));

var _appium = _interopRequireDefault(require("../protocol/appium.json"));

var _chromium = _interopRequireDefault(require("../protocol/chromium.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class WebDriver {
  static async newSession(options = {}, modifier, userPrototype = {}, commandWrapper) {
    const params = (0, _config.validateConfig)(_constants.DEFAULTS, options);

    if (!options.logLevels || !options.logLevels['webdriver']) {
      _logger.default.setLevel('webdriver', params.logLevel);
    }
    /**
     * the user could have passed in either w3c style or jsonwp style caps
     * and we want to pass both styles to the server, which means we need
     * to check what style the user sent in so we know how to construct the
     * object for the other style
     */


    const [w3cCaps, jsonwpCaps] = params.capabilities && params.capabilities.alwaysMatch
    /**
     * in case W3C compliant capabilities are provided
     */
    ? [params.capabilities, params.capabilities.alwaysMatch]
    /**
     * otherwise assume they passed in jsonwp-style caps (flat object)
     */
    : [{
      alwaysMatch: params.capabilities,
      firstMatch: [{}]
    }, params.capabilities];
    const sessionRequest = new _request.default('POST', '/session', {
      capabilities: w3cCaps,
      // W3C compliant
      desiredCapabilities: jsonwpCaps // JSONWP compliant

    });
    const response = await sessionRequest.makeRequest(params);
    /**
     * save original set of capabilities to allow to request the same session again
     * (e.g. for reloadSession command in WebdriverIO)
     */

    params.requestedCapabilities = {
      w3cCaps,
      jsonwpCaps
      /**
       * save actual receveived session details
       */

    };
    params.capabilities = response.value.capabilities || response.value;
    const environment = (0, _utils.environmentDetector)(params);
    const environmentPrototype = (0, _utils.getEnvironmentVars)(environment);
    const protocolCommands = (0, _utils.getPrototype)(environment);
    const prototype = (0, _lodash.default)(protocolCommands, environmentPrototype, userPrototype);
    const monad = (0, _monad.default)(params, modifier, prototype);
    return monad(response.value.sessionId || response.sessionId, commandWrapper);
  }
  /**
   * allows user to attach to existing sessions
   */


  static attachToSession(options = {}, modifier, userPrototype = {}, commandWrapper) {
    if (typeof options.sessionId !== 'string') {
      throw new Error('sessionId is required to attach to existing session');
    } // logLevel can be undefined in watch mode when SIGINT is called


    if (options.logLevel !== undefined) {
      _logger.default.setLevel('webdriver', options.logLevel);
    }

    options.capabilities = options.capabilities || {};
    options.isW3C = options.isW3C === false ? false : true;
    const environmentPrototype = (0, _utils.getEnvironmentVars)(options);
    const protocolCommands = (0, _utils.getPrototype)(options);
    const prototype = (0, _lodash.default)(protocolCommands, environmentPrototype, userPrototype);
    const monad = (0, _monad.default)(options, modifier, prototype);
    return monad(options.sessionId, commandWrapper);
  }

  static get WebDriver() {
    return WebDriver;
  }

  static get DEFAULTS() {
    return _constants.DEFAULTS;
  }
  /**
   * Protocols
   */


  static get WebDriverProtocol() {
    return _webdriver.default;
  }

  static get JsonWProtocol() {
    return _jsonwp.default;
  }

  static get MJsonWProtocol() {
    return _mjsonwp.default;
  }

  static get AppiumProtocol() {
    return _appium.default;
  }

  static get ChromiumProtocol() {
    return _chromium.default;
  }

}
/**
 * Helper methods consumed by webdriverio package
 */


exports.default = WebDriver;