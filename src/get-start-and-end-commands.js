'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const denodeify = require('denodeify');
const tmpDir = denodeify(require('tmp').dir);
const rimraf = denodeify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const symlinkOrCopySync = require('symlink-or-copy').sync;
const readFile = denodeify(fs.readFile);
const writeFile = denodeify(fs.writeFile);

const packageName = 'react-scripts';

function mutatePackageJson(cwd, callback) {
  let filePath = path.join(cwd, 'package.json');
  return readFile(filePath).then(file => {
    let pkg = JSON.parse(file);
    callback(pkg);
    file = JSON.stringify(pkg, null, 2);
    return writeFile(filePath, file);
  });
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
  f1
}) {
  return tmpDir().then(cwd => {
    let appPath = path.join(cwd, projectName);
    fs.mkdirSync(appPath);
    let nodeModules = path.join(appPath, 'node_modules');
    fs.mkdirSync(nodeModules);
    utils.run('npm init --yes', { cwd: appPath });
    return f1(appPath).then(() => {
      let packageRoot = path.join(nodeModules, packageName);
      let init = require(path.join(packageRoot, 'scripts/init'));
      let old = process.cwd();
      process.chdir(appPath);
      init(appPath, projectName);
      process.chdir(old);
      return Promise.all([
        rimraf(path.join(appPath, '.git')),
        rimraf(nodeModules),
        rimraf(path.join(appPath, 'package-lock.json'))
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
      f1(appPath) {
        return mutatePackageJson(appPath, pkg => {
          pkg.devDependencies[packageName] = `^${version}`;
        }).then(() => {
          symlinkOrCopySync(packageRoot, path.join(appPath, 'node_modules', packageName));
        });
      }
    });
  });
}

module.exports.createRemoteCommand = function createRemoteCommand(projectName, version) {
  return asdf({
    projectName,
    f1(appPath) {
      utils.run(`npm install ${packageName}@${version} --save-dev --no-package-lock`, { cwd: appPath });
      return Promise.resolve();
    }
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
