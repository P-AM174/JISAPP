import { pick, type Locale } from "@/lib/i18n/config";

/*
 * AI に渡す指示文。日本語版・英語版・ベトナム語版（英語の指示文＋画面はベトナム語）がある。
 * 英語で使っている人には英語の指示文を渡し、画面の文字も英語のアプリを作ってもらう。
 * アプリ内APIの正式名は window.Jisapp（旧名 window.Zisup も動く）。
 */

/** テンプレート内のアプリ名プレースホルダー */
export const PROMPT_APP_NAME_PLACEHOLDER = "【ここに作りたいアプリ名を入れる】";
export const PROMPT_APP_NAME_PLACEHOLDER_EN = "[PUT THE APP YOU WANT TO MAKE HERE]";

export const PROMPT_STORAGE_MARKER = "【データ保存】";

/**
 * CDN 禁止のルールの例外：デザインの指定（表情を出す書体）で使う Google Fonts だけは読み込んでよい。
 * ベトナム語版では声調記号が崩れないように Web フォントを使わないので、ベトナム語のプロンプトからは消す
 */
const GOOGLE_FONTS_OK_JA = "ただし、デザインの指定で使う Google Fonts（fonts.googleapis.com）を <link> で読み込むことだけは例外として使ってよい（読み込めなくても崩れないよう、後ろに本文の書体を続けて書く）。";
const GOOGLE_FONTS_OK_EN = " The only exception: loading Google Fonts (fonts.googleapis.com) with a <link> tag, as the design spec asks, is allowed (always list the body font after it so nothing breaks if it doesn't load).";

/**
 * 写真・動画・PDF などのファイル。ジサップには文字のデータしか保存できないので、
 * 使う人の Google ドライブに保存し、ファイルの情報（文字）だけをアプリのデータとして残す（window.Jisapp.drive）
 */
const PROMPT_DRIVE_FILES = `・写真・動画・PDF などのファイルを残したいときは、window.Jisapp.drive を使う。使う人の Google ドライブに保存される（ファイルを選ぶ画面・Google の許可・保存は、ジサップの画面が行う）。
  ・保存（ボタンを押したときに呼ぶ）: const files = await window.Jisapp.drive.upload({ accept: 'image' })
    accept は 'image'（写真）・'video'（動画）・'pdf'・'any'（なんでも）。何枚も選べるようにするときは multiple: true を足す
    戻り値: [{ id, name, kind, mimeType, size, url, thumbnail }] の配列（kind は 'image'・'video'・'pdf'・'file'。やめたときは空の配列）
  ・戻り値は文字のデータなので、ほかのデータと同じように保存する（ファイルの中身は保存しない）
  ・表示: img.src = file.thumbnail（写真はこれで画面に出る。動画・PDF は表紙の画像が出る。大きさを変えるときは window.Jisapp.drive.thumbnail(file, 横の大きさ)）
  ・開く: await window.Jisapp.drive.open(file)（ジサップがアプリの上に大きく見せる。動画の再生と PDF の表示は、アプリの中ではできないので、必ずこれを使う）
  ・表紙の画像が出ないとき（保存した直後の動画など）は、img の onerror で種類のアイコンとファイル名を出す
  ・<input type="file"> や FileReader で読んだファイルの中身（data: URL など）は、保存も共有もしない（できない）`;

const PROMPT_DRIVE_FILES_EN = `- To keep files such as photos, videos or PDFs, use window.Jisapp.drive. They are saved to the user's own Google Drive (Jisapp's own screens handle choosing files, Google's permission and saving).
  - Save (call it when a button is pressed): const files = await window.Jisapp.drive.upload({ accept: 'image' })
    accept is 'image' (photos), 'video', 'pdf' or 'any'. Add multiple: true to let people choose several
    Returns: an array of { id, name, kind, mimeType, size, url, thumbnail } (kind is 'image', 'video', 'pdf' or 'file'; an empty array if they cancel)
  - The returned values are text, so save them like any other data (never save the file contents)
  - Show: img.src = file.thumbnail (this shows photos; videos and PDFs show a cover image. For another size, use window.Jisapp.drive.thumbnail(file, width))
  - Open: await window.Jisapp.drive.open(file) (Jisapp shows it large on top of the app. Videos can't play and PDFs can't be shown inside the app, so always use this)
  - If the cover image doesn't load (for example, a video right after saving), show a type icon and the file name in the img onerror
  - Never save or share file contents read with <input type="file"> or FileReader (such as data: URLs); it won't work`;

/** 端末をまたいで残す（ジサップの保存機能） */
export const PROMPT_STORAGE_ZISUP = `【データ保存（ジサップの保存機能を使う）】
・入力した内容・記録は、次回開いても残るようにする。
・保存と読み込みは window.Jisapp.saveData / window.Jisapp.loadData だけを使う。localStorage は使わない。
  ・保存: await window.Jisapp.saveData('識別名', データ)
  ・読込: await window.Jisapp.loadData('識別名')
・識別名は英数字で、アプリ内で一度決めたら変えない。
・画面を出す前に、必ず await で読み込みを完了させる。
・ログインしていると別の端末でも同じデータが読める。
・保存できるのは文字のデータだけ。画像・動画・音声そのものは保存できない（画面に表示するだけならよい）。
${PROMPT_DRIVE_FILES}
・1つの識別名に保存できるのは1MBまで。日記や記録のように増え続けるデータは、年ごとに識別名を分けて保存する（例: diary_2026, diary_2027）。表示するときは必要な年の分だけ読み込む。
・saveData が失敗したとき（容量オーバーなど）は、画面に「保存できませんでした」と表示する。`;

export const PROMPT_STORAGE_ZISUP_EN = `[Saving data (use Jisapp's save feature)]
- Whatever the user enters or records must still be there the next time they open the app.
- Save and load ONLY with window.Jisapp.saveData / window.Jisapp.loadData. Do not use localStorage.
  - Save: await window.Jisapp.saveData('keyName', data)
  - Load: await window.Jisapp.loadData('keyName')
- Key names use letters and numbers only, and never change once chosen.
- Always finish loading with await before showing the screen.
- When the user is signed in, the same data can be read on other devices.
- Only text data can be saved. Images, video and audio themselves cannot be saved (showing them on screen is fine).
${PROMPT_DRIVE_FILES_EN}
- Each key can hold up to 1MB. For data that keeps growing, like a diary or log, use a separate key per year (e.g. diary_2026, diary_2027) and load only the years you need.
- If saveData fails (for example, the storage is full), show "Could not save" on screen.`;

/** 同じ端末のブラウザ内だけ残す */
export const PROMPT_STORAGE_LOCAL = `【データ保存（この端末のブラウザ内だけ）】
・window.Jisapp.saveData / loadData は使わない。
・残したいデータは localStorage を使う。
  ・保存: localStorage.setItem('識別名', JSON.stringify(データ))
  ・読込: JSON.parse(localStorage.getItem('識別名') || 'null')
・識別名は英数字で、アプリ内で一度決めたら変えない。
・同じスマホ・パソコンの同じブラウザでだけ残る。別の端末やブラウザでは引き継がれない。`;

export const PROMPT_STORAGE_LOCAL_EN = `[Saving data (only in this browser on this device)]
- Do not use window.Jisapp.saveData / loadData.
- Keep data with localStorage.
  - Save: localStorage.setItem('keyName', JSON.stringify(data))
  - Load: JSON.parse(localStorage.getItem('keyName') || 'null')
- Key names use letters and numbers only, and never change once chosen.
- Data only stays in the same browser on the same phone or computer. It does not carry over to other devices or browsers.`;

/** グループのメンバー全員で共有する（ジサップのグループ共有機能） */
export const PROMPT_STORAGE_SHARED = `【みんなで共有するデータ（ジサップのグループ共有機能を使う）】
・このアプリは、グループのメンバー全員で同じデータを見たり書き込んだりします。
・メンバーで共有するデータは、必ず window.Jisapp.shared を使う（localStorage や window.Jisapp.saveData は使わない）。
・メンバーが項目を足していくデータ（出欠、書き込み、記録、予定など）は「追加」を使う：
  ・追加: const item = await window.Jisapp.shared.add('キー名', データ)
    戻り値: { id, value, author: { id, name }, createdAt, mine }（mine は自分が追加した項目なら true）
  ・一覧: const items = await window.Jisapp.shared.list('キー名')（古い順の配列）
  ・削除: await window.Jisapp.shared.remove('キー名', item.id)（自分の項目だけ消せる。グループを作った人はすべて消せる）
・全員で1つだけ持つ値（今月の練習日、お知らせ文など）は：
  ・保存: await window.Jisapp.shared.save('キー名', データ)
  ・読込: await window.Jisapp.shared.load('キー名')（まだなければ null）
・一覧を配列ごと save で上書きしない（同時に入力すると誰かの入力が消えるため、項目は必ず add で足す）。
・他のメンバーの更新を画面に反映する: window.Jisapp.shared.onChange('キー名', () => { 一覧を読み直して表示 })
・自分の表示名: const me = await window.Jisapp.me()（{ id, name }）
・項目には「誰が書いたか」（item.author.name）と日時を表示する。削除ボタンは item.mine の項目にだけ出す。
・キー名は英数字（例: attendance, posts）で、アプリ内で一度決めたら変えない。
・共有できるのは文字のデータだけ。画像・動画・音声そのものは保存できない（画面に表示するだけならよい）。
${PROMPT_DRIVE_FILES}
・グループの作成・招待・参加はジサップの画面が行うので、アプリの中には作らない。`;

export const PROMPT_STORAGE_SHARED_EN = `[Data shared with the whole group (use Jisapp's group sharing)]
- Everyone in the group sees and writes the same data in this app.
- Data shared with members must use window.Jisapp.shared (not localStorage or window.Jisapp.saveData).
- For data members keep adding to (attendance, posts, logs, plans, etc.), use "add":
  - Add: const item = await window.Jisapp.shared.add('keyName', data)
    Returns: { id, value, author: { id, name }, createdAt, mine } (mine is true for items you added)
  - List: const items = await window.Jisapp.shared.list('keyName') (array, oldest first)
  - Remove: await window.Jisapp.shared.remove('keyName', item.id) (people can remove their own items; the group creator can remove any)
- For a single value the whole group shares (this month's practice day, a notice, etc.):
  - Save: await window.Jisapp.shared.save('keyName', data)
  - Load: await window.Jisapp.shared.load('keyName') (null if nothing yet)
- Never overwrite a whole list with save (if two people type at once, someone's entry is lost). Always add items with add.
- Show other members' updates: window.Jisapp.shared.onChange('keyName', () => { reload the list and redraw })
- Your display name: const me = await window.Jisapp.me() ({ id, name })
- Show who wrote each item (item.author.name) and when. Only show a delete button on items where item.mine is true.
- Key names use letters and numbers (e.g. attendance, posts) and never change once chosen.
- Only text data can be shared. Images, video and audio themselves cannot be saved (showing them on screen is fine).
${PROMPT_DRIVE_FILES_EN}
- Creating, inviting to and joining groups is handled by Jisapp's own screens, so do not build that into the app.`;

