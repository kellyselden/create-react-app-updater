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
  let output = utils.run(`npm info ${packageName} --json`);
  let { time } = JSON.parse(output);
  return time;
}

function getTime(version) {
  let versions = getVersions(packageName);
  return new Date(versions[version]);
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
  startVersion,
  endVersion
}) {
  // test
  utils.run(`npm i ${packageName}@1.0.0 --no-save --no-package-lock`);
  utils.run(`npm i -g ${packageName}`);

  return Promise.all([
    module.exports.createCommand(projectName, startVersion),
    module.exports.createCommand(projectName, endVersion)
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
  version
}) {
  return tmpDir().then(cwd => {
    utils.run(`npx -p ${packageName}@${version} ${packageName} ${projectName} --scripts-version ${version}`, { cwd });
    let appPath = path.join(cwd, projectName);
    return mutatePackageJson(appPath, pkg => {
      let newVersion = `^${version}`;
      let packageName = 'react-scripts';
      if (pkg.dependencies[packageName]) {
        // v2.1.1
        pkg.dependencies[packageName] = newVersion;
      } else {
        // v1.0.0
        pkg.devDependencies[packageName] = newVersion;
      }
      let time = getTime(version);
      ['react', 'react-dom'].forEach(packageName => {
        let version = getVersion(packageName, time);
        pkg.dependencies[packageName] = `^${version}`;
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
  version
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
    if (packageVersion !== version) {
      // installed version is out-of-date
      return;
    }
    return asdf({
      projectName,
      version
    });
  });
}

module.exports.createRemoteCommand = function createRemoteCommand(projectName, version) {
  return asdf({
    projectName,
    version
  });
};

module.exports.createCommand = function createCommand(projectName, version) {
  return tryCreateLocalCommand({
    basedir: process.cwd(),
    projectName,
    version
  }).then(command => {
    if (command) {
      return command;
    }
    return utils.which(packageName).then(packagePath => {
      return tryCreateLocalCommand({
        basedir: path.dirname(packagePath),
        projectName,
        version
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
    return module.exports.createRemoteCommand(projectName, version);
  });
};
