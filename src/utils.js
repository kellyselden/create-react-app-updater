'use strict';

const path = require('path');

module.exports.eject = require('./eject');

module.exports.npxSync = function npxSync(args, options) {
  // npm ERR! cb.apply is not a function
  // return require('./run-sync')('npx', args, {
  //   preferLocal: true,
  //   localDir: __dirname,
  //   ...options
  // });

  return require('./run-sync')('node', [path.join(path.dirname(require.resolve('npm')), 'bin/npx-cli.js'), ...args], options);
};
