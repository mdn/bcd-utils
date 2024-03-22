import {
  browserHistory,
  currentBrowsersAndEngine,
  filterBrowserByStatus,
} from "./browsers.js";
import { walk } from "./walk.js";
import { cleanCompat, stripSupport } from "./clean.js";
import { simpleDate, gte } from "./utils.js";

function addedForVersion(version) {
  return ({ version_added, flags, prefix, partial_implementation }) =>
    version === version_added && !flags && !prefix && !partial_implementation;
}

function removedForVersion(version) {
  return ({ version_removed, flags, prefix, partial_implementation }) =>
    version === version_removed && !flags && !prefix && !partial_implementation;
}

function mapStandaloneCompat(engines, { support, ...compat }) {
  return {
    ...compat,
    engines: [
      ...new Set(
        Object.entries(support || {})
          .map(([browser, s]) => {
            const { version, engine } = engines[browser] || {};
            const removed = s.find(({ version_removed }) =>
              Boolean(version_removed),
            );
            const added = s.find(({ version_added }) => Boolean(version_added));
            if (
              added &&
              gte(version, added.version_added) &&
              !(removed && gte(version, removed.version_removed))
            ) {
              return engine;
            }
            return null;
          })
          .filter(Boolean),
      ),
    ],
  };
}

export function addedByReleaseStandalone({
  data,
  since = simpleDate(new Date(0)),
}) {
  const simpleSince = since instanceof Date ? simpleDate(since) : since;
  const simpleNow = simpleDate(new Date());
  const engines = currentBrowsersAndEngine(data);
  const history = filterBrowserByStatus(browserHistory(data)).filter(
    ({ release_date }) =>
      release_date > simpleSince && release_date <= simpleNow,
  );
  const compat = [...walk({ data })].map(cleanCompat);
  return history.map(({ browser, version, release_date, ...rest }) => {
    return {
      browser,
      version,
      release_date,
      ...rest,
      events: compat.reduce(
        (acc, { path, compat }) => {
          if ((compat?.support[browser] || []).some(addedForVersion(version))) {
            acc.added.push({
              path,
              compat: mapStandaloneCompat(engines, compat),
            });
          }
          if (
            (compat?.support[browser] || []).some(removedForVersion(version))
          ) {
            acc.removed.push({
              path,
              compat: mapStandaloneCompat(engines, compat),
            });
          }
          return acc;
        },
        { added: [], removed: [] },
      ),
    };
  });
}

export function addedByRelease(data, since = new Date(0)) {
  const simpleSince = simpleDate(since);
  const simpleNow = simpleDate(new Date());
  const history = browserHistory(data).filter(
    ({ release_date }) =>
      release_date > simpleSince && release_date <= simpleNow,
  );
  const compat = [...walk({ data })].map(cleanCompat);
  return history.map(({ browser, version, release_date }) => [
    { browser, version, release_date },
    compat.reduce(
      (acc, { path, compat }) => {
        if ((compat?.support[browser] || []).some(addedForVersion(version))) {
          acc.added.push(path);
        }
        if ((compat?.support[browser] || []).some(removedForVersion(version))) {
          acc.removed.push(path);
        }
        return acc;
      },
      { added: [], removed: [] },
    ),
  ]);
}

export function features({ browsers, ...data }) {
  return [...walk({ data })].map(stripSupport);
}
