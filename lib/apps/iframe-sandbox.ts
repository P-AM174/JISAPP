/**
 * ユーザーアプリ iframe 用 sandbox。
 *
 * allow-same-origin は付けない。付けると、アプリのコードがジサップ本体と同じ権限で動き、
 * ジサップのデータ（グループの鍵など）を読んだり、見ている人のログイン状態でAPIを呼べたりしてしまう。
 * アプリの保存は window.Zisup と、画面側が用意する localStorage の代わりで行う。
 */
export const APP_IFRAME_SANDBOX = "allow-scripts allow-forms allow-modals";
