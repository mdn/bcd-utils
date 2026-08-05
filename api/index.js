import bcd from "@mdn/browser-compat-data" with { type: "json" };

/**
 * @import {
 *   BrowserName,
 *   Browsers,
 *   CompatStatement,
 *   Identifier,
 *   SimpleSupportStatement,
 *   SupportStatement,
 *   VersionValue,
 * } from "@mdn/browser-compat-data"
 */

/**
 * @typedef {object} Data
 * @property {{ timestamp: string; version: string }} __meta
 * @property {string} query
 * @property {IdentifierExtended} data
 * @property {Browsers} browsers
 */

/**
 * @typedef {SimpleSupportStatement & { release_date?: string }} SimpleSupportStatementExtended
 */

/**
 * @typedef {Omit<CompatStatement, "support"> & {
 *   support: Partial<Record<BrowserName, SimpleSupportStatementExtended[]>>;
 * }} CompatStatementExtended
 */

/**
 * @typedef {{ [key: string]: IdentifierExtended | CompatStatementExtended }} IdentifierExtended
 */

const { __meta, browsers, ...bcdAPIs } = bcd;

export { __meta, bcdAPIs };

const filteredBrowsers = /** @type {Browsers} */ (
  Object.fromEntries(
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
  )
);

/**
 * @param {string} path
 * @returns {Data | undefined}
 */
export function getBCDDataForPath(path) {
  const subtree = path
    .split(".")
    .reduce(
      (prev, curr) => prev?.[curr],
      /** @type {Identifier | undefined} */ (bcdAPIs),
    );
  if (subtree) {
    return {
      __meta,
      query: path,
      data: walk(subtree, path),
      browsers: filteredBrowsers,
    };
  }
}

/**
 * @param {Identifier} tree
 * @param {string} path
 * @param {(data: Data) => void} [callback]
 * @returns {IdentifierExtended}
 */
export function walk(tree, path, callback) {
  /** @type {IdentifierExtended} */
  const extendedTree = Object.fromEntries(
    Object.entries(tree).map(([key, subtree]) => [
      key,
      key === "__compat"
        ? extendCompatStatement(/** @type {CompatStatement} */ (subtree))
        : walk(/** @type {Identifier} */ (subtree), `${path}.${key}`, callback),
    ]),
  );

  /** @type {Data} */
  const data = {
    __meta,
    query: path.slice(1),
    data: extendedTree,
    browsers: filteredBrowsers,
  };
  callback?.(data);
  return extendedTree;
}

/**
 * @param {CompatStatement} statement
 * @returns {CompatStatementExtended}
 */
function extendCompatStatement(statement) {
  const support = Object.fromEntries(
    /** @type {[BrowserName, SupportStatement][]} */ (
      Object.entries(statement.support)
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

/**
 * @param {SimpleSupportStatement} statement
 * @param {BrowserName} browserName
 * @returns {SimpleSupportStatementExtended}
 */
function extendSimpleSupportStatement(statement, browserName) {
  const added = normalizeVersion(statement.version_added);
  return {
    ...statement,
    release_date: added
      ? browsers[browserName].releases[added]?.release_date
      : undefined,
  };
}

/**
 * @param {string} [absoluteUrl]
 * @returns {string | undefined}
 */
function getPathFromAbsoluteURL(absoluteUrl) {
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

/**
 * @param {VersionValue} [version]
 * @returns {string | undefined}
 */
function normalizeVersion(version) {
  return typeof version === "string"
    ? version.startsWith("≤")
      ? version.slice(1)
      : version
    : undefined;
}
