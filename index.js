import fs from 'fs'
import path from 'path'
import isThere from 'is-there'
import jsonfile from 'jsonfile'
import R from 'ramda'
import {spawnSync} from 'child_process'
import chalk from 'chalk'
import yargs from 'yargs'

const red = chalk.red
const bad = chalk.red.bold

let dirList = []
let modules = {}
let command = '' // context, everything is run synchronously, one command at a time
let gotErrs = []

let args = yargs
  .usage('$0 [options]')
  .option('h', {alias: ['help', '?'], type: 'boolean', description: 'show this help'})
  .option('i', {alias: 'install', type: 'boolean', description: 'install modules without linking'})
  .argv

if (args.h) {
  console.log('Can install, link and interlink a bunch of node modules.')
  console.log('')
  console.log(yargs.help())
  process.exit(0)
}

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

function dollar (command, prelog) {
  let it = `\$ ${command}`
  if (prelog !== undefined) console.log(prelog)
  console.log(it)
  return it
}

function hasErr (spawned) {
  if (spawned.stderr.toString()) {
    console.error(red(spawned.stderr.toString())) // doesn't necessarily mean error
  }
  if (spawned.status !== 0 || spawned.error) {
    console.error(`The exit status code is a bad ${red(spawned.status)}.`)
    if (spawned.error) {
      console.error(red('Got the following error:'))
      console.error(spawned.error)
    }
    gotErrs.push(command)
    return true
  }
  return false
}

for (let dir of dirList) {
  if (isThere(path.join(dir, 'package.json'))) {
    try {
      let pkg = jsonfile.readFileSync(path.join(dir, 'package.json'))
      modules[pkg.name] = {}
      modules[pkg.name].dir = dir
      modules[pkg.name].links = R.union(keys(pkg.dependencies), keys(pkg.devDependencies))
      if (args.i) {
        command = dollar(`cd ${dir} && npm install`, '')
        if (!hasErr(spawnSync('npm', ['install'], {cwd: dir}))) {
          console.log(`Installed ${pkg.name}'s dependencies.`)
        } else {
          console.log(bad(`Could not install ${pkg.name}'s dependencies.`))
        }
      }
      if (!args.i) {
        command = dollar(`cd ${dir} && npm link #${pkg.name}`, '')
        if (!hasErr(spawnSync('npm', ['link'], {cwd: dir}))) {
          console.log(`Linked ${pkg.name}.`)
        } else {
          console.log(bad(`Module ${pkg.name} failed to link itself.`))
        }
      }
    } catch (e) {
      console.error(red(e))
      gotErrs.push(command)
    }
  } else {
    console.log(`Skipping ${dir} - package.json not found.`)
  }
}

if (!args.i) {
  for (let name in modules) {
    let names = R.keys(modules)
    modules[name].links = R.intersection(modules[name].links, names)
    console.log('')
    console.log(`Linking ${name} modules: [${modules[name].links}]...`)
    for (let pkg of modules[name].links) {
      command = dollar(`cd ${modules[name].dir} && npm link ${pkg}`)
      if (hasErr(spawnSync('npm', ['link', pkg], {cwd: modules[name].dir}))) {
        console.log(bad(`Module ${name} failed to link ${pkg}.`))
      }
    }
  }
}

if (gotErrs.length > 0) {
  console.error('')
  console.error(bad(`In summary, got ${gotErrs.length} error${gotErrs.length > 1 ? 's' : ''}:`))
  for (let err of gotErrs) {
    console.error(red(err))
  }
  process.exit(1)
} else {
  console.log('')
  console.log('All done, have no errors to report.')
}
