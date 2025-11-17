import { mkdir, writeFile } from "node:fs/promises";
import { major } from "semver";
import { __meta, bcdAPIs, walk } from "./index";
import { version } from "./package.json";

const BUILD_PATH = `out/v${major(version)}`;

main();

async function main() {
  await mkdir(`${BUILD_PATH}/current`, { recursive: true });
  walk(bcdAPIs, "", (data) => {
    const json = JSON.stringify({
      __meta,
      data,
    });
    const filename = `${data.query}.json`;
    writeFile(`${BUILD_PATH}/current/${filename}`, json);
  });
}
