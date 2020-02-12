'use strict';

const getProjectType = require('./get-project-type');
const getPackageVersions = require('./get-package-versions');
const _getTagVersion = require('./get-tag-version');
const boilerplateUpdate = require('boilerplate-update');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const getTimes = require('boilerplate-update/src/get-times');
const getVersionAsOf = require('boilerplate-update/src/get-version-as-of');

function getVersionAsOfMargin(times, time, margin = 0) {
  time = new Date(new Date(time).getTime() + margin);
  return getVersionAsOf(times, time);
}

module.exports = async function createReactAppUpdater({
  cwd = process.cwd(),
  from,
  to,
  resolveConflicts,
  runCodemods,
  reset,
  statsOnly,
  listCodemods
}) {
  return await (await boilerplateUpdate({
    cwd,
    projectOptions: ({ packageJson }) => [getProjectType(packageJson)],
    resolveConflicts,
    reset,
    statsOnly,
    listCodemods,
    runCodemods,
    codemodsSource: 'https://github.com/kellyselden/create-react-app-updater-codemods-manifest.git#semver:1',
    createCustomDiff: true,
    mergeOptions: async function mergeOptions({
      packageJson,
      projectOptions: [projectType]
    }) {
      let [
        createReactAppTimes,
        reactScriptsTimes
      ] = await Promise.all([
        getTimes('create-react-app'),
        getTimes('react-scripts')
      ]);

      let createReactAppVersions = Object.keys(createReactAppTimes);
      let getTagVersion = _getTagVersion(createReactAppVersions);
      let margin = 24 * 60 * 60 * 1000;

      let startVersion;
      let reactScriptsStartVersion;
      let startTime;
      if (!reset) {
        if (from) {
          startVersion = await getTagVersion(from);
          startTime = createReactAppTimes[startVersion];
          reactScriptsStartVersion = getVersionAsOfMargin(reactScriptsTimes, startTime, margin);
        } else {
          let {
            'create-react-app': createReactAppVersion,
            'react-scripts': reactScriptsVersion
          } = await getPackageVersions(packageJson, projectType);

          startVersion = createReactAppVersion;
          startTime = reactScriptsTimes[reactScriptsVersion];
          reactScriptsStartVersion = reactScriptsVersion;
        }
      }

      let endVersion = await getTagVersion(to);
      let endTime = createReactAppTimes[endVersion];
      let reactScriptsEndVersion = getVersionAsOfMargin(reactScriptsTimes, endTime, margin);

      return {
        startVersion,
        endVersion,
        customDiffOptions: getStartAndEndCommands({
          projectName: packageJson.name,
          projectType,
          createReactAppStartVersion: startVersion,
          reactScriptsStartVersion,
          startTime,
          createReactAppEndVersion: endVersion,
          reactScriptsEndVersion,
          endTime
        })
      };
    }
  })).promise;
};
