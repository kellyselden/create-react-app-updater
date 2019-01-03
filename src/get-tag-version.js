'use strict';

const _getTagVersion = require('boilerplate-update/src/get-tag-version');

module.exports = function getTagVersion(versions) {
  return function getTagVersion(range) {
    return _getTagVersion({
      range,
      versions,
      packageName: 'create-react-app',
      distTags: [
        'latest',
        'next',
        'canary'
      ]
    });
  };
};
