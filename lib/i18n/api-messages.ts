/**
 * サーバー（/api）が返す日本語のメッセージを英語・ベトナム語にする辞書。
 * API は日本語で返し、英語・ベトナム語ページで表示するときだけここで置き換える（辞書にない文はそのまま出る）。
 * サーバーのメッセージを増やしたら、ここにも英語を足す（ベトナム語は vi.json。scripts/i18n-extract.mjs で洗い出せる）。
 */
import type { Dictionary, Locale } from "./config";
import { APP_DATA_LIMIT_MESSAGES, APP_DATA_WARNINGS, GROUP_QUOTA_MESSAGE } from "@/lib/app-data-limits";

const EXACT: Record<string, string> = {
  ログインが必要です: "Please sign in",
  AI審査機能が設定されていません: "AI review isn't set up",
  コードが必要です: "Code is required",
  AI審査に失敗しました: "AI review failed",
  審査結果を解析できませんでした: "Couldn't read the review result",
  サーバーエラー: "Server error",
  サーバーエラーが発生しました: "A server error occurred",
  "key と appId が必要です": "key and appId are required",
  不正なリクエストです: "Invalid request",
  マイライブラリに追加されたアプリのみ同期できます: "Only apps in your library can sync",
  "グループが見つかりません。削除された可能性があります": "Group not found. It may have been deleted",
  "このグループのメンバーではありません。招待リンクから参加し直してください":
    "You're not a member of this group. Join again from the invite link",
  "このグループのメンバーではありません。招待リンクから参加してください":
    "You're not a member of this group. Join from the invite link",
  "書き込みが多すぎます。少し待ってからもう一度試してください": "Too many writes. Wait a moment and try again",
  キー名は英数字で64文字以内にしてください: "Key names must be letters and numbers, 64 characters max",
  データが大きすぎます: "The data is too large",
  保存できませんでした: "Couldn't save",
  "これ以上追加できません（上限に達しました）": "Can't add more (limit reached)",
  "追加が多すぎます。1分ほど待ってからもう一度試してください": "Too many additions. Wait about a minute and try again",
  "このグループのデータがいっぱいです。不要な項目を消してください": "This group's data is full. Delete items you don't need",
  追加できませんでした: "Couldn't add",
  削除する項目が指定されていません: "No item to delete was specified",
  他の人の項目は消せません: "You can't delete other people's items",
  削除できませんでした: "Couldn't delete",
  不明な操作です: "Unknown operation",
  退出したメンバー: "Former member",
  外すメンバーが指定されていません: "No member to remove was specified",
  メンバーが見つかりません: "Member not found",
  グループを作った人は外せません: "The group creator can't be removed",
  外せませんでした: "Couldn't remove them",
  グループが見つかりません: "Group not found",
  グループを作った人だけが操作できます: "Only the group creator can do this",
  作り直せませんでした: "Couldn't make a new link",
  "招待リンクが無効です。管理者に新しいリンクをもらってください": "This invite link isn't valid. Ask the organizer for a new one",
  表示名を入力してください: "Please enter a display name",
  グループを作るにはログインが必要です: "Sign in to create a group",
  グループ名と表示名を入力してください: "Please enter a group name and display name",
  アプリが見つかりません: "App not found",
  グループを作れませんでした: "Couldn't create the group",
  "appId が必要です": "appId is required",
  このアプリのソースコードは公開されていません: "This app's source code isn't public",
  マイライブラリに追加するとソースコードを閲覧できます: "Add it to your library to see the source code",
  権限がありません: "You don't have permission",
  報告理由を選択してください: "Please choose a reason",
  詳細は5文字以上で入力してください: "Please write at least 5 characters of detail",
  詳細は2000文字以内で入力してください: "Details must be 2,000 characters or fewer",
  メッセージが空です: "The message is empty",
  "タイトルは1〜100文字で入力してください": "The title must be 1–100 characters",
  更新内容がありません: "Nothing to update",
  このアプリを編集する権限がありません: "You don't have permission to edit this app",
  削除に失敗しました: "Couldn't delete",
  このアプリは運営により削除されました: "This app was removed by the Jisapp team",
  不正なstampId: "Invalid stampId",
  "コードサイズが大きすぎます（最大512KB）": "The code is too large (512 KB max)",
  HTMLコードは必須です: "HTML code is required",
  上書き公開にはログインが必要です: "Sign in to update a published app",
  このアプリを上書きする権限がありません: "You don't have permission to update this app",
  更新内容は200文字以内で入力してください: "What's new must be 200 characters or fewer",
  メールアドレスを入力してください: "Please enter your email address",
  "メール送信に失敗しました。再度お試しください。": "Couldn't send the email. Please try again.",
  "このエンドポイントは無効化されています。メール認証をご利用ください。": "This endpoint is disabled. Please use email verification.",
  必須項目が不足しています: "Some required fields are missing",
  パスワードは6文字以上にしてください: "Your password needs at least 6 characters",
  "リンクが無効または期限切れです。再度パスワードリセットを行ってください。":
    "This link is invalid or has expired. Please request a password reset again.",
  このメールアドレスはすでに登録されています: "This email address is already registered",
  "認証コードが正しくないか、有効期限が切れています。": "The code is incorrect or has expired.",
  クリエイターが見つかりません: "Creator not found",
  マイライブラリに登録されていません: "It isn't in your library",
  アプリの取り下げに失敗しました: "Couldn't unlist the app",
  プロジェクトが見つかりません: "Project not found",
  タイトルが必要です: "A title is required",
  更新に失敗しました: "Couldn't update",
  通知IDが指定されていません: "No notification ID was specified",
  商品が見つかりません: "Item not found",
  この商品は現在取得できません: "This item isn't available right now",
  このアプリを実行する権限がありません: "You don't have permission to run this app",
  実行可能なコードが登録されていません: "There's no runnable code",
  データベースが設定されていません: "The database isn't set up",
  タイトルは必須です: "A title is required",
  リクエストが見つかりません: "Request not found",
  "メッセージは1〜200文字で入力してください": "The message must be 1–200 characters",
  "アプリURLは http:// または https:// から入力してください": "The app URL must start with http:// or https://",
  "タイトルは1〜80文字で入力してください": "The title must be 1–80 characters",
  "内容は1〜500文字で入力してください": "The details must be 1–500 characters",
  カテゴリが不正です: "Invalid category",
  APIキーの値が長すぎます: "The API key is too long",
  "attach_type が不正です": "Invalid attach_type",
  URLパラメータ名を入力してください: "Please enter the URL parameter name",
  APIキーの値を入力してください: "Please enter the API key",
  シークレットが見つかりません: "Secret not found",
  有効なメールアドレスを入力してください: "Please enter a valid email address",
  "件名は1〜100文字で入力してください": "The subject must be 1–100 characters",
  "内容は1〜2000文字で入力してください": "The message must be 1–2,000 characters",
  送信に失敗しました: "Couldn't send",
  URLが必要です: "A URL is required",
  "secret 利用時は appId が必要です": "appId is required when using a secret",
  外部APIへの接続に失敗しました: "Couldn't connect to the external API",
  タイムアウト: "Timed out",
  "外部APIの応答がタイムアウトしました。AIの処理に時間がかかっている可能性があります。":
    "The external API timed out. The AI may be taking a long time to respond.",
  "外部APIの応答がタイムアウトしました。AIの処理に時間がかかっている可能性があります。しばらく待ってから再試行してください。":
    "The external API timed out. The AI may be taking a long time to respond. Wait a bit and try again.",
  このアプリを削除する権限がありません: "You don't have permission to delete this app",
  メンバーを登録できませんでした: "Couldn't add the member",
  保留中のアップデートがありません: "There's no pending update",
  "出品者がコードを更新しました。アップデートすると保存データが消える可能性があります。":
    "The creator updated the code. Updating may erase your saved data.",
  "出品者がコードを更新しました。アップデートするか選択できます。": "The creator updated the code. You can choose whether to update.",
  "名前は大文字英字で始まり、大文字・数字・アンダースコアのみ（32文字以内）":
    "Names start with an uppercase letter and use only uppercase letters, numbers and underscores (32 max)",
  URLが不正です: "Invalid URL",
  "https の URL のみ利用できます": "Only https URLs can be used",
  "この URL には接続できません": "This URL can't be reached",
  "許可されていない HTTP メソッドです": "This HTTP method isn't allowed",
  リクエストボディが大きすぎます: "The request body is too large",
  レスポンスが大きすぎます: "The response is too large",
  "（削除済みアプリ）": "(deleted app)",
  無題のアプリ: "Untitled app",
  下書きアプリ: "Draft app",
  ゲスト: "Guest",
  匿名: "Anonymous",
  // アプリの保存データの上限（lib/app-data-limits.ts）
  [APP_DATA_LIMIT_MESSAGES.too_large]:
    "This app's data is over the amount that can be saved at once (2MB). Ask the app's creator to split the data, for example by year",
  [APP_DATA_LIMIT_MESSAGES.media_not_allowed]: "Images and videos can't be saved (only text data can be saved)",
  [APP_DATA_LIMIT_MESSAGES.quota_exceeded]: "Your storage (10MB across all apps) is full. Delete data you no longer need",
  [APP_DATA_LIMIT_MESSAGES.reserved_key]: "Names starting with __ can't be used for saving",
  [APP_DATA_LIMIT_MESSAGES.bad_data]: "The data to save isn't in a valid format",
  [APP_DATA_WARNINGS.value]:
    "This app's data is almost at the amount that can be saved at once (2MB). It's safer to ask the app's creator to split the data, for example by year",
  [APP_DATA_WARNINGS.user]: "Your saved data is almost at the limit (10MB across all apps)",
  [APP_DATA_WARNINGS.group]: "This group's shared data is almost at the limit (10MB). It's safer to delete items you no longer need",
  [GROUP_QUOTA_MESSAGE]: "This group's shared data storage (10MB) is full. Delete items you no longer need",
  保存データを読み込めませんでした: "Couldn't load the saved data",
  不正なデータです: "Invalid data",
  "この端末に保存できませんでした。ブラウザの保存領域がいっぱいの可能性があります":
    "Couldn't save on this device. The browser's storage may be full",
  保存容量がもうすぐいっぱいです: "Your storage is almost full",
  保存容量がいっぱいです: "Your storage is full",
  ライブラリに入っているアプリだけピン留めできます: "Only apps in your library can be pinned",
  ピン留めを保存できませんでした: "Couldn't save the pin",
  保存データを消せませんでした: "Couldn't delete the saved data",
  "運営がアプリのコードを修正しました。マイプロジェクトのコードも同じ内容になっています。":
    "Jisapp fixed your app's code. The code in My projects has been updated to match.",
  運営がコードを修正しました: "Jisapp fixed the code",
  フォローを保存できませんでした: "Couldn't save the follow",
  新しくフォローされました: "You have a new follower",
};

