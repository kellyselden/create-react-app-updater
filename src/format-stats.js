'use strict';

module.exports = function formatStats({
  startVersion,
  endVersion,
  codemods
}) {
  return [
    `from version: ${startVersion}`,
    `to version: ${endVersion}`,
    `applicable codemods: ${Object.keys(codemods).join(', ')}`
  ].join('\n');
};
