import { program } from "commander";
import { browsers } from "./browsers.js";
import {
  addedByRelease,
  addedByReleaseStandalone,
  features,
} from "./process.js";
import semver from "semver";
import packageJson from "package-json";

import fs from "node:fs";
import path from "node:path";

program.version("0.0.1");
program.option("-c, --current <version>", "current bcd version");

const options = program.opts();

const { versions: versionsData = {} } = await packageJson(
  "@mdn/browser-compat-data",
  {
    allVersions: true,
  },
);
const versions = [...Object.keys(versionsData)];
versions.sort(semver.compare);

const currentVersion = versions.includes(options.current)
  ? options.current
  : versions[versions.length - 1];

const data = await (
  await fetch(
    `https://github.com/mdn/browser-compat-data/releases/download/v${currentVersion}/data.json`,
  )
).json();

program
  .command("standalone")
  .argument("[since]")
  .option("-o, --out-path <outPath>", "out path", "v0")
  .action((since, options) => {
    fs.mkdirSync(options.outPath, { recursive: true });
    const standaloneData = addedByReleaseStandalone({ data, since });
    console.log("writing files...");
    const last = Math.floor(standaloneData.length / 10);
    for (let i = 0; i < standaloneData.length / 10; i++) {
      fs.writeFileSync(
        path.join(options.outPath, `bcd-updates-${i}.json`),
        JSON.stringify({
          data: standaloneData.slice(i * 10, (i + 1) * 10, null, 2),
          last,
        }),
      );
    }
  });
program
  .command("rumba")
  .option("-o, --out-path <outPath>", "out path", "rumba-updates")
  .action((options) => {
    fs.mkdirSync(options.outPath, { recursive: true });
    const updates = {
      browsers: browsers(data),
      added_removed: addedByRelease(data),
      features: features(data),
    };
    console.log("writing file...");
    fs.writeFileSync(
      path.join(options.outPath, `bcd-updates.json`),
      JSON.stringify(updates),
    );
  });

program.parse();
