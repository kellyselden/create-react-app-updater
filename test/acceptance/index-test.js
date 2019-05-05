'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('chai');
// const fs = require('fs-extra');
// const path = require('path');
const co = require('co');
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

  let merge = co.wrap(function* merge({
    fixturesPath,
    runCodemods,
    subDir = '',
    commitMessage
  }) {
    tmpPath = yield buildTmp({
      fixturesPath,
      commitMessage,
      subDir
    });

    let args = [
      '--to',
      '2.1.1'
    ];
    if (runCodemods) {
      args = [
        '--run-codemods'
      ];
    }

    return processBin({
      binFile: 'index',
      args,
      cwd: tmpPath,
      commitMessage,
      expect
    });
  });

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

  it.skip('updates app', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-app'
    }).promise.then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/my-app'
      });

      assertNormalUpdate(status);
      assertNoUnstaged(status);
    });
  });

  it('runs codemods', co.wrap(function*() {
    this.timeout(5 * 60 * 1000);

    let {
      ps,
      promise
    } = yield merge({
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
    } = yield promise;

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
  }));
});
