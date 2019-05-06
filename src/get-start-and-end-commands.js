'use strict';

const path = require('path');
const utils = require('./utils');
const pMap = require('p-map');
const getTimes = require('boilerplate-update/src/get-times');
const getVersionAsOf = require('boilerplate-update/src/get-version-as-of');

module.exports = function getStartAndEndCommands({
  projectName,
  projectType,
  createReactAppStartVersion,
  reactScriptsStartVersion,
  startTime,
  createReactAppEndVersion,
  reactScriptsEndVersion,
  endTime
}) {
  // test
  // require('./run-sync')(`npm i ${packageName}@1.0.0 --no-save --no-package-lock`);
  // require('./run-sync')(`npm i -g ${packageName}@2.1.1`);

  return {
    projectName,
    projectType,
    packageName: 'create-react-app',
    createProjectFromCache,
    createProjectFromRemote,
    mutatePackageJson,
    startOptions: {
      packageVersion: createReactAppStartVersion,
      reactScriptsVersion: reactScriptsStartVersion,
      time: startTime
    },
    endOptions: {
      packageVersion: createReactAppEndVersion,
      reactScriptsVersion: reactScriptsEndVersion,
      time: endTime
    }
  };
};

function createProjectFromCache({
  packageRoot,
  options
}) {
  return async function createProject(cwd) {
    await utils.spawn('node', [
      path.join(packageRoot, 'index.js'),
      options.projectName,
      '--scripts-version',
      options.reactScriptsVersion
    ], {
      cwd
    });

    return await postCreateProject({
      cwd,
      options
    });
  };
}

function createProjectFromRemote({
  options
}) {
  return async function createProject(cwd) {
    // create-react-app doesn't work well with async npx
    utils.npxSync(`create-react-app@${options.packageVersion} ${options.projectName} --scripts-version ${options.reactScriptsVersion}`, { cwd });

    return await postCreateProject({
      cwd,
      options
    });
  };
}

async function postCreateProject({
  cwd,
  options: {
    projectName,
    projectType,
    reactScriptsVersion
  }
}) {
  let appPath = path.join(cwd, projectName);

  if (projectType === 'ejected') {
    await utils.eject({
      cwd: appPath,
      reactScriptsVersion
    });
  }

  return appPath;
}

function mutatePackageJson({
  projectType,
  reactScriptsVersion,
  time
}) {
  return async function mutatePackageJson(pkg) {
    if (projectType === 'normal') {
      let newVersion = `^${reactScriptsVersion}`;
      let packageName = 'react-scripts';
      if (pkg.dependencies[packageName]) {
        // v2.1.1
        pkg.dependencies[packageName] = newVersion;
      } else {
        // v1.0.0
        pkg.devDependencies[packageName] = newVersion;
      }
    }
    await pMap(['react', 'react-dom'], async packageName => {
      let times = await getTimes(packageName);
      let version = getVersionAsOf(times, time);
      pkg.dependencies[packageName] = `^${version}`;
    });
  };
}
