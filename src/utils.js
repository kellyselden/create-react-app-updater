'use strict';

module.exports.eject = require('./eject');

module.exports.npxSync = function npxSync(args, options) {
  return require('./run-sync')('npx', args, {
    preferLocal: true,
    localDir: __dirname,
    ...options
  });
};
