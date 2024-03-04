import { imageGpsExifRemoverSkip } from './imageGpsExifRemover'
import { videoGpsMetadataRemoverSkip } from './videoGpsMetadataRemover'
import type { ReadFunction, WriteFunction, Options } from './gpsRemoverHelpers'
import { base64 } from 'Base64'
import { Logger, LogLevel } from './logger'

// Set log level from an environment variable
const logLevel = import.meta.env.LOG_LEVEL as LogLevel;
console.log(`setting log level to ${logLevel}`)

if (logLevel && LogLevel[logLevel]) { // Check if the provided log level is valid
  Logger.currentLevel = logLevel;
} else {
  Logger.currentLevel = LogLevel.Info; // Default to Info if not specified or invalid
}

const isVideo = (uri: string) => /(mp4|m4v|webm|mov)/i.test(uri)

function removeFileSlashPrefix(path: string): string {
  return path.replace(/^(file:\/\/)/, '')
}

export const removeLocation = async (photoUri: string, read: ReadFunction, write: WriteFunction, options: Options = {}): Promise<boolean> => {
  const optionsWithDefaults = {skipXMPRemoval: false, ...options}
  const { skipXMPRemoval } = optionsWithDefaults
  const preparedUri = removeFileSlashPrefix(photoUri)
  return isVideo(preparedUri)
    ? await videoGpsMetadataRemoverSkip(read, write, skipXMPRemoval)
    : await imageGpsExifRemoverSkip(read, write, skipXMPRemoval)
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return base64.btoa(binary)
}

export const base64StringToArrayBuffer = async (base64String: string): Promise<Uint8Array> => {
  const binaryString = atob(base64String)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
