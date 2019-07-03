"use strict";

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _runner = _interopRequireDefault(require("@wdio/runner"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('@wdio/lambda-runner');

module.exports.run = (event, context, callback) => {
  log.info('Start Lambda function...');
  const runner = new _runner.default();
  /**
   * run test
   */

  runner.run(event).catch(e => {
    log.error(`Failed launching test session: ${e.stack}`);
    callback(e);
    context.fail(e);
  });
  runner.on('exit', failures => {
    log.info('call the callback', failures);
    callback(null, {
      failures
    });
  });
};