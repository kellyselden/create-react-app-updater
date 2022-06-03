'use strict';

module.exports.eject = require('./eject');

module.exports.npxSync = function npxSync(command, ...args) {
  return require('./run-sync')(`npx ${command}`, ...args);
};

module.exports.spawn = require('execa');
