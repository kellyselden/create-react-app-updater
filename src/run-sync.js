'use strict';

const cp = require('child_process');
const debug = require('./debug');

module.exports = function runSync(command, options) {
  debug(command);
  let result = cp.execSync(command, options).toString();
  debug(result);
  return result;
};
