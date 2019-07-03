"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _tmp = _interopRequireDefault(require("tmp"));

var _path = _interopRequireDefault(require("path"));

var _shelljs = _interopRequireDefault(require("shelljs"));

var _events = _interopRequireDefault(require("events"));

var _findNodeModules = _interopRequireDefault(require("find-node-modules"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('@wdio/lambda-runner');

class AWSLambdaRunner extends _events.default {
  constructor(configFile, config, capabilities, specs) {
    super();
    const {
      AWS_ACCESS_KEY,
      AWS_ACCESS_KEY_ID
    } = process.env;

    if (!AWS_ACCESS_KEY || !AWS_ACCESS_KEY_ID) {
      throw new Error('Please provide AWS_ACCESS_KEY, AWS_ACCESS_KEY_ID, AWS_BUCKET in your environment');
    }

    this.instances = [];
    this.configFile = configFile;
    this.config = config;
    this.capabilities = capabilities;
    this.specs = specs;
    this.nodeModulesDir = _path.default.resolve((0, _findNodeModules.default)()[0]);
    this.pwd = _shelljs.default.pwd().stdout;
    this.serverlessBinPath = _path.default.resolve(require.resolve('serverless'), '..', '..', 'bin', 'serverless');
  }

  async initialise() {
    /**
     * generate temp dir for AWS service
     */
    this.serviceDir = _tmp.default.dirSync({
      prefix: '.wdio-runner-service',
      dir: process.cwd(),
      mode: '0750'
    });
    log.info('Generating temporary AWS Lamdba service directory at %s', this.serviceDir.name);
    /**
     * link node_modules
     */

    this.link(this.nodeModulesDir, _path.default.resolve(this.serviceDir.name, 'node_modules'));
    /**
     * link wdio config
     */

    this.link(_path.default.resolve(process.cwd(), this.configFile), _path.default.resolve(this.serviceDir.name, this.configFile));
    /**
     * link specs
     */

    this.specs.forEach(spec => {
      this.link(spec, _path.default.join(this.serviceDir.name, spec.replace(process.cwd(), '')));
    });
    /**
     * create config
     */

    const runnerConfig = Object.assign(_constants.DEFAULT_CONFIG, {
      environment: {
        DEBUG: 1
      },
      package: {
        include: [],
        exclude: []
      }
    });
    /**
     * copy over files
     */

    _shelljs.default.cp(_path.default.resolve(__dirname, '..', 'config', 'serverless.yml'), _path.default.resolve(this.serviceDir.name, 'serverless.yml'));

    _shelljs.default.cp(_path.default.resolve(__dirname, 'handler.js'), _path.default.resolve(this.serviceDir.name, 'handler.js'));

    _fs.default.writeFileSync(_path.default.resolve(this.serviceDir.name, 'runner-config.json'), JSON.stringify(runnerConfig, null, 4));

    _shelljs.default.cd(this.serviceDir.name);

    await this.exec(`${this.serverlessBinPath} deploy --verbose`);

    _shelljs.default.cd(this.pwd);
  }
  /**
   * kill all instances that were started
   */


  kill() {}

  async run(options) {
    options.specs = options.specs.map(spec => spec.replace(process.cwd(), '.'));

    _shelljs.default.cd(this.serviceDir.name);

    let result;

    try {
      result = await this.exec(`${this.serverlessBinPath} invoke -f run --data '${JSON.stringify(options)}' --verbose`);
    } catch (e) {
      log.error(`Failed to run Lambda process for cid ${options.cid}`);
    }

    _shelljs.default.cd(this.pwd);

    this.emit(this.cid, result.failures === 0 ? 0 : 1);
  }

  link(source, dest) {
    log.debug('Linking: ', source, dest);

    _fs.default.symlinkSync(source, dest);
  }

  exec(script) {
    log.debug(`Run script "${script}"`);
    return new Promise((resolve, reject) => {
      const child = _shelljs.default.exec(script, {
        async: true,
        silent: true
      });

      child.stdout.on('data', stdout => {
        const trimmedStdout = stdout.trim().replace(/^Serverless: /, '');
        /**
         * in case stdout is starting with `{` we assume it
         * is the resulrt of serverless.run therefor return
         * json
         */

        if (trimmedStdout.startsWith('{')) {
          return resolve(JSON.parse(trimmedStdout));
        }

        log.debug(trimmedStdout);
      });
      child.stderr.on('data', log.error.bind(log));
      child.on('close', code => {
        /**
         * ...otherwise resolve with status code
         */
        if (code === 0) {
          return resolve(code);
        }

        reject(new Error(`script failed with exit code ${code}`));
      });
    });
  }

}

exports.default = AWSLambdaRunner;