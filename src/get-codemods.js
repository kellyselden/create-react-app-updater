'use strict';

const https = require('https');

const url = 'https://rawgit.com/ember-cli/ember-cli-update-codemods-manifest/v2/manifest.json';

module.exports = function getCodemods() {
  // return new Promise((resolve, reject) => {
  //   https.get(url, res => {
  //     let manifest = '';
  //     res.on('data', d => {
  //       manifest += d;
  //     }).on('end', () => {
  //       resolve(JSON.parse(manifest));
  //     });
  //   }).on('error', reject);
  // });
  return Promise.resolve(JSON.parse(`
  {
    "create-element-to-jsx": {
      "version": "2.0.0",
      "projectTypes": ["normal", "ejected"],
      "nodeVersion": "4.0.0",
      "script": "` +
`const cp = require('child_process');` +
`const path = require('path');` +
`let cwd = process.argv[1];` +
`cp.execSync('git clone https://github.com/reactjs/react-codemod.git .', { cwd });` +
`cp.execSync('npm install --ignore-scripts', { cwd });` +
`cp.spawnSync('node', [` +
`  path.join(cwd, 'node_modules/jscodeshift/bin/jscodeshift.sh'),` +
`  '-t',` +
`  path.join(cwd, 'transforms/create-element-to-jsx.js'),` +
`  'src'` +
`]);"
    }
  }`));
};
