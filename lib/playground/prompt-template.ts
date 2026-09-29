import type { Locale } from "@/lib/i18n/config";

/*
 * AI に渡す指示文。日本語版と英語版がある。
 * 英語で使っている人には英語の指示文を渡し、画面の文字も英語のアプリを作ってもらう。
 * アプリ内APIの正式名は window.Jisapp（旧名 window.Zisup も動く）。
 */

/** テンプレート内のアプリ名プレースホルダー */
export const PROMPT_APP_NAME_PLACEHOLDER = "【ここに作りたいアプリ名を入れる】";
export const PROMPT_APP_NAME_PLACEHOLDER_EN = "[PUT THE APP YOU WANT TO MAKE HERE]";

export const PROMPT_STORAGE_MARKER = "【データ保存】";

/** 端末をまたいで残す（ジサップの保存機能） */
export const PROMPT_STORAGE_ZISUP = `【データ保存（ジサップの保存機能を使う）】
・入力した内容・記録は、次回開いても残るようにする。
・保存と読み込みは window.Jisapp.saveData / window.Jisapp.loadData だけを使う。localStorage は使わない。
  ・保存: await window.Jisapp.saveData('識別名', データ)
  ・読込: await window.Jisapp.loadData('識別名')
・識別名は英数字で、アプリ内で一度決めたら変えない。
・画面を出す前に、必ず await で読み込みを完了させる。
・ログインしていると別の端末でも同じデータが読める。`;

export const PROMPT_STORAGE_ZISUP_EN = `[Saving data (use Jisapp's save feature)]
- Whatever the user enters or records must still be there the next time they open the app.
- Save and load ONLY with window.Jisapp.saveData / window.Jisapp.loadData. Do not use localStorage.
  - Save: await window.Jisapp.saveData('keyName', data)
  - Load: await window.Jisapp.loadData('keyName')
- Key names use letters and numbers only, and never change once chosen.
- Always finish loading with await before showing the screen.
- When the user is signed in, the same data can be read on other devices.`;

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
- Creating, inviting to and joining groups is handled by Jisapp's own screens, so do not build that into the app.`;

/** 表示言語に合わせた保存の指示文 */
export function getPromptStorage(locale: Locale = "ja") {
  const en = locale === "en";
  return {
    cloud: en ? PROMPT_STORAGE_ZISUP_EN : PROMPT_STORAGE_ZISUP,
    local: en ? PROMPT_STORAGE_LOCAL_EN : PROMPT_STORAGE_LOCAL,
    shared: en ? PROMPT_STORAGE_SHARED_EN : PROMPT_STORAGE_SHARED,
  };
}

/**
 * 今あるアプリを、グループ共有に対応させるための依頼文。
 * コードを渡すと末尾に付ける（AIに1回貼るだけで済むように）。
 */
