'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const co = require('co');
const {
  buildTmp,
  processExit,
  fixtureCompare: _fixtureCompare
} = require('git-fixtures');
const createReactAppUpdater = require('../../src');
const {
  assertNormalUpdate,
  assertNoUnstaged,
  assertNoStaged
} = require('../helpers/assertions');

describe(function() {
  this.timeout(30 * 1000);

  let cwd;
  let sandbox;
  let tmpPath;

  before(function() {
    cwd = process.cwd();
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();

    process.chdir(cwd);
  });

  let merge = co.wrap(function* merge({
    fixturesPath,
    dirty,
    from,
    to = '2.1.1',
    reset,
    compareOnly,
    statsOnly,
    runCodemods,
    listCodemods,
    commitMessage
  }) {
    tmpPath = yield buildTmp({
      fixturesPath,
      commitMessage,
      dirty
    });

    process.chdir(tmpPath);

    let promise = createReactAppUpdater({
      from,
      to,
      reset,
      compareOnly,
      statsOnly,
      runCodemods,
      listCodemods
    });

    return processExit({
      promise,
      cwd: tmpPath,
      commitMessage,
      expect
    });
  });

  function fixtureCompare({
    mergeFixtures
  }) {
    let actual = tmpPath;
    let expected = path.join(cwd, mergeFixtures);

    _fixtureCompare({
      expect,
      actual,
      expected
    });
  }

  it('resets app', function() {
    this.timeout(5 * 60 * 1000);

    return merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      reset: true
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/normal/reset/my-app'
      });

      expect(status).to.match(/^\?{2} src\/serviceWorker\.js$/m);

      assertNoStaged(status);
    });
  });

  it('resolves semver ranges', function() {
    return merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      from: '< 1',
      to: '2.0.*',
      statsOnly: true
    }).then(({
      result
    }) => {
      expect(result).to.include(`
from version: 0.7.0
to version: 2.0.4`);
    });
  });

  it('shows stats only', function() {
    return merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      statsOnly: true
    }).then(({
      result,
      status
    }) => {
      assertNoStaged(status);

      expect(result).to.equal(`project options: normal
from version: 1.0.0
to version: 2.1.1
applicable codemods: create-element-to-jsx`);
    });
  });

  it('lists codemods', function() {
    return merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      listCodemods: true
    }).then(({
      result,
      status
    }) => {
      assertNoStaged(status);

      expect(JSON.parse(result)).to.have.own.property('create-element-to-jsx');
    });
  });

  it('can update an ejected app', function() {
    this.timeout(5 * 60 * 1000);

    return merge({
      fixturesPath: 'test/fixtures/ejected/local',
      commitMessage: 'my-app'
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/ejected/merge/my-app'
      });

      assertNormalUpdate(status);
      assertNoUnstaged(status);
    });
  });
});
