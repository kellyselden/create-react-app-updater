'use strict';

const getPackageJson = require('boilerplate-update/src/get-package-json');
const getProjectType = require('./get-project-type');
const getPackageVersions = require('./get-package-versions');
const _getTagVersion = require('./get-tag-version');
const formatStats = require('./format-stats');
const listCodemods = require('boilerplate-update/src/list-codemods');
const getApplicableCodemods = require('boilerplate-update/src/get-applicable-codemods');
const promptAndRunCodemods = require('boilerplate-update/src/prompt-and-run-codemods');
const boilerplateUpdate = require('boilerplate-update');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const semver = require('semver');
const co = require('co');
const getTimes = require('boilerplate-update/src/get-times');

function getVersionAtTime(times, time, margin = 0) {
  time = new Date(new Date(time).getTime() + margin);
  let versionsInRange = Object.keys(times).filter(version => {
    return new Date(times[version]) < time;
  });
  let version = semver.maxSatisfying(versionsInRange, '');
  return version;
}

const codemodsUrl = 'https://cdn.jsdelivr.net/gh/kellyselden/create-react-app-updater-codemods-manifest@vv1/manifest.json';

module.exports = function createReactAppUpdater({
  from,
  to,
  resolveConflicts,
  runCodemods: _runCodemods,
  statsOnly,
  listCodemods: _listCodemods
}) {
  return Promise.resolve().then(co.wrap(function*() {
    if (_listCodemods) {
      return listCodemods(codemodsUrl);
    }

    let packageJson = yield getPackageJson('.');
    let projectType = getProjectType(packageJson);
    // let versions = getVersions();
    return Promise.all([
      getTimes('create-react-app'),
      getTimes('react-scripts')
    ]).then(([
      createReactAppTimes,
      reactScriptsTimes
    ]) => {
      let createReactAppVersions = Object.keys(createReactAppTimes);
      let getTagVersion = _getTagVersion(createReactAppVersions);
      return getPackageVersions(packageJson, projectType).then(co.wrap(function*({
        'create-react-app': createReactAppVersion,
        'react-scripts': reactScriptsVersion
      }) {
        let startVersion;
        let reactScriptsStartVersion;
        let startTime;
        let margin = 24 * 60 * 60 * 1000;
        if (from) {
          startVersion = yield getTagVersion(from);
          startTime = createReactAppTimes[startVersion];
          reactScriptsStartVersion = getVersionAtTime(reactScriptsTimes, startTime, margin);
        } else {
          startVersion = createReactAppVersion;
          startTime = reactScriptsTimes[reactScriptsVersion];
          reactScriptsStartVersion = reactScriptsVersion;
        }

        let endVersion = yield getTagVersion(to);
        let endTime = createReactAppTimes[endVersion];
        let adsf = getVersionAtTime(reactScriptsTimes, endTime, margin);

        startTime = new Date(startTime);
        endTime = new Date(endTime);

        let startTag = `v${startVersion}`;
        let endTag = `v${endVersion}`;

        if (statsOnly) {
          return getApplicableCodemods({
            url: codemodsUrl,
            projectType,
            startVersion
          }).then(codemods => {
            return formatStats({
              startVersion,
              endVersion,
              codemods
            });
          });
        }

        if (_runCodemods) {
          return promptAndRunCodemods({
            url: codemodsUrl,
            projectType,
            startVersion
          });
        }

        let startCommand;
        let endCommand;

        return getStartAndEndCommands({
          projectName: packageJson.name,
          projectType,
          createReactAppStartVersion: startVersion,
          reactScriptsStartVersion,
          startTime,
          createReactAppEndVersion: endVersion,
          reactScriptsEndVersion: adsf,
          endTime
        }).then(commands => {
          startCommand = commands.startCommand;
          endCommand = commands.endCommand;

          return boilerplateUpdate({
            startTag,
            endTag,
            resolveConflicts,
            createCustomDiff: true,
            startCommand,
            endCommand
          });
        });
      }));
    });
  }));
};
