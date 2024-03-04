import util from "util";
import fs from "fs";
export const awaitableReaddir = util.promisify(fs.readdir);
