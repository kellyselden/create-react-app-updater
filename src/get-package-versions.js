'use strict';

const pMap = require('p-map');
const pRetry = require('p-retry');
const semver = require('semver');
const npm = require('boilerplate-update/src/npm');
const getVersions = require('boilerplate-update/src/get-versions');
const getTimes = require('boilerplate-update/src/get-times');
const getVersionAsOf = require('boilerplate-update/src/get-version-as-of');

function crawl({
  parentVersions,
  childVersions,
  childVersion,
  parentPackageName,
  childPackageName
}) {
  let parentVersion;

  let minChildVersion = semver.minSatisfying(childVersions, childVersion);

  let sortedParentVersions = parentVersions.sort((a, b) => {
    return semver.lt(a, b) ? 1 : -1;
  });

  return pMap(sortedParentVersions, _parentVersion => {
    if (parentVersion) {
      return;
    }

    return pRetry(() => {
      return npm(`view ${parentPackageName}@${_parentVersion} dependencies --json`).then(results => {
        if (parentVersion) {
          return;
        }

        // some versions may be missing deps
        if (!results) {
          return;
        }

        let dependencies = JSON.parse(results);
        let _childVersion = dependencies[childPackageName];

        if (_childVersion === childVersion) {
          parentVersion = _parentVersion;
        } else if (!semver.prerelease(_childVersion)) {
          let _minChildVersion = semver.minSatisfying(childVersions, _childVersion);
          if (semver.lte(_minChildVersion, minChildVersion)) {
            parentVersion = _parentVersion;
          }
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
  }, { concurrency: 5 }).then(() => {
    return parentVersion;
  });
}

module.exports = function getPackageVersion({
  dependencies,
  devDependencies
}, projectType) {
  return Promise.all([
    getTimes('create-react-app'),
    getTimes('react-scripts')
  ]).then(([
    createReactAppTimes,
    reactScriptsTimes
  ]) => {
    let reactScriptsVersions = Object.keys(reactScriptsTimes);

    return Promise.resolve().then(() => {
      let allDeps = Object.assign({}, dependencies, devDependencies);

      if (projectType === 'ejected') {
        return getVersions('react-dev-utils').then(reactDevUtilsVersions => {
          let reactDevUtilsVersion = allDeps['react-dev-utils'];

          return crawl({
            parentVersions: reactScriptsVersions,
            childVersions: reactDevUtilsVersions,
            childVersion: reactDevUtilsVersion,
            parentPackageName: 'react-scripts',
            childPackageName: 'react-dev-utils'
          });
        });
      }

      let reactScriptsVersion = semver.minSatisfying(reactScriptsVersions, allDeps['react-scripts']);

      return reactScriptsVersion;
    }).then(reactScriptsVersion => {
      if (!reactScriptsVersion) {
        throw 'React Scripts version could not be determined';
      }

      let reactScriptsTime = reactScriptsTimes[reactScriptsVersion];

      let createReactAppVersion = getVersionAsOf(createReactAppTimes, reactScriptsTime);

      if (!createReactAppVersion) {
        throw 'Create React App version could not be determined';
      }

      return {
        'create-react-app': createReactAppVersion,
        'react-scripts': reactScriptsVersion
      };
    });
  });
};
