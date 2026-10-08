/**
 * ジサップの中で見たページを、タブごとに覚えておく（sessionStorage）。
 * Google でログインすると、ブラウザの履歴に Google の画面が残り、「戻る」でそこへ戻ってしまう。
 * そのため「戻る」ボタンは、ひとつ前がログイン画面なら、ログインする前に見ていたページへ移る。
 */
const KEY = "jisapp_nav_stack";
const MAX = 30;

/** ログイン・パスワード再設定の画面（戻り先にしない） */
const AUTH_PATH = /^(\/(ja|en|vi))?\/(login|forgot-password|reset-password)(\/|$|\?)/;

function read(): string[] {
  try {
    const list = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** 表示したページを記録する（同じページが続くときは 1 回だけ） */
export function recordNavigation(path: string) {
  const list = read();
  if (list[list.length - 1] === path) return;
  list.push(path);
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* noop */
  }
}

function pathOnly(path: string) {
  return path.split(/[?#]/)[0];
}

/**
 * ひとつ前がログイン画面のときだけ、ログインする前に見ていたページを返す（言語つきのパス）。
 * それ以外は null（ふつうにブラウザの履歴で戻ってよい）。
 */
export function backTargetSkippingLogin(): string | null {
  const list = read();
  if (list.length < 2) return null;
  const current = list[list.length - 1];
  if (!AUTH_PATH.test(list[list.length - 2])) return null;
  for (let i = list.length - 3; i >= 0; i--) {
    const p = list[i];
    if (AUTH_PATH.test(p) || pathOnly(p) === pathOnly(current)) continue;
    return p;
  }
  return "/";
}