export function buildSharedConvertMessage(code?: string, locale: Locale = "ja"): string {
  if (locale === "en") {
    const current = code?.trim()
      ? `[Current code]\n${code.trim()}`
      : "[Current code]\n(Paste your app's current code here)";
    return `Please rewrite this app so that everyone in a group can see and write the same data.
Keep the current features and look as they are, and switch the saving of data members should share to Jisapp's group sharing feature below.
Output the finished index.html from start to finish without leaving anything out.

${PROMPT_STORAGE_SHARED_EN}

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
Tailwind CSSやBootstrapなどのCDN（外部読み込み）は、環境制限によりデザインが反映されない・エラーになるため絶対に使用しないでください。
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
Never use CDNs such as Tailwind CSS or Bootstrap — because of environment limits, the design won't apply or it will error.
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

1. 全体コンセプト
「グラスモーフィズム（すりガラス）」を取り入れた、モダンで透過感のあるプロフェッショナルなデザイン。

2. コンポーネントの仕様（グラスモーフィズム）
・カード・ヘッダー・モーダル・サイドメニューなどの背景は半透明（rgba）にする。
・背景のぼかしとして backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); を適用する。
・境界線は 1px の薄い半透明の線にし、影は柔らかく控えめにする。

3. ボタン・入力UI
・メインボタンは角丸 9999px（完全なピル型）。ホバー時に transform: translateY(-2px) と影を少し濃くする。
・入力欄（input, textarea, select）はフォーカス時に枠線の色を変え、box-shadow: 0 0 0 3px の薄いリングを出して、背景を少し不透明にする。

4. タイポグラフィとアイコン【最重要】
・フォント: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif
・見出しや強調部分は font-weight: 700 または 800 を使用し、メリハリをつける。
・【厳守】絵文字（📱や✨など）は一切使用禁止。すべてのアイコンは、線の太さ（stroke-width="2"〜"2.5"）を統一したインラインSVGを使用すること。

5. レイアウトとアニメーション
・モバイルファースト設計（max-width: 640px; margin: 0 auto;）。
・コンテンツ表示時に下から少しフェードインするCSSアニメーション（@keyframes fadeIn）を適用する。
・ボタンやカードのホバー時は transition: all 0.2s; で滑らかに状態を変化させること。`;

export const PROMPT_JISAPP_DESIGN_EN = `[UI/UX design]
Build the design with Vanilla CSS only, following the spec below. Don't use external frameworks (Tailwind, etc.).

1. Overall concept
A modern, professional design with a see-through feel, using "glassmorphism" (frosted glass).

2. Components (glassmorphism)
- Make backgrounds of cards, headers, modals, side menus, etc. semi-transparent (rgba).
- Blur what's behind them with backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
- Use a thin 1px semi-transparent border, and soft, subtle shadows.

3. Buttons and inputs
- Main buttons have border-radius 9999px (full pill). On hover, apply transform: translateY(-2px) and a slightly stronger shadow.
- Inputs (input, textarea, select) change border color on focus, show a light ring with box-shadow: 0 0 0 3px, and become slightly more opaque.

4. Typography and icons [most important]
- Font: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif
- Use font-weight 700 or 800 for headings and emphasis to create contrast.
- [Strict] No emoji at all (like 📱 or ✨). Every icon must be an inline SVG with a consistent stroke width (stroke-width="2" to "2.5").

5. Layout and animation
- Mobile-first (max-width: 640px; margin: 0 auto;).
- Content fades in slightly from below when shown (CSS animation @keyframes fadeIn).
- Buttons and cards change smoothly on hover with transition: all 0.2s;`;

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
  const en = options?.locale === "en";
  const placeholder = en ? PROMPT_APP_NAME_PLACEHOLDER_EN : PROMPT_APP_NAME_PLACEHOLDER;
  const name = appName.trim() || placeholder;
  let prompt = (en ? PROMPT_TEMPLATE_EN : PROMPT_TEMPLATE).split(placeholder).join(name);

  const storage = getPromptStorage(options?.locale);
  const personalBlock = options?.storage === "local" ? storage.local : storage.cloud;
  // 共有する場合は共有のルールを先に置く（自分だけの設定などは、これまでの保存を使う）
  const storageBlock = options?.shared
    ? en
      ? `${storage.shared}\n\n(For data that is only yours and not shared)\n${personalBlock}`
      : `${storage.shared}\n\n（共有しない、自分だけのデータがある場合）\n${personalBlock}`
    : personalBlock;
  prompt = prompt.includes(PROMPT_STORAGE_MARKER)
    ? prompt.replace(PROMPT_STORAGE_MARKER, storageBlock)
    : `${prompt}\n\n${storageBlock}`;

  if (options?.useJisappDesign) {
    const design = en ? PROMPT_JISAPP_DESIGN_EN : PROMPT_JISAPP_DESIGN;
    const designBlock = `${design}\n\n`;
    prompt = prompt.includes(storageBlock)
      ? prompt.replace(storageBlock, `${designBlock}${storageBlock}`)
      : `${prompt}\n\n${design}`;
  }

  const extra = details?.trim();
  if (extra && extra !== "なし" && extra.toLowerCase() !== "none") {
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
・Tailwind・Bootstrapなど外部CDNは一切使わない。デザインは生のCSS（Vanilla CSS）で書く
・最初の返答で完成した index.html を省略せず出力する（保存について質問しない）
・別の端末でも残したいデータがある場合は window.Jisapp.saveData / loadData を使う（localStorageは使わない）
  保存: await window.Jisapp.saveData('識別名', データ)
  読込: await window.Jisapp.loadData('識別名')
・同じ端末だけでよければ localStorage を使う（Jisapp の保存APIは使わない）
・APIキー・トークンをコードに絶対に書かない。外部APIは window.Jisapp.fetch(url, { secret: 'NAME' }) を使う
・secret 名は大文字英字（例: GEMINI, OPENAI, WEATHER）。キーの値はユーザーがジサップの「APIキー」画面で登録する
・コード出力後、APIキーが必要な場合は登録手順を短く案内する`;

export const PROMPT_RULES_SHORT_EN = `[Jisapp rules (always follow these)]
- Put the finished code in a single index.html (don't split HTML/CSS/JS into files)
- Don't use any external CDN such as Tailwind or Bootstrap. Write the design in plain CSS (Vanilla CSS)
- Output the complete index.html in your first reply without skipping anything (don't ask about saving)
- Write all text in the app's screens in English
- If data should stay across devices, use window.Jisapp.saveData / loadData (not localStorage)
  Save: await window.Jisapp.saveData('keyName', data)
  Load: await window.Jisapp.loadData('keyName')
- If the same device is enough, use localStorage (don't use Jisapp's save API)
- Never write API keys or tokens in the code. Call external APIs with window.Jisapp.fetch(url, { secret: 'NAME' })
- Secret names are uppercase (e.g. GEMINI, OPENAI, WEATHER). Users register the key's value on Jisapp's "API keys" screen
- After the code, if an API key is needed, briefly explain how to register it`;

export function getPromptRulesShort(locale: Locale = "ja"): string {
  return locale === "en" ? PROMPT_RULES_SHORT_EN : PROMPT_RULES_SHORT;
}

/** 開発スタジオUI用の短い説明文 */
export const SECRETS_STUDIO_GUIDE =
  "外部API・AI（OpenAI、天気API、地図APIなど）を使うときは、右上の「…」メニューの「APIキーの登録」からキーを登録してください。コードには secret: 'API_NAME' のように名前だけ書き、値は書きません（API_NAME は登録名と同じ大文字）。";

export const SECRETS_STUDIO_GUIDE_EN =
  "To use external APIs or AI (OpenAI, weather or map APIs, etc.), register your key from “Register API key” in the “…” menu at the top right. In the code, write only the name, like secret: 'API_NAME' — never the value (API_NAME is the same UPPERCASE name you registered).";

export function getSecretsStudioGuide(locale: Locale = "ja"): string {
  return locale === "en" ? SECRETS_STUDIO_GUIDE_EN : SECRETS_STUDIO_GUIDE;
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
