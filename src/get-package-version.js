'use strict';

module.exports = function getPackageVersion({
  dependencies
}) {
  let packageVersion;

  if (dependencies) {
    packageVersion = dependencies['react-scripts'];
  }

  if (!packageVersion) {
    throw 'Create React App version could not be determined';
  }

  return packageVersion;
};
