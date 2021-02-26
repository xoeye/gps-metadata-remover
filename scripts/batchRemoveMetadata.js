#!/usr/bin/env node
const { removeLocationFromFile } = require('../__tests__/utils/nodeStripContent')
const fs = require('fs')
const args = process.argv.slice(2)
const files = fs.readdirSync(args[0])
const ensureSlashAtEndOfPath = path => path.charAt(path.length -1) === '/' ? path : path + '/'
const sourcePath = ensureSlashAtEndOfPath(args[0])
const destPath = ensureSlashAtEndOfPath(args[1])
files.forEach(file => {
  removeLocationFromFile(file, sourcePath, destPath)
})
