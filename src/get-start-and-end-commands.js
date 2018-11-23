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
  projectType,
  startVersion,
  endVersion
}) {
  // test
  // utils.run(`npm i ${packageName}@1.0.0 --no-save --no-package-lock`);
  // utils.run(`npm i -g ${packageName}`);

  return Promise.all([
    module.exports.createCommand(projectName, projectType, startVersion),
    module.exports.createCommand(projectName, projectType, endVersion)
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
  version
}) {
  return tmpDir().then(cwd => {
    utils.run(`npx ${packageName}@${version} ${projectName} --scripts-version ${version}`, { cwd });
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

      ps.stdout.on('data', data => {
        let str = data.toString();
        if (str.includes('Are you sure you want to eject?')) {
          ps.stdin.write('y\n');
        }
      });

      return new Promise(resolve => {
        ps.on('exit', resolve);
      });
    }).then(() => {
      return mutatePackageJson(appPath, pkg => {
        if (projectType === 'normal') {
          let newVersion = `^${version}`;
          let packageName = 'react-scripts';
          if (pkg.dependencies[packageName]) {
            // v2.1.1
            pkg.dependencies[packageName] = newVersion;
          } else {
            // v1.0.0
            pkg.devDependencies[packageName] = newVersion;
          }
        }
        let time = getTime(version);
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
      projectType,
      version
    });
  });
}

module.exports.createRemoteCommand = function createRemoteCommand(projectName, projectType, version) {
  return asdf({
    projectName,
    projectType,
    version
  });
};

module.exports.createCommand = function createCommand(projectName, projectType, version) {
  return tryCreateLocalCommand({
    basedir: process.cwd(),
    projectName,
    projectType,
    version
  }).then(command => {
    if (command) {
      return command;
    }
    return utils.which(packageName).then(packagePath => {
      return tryCreateLocalCommand({
        basedir: path.dirname(packagePath),
        projectName,
        projectType,
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
    return module.exports.createRemoteCommand(projectName, projectType, version);
  });
};