/**
 * ベトナム語版の保存・共有の指示文。2026-10-29 に日本語版・英語版へ Google ドライブのファイル保存（window.Jisapp.drive）を足したとき、
 * ベトナム語版は変えないことにしたので、それまでの英語の文をそのまま持つ
 */
const PROMPT_STORAGE_ZISUP_VI = `[Saving data (use Jisapp's save feature)]
- Whatever the user enters or records must still be there the next time they open the app.
- Save and load ONLY with window.Jisapp.saveData / window.Jisapp.loadData. Do not use localStorage.
  - Save: await window.Jisapp.saveData('keyName', data)
  - Load: await window.Jisapp.loadData('keyName')
- Key names use letters and numbers only, and never change once chosen.
- Always finish loading with await before showing the screen.
- When the user is signed in, the same data can be read on other devices.
- Only text data can be saved. Images, video and audio cannot be saved (showing them on screen is fine; to keep a photo, save only text such as its title or notes).
- Each key can hold up to 1MB. For data that keeps growing, like a diary or log, use a separate key per year (e.g. diary_2026, diary_2027) and load only the years you need.
- If saveData fails (for example, the storage is full), show "Could not save" on screen.`;

const PROMPT_STORAGE_SHARED_VI = `[Data shared with the whole group (use Jisapp's group sharing)]
- Everyone in the group sees and writes the same data in this app.
- Data shared with members must use window.Jisapp.shared (not localStorage or window.Jisapp.saveData).
- For data members keep adding to (attendance, posts, logs, plans, etc.), use "add":
  - Add: const item = await window.Jisapp.shared.add('keyName', data)
    Returns: { id, value, author: { id, name }, createdAt, mine } (mine is true for items you added)
  - List: const items = await window.Jisapp.shared.list('keyName') (array, oldest first)
  - Remove: await window.Jisapp.shared.remove('keyName', item.id) (people can remove their own items; the group creator can remove any)
- For a single value the whole group shares (this month's practice day, a notice, etc.):
  - Save: await window.Jisapp.shared.save('keyName', data)
  - Load: await window.Jisapp.shared.load('keyName') (null if nothing yet)
- Never overwrite a whole list with save (if two people type at once, someone's entry is lost). Always add items with add.
- Show other members' updates: window.Jisapp.shared.onChange('keyName', () => { reload the list and redraw })
- Your display name: const me = await window.Jisapp.me() ({ id, name })
- Show who wrote each item (item.author.name) and when. Only show a delete button on items where item.mine is true.
- Key names use letters and numbers (e.g. attendance, posts) and never change once chosen.
- Only text data can be shared. Images, video and audio cannot be saved (showing them on screen is fine).
- Creating, inviting to and joining groups is handled by Jisapp's own screens, so do not build that into the app.`;

/** 表示言語に合わせた保存の指示文 */
export function getPromptStorage(locale: Locale = "ja") {
  const en = locale !== "ja";
  const vi = locale === "vi";
  return {
    cloud: vi ? PROMPT_STORAGE_ZISUP_VI : en ? PROMPT_STORAGE_ZISUP_EN : PROMPT_STORAGE_ZISUP,
    local: en ? PROMPT_STORAGE_LOCAL_EN : PROMPT_STORAGE_LOCAL,
    shared: vi ? PROMPT_STORAGE_SHARED_VI : en ? PROMPT_STORAGE_SHARED_EN : PROMPT_STORAGE_SHARED,
  };
}

/**
 * 今あるアプリを、グループ共有に対応させるための依頼文。
 * コードを渡すと末尾に付ける（AIに1回貼るだけで済むように）。
 */
export function buildSharedConvertMessage(code?: string, locale: Locale = "ja"): string {
  if (locale !== "ja") {
    const current = code?.trim()
      ? `[Current code]\n${code.trim()}`
      : "[Current code]\n(Paste your app's current code here)";
    return `Please rewrite this app so that everyone in a group can see and write the same data.
Keep the current features and look as they are, and switch the saving of data members should share to Jisapp's group sharing feature below.
Output the finished index.html from start to finish without leaving anything out.

${locale === "vi" ? PROMPT_STORAGE_SHARED_VI : PROMPT_STORAGE_SHARED_EN}

${current}`;
  }
  const current = code?.trim()
    ? `【今のコード】\n${code.trim()}`
    : "【今のコード】\n（ここに、今のアプリのコードを貼り付けてください）";
  return `このアプリを、グループのメンバー全員で同じデータを見たり書き込んだりできるように書き換えてください。
今の機能と見た目はそのままにして、メンバーで共有したいデータの保存を、次のジサップのグループ共有機能に置き換えてください。
完成した index.html を、最初から最後まで省略せずに出力してください。

${PROMPT_STORAGE_SHARED}

${current}`;
}

/** 開発スタジオ・自由研究ガイド共通の AI 指示文 */
export const PROMPT_TEMPLATE = `あなたはジサップ（Jisapp）向けの優秀なフロントエンドエンジニアです。
「${PROMPT_APP_NAME_PLACEHOLDER}」を作りたいです。

次のルールを守って、最初の返答で完成した index.html を1ファイルまるごと出力してください（「変更部分のみ」や途中省略は不可）。保存の要否はすでに決まっているので、保存について質問しないでください。

【外部API・AI連携が話題に出たとき（重要）】
・ユーザーが「AIを使って」「ChatGPT」「Gemini」「天気API」「地図」「外部サービスと連携」など、APIキーが必要になりそうな要望を出したときだけ、コードのあとに次を短く案内してください。
・必要がなければ、外部APIについて能動的に質問しないでください。

■ ユーザーへの案内文（この内容をベースに、サービスに合わせて書き換えてください）
---
ジサップでは、APIキーをコードに直接書きません（公開すると他人に見える可能性があります）。

代わりに、開発スタジオ画面で次の手順を行ってください。
1. 生成した HTML を開発スタジオのコード欄に貼り付ける
2. 右上の「…」メニューから「APIキーの登録」を開く
3. 次の内容でキーを登録する
   ・名前（大文字）: 【WEATHER / OPENAI / MAPS など、コードで使う名前】
   ・値: 取得したAPIキー（AIza... / sk-... など）
   ・付け方: サービスの仕様に合わせて選ぶ
     - URLパラメータ型（Google Gemini 等） → 「URLパラメータ」、パラメータ名「key」
     - Authorization ヘッダー型（OpenAI 等） → 「HTTPヘッダー」
4. プレビューで動作を確認する

コード側では、キーの値は書かず secret: 'API_NAME' のように名前だけ指定します（API_NAME は登録名と同じ大文字）。
---

【コードを書くときのルール】
以下のジサップ専用ルールを厳守して、1つの index.html にすべてを含めたコードを出力してください。

【完全なHTML1枚（シングルファイル）で完結】
CSSもJavaScriptもファイル分割せず、すべて1つの「index.html」ファイルの中に丸ごと埋め込んでください。

【CDN・外部CSSフレームワークは一切使用禁止（重要）】
Tailwind CSSやBootstrapなどのCDN（外部読み込み）は、環境制限によりデザインが反映されない・エラーになるため絶対に使用しないでください。${GOOGLE_FONTS_OK_JA}
デザインはすべて「生のCSS（Vanilla CSS）」で記述し、CSS変数（:root）などを活用して、初心者向けに明るく爽やかで洗練されたモダンなUI（ライトモード）を実装してください。

${PROMPT_STORAGE_MARKER}

【APIキーの扱い（外部API・AIを使う場合は必須・最重要）】
・APIキー・トークン・秘密鍵を HTML / JavaScript / CSS に絶対に書かないでください。
  禁止例: const API_KEY = 'AIza...'; const OPENAI_KEY = 'sk-...'; fetch(url + '?key=xxxx')
・ユーザーに「キーを教えて」と聞かないでください。キーはジサップの「APIキー」画面でユーザー自身が登録します。
・外部APIを使うコードでは、必ず window.Jisapp.fetch の secret オプションを使ってください。
  例: const res = await window.Jisapp.fetch('https://api.example.com/data', { secret: 'WEATHER' });
       const data = res.body;
・コードに書いてよいのは secret の名前（大文字英字・数字・アンダースコア、32文字以内）だけです。
  例: GEMINI, OPENAI, WEATHER, MAPS_API
・secret 名は、ユーザーが「APIキー」画面で登録する名前と必ず一致させてください。

【よく使うサービスの secret 名と登録設定の目安】
・Google Gemini → secret: 'GEMINI' / APIキー画面: URLパラメータ「key」
・OpenAI → secret: 'OPENAI' / APIキー画面: HTTPヘッダー（Authorization）
・Groq → secret: 'GROQ' / APIキー画面: HTTPヘッダー（Authorization）
・天気・その他 → secret: 'WEATHER' 等 / APIキー画面: 各APIのドキュメントに合わせる

【コード出力後に必ずユーザーへ案内すること】
HTMLコードを出力したあと、最後に必ず次のような短い手順を添えてください（サービス名と secret 名は実際のコードに合わせる）:
---
【APIキーの登録手順】
1. このコードをジサップ開発スタジオに貼り付ける
2. 右上の「…」メニューの「APIキーの登録」を開く
3. 名前（コード内の secret 名と同じ。例: WEATHER, OPENAI, MAPS など）でキーを登録
4. プレビューで確認
※ キーをコードに直接書かないでください
---

【外部API連携の実装手順】
  1. まず通常の fetch(url) を試す（API側がCORS対応している場合のみ）。
  2. CORSエラーになる、またはAPIキーが必要な場合は window.Jisapp.fetch(url, { secret: 'NAME' }) を使う。
  ※ URLは https のみ。`;

