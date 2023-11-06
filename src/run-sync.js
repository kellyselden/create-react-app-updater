'use strict';

const debug = require('./debug');

module.exports = function runSync() {
  debug(...arguments);
  let { stdout } = this.execaSync(...arguments);
  debug(stdout);
  return stdout;
};
