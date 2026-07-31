"use client";

import { useEffect, useCallback, type RefObject } from "react";

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
  cloudUserId: string | null | undefined
) {
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
      if (!d || (d.__zisup_type !== "save" && d.__zisup_type !== "load" && d.__zisup_type !== "fetch")) return;
      if (e.source !== iframeRef.current?.contentWindow) return;

      const { __zisup_id: id, key, value } = d;
      if (!id) return;

      if (d.__zisup_type === "fetch") {
        const fetchPayload = d as {
          url?: string;
          method?: string;
          headers?: Record<string, string>;
          body?: string;
          secret?: string;
        };
        if (!fetchPayload.url) return;
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
  }, [cloudUserId, appId, iframeRef, send]);
}
