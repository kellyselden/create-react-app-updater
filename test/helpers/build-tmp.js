'use strict';

const path = require('path');
const fs = require('fs-extra');
const tmp = require('tmp');
const {
  gitInit,
  commit,
  postCommit
} = require('git-fixtures');

module.exports = function({
  fixturesPath,
  commitMessage,
  dirty,
  subDir = ''
}) {
  let tmpPath = tmp.dirSync().name;

  gitInit({
    cwd: tmpPath
  });

  let tmpSubPath = path.join(tmpPath, subDir);

  fs.ensureDirSync(tmpSubPath);

  fs.copySync(fixturesPath, tmpSubPath);

  commit({
    m: commitMessage,
    cwd: tmpPath
  });

  postCommit({
    cwd: tmpPath,
    dirty
  });

  return tmpSubPath;
};
