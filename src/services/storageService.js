// Storage Service — the "Database" component.
// Persists a single JSON document in localStorage (zero-config, works on any static host).
import { buildSeedDatabase } from '../data/seedData.js';

const DB_KEY = 'codementor_db_v1';
const SESSION_KEY = 'codementor_session_v1';
const DRAFT_PREFIX = 'codementor_draft_';

const memoryFallback = new Map();
function store() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* access denied (private mode etc.) */ }
  return {
    getItem: (k) => (memoryFallback.has(k) ? memoryFallback.get(k) : null),
    setItem: (k, v) => memoryFallback.set(k, String(v)),
    removeItem: (k) => memoryFallback.delete(k),
  };
}

let cache = null;
const listeners = new Set();

export function initDB() {
  if (cache) return cache;
  try {
    const raw = store().getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && Array.isArray(parsed.users)) {
        cache = parsed;
        return cache;
      }
    }
  } catch { /* corrupted — reseed below */ }
  cache = buildSeedDatabase();
  persist();
  return cache;
}

function persist() {
  try {
    store().setItem(DB_KEY, JSON.stringify(cache));
  } catch { /* quota or blocked — keep in memory */ }
  listeners.forEach((fn) => fn(cache));
}

export function getDB() {
  return initDB();
}

/** Mutate the DB through a callback, then persist. Returns the callback's result. */
export function updateDB(mutator) {
  const db = initDB();
  const result = mutator(db);
  persist();
  return result;
}

export function resetDB() {
  cache = buildSeedDatabase();
  persist();
  clearSession();
  try {
    const s = store();
    if (typeof s.length === 'number' && typeof s.key === 'function') {
      const keys = [];
      for (let i = 0; i < s.length; i++) keys.push(s.key(i));
      keys.filter((k) => k && k.startsWith(DRAFT_PREFIX)).forEach((k) => s.removeItem(k));
    }
  } catch { /* ignore */ }
  return cache;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Session ──
export function getSession() {
  try {
    const raw = store().getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setSession(session) {
  store().setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession() {
  store().removeItem(SESSION_KEY);
}

// ── Code drafts ──
export function getDraft(userId, problemId, lang) {
  try {
    return store().getItem(`${DRAFT_PREFIX}${userId}_${problemId}_${lang}`);
  } catch {
    return null;
  }
}
export function setDraft(userId, problemId, lang, code) {
  try {
    store().setItem(`${DRAFT_PREFIX}${userId}_${problemId}_${lang}`, code);
  } catch { /* ignore */ }
}

export const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
