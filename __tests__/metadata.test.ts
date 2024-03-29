import { removeLocationFromFile } from "./utils/nodeStripContent";
import fs from "fs";
import hasha from "hasha";
import isCorrupted from "is-corrupted-jpeg";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import { beforeEach, it, describe, vi, expect } from "vitest";
import { Logger } from "../src/logger";

const MODE_JPG = 0;
const MODE_IMG_NON_JPG = 1;
const MODE_VIDEO = 2;

const baseTestImagePath = "./__tests__/images/";
const PREPROCESSED = "preprocessed/";
const PROCESSED = "processed/";
const PROCESSED_CLEAN = "processed-clean/";

const formatJpg = "jpg/";
const baseJpgPath = baseTestImagePath + formatJpg;
const jpgInFolder = baseJpgPath + PREPROCESSED;
const jpgOutFolder = baseJpgPath + PROCESSED;
const jpgCleanFolder = baseJpgPath + PROCESSED_CLEAN;

const formatPng = "png/";
const basePngPath = baseTestImagePath + formatPng;
const pngInFolder = basePngPath + PREPROCESSED;
const pngOutFolder = basePngPath + PROCESSED;
const pngCleanFolder = basePngPath + PROCESSED_CLEAN;

const formatTif = "tif/";
const baseTifPath = baseTestImagePath + formatTif;
const tifInFolder = baseTifPath + PREPROCESSED;
const tifOutFolder = baseTifPath + PROCESSED;
const tifCleanFolder = baseTifPath + PROCESSED_CLEAN;

const formatMp4 = "mp4/";
const baseMp4Path = baseTestImagePath + formatMp4;
const mp4InFolder = baseMp4Path + PREPROCESSED;
const mp4OutFolder = baseMp4Path + PROCESSED;
const mp4CleanFolder = baseMp4Path + PROCESSED_CLEAN;

const formatMov = "mov/";
const baseMovPath = baseTestImagePath + formatMov;
const movInFolder = baseMovPath + PREPROCESSED;
const movOutFolder = baseMovPath + PROCESSED;
const movCleanFolder = baseMovPath + PROCESSED_CLEAN;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const itif = (condition: boolean) => (condition ? it : it.skip);

const testFiles = (files: readonly (any[] | [any])[]) =>
  describe.each(files)(
    "fileName %s",
    (fileName, inFolder, outFolder, cleanFolder, mode) => {
      const processedFile = outFolder + fileName;
      const cleanFile = cleanFolder + fileName;
      it("consistently builds", async () => {
        await removeLocationFromFile(fileName, inFolder, outFolder);
        const cleanFileHash = await hasha.fromFile(cleanFile, {
          algorithm: "sha256",
        });
        const newFileHash = await hasha.fromFile(processedFile, {
          algorithm: "sha256",
        });
        expect(cleanFileHash).toEqual(newFileHash);
      });
      itif(mode === MODE_JPG)("image is not corrupted - JPG", async () => {
        await removeLocationFromFile(fileName, inFolder, outFolder);
        const fileIsCorrupted = isCorrupted(processedFile);
        expect(fileIsCorrupted).toEqual(false);
      });
      it("ffprobe corruption check", async (done) => {
        await removeLocationFromFile(fileName, inFolder, outFolder);
        ffprobe(processedFile, { path: ffprobeStatic.path }, function(
          err: any,
          info: any
        ) {
          expect(err).to.be.null;
        });
      });
    }
  );

const testFormat = (
  inFolder: string,
  outFolder: string,
  cleanFolder: string,
  testJpg: number
) => {
  const files = fs.readdirSync(inFolder);
  const testObjects = files
    .filter((file: string) => file !== ".DS_Store")
    .map((file: any) => [file, inFolder, outFolder, cleanFolder, testJpg]);

  testFiles(testObjects);
};

testFormat(jpgInFolder, jpgOutFolder, jpgCleanFolder, MODE_JPG);
testFormat(pngInFolder, pngOutFolder, pngCleanFolder, MODE_IMG_NON_JPG);
testFormat(tifInFolder, tifOutFolder, tifCleanFolder, MODE_IMG_NON_JPG);
testFormat(movInFolder, movOutFolder, movCleanFolder, MODE_VIDEO);
testFormat(mp4InFolder, mp4OutFolder, mp4CleanFolder, MODE_VIDEO);