/** 英語版の AI 指示文。アプリの画面の文字も英語にしてもらう */
export const PROMPT_TEMPLATE_EN = `You are an excellent front-end engineer building apps for Jisapp.
I want to make "${PROMPT_APP_NAME_PLACEHOLDER_EN}".

Follow the rules below and output the complete index.html as one whole file in your first reply (no "changed parts only", no skipping). Whether to save data has already been decided, so don't ask about saving.
Write all text in the app's screens (labels, buttons, messages) in natural English.

[When external APIs or AI come up (important)]
- Only if the user asks for something that probably needs an API key — "use AI", "ChatGPT", "Gemini", "weather API", "maps", "connect to another service", etc. — add the short guide below after the code.
- If it isn't needed, don't bring up external APIs yourself.

■ Guide for the user (adapt this to the service)
---
On Jisapp, API keys are never written in the code (if you publish, others might see them).

Instead, do this in the Studio:
1. Paste the generated HTML into the Studio's code box
2. Open "Register API key" from the "…" menu at the top right
3. Register the key like this
   - Name (UPPERCASE): [the name used in the code, e.g. WEATHER / OPENAI / MAPS]
   - Value: the API key you got (AIza... / sk-... etc.)
   - How it's attached: pick what the service expects
     - URL parameter type (Google Gemini, etc.) → "URL parameter", parameter name "key"
     - Authorization header type (OpenAI, etc.) → "HTTP header"
4. Check that it works in the preview

In the code, never write the key's value — only its name, like secret: 'API_NAME' (API_NAME is the same UPPERCASE name you registered).
---

[Rules for writing the code]
Strictly follow these Jisapp rules and put everything into a single index.html.

[One complete HTML file (single file)]
Don't split CSS or JavaScript into other files. Embed everything in one "index.html" file.

[No CDNs or external CSS frameworks at all (important)]
Never use CDNs such as Tailwind CSS or Bootstrap — because of environment limits, the design won't apply or it will error.${GOOGLE_FONTS_OK_EN}
Write all design in plain CSS (Vanilla CSS), use CSS variables (:root) and so on, and build a bright, fresh, polished, modern UI (light mode) that's friendly for beginners.

${PROMPT_STORAGE_MARKER}

[Handling API keys (required and most important when using external APIs or AI)]
- Never write API keys, tokens or secret keys in HTML / JavaScript / CSS.
  Not allowed: const API_KEY = 'AIza...'; const OPENAI_KEY = 'sk-...'; fetch(url + '?key=xxxx')
- Don't ask the user for their key. Users register keys themselves on Jisapp's "API keys" screen.
- In code that uses an external API, always use the secret option of window.Jisapp.fetch.
  Example: const res = await window.Jisapp.fetch('https://api.example.com/data', { secret: 'WEATHER' });
           const data = res.body;
- The only thing you may write in code is the secret's name (uppercase letters, numbers and underscores, 32 characters max).
  Examples: GEMINI, OPENAI, WEATHER, MAPS_API
- The secret name must match the name the user registers on the "API keys" screen.

[Typical secret names and settings for common services]
- Google Gemini → secret: 'GEMINI' / API keys screen: URL parameter "key"
- OpenAI → secret: 'OPENAI' / API keys screen: HTTP header (Authorization)
- Groq → secret: 'GROQ' / API keys screen: HTTP header (Authorization)
- Weather and others → secret: 'WEATHER' etc. / API keys screen: follow each API's docs

[Always tell the user this after the code]
After outputting the HTML, always finish with short steps like these (match the service and secret names to the actual code):
---
[How to register your API key]
1. Paste this code into the Jisapp Studio
2. Open "Register API key" from the "…" menu at the top right
3. Register the key under its name (the same as the secret name in the code, e.g. WEATHER, OPENAI, MAPS)
4. Check it in the preview
* Don't write the key directly in the code
---

[How to connect to external APIs]
  1. First try a normal fetch(url) (only if the API supports CORS).
  2. If you get a CORS error, or an API key is needed, use window.Jisapp.fetch(url, { secret: 'NAME' }).
  * https URLs only.`;

/**
 * ジサップオリジナルデザイン（グラスモーフィズム）の指定。
 * 配色と背景色はアプリごとにAIが決めるので、ここでは指定しない。
 * 自分でデザインしたい人は使わないため、テンプレートには任意で差し込む。
 */
