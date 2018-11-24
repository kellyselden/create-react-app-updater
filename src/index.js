'use strict';

const fs = require('fs');
const getPackageJson = require('./get-package-json');
const getProjectType = require('./get-project-type');
const getPackageVersion = require('./get-package-version');
const getVersions = require('./get-versions');
const getProjectVersion = require('./get-project-version');
const getTagVersion = require('./get-tag-version');
const formatStats = require('./format-stats');
const getApplicableCodemods = require('./get-applicable-codemods');
const runCodemods = require('./run-codemods');
const mergePackageJson = require('merge-package.json');
const gitDiffApply = require('git-diff-apply');
const run = require('./run');
const utils = require('./utils');
const getStartAndEndCommands = require('./get-start-and-end-commands');

module.exports = function createReactAppUpdater({
  from,
  to,
  resolveConflicts,
  runCodemods: _runCodemods,
  reset,
  statsOnly,
  listCodemods
}) {
  return Promise.resolve().then(() => {
    if (listCodemods) {
      return utils.getCodemods().then(codemods => {
        return JSON.stringify(codemods, null, 2);
      });
    }

    let packageJson = getPackageJson('.');
    let projectType = getProjectType(packageJson);
    let versions = getVersions();
    return getPackageVersion(packageJson, projectType, versions).then(packageVersion => {
      let startVersion;
      if (from) {
        startVersion = getTagVersion(from, versions);
      } else {
        startVersion = getProjectVersion(packageVersion, versions);
      }

      let endVersion = getTagVersion(to, versions);

      let startTag = `v${startVersion}`;
      let endTag = `v${endVersion}`;

      if (statsOnly) {
        return getApplicableCodemods({
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
        return getApplicableCodemods({
          startVersion
        }).then(codemods => {
          const inquirer = require('inquirer');

          return inquirer.prompt([{
            type: 'checkbox',
            message: 'These codemods apply to your project. Select which ones to run.',
            name: 'codemods',
            choices: Object.keys(codemods)
          }]).then(answers => {
            return runCodemods(answers.codemods.map(codemod => codemods[codemod]));
          });
        });
      }

      let startCommand;
      let endCommand;

      return getStartAndEndCommands({
        projectName: packageJson.name,
        projectType,
        startVersion,
        endVersion
      }).then(commands => {
        startCommand = commands.startCommand;
        endCommand = commands.endCommand;

        let ignoredFiles;
        if (!reset) {
          ignoredFiles = ['package.json'];
        } else {
          ignoredFiles = [];
        }

        return gitDiffApply({
          startTag,
          endTag,
          resolveConflicts,
          ignoredFiles,
          reset,
          createCustomDiff: true,
          startCommand,
          endCommand
        }).then(results => {
          if (reset) {
            return;
          }

          let myPackageJson = fs.readFileSync('package.json', 'utf8');
          let fromPackageJson = results.from['package.json'];
          let toPackageJson = results.to['package.json'];

          let newPackageJson = mergePackageJson(myPackageJson, fromPackageJson, toPackageJson);

          fs.writeFileSync('package.json', newPackageJson);

          run('git add package.json');
        });
      });
    });
  });
};
