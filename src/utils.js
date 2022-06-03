'use strict';

module.exports.eject = require('./eject');

module.exports.npxSync = function npxSync() {
  return require('./run-sync')('npx', ...arguments);
};
