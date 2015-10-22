# npm-interlink

Sets up several node projects for local development using `npm link`.
Especially useful in the context of `nvm` and / or having many projects that depend on each other.

## Why

1. quickly setup a bunch of modules for local development or experimentation
2. relink the same modules in another context, e.g. because `nvm` links modules per node version

## How

All it needs are project paths, or it tries the immediate subdirectories of the current dir.
Any dir with `package.json` will be `npm link`ed - making its module global.
Any dir with `package.json` dependencies referencing a linked module will get them linked to its `node_modules`.
Already linked modules that are not explicitly part of an *interlink* set will not be linked to.

## Use

[![NPM](https://nodei.co/npm/npm-interlink.png?mini=true)](https://www.npmjs.org/package/npm-interlink)

Clone some node.js projects and run `npm-interlink` in their parent directory.
Clone is really a metaphor here, as `npm-interlink` is agnostic to version control.

### Configure

Create a `.npm-interlink` file containing the list of dirs / modules to interlink.
Use relative or absolute paths - one per line.

## Develop

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## License

[MIT](http://orlin.mit-license.org)
