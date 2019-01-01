'use strict';

const denodeify = require('denodeify');

module.exports.run = require('./run');
module.exports.npx = require('./npx');
module.exports.resolve = denodeify(require('resolve'));
module.exports.require = require;
module.exports.which = denodeify(require('which'));
