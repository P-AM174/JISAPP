"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** ログイン・マイライブラリ登録状態（クラウド同期の可否） */
export function useLibrarySync(appId: string) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const [inLibrary, setInLibrary] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!isLoggedIn) {
      setInLibrary(false);
      setChecked(true);
      return;
    }

    let cancelled = false;
    setChecked(false);

    fetch(`/api/library/check?appId=${encodeURIComponent(appId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setInLibrary(Boolean(d.inLibrary));
      })
      .catch(() => {
        if (!cancelled) setInLibrary(false);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [appId, isLoggedIn, status]);

  const ready = status !== "loading" && checked;
  const enableCloud = isLoggedIn && inLibrary;

  return {
    userId,
    isLoggedIn,
    inLibrary,
    enableCloud,
    ready,
    setInLibrary,
    sessionStatus: status,
  };
}
