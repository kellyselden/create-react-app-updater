'use strict';

const { exec } = require('child_process');
const debug = require('debug')('create-react-app-update');

module.exports = function run(command, options) {
  return new Promise((resolve, reject) => {
    debug(command);
    exec(command, options, (err, stdout, stderr) => {
      debug(command);
      if (err) {
        return reject(err);
      }
      if (stderr) {
        return reject(stderr);
      }
      debug(stdout);
      resolve(stdout);
    });
  });
};
