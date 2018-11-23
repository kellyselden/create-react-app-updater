'use strict';

module.exports = function getProjectType({
  dependencies,
  devDependencies
}) {
  let allDeps = Object.assign({}, dependencies, devDependencies);

  let isNormal = !!allDeps['react-scripts'];

  if (isNormal) {
    return 'normal';
  }

  let isEjected = !!allDeps['react-dev-utils'];

  if (isEjected) {
    return 'ejected';
  }

  throw 'Create React App project type could not be determined';
};
