import bcd, {
  BrowserName,
  Browsers,
  BrowserStatement,
  CompatStatement,
  Identifier,
  SimpleSupportStatement,
  SupportStatement,
  VersionValue,
} from "@mdn/browser-compat-data";

export interface Data {
  data: IdentifierExtended;
  query: string;
  browsers: Browsers;
}

export interface SimpleSupportStatementExtended extends SimpleSupportStatement {
  release_date?: string;
  version_last?: VersionValue;
}

export interface CompatStatementExtended extends CompatStatement {
  support: Partial<Record<BrowserName, SimpleSupportStatementExtended[]>>;
}

export interface IdentifierExtended {
  [key: string]: IdentifierExtended | CompatStatementExtended;
}

const {
  __meta: { version: bcdVersion },
  browsers,
  ...bcdAPIs
} = bcd;

export { bcdVersion, bcdAPIs };

const filteredBrowsers = Object.fromEntries(
  Object.entries(browsers).map(([name, statement]) => [
    name,
    {
      ...statement,
      releases: Object.fromEntries(
        Object.entries(statement.releases).filter(
          ([_, statement]) => statement.status !== "retired",
        ),
      ),
    },
  ]),
) as Browsers;

export function getBCDDataForPath(path: string): Data | void {
  const subtree = path
    .split(".")
    .reduce<Identifier | undefined>((prev, curr) => prev?.[curr], bcdAPIs);
  if (subtree) {
    return {
      data: walk(subtree, path),
      query: path,
      browsers: filteredBrowsers,
    };
  }
}

export function walk(
  tree: Identifier,
  path: string,
  callback?: (data: Data) => void,
): IdentifierExtended {
  const extendedTree: IdentifierExtended = Object.fromEntries(
    Object.entries(tree).map(([key, subtree]) => [
      key,
      key === "__compat"
        ? extendCompatStatement(subtree as CompatStatement)
        : walk(subtree as Identifier, `${path}.${key}`, callback),
    ]),
  );

  const data: Data = {
    data: extendedTree,
    query: path.slice(1),
    browsers: filteredBrowsers,
  };
  callback?.(data);
  return extendedTree;
}

function extendCompatStatement(
  statement: CompatStatement,
): CompatStatementExtended {
  const support = Object.fromEntries(
    (
      Object.entries(statement.support) as [BrowserName, SupportStatement][]
    ).map(([browserName, supportStatement]) => [
      browserName,
      (supportStatement instanceof Array
        ? supportStatement
        : [supportStatement]
      ).map((simpleSupportStatement) =>
        extendSimpleSupportStatement(simpleSupportStatement, browserName),
      ),
    ]),
  );
  return {
    ...statement,
    mdn_url: getPathFromAbsoluteURL(statement.mdn_url),
    support,
  };
}

function extendSimpleSupportStatement(
  statement: SimpleSupportStatement,
  browserName: BrowserName,
): SimpleSupportStatementExtended {
  const added = normalizeVersion(statement.version_added);
  const removed = normalizeVersion(statement.version_removed);
  return {
    ...statement,
    release_date: added
      ? browsers[browserName].releases[added]?.release_date
      : undefined,
    version_last: removed
      ? _getPreviousVersion(removed, browsers[browserName])
      : undefined,
  };
}

function getPathFromAbsoluteURL(absoluteUrl?: string) {
  if (!absoluteUrl || !absoluteUrl.includes("://")) {
    return absoluteUrl;
  }

  const url = new URL(absoluteUrl);
  if (url.hostname !== "developer.mozilla.org") {
    return absoluteUrl;
  }

  const slug = url.pathname;
  if (slug.startsWith("/docs/")) {
    return `/en-US${slug}`;
  }
  return slug;
}

function normalizeVersion(version?: VersionValue): string | undefined {
  return typeof version === "string"
    ? version.startsWith("≤")
      ? version.slice(1)
      : version
    : undefined;
}

// the functions below are copied from yari/build/document-extractor.ts unmodified:

function _getPreviousVersion(
  version: VersionValue,
  browser: BrowserStatement,
): VersionValue {
  if (browser && typeof version === "string") {
    const browserVersions = Object.keys(browser["releases"]).sort(
      _compareVersions,
    );
    const currentVersionIndex = browserVersions.indexOf(version);
    if (currentVersionIndex > 0) {
      return browserVersions[currentVersionIndex - 1];
    }
  }

  return version;
}

function _getFirstVersion(support: SimpleSupportStatement): string {
  if (typeof support.version_added === "string") {
    return support.version_added;
  } else if (typeof support.version_removed === "string") {
    return support.version_removed;
  } else {
    return "0";
  }
}

function _compareVersions(a: string, b: string) {
  const x = _splitVersion(a);
  const y = _splitVersion(b);

  return _compareNumberArray(x, y);
}

function _splitVersion(version: string): number[] {
  if (version.startsWith("≤")) {
    version = version.slice(1);
  }

  return version.split(".").map(Number);
}

function _compareNumberArray(a: number[], b: number[]): number {
  while (a.length || b.length) {
    const x = a.shift() || 0;
    const y = b.shift() || 0;
    if (x !== y) {
      return x - y;
    }
  }

  return 0;
}
