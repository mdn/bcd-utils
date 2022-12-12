export function browsersForStatus(data, { status = "current" } = {}) {
  return Object.entries(data.browsers)
    .map(([browser, data]) => {
      const version = Object.entries(data.releases).find(([, r]) => r.status == status);
      if (version) {
        return [browser, version[0]];
      }
      return null;
    })
    .filter(Boolean);
}

export function currentBrowsersAndEngine(data) {
  const engines = ["Blink", "Gecko", "WebKit"];
  return Object.fromEntries(
    Object.entries(data.browsers || {})
      .map(([browser, { releases }]) => {
        const [version, { engine } = {}] =
          Object.entries(releases || {}).find(([, release]) => release.status === "current") || [];
        return [browser, { version, engine }];
      })
      .filter(([, { engine }]) => engines.includes(engine))
  );
}

export function browserHistory(data) {
  const byDate = [];
  for (const [browser, { name, releases }] of Object.entries(data.browsers || {})) {
    for (const [version, release] of Object.entries(releases || {})) {
      byDate.push({ ...release, browser, version, name });
    }
  }
  byDate.sort(({ release_date: a }, { release_date: b }) => {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  });
  byDate.reverse();
  return byDate;
}

export function filterBrowserByStatus(browsers, statuses = ["current", "esr", "retired"]) {
  const statusSet = new Set(statuses);
  return browsers.filter(({ status }) => statusSet.has(status));
}