export const PROMPT_JISAPP_DESIGN = `【UI/UXデザインの指定】
以下の仕様に従って、Vanilla CSSのみでデザインを構築してください。外部フレームワーク（Tailwind等）は使用しないでください。
ねらいは「整っているけど、どこかで見たAIっぽい画面」にしないこと。題材らしさと、触りたくなる楽しさのある画面にする。

【優先順位】迷ったり、ルールどうしがぶつかったりしたら、この順に従う。
  読みやすさ・使いやすさ ＞ 禁止事項（グラデーション・絵文字など） ＞ 題材らしさ ＞ 飾り

====================================================
0. 最初に決めること（作り始める前に、この3つを短く書き出してから作る）
====================================================
・題材のメタファー：このアプリは現実の何に似ているか。例：日記→手帳、家計簿→レシート・財布、筋トレ→トレーニングノート、旅行→チケット・パスポート、当番表→黒板・掲示板、推し活→チケット・トレカ、勉強→単語カード・ノート、お店→メニュー・伝票。
・主役のデータ：画面でいちばん多く出てくる情報は何か（日付・人・金額・回数・場所・進み具合など）。
・使う人の気分：開いたときにどう感じてほしいか（落ち着く／元気が出る／きちんとする／わくわくする）。
この3つから、配色・書体・素材・最初の主役の形を選ぶ。決めたものは、選んだ理由と一緒にコードの先頭にコメントで残す。
・題材が現実の物に例えにくいとき（ToDo・設定・ツール系など）は、無理にメタファーを作らない。主役は「中身から始める」か「大きな文字だけ」（3番）にし、個性は書体と色と言葉づかいで出す。

====================================================
1. 全体コンセプト
====================================================
・グラデーションに頼らない、色のついた洗練されたデザイン。「うすく色のついた土台」の上に「白いカード」を浮かせ、「メイン色」と「アクセント色」でメリハリをつける。
・そのうえで、題材のメタファーを「素材」と「形」で少しだけ取り入れ、ただの白い箱の羅列にしない（3番・4番）。
・【禁止】グラデーション（linear-gradient / radial-gradient / conic-gradient、ぼかした色の円で作るにじみ表現も含む）、虹色のような多色づかい。カードや画面全体の背景にすりガラスは使わない。
・すりガラスを使う場所：中身の上に重なって浮く部品だけ（スクロールしても上に残るヘッダー、下に固定したタブやボタン、Toast、Bottom Sheet・モーダル・メニューを出したときの後ろ）。
  浮く部品は background: rgba(255,255,255,.72); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); に 1px の rgba(255,255,255,.6) の線をつける。
  Bottom Sheet・モーダル・メニューの後ろは background: rgba(17,24,39,.3); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); にする。

====================================================
2. 配色
====================================================
・役割を必ず決める。すべて :root の CSS 変数にまとめ、コードの中に色を直接書かない（テーマを差し替えられるようにするため）。
  土台（--base）：画面全体の背景。メイン色をごくうすくした色。
  メイン（--main）：主役の強調・メインボタン・見出しのアイコン・題材の素材の色（しおり・帯など）に使う。
  メインの文字用（--main-ink）：白い背景の上にメイン色の文字を置くときの、少し濃いメイン色。
  アクセント（--accent）：明るい差し色。ラベル・強調・選択中の印・付箋などに使う。
  うすいメイン（--main-l）：メイン色を10%ほどにした色。サブボタン・選択中の背景・チップに使う。
・あか抜けて見せるコツ：原色を避け、少し灰色を混ぜた「くすみ色」を選ぶ。メインとアクセントは補色に近い組み合わせ（緑×からし、青×黄、ピンク×黄、赤茶×黄など）にするとメリハリが出る。
・白文字を乗せるメイン色は、白とのコントラスト比 3:1 以上（できれば 4.5:1 以上）にする。明るい色をメインにしたいときは、上に乗せる文字を白ではなく濃い色にする。
・文字のグレーは、メインの色相に少し寄せる（暖色のアプリは茶色寄り、寒色のアプリは青寄り）。真っ黒・無彩色のグレー（#111827 / #6b7280 など）をそのまま使うと冷たく、機械的に見える。
  目安：文字＝メインの色相でごく濃い色、補足＝彩度の低い中間色、弱い文字＝それをさらに薄く。
・入力欄の背景（--field）も土台に寄せた色にする（例：暖色なら #f7f1ea、緑系なら #f1f4ee）。
・カードは白（#fff）。
・状態の色は使ってよい：注意・削除は赤（#be123c、背景 #fdecef）、変更・未対応はオレンジ（#d97706、背景 #fef3c7）、情報は青（#2563eb、背景 #e8effd）。
・種類分けが必要なら、追加の色は3色まで。メイン色と似た色相は避け、どれも落ち着いた色にする。
・配色は、下の例をそのまま使わず、題材と使う人の気分から決める。決めた色と理由（例：「お金のアプリなので、信頼感のある深い緑。差し色は小銭の金色」）をコメントに書く。指定の色があればそれを優先する。
  【指定の色】（空欄なら自分で決める）土台：　　メイン：　　アクセント：
・配色の例（考えるときの参考。どれも少しくすませてある）：
  コーラル #fdf4ea / #e05a43 / #ffd447、セージ #f2f4ee / #5f8a6e / #f2c66d、スモーキーブルー #eff3f8 / #4f78a8 / #f4c95d、くすみローズ #fbf1f2 / #c0627d / #f6cf7a、インクネイビー #f1f2f6 / #2f5a8c / #ffcf56、テラコッタ #f8efe8 / #b5603c / #f2c14e、ディープグリーン #eef2ea / #2f5a3f / #e9c46a、プラム #f4eef4 / #6e4a7e / #f3b562、チャコール #f2f1ee / #3a3a3a / #f2b33d、ティール #eaf3f1 / #2f7f7a / #ffcc66
・必要なら、設定からテーマカラーを選べるようにする（変数を差し替えるだけで全体が変わる作りにしておく）。

====================================================
3. 最初の主役（ヒーローは「必要なときだけ」）
====================================================
・画面ごとに「開いた瞬間に目が最初に行く主役」を1つだけ決める。主役の役目は、「今どういう状態か」か「次に何をすればいいか」が一目でわかること。
・ヒーロー（メイン色の塗りのカードに、大きな数字とチップ）は、主役の形の選択肢の1つ。禁止ではないが、「どの画面にも必ず置く決まった部品」にはしない。毎回同じ形で始まると、題材が違ってもどのアプリも同じ顔になり、単調で、どこかで見たAIっぽい画面になるため。
・まず、その画面で一番大事なものが何かで決める。
  ・一番大事なのが「1つの数字や状態」（予算の残り・連続記録日数・次の予定まであと何日・今日の達成率など）→ ヒーローが合う。塗りで大きく見せるのが一番伝わる。
  ・一番大事なのが「中身そのもの」（書く欄・明細・一覧・カレンダーなど）→ ヒーローは使わず、下の1〜5から選ぶ。
・主役の形の選択肢（0番の「題材のメタファー」とあわせて、上から当てはまるものを考える）：
  1. 題材の物そのもの：その画面の主役を、現実の物の形で見せる。
     例：日記→開いた手帳の今日のページ（大きな日付＋罫線の書く欄）、家計簿→今月のレシート、貯める系→通帳（日付・項目・残高の行と、二重線の付いた合計）、旅行→次の旅のチケット、筋トレ→今日のメニュー表、当番表→黒板、勉強→単語カードの束、お店→伝票。
  2. 中身から始める：書く欄・カレンダー・一覧など、その画面でいちばん使うもの自体を一番上に置き、それを主役にする。
  3. 大きな文字だけ：カードで囲まず、土台の上に数字や日付を雑誌の見出しのように直接大きく置く（48〜72px）。下に小さな数字を2〜3個、点線の区切りで並べる。
  4. 絵：題材の線画を大きく見せる。
  5. 主役を作らない：一覧・検索・設定などの画面は、小さな見出しだけにしてすぐ中身に入る。
  6. ヒーロー：メイン色の塗り、角丸 24px、余白 18px。上にアクセント色のピル型ラベル（例「今月のこり」「次の当番」）、その下に 40〜48px・太字の大きな数字、下に白14%の背景のチップを2〜3個。押せるチップは関係する画面へ移れるようにする。題材のモチーフ（罫線・方眼・コートの線など）をインラインSVGで背景に薄く描く（opacity .06〜.15）。
     見た目は「塗り／うすい（--main-l の背景にメインの文字）／白（白いカードに大きな数字だけ）」の3段階から選べる。
・題材の物の形とヒーローは組み合わせてよい（例：家計簿のレシートの中で「のこり ¥11,740」だけを大きく見せる。チケットの形をしたヒーロー）。題材の形をまとったヒーローは、同じ顔になりにくい。
・同じアプリの中でも、画面ごとに主役の形を変える（例：トップは手帳のページ、人の画面は通帳、統計は大きな文字とマス目）。どの画面も同じ形で始まらないようにする。
・ヒーローを使うのは、1つのアプリで多くても2画面まで（ホームと、そのアプリの主役の画面など）。主役が2つ並ぶとどこを見ればいいか迷うので、ヒーローを置いた画面には、ほかに大きな主役（大きなレシート・大きな見出しなど）を置かない。
・中身は状態で変える。例：未記入なら「まだ白紙です」と書く欄、記入済みなら「書いたページを開いています」。朝と夜で言葉を変える。数字が0や空のときの見せ方も必ず用意する。
・大きさ：最初に見える画面の 1/2 くらいまで。主役の下の中身が、スクロールしなくても少し見えるようにする（ただし、書く欄そのものが主役のときはこの限りではない）。
・主役の中の数字や日付は、表情を出す書体（4-3）で大きく。押せる要約（「今年の出会い 46人」など）は小さなチップにし、関係する画面へ移れるようにする。

====================================================
4. 個性の出し方（ここが「シンプルすぎてつまらない」を防ぐ部分）
====================================================
次の4つのうち、2〜3つを取り入れる。迷ったら少ないほうにする（4-5を守る）。全部を全画面に入れない。

4-1. 主役のデータに「形」を与える
・主役のデータを、ただの文字ではなく、題材らしい小さな部品にして見せる。
  日付→カレンダーをめくったようなスタンプ（月を英字の小さな帯、日を大きな数字、曜日を小さく。土曜は青・日曜は赤）
  人→名前の頭文字を丸に入れたアバター（種類ごとに色分け）
  金額→大きな数字＋小さな通貨記号、レシート風の明細
  回数・連続日数→小さなバーやドットの並び
  場所→ピンのアイコン付きのチップ
  進み具合→リングかバー
  時間→時計の文字盤風、または時刻を大きく
・同じデータは、どの画面でも同じ形で見せる。

4-2. カードの種類を3つ以上に分ける
・画面の上から下まで同じ白いカードが続かないようにする。役割ごとに見た目を変える。
  主役：3番で決めた形（題材の物そのもの・大きな文字など）。
  標準のカード：白、角丸 20px、余白 16px、影 box-shadow: 0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06);
  題材の素材を使ったカード：付箋・チケット・レシート・名刺・単語カード・メモ用紙など。題材に合うものを1〜2種類だけ選び、「おすすめ」「ピックアップ」「過去の記録」など特別な役割のものに使う。
    付箋：アクセント色をうすくした背景、上にマスキングテープ、ほんの少し傾ける（±1°まで）
    チケット：左右の端に半円の切り欠き（mask か clip-path、または土台と同じ色の丸い要素を重ねる）、真ん中に点線の区切り（border-top: 2px dashed）
    レシート：下の端をギザギザに（clip-path: polygon() で三角を並べる）、等幅の数字、点線の区切り（border-top: 2px dashed）
    名刺：左端に種類の色の細い帯
    メモ用紙：本文の下に罫線（行の高さに合わせる。SVG の data URI を background-image で敷く）
・状態はカードの背景色で見せる（自分の分はうすいメイン、変更はオレンジの背景、注意は赤の背景）。

4-3. 書体を2つ使う
・本文：-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Helvetica Neue", Arial, sans-serif。font-feature-settings: "palt"; で字間を整える。
・表情を出す書体：見出し・大きな数字・日付・名前・ボタンにだけ、題材と気分に合う Google Fonts を1つ使う。読み込めなくても崩れないよう、必ず後ろに本文の書体を続けて書く。
  やわらかい・親しみ（日記・家族・推し活）：Zen Maru Gothic、M PLUS Rounded 1c、Kiwi Maru
  きちんと・上品（仕事・お金・読書）：Shippori Mincho、Zen Old Mincho、BIZ UDPGothic
  元気・ポップ（スポーツ・ゲーム・子ども向け）：Dela Gothic One（見出しだけ）、M PLUS 1p の太字
  数字や英字だけ目立たせる：Outfit、DM Sans、Space Grotesk（日本語には効かないので、数字・英字の部分だけに使う）
・文字の大きさ：大きな数字は 24〜48px・太字・font-variant-numeric: tabular-nums、見出し 15〜17px・太字、本文 14px、補足 12px。

4-4. 素材感と飾りを1つ入れる
・土台に、題材のモチーフのごく薄い地模様を敷く（点・方眼・罫線・ドット・ストライプなど）。SVG を data URI にして background-image で敷く。
・【線・模様の描き方】罫線・ストライプ・ギザギザ・切り欠き・点線は、linear-gradient / repeating-linear-gradient で描かない。使ってよいのは、SVG の data URI、clip-path / mask、border（solid / dashed / dotted / double）、疑似要素だけ。
・data URI の中では CSS 変数が使えない。テーマを切り替える作りにするときは、模様そのものを CSS 変数（例：--dots: url("data:...")）に入れ、テーマごとに作り直す。
・飾りは1種類だけ選ぶ：マスキングテープ、スタンプ、ステッチ（点線のふち）、切り欠き、ピン、手書き風の下線など。
・見出しの横に、点線や短い線などの小さな飾りを入れてもよい。

4-5. やりすぎ防止のルール
・1画面で使う素材カードは2種類まで、飾りは1種類まで。
・傾けるのは ±1° まで。本文が読みにくくなる飾りは入れない。
・地模様・モチーフの濃さは opacity .06〜.15、または土台よりほんの少し濃い色まで。
・迷ったら引く。「題材らしさが一目でわかる最小限」をねらう。

====================================================
5. 見せ方
====================================================
・文字の羅列にせず、カレンダー・表・バー・リング・人のアイコンなど、見てわかる形にする。
・画面のリズムを変える：主役 → 横に並ぶもの（カルーセル・2列のグリッド・チップの列）→ 縦のリスト、のように、同じ並び方が続かないようにする。
・空っぽの状態（まだ記録がない、検索で見つからないなど）は、題材に合う線画のSVGと、やさしい一言を出す。ただ「データがありません」で終わらせない。
・言葉づかい：ボタンや案内文は、機械的な言い方より、人に話しかけるような短い言葉にする（例：「データを追加」→「今日のことを書く」、「保存しました」→「書けました」）。ただし、エラーや削除の確認ははっきり書く。

====================================================
6. ボタン・入力UI
====================================================
・メインボタン：メイン色の塗り、白文字（明るいメイン色のときは濃い文字）、角丸 16px、横いっぱい、上下の余白 15px、15px・太字。押したとき :active で transform: scale(.985)。
・サブボタンはうすいメインの背景に、メインの文字用の色（--main-ink）の文字。削除などはうすい赤の背景に赤い文字。小さな選択肢はピル型のチップ。
・入力欄（input, textarea, select）：枠線なし、背景は --field、角丸 14px。フォーカス時は背景を白にし、box-shadow: 0 0 0 2px メイン色 のリングを出す。
・タブは、うすい背景の中で選択中だけ白く浮かぶ「セグメント型」にする。

====================================================
7. ヘッダー
====================================================
・position: sticky; top: 0; でスクロールしても上に残し、背景はすりガラス（1番の指定）にする。
・左に 36px のメイン色の四角いアイコン（角丸 10px、中に白いSVG）、アプリ名は 16〜18px・太字（表情を出す書体）。右に自分の名前のピル。

====================================================
8. アイコン【厳守】
====================================================
・絵文字（📱や✨など）や記号の文字（★●✓など）は一切使用禁止。すべてのアイコンは、線の太さ（stroke-width="2"〜"2.6"）と丸い線端（stroke-linecap="round"）を統一したインラインSVGを使用すること。
・見出しの横のアイコンはメイン色にする。

====================================================
9. レイアウトとアニメーション
====================================================
・モバイルファースト設計（max-width: 640px; margin: 0 auto;）。左右の余白 16px、カードどうしの間隔 12px。
・幅 320px の小さなスマホでも崩れないようにする。グリッドの列は repeat(7, minmax(0, 1fr)) のように minmax(0, 1fr) で指定し、中身に押されて横にはみ出さないようにする。マス目は aspect-ratio に頼らず、clamp() で高さを決める。小さい画面用の上書き（@media (max-width: 400px)）は、CSSの最後に書く。
・コンテンツ表示時に下から少しフェードインするCSSアニメーション（@keyframes fadeIn）。追加した項目は下からふわっと出す。並んだ項目は 70ms ずつずらして出す。
・ボタンやカードの状態の変化は transition: all .2s; で滑らかにする。
・動きは0.2〜0.3秒にし、ゆっくりすぎる動きや画面が揺れる動きはしない。prefers-reduced-motion が有効なときは動きを止める。

====================================================
10. 部品（アプリに合うものだけ使う。全部は入れない）
====================================================
・コードを短く保つため、そのアプリで本当に役立つ部品だけを使うこと。使わない部品のコードは書かない。

【ほぼ毎回使う】
・Toast：保存・追加・削除・コピーなどのあとに、画面の下に短く出す。暗いすりガラス（background: rgba(17,24,39,.8); backdrop-filter: blur(16px);）に白い文字、角丸 999px、左に小さなSVGアイコン。下から少し浮き上がって出て、2秒ほどで消える。一度に出すのは1つだけ。
・ラジオボタン：標準の丸い見た目は使わず、選択肢をピル型のチップかセグメント型で並べる。選んだものはメイン色の塗り。中身は input type="radio" で作り、label で包んでタップしやすくする。
・プルダウンメニュー（select）：入力欄と同じ見た目にし、右に下向きの矢印（インラインSVG）をつける。選択肢が4つ以下なら、プルダウンにせずチップで並べる。

【場面が合えば使う】
・Bottom Sheet：スマホで、詳細の表示・入力フォーム・選択肢の一覧を出すときは、中央のモーダルよりこちらを優先する。画面の下から出てくる白いシート（上の角だけ角丸 24px、上部に横長のつまみ）。後ろは1番の指定で暗くぼかし、後ろのタップか下へのスワイプで閉じる。
・モーダル：削除の確認など、短い確認にだけ使う。中央に白いカード（角丸 24px）。ボタンは「キャンセル」（サブボタン）と「削除する」（うすい赤の背景に赤い文字）を横に並べる。Esc キーと後ろのタップで閉じる。
・アコーディオン：長い説明・よくある質問・過去の記録など、ふだんは畳んでおきたいものに使う。見出しの行をタップで開閉し、右の矢印（SVG）が回転する。
・Skeleton Screen：読み込みに時間がかかるところでは、灰色の角丸の箱（土台に寄せた色、明るさがゆっくり変わる）を出し、読み込み中も画面の形がわかるようにする。読み込みが一瞬で終わるところには使わない。
・Autocomplete：名前・場所・品名など、前に入れたものをまた入れることが多い欄で使う。入力に合う候補を、入力欄のすぐ下に白いカードで最大5件出し、タップで入力される。人の候補にはアバターを付ける。
・Swipe Action：一覧の項目を左へスワイプすると「削除」（赤）などのボタンが出る。同じ操作ができるボタンも必ず残す。
・カルーセル：カードを横に並べてスワイプで見せたいときに使う。scroll-snap で1枚ずつ止まり、次のカードが少し見えるようにする。下に今の位置を示す点を出す。自動では動かさない。
・ハンバーガーメニュー：画面が5つ以上あってタブに収まらないときに使う（4つ以下ならセグメント型のタブか、下に固定したタブにする）。ヘッダーの右に置き、開くと右から白いパネル（角丸 24px）が出る。今いる画面の項目は、うすいメイン色の背景にする。

====================================================
11. 仕上げチェック（出す前に確認する）
====================================================
□ 画面を3秒見て、何のアプリか題材がわかるか（ロゴや文字を隠しても）
□ 上から下まで、同じ白いカードだけが続いていないか
□ 主役のデータが、ただの文字ではなく形になっているか
□ ヒーローを置いた画面は、一番大事なのが「1つの数字や状態」の画面か。全部の画面が同じヒーローで始まっていないか
□ 最初の主役を見て「今の状態」か「次にすること」がわかるか。空っぽのときの見せ方もあるか
□ 画面ごとに主役の形が違うか
□ 文字のグレーが無彩色のままになっていないか
□ グラデーションと、ぼかした色のにじみを使っていないか
□ 飾りが多すぎて本文が読みにくくなっていないか
□ 320px・375px・430px の幅で、横にはみ出したり崩れたりしていないか（グリッドの列は minmax(0, 1fr) にする）
□ 絵文字・記号の文字を使っていないか`;

