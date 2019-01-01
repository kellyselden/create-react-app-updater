'use strict';

const utils = require('./utils');
const semver = require('semver');

const url = 'https://cdn.jsdelivr.net/gh/kellyselden/create-react-app-updater-codemods-manifest@vv1/manifest.json';

module.exports = function getApplicableCodemods({
  startVersion
}) {
  let nodeVersion = utils.getNodeVersion();

  return utils.getCodemods(url).then(codemods => {
    return Object.keys(codemods).filter(codemod => {
      codemod = codemods[codemod];
      let isVersionInRange = semver.gte(startVersion, codemod.version);
      let isNodeVersionInRange = semver.gte(nodeVersion, codemod.nodeVersion);
      return isVersionInRange && isNodeVersionInRange;
    }).reduce((applicableCodemods, codemod) => {
      applicableCodemods[codemod] = codemods[codemod];
      return applicableCodemods;
    }, {});
  });
};
