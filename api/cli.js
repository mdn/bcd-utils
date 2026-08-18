import { mkdir, writeFile } from "node:fs/promises";
import semver from "semver";
import { bcdAPIs, walk } from "./index.js";
import pkg from "./package.json" with { type: "json" };

const BUILD_PATH = `out/v${semver.major(pkg.version)}`;

main();

async function main() {
  await mkdir(`${BUILD_PATH}/current`, { recursive: true });
  walk(bcdAPIs, "", (data) => {
    const json = JSON.stringify(data);
    const filename = `${data.query}.json`;
    writeFile(`${BUILD_PATH}/current/${filename}`, json);
  });
}
