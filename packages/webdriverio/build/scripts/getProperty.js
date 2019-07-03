"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getProperty;

/**
 * get property from element
 * @param  {String} element    element with requested property
 * @param  {String} property   requested property
 * @return {String}            the value of the property
 */
function getProperty(element, property) {
  return element[property];
}