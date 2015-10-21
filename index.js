import fs from 'fs'
import isThere from 'is-there'

let dirList = []

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

console.log('Will try to interlink the following dirs:')
console.log(dirList)
