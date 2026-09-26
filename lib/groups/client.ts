/**
 * グループ共有（ブラウザ側）。
 * 参加したグループの鍵は、この端末のブラウザに保存する（メンバーはログイン不要のため）。
 */

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

export function inviteUrl(appId: string, inviteToken: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://jisapp.app";
  return `${origin}/apps/${appId}?g=${encodeURIComponent(inviteToken)}`;
}

/** コードがグループ共有（Zisup.shared）を使っているか */
export function usesSharedData(code: string): boolean {
  return /Zisup\s*\.\s*shared\s*\./.test(code);
}
