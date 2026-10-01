"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/lib/i18n/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  LogOut,
  RefreshCw,
  Settings2,
  Share2,
  Trash2,
  UserMinus,
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
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, format, plural } from "@/lib/i18n/config";

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
  isAppOwner = false,
  userName,
  loginCallbackUrl,
  group,
  onGroupChange,
  manageOpen = false,
  onManageClose,
}: {
  appId: string;
  appTitle: string;
  /** アプリがグループ共有（Jisapp.shared）を使っているか */
  usesShared: boolean;
  isLoggedIn: boolean;
  /** 見ている人が、このアプリを出した本人か */
  isAppOwner?: boolean;
  userName: string | null;
  loginCallbackUrl: string;
  group: GroupSession | null;
  onGroupChange: (group: GroupSession | null) => void;
  /** ページ上部の「グループ管理」ボタンから開く */
  manageOpen?: boolean;
  onManageClose?: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const [invite, setInvite] = useState<{ token: string; info: InviteInfo } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<GroupSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [myGroupsLoaded, setMyGroupsLoaded] = useState(false);
  /** マイプロジェクトの「グループ管理」（?manage=1）から来たとき、グループ管理を開くまで待つ */
  const [pendingManage, setPendingManage] = useState(false);
  const autoSwitchedRef = useRef(false);
  /** 招待リンクから来たときは、出した本人でも「グループを作る」を自動では開かない */
  const fromInviteRef = useRef(false);

  // ログインしている人のグループ（作ったもの・ログインして参加したもの）。別の端末から戻るため
  useEffect(() => {
    if (!isLoggedIn) {
      setMyGroups([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/app-groups?appId=${encodeURIComponent(appId)}`)
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d: { groups?: MyGroup[] }) => {
        if (cancelled) return;
        setMyGroups(d.groups ?? []);
        setMyGroupsLoaded(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [appId, isLoggedIn, group?.groupId]);

  // 参加中のグループが削除された・外されたときは、この端末からも外す
  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    void fetch(`/api/app-groups/${group.groupId}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberKey: group.memberKey, op: "me" }),
    })
      .then((r) => {
        if (cancelled || r.ok || (r.status !== 403 && r.status !== 404)) return;
        leaveActiveGroup(appId, true);
        onGroupChange(null);
        setInviteError(
          r.status === 404
            ? format(t("グループ「{groupName}」は削除されました", "The group “{groupName}” was deleted"), { groupName: group.groupName })
            : format(t("グループ「{groupName}」から外れました。参加するには招待リンクが必要です", "You're no longer in “{groupName}”. You need an invite link to join again"), { groupName: group.groupName })
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // グループが変わったときだけ確かめる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.groupId]);

  /** 自分のグループに切り替える（この端末に鍵がなければ、ログイン中のアカウントで受け取り直す） */
  const switchTo = async (target: MyGroup) => {
    setChoosing(false);
    const existing = readGroupSession(target.id);
    if (existing) {
      saveGroupSession(existing);
      onGroupChange(existing);
      return;
    }
    const res = await fetch(`/api/app-groups/${target.id}/rejoin`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as {
      group?: { id: string; name: string };
      member?: { id: string; name: string; isOwner: boolean };
      memberKey?: string;
      inviteToken?: string;
      error?: string;
    };
    if (!res.ok || !data.group || !data.member || !data.memberKey) {
      window.alert(data.error ?? t("グループに戻れませんでした", "Couldn't go back to the group"));
      return;
    }
    const session: GroupSession = {
      groupId: data.group.id,
      groupName: data.group.name,
      appId,
      memberId: data.member.id,
      memberKey: data.memberKey,
      displayName: data.member.name,
      isOwner: data.member.isOwner,
      inviteToken: data.inviteToken,
    };
    saveGroupSession(session);
    onGroupChange(session);
  };
  const menuRef = useRef<HTMLDivElement>(null);

  // マイプロジェクトの「グループ管理」から来たとき
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("manage") !== "1") return;
    url.searchParams.delete("manage");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setPendingManage(true);
  }, []);

  useEffect(() => {
    if (!pendingManage) return;
    // 作ったグループで開いていれば、そのまま管理を開く
    if (group?.isOwner) {
      setPendingManage(false);
      setManaging(true);
      return;
    }
    if (!isLoggedIn || !myGroupsLoaded) return;
    const owned = myGroups.filter((g) => g.isOwner && g.appId === appId);
    if (owned.length === 1) {
      // 作ったグループがひとつなら、それに切り替えてから管理を開く
      if (autoSwitchedRef.current) return;
      autoSwitchedRef.current = true;
      void switchTo(owned[0]);
    } else if (owned.length > 1) {
      // いくつもあるときは、選んでもらう（選んだら管理を開く）
      setChoosing(true);
    } else {
      // まだ作っていなければ、作るところから
      setPendingManage(false);
      markGroupIntroShown(appId);
      setCreating(true);
    }
    // switchTo は毎回作り直されるので、依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingManage, group?.isOwner, isLoggedIn, myGroupsLoaded, myGroups, appId]);

  // アプリを出した本人がまだグループを作っていなければ、最初に開いたときに1回だけ「グループを作る」を開く
  useEffect(() => {
    if (!isAppOwner || !usesShared || !isLoggedIn || !myGroupsLoaded) return;
    if (group || pendingManage || fromInviteRef.current) return;
    if (myGroups.some((g) => g.isOwner && g.appId === appId)) return;
    if (!markGroupIntroShown(appId)) return;
    setCreating(true);
  }, [isAppOwner, usesShared, isLoggedIn, myGroupsLoaded, group, pendingManage, myGroups, appId]);

  // 招待リンク（?g=トークン）から来たとき
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("g");
    if (!token) return;
    fromInviteRef.current = true;
    url.searchParams.delete("g");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);

    void (async () => {
      const res = await fetch(`/api/app-groups/invite/${encodeURIComponent(token)}`);
      const data = (await res.json().catch(() => ({}))) as InviteInfo & { error?: string };
      if (!res.ok) {
        setInviteError(data.error ?? t("招待リンクが無効です", "This invite link isn't valid"));
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
    if (!window.confirm(t("招待リンクを作り直しますか？\n今までのリンクは使えなくなります（参加済みのメンバーはそのまま使えます）。", "Make a new invite link?\nThe old link will stop working (members who already joined stay in)."))) return;
    const res = await fetch(`/api/app-groups/${group.groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate_invite" }),
    });
    const data = (await res.json().catch(() => ({}))) as { inviteToken?: string; error?: string };
    if (!res.ok || !data.inviteToken) {
      window.alert(data.error ?? t("作り直せませんでした", "Couldn't make a new link"));
      return;
    }
    const next = { ...group, inviteToken: data.inviteToken };
    saveGroupSession(next);
    onGroupChange(next);
  };

  const removeGroup = async () => {
    if (!group) return;
    setMenuOpen(false);
    if (!window.confirm(format(t("グループ「{groupName}」を削除しますか？\nメンバー全員の共有データも消え、元に戻せません。", "Delete the group “{groupName}”?\nAll members' shared data will be erased too. This can't be undone."), { groupName: group.groupName }))) return;
    const res = await fetch(`/api/app-groups/${group.groupId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? t("削除できませんでした", "Couldn't delete"));
      return;
    }
    leaveActiveGroup(appId, true);
    onGroupChange(null);
  };

  const leave = () => {
    setMenuOpen(false);
    if (!window.confirm(t("この端末でグループから抜けますか？\nもう一度参加するには招待リンクが必要です。", "Leave the group on this device?\nYou'll need an invite link to join again."))) return;
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
          <button type="button" onClick={() => setInviteError("")} aria-label={t("閉じる", "Close")} className="text-amber-700">
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
                <span className="text-emerald-800/70">{format(t(" ・ {displayName}として参加中", " · joined as {displayName}"), { displayName: group.displayName })}</span>
              </p>
              {group.inviteToken && (
                <button
                  type="button"
                  onClick={() => setSharing(group)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 font-bold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("招待", "Invite")}
                </button>
              )}
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={t("グループの操作", "Group options")}
                  className="flex items-center rounded-lg px-1.5 py-1.5 text-emerald-800 hover:bg-white/70"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-50 w-56 rounded-xl bg-white p-1.5 text-sm shadow-xl ring-1 ring-slate-900/10">
                    {group.isOwner && (
                      <>
                        <button type="button" onClick={() => { setMenuOpen(false); setManaging(true); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                          <Settings2 className="h-4 w-4 text-slate-400" />
                          {t("グループ管理", "Manage group")}
                        </button>
                        <div className="my-1 h-px bg-slate-100" />
                      </>
                    )}
                    {(myGroups.length > 1 || isLoggedIn) && (
                      <button type="button" onClick={() => { setMenuOpen(false); setChoosing(true); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                        <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                        {t("グループを切り替える・作る", "Switch or create a group")}
                      </button>
                    )}
                    <button type="button" onClick={leave} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                      <LogOut className="h-4 w-4 text-slate-400" />
                      {t("この端末でグループを抜ける", "Leave the group on this device")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="min-w-0 flex-1 text-emerald-950">
                <span className="font-bold">{t("みんなでデータを共有できるアプリです。", "This app lets a group share data.")}</span>
                <span className="hidden text-emerald-800/70 sm:inline">{t(" グループを作って、招待リンクをメンバーに送りましょう", " Create a group and send the invite link to your members")}</span>
              </p>
              {myGroups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setChoosing(true)}
                  className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 font-bold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                >
                  {format(t("自分のグループ（{count}）", "My groups ({count})"), { count: myGroups.length })}
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLoggedIn ? setCreating(true) : goLogin())}
                className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
              >
                {isLoggedIn ? t("グループを作る", "Create a group") : t("ログインしてグループを作る", "Sign in to create a group")}
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
            // 作ったら、そのままグループ管理（招待リンク・メンバー・設定）を開く
            setManaging(true);
          }}
        />
      )}

      {sharing?.inviteToken && (
        <InviteModal appId={appId} appTitle={appTitle} group={sharing} onClose={() => setSharing(null)} />
      )}

      {choosing && (
        <ModalShell title={t("自分のグループ", "My groups")} onClose={() => { setChoosing(false); setPendingManage(false); }}>
          {myGroups.length === 0 ? (
            <p className="text-sm text-slate-500">{t("まだグループはありません。", "No groups yet.")}</p>
          ) : (
            <ul className="space-y-2">
              {myGroups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => void switchTo(g)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition",
                      group?.groupId === g.id ? "bg-emerald-50 ring-emerald-300" : "bg-white ring-slate-200 hover:ring-emerald-300"
                    )}
                  >
                    <Users className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{g.name}</span>
                    <span className="shrink-0 text-[11px] text-slate-400">{g.isOwner ? t("作った", "Created") : t("参加中", "Joined")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                setChoosing(false);
                setCreating(true);
              }}
              className={cn(PRIMARY, "mt-4")}
            >
              {t("新しいグループを作る", "Create a new group")}
            </button>
          )}
          <p className="mt-2 text-center text-[11px] text-slate-400">{t("ログインして参加したグループは、別の端末でもここから開けます", "Groups you joined while signed in can be opened here from other devices too")}</p>
        </ModalShell>
      )}

      {(managing || manageOpen) && group?.isOwner && (
        <ManageModal
          appId={appId}
          appTitle={appTitle}
          group={group}
          onRegenerate={() => void regenerate()}
          onDelete={() => void removeGroup()}
          onClose={() => {
            setManaging(false);
            onManageClose?.();
          }}
        />
      )}
    </>
  );
}

type MyGroup = { id: string; name: string; appId: string; isOwner: boolean };

/**
 * 「グループを作る」を自動で開くのは、このブラウザで1回だけ。
 * まだ出していなければ記録して true を返す（記録できないときは、何度も出ないよう false）
 */
function markGroupIntroShown(appId: string): boolean {
  const key = `jisapp_group_intro:${appId}`;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

type MemberInfo = { id: string; name: string; isOwner: boolean; loggedIn: boolean; joinedAt: string };

function ManageModal({
  appId,
  appTitle,
  group,
  onRegenerate,
  onDelete,
  onClose,
}: {
  appId: string;
  appTitle: string;
  group: GroupSession;
  onRegenerate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<MemberInfo[] | null>(null);
  const [error, setError] = useState("");
  const t = useT();
  const locale = useLocale();

  const load = async () => {
    const res = await fetch(`/api/app-groups/${group.groupId}/members`);
    const data = (await res.json().catch(() => ({}))) as { members?: MemberInfo[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? t("メンバーを読み込めませんでした", "Couldn't load members"));
      return;
    }
    setMembers(data.members ?? []);
  };

  useEffect(() => {
    void load();
    // 開いたときだけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (m: MemberInfo) => {
    if (!window.confirm(format(t("「{name}」をグループから外しますか？\nこの人はグループのデータを見たり書き込んだりできなくなります。", "Remove “{name}” from the group?\nThey won't be able to see or write the group's data anymore."), { name: m.name }))) return;
    const res = await fetch(`/api/app-groups/${group.groupId}/members?memberId=${encodeURIComponent(m.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? t("外せませんでした", "Couldn't remove them"));
      return;
    }
    await load();
  };

  return (
    <ModalShell title={t("グループ管理", "Manage group")} onClose={onClose}>
      <p className="-mt-1 text-sm font-bold text-emerald-800">{group.groupName}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{t("この画面は、グループを作った人だけに表示されます", "Only the person who created the group sees this")}</p>

      <section className="mt-4">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <Share2 className="h-4 w-4 text-emerald-600" />
          {t("メンバーを招待", "Invite members")}
        </h3>
        {group.inviteToken ? (
          <InviteLinkSection appId={appId} appTitle={appTitle} group={group} />
        ) : (
          <p className="mt-2 text-xs text-slate-500">{t("この端末には招待リンクがありません。「招待リンクを作り直す」で新しいリンクを出せます。", "There's no invite link on this device. Use “Make a new link” to get one.")}</p>
        )}
      </section>

      <section className="mt-5">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <Users className="h-4 w-4 text-emerald-600" />
          {format(t("メンバー（{count}人）", "Members ({count})"), { count: members?.length ?? "…" })}
        </h3>
        <div className="mt-2">
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      {!members && !error && <p className="text-sm text-slate-400">{t("読み込んでいます…", "Loading…")}</p>}
      {members && (
        <ul className="max-h-[36dvh] space-y-1.5 overflow-y-auto">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-slate-200">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-800">
                  {m.name}
                  {m.id === group.memberId && <span className="ml-1.5 text-[11px] font-semibold text-slate-400">{t("（あなた）", "(you)")}</span>}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {m.isOwner ? t("作った人", "Creator") : m.loggedIn ? t("ログインして参加", "Joined signed in") : t("ログインなしで参加", "Joined without signing in")}{t("・", " · ")}
                  {new Date(m.joinedAt).toLocaleDateString(intlLocale(locale))}
                </span>
              </span>
              {!m.isOwner && (
                <button
                  type="button"
                  onClick={() => void remove(m)}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                  {t("外す", "Remove")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
        </div>
      </section>

      <section className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-bold text-slate-800">{t("リンクとグループの設定", "Link and group settings")}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          {t("招待リンクが知らない人に広まった場合は、メンバーを外したうえで、招待リンクを作り直してください。", "If the invite link spreads to people you don't know, remove them and make a new invite link.")}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("リンクを作り直す", "Make a new link")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("グループを削除", "Delete group")}
          </button>
        </div>
      </section>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
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
          <button type="button" onClick={onClose} aria-label={t("閉じる", "Close")} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
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
  const t = useT();
  const locale = useLocale();

  const join = async () => {
    if (!name.trim()) {
      setError(t("表示名を入力してください", "Please enter a display name"));
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
      if (!res.ok || !data.group || !data.member || !data.memberKey) throw new Error(data.error ?? t("参加できませんでした", "Couldn't join"));
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
      setError(e instanceof Error ? e.message : t("参加できませんでした", "Couldn't join"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={t("グループに参加", "Join the group")} onClose={onClose}>
      <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
        <p className="text-xs text-emerald-800/80">{info.appTitle}</p>
        <p className="mt-0.5 text-base font-extrabold text-emerald-950">{info.group.name}</p>
        <p className="mt-0.5 text-xs text-emerald-800/80">{format(t("メンバー {n}人", plural(locale, info.memberCount, "{n} member", "{n} members")), { n: info.memberCount })}</p>
      </div>
      <label htmlFor="group-join-name" className="mt-4 block text-sm font-bold text-slate-800">
        {t("表示名", "Display name")}
      </label>
      <input
        id="group-join-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        autoFocus
        placeholder={t("例：たろう", "e.g. Sam")}
        className={INPUT}
        onKeyDown={(e) => {
          if (e.key === "Enter") void join();
        }}
      />
      <p className="mt-1.5 text-xs text-slate-500">{t("メンバーに表示される名前です。ログインは必要ありません。", "This is the name members see. No sign-in needed.")}</p>
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      <button type="button" onClick={() => void join()} disabled={busy} className={cn(PRIMARY, "mt-4")}>
        <Users className="h-4 w-4" />
        {busy ? t("参加しています…", "Joining…") : t("このグループに参加する", "Join this group")}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
        {t("参加した情報はこの端末のブラウザに保存されます。参加すると", "Your membership is saved in this browser. By joining, you agree to the")}
        <Link href="/terms#groups" target="_blank" rel="noopener noreferrer" className="mx-0.5 font-semibold text-emerald-700 underline underline-offset-2">
          {t("グループ共有の利用規約", "group sharing terms")}
        </Link>
        {t("に同意したものとみなします。", ".")}
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
  const t = useT();

  const create = async () => {
    if (!groupName.trim() || !name.trim()) {
      setError(t("グループ名と表示名を入力してください", "Please enter a group name and your display name"));
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
      if (!res.ok || !data.group || !data.member || !data.memberKey) throw new Error(data.error ?? t("作れませんでした", "Couldn't create the group"));
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
      setError(e instanceof Error ? e.message : t("作れませんでした", "Couldn't create the group"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={t("グループを作る", "Create a group")} onClose={onClose}>
      <p className="text-sm text-slate-500">{format(t("「{appTitle}」を、招待したメンバーとデータを共有しながら使えます。", "Use “{appTitle}” together, sharing data with the members you invite."), { appTitle })}</p>
      <label htmlFor="group-create-name" className="mt-4 block text-sm font-bold text-slate-800">
        {t("グループ名", "Group name")}
      </label>
      <input
        id="group-create-name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        maxLength={40}
        autoFocus
        placeholder={t("例：テニスサークル 2026", "e.g. Tennis club 2026")}
        className={INPUT}
      />
      <label htmlFor="group-create-me" className="mt-3 block text-sm font-bold text-slate-800">
        {t("あなたの表示名", "Your display name")}
      </label>
      <input id="group-create-me" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={t("例：部長", "e.g. Captain")} className={INPUT} />
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      <button type="button" onClick={() => void create()} disabled={busy} className={cn(PRIMARY, "mt-4")}>
        {busy ? t("作っています…", "Creating…") : t("グループを作って招待リンクを出す", "Create the group and get an invite link")}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
        {t("作った人は、招待リンクの作り直しやグループの削除ができます。作成すると", "The creator can make new invite links or delete the group. By creating one, you agree to the")}
        <Link href="/terms#groups" target="_blank" rel="noopener noreferrer" className="mx-0.5 font-semibold text-emerald-700 underline underline-offset-2">
          {t("グループ共有の利用規約", "group sharing terms")}
        </Link>
        {t("に同意したものとみなします。", ".")}
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
  const t = useT();
  return (
    <ModalShell title={t("メンバーを招待", "Invite members")} onClose={onClose}>
      <p className="text-sm text-slate-500">{format(t("このリンクを送ると、表示名を入れるだけで「{groupName}」に参加できます。", "Anyone you send this link to can join “{groupName}” just by entering a display name."), { groupName: group.groupName })}</p>
      <InviteLinkSection appId={appId} appTitle={appTitle} group={group} />
    </ModalShell>
  );
}

function InviteLinkSection({ appId, appTitle, group }: { appId: string; appTitle: string; group: GroupSession }) {
  const [copied, setCopied] = useState(false);
  const t = useT();
  const locale = useLocale();
  const url = inviteUrl(appId, group.inviteToken ?? "");
  const message = format(t("「{groupName}」で「{appTitle}」を使おう。このリンクから参加できます（登録不要）\n", "Let's use “{appTitle}” together in “{groupName}”. Join with this link (no sign-up needed)\n"), { groupName: group.groupName, appTitle });

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
    <>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-slate-600 outline-none" />
        <button type="button" onClick={() => void copy()} className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t("コピー済み", "Copied") : t("コピー", "Copy")}
        </button>
      </div>
      <a
        href={
          locale === "en"
            ? `https://wa.me/?text=${encodeURIComponent(message + url)}`
            : `https://line.me/R/msg/text/?${encodeURIComponent(message + url)}`
        }
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-95",
          locale === "en" ? "bg-[#25D366]" : "bg-[#06C755]"
        )}
      >
        {t("LINEで送る", "Send on WhatsApp")}
      </a>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        {t("リンクを知っている人は誰でも参加できます。グループ外に漏れたときは、作った人が「招待リンクを作り直す」で古いリンクを使えなくできます。", "Anyone with the link can join. If it leaks outside the group, the creator can make a new invite link so the old one stops working.")}
      </p>
    </>
  );
}
