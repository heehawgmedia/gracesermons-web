import type { Sermon } from './types';

/** A message counts as "new" for this many days after it is uploaded. */
export const NEW_DAYS = 7;

const DAY_MS = 86_400_000;

/** True when a sermon was uploaded within the new-message window. */
export function isNew(createdAt: string, days = NEW_DAYS): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  const age = Date.now() - t;
  return age >= 0 && age < days * DAY_MS;
}

/** Newly uploaded messages, newest first. */
export function recentlyAdded(sermons: Sermon[], days = NEW_DAYS): Sermon[] {
  return sermons
    .filter((s) => isNew(s.createdAt, days))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
