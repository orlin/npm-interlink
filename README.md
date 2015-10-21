# npm-interlink

Sets up several node projects for local development using `npm link`.
Especially useful in the context of `nvm` and / or having many projects that depend on each other.

## How

All it needs are project paths, or it tries the immediate subdirectories of the current dir.
Any dir with `package.json` will be `npm link`ed - making its module global.
Any dir with `package.json` dependencies referencing a linked module will get them linked to its `node_modules`.
Already linked modules that are not explicitly part of an *interlink* set will not be linked to.

## Configure

Create a `.npm-interlink` file containing the list of dirs / modules to interlink.
Use relative or absolute paths - one per line.

## License

[MIT](http://orlin.mit-license.org)
