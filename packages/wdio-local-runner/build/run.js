"use strict";

var _asyncExitHook = _interopRequireDefault(require("async-exit-hook"));

var _runner = _interopRequireDefault(require("@wdio/runner"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _constants = require("./constants");

var _context;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('@wdio/local-runner');
const runner = new _runner.default();
runner.on('exit', (_context = process).exit.bind(_context));
runner.on('error', ({
  name,
  message,
  stack
}) => process.send({
  origin: 'worker',
  name: 'error',
  content: {
    name,
    message,
    stack
  }
}));
process.on('message', m => {
  if (!m || !m.command) {
    return log.info('Ignore message for worker:', m);
  }

  log.info(`Run worker command: ${m.command}`);
  runner[m.command](m).then(result => process.send({
    origin: 'worker',
    name: 'finisedCommand',
    content: {
      command: m.command,
      result
    }
  }), e => {
    log.error(`Failed launching test session: ${e.stack}`);
    process.exit(1);
  });
});
/**
 * catch sigint messages as they are handled by main process
 */

(0, _asyncExitHook.default)(callback => {
  if (!callback) {
    return;
  }

  runner.sigintWasCalled = true;
  log.info(`Received SIGINT, giving process ${_constants.SHUTDOWN_TIMEOUT}ms to shutdown gracefully`);
  setTimeout(callback, _constants.SHUTDOWN_TIMEOUT);
});