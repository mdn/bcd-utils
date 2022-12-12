import { program } from "commander";
import { addedByRelease, addedByReleaseStandalone, browsers, features } from "./process.js";
import semver from "semver";
import packageJson from "package-json";

import fs from "node:fs";

program.version("0.0.1");
program.option("-c, --current <version>", "current bcd version");
program.option("-o, --out-prefix <outPrefix>", "output file prefix", "output");

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
    const standaloneData = addedByReleaseStandalone({ data, since });
    for (let i = 0; i < standaloneData.length / 10; i++) {
      const next = i + 1 < standaloneData.length / 10 ? `${options.outPrefix}-${i + 1}.json` : null;
      fs.writeFileSync(
        `${options.outPrefix}-${i}.json`,
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
