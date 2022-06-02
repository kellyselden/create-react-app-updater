'use strict';

const semver = require('semver');
const pacote = require('pacote');
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

  // eslint-disable-next-line prefer-let/prefer-let
  const { default: pMap } = await import('p-map');

  await pMap(sortedParentVersions, async _parentVersion => {
    if (parentVersion) {
      return;
    }

    let manifest;

    try {
      manifest = await pacote.manifest(`${parentPackageName}@${_parentVersion}`);
    } catch (err) {
      if (err.code === 'ETARGET') {
        return;
      } else {
        throw err;
      }
    }

    if (parentVersion) {
      return;
    }

    let { dependencies } = manifest;

    // some versions may be missing deps
    if (!dependencies) {
      return;
    }

    let _childVersion = dependencies[childPackageName];

    if (_childVersion === childVersion) {
      parentVersion = _parentVersion;
    } else if (!semver.prerelease(_childVersion)) {
      let _minChildVersion = semver.minSatisfying(childVersions, _childVersion);
      if (semver.lte(_minChildVersion, minChildVersion)) {
        parentVersion = _parentVersion;
      }
    }
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
