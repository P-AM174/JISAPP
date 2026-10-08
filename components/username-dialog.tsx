"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { UserRound, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const USERNAME_MAX = 20;

/**
 * ジサップで表示する名前を決める・変える画面。
 * mode="setup"：Google でログインして、まだ名前を決めていない人に出す（閉じられない）
 * mode="edit"：マイページから名前を変える
 */
export function UsernameDialog({
  mode,
  initialName = "",
  onDone,
  onClose,
}: {
  mode: "setup" | "edit";
  initialName?: string;
  onDone?: (name: string) => void;
  onClose?: () => void;
}) {
  const t = useT();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/me/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("保存できませんでした", "Couldn't save"));
        return;
      }
      // ログインの情報を読み直して、新しい名前を画面に反映する
      await update();
      onDone?.(data.name);
    } catch {
      setError(t("保存できませんでした", "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={t("ジサップで表示する名前", "Your name on Jisapp")}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-5 text-white">
          {mode === "edit" && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("閉じる", "Close")}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/25">
            <UserRound className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-black leading-snug">
            {mode === "setup" ? t("ジサップで表示する名前を決めてください", "Choose your name on Jisapp") : t("表示名を変える", "Change your display name")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-white/90">
            {mode === "setup"
              ? t("アプリを公開したときの作者名などに使います。Google の名前は表示されません。", "It's shown as the creator name when you publish apps. Your Google name is never shown.")
              : t("公開済みのアプリの作者名も、新しい名前になります。", "The creator name on your published apps changes too.")}
          </p>
        </div>
        <div className="space-y-3 p-6">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={USERNAME_MAX}
              autoFocus
              autoComplete="nickname"
              placeholder={t("例：たろう、ハルの工房", "e.g. Alex, Haru's workshop")}
              aria-label={t("表示する名前", "Display name")}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
              {t("本名ではなく、ニックネームがおすすめです（20文字まで・あとから変えられます）", "We recommend a nickname rather than your real name (up to 20 characters, changeable later)")}
            </p>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? t("保存中…", "Saving…") : mode === "setup" ? t("この名前にする", "Use this name") : t("変更する", "Change")}
          </button>
          {mode === "setup" && (
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="w-full py-1 text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              {t("ログアウトする", "Sign out")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/** まだ名前を決めていない人に、どのページでも名前を決める画面を出す（ログイン画面を除く） */
export function UsernameSetupGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname() ?? "";
  const needs =
    status === "authenticated" &&
    !!session?.user &&
    (session.user as { usernameSet?: boolean }).usernameSet === false;
  if (!needs || /\/(login|forgot-password|reset-password)(\/|$)/.test(pathname)) return null;
  return <UsernameDialog mode="setup" />;
}
