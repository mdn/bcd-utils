import { program } from "commander";
import { addedByRelease, addedByReleaseStandalone, browsers, features } from "./process.js";
import semver from "semver";
import packageJson from "package-json";

import fs from "node:fs";
import path from "node:path";

program.version("0.0.1");
program.option("-c, --current <version>", "current bcd version");
program.option("-o, --out-path <outPath>", "out path", "v0");

const options = program.opts();

const { versions: versionsData = {} } = await packageJson("@mdn/browser-compat-data", {
  allVersions: true,
});
const versions = [...Object.keys(versionsData)];
versions.sort(semver.compare);

const currentVersion = versions.includes(options.current) ? options.current : versions[versions.length - 1];

const data = await (
  await fetch(`https://github.com/mdn/browser-compat-data/releases/download/v${currentVersion}/data.json`)
).json();

program
  .command("standalone")
  .argument("[since]")
  .action((since) => {
    fs.mkdirSync(options.outPath, { recursive: true });
    const standaloneData = addedByReleaseStandalone({ data, since });
    console.log("writing files...")
    for (let i = 0; i < standaloneData.length / 10; i++) {
      const next = i + 1 < standaloneData.length / 10 ? `bcd-updates-${i + 1}.json` : null;
      fs.writeFileSync(
        path.join(options.outPath, `bcd-updates-${i}.json`),
        JSON.stringify({ data: standaloneData.slice(i * 10, (i + 1) * 10, null, 2), next })
      );
    }
  });
program.command("browsers").action(() => {
  console.log(JSON.stringify(browsers({ data }), null, 2));
});
program.command("added").action(() => {
  console.log(JSON.stringify(addedByRelease({ data }), null, 2));
});
program.command("features").action(() => {
  console.log(JSON.stringify(features({ data }), null, 2));
});

program.parse();
