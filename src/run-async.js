'use strict';

const { exec } = require('child_process');
const debug = require('debug')('create-react-app-updater');

module.exports = function run(command, options) {
  return new Promise((resolve, reject) => {
    debug(command);
    exec(command, options, (err, stdout) => {
      if (err) {
        return reject(err);
      }
      debug(stdout);
      resolve(stdout);
    });
  });
};
