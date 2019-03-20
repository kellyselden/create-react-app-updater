'use strict';

const semver = require('semver');
const { spawn } = require('child_process');

function eject({
  reactScriptsVersion,
  cwd
}) {
  let ps = spawn('node', [
    'node_modules/react-scripts/bin/react-scripts.js',
    'eject'
  ], {
    cwd
  });

  ps.stdin.write('y\n');
  if (semver.lte(reactScriptsVersion, '0.8.1')) {
    ps.stdin.end();
  }

  return new Promise(resolve => {
    ps.on('exit', resolve);
  });
}

module.exports = eject;
