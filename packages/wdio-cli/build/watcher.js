"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chokidar = _interopRequireDefault(require("chokidar"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _lodash = _interopRequireDefault(require("lodash.pickby"));

var _lodash2 = _interopRequireDefault(require("lodash.flattendeep"));

var _lodash3 = _interopRequireDefault(require("lodash.union"));

var _launcher = _interopRequireDefault(require("./launcher.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('@wdio/cli:watch');

class Watcher {
  constructor(configFile, argv) {
    log.info('Starting launcher in watch mode');
    this.launcher = new _launcher.default(configFile, argv, true);
    this.argv = argv;
    const specs = this.launcher.configParser.getSpecs();
    const capSpecs = this.launcher.isMultiremote ? [] : (0, _lodash3.default)((0, _lodash2.default)(this.launcher.configParser.getCapabilities().map(cap => cap.specs || [])));
    this.specs = [...specs, ...capSpecs];
    this.isRunningTests = false;
  }

  async watch() {
    /**
     * listen on spec changes and rerun specific spec file
     */
    _chokidar.default.watch(this.specs, {
      ignoreInitial: true
    }).on('add', this.getFileListener()).on('change', this.getFileListener());
    /**
     * listen on filesToWatch changes an rerun complete suite
     */


    const {
      filesToWatch
    } = this.launcher.configParser.getConfig();

    if (filesToWatch.length) {
      _chokidar.default.watch(filesToWatch, {
        ignoreInitial: true
      }).on('add', this.getFileListener(false)).on('change', this.getFileListener(false));
    }
    /**
     * run initial test suite
     */


    await this.launcher.run();
    /**
     * clean interface once all worker finish
     */

    const workers = this.getWorkers();
    Object.values(workers).forEach(worker => worker.on('exit', () => {
      /**
       * check if all workers have finished
       */
      if (Object.values(workers).find(w => w.isBusy)) {
        return;
      }

      this.launcher.interface.finalise();
    }));
  }
  /**
   * return file listener callback that calls `run` method
   * @param  {Boolean}  [passOnFile=true]  if true pass on file change as parameter
   * @return {Function}                    chokidar event callback
   */


  getFileListener(passOnFile = true) {
    return spec => this.run(Object.assign({}, this.argv, passOnFile ? {
      spec
    } : {}));
  }
  /**
   * helper method to get workers from worker pool of wdio runner
   * @param  {Function} pickBy             filter by property value (see lodash.pickBy)
   * @param  {Boolean}  includeBusyWorker  don't filter out busy worker (default: false)
   * @return {Object}                      Object with workers, e.g. {'0-0': { ... }}
   */


  getWorkers(pickByFn, includeBusyWorker) {
    let workers = this.launcher.runner.workerPool;

    if (typeof pickByFn === 'function') {
      workers = (0, _lodash.default)(workers, pickByFn);
    }
    /**
     * filter out busy workers, only skip if explicitely desired
     */


    if (!includeBusyWorker) {
      workers = (0, _lodash.default)(workers, worker => !worker.isBusy);
    }

    return workers;
  }
  /**
   * run workers with params
   * @param  {Object} [params={}]  parameters to run the worker with
   */


  run(params = {}) {
    const workers = this.getWorkers(params.spec ? worker => worker.specs.includes(params.spec) : null);
    /**
     * don't do anything if no worker was found
     */

    if (Object.keys(workers).length === 0) {
      return;
    }
    /**
     * update total worker count interface
     * ToDo: this should have a cleaner solution
     */


    this.launcher.interface.totalWorkerCnt = Object.entries(workers).length;
    /**
     * clean up interface
     */

    this.cleanUp();
    /**
     * trigger new run for non busy worker
     */

    for (const [, worker] of Object.entries(workers)) {
      const {
        cid,
        caps,
        specs,
        sessionId
      } = worker;
      const argv = Object.assign({
        sessionId
      }, params);
      worker.postMessage('run', argv);
      this.launcher.interface.emit('job:start', {
        cid,
        caps,
        specs
      });
    }
  }

  cleanUp() {
    this.launcher.interface.setup();
  }

}

exports.default = Watcher;