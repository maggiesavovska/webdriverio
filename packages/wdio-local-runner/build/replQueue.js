"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _repl = _interopRequireDefault(require("./repl"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * repl queue class
 * allows to run debug commands in mutliple workers one after another
 */
class ReplQueue {
  constructor() {
    this.runningRepl = null;
    this.repls = [];
  }

  add(childProcess, options, onStart, onEnd) {
    this.repls.push({
      childProcess,
      options,
      onStart,
      onEnd
    });
  }

  next() {
    if (this.isRunning || this.repls.length === 0) {
      return;
    }

    const {
      childProcess,
      options,
      onStart,
      onEnd
    } = this.repls.shift();
    this.runningRepl = new _repl.default(childProcess, options);
    onStart();
    this.runningRepl.start().then(() => {
      const ev = {
        origin: 'debugger',
        name: 'stop'
      };
      this.runningRepl.childProcess.send(ev);
      onEnd(ev);
      delete this.runningRepl;
      this.next();
    });
  }

  get isRunning() {
    return Boolean(this.runningRepl);
  }

}

exports.default = ReplQueue;