"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _glob = _interopRequireDefault(require("glob"));

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _utils = require("../utils");

var _constants = require("../constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('@wdio/config:ConfigParser');
const MERGE_OPTIONS = {
  clone: false
};

class ConfigParser {
  constructor() {
    this._config = _constants.DEFAULT_CONFIGS;
    this._capabilities = [];
  }
  /**
   * merges config file with default values
   * @param {String} filename path of file relative to current directory
   */


  addConfigFile(filename) {
    if (typeof filename !== 'string') {
      throw new Error('addConfigFile requires filepath');
    }

    var filePath = _path.default.resolve(process.cwd(), filename);

    try {
      /**
       * clone the original config
       */
      var fileConfig = (0, _deepmerge.default)(require(filePath).config, {}, MERGE_OPTIONS);
      /**
       * merge capabilities
       */

      const defaultTo = Array.isArray(this._capabilities) ? [] : {};
      this._capabilities = (0, _deepmerge.default)(this._capabilities, fileConfig.capabilities || defaultTo, MERGE_OPTIONS);
      delete fileConfig.capabilities;
      /**
       * Add hooks from the file config and remove them from file config object to avoid
       * complications when using merge function
       */

      this.addService(fileConfig);

      for (let hookName of _constants.SUPPORTED_HOOKS) {
        delete fileConfig[hookName];
      }

      this._config = (0, _deepmerge.default)(this._config, fileConfig, MERGE_OPTIONS);
      /**
       * For Sauce Labs RDC we need to determine if the config file has a `testobject_api_key`
       * If so, we need to provide a boolean to the `detectBackend` to set the correct hostname
       *
       * NOTE: This will not work for multi remote
       */

      const isRDC = Array.isArray(this._capabilities) && this._capabilities.some(capability => 'testobject_api_key' in capability);
      /**
       * detect Selenium backend
       */


      this._config = (0, _deepmerge.default)((0, _utils.detectBackend)(this._config, isRDC), this._config, MERGE_OPTIONS);
    } catch (e) {
      log.error(`Failed loading configuration file: ${filePath}:`, e.message);
      throw e;
    }
  }
  /**
   * merge external object with config object
   * @param  {Object} object  desired object to merge into the config object
   */


  merge(object = {}) {
    this._config = (0, _deepmerge.default)(this._config, object, MERGE_OPTIONS);
    let spec = Array.isArray(object.spec) ? object.spec : [];
    let exclude = Array.isArray(object.exclude) ? object.exclude : [];
    /**
     * overwrite config specs that got piped into the wdio command
     */

    if (object.specs && object.specs.length > 0) {
      this._config.specs = object.specs;
    } else if (object.exclude && object.exclude.length > 0) {
      this._config.exclude = object.exclude;
    }
    /**
     * merge capabilities
     */


    const defaultTo = Array.isArray(this._capabilities) ? [] : {};
    this._capabilities = (0, _deepmerge.default)(this._capabilities, this._config.capabilities || defaultTo, MERGE_OPTIONS);
    /**
     * run single spec file only, regardless of multiple-spec specification
     */

    if (spec.length > 0) {
      this._config.specs = [...this.setFilePathToFilterOptions(spec, this._config.specs)];
    }

    if (exclude.length > 0) {
      this._config.exclude = [...this.setFilePathToFilterOptions(exclude, this._config.exclude)];
    }
    /**
     * user and key could get added via cli arguments so we need to detect again
     * Note: cli arguments are on the right and overwrite config
     * if host and port are default, remove them to get new values
     */


    let defaultBackend = (0, _utils.detectBackend)({});

    if (this._config.hostname === defaultBackend.hostname && this._config.port === defaultBackend.port && this._config.protocol === defaultBackend.protocol) {
      delete this._config.hostname;
      delete this._config.port;
      delete this._config.protocol;
    }

    this._config = (0, _deepmerge.default)((0, _utils.detectBackend)(this._config), this._config, MERGE_OPTIONS);
  }
  /**
   * Add hooks from an existing service to the runner config.
   * @param {Object} service - an object that contains hook methods.
   */


  addService(service) {
    for (let hookName of _constants.SUPPORTED_HOOKS) {
      if (!service[hookName]) {
        continue;
      }

      if (typeof service[hookName] === 'function') {
        this._config[hookName].push(service[hookName].bind(service));
      } else if (Array.isArray(service[hookName])) {
        for (let hook of service[hookName]) {
          if (typeof hook === 'function') {
            this._config[hookName].push(hook.bind(service));
          }
        }
      }
    }
  }
  /**
   * get excluded files from config pattern
   */


  getSpecs(capSpecs, capExclude) {
    let specs = ConfigParser.getFilePaths(this._config.specs);
    let spec = Array.isArray(this._config.spec) ? this._config.spec : [];
    let exclude = ConfigParser.getFilePaths(this._config.exclude);
    let suites = Array.isArray(this._config.suite) ? this._config.suite : [];
    /**
     * check if user has specified a specific suites to run
     */

    if (suites.length > 0) {
      let suiteSpecs = [];

      for (let suiteName of suites) {
        // ToDo: log warning if suite was not found
        let suite = this._config.suites[suiteName];

        if (suite && Array.isArray(suite)) {
          suiteSpecs = suiteSpecs.concat(ConfigParser.getFilePaths(suite));
        }
      }

      if (suiteSpecs.length === 0) {
        throw new Error(`The suite(s) "${suites.join('", "')}" you specified don't exist ` + 'in your config file or doesn\'t contain any files!');
      } // Allow --suite and --spec to both be defined on the command line
      // Removing any duplicate tests that could be included


      let tmpSpecs = spec.length > 0 ? [...specs, ...suiteSpecs] : suiteSpecs;

      if (Array.isArray(capSpecs)) {
        tmpSpecs = tmpSpecs.concat(ConfigParser.getFilePaths(capSpecs));
      }

      if (Array.isArray(capExclude)) {
        exclude = exclude.concat(ConfigParser.getFilePaths(capExclude));
      }

      specs = [...new Set(tmpSpecs)];
      return specs.filter(spec => !exclude.includes(spec));
    }

    if (Array.isArray(capSpecs)) {
      specs = specs.concat(ConfigParser.getFilePaths(capSpecs));
    }

    if (Array.isArray(capExclude)) {
      exclude = exclude.concat(ConfigParser.getFilePaths(capExclude));
    }

    return specs.filter(spec => !exclude.includes(spec));
  }
  /**
   * sets config attribute with file paths from filtering
   * options from cli argument
   *
   * @param  {String} cliArgFileList  list of files in a string from
   * @param  {Object} config  config object that stores the spec and exlcude attributes
   * cli argument
   * @return {String[]} List of files that should be included or excluded
   */


  setFilePathToFilterOptions(cliArgFileList, config) {
    const filesToFilter = new Set();
    const fileList = ConfigParser.getFilePaths(config);
    cliArgFileList.forEach(filteredFile => {
      if (_fs.default.existsSync(filteredFile) && _fs.default.lstatSync(filteredFile).isFile()) {
        filesToFilter.add(_path.default.resolve(process.cwd(), filteredFile));
      } else {
        fileList.forEach(file => {
          if (file.match(filteredFile)) {
            filesToFilter.add(file);
          }
        });
      }
    });

    if (filesToFilter.size === 0) {
      throw new Error(`spec file(s) ${cliArgFileList.join(', ')} not found`);
    }

    return filesToFilter;
  }
  /**
   * return configs
   */


  getConfig() {
    return this._config;
  }
  /**
   * return capabilities
   */


  getCapabilities(i) {
    if (typeof i === 'number' && this._capabilities[i]) {
      return this._capabilities[i];
    }

    return this._capabilities;
  }
  /**
   * returns a flatten list of globed files
   *
   * @param  {String[]} filenames  list of files to glob
   * @return {String[]} list of files
   */


  static getFilePaths(patterns, omitWarnings) {
    let files = [];

    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    if (!Array.isArray(patterns)) {
      throw new Error('specs or exclude property should be an array of strings');
    }

    for (let pattern of patterns) {
      let filenames = _glob.default.sync(pattern);

      filenames = filenames.filter(filename => filename.slice(-3) === '.js' || filename.slice(-4) === '.es6' || filename.slice(-3) === '.ts' || filename.slice(-8) === '.feature' || filename.slice(-7) === '.coffee');
      filenames = filenames.map(filename => _path.default.isAbsolute(filename) ? _path.default.normalize(filename) : _path.default.resolve(process.cwd(), filename));

      if (filenames.length === 0 && !omitWarnings) {
        log.warn('pattern', pattern, 'did not match any file');
      }

      files = (0, _deepmerge.default)(files, filenames, MERGE_OPTIONS);
    }

    return files;
  }

}

exports.default = ConfigParser;