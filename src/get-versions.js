'use strict';

const utils = require('./utils');

module.exports = function getVersions() {
  let pkg = 'create-react-app';

  let versions = JSON.parse(
    utils.run(`npm info ${pkg} versions --json`)
  );

  return versions;
};
