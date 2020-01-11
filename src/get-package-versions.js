'use strict';

const pMap = require('p-map');
const pRetry = require('p-retry');
const semver = require('semver');
const npm = require('boilerplate-update/src/npm');
const getVersions = require('./get-versions');
const getTimes = require('boilerplate-update/src/get-times');
const getVersionAsOf = require('boilerplate-update/src/get-version-as-of');

async function crawl({
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

  await pMap(sortedParentVersions, async _parentVersion => {
    if (parentVersion) {
      return;
    }

    await pRetry(async() => {
      let results;

      try {
        results = await npm(`view ${parentPackageName}@${_parentVersion} dependencies --json`);
      } catch (err) {
        // occurs sometimes when running multiple npm calls at once
        if (typeof err !== 'string' || !err.includes('npm update check failed')) {
          throw new pRetry.AbortError(err);
        }

        // https://github.com/sindresorhus/p-retry/issues/14
        // throw err;
        throw new Error(err);
      }

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
    }, { retries: 5 });
  }, { concurrency: 5 });

  return parentVersion;
}

module.exports = async function getPackageVersion({
  dependencies,
  devDependencies
}, projectType) {
  let [
    createReactAppTimes,
    reactScriptsTimes
  ] = await Promise.all([
    getTimes('create-react-app'),
    getTimes('react-scripts')
  ]);

  let reactScriptsVersions = Object.keys(reactScriptsTimes);

  let allDeps = Object.assign({}, dependencies, devDependencies);

  let reactScriptsVersion;

  if (projectType === 'ejected') {
    let reactDevUtilsVersions = await getVersions('react-dev-utils');

    let reactDevUtilsVersion = allDeps['react-dev-utils'];

    reactScriptsVersion = await crawl({
      parentVersions: reactScriptsVersions,
      childVersions: reactDevUtilsVersions,
      childVersion: reactDevUtilsVersion,
      parentPackageName: 'react-scripts',
      childPackageName: 'react-dev-utils'
    });
  } else {
    reactScriptsVersion = semver.minSatisfying(reactScriptsVersions, allDeps['react-scripts']);
  }

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
};
