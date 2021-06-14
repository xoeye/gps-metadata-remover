// @flow
import jDataView from 'jdataview'
import base64 from 'Base64'

export type ReadFunction = (size: number, offset: number) => Promise<Buffer>
export type WriteFunction = (writeValue: string, entryOffset: number, encoding: string) => Promise<void>
export type Options = {
  skipXMPRemoval?: boolean
}

export const readNextChunkIntoDataView
= async (size: number, offset: number, read: ReadFunction) => {
  const dataBuffer = await read(size, offset)
  console.log('next chunk', dataBuffer)
  // eslint-disable-next-line no-await-in-loop
  // const decodedData = await base64.atob(currentTagInfoChunk)
  // const dataBuffer = binaryStringToArrayBuffer(decodedData)
  // eslint-disable-next-line new-cap
  return new jDataView(dataBuffer, 0, dataBuffer.byteLength)
}

export const getEncodedWipeoutString = async (sizeToRemove: number) => {
  const wipeoutString = getWipeoutString(sizeToRemove)
  return base64.btoa(wipeoutString)
}

export const getWipeoutString = (sizeToRemove: number) => {
  return Array(sizeToRemove + 1).join(String.fromCharCode(0))
}
