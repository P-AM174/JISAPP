import { extractStorageUsage } from "@/lib/playground/detect-storage-keys";

/**
 * アプリの localStorage を、ジサップの画面側でアプリごとに分けて保存する。
 *
 * アプリは権限を切り離した枠（allow-same-origin なし）で動くため、ブラウザの localStorage を直接使えない。
 * 以前は全アプリがジサップと同じ localStorage を共有していたので、はじめて開いたときだけ、
 * そのアプリのコードが使っているキーの値を、アプリ専用の場所へ引き継ぐ。
 */

const prefix = (appId: string) => `jisapp-ls:${appId}:`;
const migratedKey = (appId: string) => `jisapp-ls-migrated:${appId}`;

/** アプリ起動時に渡す localStorage の中身 */
export function readAppStorageSnapshot(appId: string, code?: string | null): Record<string, string> {
  const snapshot: Record<string, string> = {};
  if (typeof window === "undefined") return snapshot;
  try {
    const p = prefix(appId);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(p)) snapshot[k.slice(p.length)] = localStorage.getItem(k) ?? "";
    }

    // 以前のデータ（アプリ専用の場所ができる前に保存したもの）を一度だけ引き継ぐ
    if (code && !localStorage.getItem(migratedKey(appId))) {
      for (const key of extractStorageUsage(code).localStorageKeys) {
        if (key in snapshot) continue;
        const old = localStorage.getItem(key);
        if (old === null) continue;
        snapshot[key] = old;
        localStorage.setItem(p + key, old);
      }
      localStorage.setItem(migratedKey(appId), "1");
    }
  } catch {
    /* 読めなくても起動はする */
  }
  return snapshot;
}

/** アプリからの書き込み（ls メッセージ）を保存する */
export function applyAppStorageMessage(
  appId: string,
  msg: { op?: string; key?: string; value?: string }
) {
  try {
    const p = prefix(appId);
    if (msg.op === "set" && typeof msg.key === "string") {
      localStorage.setItem(p + msg.key, String(msg.value ?? ""));
    } else if (msg.op === "remove" && typeof msg.key === "string") {
      localStorage.removeItem(p + msg.key);
    } else if (msg.op === "clear") {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(p)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* 容量オーバーなどは無視（アプリ内の値は残る） */
  }
}
