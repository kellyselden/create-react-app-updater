'use strict';

module.exports = {
  'from': {
    type: 'string',
    description: 'Use a starting version that is different than what is in your package.json ("2.9.1")'
  },
  'to': {
    type: 'string',
    default: 'latest',
    description: 'Update to a version that isn\'t latest ("2.14.1", "~2.15", "latest", "beta")'
  },
  'resolve-conflicts': {
    type: 'boolean',
    default: false,
    description: 'Automatically run git mergetool if conflicts found'
  },
  'run-codemods': {
    type: 'boolean',
    default: false,
    description: 'Run codemods to help update your code'
  },
  'reset': {
    type: 'boolean',
    default: false,
    description: 'Reset your code to the default boilerplate at the new version'
  },
  'stats-only': {
    type: 'boolean',
    default: false,
    description: 'Show all calculated values regarding your project'
  },
  'list-codemods': {
    type: 'boolean',
    default: false,
    description: 'List available codemods'
  }
};
