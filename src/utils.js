'use strict';

module.exports.eject = require('./eject');

module.exports.npxSync = function npxSync(command, ...args) {
  return require('./run-sync')(`npx ${command}`, ...args);
};

module.exports.spawn = async function spawn() {
  let ps = require('child_process').spawn(...arguments);

  await new Promise((resolve, reject) => {
    ps.on('error', reject);
    ps.on('exit', resolve);
  });
};