const STAMP_EN: Record<string, string> = {
  "いいね！": "Love it!",
  "天才！": "Genius!",
  "便利！": "So useful!",
  "デザインが好き！": "Great design!",
};

/**
 * 一部だけ変わる文（アプリ名などが入る）。{1} {2} に正規表現の () の中身が入る。
 * ja はベトナム語の辞書を引くためのキー（辞書には {1} のまま訳を入れる）。
 * stamp に書いた番号は、スタンプ名なので訳してから入れる。
 */
type Pattern = { re: RegExp; ja: string; en: string; stamp?: number[] };

const PATTERNS: Pattern[] = [
  {
    re: /^まったく同じコードのアプリ「(.+)」をすでに公開しています。/,
    ja: "まったく同じコードのアプリ「{1}」をすでに公開しています。",
    en: "You've already published an app with exactly the same code: “{1}”. You can't publish the same app twice. To change it, update that app from My projects.",
  },
  { re: /^上書きに失敗しました: ([\s\S]*)$/, ja: "上書きに失敗しました: {1}", en: "Couldn't update: {1}" },
  { re: /^保存に失敗しました: ([\s\S]*)$/, ja: "保存に失敗しました: {1}", en: "Couldn't save: {1}" },
  { re: /^アプリの準備に失敗しました: ([\s\S]*)$/, ja: "アプリの準備に失敗しました: {1}", en: "Couldn't prepare the app: {1}" },
  // お知らせ（DB には日本語で保存されている）
  { re: /^「([\s\S]+)」に返信がありました$/, ja: "「{1}」に返信がありました", en: "New reply to “{1}”" },
  { re: /^([\s\S]+) さんが「作ってみました」と報告しました$/, ja: "{1} さんが「作ってみました」と報告しました", en: "{1} says they made it" },
  { re: /^「([\s\S]+)」のコードが更新されました$/, ja: "「{1}」のコードが更新されました", en: "“{1}” was updated" },
  { re: /^「([\s\S]+)」のコードを運営が修正しました$/, ja: "「{1}」のコードを運営が修正しました", en: "Jisapp fixed the code of “{1}”" },
  // フォローのお知らせ（lib/notifications/follow-notices.ts）
  { re: /^新しく(\d+)人にフォローされました$/, ja: "新しく{1}人にフォローされました", en: "{1} new followers" },
  { re: /^([\s\S]+) さんがあなたをフォローしました。$/, ja: "{1} さんがあなたをフォローしました。", en: "{1} followed you." },
  { re: /^最新は ([\s\S]+) さんです。$/, ja: "最新は {1} さんです。", en: "Latest: {1}." },
  // スタンプのお知らせ（lib/notifications/stamp-notices.ts）
  { re: /^「([\s\S]+)」にスタンプが届きました$/, ja: "「{1}」にスタンプが届きました", en: "“{1}” got a stamp" },
  { re: /^「([\s\S]+)」にスタンプが(\d+)件届きました$/, ja: "「{1}」にスタンプが{2}件届きました", en: "“{1}” got {2} stamps" },
  { re: /^([\s\S]+) さんが「([\s\S]+)」を押しました。$/, ja: "{1} さんが「{2}」を押しました。", en: "{1} sent “{2}”.", stamp: [2] },
  { re: /^最新は ([\s\S]+) さんの「([\s\S]+)」です。$/, ja: "最新は {1} さんの「{2}」です。", en: "Latest: “{2}” from {1}.", stamp: [2] },
  // 保存容量のお知らせ（lib/notifications/storage-notices.ts）
  { re: /^「([\s\S]+)」の共有データがもうすぐいっぱいです$/, ja: "「{1}」の共有データがもうすぐいっぱいです", en: "“{1}” shared data is almost full" },
  { re: /^「([\s\S]+)」の共有データがいっぱいです$/, ja: "「{1}」の共有データがいっぱいです", en: "“{1}” shared data is full" },
  {
    re: /^アプリに保存しているデータが (\S+) \/ (\S+) になりました。/,
    ja: "アプリに保存しているデータが {1} / {2} になりました。",
    en: "Your saved app data is now {1} / {2}. Once it's full, nothing new can be saved. It's safer to delete data from apps you no longer use.",
  },
  {
    re: /^アプリに保存できるデータ（全アプリで (\S+)）がいっぱいになったため、/,
    ja: "アプリに保存できるデータ（全アプリで {1}）がいっぱいになったため、",
    en: "Your app data storage ({1} across all apps) is full, so it couldn't be saved. Delete data from apps you no longer use to save again.",
  },
  {
    re: /^グループの共有データが (\S+) \/ (\S+) になりました。/,
    ja: "グループの共有データが {1} / {2} になりました。",
    en: "The group's shared data is now {1} / {2}. Once it's full, members can't add anything new. It's safer to delete items you no longer need.",
  },
  {
    re: /^グループの共有データ（(\S+)）がいっぱいになったため、/,
    ja: "グループの共有データ（{1}）がいっぱいになったため、",
    en: "The group's shared data ({1}) is full, so members' writes were refused. Delete items you no longer need to write again.",
  },
];

