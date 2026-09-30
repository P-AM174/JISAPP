/**
 * 作者のフォロー（ブラウザ側）。
 * ログインしているときはサーバー（/api/follows）に保存し、端末の localStorage は表示を速くするための控えにする。
 * ログインしていない・サーバーの表がまだないときは、これまでどおり端末の中だけで覚える。
 */

const STORAGE_KEY = "jisapp_followed_creator_names";
const FOLLOWER_COUNTS_KEY = "jisapp_creator_follower_counts";
/** 端末に残っていたフォローを、ログインしたアカウントへ移したか */
const IMPORTED_KEY = "jisapp_follows_imported";
/** フォローが変わったときに、画面のボタンや一覧へ知らせる */
export const FOLLOWS_CHANGED_EVENT = "jisapp:follows-changed";

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

/** 端末の中だけで数えたフォロワー数（サーバーで数えられないときの予備） */
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

function writeFollowedCreatorNames(names: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    /* 覚えられなくても続ける */
  }
  try {
    window.dispatchEvent(new CustomEvent(FOLLOWS_CHANGED_EVENT));
  } catch {
    /* noop */
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
  const next = wasFollowing ? current.filter((n) => n !== key) : [...current, key];
  writeFollowedCreatorNames(next);

  try {
    const counts = readFollowerCounts();
    counts[key] = Math.max(0, (counts[key] ?? 0) + (wasFollowing ? -1 : 1));
    localStorage.setItem(FOLLOWER_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    /* noop */
  }

  // ログインしていればサーバーにも保存する（未ログインなら 401 で何もしない）
  void fetch("/api/follows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorName: key, follow: !wasFollowing }),
  })
    .then((res) => {
      // 保存が終わったら、フォロワー数などを読み直せるようにもう一度知らせる
      if (res.ok) window.dispatchEvent(new CustomEvent(FOLLOWS_CHANGED_EVENT));
    })
    .catch(() => {});

  return next.includes(key);
}

let syncing: Promise<string[] | null> | null = null;

/**
 * サーバーのフォローを読み込んで、端末の控えをそれに合わせる（1回の表示につき1度だけ通信する）。
 * 初めてのときは、端末に残っていたフォローをアカウントへ移す。
 * ログインしていない・サーバーの表がまだないときは null（端末の控えのまま）
 */
export function syncFollowsFromServer(): Promise<string[] | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const res = await fetch("/api/follows");
      if (!res.ok) return null;
      const data = (await res.json()) as { available?: boolean; following?: string[] };
      if (!data.available) return null;
      let following = data.following ?? [];

      let imported = false;
      try {
        imported = localStorage.getItem(IMPORTED_KEY) === "1";
      } catch {
        /* noop */
      }
      if (!imported) {
        const localOnly = getFollowedCreatorNames().filter((n) => !following.includes(n));
        if (localOnly.length > 0) {
          const ok = await fetch("/api/follows/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creatorNames: localOnly }),
          })
            .then((r) => r.ok)
            .catch(() => false);
          if (ok) following = [...following, ...localOnly];
          else return null;
        }
        try {
          localStorage.setItem(IMPORTED_KEY, "1");
        } catch {
          /* noop */
        }
      }

      writeFollowedCreatorNames(following);
      return following;
    } catch {
      return null;
    }
  })();
  return syncing;
}

/** サーバーで数えたフォロワー数。数えられないときは null */
export async function fetchFollowerCount(name: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/follows/count?name=${encodeURIComponent(name.trim())}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { available?: boolean; count?: number };
    return data.available ? (data.count ?? 0) : null;
  } catch {
    return null;
  }
}
