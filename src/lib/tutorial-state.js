const prefix = "pyoloker:tutorial:";

function key(userId) {
  return `${prefix}${userId || "anonymous"}`;
}

export function readTutorialState(storage = window.localStorage, userId) {
  try {
    const value = JSON.parse(storage.getItem(key(userId)) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function writeTutorialState(storage = window.localStorage, userId, state) {
  storage.setItem(key(userId), JSON.stringify(state || {}));
  return state || {};
}

export function markTutorialSeen(storage = window.localStorage, userId, milestone) {
  const current = readTutorialState(storage, userId);
  return writeTutorialState(storage, userId, { ...current, seen: { ...current.seen, [milestone]: true } });
}

export function resetTutorialState(storage = window.localStorage, userId) {
  storage.removeItem(key(userId));
  return {};
}

export function clearTutorialState(storage = window.localStorage, userId) {
  return resetTutorialState(storage, userId);
}
