"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBrowserObject = getBrowserObject;
exports.transformToCharString = transformToCharString;
exports.parseCSS = parseCSS;
exports.checkUnicode = checkUnicode;
exports.findElement = findElement;
exports.findElements = findElements;
exports.verifyArgsAndStripIfElement = verifyArgsAndStripIfElement;
exports.getElementRect = getElementRect;
exports.getAbsoluteFilepath = getAbsoluteFilepath;
exports.assertDirectoryExists = assertDirectoryExists;
exports.validateUrl = validateUrl;
exports.getElementFromResponse = exports.getPrototype = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _cssValue = _interopRequireDefault(require("css-value"));

var _rgb2hex = _interopRequireDefault(require("rgb2hex"));

var _graphemeSplitter = _interopRequireDefault(require("grapheme-splitter"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _lodash = _interopRequireDefault(require("lodash.isobject"));

var _url = require("url");

var _constants = require("./constants");

var _findStrategy = require("./utils/findStrategy");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('webdriverio');
const INVALID_SELECTOR_ERROR = 'selector needs to be typeof `string` or `function`';

const applyScopePrototype = (prototype, scope) => {
  const dir = _path.default.resolve(__dirname, 'commands', scope);

  const files = _fs.default.readdirSync(dir);

  for (let filename of files) {
    const commandName = _path.default.basename(filename, _path.default.extname(filename));

    prototype[commandName] = {
      value: require(_path.default.join(dir, commandName)).default
    };
  }
};
/**
 * enhances objects with element commands
 */


const getPrototype = scope => {
  const prototype = {};
  /**
   * register action commands
   */

  applyScopePrototype(prototype, scope);
  return prototype;
};
/**
 * get element id from WebDriver response
 * @param  {?Object|undefined} res         body object from response or null
 * @return {?string}   element id or null if element couldn't be found
 */


exports.getPrototype = getPrototype;

const getElementFromResponse = res => {
  /**
  * a function selector can return null
  */
  if (!res) {
    return null;
  }
  /**
   * deprecated JSONWireProtocol response
   */


  if (res.ELEMENT) {
    return res.ELEMENT;
  }
  /**
   * W3C WebDriver response
   */


  if (res[_constants.ELEMENT_KEY]) {
    return res[_constants.ELEMENT_KEY];
  }

  return null;
};
/**
 * traverse up the scope chain until browser element was reached
 */


exports.getElementFromResponse = getElementFromResponse;

function getBrowserObject(elem) {
  return elem.parent ? getBrowserObject(elem.parent) : elem;
}
/**
 * transform whatever value is into an array of char strings
 */


function transformToCharString(value) {
  const ret = [];

  if (!Array.isArray(value)) {
    value = [value];
  }

  for (const val of value) {
    if (typeof val === 'string') {
      ret.push(...checkUnicode(val));
    } else if (typeof val === 'number') {
      const entry = `${val}`.split('');
      ret.push(...entry);
    } else if (val && typeof val === 'object') {
      try {
        ret.push(...JSON.stringify(val).split(''));
      } catch (e) {
        /* ignore */
      }
    } else if (typeof val === 'boolean') {
      const entry = val ? 'true'.split('') : 'false'.split('');
      ret.push(...entry);
    }
  }

  return ret;
}

function sanitizeCSS(value) {
  /* istanbul ignore next */
  if (!value) {
    return value;
  }

  return value.trim().replace(/'/g, '').replace(/"/g, '').toLowerCase();
}
/**
 * parse css values to a better format
 * @param  {Object} cssPropertyValue result of WebDriver call
 * @param  {String} cssProperty      name of css property to parse
 * @return {Object}                  parsed css property
 */


function parseCSS(cssPropertyValue, cssProperty) {
  if (!cssPropertyValue) {
    return null;
  }

  let parsedValue = {
    property: cssProperty,
    value: cssPropertyValue.toLowerCase().trim()
  };

  if (parsedValue.value.indexOf('rgb') === 0) {
    /**
     * remove whitespaces in rgb values
     */
    parsedValue.value = parsedValue.value.replace(/\s/g, '');
    /**
     * parse color values
     */

    let color = parsedValue.value;
    parsedValue.parsed = (0, _rgb2hex.default)(parsedValue.value);
    parsedValue.parsed.type = 'color';
    parsedValue.parsed[/[rgba]+/g.exec(color)[0]] = color;
  } else if (parsedValue.property === 'font-family') {
    let font = (0, _cssValue.default)(cssPropertyValue);
    let string = parsedValue.value;
    let value = cssPropertyValue.split(/,/).map(sanitizeCSS);
    parsedValue.value = sanitizeCSS(font[0].value || font[0].string);
    parsedValue.parsed = {
      value,
      type: 'font',
      string
    };
  } else {
    /**
     * parse other css properties
     */
    try {
      parsedValue.parsed = (0, _cssValue.default)(cssPropertyValue);

      if (parsedValue.parsed.length === 1) {
        parsedValue.parsed = parsedValue.parsed[0];
      }

      if (parsedValue.parsed.type && parsedValue.parsed.type === 'number' && parsedValue.parsed.unit === '') {
        parsedValue.value = parsedValue.parsed.value;
      }
    } catch (e) {// TODO improve css-parse lib to handle properties like
      // `-webkit-animation-timing-function :  cubic-bezier(0.25, 0.1, 0.25, 1)
    }
  }

  return parsedValue;
}
/**
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */


function checkUnicode(value) {
  return Object.prototype.hasOwnProperty.call(_constants.UNICODE_CHARACTERS, value) ? [_constants.UNICODE_CHARACTERS[value]] : new _graphemeSplitter.default().splitGraphemes(value);
}

function fetchElementByJSFunction(selector, scope) {
  if (!scope.elementId) {
    return scope.execute(selector);
  }
  /**
   * use a regular function because IE does not understand arrow functions
   */


  const script = function (elem) {
    return selector.call(elem);
  }.toString().replace('selector', `(${selector.toString()})`);

  return getBrowserObject(scope).execute(`return (${script}).apply(null, arguments)`, scope);
}
/**
 * logic to find an element
 */


async function findElement(selector) {
  /**
   * fetch element using regular protocol command
   */
  if (typeof selector === 'string') {
    const {
      using,
      value
    } = (0, _findStrategy.findStrategy)(selector, this.isW3C, this.isMobile);
    return this.elementId ? this.findElementFromElement(this.elementId, using, value) : this.findElement(using, value);
  }
  /**
   * fetch element with JS function
   */


  if (typeof selector === 'function') {
    const notFoundError = new Error(`Function selector "${selector.toString()}" did not return an HTMLElement`);
    let elem = await fetchElementByJSFunction(selector, this);
    elem = Array.isArray(elem) ? elem[0] : elem;
    return getElementFromResponse(elem) ? elem : notFoundError;
  }

  throw new Error(INVALID_SELECTOR_ERROR);
}
/**
 * logic to find a elements
 */


async function findElements(selector) {
  /**
   * fetch element using regular protocol command
   */
  if (typeof selector === 'string') {
    const {
      using,
      value
    } = (0, _findStrategy.findStrategy)(selector, this.isW3C, this.isMobile);
    return this.elementId ? this.findElementsFromElement(this.elementId, using, value) : this.findElements(using, value);
  }
  /**
   * fetch element with JS function
   */


  if (typeof selector === 'function') {
    let elems = await fetchElementByJSFunction(selector, this);
    elems = Array.isArray(elems) ? elems : [elems];
    return elems.filter(elem => elem && getElementFromResponse(elem));
  }

  throw new Error(INVALID_SELECTOR_ERROR);
}
/**
 * Strip element object and return w3c and jsonwp compatible keys
 */


function verifyArgsAndStripIfElement(args) {
  function verify(arg) {
    if ((0, _lodash.default)(arg) && arg.constructor.name === 'Element') {
      if (!arg.elementId) {
        throw new Error(`The element with selector "${arg.selector}" you trying to pass into the execute method wasn't found`);
      }

      return {
        [_constants.ELEMENT_KEY]: arg.elementId,
        ELEMENT: arg.elementId
      };
    }

    return arg;
  }

  return !Array.isArray(args) ? verify(args) : args.map(verify);
}
/**
 * getElementRect
 */


async function getElementRect(scope) {
  const rect = await scope.getElementRect(scope.elementId);
  let defaults = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
    /**
     * getElementRect workaround for Safari 12.0.3
     * if one of [x, y, height, width] is undefined get rect with javascript
     */

  };

  if (Object.keys(defaults).some(key => rect[key] == null)) {
    /* istanbul ignore next */
    const rectJs = await getBrowserObject(scope).execute(function (el) {
      if (!el || !el.getBoundingClientRect) {
        return;
      }

      const {
        left,
        top,
        width,
        height
      } = el.getBoundingClientRect();
      return {
        x: left + this.scrollX,
        y: top + this.scrollY,
        width,
        height
      };
    }, scope); // try set proper value

    Object.keys(defaults).forEach(key => {
      if (rect[key] != null) {
        return;
      }

      if (typeof rectJs[key] === 'number') {
        rect[key] = Math.floor(rectJs[key]);
      } else {
        log.error('getElementRect', {
          rect,
          rectJs,
          key
        });
        throw new Error('Failed to receive element rects via execute command');
      }
    });
  }

  return rect;
}

function getAbsoluteFilepath(filepath) {
  return filepath.startsWith('/') || filepath.startsWith('\\') || filepath.match(/^[a-zA-Z]:\\/) ? filepath : _path.default.join(process.cwd(), filepath);
}
/**
 * check if directory exists
 */


function assertDirectoryExists(filepath) {
  if (!_fs.default.existsSync(_path.default.dirname(filepath))) {
    throw new Error(`directory (${_path.default.dirname(filepath)}) doesn't exist`);
  }
}
/**
 * check if urls are valid and fix them if necessary
 * @param  {string}  url                url to navigate to
 * @param  {Boolean} [retryCheck=false] true if an url was already check and still failed with fix applied
 * @return {string}                     fixed url
 */


function validateUrl(url, origError) {
  try {
    const urlObject = new _url.URL(url);
    return urlObject.href;
  } catch (e) {
    /**
     * if even adding http:// doesn't help, fail with original error
     */
    if (origError) {
      throw origError;
    }

    return validateUrl(`http://${url}`, e);
  }
}