export const PROMPT_JISAPP_DESIGN_EN = `[UI/UX design]
Build the design with Vanilla CSS only, following the spec below. Don't use external frameworks (Tailwind, etc.).
The goal: don't make "a neat screen that looks like every other AI-made app." Make a screen that feels like its subject and is fun to touch.

[Priorities] When unsure, or when rules conflict, follow this order:
  readability and ease of use > the bans (gradients, emoji, etc.) > feeling like the subject > decoration

====================================================
0. Decide first (before you start, write these three down briefly, then build)
====================================================
- The subject's metaphor: what real-world object is this app like? For example: diary → planner/notebook, budget → receipt or wallet, workouts → training log, travel → ticket or passport, duty roster → chalkboard or notice board, fandom → concert ticket or trading card, study → flashcards or notebook, shop → menu or order slip.
- The main data: what information appears most on the screen (dates, people, amounts, counts, places, progress, etc.)?
- The user's mood: how should it feel when they open it (calm / energized / organized / excited)?
From these three, choose the colors, fonts, materials and the shape of the first main element. Write what you chose, with the reasons, as a comment at the top of the code.
- If the subject doesn't map to a real object (to-do lists, settings, tools, etc.), don't force a metaphor. Make the main element "start with the content" or "big type only" (section 3), and show personality through fonts, colors and wording.

====================================================
1. Overall concept
====================================================
- A polished, colored design that doesn't rely on gradients. White cards float on a lightly tinted base, with a "main" color and an "accent" color for contrast.
- On top of that, bring in a little of the subject's metaphor through "material" and "shape," so the screen isn't just a stack of white boxes (sections 3 and 4).
- [Banned] Gradients (linear-gradient / radial-gradient / conic-gradient, including soft blurred color blobs) and rainbow-like use of many colors. Don't use frosted glass on cards or the whole-screen background.
- Where to use frosted glass: only on parts that float over the content (a header that stays at the top while scrolling, tabs or buttons fixed to the bottom, toasts, and the backdrop behind bottom sheets, modals and menus).
  Floating parts use background: rgba(255,255,255,.72); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); with a 1px rgba(255,255,255,.6) border.
  The backdrop behind bottom sheets, modals and menus uses background: rgba(17,24,39,.3); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);

====================================================
2. Colors
====================================================
- Always decide the roles. Put every color in CSS variables on :root, and never write colors directly elsewhere in the code (so the theme can be swapped).
  Base (--base): the whole-screen background. A very light tint of the main color.
  Main (--main): emphasis on the main element, main buttons, heading icons, and the color of the subject's materials (bookmarks, bands, etc.).
  Main ink (--main-ink): a slightly darker main color for main-colored text on a white background.
  Accent (--accent): a bright highlight color for labels, emphasis, selected marks, sticky notes, etc.
  Light main (--main-l): the main color at about 10%. For secondary buttons, selected backgrounds and chips.
- To look refined: avoid pure primary colors and pick slightly grayed, "muted" colors. Pairing main and accent colors that are close to complementary (green × mustard, blue × yellow, pink × yellow, brick × yellow, etc.) gives good contrast.
- A main color that carries white text needs a contrast ratio of at least 3:1 with white (4.5:1 or more if possible). If you want a light main color, put dark text on it instead of white.
- Tint the text grays slightly toward the main hue (brownish for warm apps, bluish for cool apps). Pure black or neutral grays (#111827 / #6b7280, etc.) look cold and mechanical.
  Rough guide: text = a very dark shade of the main hue; secondary text = a low-saturation mid tone; faint text = lighter still.
- Make the input background (--field) close to the base too (e.g. #f7f1ea for warm apps, #f1f4ee for green ones).
- Cards are white (#fff).
- Status colors are allowed: warning/delete red (#be123c on #fdecef), changed/pending orange (#d97706 on #fef3c7), info blue (#2563eb on #e8effd).
- If you need category colors, add at most 3 more. Avoid hues close to the main color, and keep them all muted.
- Don't just copy the examples below. Choose colors from the subject and the user's mood, and write the colors and the reason as a comment (e.g. "A money app, so a trustworthy deep green. The accent is the gold of coins."). If colors are specified, use those first.
  [Specified colors] (leave blank to choose yourself) Base:    Main:    Accent:
- Example palettes (for reference — all slightly muted) (base / main / accent):
  Coral #fdf4ea / #e05a43 / #ffd447, Sage #f2f4ee / #5f8a6e / #f2c66d, Smoky blue #eff3f8 / #4f78a8 / #f4c95d, Dusty rose #fbf1f2 / #c0627d / #f6cf7a, Ink navy #f1f2f6 / #2f5a8c / #ffcf56, Terracotta #f8efe8 / #b5603c / #f2c14e, Deep green #eef2ea / #2f5a3f / #e9c46a, Plum #f4eef4 / #6e4a7e / #f3b562, Charcoal #f2f1ee / #3a3a3a / #f2b33d, Teal #eaf3f1 / #2f7f7a / #ffcc66
- If useful, let users pick a theme color in the settings (build it so swapping the variables changes everything).

====================================================
3. The first main element (use a hero only when it's needed)
====================================================
- For each screen, decide on exactly one "main element" — the thing the eye goes to the moment it opens. Its job is to make "what the current state is" or "what to do next" clear at a glance.
- A hero (a card filled with the main color, with a big number and chips) is one option for the main element. It isn't banned, but don't make it "a fixed part every screen must have." If every screen starts with the same shape, every app ends up with the same face no matter the subject — monotonous, and it looks like every other AI-made screen.
- First decide based on what matters most on that screen.
  - If what matters most is "one number or state" (budget left, a streak, days until the next event, today's progress, etc.) → a hero fits. Showing it big and filled communicates best.
  - If what matters most is "the content itself" (a writing area, line items, a list, a calendar, etc.) → don't use a hero; choose from options 1–5 below.
- Options for the main element (think about them together with the metaphor from section 0, top to bottom):
  1. The subject's object itself: show the screen's main element in the shape of the real object.
     For example: diary → today's page of an open planner (a big date plus a ruled writing area), budget → this month's receipt, savings → a bankbook (rows of date, item and balance, with a double-ruled total), travel → the ticket for the next trip, workouts → today's training sheet, duty roster → a chalkboard, study → a stack of flashcards, shop → an order slip.
  2. Start with the content: put the thing used most on that screen (writing area, calendar, list, etc.) at the very top and make it the main element.
  3. Big type only: no card around it — set the number or date directly on the base, large like a magazine headline (48–72px). Underneath, line up 2–3 small numbers separated by dotted dividers.
  4. Illustration: show a line drawing of the subject, large.
  5. No main element: list, search and settings screens get just a small heading and go straight into the content.
  6. Hero: filled with the main color, border-radius 24px, padding 18px. At the top, an accent-colored pill label (e.g. "Left this month", "Next duty"); below it a big 40–48px bold number; below that, 2–3 chips on a 14% white background. Tappable chips should lead to the related screen. Draw a faint motif of the subject (ruled lines, a grid, court lines, etc.) as an inline SVG in the background (opacity .06 to .15).
     You can choose its look from three levels: "filled" / "light" (main-colored text on --main-l) / "white" (just a big number on a white card).
- You can combine the object's shape with a hero (e.g. inside a budget receipt, show only "$117.40 left" big; a hero shaped like a ticket). A hero that takes the subject's shape is less likely to look like every other app.
- Within one app, change the main element's shape from screen to screen (e.g. home is a planner page, the people screen is a bankbook, stats are big type and a grid). Don't let every screen start with the same shape.
- Use a hero on at most 2 screens per app (e.g. home and the app's key screen). Two main elements side by side make it unclear where to look, so on a screen with a hero, don't add another big main element (a big receipt, a big headline, etc.).
- Change the content with the state. For example: if nothing is written yet, a writing area that says "Still a blank page"; once written, "Here's the page you wrote." Change the wording between morning and night. Always prepare how it looks when a number is 0 or something is empty.
- Size: up to about half of the first visible screen, so a little of the content below shows without scrolling (except when the writing area itself is the main element).
- Show numbers and dates in the main element large, in the expressive font (4-3). Tappable summaries (such as "46 people met this year") become small chips that lead to the related screen.

====================================================
4. Adding personality (this is what keeps it from being "too plain and boring")
====================================================
Use 2–3 of the following 4. When unsure, use fewer (follow 4-5). Don't put all of them on every screen.

4-1. Give the main data a "shape"
- Show the main data not as plain text but as a small part that fits the subject.
  Dates → a stamp like a tear-off calendar (the month as a small English band, the day as a big number, the weekday small; Saturday in blue, Sunday in red)
  People → avatars with the name's initial in a circle (color-coded by type)
  Amounts → a big number with a small currency sign, receipt-style line items
  Counts and streaks → a row of small bars or dots
  Places → chips with a pin icon
  Progress → a ring or a bar
  Time → a clock-face style, or the time shown big
- Show the same data in the same shape on every screen.

4-2. Use 3 or more kinds of cards
- Don't let the same white card repeat from top to bottom. Change the look by role.
  Main element: the shape decided in section 3 (the subject's object itself, big type, etc.).
  Standard card: white, border-radius 20px, padding 16px, shadow box-shadow: 0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06);
  Cards made of the subject's materials: sticky notes, tickets, receipts, business cards, flashcards, memo paper, etc. Choose only 1–2 kinds that fit the subject, and use them for special roles such as "recommended," "pick-up" or "past records."
    Sticky note: a light tint of the accent color, masking tape at the top, tilted very slightly (±1° at most)
    Ticket: half-circle notches on the left and right edges (mask or clip-path, or round elements in the base color laid on top), a dotted divider in the middle (border-top: 2px dashed)
    Receipt: a zigzag bottom edge (clip-path: polygon() with a row of triangles), monospaced numbers, dotted dividers (border-top: 2px dashed)
    Business card: a thin band in the category color on the left edge
    Memo paper: ruled lines under the text (matched to the line height; lay an SVG data URI as background-image)
- Show state with the card background (your own items in light main, changes on an orange background, warnings on a red background).

4-3. Use two fonts
- Body: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif
- Expressive font: use one Google Font that fits the subject and mood, only for headings, big numbers, dates, names and buttons. Always list the body font after it, so nothing breaks if it doesn't load.
  Soft and friendly (diaries, family, fandom): Nunito, Quicksand, Fredoka
  Neat and elegant (work, money, reading): Fraunces, Lora, DM Serif Display
  Energetic and playful (sports, games, kids): Bricolage Grotesque, Baloo 2, Archivo Black (headings only)
  Numbers and short labels that should stand out: Outfit, DM Sans, Space Grotesk
- Sizes: big numbers 24–48px, bold, font-variant-numeric: tabular-nums; headings 15–17px bold; body 14px; notes 12px.

4-4. Add material and one decoration
- Lay a very faint background pattern of the subject's motif on the base (dots, a grid, ruled lines, polka dots, stripes, etc.), as an SVG data URI in background-image.
- [How to draw lines and patterns] Don't draw ruled lines, stripes, zigzags, notches or dotted lines with linear-gradient / repeating-linear-gradient. Use only SVG data URIs, clip-path / mask, borders (solid / dashed / dotted / double) and pseudo-elements.
- CSS variables don't work inside a data URI. If the app can switch themes, put the pattern itself into a CSS variable (e.g. --dots: url("data:...")) and rebuild it for each theme.
- Choose only one kind of decoration: masking tape, stamps, stitching (a dotted edge), notches, pins, a hand-drawn underline, etc.
- A small decoration next to headings, such as a dotted or short line, is fine.

4-5. Rules to avoid overdoing it
- At most 2 kinds of material cards and 1 kind of decoration per screen.
- Tilt at most ±1°. Don't add decorations that make the text harder to read.
- Keep background patterns and motifs at opacity .06 to .15, or only slightly darker than the base.
- When in doubt, take it out. Aim for "the minimum that makes the subject obvious at a glance."

====================================================
5. Presentation
====================================================
- Don't just list text. Show things in shapes you can read at a glance: calendars, tables, bars, rings, person avatars, etc.
- Vary the rhythm of the screen: main element → something side by side (a carousel, a 2-column grid, a row of chips) → a vertical list, so the same layout doesn't repeat.
- For empty states (no records yet, nothing found in search, etc.), show a line-drawn SVG that fits the subject and a kind line of text. Don't stop at "No data."
- Wording: make buttons and guidance short and conversational rather than mechanical (e.g. "Add data" → "Write about today", "Saved" → "All written down"). But keep errors and delete confirmations clear.

====================================================
6. Buttons and inputs
====================================================
- Main button: filled with the main color, white text (dark text on a light main color), border-radius 16px, full width, vertical padding 15px, 15px bold. On :active, transform: scale(.985).
- Secondary buttons: light main background with text in the main ink color (--main-ink). Delete etc.: light red background with red text. Small options are pill-shaped chips.
- Inputs (input, textarea, select): no border, background --field, border-radius 14px. On focus, the background turns white with a ring of box-shadow: 0 0 0 2px (main color).
- Tabs are a "segmented control": a light track where only the selected tab floats in white.

====================================================
7. Header
====================================================
- Keep it at the top while scrolling with position: sticky; top: 0; and give it a frosted glass background (as in section 1).
- On the left, a 36px main-colored square icon (radius 10px, white SVG inside); the app name at 16–18px bold (in the expressive font). On the right, a pill with the user's name.

====================================================
8. Icons [strict]
====================================================
- No emoji at all (like 📱 or ✨) and no symbol characters (like ★●✓). Every icon must be an inline SVG with a consistent stroke width (stroke-width="2" to "2.6") and round line caps (stroke-linecap="round").
- Icons next to headings use the main color.

====================================================
9. Layout and animation
====================================================
- Mobile-first (max-width: 640px; margin: 0 auto;). 16px side gutters, 12px gaps between cards.
- Don't break on small 320px phones. Define grid columns with minmax(0, 1fr), like repeat(7, minmax(0, 1fr)), so content can't push them wider than the screen. Don't rely on aspect-ratio for grid cells; set their height with clamp(). Put small-screen overrides (@media (max-width: 400px)) at the end of the CSS.
- Content fades in slightly from below when shown (CSS animation @keyframes fadeIn). Newly added items rise in from below. Items in a list appear staggered by 70ms.
- Buttons and cards change state smoothly with transition: all .2s;
- Keep motion to 0.2 to 0.3s; no overly slow or shaking motion. Stop motion when prefers-reduced-motion is on.

====================================================
10. Components (use only what fits the app; don't include them all)
====================================================
- To keep the code short, use only the components that are truly useful for this app. Don't write code for components you don't use.

[Use in almost every app]
- Toast: after saving, adding, deleting, copying, etc., show a short message near the bottom of the screen. Dark frosted glass (background: rgba(17,24,39,.8); backdrop-filter: blur(16px);) with white text, border-radius 999px, and a small SVG icon on the left. It rises in slightly from below and disappears after about 2 seconds. Show only one at a time.
- Radio buttons: don't use the default round look. Show the options as pill-shaped chips or a segmented control; the selected one is filled with the main color. Build them with input type="radio" wrapped in a label so they are easy to tap.
- Dropdown (select): same look as inputs, with a downward arrow (inline SVG) on the right. If there are 4 options or fewer, show chips instead of a dropdown.

[Use when the situation fits]
- Bottom sheet: on phones, prefer this over a centered modal for showing details, input forms and lists of choices. A white sheet that slides up from the bottom (top corners radius 24px, a small horizontal handle at the top). Dim and blur the background as in section 1; close by tapping the background or swiping down.
- Modal: only for short confirmations such as confirming a delete. A centered white card (radius 24px) with "Cancel" (secondary button) and "Delete" (red text on light red) side by side. Close with the Esc key or by tapping the background.
- Accordion: for things usually kept folded, such as long explanations, FAQs or past records. Tap the heading row to open or close; the arrow (SVG) on the right rotates.
- Skeleton screen: where loading takes time, show gray rounded boxes (in a color close to the base, with slowly changing brightness) so the layout is visible while loading. Don't use it where loading is instant.
- Autocomplete: for fields where people often re-enter the same things, such as names, places or item names. Show up to 5 matching suggestions in a white card right below the field; tapping one fills it in. Give people suggestions an avatar.
- Swipe action: swiping a list item left reveals buttons such as "Delete" (red). Always keep a button that does the same thing.
- Carousel: when you want to show cards side by side with swiping. Use scroll-snap so it stops one card at a time, with the next card slightly visible. Show dots for the current position below. Don't auto-advance.
- Hamburger menu: use when there are 5 or more screens that don't fit in tabs (with 4 or fewer, use segmented tabs or tabs fixed to the bottom). Put it on the right of the header; it opens a white panel (radius 24px) from the right. Highlight the current screen with the light main color.

====================================================
11. Final check (before you hand it over)
====================================================
□ Looking at the screen for 3 seconds, can you tell what the app is about (even with the logo and text hidden)?
□ Does the same white card repeat from top to bottom?
□ Is the main data shown as a shape, not just plain text?
□ Is every screen with a hero a screen where "one number or state" matters most? Do all screens start with the same hero?
□ Does the first main element show "the current state" or "what to do next"? Is there an empty state?
□ Does the main element's shape differ from screen to screen?
□ Are the text grays still neutral gray?
□ Are there any gradients or soft blurred color blobs?
□ Are there so many decorations that the text is hard to read?
□ At 320px, 375px and 430px widths, does anything overflow sideways or break (use minmax(0, 1fr) for grid columns)?
□ Are there any emoji or symbol characters?`;

