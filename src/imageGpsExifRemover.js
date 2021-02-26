// @flow
/* eslint-disable no-await-in-loop */

import { readNextChunkIntoDataView, getEncodedWipeoutString, getWipeoutString } from './gpsRemoverHelpers'
import type { ReadFunction, WriteFunction } from './gpsRemoverHelpers'

const EXIF_ASCII_TAG_JPEG = 0x45786966
const EXIF_ASCII_TAG_PNG = 0x65584966
const GPS_EXIF_TAG = 0x8825
const JPEG_TAG_EXIF = 0xffd8ffe1
const MINI_EXIF_TAG = 0xffe1
const JPEG_TAG_JFIF = 0xffd8ffe0
const LITTLE_ENDIAN_TAG = 0x49492a00
const BIG_ENDIAN_TAG = 0x4d4d002a
const PNG_TAG = 0x89504e47
const END_OF_PNG_TAG = 0x49454e44
const PNG_ITXT_TAG = 0x69545874
const PNG_XMP_TAG = 'XML:com.adobe.xmp'


const killGPS
= async (startOffset: number, littleEndian: boolean, read: ReadFunction, write: WriteFunction) => {
  const entryNumberDataView = await readNextChunkIntoDataView(2, startOffset, read)
  const entries = entryNumberDataView.getUint16(0, littleEndian)
  const entryOffset = startOffset + 2
  // kill 'em all
  console.log('writing 0s on gps data...', entries, entryOffset)
  const bytesToWipe = entries * 12
  const encodedWipeoutString = await getEncodedWipeoutString(bytesToWipe)
  await write(encodedWipeoutString, entryOffset, 'base64')
}

const readTag = async (offset: number, littleEndian: boolean, read: ReadFunction) => {
  console.log('preparing to read tag')
  const tagDataView = await readNextChunkIntoDataView(12, offset, read)
  const tag = tagDataView.getUint16(0, littleEndian)
  const type = tagDataView.getUint16(2, littleEndian)
  const numValues = tagDataView.getUint32(4, littleEndian)
  const valueOffset = tagDataView.getUint32(8, littleEndian)
  console.log('read tag', tag, type, numValues, valueOffset)
  return {
    tag,
    type,
    numValues,
    valueOffset,
  }
}

const isLittleEndian = (dataView) => {
  return dataView.getUint32(0) === LITTLE_ENDIAN_TAG
}

const findGPSTagInTags = async(startOffset: number, littleEndian: boolean, read: ReadFunction) : Promise<number> => {
  const exifEntriesDataView = await readNextChunkIntoDataView(2, startOffset, read)
  const entries = exifEntriesDataView.getUint16(0, littleEndian)
  const tagsOffset = startOffset + 2
  console.log('# of exif entries', entries)
  for(let i = 0; i < entries; i++) {
    const currentTag = await readTag((tagsOffset+i*12), littleEndian, read)
    if(currentTag.tag === GPS_EXIF_TAG
        && currentTag.type === 4
        && currentTag.numValues === 1) {
          console.log('gps tag found', startOffset, currentTag.valueOffset)
          return currentTag.valueOffset
        }
  }
  return -1
}

const findGPSinExifTiff = async (
    masterOffset: number,
    read: ReadFunction,
    write: WriteFunction,
    littleEndian: boolean
  ): Promise<boolean> => {
    const gpsOffset = await findGPSTagInTags(masterOffset, littleEndian, read)
    if(gpsOffset >= 0) {
      await killGPS(gpsOffset, littleEndian, read, write)
      return true
    }
    return false
  }

const findGPSinExifJpg
= async (
    exifDataView,
    size: number,
    masterOffset: number,
    read: ReadFunction,
    write: WriteFunction
  ) => {
  console.log('exifDataView', exifDataView, size)
  const littleEndian = isLittleEndian(exifDataView)
  console.log('isLittleEndian?', littleEndian, exifDataView.getUint32(0))
  const gpsOffset = await findGPSTagInTags(masterOffset + 8, littleEndian, read)
  if (gpsOffset >= 0) {
    await killGPS(gpsOffset + masterOffset, littleEndian, read, write)
    return true
  }
  
  return false
}

