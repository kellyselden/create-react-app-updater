'use strict';

const path = require('path');
const execa = require('execa');
const debug = require('debug')('create-react-app-update');

module.exports = function npx(command, options = {}) {
  debug(`npx ${command}`);
  return execa('npx', command.split(' '), Object.assign({}, {
    localDir: path.join(__dirname, '..'),
    stdio: 'inherit'
  }, options));
};
