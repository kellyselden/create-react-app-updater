'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('chai');
const {
  buildTmp,
  processBin,
  fixtureCompare: _fixtureCompare
} = require('git-fixtures');
const {
  assertNormalUpdate,
  assertNoUnstaged,
  assertCodemodRan
} = require('../helpers/assertions');

describe(function() {
  this.timeout(30 * 1000);

  let tmpPath;

  async function merge({
    fixturesPath,
    runCodemods,
    subDir = '',
    commitMessage
  }) {
    tmpPath = await buildTmp({
      fixturesPath,
      commitMessage,
      subDir
    });

    let args = [
      '--to=2.1.1'
    ];
    if (runCodemods) {
      args = [
        '--run-codemods'
      ];
    }

    return await processBin({
      binFile: 'index',
      args,
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

  it('works', async function() {
    this.timeout(5 * 60 * 1000);

    let {
      status
    } = await (await merge({
      fixturesPath: 'test/fixtures/normal/local',
      commitMessage: 'my-app'
    })).promise;

    fixtureCompare({
      mergeFixtures: 'test/fixtures/normal/merge/my-app'
    });

    assertNormalUpdate(status);
    assertNoUnstaged(status);
  });

  it('runs codemods', async function() {
    this.timeout(5 * 60 * 1000);

    let {
      ps,
      promise
    } = await merge({
      fixturesPath: 'test/fixtures/codemod/before',
      commitMessage: 'my-app',
      runCodemods: true
    });

    ps.stdout.on('data', data => {
      let str = data.toString();
      if (str.includes('These codemods apply to your project.')) {
        ps.stdin.write('a\n');
      }
    });

    let {
      status
    } = await promise;

    // file is indeterminent between OS's, so ignore
    // fs.removeSync(path.join(tmpPath, 'MODULE_REPORT.md'));

    let mergeFixtures = 'test/fixtures/codemod/latest-node/my-app';
    if (process.env.NODE_LTS) {
      mergeFixtures = 'test/fixtures/codemod/min-node/my-app';
    }

    fixtureCompare({
      mergeFixtures
    });

    assertNoUnstaged(status);
    assertCodemodRan(status);
  });
});
