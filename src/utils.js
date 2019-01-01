'use strict';

const denodeify = require('denodeify');

module.exports.run = require('./run');
module.exports.npx = require('./npx');
module.exports.getCodemods = require('boilerplate-update/src/get-codemods').bind(null, 'https://cdn.jsdelivr.net/gh/kellyselden/create-react-app-updater-codemods-manifest@vv1/manifest.json');
module.exports.getNodeVersion = require('./get-node-version');
module.exports.getApplicableCodemods = require('./get-applicable-codemods');
module.exports.resolve = denodeify(require('resolve'));
module.exports.require = require;
module.exports.which = denodeify(require('which'));
