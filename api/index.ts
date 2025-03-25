import bcd, {
  BrowserName,
  Browsers,
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
  return {
    ...statement,
    release_date: added
      ? browsers[browserName].releases[added]?.release_date
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

  const slug = url.pathname + url.hash;
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
