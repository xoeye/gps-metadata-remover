#!/usr/bin/env node

const { removeLocation } = require('../../lib/index')
const util = require('util') 
const fs = require('fs')
const awaitableOpen = util.promisify(fs.open)
const awaitableRead = util.promisify(fs.read)
const awaitableWrite = util.promisify(fs.write)
const awaitableCopy = util.promisify(fs.copyFile)
const awaitableUnlink = util.promisify(fs.unlink)

const removeLocationFromFile = async(fileName, sourceDirectory, destDirectory) => {
  //const dotIndex = sourcePath.lastIndexOf('.')
  //const tempFileTag = '-noGPS'
  // const tempFilePath = sourcePath.replace(new RegExp(`^(.{${dotIndex}})(.)`), `$1${tempFileTag}$2`)
  console.log('file name', fileName)
  const originalFilePath = sourceDirectory + fileName
  const tempFilePath = destDirectory + fileName
  if (!fs.existsSync(destDirectory)){
    fs.mkdirSync(destDirectory);
  }
  await awaitableCopy(originalFilePath, tempFilePath)
  const fileDescriptor = await awaitableOpen(tempFilePath, 'r+')
  const read = async (size, offset) => {
    const buffer = Buffer.alloc(size)
    const readFile = await awaitableRead(fileDescriptor, buffer, 0, size, offset)
    console.log('readFile buffer', readFile.buffer)
    return readFile.buffer
  }
  const write = async (writeValue, entryOffset, encoding) => {
    const buffer = Buffer.alloc(writeValue.length, writeValue, encoding)
    await awaitableWrite(fileDescriptor, buffer, 0, writeValue.length, entryOffset)
  }
  const locationRemoved = await removeLocation(tempFilePath, read, write)
  if (locationRemoved) {
  console.log('found GPS, wrote stripped file to ', tempFilePath)
  } else {
    console.log('no GPS found')
    //await awaitableUnlink(tempFilePath)
  }
}

exports.removeLocationFromFile = removeLocationFromFile
