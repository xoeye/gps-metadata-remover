import { Buffer } from "buffer";
import { crc32 } from "crc";

export type ReadFunction = (
  size: number,
  offset: number
) => Promise<ArrayBuffer>;

export type WriteFunction = (
  writeValue: string,
  entryOffset: number,
  encoding: string
) => Promise<void>;
export type Options = {
  skipXMPRemoval?: boolean;
};

export const readNextChunkIntoDataView = async (
  size: number,
  offset: number,
  read: ReadFunction
) => {
  const dataBuffer: ArrayBuffer = await read(size, offset);
  return new DataView(dataBuffer, 0, dataBuffer.byteLength);
};

export const getEncodedWipeoutString = async (sizeToRemove: number) => {
  const wipeoutString = getWipeoutString(sizeToRemove);
  return Buffer.from(wipeoutString).toString("base64");
};

export function getWipeoutString(sizeToRemove: number): string {
  return "\0".repeat(sizeToRemove);
}

export function getString(
  dataView: DataView,
  start: number,
  length: number
): string {
  let result = "";
  for (let i = start; i < start + length; i++) {
    const byte = dataView.getUint8(i);
    if (byte === 0) {
      break;
    }
    result += String.fromCharCode(byte);
  }
  return result;
}
