"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = saveRecordingScreen;

var _fs = _interopRequireDefault(require("fs"));

var _safeBuffer = require("safe-buffer");

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 * Appium only. Save a video started by startRecordingScreen command to file.
 * See [Appium docs](http://appium.io/docs/en/commands/device/recording-screen/start-recording-screen/)
 *
 * <example>
    :saveRecordingScreen.js
    it('should save a video', () => {
        browser.startRecordingScreen();
        $('~BUTTON').click();
        browser.saveRecordingScreen('./some/path/video.mp4');
    });
 * </example>
 *
 * @alias browser.saveRecordingScreen
 * @param   {String}  filepath  full or relative to the execution directory path to the generated video
 * @return  {Buffer}            video buffer
 * @type utility
 *
 */
async function saveRecordingScreen(filepath) {
  /**
   * type check
   */
  if (typeof filepath !== 'string') {
    throw new Error('saveRecordingScreen expects a filepath');
  }

  const absoluteFilepath = (0, _utils.getAbsoluteFilepath)(filepath);
  (0, _utils.assertDirectoryExists)(absoluteFilepath);
  const videoBuffer = await this.stopRecordingScreen();

  const video = _safeBuffer.Buffer.from(videoBuffer, 'base64');

  _fs.default.writeFileSync(absoluteFilepath, video);

  return video;
}