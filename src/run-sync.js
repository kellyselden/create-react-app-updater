'use strict';

const execa = require('execa');
const debug = require('./debug');

module.exports = function runSync() {
  debug(...arguments);
  let { stdout } = execa.sync(...arguments);
  debug(stdout);
  return stdout;
};
