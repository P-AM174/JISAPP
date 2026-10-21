/**
 * グループ共有（ブラウザ側）。
 * 参加したグループの鍵は、この端末のブラウザに保存する（メンバーはログイン不要のため）。
 */

import { localeFromPath, localizePath } from "@/lib/i18n/config";

export type GroupSession = {
  groupId: string;
  groupName: string;
  appId: string;
  memberId: string;
  memberKey: string;
  displayName: string;
  isOwner: boolean;
  /** 招待リンク用（参加したリンク、または作った人が受け取ったもの） */
  inviteToken?: string;
};

const sessionKey = (groupId: string) => `jisapp_group:${groupId}`;
const activeKey = (appId: string) => `jisapp_active_group:${appId}`;

export function readGroupSession(groupId: string): GroupSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(groupId));
    return raw ? (JSON.parse(raw) as GroupSession) : null;
  } catch {
    return null;
  }
}

export function saveGroupSession(session: GroupSession) {
  try {
    localStorage.setItem(sessionKey(session.groupId), JSON.stringify(session));
    localStorage.setItem(activeKey(session.appId), session.groupId);
  } catch {
    /* noop */
  }
}

/** このアプリで今使っているグループ */
export function readActiveGroup(appId: string): GroupSession | null {
  try {
    const groupId = localStorage.getItem(activeKey(appId));
    if (!groupId) return null;
    const session = readGroupSession(groupId);
    return session && session.appId === appId ? session : null;
  } catch {
    return null;
  }
}

/** この端末で、このアプリについて参加したことのあるグループ（「参加していたグループに戻る」用） */
export function listLocalSessions(appId: string): GroupSession[] {
  const result: GroupSession[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("jisapp_group:")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw) as GroupSession;
      if (session && session.appId === appId && session.memberKey) result.push(session);
    }
  } catch {
    /* noop */
  }
  return result;
}

/** グループを抜ける（この端末から外す）。forget=true なら鍵も消す */
export function leaveActiveGroup(appId: string, forget = false) {
  try {
    const groupId = localStorage.getItem(activeKey(appId));
    localStorage.removeItem(activeKey(appId));
    if (forget && groupId) localStorage.removeItem(sessionKey(groupId));
  } catch {
    /* noop */
  }
}

/** 招待リンク。英語ページで出したときは英語ページ（/en/apps/...）のリンクにする */
export function inviteUrl(appId: string, inviteToken: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://jisapp.app";
  const locale = typeof window !== "undefined" ? localeFromPath(window.location.pathname) : null;
  return `${origin}${localizePath(`/apps/${appId}`, locale ?? "ja")}?g=${encodeURIComponent(inviteToken)}`;
}

/** コードがグループ共有（Jisapp.shared／旧名 Zisup.shared）を使っているか */
export function usesSharedData(code: string): boolean {
  // window.Jisapp.shared.add(...) のほか、const shared = Jisapp.shared; や J.shared.list(...) のような書き方も見つける
  return /(?:Jisapp|Zisup)\s*\.\s*shared\b|\.shared\s*\.\s*(?:add|list|remove|save|load|onChange)\s*\(/.test(code);
}
