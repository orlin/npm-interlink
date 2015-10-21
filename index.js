import fs from 'fs'
import path from 'path'
import isThere from 'is-there'
import jsonfile from 'jsonfile'
import R from 'ramda'
import {spawnSync} from 'child_process'

let dirList = []
let modules = {}

if (isThere('.npm-interlink')) {
  console.log('Configuration .npm-interlink found.')
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

function gotErr (spawned) {
  if (spawned.status !== 0 || spawned.error || spawned.stderr.toString()) {
    console.error(R.pick(['status', 'error', 'stderr'], spawned))
    return true
  } else {
    return false
  }
}

for (let dir of dirList) {
  if (isThere(path.join(dir, 'package.json'))) {
    try {
      let pkg = jsonfile.readFileSync(path.join(dir, 'package.json'))
      modules[pkg.name] = {}
      modules[pkg.name].dir = dir
      modules[pkg.name].links = R.union(keys(pkg.dependencies), keys(pkg.devDependencies))
      console.log(`\$ cd ${dir} && npm link #${pkg.name}`)
      let res = spawnSync('npm', ['link'], {cwd: dir})
      if (!gotErr(res)) {
        console.log(`Linked ${pkg.name}.`)
      }
    } catch (e) {
      console.error(e)
    }
  } else {
    console.log(`Skipping ${dir} - package.json not found.`)
  }
}

for (let name in modules) {
  let names = R.keys(modules)
  modules[name].links = R.intersection(modules[name].links, names)
}

console.log('If no errors above, the following should be interlinked:')
for (let name in modules) {
  console.log(`${name}: [${modules[name].links}]`)
}
