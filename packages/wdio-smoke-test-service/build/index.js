"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.launcher = exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SmokeService {
  constructor() {
    this.logFile = _fs.default.createWriteStream(_path.default.join(process.cwd(), 'tests', 'helpers', 'service.log'));
  }

  beforeSession() {
    this.logFile.write('beforeSession called\n');
  } // eslint-disable-line no-console


  before() {
    this.logFile.write('before called\n');
  } // eslint-disable-line no-console


  beforeSuite() {
    this.logFile.write('beforeSuite called\n');
  } // eslint-disable-line no-console


  beforeHook() {
    this.logFile.write('beforeHook called\n');
  } // eslint-disable-line no-console


  afterHook() {
    this.logFile.write('afterHook called\n');
  } // eslint-disable-line no-console


  beforeTest() {
    this.logFile.write('beforeTest called\n');
  } // eslint-disable-line no-console


  beforeCommand() {
    this.logFile.write('beforeCommand called\n');
  } // eslint-disable-line no-console


  afterCommand() {
    this.logFile.write('afterCommand called\n');
  } // eslint-disable-line no-console


  afterTest() {
    this.logFile.write('afterTest called\n');
  } // eslint-disable-line no-console


  afterSuite() {
    this.logFile.write('afterSuite called\n');
  } // eslint-disable-line no-console


  after() {
    this.logFile.write('after called\n');
  } // eslint-disable-line no-console


  afterSession() {
    this.logFile.write('afterSession called\n');
  } // eslint-disable-line no-console


}

exports.default = SmokeService;

class SmokeServiceLauncher {
  constructor() {
    this.logFile = _fs.default.createWriteStream(_path.default.join(process.cwd(), 'tests', 'helpers', 'launcher.log'));
  }

  onPrepare() {
    this.logFile.write('onPrepare called\n');
  } // eslint-disable-line no-console


  onComplete() {
    this.logFile.write('onComplete called\n');
  } // eslint-disable-line no-console


}

const launcher = SmokeServiceLauncher;
exports.launcher = launcher;