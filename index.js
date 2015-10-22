import fs from 'fs'
import path from 'path'
import isThere from 'is-there'
import jsonfile from 'jsonfile'
import R from 'ramda'
import {spawnSync} from 'child_process'
import chalk from 'chalk'

const red = chalk.red
const bad = chalk.red.bold

let dirList = []
let modules = {}
let gotErrs = 0

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

function hasErr (spawned) {
  if (spawned.status !== 0 || spawned.error || spawned.stderr.toString()) {
    console.error(red(R.pick(['status', 'error'], spawned)))
    if (spawned.stderr) console.error(red(spawned.stderr.toString()))
    gotErrs++
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
      if (!hasErr(res)) {
        console.log(`Linked ${pkg.name}.`)
      } else {
        console.log(bad(`Module ${pkg.name} failed to link itself.`))
      }
    } catch (e) {
      console.error(red(e))
      gotErrs++
    }
  } else {
    console.log(`Skipping ${dir} - package.json not found.`)
  }
}

for (let name in modules) {
  let names = R.keys(modules)
  modules[name].links = R.intersection(modules[name].links, names)
  console.log(`Linking ${name} modules: [${modules[name].links}]...`)
  for (let pkg of modules[name].links) {
    console.log(`\$ cd ${modules[name].dir} && npm link ${pkg}`)
    let res = spawnSync('npm', ['link', pkg], {cwd: modules[name].dir})
    if (hasErr(res)) {
      console.log(bad(`Module ${name} failed to link ${pkg}.`))
    }
  }
}

/*
console.log('If no errors above, the following should be interlinked:')
for (let name in modules) {
  console.log(`${name}: [${modules[name].links}]`)
}
*/

if (gotErrs > 0) {
  console.error(bad(`Got ${gotErrs} error${gotErrs > 1 ? 's' : ''}.`))
  process.exit(1)
}
