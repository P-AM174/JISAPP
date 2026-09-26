"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Copy,
  LogOut,
  RefreshCw,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  inviteUrl,
  leaveActiveGroup,
  readGroupSession,
  saveGroupSession,
  type GroupSession,
} from "@/lib/groups/client";

type InviteInfo = { group: { id: string; name: string; appId: string }; appTitle: string; memberCount: number };

const PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60";
const INPUT =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

/**
 * アプリのページに出すグループの帯。
 * ・招待リンク（?g=）から来た人は、表示名だけでグループに参加できる（ログイン不要）
 * ・グループを作るのはログインした人だけ
 */
export function AppGroupPanel({
  appId,
  appTitle,
  usesShared,
  isLoggedIn,
  userName,
  loginCallbackUrl,
  group,
  onGroupChange,
}: {
  appId: string;
  appTitle: string;
  /** アプリがグループ共有（Zisup.shared）を使っているか */
  usesShared: boolean;
  isLoggedIn: boolean;
  userName: string | null;
  loginCallbackUrl: string;
  group: GroupSession | null;
  onGroupChange: (group: GroupSession | null) => void;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState<{ token: string; info: InviteInfo } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<GroupSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 招待リンク（?g=トークン）から来たとき
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("g");
    if (!token) return;
    url.searchParams.delete("g");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);

    void (async () => {
      const res = await fetch(`/api/app-groups/invite/${encodeURIComponent(token)}`);
      const data = (await res.json().catch(() => ({}))) as InviteInfo & { error?: string };
      if (!res.ok) {
        setInviteError(data.error ?? "招待リンクが無効です");
        return;
      }
      // すでに参加済みなら、そのままそのグループで開く
      const existing = readGroupSession(data.group.id);
      if (existing) {
        const next = { ...existing, inviteToken: token };
        saveGroupSession(next);
        onGroupChange(next);
        return;
      }
      setInvite({ token, info: data });
    })();
    // 初回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [menuOpen]);

  const goLogin = () => {
    try {
      sessionStorage.setItem("jisapp_login_return", loginCallbackUrl);
    } catch {
      /* noop */
    }
    router.push(`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`);
  };

  const regenerate = async () => {
    if (!group) return;
    setMenuOpen(false);
    if (!window.confirm("招待リンクを作り直しますか？\n今までのリンクは使えなくなります（参加済みのメンバーはそのまま使えます）。")) return;
    const res = await fetch(`/api/app-groups/${group.groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate_invite" }),
    });
    const data = (await res.json().catch(() => ({}))) as { inviteToken?: string; error?: string };
    if (!res.ok || !data.inviteToken) {
      window.alert(data.error ?? "作り直せませんでした");
      return;
    }
    const next = { ...group, inviteToken: data.inviteToken };
    saveGroupSession(next);
    onGroupChange(next);
    setSharing(next);
  };

  const removeGroup = async () => {
    if (!group) return;
    setMenuOpen(false);
    if (!window.confirm(`グループ「${group.groupName}」を削除しますか？\nメンバー全員の共有データも消え、元に戻せません。`)) return;
    const res = await fetch(`/api/app-groups/${group.groupId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "削除できませんでした");
      return;
    }
    leaveActiveGroup(appId, true);
    onGroupChange(null);
  };

  const leave = () => {
    setMenuOpen(false);
    if (!window.confirm("この端末でグループから抜けますか？\nもう一度参加するには招待リンクが必要です。")) return;
    leaveActiveGroup(appId, true);
    onGroupChange(null);
  };

  const showBar = usesShared || !!group;

  return (
    <>
      {inviteError && (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{inviteError}</span>
          <button type="button" onClick={() => setInviteError("")} aria-label="閉じる" className="text-amber-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showBar && (
        <div className="flex shrink-0 items-center gap-2 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 px-4 py-2 text-xs">
          <Users className="h-4 w-4 shrink-0 text-emerald-700" />
          {group ? (
            <>
              <p className="min-w-0 flex-1 truncate text-emerald-950">
                <span className="font-bold">{group.groupName}</span>
                <span className="text-emerald-800/70"> ・ {group.displayName}として参加中</span>
              </p>
              {group.inviteToken && (
                <button
                  type="button"
                  onClick={() => setSharing(group)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 font-bold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  招待
                </button>
              )}
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="グループの操作"
                  className="flex items-center rounded-lg px-1.5 py-1.5 text-emerald-800 hover:bg-white/70"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-50 w-56 rounded-xl bg-white p-1.5 text-sm shadow-xl ring-1 ring-slate-900/10">
                    {group.isOwner && (
                      <>
                        <button type="button" onClick={() => void regenerate()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                          <RefreshCw className="h-4 w-4 text-slate-400" />
                          招待リンクを作り直す
                        </button>
                        <button type="button" onClick={() => void removeGroup()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                          グループを削除
                        </button>
                        <div className="my-1 h-px bg-slate-100" />
                      </>
                    )}
                    <button type="button" onClick={leave} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                      <LogOut className="h-4 w-4 text-slate-400" />
                      この端末でグループを抜ける
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="min-w-0 flex-1 text-emerald-950">
                <span className="font-bold">みんなでデータを共有できるアプリです。</span>
                <span className="hidden text-emerald-800/70 sm:inline"> グループを作って、招待リンクをメンバーに送りましょう</span>
              </p>
              <button
                type="button"
                onClick={() => (isLoggedIn ? setCreating(true) : goLogin())}
                className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
              >
                {isLoggedIn ? "グループを作る" : "ログインしてグループを作る"}
              </button>
            </>
          )}
        </div>
      )}

      {invite && (
        <JoinModal
          appId={appId}
          token={invite.token}
          info={invite.info}
          defaultName={userName ?? ""}
          onClose={() => setInvite(null)}
          onJoined={(session) => {
            setInvite(null);
            onGroupChange(session);
          }}
        />
      )}

      {creating && (
        <CreateModal
          appId={appId}
          appTitle={appTitle}
          defaultName={userName ?? ""}
          onClose={() => setCreating(false)}
          onCreated={(session) => {
            setCreating(false);
            onGroupChange(session);
            setSharing(session);
          }}
        />
      )}

      {sharing?.inviteToken && (
        <InviteModal appId={appId} appTitle={appTitle} group={sharing} onClose={() => setSharing(null)} />
      )}
    </>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[450] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-[#fbfdfc] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
        <div className="flex items-center px-5 pt-4">
          <h2 className="flex-1 text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
}

function JoinModal({
  appId,
  token,
  info,
  defaultName,
  onClose,
  onJoined,
}: {
  appId: string;
  token: string;
  info: InviteInfo;
  defaultName: string;
  onClose: () => void;
  onJoined: (session: GroupSession) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (!name.trim()) {
      setError("表示名を入力してください");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/app-groups/invite/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        group?: { id: string; name: string };
        member?: { id: string; name: string; isOwner: boolean };
        memberKey?: string;
        error?: string;
      };
      if (!res.ok || !data.group || !data.member || !data.memberKey) throw new Error(data.error ?? "参加できませんでした");
      const session: GroupSession = {
        groupId: data.group.id,
        groupName: data.group.name,
        appId,
        memberId: data.member.id,
        memberKey: data.memberKey,
        displayName: data.member.name,
        isOwner: data.member.isOwner,
        inviteToken: token,
      };
      saveGroupSession(session);
      onJoined(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "参加できませんでした");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="グループに参加" onClose={onClose}>
      <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
        <p className="text-xs text-emerald-800/80">{info.appTitle}</p>
        <p className="mt-0.5 text-base font-extrabold text-emerald-950">{info.group.name}</p>
        <p className="mt-0.5 text-xs text-emerald-800/80">メンバー {info.memberCount}人</p>
      </div>
      <label htmlFor="group-join-name" className="mt-4 block text-sm font-bold text-slate-800">
        表示名
      </label>
      <input
        id="group-join-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        autoFocus
        placeholder="例：たろう"
        className={INPUT}
        onKeyDown={(e) => {
          if (e.key === "Enter") void join();
        }}
      />
      <p className="mt-1.5 text-xs text-slate-500">メンバーに表示される名前です。ログインは必要ありません。</p>
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      <button type="button" onClick={() => void join()} disabled={busy} className={cn(PRIMARY, "mt-4")}>
        <Users className="h-4 w-4" />
        {busy ? "参加しています…" : "このグループに参加する"}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
        参加した情報はこの端末のブラウザに保存されます。参加すると
        <Link href="/terms#groups" target="_blank" rel="noopener noreferrer" className="mx-0.5 font-semibold text-emerald-700 underline underline-offset-2">
          グループ共有の利用規約
        </Link>
        に同意したものとみなします。
      </p>
    </ModalShell>
  );
}

function CreateModal({
  appId,
  appTitle,
  defaultName,
  onClose,
  onCreated,
}: {
  appId: string;
  appTitle: string;
  defaultName: string;
  onClose: () => void;
  onCreated: (session: GroupSession) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!groupName.trim() || !name.trim()) {
      setError("グループ名と表示名を入力してください");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/app-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, name: groupName, displayName: name }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        group?: { id: string; name: string };
        inviteToken?: string;
        member?: { id: string; name: string; isOwner: boolean };
        memberKey?: string;
        error?: string;
      };
      if (!res.ok || !data.group || !data.member || !data.memberKey) throw new Error(data.error ?? "作れませんでした");
      const session: GroupSession = {
        groupId: data.group.id,
        groupName: data.group.name,
        appId,
        memberId: data.member.id,
        memberKey: data.memberKey,
        displayName: data.member.name,
        isOwner: true,
        inviteToken: data.inviteToken,
      };
      saveGroupSession(session);
      onCreated(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作れませんでした");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="グループを作る" onClose={onClose}>
      <p className="text-sm text-slate-500">「{appTitle}」を、招待したメンバーとデータを共有しながら使えます。</p>
      <label htmlFor="group-create-name" className="mt-4 block text-sm font-bold text-slate-800">
        グループ名
      </label>
      <input
        id="group-create-name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        maxLength={40}
        autoFocus
        placeholder="例：テニスサークル 2026"
        className={INPUT}
      />
      <label htmlFor="group-create-me" className="mt-3 block text-sm font-bold text-slate-800">
        あなたの表示名
      </label>
      <input id="group-create-me" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="例：部長" className={INPUT} />
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      <button type="button" onClick={() => void create()} disabled={busy} className={cn(PRIMARY, "mt-4")}>
        {busy ? "作っています…" : "グループを作って招待リンクを出す"}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
        作った人は、招待リンクの作り直しやグループの削除ができます。作成すると
        <Link href="/terms#groups" target="_blank" rel="noopener noreferrer" className="mx-0.5 font-semibold text-emerald-700 underline underline-offset-2">
          グループ共有の利用規約
        </Link>
        に同意したものとみなします。
      </p>
    </ModalShell>
  );
}

function InviteModal({
  appId,
  appTitle,
  group,
  onClose,
}: {
  appId: string;
  appTitle: string;
  group: GroupSession;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(appId, group.inviteToken ?? "");
  const message = `「${group.groupName}」で「${appTitle}」を使おう。このリンクから参加できます（登録不要）\n`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <ModalShell title="メンバーを招待" onClose={onClose}>
      <p className="text-sm text-slate-500">このリンクを送ると、表示名を入れるだけで「{group.groupName}」に参加できます。</p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-slate-600 outline-none" />
        <button type="button" onClick={() => void copy()} className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
      <a
        href={`https://line.me/R/msg/text/?${encodeURIComponent(message + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95"
      >
        LINEで送る
      </a>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        リンクを知っている人は誰でも参加できます。グループ外に漏れたときは、作った人が「招待リンクを作り直す」で古いリンクを使えなくできます。
      </p>
    </ModalShell>
  );
}
