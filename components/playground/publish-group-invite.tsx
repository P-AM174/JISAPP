"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Link2, LogIn, Users } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import Link from "@/lib/i18n/navigation";
import { inviteUrl, readActiveGroup, saveGroupSession, type GroupSession } from "@/lib/groups/client";
import { ShareActions } from "@/components/engagement/share-actions";
import { engagement } from "@/lib/analytics/engagement";

/**
 * グループで使うアプリを公開した直後の「招待」。
 * この画面のままグループを作り、グループの招待リンク（アプリの URL ＋ ?g=）を LINE などで送れるようにする。
 * アプリそのものの URL を送ると、受け取った人はグループに入らずに使い始めてしまうため、ここでは招待リンクだけを出す。
 * グループを作れるのはログインした人だけ（/api/app-groups）。ゲストにはログインを案内する
 */
export function PublishGroupInvite({ appId, title, isGuest, onLogin }: { appId: string; title: string; isGuest: boolean; onLogin: () => void }) {
  const t = useT();
  const { data: session } = useSession();
  const [group, setGroup] = useState<GroupSession | null>(null);
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 上書き公開などで、この端末にもう作ったグループがあれば、その招待リンクをそのまま出す
  useEffect(() => {
    const active = readActiveGroup(appId);
    if (active?.isOwner && active.inviteToken) setGroup(active);
  }, [appId]);

  useEffect(() => {
    if (!displayName && session?.user?.name) setDisplayName(session.user.name.slice(0, 20));
  }, [session, displayName]);

  const create = async () => {
    if (!groupName.trim() || !displayName.trim()) {
      setError(t("グループ名と表示名を入力してください", "Please enter a group name and your display name"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/app-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, name: groupName, displayName }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        group?: { id: string; name: string };
        inviteToken?: string;
        member?: { id: string; name: string };
        memberKey?: string;
        error?: string;
      };
      if (!res.ok || !data.group || !data.member || !data.memberKey) throw new Error(data.error ?? t("作れませんでした", "Couldn't create the group"));
      const created: GroupSession = {
        groupId: data.group.id,
        groupName: data.group.name,
        appId,
        memberId: data.member.id,
        memberKey: data.memberKey,
        displayName: data.member.name,
        isOwner: true,
        inviteToken: data.inviteToken,
      };
      // この端末では、アプリを開いたらそのままこのグループで使えるようにする
      saveGroupSession(created);
      setGroup(created);
      engagement("group_created", appId, { surface: "publish" });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("作れませんでした", "Couldn't create the group"));
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600"><Users className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-base font-black text-slate-900">{group ? t("メンバーを招待しよう", "Invite your members") : t("グループを作って、メンバーを招待しよう", "Create a group and invite members")}</p>
          <p className="text-xs text-slate-500">
            {group
              ? t(`「${group.groupName}」の招待リンクを送ると、名前を入れるだけで参加できます`, `Anyone you send the “${group.groupName}” invite link to can join by entering a name`)
              : t("招待した人どうしで、同じデータを見ながら使えます", "Members you invite see and edit the same data")}
          </p>
        </div>
      </div>

      {group ? (
        <>
          <ShareActions appId={appId} url={inviteUrl(appId, group.inviteToken ?? "")} title={title} kind="group_invite" />
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("招待リンクを知っている人が参加できます。送る相手を確認してください。", "Anyone with the invitation link can join. Choose who you send it to.")}
          </p>
        </>
      ) : isGuest ? (
        <>
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            {t("グループを作るには、ログインが必要です（参加するメンバーはログインなしで使えます）。", "You need to sign in to create a group (members can join without signing in).")}
          </p>
          <button type="button" onClick={onLogin} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700">
            <LogIn className="h-4 w-4" />
            {t("Googleでログインしてグループを作る", "Sign in with Google to create a group")}
          </button>
        </>
      ) : (
        <>
          <div className="grid gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">{t("グループ名", "Group name")}</span>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={40} placeholder={t("例：テニスサークル 2026", "e.g. Tennis club 2026")} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">{t("あなたの表示名", "Your display name")}</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={20} placeholder={t("例：部長", "e.g. Captain")} className={input} />
            </label>
          </div>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button type="button" disabled={busy} onClick={() => void create()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
            <Users className="h-4 w-4" />
            {busy ? t("作っています…", "Creating…") : t("グループを作って招待リンクを出す", "Create the group and get an invite link")}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            {t("作成すると", "By creating one, you agree to the")}
            <Link href="/terms#groups" target="_blank" rel="noopener noreferrer" className="mx-0.5 font-semibold text-emerald-700 underline underline-offset-2">
              {t("グループ共有の利用規約", "group sharing terms")}
            </Link>
            {t("に同意したものとみなします。", ".")}
          </p>
        </>
      )}
    </section>
  );
}