/** 翻訳の洗い出し用（scripts/i18n-extract.mjs）。日本語と英語の組をすべて返す */
export function apiMessagePairs(): [string, string][] {
  return [
    ...Object.entries(EXACT),
    ...Object.entries(STAMP_EN),
    ...PATTERNS.map((p): [string, string] => [p.ja, p.en]),
  ];
}

type Target = { locale: Locale; dict?: Dictionary | null };

function word(ja: string, en: string, target: Target): string {
  if (target.locale === "vi") return target.dict?.[ja] ?? en;
  return en;
}

export function translateApiMessage(message: string, target: Target = { locale: "en" }): string {
  const exact = EXACT[message];
  if (exact) return word(message, exact, target);
  for (const p of PATTERNS) {
    const m = message.match(p.re);
    if (!m) continue;
    const template = word(p.ja, p.en, target);
    return template.replace(/\{(\d)\}/g, (_, n: string) => {
      const i = Number(n);
      const value = m[i] ?? "";
      if (p.stamp?.includes(i)) return word(value, STAMP_EN[value] ?? value, target);
      return value;
    });
  }
  return message;
}

const MESSAGE_FIELDS = ["error", "message", "reason"] as const;

/** JSON の error / message / reason だけを訳す。変えるものがなければ null */
export function translateApiJson(text: string, target: Target = { locale: "en" }): string | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;
  let changed = false;
  const translateFields = (target_: Record<string, unknown>, keys: readonly string[]) => {
    for (const key of keys) {
      const value = target_[key];
      if (typeof value === "string") {
        const next = translateApiMessage(value, target);
        if (next !== value) {
          target_[key] = next;
          changed = true;
        }
      }
    }
  };
  translateFields(obj, MESSAGE_FIELDS);
  // お知らせ一覧の題名・本文
  if (Array.isArray(obj.notifications)) {
    for (const n of obj.notifications) {
      if (n && typeof n === "object") translateFields(n as Record<string, unknown>, ["title", "body"]);
    }
  }
  return changed ? JSON.stringify(obj) : null;
}

let installed = false;

/**
 * 英語・ベトナム語ページで、/api から返ってきたエラー文を訳して受け取る。
 * 画面ごとにエラーの出し方が違うため、fetch の入口で一度だけ置き換える。
 */
export function installApiMessageTranslation(target: Target) {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await originalFetch(input, init);
    try {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return res;
      if (url.pathname.startsWith("/api/auth/session") || url.pathname.startsWith("/api/auth/csrf")) return res;
      if (!(res.headers.get("content-type") ?? "").includes("application/json")) return res;
      const translated = translateApiJson(await res.clone().text(), target);
      if (translated === null) return res;
      return new Response(translated, { status: res.status, statusText: res.statusText, headers: res.headers });
    } catch {
      return res;
    }
  };
}
