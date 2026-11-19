// Authentication Service — register, login, logout, session lookup.
import { getDB, updateDB, getSession, setSession, clearSession, uid } from './storageService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

export function validateRegistration({ name, email, password }) {
  if (!name || name.trim().length < 2) return 'Please enter your full name (at least 2 characters).';
  if (!email || !EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  const exists = getDB().users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) return 'An account with this email already exists.';
  return null;
}

/** TC01 — create a student account, persist it, and start a session. */
export function register({ name, email, password }) {
  const error = validateRegistration({ name, email, password });
  if (error) return { ok: false, error };
  const user = {
    id: uid('u'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'student',
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => {
    db.users.push(user);
    db.progress[user.id] = { dailyGoal: 3, dayOffset: 0, hintsRevealed: {} };
  });
  setSession({ userId: user.id, role: user.role });
  return { ok: true, user: publicUser(user) };
}

/** TC02 — invalid credentials are rejected; valid ones route by role. */
export function login(email, password) {
  if (!email || !password) return { ok: false, error: 'Please enter both email and password.' };
  const user = getDB().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid email or password. Please try again.' };
  }
  updateDB((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastLogin = new Date().toISOString();
  });
  setSession({ userId: user.id, role: user.role });
  return { ok: true, user: publicUser(user), redirect: user.role === 'admin' ? '/admin' : '/dashboard' };
}

export function logout() {
  clearSession();
  return { ok: true };
}

export function getCurrentUser() {
  const s = getSession();
  if (!s) return null;
  const user = getDB().users.find((u) => u.id === s.userId);
  if (!user) {
    clearSession();
    return null;
  }
  return publicUser(user);
}

export function updateProfile(userId, { name, password, currentPassword }) {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found.' };
  if (name !== undefined && name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
  if (password) {
    if (currentPassword !== user.password) return { ok: false, error: 'Current password is incorrect.' };
    if (password.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
  }
  updateDB((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (name !== undefined) u.name = name.trim();
    if (password) u.password = password;
  });
  return { ok: true };
}
