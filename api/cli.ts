import { mkdir, writeFile } from "node:fs/promises";
import { major } from "semver";
import { bcdAPIs, bcdVersion, walk } from "./index";
import { version } from "./package.json";

const BUILD_PATH = `out/v${major(version)}`;

main();

async function main() {
  await mkdir(`${BUILD_PATH}/current`, { recursive: true });
  await mkdir(`${BUILD_PATH}/${bcdVersion}`, { recursive: true });
  walk(bcdAPIs, "", (data, path) => {
    const json = JSON.stringify(data);
    const filename = `${path.slice(1)}.json`;
    writeFile(`${BUILD_PATH}/current/${filename}`, json);
    writeFile(`${BUILD_PATH}/${bcdVersion}/${filename}`, json);
  });
}
