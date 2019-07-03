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
 * Save a screenshot of the current browsing context to a PNG file on your OS. Be aware that
 * some browser drivers take screenshots of the whole document (e.g. Geckodriver with Firefox)
 * and others only of the current viewport (e.g. Chromedriver with Chrome).
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', function () {
        browser.saveScreenshot('./some/path/screenshot.png');
    });
 * </example>
 *
 * @alias browser.saveScreenshot
 * @param   {String}  filepath  path to the generated image (`.png` suffix is required) relative to the execution directory
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
  const screenBuffer = await this.takeScreenshot();

  const screenshot = _safeBuffer.Buffer.from(screenBuffer, 'base64');

  _fs.default.writeFileSync(absoluteFilepath, screenshot);

  return screenshot;
}