const util = require('util') 
const fs = require('fs')
export const awaitableReaddir = util.promisify(fs.readdir)
