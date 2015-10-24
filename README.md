# npm-interlink

[![Version npm](https://img.shields.io/npm/v/npm-interlink.svg?style=flat-square)](https://www.npmjs.com/package/npm-interlink)
[![Dependencies](https://img.shields.io/david/orlin/npm-interlink.svg?style=flat-square)](https://david-dm.org/orlin/npm-interlink)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com)

Sets up several node projects for local development using `npm link`.
Especially useful in the context of `nvm` and / or having many projects that depend on each other.

## Why

1. quickly setup a bunch of modules for local development or experimentation (install or link)
2. link a bunch of modules among themselves, without having to remember the interdependencies
3. relink the same modules in another context, e.g. because `nvm` links modules per node version
4. easily link the modules incrementally, just rerun it and new modules get linked, linked to

## How

All it needs are project paths, or it tries the immediate subdirectories of the current dir.
Any dir with `package.json` will be `npm link`ed - making its module global.
Any dir with `package.json` dependencies referencing a linked module will get them linked to its `node_modules`.
Already linked modules that are not explicitly part of an *interlink* set will not be linked to.

## Use

[![NPM](https://nodei.co/npm/npm-interlink.png?compact=true)](https://www.npmjs.org/package/npm-interlink)

Clone some node.js projects and run `npm-interlink` in their parent directory.
Clone is really a metaphor here, as `npm-interlink` is agnostic to version control.

$ `npm-interlink -?`

### Options

Because `npm-interlink` makes it easy to setup many node projects, potentially saving a lot of time that would be otherwise spent waiting to oversee command results, I added some options that can ask it to do something other than its default behavior.

* `-i` or `--install` will install the `node_modules` for each package and skip linking altogether - keep in mind that `npm link` and thus `npm-interlink` without options will also install, so this is for install only
* `-o` or `--only` will only interlink modules that are already linked, this is perhaps because one wants partially interlinked modules, also `npm link module` is a very fast command compared to `npm install` or `npm link` (self), thus linking incrementally is a good pattern, perhaps this should be the default...

### Configure

Create a `.npm-interlink` file containing the list of dirs / modules to interlink.
Use relative or absolute paths - one per line.

For example, here is how I interlink the [gulpsome beverage](https://github.com/gulpsome) modules, plus a couple of other projects of mine that they depend on:

```text
be-goods
beverage
../childish-process
gulp-cause
gulp-harp
gulp-npm-run
gulp-npm-test
hal-rc
../sourcegate
```

How you setup the directory structure is entirely up to you, though this obviously works well for organizations (collections of repos).  One can start with a subset and add more projects as the need to work on them arises.

## Develop [![Dependencies](https://img.shields.io/david/dev/orlin/npm-interlink.svg?style=flat-square&label=devDependencies)](https://david-dm.org/orlin/npm-interlink#info=devDependencies)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## License

[MIT](http://orlin.mit-license.org)
