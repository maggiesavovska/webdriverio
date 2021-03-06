"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BUFFER_OPTIONS = exports.DEBUGGER_MESSAGES = exports.SHUTDOWN_TIMEOUT = void 0;
const SHUTDOWN_TIMEOUT = 5000;
exports.SHUTDOWN_TIMEOUT = SHUTDOWN_TIMEOUT;
const DEBUGGER_MESSAGES = ['Debugger listening on', 'Debugger attached', 'Waiting for the debugger'];
exports.DEBUGGER_MESSAGES = DEBUGGER_MESSAGES;
const BUFFER_OPTIONS = {
  initialSize: 1000 * 1024,
  // start at 100 kilobytes.
  incrementAmount: 100 * 1024 // grow by 10 kilobytes each time buffer overflows.

};
exports.BUFFER_OPTIONS = BUFFER_OPTIONS;