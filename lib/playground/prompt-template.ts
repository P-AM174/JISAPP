/** テンプレート内のアプリ名プレースホルダー */
export const PROMPT_APP_NAME_PLACEHOLDER = "【ここに作りたいアプリ名を入れる】";

export const PROMPT_STORAGE_MARKER = "【データ保存】";

/** 端末をまたいで残す（ジサップの保存機能） */
export const PROMPT_STORAGE_ZISUP = `【データ保存（ジサップの保存機能を使う）】
・入力した内容・記録は、次回開いても残るようにする。
・保存と読み込みは window.Zisup.saveData / window.Zisup.loadData だけを使う。localStorage は使わない。
  ・保存: await window.Zisup.saveData('識別名', データ)
  ・読込: await window.Zisup.loadData('識別名')
・識別名は英数字で、アプリ内で一度決めたら変えない。
・画面を出す前に、必ず await で読み込みを完了させる。
・ログインしていると別の端末でも同じデータが読める。`;

/** 同じ端末のブラウザ内だけ残す */
export const PROMPT_STORAGE_LOCAL = `【データ保存（この端末のブラウザ内だけ）】
・window.Zisup.saveData / loadData は使わない。
・残したいデータは localStorage を使う。
  ・保存: localStorage.setItem('識別名', JSON.stringify(データ))
  ・読込: JSON.parse(localStorage.getItem('識別名') || 'null')
・識別名は英数字で、アプリ内で一度決めたら変えない。
・同じスマホ・パソコンの同じブラウザでだけ残る。別の端末やブラウザでは引き継がれない。`;

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
2. 上部の「プレビュー更新」ボタンの横にある「APIキー」を開く
3. 次の内容でキーを登録する
   ・名前（大文字）: 【WEATHER / OPENAI / MAPS など、コードで使う名前】
   ・値: 取得したAPIキー（AIza... / sk-... など）
   ・付け方: サービスの仕様に合わせて選ぶ
     - URLパラメータ型（Google Gemini 等） → 「URLパラメータ」、パラメータ名「key」
     - Authorization ヘッダー型（OpenAI 等） → 「HTTPヘッダー」
4. 「プレビュー更新」で動作確認する

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
・外部APIを使うコードでは、必ず window.Zisup.fetch の secret オプションを使ってください。
  例: const res = await window.Zisup.fetch('https://api.example.com/data', { secret: 'WEATHER' });
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
2. 「プレビュー更新」の横「APIキー」を開く
3. 名前（コード内の secret 名と同じ。例: WEATHER, OPENAI, MAPS など）でキーを登録
4. 「プレビュー更新」で確認
※ キーをコードに直接書かないでください
---

【外部API連携の実装手順】
  1. まず通常の fetch(url) を試す（API側がCORS対応している場合のみ）。
  2. CORSエラーになる、またはAPIキーが必要な場合は window.Zisup.fetch(url, { secret: 'NAME' }) を使う。
  ※ URLは https のみ。`;

/**
 * ジサップオリジナルデザイン（オーロラグラデーション＋グラスモーフィズム）の指定。
 * 自分でデザインしたい人は使わないため、テンプレートには任意で差し込む。
 */
export const PROMPT_JISAPP_DESIGN = `【UI/UXデザインの厳格な指定】
以下の仕様に従って、Vanilla CSSのみでデザインを構築してください。外部フレームワーク（Tailwind等）は使用しないでください。

1. 全体コンセプト
「オーロラグラデーション」と「グラスモーフィズム（すりガラス）」を組み合わせた、モダンで透過感のあるプロフェッショナルなデザイン。

2. カラーパレット & CSS変数
:root {
  /* ベースカラー（エメラルドグリーンとブルーの爽やかな組み合わせ） */
  --color-primary: #059669; /* メインカラー（エメラルド） */
  --color-teal: #06b6d4;    /* アクセントカラー（ティール） */

  /* 状態表示カラー */
  --danger: #ef4444;        /* エラーや削除などの危険操作 */
  --success: #10b981;       /* 完了や成功 */

  /* グラデーション */
  --grad-primary: linear-gradient(135deg, #059669 0%, #3b82f6 50%, #10b981 100%);
  --grad-button: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);

  /* グラスモーフィズム（すりガラス）用の透明カラー */
  --bg-card: rgba(255, 255, 255, 0.75);   /* カードやモーダルの背景 */
  --bg-input: rgba(255, 255, 255, 0.6);   /* 入力欄やボタンの背景 */
  --border-glass: rgba(255, 255, 255, 0.5); /* 薄い白枠線 */
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.07); /* 柔らかい影 */

  /* テキストカラー */
  --text-main: #0f172a;  /* 見出しやメインテキスト（濃いグレー） */
  --text-sub: #334155;   /* サブテキスト */
  --text-light: #64748b; /* 補足やプレースホルダーなど（薄いグレー） */
}

