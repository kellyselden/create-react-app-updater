#!/usr/bin/env node
'use strict';

const createReactAppUpdater = require('../src');
const args = require('../src/args');

const { argv } = require('yargs')
  .options(args);

(async() => {
  try {
    let message = await createReactAppUpdater(argv);

    if (message) {
      console.log(message);
    }
  } catch (err) {
    console.error(err);
  }
})();
