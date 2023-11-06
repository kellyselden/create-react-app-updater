'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const path = require('path');
const _getStartAndEndCommands = require('../../src/get-start-and-end-commands');
const utils = require('../../src/utils');

const projectName = 'my-custom-app';
const createReactAppStartVersion = '0.0.1';
const reactScriptsStartVersion = '0.0.2';
const createReactAppEndVersion = '0.0.3';
const reactScriptsEndVersion = '0.0.4';
const reactScriptsVersion = reactScriptsStartVersion;
const startTime = '2016-10-07T15:13:30.196Z';
const endTime = '2016-10-31T06:49:14.797Z';
const packageRoot = '/test/package/root';
const packageVersion = createReactAppStartVersion;
const cwd = '/test/cwd';
const packageName = 'create-react-app';
const projectPath = path.normalize(`${cwd}/${projectName}`);

describe(_getStartAndEndCommands, function() {
  let npxSyncStub;
  let execaNodeStub;
  let ejectStub;

  beforeEach(function() {
    npxSyncStub = sinon.stub(utils, 'npxSync');
    execaNodeStub = sinon.stub(utils, 'execaNode').resolves();
    ejectStub = sinon.stub(utils, 'eject').resolves();
  });

  afterEach(function() {
    sinon.restore();
  });

  function getStartAndEndCommands(options) {
    return _getStartAndEndCommands(Object.assign({
      projectName,
      projectType: 'normal',
      createReactAppStartVersion,
      reactScriptsStartVersion,
      startTime,
      createReactAppEndVersion,
      reactScriptsEndVersion,
      endTime
    }, options));
  }

  it('returns an options object', function() {
    let options = getStartAndEndCommands();

    expect(options.createProjectFromCache).to.be.a('function');
    expect(options.createProjectFromRemote).to.be.a('function');
    expect(options.mutatePackageJson).to.be.a('function');

    delete options.createProjectFromCache;
    delete options.createProjectFromRemote;
    delete options.mutatePackageJson;

    expect(options).to.deep.equal({
      projectName,
      projectType: 'normal',
      packageName: 'create-react-app',
      startOptions: {
        packageVersion: createReactAppStartVersion,
        reactScriptsVersion: reactScriptsStartVersion,
        time: startTime
      },
      endOptions: {
        packageVersion: createReactAppEndVersion,
        reactScriptsVersion: reactScriptsEndVersion,
        time: endTime
      }
    });
  });

  it('can create a project from cache', async function() {
    let { createProjectFromCache } = getStartAndEndCommands();

    let createProject = createProjectFromCache({
      packageRoot,
      options: {
        projectName,
        reactScriptsVersion
      }
    });

    expect(await createProject(cwd)).to.equal(projectPath);

    expect(execaNodeStub.args).to.deep.equal([[
      path.normalize(`${packageRoot}/index.js`),
      [
        projectName,
        '--scripts-version',
        reactScriptsStartVersion
      ],
      {
        cwd
      }
    ]]);
  });

  it('can create a project from remote', async function() {
    let { createProjectFromRemote } = getStartAndEndCommands();

    let createProject = createProjectFromRemote({
      options: {
        projectName,
        packageVersion,
        reactScriptsVersion
      }
    });

    expect(await createProject(cwd)).to.equal(projectPath);

    expect(npxSyncStub.args).to.deep.equal([[
      [
        `${packageName}@${packageVersion}`,
        projectName,
        '--scripts-version',
        reactScriptsStartVersion
      ],
      {
        cwd
      }
    ]]);
  });

  it('can create an ejected project', async function() {
    let projectType = 'ejected';

    let options = getStartAndEndCommands({
      projectType
    });

    expect(options.projectType).to.equal(projectType);

    let createProject = options.createProjectFromCache({
      packageRoot,
      options: {
        projectName,
        projectType,
        reactScriptsVersion
      }
    });

    expect(await createProject(cwd)).to.equal(projectPath);

    expect(ejectStub.args).to.deep.equal([[
      {
        cwd: projectPath,
        reactScriptsVersion
      }
    ]]);
  });
});
