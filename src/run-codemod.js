'use strict';

const utils = require('./utils');
const denodeify = require('denodeify');
const tmpDir = denodeify(require('tmp').dir);

module.exports = function runCodemod(codemod) {
  if (codemod.script) {
    return tmpDir().then(cwd => {
      eval(`process.argv = ['${process.argv[0]}', '${cwd}']; ${codemod.script}`);
    });
  }
  return codemod.commands.reduce((promise, command) => {
    return promise.then(() => {
      return utils.npx(command).catch(() => {});
    });
  }, Promise.resolve());
};