3. 背景スタイル・全体設定
body {
  /* 全体のフォント設定（OS標準のきれいなフォントを優先） */
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  color: var(--text-main);
  -webkit-font-smoothing: antialiased; /* 文字をきれいにレンダリング */

  margin: 0;
  padding: 0;
  min-height: 100vh;

  /* 背景ベースカラー（淡いブルーグレー） */
  background-color: #e0e7ff;

  /* メッシュグラデーション（4つの淡い光の玉を配置） */
  background-image:
    radial-gradient(at 10% 0%, rgba(5, 150, 105, 0.25) 0px, transparent 50%), /* 左上：エメラルド */
    radial-gradient(at 90% 10%, rgba(16, 185, 129, 0.25) 0px, transparent 50%), /* 右上：グリーン */
    radial-gradient(at 80% 90%, rgba(244, 63, 94, 0.15) 0px, transparent 50%),  /* 右下：ほんのりピンク */
    radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.25) 0px, transparent 50%); /* 左下：ブルー */

  /* スクロールしても背景のグラデーションを固定する */
  background-attachment: fixed;
}

4. コンポーネントの仕様（グラスモーフィズム）
・カード・ヘッダー・モーダル・サイドメニューなどの背景は必ず --bg-card や --bg-input などの半透明な白（rgba）にする。
・背景のぼかしとして必ず backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); を適用する。
・境界線は border: 1px solid var(--border-glass); を適用する。
・ヘッダーの最上部には header::before で高さ3pxの --grad-primary のラインを引く。

5. ボタン・入力UI
・メインボタンは --grad-button を背景にし、文字は白。ホバー時に transform: translateY(-2px) と影を濃くする。角丸は 9999px（完全なピル型）。
・入力欄（input, textarea, select）はフォーカス時に border-color: var(--color-teal); および box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.3); を適用し、背景を白（rgba不透明度0.9程度）に変化させる。

6. タイポグラフィとアイコン【最重要】
・フォント: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif
・見出しや強調部分は font-weight: 700 または 800 を使用し、メリハリをつける。
・【厳守】絵文字（📱や✨など）は一切使用禁止。すべてのアイコンは、線の太さ（stroke-width="2"〜"2.5"）を統一したインラインSVGを使用すること。

7. レイアウトとアニメーション
・モバイルファースト設計（max-width: 640px; margin: 0 auto;）。
・コンテンツ表示時に下から少しフェードインするCSSアニメーション（@keyframes fadeIn）を適用する。
・ボタンやカードのホバー時は transition: all 0.2s; で滑らかに状態を変化させること。`;

type BuildPromptOptions = {
  /** ジサップオリジナルデザインの指定を差し込むか */
  useJisappDesign?: boolean;
  /** 保存方法。zisup = 端末をまたぐ保存、local = 同じ端末の localStorage */
  storage?: "zisup" | "local";
};

/**
 * チャットの回答から、AIに送る完成プロンプトを作る。
 */
export function buildPromptFromTemplate(
  appName: string,
  details?: string,
  options?: BuildPromptOptions
): string {
  const name = appName.trim() || PROMPT_APP_NAME_PLACEHOLDER;
  let prompt = PROMPT_TEMPLATE.split(PROMPT_APP_NAME_PLACEHOLDER).join(name);

  const storageBlock =
    options?.storage === "local" ? PROMPT_STORAGE_LOCAL : PROMPT_STORAGE_ZISUP;
  prompt = prompt.includes(PROMPT_STORAGE_MARKER)
    ? prompt.replace(PROMPT_STORAGE_MARKER, storageBlock)
    : `${prompt}\n\n${storageBlock}`;

  if (options?.useJisappDesign) {
    const designBlock = `${PROMPT_JISAPP_DESIGN}\n\n`;
    prompt = prompt.includes(storageBlock)
      ? prompt.replace(storageBlock, `${designBlock}${storageBlock}`)
      : `${prompt}\n\n${PROMPT_JISAPP_DESIGN}`;
  }

  const extra = details?.trim();
  if (extra && extra !== "なし") {
    const insert = `

【追加の要望・仕様（ユーザー入力）】
${extra}
・上記の要望をできるだけ反映してください。矛盾する場合はジサップのルール（シングルHTML・CDN禁止・APIキーは secret のみ）を優先してください。`;
    const marker = "次のルールを守って、最初の返答で完成した index.html";
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
・別の端末でも残したいデータがある場合は window.Zisup.saveData / loadData を使う（localStorageは使わない）
  保存: await window.Zisup.saveData('識別名', データ)
  読込: await window.Zisup.loadData('識別名')
・同じ端末だけでよければ localStorage を使う（Zisup の保存APIは使わない）
・APIキー・トークンをコードに絶対に書かない。外部APIは window.Zisup.fetch(url, { secret: 'NAME' }) を使う
・secret 名は大文字英字（例: GEMINI, OPENAI, WEATHER）。キーの値はユーザーがジサップの「APIキー」画面で登録する
・コード出力後、APIキーが必要な場合は登録手順を短く案内する`;

/** 開発スタジオUI用の短い説明文 */
export const SECRETS_STUDIO_GUIDE =
  "外部API・AI（OpenAI、天気API、地図APIなど）を使うときは、「プレビュー更新」の横「APIキー」にキーを登録してください。コードには secret: 'API_NAME' のように名前だけ書き、値は書きません（API_NAME は登録名と同じ大文字）。";

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
