"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _child_process = _interopRequireDefault(require("child_process"));

var _events = _interopRequireDefault(require("events"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _transformStream = _interopRequireDefault(require("./transformStream"));

var _replQueue = _interopRequireDefault(require("./replQueue"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const log = (0, _logger.default)('@wdio/local-runner');
const replQueue = new _replQueue.default();
/**
 * WorkerInstance
 * responsible for spawning a sub process to run the framework in and handle its
 * session lifetime.
 */

class WorkerInstance extends _events.default {
  /**
   * assigns paramters to scope of instance
   * @param  {object}   config      parsed configuration object
   * @param  {string}   cid         capability id (e.g. 0-1)
   * @param  {string}   configFile  path to config file (for sub process to parse)
   * @param  {object}   caps        capability object
   * @param  {string[]} specs       list of paths to test files to run in this worker
   * @param  {object}   server      configuration details about automation backend this session is using
   * @param  {number}   retries     number of retries remaining
   * @param  {object}   execArgv    execution arguments for the test run
   */
  constructor(config, {
    cid,
    configFile,
    caps,
    specs,
    server,
    execArgv,
    retries
  }, stdout, stderr) {
    super();
    this.cid = cid;
    this.config = config;
    this.configFile = configFile;
    this.caps = caps;
    this.specs = specs;
    this.server = server || {};
    this.execArgv = execArgv;
    this.retries = retries;
    this.isBusy = false;
    this.stdout = stdout;
    this.stderr = stderr;
  }
  /**
   * spawns process to kick of wdio-runner
   */


  startProcess() {
    const {
      cid,
      execArgv
    } = this;
    const argv = process.argv.slice(2);
    const runnerEnv = Object.assign(process.env, this.config.runnerEnv, {
      WDIO_WORKER: true
    });

    if (this.config.outputDir) {
      runnerEnv.WDIO_LOG_PATH = _path.default.join(this.config.outputDir, `wdio-${cid}.log`);
    }

    log.info(`Start worker ${cid} with arg: ${argv}`);

    const childProcess = this.childProcess = _child_process.default.fork(_path.default.join(__dirname, 'run.js'), argv, {
      cwd: process.cwd(),
      env: runnerEnv,
      execArgv,
      silent: true
    });

    childProcess.on('message', this._handleMessage.bind(this));
    childProcess.on('error', this._handleError.bind(this));
    childProcess.on('exit', this._handleExit.bind(this));
    /* istanbul ignore if */

    if (!process.env.JEST_WORKER_ID) {
      childProcess.stdout.pipe(new _transformStream.default(cid)).pipe(process.stdout);
      childProcess.stderr.pipe(new _transformStream.default(cid)).pipe(process.stderr);
      process.stdin.pipe(childProcess.stdin);
    }

    return childProcess;
  }

  _handleMessage(payload) {
    const {
      cid,
      childProcess
    } = this;
    /**
     * resolve pending commands
     */

    if (payload.name === 'finisedCommand') {
      this.isBusy = false;
    }
    /**
     * store sessionId and connection data to worker instance
     */


    if (payload.name === 'sessionStarted') {
      if (payload.content.isMultiremote) {
        Object.assign(this, payload.content);
      } else {
        this.sessionId = payload.content.sessionId;
        delete payload.content.sessionId;
        Object.assign(this.server, payload.content);
      }

      return;
    }
    /**
     * handle debug command called within worker process
     */


    if (payload.origin === 'debugger' && payload.name === 'start') {
      replQueue.add(childProcess, _objectSpread({
        prompt: `[${cid}] \u203A `
      }, payload.params), () => this.emit('message', Object.assign(payload, {
        cid
      })), ev => this.emit('message', ev));
      return replQueue.next();
    }
    /**
     * handle debugger results
     */


    if (replQueue.isRunning && payload.origin === 'debugger' && payload.name === 'result') {
      replQueue.runningRepl.onResult(payload.params);
    }

    this.emit('message', Object.assign(payload, {
      cid
    }));
  }

  _handleError(payload) {
    const {
      cid
    } = this;
    this.emit('error', Object.assign(payload, {
      cid
    }));
  }

  _handleExit(exitCode) {
    const {
      cid,
      childProcess,
      specs,
      retries
    } = this;
    /**
     * delete process of worker
     */

    delete this.childProcess;
    this.isBusy = false;
    log.debug(`Runner ${cid} finished with exit code ${exitCode}`);
    this.emit('exit', {
      cid,
      exitCode,
      specs,
      retries
    });
    childProcess.kill('SIGTERM');
  }
  /**
   * sends message to sub process to execute functions in wdio-runner
   * @param  {string} command  method to run in wdio-runner
   * @param  {object} argv     arguments for functions to call
   * @return null
   */


  postMessage(command, argv) {
    const {
      cid,
      configFile,
      caps,
      specs,
      server,
      retries,
      isBusy
    } = this;

    if (isBusy && command !== 'endSession') {
      return log.info(`worker with cid ${cid} already busy and can't take new commands`);
    }
    /**
     * start up process if worker hasn't done yet or if child process
     * closes after running its job
     */


    if (!this.childProcess) {
      this.childProcess = this.startProcess();
    }

    this.childProcess.send({
      cid,
      command,
      configFile,
      argv,
      caps,
      specs,
      server,
      retries
    });
    this.isBusy = true;
  }

}

exports.default = WorkerInstance;