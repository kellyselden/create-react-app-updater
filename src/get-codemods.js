'use strict';

const https = require('https');

const url = 'https://cdn.jsdelivr.net/gh/kellyselden/create-react-app-updater-codemods-manifest@vv1/manifest.json';

module.exports = function getCodemods() {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let manifest = '';
      res.on('data', d => {
        manifest += d;
      }).on('end', () => {
        resolve(JSON.parse(manifest));
      });
    }).on('error', reject);
  });
};
