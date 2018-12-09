'use strict';

const { expect } = require('chai');
const getProjectType = require('../../src/get-project-type');

describe('Integration - getProjectType', function() {
  it.skip('throws if not found', function() {
    let packageJson = {};

    expect(() => {
      getProjectType(packageJson);
    }).to.throw('Ember CLI project type could not be determined');
  });

  it.skip('detects ember app', function() {
    let packageJson = {
      devDependencies: {
        'ember-cli': '2.11'
      }
    };

    expect(getProjectType(packageJson)).to.equal('app');
  });

  it.skip('detects ember addon', function() {
    let packageJson = {
      keywords: [
        'ember-addon'
      ],
      devDependencies: {
        'ember-cli': '2.11'
      }
    };

    expect(getProjectType(packageJson)).to.equal('addon');
  });

  it.skip('detects glimmer app', function() {
    let packageJson = {
      devDependencies: {
        '@glimmer/blueprint': '0.3'
      }
    };

    expect(getProjectType(packageJson)).to.equal('glimmer');
  });
});
