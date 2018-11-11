'use strict';

const packageName = 'react-scripts';

module.exports = function getPackageVersion({
  dependencies,
  devDependencies
}) {
  let packageVersion;

  if (dependencies) {
    // v2.1.1
    packageVersion = dependencies[packageName];
  }
  if (!packageVersion && devDependencies) {
    // v1.0.0
    packageVersion = devDependencies[packageName];
  }

  if (!packageVersion) {
    throw 'Create React App version could not be determined';
  }

  return packageVersion;
};
