"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sanitizeString = sanitizeString;
exports.sanitizeCaps = sanitizeCaps;
exports.getErrorsFromEvent = getErrorsFromEvent;

/**
 * replaces whitespaces with underscore and removes dots
 * @param  {String} str  variable to sanitize
 * @return {String}      sanitized variable
 */
function sanitizeString(str) {
  if (!str) {
    return '';
  }

  return String(str).replace(/^.*\/([^/]+)\/?$/, '$1').replace(/\./g, '_').replace(/\s/g, '').toLowerCase();
}
/**
 * formats capability object into sanitized string for e.g.filenames
 * @param {Object} caps  Selenium capabilities
 */


function sanitizeCaps(caps) {
  if (!caps) {
    return '';
  }

  let result;
  /**
   * mobile caps
   */

  if (caps.deviceName) {
    result = [sanitizeString(caps.deviceName), sanitizeString(caps.platformName), sanitizeString(caps.platformVersion), sanitizeString(caps.app)];
  } else {
    result = [sanitizeString(caps.browserName), sanitizeString(caps.version || caps.browserVersion), sanitizeString(caps.platform || caps.platformName), sanitizeString(caps.app)];
  }

  result = result.filter(n => n !== undefined && n !== '');
  return result.join('.');
}
/**
 * Takes a event emitted by a framework and extracts
 * an array of errors representing test or hook failures.
 * This exists to maintain compatibility between frameworks
 * with have a soft assertion model (Jasmine) and those that
 * have a hard assertion model (Mocha)
 * @param {*} e  An event emitted by a framework adapter
 */


function getErrorsFromEvent(e) {
  if (e.errors) return e.errors;
  if (e.error) return [e.error];
  return [];
}