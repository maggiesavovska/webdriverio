"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NOOP = exports.EVENTS = exports.INTERFACES = void 0;
const INTERFACES = {
  bdd: ['it', 'before', 'beforeEach', 'after', 'afterEach'],
  tdd: ['test', 'suiteSetup', 'setup', 'suiteTeardown', 'teardown'],
  qunit: ['test', 'before', 'beforeEach', 'after', 'afterEach']
  /**
   * to map Mocha events to WDIO events
   */

};
exports.INTERFACES = INTERFACES;
const EVENTS = {
  'suite': 'suite:start',
  'suite end': 'suite:end',
  'test': 'test:start',
  'test end': 'test:end',
  'hook': 'hook:start',
  'hook end': 'hook:end',
  'pass': 'test:pass',
  'fail': 'test:fail',
  'pending': 'test:pending'
};
exports.EVENTS = EVENTS;

const NOOP =
/* istanbul ignore next */
function () {};

exports.NOOP = NOOP;