type BuildPromptOptions = {
  /** ジサップオリジナルデザインの指定を差し込むか */
  useJisappDesign?: boolean;
  /** 保存方法。zisup = 端末をまたぐ保存、local = 同じ端末の localStorage */
  storage?: "zisup" | "local";
  /** グループのメンバー全員でデータを共有するか */
  shared?: boolean;
  /** 指示文の言語（英語なら、画面の文字も英語のアプリを作ってもらう） */
  locale?: Locale;
};

/**
 * チャットの回答から、AIに送る完成プロンプトを作る。
 */
export function buildPromptFromTemplate(
  appName: string,
  details?: string,
  options?: BuildPromptOptions
): string {
  const vi = options?.locale === "vi";
  // ベトナム語は英語の指示文をもとにする（画面はベトナム語にしてもらう）
  const en = options?.locale === "en" || vi;
  const placeholder = vi ? PROMPT_APP_NAME_PLACEHOLDER_VI : en ? PROMPT_APP_NAME_PLACEHOLDER_EN : PROMPT_APP_NAME_PLACEHOLDER;
  const name = appName.trim() || placeholder;
  let prompt = (vi ? PROMPT_TEMPLATE_VI : en ? PROMPT_TEMPLATE_EN : PROMPT_TEMPLATE).split(placeholder).join(name);

  const storage = getPromptStorage(options?.locale);
  const personalBlock = options?.storage === "local" ? storage.local : storage.cloud;
  // 共有する場合は共有のルールを先に置く（自分だけの設定などは、これまでの保存を使う）。
  // ファイル（Google ドライブ）の説明は共有のルールに入っているので、自分だけのデータの側からは外す（同じ説明を2回入れない）
  const personalForShared = personalBlock.replace(`\n${en ? PROMPT_DRIVE_FILES_EN : PROMPT_DRIVE_FILES}`, "");
  const storageBlock = options?.shared
    ? en
      ? `${storage.shared}\n\n(For data that is only yours and not shared)\n${personalForShared}`
      : `${storage.shared}\n\n（共有しない、自分だけのデータがある場合）\n${personalForShared}`
    : personalBlock;
  prompt = prompt.includes(PROMPT_STORAGE_MARKER)
    ? prompt.replace(PROMPT_STORAGE_MARKER, storageBlock)
    : `${prompt}\n\n${storageBlock}`;

  if (options?.useJisappDesign) {
    const design = vi ? PROMPT_JISAPP_DESIGN_VI : en ? PROMPT_JISAPP_DESIGN_EN : PROMPT_JISAPP_DESIGN;
    const designBlock = `${design}\n\n`;
    prompt = prompt.includes(storageBlock)
      ? prompt.replace(storageBlock, `${designBlock}${storageBlock}`)
      : `${prompt}\n\n${design}`;
  }

  const extra = details?.trim();
  if (extra && extra !== "なし" && extra.toLowerCase() !== "none" && extra.toLowerCase() !== "không") {
    const insert = en
      ? `

[Extra requests and specs (from the user)]
${extra}
- Reflect the requests above as much as you can. If they conflict, Jisapp's rules come first (single HTML file, no CDNs, API keys only via secret).`
      : `

【追加の要望・仕様（ユーザー入力）】
${extra}
・上記の要望をできるだけ反映してください。矛盾する場合はジサップのルール（シングルHTML・CDN禁止・APIキーは secret のみ）を優先してください。`;
    const marker = en
      ? "Follow the rules below and output the complete index.html"
      : "次のルールを守って、最初の返答で完成した index.html";
    if (prompt.includes(marker)) {
      prompt = prompt.replace(marker, `${insert.trim()}\n\n${marker}`);
    } else {
      prompt = `${prompt}${insert}`;
    }
  }

  return prompt;
}

