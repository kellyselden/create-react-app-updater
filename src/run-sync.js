'use strict';

const execa = require('execa');
const debug = require('./debug');

module.exports = function runSync(command, options) {
  debug(command);
  let { stdout } = execa.commandSync(command, options);
  debug(stdout);
  return stdout;
};
