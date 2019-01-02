'use strict';

const path = require('path');
const utils = require('./utils');
const semver = require('semver');
const pMap = require('p-map');
const { spawn } = require('child_process');
const _getStartAndEndCommands = require('boilerplate-update/src/get-start-and-end-commands');
const getPackageVersionAsOf = require('boilerplate-update/src/get-package-version-as-of');

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
  // utils.run(`npm i ${packageName}@1.0.0 --no-save --no-package-lock`);
  // utils.run(`npm i -g ${packageName}@2.1.1`);

  return _getStartAndEndCommands({
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
  });
};

function createProjectFromCache({
  packageRoot,
  options
}) {
  return function createProject(cwd) {
    utils.run(`node ${path.join(packageRoot, 'index.js')} ${options.projectName} --scripts-version ${options.reactScriptsVersion}`, { cwd });

    return postCreateProject({
      cwd,
      options
    });
  };
}

function createProjectFromRemote({
  options
}) {
  return function createProject(cwd) {
    utils.run(`npx create-react-app@${options.packageVersion} ${options.projectName} --scripts-version ${options.reactScriptsVersion}`, { cwd });

    return postCreateProject({
      cwd,
      options
    });
  };
}

function postCreateProject({
  cwd,
  options: {
    projectName,
    projectType,
    reactScriptsVersion
  }
}) {
  let appPath = path.join(cwd, projectName);

  return Promise.resolve().then(() => {
    if (projectType !== 'ejected') {
      return;
    }

    let ps = spawn('node', [
      'node_modules/react-scripts/bin/react-scripts.js',
      'eject'
    ], {
      cwd: appPath
    });

    ps.stdin.write('y\n');
    if (semver.lte(reactScriptsVersion, '0.8.1')) {
      ps.stdin.end();
    }

    return new Promise(resolve => {
      ps.on('exit', resolve);
    });
  }).then(() => {
    return appPath;
  });
}

function mutatePackageJson({
  projectType,
  reactScriptsVersion,
  time
}) {
  return function mutatePackageJson(pkg) {
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
    return pMap(['react', 'react-dom'], packageName => {
      return getPackageVersionAsOf(packageName, time).then(version => {
        pkg.dependencies[packageName] = `^${version}`;
      });
    });
  };
}