/**
 * テンプレを使わず自分でプロンプトを書く人向け。
 * 要望文の末尾に貼り付けて使う必須ルール（短縮版）。
 */
export const PROMPT_RULES_SHORT = `【ジサップ必須ルール（必ず守ってください）】
・完成コードは必ず1つの index.html にまとめる（HTML/CSS/JSのファイル分割禁止）
・Tailwind・Bootstrapなど外部CDNは一切使わない。デザインは生のCSS（Vanilla CSS）で書く。${GOOGLE_FONTS_OK_JA}
・最初の返答で完成した index.html を省略せず出力する（保存について質問しない）
・別の端末でも残したいデータがある場合は window.Jisapp.saveData / loadData を使う（localStorageは使わない）
  保存: await window.Jisapp.saveData('識別名', データ)
  読込: await window.Jisapp.loadData('識別名')
  保存できるのは文字のデータだけ。1つの識別名は1MBまでなので、増え続けるデータは年ごとに識別名を分ける
・写真・動画・PDF などのファイルは、使う人の Google ドライブに保存する: const files = await window.Jisapp.drive.upload({ accept: 'image' })（'video'・'pdf'・'any' も使える。複数は multiple: true）。戻り値の [{ id, name, kind, url, thumbnail }] を保存し、img.src = file.thumbnail で表示、await window.Jisapp.drive.open(file) で開く（動画・PDF はアプリの中では表示できないので、必ず open を使う）
・同じ端末だけでよければ localStorage を使う（Jisapp の保存APIは使わない）
・APIキー・トークンをコードに絶対に書かない。外部APIは window.Jisapp.fetch(url, { secret: 'NAME' }) を使う
・secret 名は大文字英字（例: GEMINI, OPENAI, WEATHER）。キーの値はユーザーがジサップの「APIキー」画面で登録する
・コード出力後、APIキーが必要な場合は登録手順を短く案内する`;

/** 短いルールの、Google ドライブのファイル保存の文（ベトナム語版では、元の文 PROMPT_RULES_SHORT_NO_DRIVE_EN に戻す） */
const PROMPT_RULES_SHORT_DRIVE_EN = `  Only text data can be saved. Each key holds up to 1MB, so split growing data into one key per year
- Save files such as photos, videos or PDFs to the user's own Google Drive: const files = await window.Jisapp.drive.upload({ accept: 'image' }) ('video', 'pdf' or 'any' also work; multiple: true for several). Save the returned [{ id, name, kind, url, thumbnail }], show it with img.src = file.thumbnail, and open it with await window.Jisapp.drive.open(file) (videos and PDFs can't be shown inside the app, so always use open)`;
const PROMPT_RULES_SHORT_NO_DRIVE_EN = "  Only text data can be saved (no images or video). Each key holds up to 1MB, so split growing data into one key per year";

export const PROMPT_RULES_SHORT_EN = `[Jisapp rules (always follow these)]
- Put the finished code in a single index.html (don't split HTML/CSS/JS into files)
- Don't use any external CDN such as Tailwind or Bootstrap. Write the design in plain CSS (Vanilla CSS).${GOOGLE_FONTS_OK_EN}
- Output the complete index.html in your first reply without skipping anything (don't ask about saving)
- Write all text in the app's screens in English
- If data should stay across devices, use window.Jisapp.saveData / loadData (not localStorage)
  Save: await window.Jisapp.saveData('keyName', data)
  Load: await window.Jisapp.loadData('keyName')
${PROMPT_RULES_SHORT_DRIVE_EN}
- If the same device is enough, use localStorage (don't use Jisapp's save API)
- Never write API keys or tokens in the code. Call external APIs with window.Jisapp.fetch(url, { secret: 'NAME' })
- Secret names are uppercase (e.g. GEMINI, OPENAI, WEATHER). Users register the key's value on Jisapp's "API keys" screen
- After the code, if an API key is needed, briefly explain how to register it`;

export function getPromptRulesShort(locale: Locale = "ja"): string {
  if (locale === "vi") return PROMPT_RULES_SHORT_VI;
  return locale === "en" ? PROMPT_RULES_SHORT_EN : PROMPT_RULES_SHORT;
}

/** 開発スタジオUI用の短い説明文 */
export { SECRETS_STUDIO_GUIDE, SECRETS_STUDIO_GUIDE_EN } from "./studio-guides";
import { SECRETS_STUDIO_GUIDE, SECRETS_STUDIO_GUIDE_EN } from "./studio-guides";

export function getSecretsStudioGuide(locale: Locale = "ja"): string {
  return pick(locale, SECRETS_STUDIO_GUIDE, SECRETS_STUDIO_GUIDE_EN);
}

export const REPORT_TEMPLATE = `【研究テーマ】
（例：おこづかいを記録するアプリを作った）

【研究の目的】
（例：おこづかいを忘れがちなので、記録できるアプリが欲しかった）

【研究方法】
1. 困っていることを考えた
2. AI（ChatGPT など）にアプリのコードを作ってもらった
3. ジサップというサイトに貼り付けて動かした
4. 使いにくいところを直した

【結果】
（例：ボタンを押すと金額を記録でき、合計が表示される）

【感想】
（例：AIに頼ればアプリが作れることがわかった）

【提出物】
アプリのURL：________________`;

/*
 * ベトナム語版の AI 指示文。
 * AI が最も正確に従える英語の指示文をもとにし、作るアプリの画面はベトナム語にしてもらう。
 * ユーザーが入れる「作りたいもの」はベトナム語のままでよい（AI は理解できる）。
 * ジサップのルール（1ファイル・CDN 禁止・外部通信は Jisapp.fetch・保存はジサップの API）は英語版と同じ。
 */
export const PROMPT_APP_NAME_PLACEHOLDER_VI = "[GHI APP BẠN MUỐN TẠO VÀO ĐÂY]";