export const imageGpsExifRemoverSkip
= async (read: ReadFunction, write: WriteFunction): Promise<boolean> => {
  const fileTypeDataView = await readNextChunkIntoDataView(4, 0, read)
  const fileTypeTag = fileTypeDataView.getUint32(0)
  let offset = 0
  let removedGps = false
  if (fileTypeTag === PNG_TAG) {
    console.log('png identified')
    offset += 8
    let pngCurrentTagSize = 0
    let pngCurrentTag = ''
    while (pngCurrentTag !== END_OF_PNG_TAG) {
      const pngTagDataView = await readNextChunkIntoDataView(8, offset, read)
      console.log('png tag data view', pngTagDataView, offset)
      pngCurrentTagSize = pngTagDataView.getUint32(0)
      pngCurrentTag = pngTagDataView.getUint32(4)
      console.log('current png tag', pngCurrentTagSize, pngCurrentTag)

      if (pngCurrentTag === EXIF_ASCII_TAG_PNG) {
        console.log('found exif in png')
        const offsetOfExifData = offset + 8
        const exifDataView
        = await readNextChunkIntoDataView(pngCurrentTagSize, offsetOfExifData, read)
        console.log('png exif view', exifDataView)
        removedGps = await findGPSinExifJpg(exifDataView, pngCurrentTagSize, offsetOfExifData, read, write)
      } else if (pngCurrentTag === PNG_ITXT_TAG) {
        console.log('found itxt in png')
        const offsetOfPotentialXMPTag = offset + 8
        if(pngCurrentTagSize >= PNG_XMP_TAG.length) {
          const XMPTagDataView = await readNextChunkIntoDataView(PNG_XMP_TAG.length, offsetOfPotentialXMPTag, read)
          const potentialXMPTag = XMPTagDataView.getString(PNG_XMP_TAG.length, 0)
          if(potentialXMPTag === PNG_XMP_TAG) {
            console.log('wiping png XMP metadata')
            const wipeoutString = getWipeoutString(pngCurrentTagSize)
            await write(wipeoutString, offsetOfPotentialXMPTag, 'ascii')
            removedGps = true
          }
        }
      }
  
      // 12 === tag length 4 bytes + tag name 4 bytes + 4 end bytes
      if (pngCurrentTag !== END_OF_PNG_TAG) {
        offset = offset + 12 + pngCurrentTagSize
      }
    }
  } else if (fileTypeTag === JPEG_TAG_EXIF || fileTypeTag === JPEG_TAG_JFIF) {
    console.log('jpg identified - exif or jfif')
    offset += 4
    if (fileTypeTag === JPEG_TAG_JFIF) {
      const jfifHeaderDataView = await readNextChunkIntoDataView(2, offset, read)
      const sizeOfJFIFData = jfifHeaderDataView.getUint16(0)
      offset += sizeOfJFIFData
      const potentialExifHeaderDataView = await readNextChunkIntoDataView(2, offset, read)
      const potentialExifHeader = potentialExifHeaderDataView.getUint16(0)
      if(potentialExifHeader === MINI_EXIF_TAG) {
        offset += 2
      } else {
        return removedGps
      }
    }
    const exifHeaderDataView = await readNextChunkIntoDataView(6, offset, read)
    const sizeOfExifData = exifHeaderDataView.getUint16(0)
    const exifTag = exifHeaderDataView.getUint32(2)
    if (exifTag === EXIF_ASCII_TAG_JPEG) {
      console.log('sanity checked and confirmed presence of exif', offset)
      // 2 byte size + 4 byte 'Exif' + 2 empty bytes
      offset += 8
      const exifDataView = await readNextChunkIntoDataView(sizeOfExifData, offset, read)
      
      removedGps = await findGPSinExifJpg(exifDataView, sizeOfExifData, offset, read, write)
    }
  } else if (fileTypeTag === LITTLE_ENDIAN_TAG || fileTypeTag === BIG_ENDIAN_TAG) {
    const littleEndian = isLittleEndian(fileTypeDataView)
    offset += 4
    const tiffExifOffsetDataView = await readNextChunkIntoDataView(4, offset, read)
    console.log('tiff data view', tiffExifOffsetDataView)
    const tiffExifOffset = tiffExifOffsetDataView.getUint32(0, littleEndian)
    console.log('tiff exif offset', tiffExifOffset)
    offset = tiffExifOffset
    removedGps = await findGPSinExifTiff(offset, read, write, littleEndian)
  }
  return removedGps
}
