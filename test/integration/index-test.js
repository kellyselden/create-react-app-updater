'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
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

  let tmpPath;

  async function merge({
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
    tmpPath = await buildTmp({
      fixturesPath,
      commitMessage,
      dirty
    });

    let promise = createReactAppUpdater({
      cwd: tmpPath,
      from,
      to,
      reset,
      compareOnly,
      statsOnly,
      runCodemods,
      listCodemods
    });

    return await processExit({
      promise,
      cwd: tmpPath,
      commitMessage,
      expect
    });
  }

  function fixtureCompare({
    mergeFixtures
  }) {
    let actual = tmpPath;
    let expected = mergeFixtures;

    _fixtureCompare({
      expect,
      actual,
      expected
    });
  }

  it('resets app', async function() {
    this.timeout(5 * 60 * 1000);

    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      reset: true
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/normal/reset/my-app'
    });

    expect(status).to.match(/^\?{2} src\/serviceWorker\.js$/m);

    assertNoStaged(status);
  });

  it('resolves semver ranges', async function() {
    let {
      result
    } = await merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      from: '< 1',
      to: '2.0.*',
      statsOnly: true
    });

    expect(result).to.include(`
from version: 0.7.0
to version: 2.0.4`);
  });

  it('shows stats only', async function() {
    let {
      result,
      status
    } = await merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      statsOnly: true
    });

    assertNoStaged(status);

    expect(result).to.equal(`project options: normal
from version: 1.0.0
to version: 2.1.1
codemods source: https://github.com/kellyselden/create-react-app-updater-codemods-manifest.git#semver:1
applicable codemods: create-element-to-jsx`);
  });

  it('lists codemods', async function() {
    let {
      result,
      status
    } = await merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app',
      listCodemods: true
    });

    assertNoStaged(status);

    expect(JSON.parse(result)).to.have.own.property('create-element-to-jsx');
  });

  it('can update an ejected app', async function() {
    this.timeout(5 * 60 * 1000);

    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/ejected/local',
      commitMessage: 'my-app'
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/ejected/merge/my-app'
    });

    assertNormalUpdate(status);
    assertNoUnstaged(status);
  });
});
