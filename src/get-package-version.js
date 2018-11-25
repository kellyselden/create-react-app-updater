'use strict';

const run = require('./run-async');
const pMap = require('p-map');
const pRetry = require('p-retry');

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

        return pRetry(() => {
          return run(`npm info react-scripts@${reactScriptsVersion} dependencies --json`).then(results => {
            if (packageVersion) {
              return;
            }

            let dependencies = JSON.parse(results);

            if (dependencies['react-dev-utils'] === reactDevUtilsVersion) {
              packageVersion = `^${reactScriptsVersion}`;
            }
          }).catch(err => {
            // occurs sometimes when running multiple npm calls at once
            if (typeof err !== 'string' || !err.includes('npm update check failed')) {
              throw new pRetry.AbortError(err);
            }

            // https://github.com/sindresorhus/p-retry/issues/14
            // throw err;
            throw new Error(err);
          });
        }, { retries: 5 });
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