/** 画面をベトナム語にするための指定（英語版の「画面は英語で」の代わりに入れる） */
export const PROMPT_VIETNAMESE_UI = `Write all text in the app's screens (labels, buttons, messages, placeholders, alerts) in natural, friendly Vietnamese with correct diacritics (e.g. "Lưu", "Xóa", "Thêm mới"). Keep it short and casual, suitable for young users.
The user may describe the app in Vietnamese. Understand it and build exactly that. Write your explanations to the user (outside the code) in Vietnamese as well.

[Vietnamese display rules (required)]
- Set <html lang="vi"> and <meta charset="UTF-8">.
- Don't load any web fonts (no Google Fonts, no CDN). Use only system fonts that can display Vietnamese diacritics:
  font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  Do not use system-ui or a generic font first: on Windows set to Japanese or Chinese it becomes a CJK font that has no Vietnamese glyphs, and the diacritics break apart.
- Make inputs, buttons, textareas and selects use the same font (input, button, textarea, select { font: inherit; }).
- Use line-height around 1.5 so diacritics above and below letters aren't cut off. Don't set fixed heights that clip text on buttons or tags.
- Vietnamese words are separated by spaces. Never use word-break: break-all.
- Show dates as dd/mm/yyyy and numbers with "." as the thousands separator, using Intl.DateTimeFormat('vi-VN') and Intl.NumberFormat('vi-VN') (e.g. 1.000.000). Use Vietnamese đồng (₫) for money unless the user asks otherwise.
- Normalize text the user types with .normalize('NFC') before saving or comparing it.
- If the app has a search box, also match words typed without diacritics (e.g. "quan ly" finds "quản lý"): compare after removing combining marks (normalize('NFD') and remove /[\\u0300-\\u036f]/g) and replacing đ/Đ with d/D.
- Vietnamese is typed with input methods (Telex/VNI). Don't submit or search on Enter while text is still being composed (check event.isComposing).`;

const EN_UI_LINE = "Write all text in the app's screens (labels, buttons, messages) in natural English.";

export const PROMPT_TEMPLATE_VI = PROMPT_TEMPLATE_EN.split(PROMPT_APP_NAME_PLACEHOLDER_EN)
  .join(PROMPT_APP_NAME_PLACEHOLDER_VI)
  .replace(GOOGLE_FONTS_OK_EN, "")
  .replace(EN_UI_LINE, PROMPT_VIETNAMESE_UI);

/**
 * ベトナム語版のデザインの指定。2026-10-29 に日本語版・英語版を新しい指定（題材らしさ・素材・2つの書体など）に変えたとき、
 * ベトナム語版は変えないことにしたので、それまでの指定（英語版＋声調記号が崩れない書体への差し替え）をそのまま文として持つ。
 * ベトナム語は Google Fonts などの Web フォントを使わない（声調記号が崩れないように、端末に入っている書体だけを使う）
 */
export const PROMPT_JISAPP_DESIGN_VI = `[UI/UX design]
Build the design with Vanilla CSS only, following the spec below. Don't use external frameworks (Tailwind, etc.).

1. Overall concept
- A polished, colored design that doesn't rely on gradients. White cards float on a lightly tinted base, with a deep "main" color and a bright "accent" color for contrast.
- [Banned] Gradients (linear-gradient / radial-gradient) and rainbow-like use of many colors. Don't use frosted glass on cards or the whole-screen background (use frosted glass only in the places listed below).
- Where to use frosted glass: only on parts that float over the content (a header that stays at the top while scrolling, tabs or buttons fixed to the bottom, toasts, and the backdrop behind bottom sheets, modals, and menus).
  Floating parts use background: rgba(255,255,255,.72); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); with a 1px rgba(255,255,255,.6) border.
  The backdrop behind bottom sheets, modals, and menus uses background: rgba(17,24,39,.3); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);

2. Colors (always decide these 4 roles)
- Base: the whole-screen background. A very light tint of the main color (e.g. #eaf0e1).
- Main: a deep, dark color. Used for the hero card (if any), main buttons, and heading icons.
- Accent: a bright highlight color. Used for labels inside the hero, emphasis, and selected marks.
- Light main: the main color at about 10%. Used for secondary buttons, selected backgrounds, and chips.
- Cards are white (#fff). Text #111827, secondary text #6b7280, faint text #a1a1aa.
- Status colors are allowed: warning/delete red (#be123c on #fdecef), changed/pending orange (#d97706 on #fef3c7), info blue (#2563eb on #e8effd).
- If you need category colors, add at most 3 more (all muted).
- Examples to pick from by theme (base / main / accent):
  Sports #eaf0e1 / #14532d / #d9f35f, School/duty #e6efeb / #0f4c47 / #ffd447, Work/planner #e9ebf2 / #1f2b5c / #f3c552, Notes/records #f1ebe0 / #5b3a1f / #e7b93c, Money #eef1ea / #1e3a2f / #f2c14e, Food/shop #f6ece4 / #7c2d12 / #ffb703, Health #e8eef6 / #0b3a63 / #ff7a59, Study #ecebf6 / #312e81 / #fbbf24, Fandom #f6e9ef / #701a46 / #f9d5e5, Travel #e7f1f4 / #0e4a5c / #ffcf56, Family #f4efe6 / #3f4a2b / #f4a261, Game #e9e7f5 / #1e1b4b / #22d3ee

3. Hero card (only when it fits)
- If the app has information people want to see first when opening it (next event, days left, today's total, whose turn it is, etc.), show it large at the top of the screen on a card filled with the main color. Border-radius 24px, padding 18px, white text.
- At the top, an accent-colored pill label (e.g. "Next duty"); below it a big 44px, font-weight 800 number or date; below that, chips on a 14% white background.
- Draw a faint motif that fits the theme (lines, shapes) as an inline SVG in the background (opacity .06 to .15). For example: court lines, a grid, ruled lines.
- If there is no such information (tools like calculators or timers, input-centered apps, games, etc.), don't use it; put the most-used action (the input field, the main button, or the game screen) at the top instead.

4. Cards
- White, no border, border-radius 20px, padding 16px.
- Shadow: box-shadow: 0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06);
- Show state with the card background (your own items in light main, changes in orange, warnings in red).

5. Typography
- Font: -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif (system fonts only, in this order, so Vietnamese diacritics display correctly; never put system-ui first)
- Numbers 24 to 44px, font-weight 800, font-variant-numeric: tabular-nums. Headings 15px/800, body 14px, notes 12px.

6. Presentation
- Don't just list text. Show things visually: calendars, tables, bars, and person avatars (the name's initial in a circle, in a muted neutral color).

7. Buttons and inputs
- Main button: filled with the main color, white text, border-radius 16px, full width, vertical padding 15px, 15px/800. On :active, transform: scale(.985).
- Secondary buttons: light main background with main-colored text. Delete etc.: light red background with red text. Small options are pill-shaped chips.
- Inputs (input, textarea, select): no border, background #f4f5f2, border-radius 14px. On focus, the background turns white with a ring of box-shadow: 0 0 0 2px (main color).
- Tabs are a "segmented control": a light track where only the selected tab floats in white.

8. Header
- Keep it at the top while scrolling with position: sticky; top: 0; and give it a frosted glass background (as in section 1). On the left, a 36px main-colored square icon (radius 10px, white SVG inside); the app name at 16 to 18px/800. In group-shared apps, a pill with the user's name on the right.

9. Icons [strict]
- No emoji at all (like 📱 or ✨) and no symbol characters (like ★●✓). Every icon must be an inline SVG with a consistent stroke width (stroke-width="2" to "2.6") and round line caps (stroke-linecap="round").
- Icons next to headings use the main color.

10. Layout and animation
- Mobile-first (max-width: 640px; margin: 0 auto;). 16px side gutters, 12px gaps between cards.
- Content fades in slightly from below when shown (CSS animation @keyframes fadeIn). Newly added items rise in from below. Items in a list appear staggered by 70ms.
- Buttons and cards change state smoothly with transition: all .2s;

11. Components (use only what fits the app; don't include them all)
- To keep the code short, use only the components that are truly useful for this app. Don't write code for components you don't use.

[Use in almost every app]
- Toast: after saving, adding, deleting, copying, etc., show a short message like "Saved" near the bottom of the screen. Dark frosted glass (background: rgba(17,24,39,.8); backdrop-filter: blur(16px);) with white text, border-radius 999px. It rises in slightly from below and disappears after about 2 seconds. Show only one at a time.
- UI/UX animation: as in "10. Layout and animation". Keep motion to 0.2 to 0.3s; no overly slow or shaking motion. Stop motion when prefers-reduced-motion is on.
- Radio buttons: don't use the default round look. Show the options as pill-shaped chips or a segmented control; the selected one is filled with the main color with white text. Build them with input type="radio" wrapped in a label so they are easy to tap.
- Dropdown (select): same look as inputs (no border, background #f4f5f2, border-radius 14px), with a downward arrow (inline SVG) on the right. If there are 4 options or fewer, show chips instead of a dropdown.

[Use when the situation fits]
- Bottom sheet: on phones, prefer this over a centered modal for showing details, input forms, and lists of choices. A white sheet that slides up from the bottom (top corners radius 24px, a small horizontal handle at the top). Dim and blur the background as in section 1; close by tapping the background or swiping down.
- Modal: only for short confirmations such as confirming a delete. A centered white card (radius 24px) with "Cancel" (secondary button) and "Delete" (red text on light red) side by side. Dim and blur the background as in section 1; close with the Esc key or by tapping the background.
- Accordion: for things usually kept folded, such as long explanations, FAQs, or past records. Tap the heading row to open or close; the arrow (SVG) on the right rotates. Animate the height smoothly.
- Skeleton screen: where loading takes time, such as group-shared data, show gray rounded boxes (#eceee8, slowly changing brightness) in place of text so the layout is visible while loading. Don't use it where loading is instant.
- Autocomplete: for fields where people often re-enter the same things, such as member names, places, or item names. Show up to 5 matching suggestions in a white card right below the field; tapping one fills it in. Build suggestions from past input and existing data.
- Swipe action: swiping a list item left reveals buttons such as "Delete" (red). Always keep a button that does the same thing, for people who don't notice the swipe.
- Carousel: when you want to show cards side by side with swiping (this week's events, recommendations, etc.). Use scroll-snap so it stops one card at a time, with the next card slightly visible. Show dots for the current position below. Don't auto-advance.
- Hamburger menu: use when there are 5 or more screens that don't fit in tabs (with 4 or fewer, use segmented tabs). Put it on the right of the header; it opens a white panel (radius 24px) from the right. Highlight the current screen with the light main color. Dim and blur the background as in section 1; close by tapping the background or pressing Esc.`;

export const PROMPT_RULES_SHORT_VI = PROMPT_RULES_SHORT_EN.replace(`.${GOOGLE_FONTS_OK_EN}`, "").replace(PROMPT_RULES_SHORT_DRIVE_EN, PROMPT_RULES_SHORT_NO_DRIVE_EN).replace(
  "- Write all text in the app's screens in English",
  `- Write all text in the app's screens in natural Vietnamese with correct diacritics, and set <html lang="vi">
- Use only system fonts that display Vietnamese, in this order: -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif (not system-ui). line-height about 1.5
- Format dates and numbers with Intl (vi-VN): dd/mm/yyyy, 1.000`
);
