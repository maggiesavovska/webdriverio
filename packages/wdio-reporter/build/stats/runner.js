"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _runnable = _interopRequireDefault(require("./runnable"));

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Class to capture statistics about a test run. A test run is a single instance that
 * runs one or more spec files
 */
class RunnerStats extends _runnable.default {
  constructor(runner) {
    super('runner');
    this.cid = runner.cid;
    this.capabilities = runner.capabilities;
    this.sanitizedCapabilities = (0, _utils.sanitizeCaps)(runner.capabilities);
    this.config = runner.config;
    this.specs = runner.specs;
    this.sessionId = runner.sessionId;
    this.isMultiremote = runner.isMultiremote;
    this.retry = runner.retry;
  }

}

exports.default = RunnerStats;