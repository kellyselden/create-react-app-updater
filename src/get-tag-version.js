'use strict';

const _getTagVersion = require('boilerplate-update/src/get-tag-version');

module.exports = function getTagVersion(versions) {
  return async function getTagVersion(range) {
    return await _getTagVersion({
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
