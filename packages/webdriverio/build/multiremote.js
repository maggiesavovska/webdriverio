"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash.zip"));

var _lodash2 = _interopRequireDefault(require("lodash.merge"));

var _webdriver = require("webdriver");

var _config = require("@wdio/config");

var _middlewares = require("./middlewares");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Multiremote class
 */
class MultiRemote {
  constructor() {
    this.instances = {};
  }
  /**
   * add instance to multibrowser instance
   */


  async addInstance(browserName, client) {
    this.instances[browserName] = await client;
    return this.instances[browserName];
  }
  /**
   * modifier for multibrowser instance
   */


  modifier(wrapperClient) {
    const propertiesObject = {};
    propertiesObject.commandList = {
      value: wrapperClient.commandList
    };
    propertiesObject.options = {
      value: wrapperClient.options
    };

    for (const commandName of wrapperClient.commandList) {
      propertiesObject[commandName] = {
        value: this.commandWrapper(commandName),
        configurable: true
      };
    }

    propertiesObject['__propertiesObject__'] = {
      value: propertiesObject
    };
    this.baseInstance = new MultiRemoteDriver(this.instances, propertiesObject);
    const client = Object.create(this.baseInstance, propertiesObject);
    /**
     * attach instances to wrapper client
     */

    for (const [identifier, instance] of Object.entries(this.instances)) {
      client[identifier] = instance;
    }

    return client;
  }
  /**
   * helper method to generate element objects from results, so that we can call, e.g.
   *
   * ```
   * const elem = $('#elem')
   * elem.getHTML()
   * ```
   *
   * or in case multiremote is used
   *
   * ```
   * const elems = $$('div')
   * elems[0].getHTML()
   * ```
   */


  static elementWrapper(instances, result, propertiesObject) {
    const prototype = (0, _lodash2.default)({}, propertiesObject, (0, _utils.getPrototype)('element'), {
      scope: 'element'
    });
    const element = (0, _webdriver.webdriverMonad)({}, client => {
      /**
       * attach instances to wrapper client
       */
      for (const [i, identifier] of Object.entries(Object.keys(instances))) {
        client[identifier] = result[i];
      }

      client.instances = Object.keys(instances);
      delete client.sessionId;
      return client;
    }, prototype);
    return element(this.sessionId, (0, _middlewares.multiremoteHandler)(_config.wrapCommand));
  }
  /**
   * handle commands for multiremote instances
   */


  commandWrapper(commandName) {
    const instances = this.instances;
    return (0, _config.wrapCommand)(commandName, async function (...args) {
      const result = await Promise.all(Object.entries(instances).map(([, instance]) => instance[commandName](...args)));
      /**
       * return element object to call commands directly
       */

      if (commandName === '$') {
        return MultiRemote.elementWrapper(instances, result, this.__propertiesObject__);
      } else if (commandName === '$$') {
        const zippedResult = (0, _lodash.default)(...result);
        return zippedResult.map(singleResult => MultiRemote.elementWrapper(instances, singleResult, this.__propertiesObject__));
      }

      return result;
    });
  }

}
/**
 * event listener class that propagates events to sub drivers
 */

/* istanbul ignore next */


exports.default = MultiRemote;

class MultiRemoteDriver {
  constructor(instances, propertiesObject) {
    this.instances = Object.keys(instances);
    this.isMultiremote = true;
    this.__propertiesObject__ = propertiesObject;
  }

  on(...args) {
    this.instances.forEach(instanceName => this[instanceName].on(...args));
  }

  once(...args) {
    this.instances.forEach(instanceName => this[instanceName].once(...args));
  }

  emit(...args) {
    this.instances.forEach(instanceName => this[instanceName].emit(...args));
  }

  eventNames(...args) {
    this.instances.forEach(instanceName => this[instanceName].eventNames(...args));
  }

  getMaxListeners() {
    this.instances.forEach(instanceName => this[instanceName].getMaxListeners());
  }

  listenerCount(...args) {
    this.instances.forEach(instanceName => this[instanceName].listenerCount(...args));
  }

  listeners(...args) {
    this.instances.forEach(instanceName => this[instanceName].listeners(...args));
  }

  removeListener(...args) {
    this.instances.forEach(instanceName => this[instanceName].removeListener(...args));
  }

  removeAllListeners(...args) {
    this.instances.forEach(instanceName => this[instanceName].removeAllListeners(...args));
  }

}