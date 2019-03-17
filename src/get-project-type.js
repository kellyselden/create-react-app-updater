'use strict';

module.exports = function getProjectType({
  dependencies,
  devDependencies
}) {
  function checkForDep(packageName) {
    return allDeps[packageName] !== undefined;
  }

  let allDeps = Object.assign({}, dependencies, devDependencies);

  let isNormal = checkForDep('react-scripts');

  if (isNormal) {
    return 'normal';
  }

  let isEjected = checkForDep('react-dev-utils');

  if (isEjected) {
    return 'ejected';
  }

  throw 'Create React App project type could not be determined';
};
