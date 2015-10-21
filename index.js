import fs from 'fs'
import path from 'path'
import isThere from 'is-there'
import jsonfile from 'jsonfile'
import R from 'ramda'

let dirList = []
let modules = {}

if (isThere('.npm-interlink')) {
  console.log('Configuration .npminter-link found.')
  dirList = fs.readFileSync('.npm-interlink').toString().split('\n').filter(item => {
    return item !== ''
  })
} else {
  dirList = fs.readdirSync('.').filter(file => {
    return fs.statSync(file).isDirectory()
  })
}

function keys (something) {
  return R.keys(something) || []
}

for (let dir of dirList) {
  try {
    let pkg = jsonfile.readFileSync(path.join(dir, 'package.json'))
    modules[pkg.name] = {}
    modules[pkg.name].dir = dir
    modules[pkg.name].links = R.union(keys(pkg.dependencies), keys(pkg.devDependencies))
  } catch (e) {
    console.error(e)
  }
}

for (let name in modules) {
  let names = R.keys(modules)
  modules[name].links = R.intersection(modules[name].links, names)
}

console.log('Will try to interlink the following modules:')
for (let name in modules) {
  console.log(`${name}: [${modules[name].links}]`)
}
