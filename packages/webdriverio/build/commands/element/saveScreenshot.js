"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = saveScreenshot;

var _fs = _interopRequireDefault(require("fs"));

var _safeBuffer = require("safe-buffer");

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 * Save a screenshot of an element to a PNG file on your OS.
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', function () {
        const elem = $('#someElem');
        elem.saveScreenshot('./some/path/elemScreenshot.png');
    });
 * </example>
 *
 * @alias element.saveScreenshot
 * @param   {String}  filename  path to the generated image (`.png` suffix is required) relative to the execution directory
 * @return  {Buffer}            screenshot buffer
 * @type utility
 *
 */
async function saveScreenshot(filepath) {
  /**
   * type check
   */
  if (typeof filepath !== 'string' || !filepath.endsWith('.png')) {
    throw new Error('saveScreenshot expects a filepath of type string and ".png" file ending');
  }

  const absoluteFilepath = (0, _utils.getAbsoluteFilepath)(filepath);
  (0, _utils.assertDirectoryExists)(absoluteFilepath);
  const screenBuffer = await this.takeElementScreenshot(this.elementId);

  const screenshot = _safeBuffer.Buffer.from(screenBuffer, 'base64');

  _fs.default.writeFileSync(absoluteFilepath, screenshot);

  return screenshot;
}