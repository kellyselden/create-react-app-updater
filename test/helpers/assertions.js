'use strict';

const { expect } = require('../helpers/chai');

module.exports.assertNormalUpdate = function(status) {
  expect(status).to.match(/^M {2}src\/App\.js$/m);
};

module.exports.assertNoUnstaged = function(status) {
  expect(status).to.not.match(/^.\w/m);
};

module.exports.assertNoStaged = function(status) {
  expect(status).to.not.match(/^\w/m);
};

module.exports.assertCodemodRan = function(status) {
  expect(status).to.match(/^M {2}.*src\/index\.js$/m);
};
