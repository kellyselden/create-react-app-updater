'use strict';

const utils = require('./utils');
const semver = require('semver');

const distTags = [
  'latest',
  'next',
  'canary'
];

module.exports = function getTagVersion(to, versions) {
  let distTag;
  let version;
  if (distTags.indexOf(to) > -1) {
    distTag = to;
  } else {
    version = to;
  }

  if (version) {
    let isAbsolute = semver.clean(version);
    if (!isAbsolute) {
      version = semver.maxSatisfying(versions, version);
    }
  } else {
    let pkg = 'create-react-app';

    version = JSON.parse(
      utils.run(`npm info ${pkg}@${distTag} version --json`)
    );
  }

  return version;
};
