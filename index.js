import fs from 'fs'
import path from 'path'
import isThere from 'is-there'
import jsonfile from 'jsonfile'
import R from 'ramda'
import {spawnSync, execSync} from 'child_process'
import chalk from 'chalk'
import yargs from 'yargs'

const red = chalk.red
const bad = chalk.red.bold

let dirList = []
let modules = {}
let candidates = execSync('npm ls --global --depth 0').toString() // already linked?
let command = '' // context, everything is run synchronously, one command at a time
let gotErrs = []

let args = yargs
  .usage('$0 [options]')
  .option('h', {alias: ['help', '?'], type: 'boolean', description: 'show this help'})
  .option('i', {alias: 'install', type: 'boolean', description: 'install modules without linking'})
  .option('o', {alias: 'only', type: 'boolean', description: 'only interlink the already linked'})
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

function clog (something) {
  // short for conditional log
  if (something !== undefined) console.log(something)
}

function dollar (command, prelog) {
  let it = `\$ ${command}`
  clog(prelog)
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

function perform (spawnArgs, handle = {}) {
  let success = !hasErr(spawnSync.apply(null, spawnArgs))
  if (success) {
    clog(handle.success)
  } else {
    clog(bad(handle.failure))
  }
  if (handle.callback) {
    handle.callback(success)
  }
}

for (let dir of dirList) {
  if (isThere(path.join(dir, 'package.json'))) {
    try {
      let pkg = jsonfile.readFileSync(path.join(dir, 'package.json'))
      modules[pkg.name] = {}
      modules[pkg.name].dir = dir
      modules[pkg.name].path = path.resolve(dir)
      modules[pkg.name].linked = false
      if ((new RegExp(`${modules[pkg.name].path}\s*\r?\n`)).test(candidates)) {
        modules[pkg.name].linked = true
      }
      modules[pkg.name].links = R.union(keys(pkg.dependencies), keys(pkg.devDependencies))
      if (args.i) {
        command = dollar(`cd ${dir} && npm install`, '')
        perform(['npm', ['install'], {cwd: dir}], {
          failure: `Could not install ${pkg.name}'s dependencies.`,
          success: `Installed ${pkg.name}'s dependencies.`
        })
      } else if (!args.o) {
        if (!modules[pkg.name].linked) {
          command = dollar(`cd ${dir} && npm link #${pkg.name}`, '')
          perform(['npm', ['link'], {cwd: dir}], {
            failure: `Module ${pkg.name} failed to link itself.`,
            success: `Linked ${pkg.name}.`,
            callback: (success) => { if (success) modules[pkg.name].linked = true }
          })
        } else {
          console.log(`Module ${pkg.name} is already linked.`)
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
      if (modules[pkg].linked) {
        command = dollar(`cd ${modules[name].dir} && npm link ${pkg}`)
        perform(['npm', ['link', pkg], {cwd: modules[name].dir}], {
          failure: `Module ${name} failed to link ${pkg}.`
        })
      } else {
        console.log(red(`Module ${pkg} isn't linked, thus not linking to it.`))
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
