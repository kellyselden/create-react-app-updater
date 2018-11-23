'use strict';

const run = require('./run-async');
const pMap = require('p-map');

module.exports = function getPackageVersion({
  dependencies,
  devDependencies
}, projectType, versions) {
  let packageVersion;

  return Promise.resolve().then(() => {
    let allDeps = Object.assign({}, dependencies, devDependencies);

    if (projectType === 'ejected') {
      let reactDevUtilsVersion = allDeps['react-dev-utils'];

      return pMap(versions.reverse(), reactScriptsVersion => {
        if (packageVersion) {
          return;
        }

        return run(`npm info react-scripts@${reactScriptsVersion} dependencies --json`).then(results => {
          if (packageVersion) {
            return;
          }

          let dependencies = JSON.parse(results);

          if (dependencies['react-dev-utils'] === reactDevUtilsVersion) {
            packageVersion = `^${reactScriptsVersion}`;
          }
        });
      }, { concurrency: 5 });
    }

    packageVersion = allDeps['react-scripts'];
  }).then(() => {
    if (!packageVersion) {
      throw 'Create React App version could not be determined';
    }

    return packageVersion;
  });
};
