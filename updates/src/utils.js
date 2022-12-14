import { compareVersions } from "compare-versions";

export function simpleDate(date) {
  return date.toISOString().slice(0, 10);
}

export function gt(_a, _b) {
  const a = typeof _a === "string" && _a.startsWith("≤") ? _a.slice(1) : _a;

  const b = typeof _b === "string" && _b.startsWith("≤") ? _b.slice(1) : _b;

  if (a === b) {
    return false;
  }

  if (!a) {
    return false;
  }
  if (!b) {
    return true;
  }
  if (a === true || b === true) {
    return false;
  }

  if (b === "preview") {
    return false;
  }
  if (a === "preview") {
    return true;
  }

  return compareVersions(a, b, ">");
}

export function gte(_a, _b) {
  const a = typeof _a === "string" && _a.startsWith("≤") ? _a.slice(1) : _a;

  const b = typeof _b === "string" && _b.startsWith("≤") ? _b.slice(1) : _b;

  if (a === b) {
    return true;
  }
  if (!a) {
    return false;
  }
  if (!b) {
    return true;
  }
  if (b === true) {
    return true;
  }
  if (a === true) {
    return false;
  }

  if (a === "preview") {
    return true;
  }
  if (b === "preview") {
    return false;
  }

  return compareVersions(a, b, ">=");
}
