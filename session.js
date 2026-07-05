export const sessions = new Map();
export const awaiting = new Map();
export const menuTimers = new Map();

export function setAwaiting(userId, action) { awaiting.set(String(userId), action); }
export function popAwaiting(userId) { const k=String(userId); const v=awaiting.get(k); awaiting.delete(k); return v; }
