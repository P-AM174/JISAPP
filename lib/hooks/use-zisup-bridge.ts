"use client";

import { useEffect, useCallback, useRef, type RefObject } from "react";
import type { GroupSession } from "@/lib/groups/client";

type SharedMessage = { op?: string; key?: string; value?: string; itemId?: string };

/** 他のメンバーの更新を確かめる間隔 */
const SHARED_POLL_MS = 5000;

/** グループの共有データ API を呼ぶ */
async function callGroupData(group: GroupSession, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`/api/app-groups/${group.groupId}/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberKey: group.memberKey, ...body }),
  });
  const json = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
  if (!res.ok) throw new Error(json.error ?? "共有データの通信に失敗しました");
  return json.result ?? null;
}

/**
 * グループに参加していないとき（開発スタジオ・グループ未参加）は、この端末だけのテスト用データとして動かす。
 * アプリの作者が、公開前に共有機能の動きを確かめられるようにするため。
 */
function localShared(appId: string, msg: SharedMessage): unknown {
  const valueKey = (key: string) => `jisapp-shared:${appId}:v:${key}`;
  const itemsKey = (key: string) => `jisapp-shared:${appId}:i:${key}`;
  type LocalItem = { id: string; value: string; createdAt: string };
  const readItems = (key: string): LocalItem[] => {
    try {
      return JSON.parse(localStorage.getItem(itemsKey(key)) ?? "[]") as LocalItem[];
    } catch {
      return [];
    }
  };
  const parse = (raw: string | null) => {
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };
  const me = { id: "local", name: "あなた（テスト）", isOwner: true };
  const toItem = (item: LocalItem) => ({
    id: item.id,
    value: parse(item.value),
    author: { id: me.id, name: me.name },
    createdAt: item.createdAt,
    mine: true,
  });
  const key = msg.key ?? "";

  switch (msg.op) {
    case "me":
      return me;
    case "group":
      return null;
    case "get":
      return parse(localStorage.getItem(valueKey(key)));
    case "set":
      localStorage.setItem(valueKey(key), msg.value ?? "null");
      return parse(msg.value ?? "null");
    case "list":
      return readItems(key).map(toItem);
    case "add": {
      const item: LocalItem = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        value: msg.value ?? "null",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(itemsKey(key), JSON.stringify([...readItems(key), item]));
      return toItem(item);
    }
    case "remove": {
      const items = readItems(key);
      const next = items.filter((i) => i.id !== msg.itemId);
      localStorage.setItem(itemsKey(key), JSON.stringify(next));
      return next.length !== items.length;
    }
    default:
      throw new Error("不明な操作です");
  }
}

function localStorageKey(appId: string, key: string) {
  return `jisapp:${appId}:${key}`;
}

function readLocalValue(appId: string, key: string): string | null {
  try {
    return localStorage.getItem(localStorageKey(appId, key));
  } catch {
    return null;
  }
}

function removeLocalValue(appId: string, key: string) {
  try {
    localStorage.removeItem(localStorageKey(appId, key));
  } catch {
    /* noop */
  }
}

async function saveToCloud(appId: string, key: string, value: string) {
  const res = await fetch("/api/app-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, appId }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? "クラウド保存に失敗");
  }
}

async function loadFromCloud(appId: string, key: string): Promise<string | null> {
  const res = await fetch(
    `/api/app-data?key=${encodeURIComponent(key)}&appId=${encodeURIComponent(appId)}`
  );
  if (!res.ok) throw new Error("クラウド読み込みに失敗");
  const json = (await res.json()) as { value?: string | null };
  return json.value ?? null;
}

async function proxyFetchFromApp(input: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  appId?: string;
  secret?: string;
}) {
  const res = await fetch("/api/zisup/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    status?: number;
    body?: unknown;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? "外部APIへの接続に失敗しました");
  }
  return {
    ok: !!json.ok,
    status: json.status ?? res.status,
    body: json.body ?? null,
  };
}

/**
 * Zisup postMessage ブリッジ。
 *
 * cloudUserId が渡されたときのみ Supabase（マイライブラリ登録済み）に保存。
 * それ以外は localStorage にフォールバック。
 */
export function useZisupBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  appId: string,
  cloudUserId: string | null | undefined,
  /** 参加しているグループ。null ならグループ共有はこの端末だけのテスト用データになる */
  group: GroupSession | null = null
) {
  /** アプリが onChange で見張っているキー */
  const watchedKeysRef = useRef<Set<string>>(new Set());

  const send = useCallback(
    (id: string, value: string | null, error?: string) => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          { __zisup_type: "response", __zisup_id: id, value, error: error ?? null },
          "*"
        );
      } catch { /* noop */ }
    },
    [iframeRef]
  );

  useEffect(() => {
    if (!cloudUserId) return;

    const prefix = localStorageKey(appId, "");
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(prefix)) {
          keys.push(storageKey.slice(prefix.length));
        }
      }
    } catch {
      return;
    }

    if (keys.length === 0) return;

    void (async () => {
      for (const key of keys) {
        const value = readLocalValue(appId, key);
        if (value === null) continue;
        try {
          const cloudValue = await loadFromCloud(appId, key);
          if (cloudValue === null) {
            await saveToCloud(appId, key, value);
          }
          removeLocalValue(appId, key);
        } catch {
          /* 次回 load/save 時に再試行 */
        }
      }
    })();
  }, [cloudUserId, appId]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const d = e.data as {
        __zisup_type?: string;
        __zisup_id?: string;
        key?: string;
        value?: string;
      };
      if (
        !d ||
        (d.__zisup_type !== "save" &&
          d.__zisup_type !== "load" &&
          d.__zisup_type !== "fetch" &&
          d.__zisup_type !== "shared" &&
          d.__zisup_type !== "shared_watch")
      ) return;
      if (e.source !== iframeRef.current?.contentWindow) return;

      if (d.__zisup_type === "shared_watch") {
        if (d.key) watchedKeysRef.current.add(d.key);
        return;
      }

      const { __zisup_id: id } = d;
      if (!id) return;

      if (d.__zisup_type === "shared") {
        const msg = d as SharedMessage;
        try {
          const result = group
            ? await callGroupData(group, { op: msg.op, key: msg.key, value: msg.value, itemId: msg.itemId })
            : localShared(appId, msg);
          send(id, JSON.stringify(result ?? null));
        } catch (err) {
          send(id, null, err instanceof Error ? err.message : "共有データのエラー");
        }
        return;
      }

      if (d.__zisup_type === "fetch") {
        const fetchPayload = d as {
          url?: string;
          method?: string;
          headers?: Record<string, string>;
          body?: string;
          secret?: string;
        };
        if (!fetchPayload.url) {
          send(id, null, "URLが必要です");
          return;
        }
        try {
          const result = await proxyFetchFromApp({
            url: fetchPayload.url,
            method: fetchPayload.method,
            headers: fetchPayload.headers,
            body: fetchPayload.body,
            appId,
            secret: fetchPayload.secret,
          });
          send(id, JSON.stringify(result));
        } catch (err) {
          send(id, null, err instanceof Error ? err.message : "外部APIエラー");
        }
        return;
      }

      const { key, value } = d;
      if (!key) return;

      if (d.__zisup_type === "save") {
        if (cloudUserId) {
          try {
            await saveToCloud(appId, key, value ?? "");
            removeLocalValue(appId, key);
            send(id, value ?? null);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "保存エラー");
          }
        } else {
          try {
            localStorage.setItem(localStorageKey(appId, key), value ?? "");
            send(id, value ?? null);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "保存エラー");
          }
        }
      } else {
        if (cloudUserId) {
          try {
            let cloudValue = await loadFromCloud(appId, key);
            if (cloudValue === null) {
              const localValue = readLocalValue(appId, key);
              if (localValue !== null) {
                await saveToCloud(appId, key, localValue);
                removeLocalValue(appId, key);
                cloudValue = localValue;
              }
            }
            send(id, cloudValue);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "読み込みエラー");
          }
        } else {
          try {
            send(id, readLocalValue(appId, key));
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "読み込みエラー");
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [cloudUserId, appId, iframeRef, send, group]);

  // グループ参加中は、見張っているキーが他のメンバーに更新されていないか定期的に確かめる
  useEffect(() => {
    watchedKeysRef.current = new Set();
    if (!group) return;
    let last: Record<string, string> | null = null;
    let stopped = false;

    const tick = async () => {
      const keys = [...watchedKeysRef.current];
      if (keys.length === 0 || document.visibilityState !== "visible") return;
      try {
        const versions = (await callGroupData(group, { op: "versions", keys })) as Record<string, string>;
        if (stopped) return;
        if (last) {
          for (const key of keys) {
            if (last[key] !== undefined && versions[key] !== last[key]) {
              iframeRef.current?.contentWindow?.postMessage({ __zisup_type: "shared_changed", key }, "*");
            }
          }
        }
        last = { ...(last ?? {}), ...versions };
      } catch {
        /* 次の確認で再試行 */
      }
    };

    const timer = window.setInterval(() => void tick(), SHARED_POLL_MS);
    void tick();
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [group, iframeRef]);
}
