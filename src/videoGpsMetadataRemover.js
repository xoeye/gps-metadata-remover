// @flow
/* eslint-disable no-await-in-loop */
import base64 from 'Base64'

import { readNextChunkIntoDataView, getEncodedWipeoutString } from './gpsRemoverHelpers'
import type { ReadFunction, WriteFunction } from './gpsRemoverHelpers'

const TAG_TO_STRIP = 'com.apple.quicktime.location.ISO6709'
const MOOV_ATOM_TAG = 'moov'
const UDTA_ATOM_TAG = 'udta'
const META_ATOM_TAG = 'meta'
const UUID_TAG = 'uuid'
const XMP_TAG = 'XMP_'
const XYZ_TAG = '©xyz'
const TAGS_TO_ENTER: Array<string> = [MOOV_ATOM_TAG, UDTA_ATOM_TAG]

const wipeData = async (
  sizeToRemove: number,
  offset: number,
  write: WriteFunction,
  read: ReadFunction,
  suppliedWipeoutString: string = ''
): Promise<void> => {
  //NEXT LINES FOR DEBUG - take out
  const dataToWipe = await readNextChunkIntoDataView(sizeToRemove, offset, read)
  console.log('data to wipe', dataToWipe.getString(sizeToRemove, 0))

  if(suppliedWipeoutString === '') {
    const encodedWipeoutString = await getEncodedWipeoutString(sizeToRemove)
    await write(encodedWipeoutString, offset, 'base64')
  } else {
    await write(suppliedWipeoutString, offset, 'ascii')
  }
}

export const videoGpsMetadataRemoverSkip
= async (read: ReadFunction, write: WriteFunction, skipXMPRemoval: boolean): Promise<boolean> => {
  console.log('preparing to read video skip...')
  let gpsTagFound = false
  let stopSearching = false
  // eslint-disable-next-line new-cap
  let offset = 0
  while (
    !stopSearching
    && !gpsTagFound
  ) {
    console.log('reading next tag in video...')
    const dataView = await readNextChunkIntoDataView(8, offset, read)
    // an atom must have a length of at least 8
    console.log('tag bite + length', dataView.buffer, dataView.byteLength)
    if (dataView.byteLength === 0) {
      stopSearching = true
      break
    }
    if (dataView.byteLength >= 8) {
      const tagLength = dataView.getUint32(0)
      const tagName = dataView.getString(4, 4)
      console.log('found tag', tagName, tagLength)
      if(tagLength === 0) {
        stopSearching = true
        break
      }
      if (tagName === META_ATOM_TAG) {
        console.log('found meta tag in video', tagLength)
        const metaTagDataView = await readNextChunkIntoDataView(tagLength, offset, read)
        console.log('meta buffer', metaTagDataView)
        const metaBaseOffset = 0
        const hdlrSize = metaTagDataView.getUint32(metaBaseOffset + 8)
        const keyOffset = metaBaseOffset + hdlrSize + 8
        const keySectionSize = metaTagDataView.getUint32(keyOffset)
        const keyEntryCount = metaTagDataView.getUint32(keyOffset + 12)
        let currentKeyOffset = keyOffset + 16
        let currentKey = 0
        let indexOfTagToStrip = -1
        while (currentKey < keyEntryCount) {
          const currentKeySize = metaTagDataView.getUint32(currentKeyOffset)
          const currentKeyName = metaTagDataView.getString(
            currentKeySize - 8,
            currentKeyOffset + 8
          )
          console.log('finding keys', currentKeyName, currentKeySize)
          if (currentKeyName === TAG_TO_STRIP) {
            gpsTagFound = true
            indexOfTagToStrip = currentKey
            break
          }
          currentKeyOffset += currentKeySize
          currentKey++
        }
        if (indexOfTagToStrip >= 0) {
          const itemsOffset = keyOffset + keySectionSize
          let itemIndex = 0
          let currentItemOffset = itemsOffset + 8
          while (itemIndex !== indexOfTagToStrip) {
            const currentItemSize = metaTagDataView.getUint32(currentItemOffset)
            currentItemOffset += currentItemSize
            itemIndex++
          }
          const offsetOfSizeToRemove = currentItemOffset + 8
          const sizeToRemove = metaTagDataView.getUint32(offsetOfSizeToRemove)
          const offsetOfDataToRemove = offsetOfSizeToRemove + 4
          await wipeData(sizeToRemove, offsetOfDataToRemove + offset, write, read)
        } else {
          console.log('no gps in this metadata...')
          // no gps in the metadata
          offset += tagLength
        }
      } else if (TAGS_TO_ENTER.includes(tagName)) {
        console.log('moov or udta tag found')
        offset += 8
      } else if ((tagName === UUID_TAG || tagName === XMP_TAG) && !skipXMPRemoval) {
        // XMP is an alternative tag format pushed by adobe that can have gps
        // (can also be id'd by UUID atom)
        // we just want to wipe it
        console.log('found uuid tag')
        gpsTagFound = true
        await wipeData(tagLength - 8, offset + 8, write, read)
        offset += tagLength
      } else if (tagName === XYZ_TAG) {
        // ©xyz is an alternative gps tag format that some android phones use
        console.log('found xyz tag')
        const xyzDataView = await readNextChunkIntoDataView(tagLength, offset, read)
        const xyzString = xyzDataView.getString(tagLength, 0)
        console.log('xyz data', xyzString)
        const plusIndex = xyzString.indexOf('+')
        const slashIndex = xyzString.indexOf('/')
        if (
          plusIndex >= 0
          && slashIndex >=0
          && plusIndex < slashIndex
        ) {
          const dataString = xyzString.substring(plusIndex, slashIndex)
          const wipeoutString = dataString.replace(/[0-9]/g, "0")
          console.log('xyz wipeout string', dataString, wipeoutString)
          await wipeData(wipeoutString.length, offset + plusIndex, write, read, wipeoutString)
          //await wipeData(dashIndex - plusIndex - 1, offset + plusIndex, write, read)
          //await wipeData(slashIndex - dashIndex - 1, offset + dashIndex, write, read)
          gpsTagFound = true
        } else {
          console.log('xyz data was malformed, skipping')
          offset += tagLength
        }
        // 10 = 8 byte tag lenght + tag, 2 byte internal length of xyz data
        //await wipeData(tagLength - 12, offset + 12, write, read)
      }
       else {
        offset += tagLength
      }
    }
  }
  console.log('exiting video skip remover')
  return gpsTagFound
}
