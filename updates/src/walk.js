export function joinPath() {
  return Array.from(arguments).filter(Boolean).join('.');
}

export function isFeature(obj) {
  return '__compat' in obj;
}

export function isBrowser(obj) {
  return 'name' in obj && 'releases' in obj;
}

export function descendantKeys(data) {
  if (typeof data !== 'object') {
    // Return if the data isn't an object
    return [];
  }

  if (isFeature(data)) {
    return Object.keys(data).filter((key) => !key.startsWith('__'));
  }

  if (isBrowser(data)) {
    // Browsers never have independently meaningful descendants
    return [];
  }

  return Object.keys(data).filter((key) => key !== '__meta');
}

export function lowLevelWalk(data, path, depth = Infinity) {
  const flat = []
  if (path !== undefined) {
    const next = {
      path,
      data,
    };

    if (isBrowser(data)) {
      next.browser = data;
    } else if (isFeature(data)) {
      next.compat = data.__compat;
    }
    flat.push(next);
  }

  if (depth > 0) {
    for (const key of descendantKeys(data)) {
      flat.push(...lowLevelWalk(data[key], joinPath(path, key), depth - 1));
    }
  }
  return flat;
}

export function walk({ data } = {}) {
  return [...lowLevelWalk(data)];
}

export default { walk, lowLevelWalk };
