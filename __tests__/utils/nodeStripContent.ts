import { removeLocation } from "../../src/index";
import { promisify } from "util";
import {
  open,
  read as _read,
  write as _write,
  copyFile,
  unlink,
  existsSync,
  mkdirSync,
} from "fs";
const awaitableOpen = promisify(open);
const awaitableRead = promisify(_read);
const awaitableWrite = promisify(_write);
const awaitableCopy = promisify(copyFile);
const awaitableUnlink = promisify(unlink);

async function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

const removeLocationFromFile = async (
  fileName,
  sourceDirectory,
  destDirectory
) => {
  console.log("file name", fileName);
  const originalFilePath = sourceDirectory + fileName;
  const tempFilePath = destDirectory + fileName;
  if (!existsSync(destDirectory)) {
    mkdirSync(destDirectory);
  }
  await awaitableCopy(originalFilePath, tempFilePath);
  const fileDescriptor = await awaitableOpen(tempFilePath, "r+");
  const read = async (size, offset) => {
    const buffer = Buffer.alloc(size);
    await awaitableRead(fileDescriptor, buffer, 0, size, offset);
    const arrayBuffer = toArrayBuffer(buffer);
    return arrayBuffer; // Return the ArrayBuffer directly
  };
  const write = async (writeValue, entryOffset, encoding) => {
    const buffer = Buffer.alloc(writeValue.length, writeValue, encoding);
    await awaitableWrite(
      fileDescriptor,
      buffer,
      0,
      writeValue.length,
      entryOffset
    );
  };
  const locationRemoved = await removeLocation(tempFilePath, read, write);
  if (locationRemoved) {
    console.log("found GPS, wrote stripped file to ", tempFilePath);
  } else {
    console.log("no GPS found");
    //await awaitableUnlink(tempFilePath)
  }
};

const _removeLocationFromFile = removeLocationFromFile;
export { _removeLocationFromFile as removeLocationFromFile };
