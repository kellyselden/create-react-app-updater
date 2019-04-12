# create-react-app-updater

[![npm version](https://badge.fury.io/js/create-react-app-updater.svg)](https://badge.fury.io/js/create-react-app-updater)
[![Build Status](https://travis-ci.org/kellyselden/create-react-app-updater.svg?branch=master)](https://travis-ci.org/kellyselden/create-react-app-updater)
[![Build status](https://ci.appveyor.com/api/projects/status/y8ua3584brlpcrpb/branch/master?svg=true)](https://ci.appveyor.com/project/kellyselden/create-react-app-updater/branch/master)

Update [Create React App](https://facebook.github.io/create-react-app/) projects

Fetches list of codemods and instructions from [create-react-app-updater-codemods-manifest](https://github.com/kellyselden/create-react-app-updater-codemods-manifest)

This is a thin wrapper of [boilerplate-update](https://github.com/kellyselden/boilerplate-update).

Ported from [ember-cli-update](https://github.com/ember-cli/ember-cli-update)

https://www.youtube.com/watch?v=pgS3-F0sXeM

## Installation

As a global executable:

`npm install -g create-react-app-updater`

## Usage

Make sure your git working directory is clean before updating.

Inside your project directory, if you installed globally run

`create-react-app-updater`

or the shorter

`cra-update`

If you want to use [npx](https://www.npmjs.com/package/npx) run

`npx create-react-app-updater`

It applies a diff of the changes from the latest version to your project. It will only modify the files if there are changes between your project's version and the latest version, and it will only change the section necessary, not the entire file.

You will probably encounter merge conflicts, in which the default behavior is to let you resolve conflicts on your own. You can supply the `--resolve-conflicts` option to run your system's git merge tool if any conflicts are found.

This tool can also run codemods for you. The option `--run-codemods` will figure out what codemods apply to your current version of React, and download and run them for you.

## Examples

(These examples assume you are using the global command.)

To update to the latest version of Create React App:

```
cra-update
```

To update to a certain version of Create React App:

```
cra-update --to 2.1.1
```

To run codemods:

(This should be run after running the normal update shown above, and after you've resolved any conflicts.)

```
cra-update --run-codemods
```

## Options

| Option | Description | Type | Examples | Default |
|---|---|---|---|---|
| --from | Use a starting version that is different than what is in your package.json | String | "2.9.1" | |
| --to | Update to a version that isn\'t latest | String | "2.14.1" "~2.15" "latest" "beta" | "latest" |
| --resolve-conflicts | Automatically run git mergetool if conflicts found | Boolean | | false |
| --run-codemods | Run codemods to help update your code | Boolean | | false |
| --reset | Reset your code to the default boilerplate at the new version | Boolean | | false |
| --compare-only | Show the changes between different versions without updating | Boolean | | false |
| --stats-only | Show all calculated values regarding your project | Boolean | | false |
| --list-codemods | List available codemods | Boolean | | false |

## Hints

Need help using `git mergetool`? Here are some starting points:

* https://git-scm.com/docs/git-mergetool
* https://gist.github.com/karenyyng/f19ff75c60f18b4b8149

If you made a mistake during the update/conflict resolution, run these commands to undo everything and get you back to before the update:

```
git reset --hard
git clean -f
```

If you notice ".orig" files lying around after a merge and don't want that behavior, run `git config --global mergetool.keepBackup false`.

To avoid being prompted "Hit return to start merge resolution tool (vimdiff):" for every conflict, set a merge tool like `git config --global merge.tool "vimdiff"`.

If you run into an error like `error: unrecognized input`, you may need to update your git config color option like `git config --global color.ui auto`.

## Troubleshooting

If you are getting an error or unexpected results, running the command with the debug flag:

* Unix (global):&nbsp;&nbsp;&nbsp;`DEBUG=create-react-app-updater,boilerplate-update,git-diff-apply create-react-app-updater`
* Windows (global):&nbsp;&nbsp;&nbsp;`set DEBUG=create-react-app-updater,boilerplate-update,git-diff-apply && create-react-app-updater`
* Unix (npx):&nbsp;&nbsp;&nbsp;`DEBUG=create-react-app-updater,boilerplate-update,git-diff-apply npx create-react-app-updater`
* Windows (npx):&nbsp;&nbsp;&nbsp;`set DEBUG=create-react-app-updater,boilerplate-update,git-diff-apply && npx create-react-app-updater`

will give you more detailed logging.
