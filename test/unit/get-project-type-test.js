'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getProjectType = require('../../src/get-project-type');

describe(getProjectType, function() {
  it('throws if not found', function() {
    let packageJson = {};

    expect(() => {
      getProjectType(packageJson);
    }).to.throw('Create React App project type could not be determined');
  });

  describe('dependencies', function() {
    it('detects normal app', function() {
      let packageJson = {
        dependencies: {
          'react-scripts': '2.11',
        },
      };

      expect(getProjectType(packageJson)).to.equal('normal');
    });

    it('detects normal app with empty string', function() {
      let packageJson = {
        dependencies: {
          'react-scripts': '',
        },
      };

      expect(getProjectType(packageJson)).to.equal('normal');
    });

    it('detects ejected app', function() {
      let packageJson = {
        dependencies: {
          'react-dev-utils': '2.11',
        },
      };

      expect(getProjectType(packageJson)).to.equal('ejected');
    });

    it('detects ejected app with empty string', function() {
      let packageJson = {
        dependencies: {
          'react-dev-utils': '',
        },
      };

      expect(getProjectType(packageJson)).to.equal('ejected');
    });
  });

  describe('devDependencies', function() {
    it('detects normal app', function() {
      let packageJson = {
        devDependencies: {
          'react-scripts': '2.11',
        },
      };

      expect(getProjectType(packageJson)).to.equal('normal');
    });

    it('detects normal app with empty string', function() {
      let packageJson = {
        devDependencies: {
          'react-scripts': '',
        },
      };

      expect(getProjectType(packageJson)).to.equal('normal');
    });

    it('detects ejected app', function() {
      let packageJson = {
        devDependencies: {
          'react-dev-utils': '2.11',
        },
      };

      expect(getProjectType(packageJson)).to.equal('ejected');
    });

    it('detects ejected app with empty string', function() {
      let packageJson = {
        devDependencies: {
          'react-dev-utils': '',
        },
      };

      expect(getProjectType(packageJson)).to.equal('ejected');
    });
  });
});
