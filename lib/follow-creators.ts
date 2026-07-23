const STORAGE_KEY = "jisapp_followed_creator_names";
const FOLLOWER_COUNTS_KEY = "jisapp_creator_follower_counts";

function readFollowerCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FOLLOWER_COUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function getCreatorFollowerCount(name: string): number {
  const key = name.trim();
  if (!key) return 0;
  return readFollowerCounts()[key] ?? 0;
}

export function getFollowedCreatorNames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function isFollowingCreator(name: string): boolean {
  const key = name.trim();
  if (!key) return false;
  return getFollowedCreatorNames().includes(key);
}

export function toggleFollowCreator(name: string): boolean {
  const key = name.trim();
  if (!key) return false;
  const current = getFollowedCreatorNames();
  const wasFollowing = current.includes(key);
  const next = wasFollowing
    ? current.filter((n) => n !== key)
    : [...current, key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  const counts = readFollowerCounts();
  counts[key] = Math.max(0, (counts[key] ?? 0) + (wasFollowing ? -1 : 1));
  localStorage.setItem(FOLLOWER_COUNTS_KEY, JSON.stringify(counts));

  return next.includes(key);
}
