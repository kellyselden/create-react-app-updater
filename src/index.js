'use strict';

const getPackageJson = require('boilerplate-update/src/get-package-json');
const getProjectType = require('./get-project-type');
const getPackageVersions = require('./get-package-versions');
const _getTagVersion = require('./get-tag-version');
const listCodemods = require('boilerplate-update/src/list-codemods');
const boilerplateUpdate = require('boilerplate-update');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const co = require('co');
const getTimes = require('boilerplate-update/src/get-times');
const getVersionAsOf = require('boilerplate-update/src/get-version-as-of');

function getVersionAsOfMargin(times, time, margin = 0) {
  time = new Date(new Date(time).getTime() + margin);
  return getVersionAsOf(times, time);
}

const codemodsUrl = 'https://raw.githubusercontent.com/kellyselden/create-react-app-updater-codemods-manifest/v1/manifest.json';

module.exports = co.wrap(function* createReactAppUpdater({
  from,
  to,
  resolveConflicts,
  runCodemods,
  statsOnly,
  listCodemods: _listCodemods,
  wasRunAsExecutable
}) {
  if (_listCodemods) {
    return yield listCodemods(codemodsUrl);
  }

  let packageJson = yield getPackageJson();
  let projectType = getProjectType(packageJson);
  // let versions = getVersions();
  let [
    createReactAppTimes,
    reactScriptsTimes
  ] = yield Promise.all([
    getTimes('create-react-app'),
    getTimes('react-scripts')
  ]);

  let createReactAppVersions = Object.keys(createReactAppTimes);
  let getTagVersion = _getTagVersion(createReactAppVersions);
  let {
    'create-react-app': createReactAppVersion,
    'react-scripts': reactScriptsVersion
  } = yield getPackageVersions(packageJson, projectType);

  let startVersion;
  let reactScriptsStartVersion;
  let startTime;
  let margin = 24 * 60 * 60 * 1000;
  if (from) {
    startVersion = yield getTagVersion(from);
    startTime = createReactAppTimes[startVersion];
    reactScriptsStartVersion = getVersionAsOfMargin(reactScriptsTimes, startTime, margin);
  } else {
    startVersion = createReactAppVersion;
    startTime = reactScriptsTimes[reactScriptsVersion];
    reactScriptsStartVersion = reactScriptsVersion;
  }

  let endVersion = yield getTagVersion(to);
  let endTime = createReactAppTimes[endVersion];
  let reactScriptsEndVersion = getVersionAsOfMargin(reactScriptsTimes, endTime, margin);

  return yield (yield boilerplateUpdate({
    resolveConflicts,
    statsOnly,
    runCodemods,
    codemodsUrl,
    projectType,
    startVersion,
    endVersion,
    createCustomDiff: true,
    customDiffOptions: getStartAndEndCommands({
      projectName: packageJson.name,
      projectType,
      createReactAppStartVersion: startVersion,
      reactScriptsStartVersion,
      startTime,
      createReactAppEndVersion: endVersion,
      reactScriptsEndVersion,
      endTime
    }),
    wasRunAsExecutable
  })).promise;
});
