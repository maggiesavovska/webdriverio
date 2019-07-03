"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _nock = _interopRequireDefault(require("nock"));

var _webdriver = _interopRequireDefault(require("webdriver"));

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const protocols = [_webdriver.default.JsonWProtocol, _webdriver.default.WebDriverProtocol, _webdriver.default.MJsonWProtocol, _webdriver.default.AppiumProtocol, _webdriver.default.ChromiumProtocol];
const protocolFlattened = new Map();

for (const protocol of protocols) {
  for (const [endpoint, methods] of Object.entries(protocol)) {
    for (const [method, commandData] of Object.entries(methods)) {
      protocolFlattened.set(commandData.command, {
        method,
        endpoint,
        commandData
      });
    }
  }
}

class WebDriverMock {
  constructor(host = 'localhost', port = 4444, path = '/') {
    this.path = path;
    this.scope = (0, _nock.default)(`http://${host}:${port}`, {
      'encodedQueryParams': true
    });
    this.command = new Proxy({}, {
      get: this.get.bind(this)
    });
  }

  get(obj, commandName) {
    const {
      method,
      endpoint,
      commandData
    } = protocolFlattened.get(commandName);
    return (...args) => {
      let urlPath = _path.default.join(this.path, endpoint).replace(':sessionId', _constants.SESSION_ID);

      for (const [i, param] of Object.entries(commandData.variables || [])) {
        urlPath = urlPath.replace(`:${param.name}`, args[i]);
      }

      if (method === 'POST') {
        return this.scope[method.toLowerCase()](urlPath, body => {
          for (const param of commandData.parameters) {
            /**
             * check if parameter was set
             */
            if (!body[param.name]) {
              return false;
            }
            /**
             * check if parameter has correct type
             */


            if (param.required && typeof body[param.name] === 'undefined') {
              return false;
            }
          }
          /**
           * all parameters are valid
           */


          return true;
        });
      }

      return this.scope[method.toLowerCase()](urlPath);
    };
  }

}

exports.default = WebDriverMock;