"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFilePath;

var _path = require("path");

const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i;
/**
 * Resolves the given path into a absolute path and appends the default filename as fallback when the provided path is a directory.
 * @param  {String} filePath         relative file or directory path
 * @param  {String} defaultFilename default file name when filePath is a directory
 * @return {String}                 absolute file path
 */

function getFilePath(filePath, defaultFilename) {
  let absolutePath = (0, _path.resolve)(filePath); // test if we already have a file (e.g. selenium.txt, .log, log.txt, etc.)
  // NOTE: path.extname doesn't work to detect a file, cause dotfiles are reported by node to have no extension

  if (!FILE_EXTENSION_REGEX.test((0, _path.basename)(absolutePath))) {
    absolutePath = (0, _path.join)(absolutePath, defaultFilename);
  }

  return absolutePath;
}