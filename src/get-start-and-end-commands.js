'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const denodeify = require('denodeify');
const tmpDir = denodeify(require('tmp').dir);
const rimraf = denodeify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const readFile = denodeify(fs.readFile);
const writeFile = denodeify(fs.writeFile);
const semver = require('semver');
const { spawn } = require('child_process');

const packageName = 'create-react-app';

function mutatePackageJson(cwd, callback) {
  let filePath = path.join(cwd, 'package.json');
  return readFile(filePath).then(file => {
    let pkg = JSON.parse(file);
    callback(pkg);
    file = JSON.stringify(pkg, null, 2);
    return writeFile(filePath, file);
  });
}

function getVersions(packageName) {
  let output = utils.run(`npm info ${packageName} time --json`);
  let time = JSON.parse(output);
  return time;
}

function getVersion(packageName, asOf) {
  let versions = getVersions(packageName);
  let versionsInRange = Object.keys(versions).filter(version => {
    if (['created', 'modified'].includes(version)) {
      return false;
    }
    return new Date(versions[version]) < asOf;
  });
  let version = semver.maxSatisfying(versionsInRange, '');
  return version;
}

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
  // utils.run(`npm i -g ${packageName}`);

  return Promise.all([
    module.exports.createCommand({
      projectName,
      projectType,
      createReactAppVersion: createReactAppStartVersion,
      reactScriptsVersion: reactScriptsStartVersion,
      time: startTime
    }),
    module.exports.createCommand({
      projectName,
      projectType,
      createReactAppVersion: createReactAppEndVersion,
      reactScriptsVersion: reactScriptsEndVersion,
      time: endTime
    })
  ]).then(([
    startCommand,
    endCommand
  ]) => ({
    startCommand,
    endCommand
  }));
};

function getCommand(cwd, projectName) {
  let appPath = path.join(cwd, projectName);
  return `node ${cpr} ${appPath} .`;
}

function asdf({
  projectName,
  projectType,
  createReactAppVersion,
  reactScriptsVersion,
  time
}) {
  return tmpDir().then(cwd => {
    utils.run(`npx create-react-app@${createReactAppVersion} ${projectName} --scripts-version ${reactScriptsVersion}`, { cwd });
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
      return mutatePackageJson(appPath, pkg => {
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
        ['react', 'react-dom'].forEach(packageName => {
          let version = getVersion(packageName, time);
          pkg.dependencies[packageName] = `^${version}`;
        });
      });
    }).then(() => {
      return Promise.all([
        rimraf(path.join(appPath, '.git')),
        rimraf(path.join(appPath, 'node_modules')),
        rimraf(path.join(appPath, 'package-lock.json')),
        rimraf(path.join(appPath, 'yarn.lock'))
      ]);
    }).then(() => {
      return getCommand(cwd, projectName);
    });
  });
}

function tryCreateLocalCommand({
  basedir,
  projectName,
  projectType,
  createReactAppVersion,
  reactScriptsVersion,
  time
}) {
  return Promise.resolve().then(() => {
    let packageRoot = path.join(basedir, 'node_modules', packageName);
    try {
      fs.statSync(packageRoot);
    } catch (err) {
      // no node_modules
      return;
    }
    let packageVersion = utils.require(path.join(packageRoot, 'package.json')).version;
    if (packageVersion !== createReactAppVersion) {
      // installed version is out-of-date
      return;
    }
    return asdf({
      projectName,
      projectType,
      createReactAppVersion,
      reactScriptsVersion,
      time
    });
  });
}

module.exports.createRemoteCommand = function createRemoteCommand({
  projectName,
  projectType,
  createReactAppVersion,
  reactScriptsVersion,
  time
}) {
  return asdf({
    projectName,
    projectType,
    createReactAppVersion,
    reactScriptsVersion,
    time
  });
};

module.exports.createCommand = function createCommand({
  projectName,
  projectType,
  createReactAppVersion,
  reactScriptsVersion,
  time
}) {
  return tryCreateLocalCommand({
    basedir: process.cwd(),
    projectName,
    projectType,
    createReactAppVersion,
    reactScriptsVersion,
    time
  }).then(command => {
    if (command) {
      return command;
    }
    return utils.which(packageName).then(packagePath => {
      return tryCreateLocalCommand({
        basedir: path.dirname(packagePath),
        projectName,
        projectType,
        createReactAppVersion,
        reactScriptsVersion,
        time
      });
    }).catch(err => {
      if (err.message === `not found: ${packageName}`) {
        // not installed globally
        return;
      }
      throw err;
    });
  }).then(command => {
    if (command) {
      return command;
    }
    return module.exports.createRemoteCommand({
      projectName,
      projectType,
      createReactAppVersion,
      reactScriptsVersion,
      time
    });
  });
};
