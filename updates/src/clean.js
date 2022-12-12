export function cleanCompat(c) {
  for (const [browser, support] of Object.entries(c?.compat?.support || {})) {
    if (!Array.isArray(support)) {
      c.compat.support[browser] = [support];
    }
  }
  return c;
}

export function stripSupport(c) {
  const { compat: { support: _, ...compat } = {}, data: __, ...rest} = c;
  return { ...compat, ...rest };
}

export default {
  cleanCompat,
  stripSupport,
};
