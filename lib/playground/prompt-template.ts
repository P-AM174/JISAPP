/** テンプレート内のアプリ名プレースホルダー */
export const PROMPT_APP_NAME_PLACEHOLDER = "【ここに作りたいアプリ名を入れる】";

/** 開発スタジオ・自由研究ガイド共通の AI 指示文（1プロンプト・逆質問型） */
export const PROMPT_TEMPLATE = `あなたはジサップ（Jisapp）向けの優秀なフロントエンドエンジニアです。
「${PROMPT_APP_NAME_PLACEHOLDER}」を作りたいです。

【最初の返答のルール（重要）】
・この最初の返答では、HTMLコードは絶対に出力しないでください。
・「データの保存機能は必要ですか？（次回開いても残したいデータがあるか）」について、はい/いいえで答えやすい形で質問してください。
・ユーザーが答えるまで、コードは書かないでください。

【外部API・AI連携が話題に出たとき（重要）】
・ユーザーが「AIを使って」「ChatGPT」「Gemini」「天気API」「地図」「外部サービスと連携」など、APIキーが必要になりそうな要望を出したときだけ、コードを書く前（または書いた直後）に次を短く案内してください。
・最初の返答の段階では、外部APIについて能動的に質問しないでください。

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

【コードを書くときのルール（ユーザーが答えた後に適用）】
ユーザーが質問に答えたあと、以下のジサップ専用ルールを厳守して、1つの index.html にすべてを含めたコードを出力してください。

【完全なHTML1枚（シングルファイル）で完結】
CSSもJavaScriptもファイル分割せず、すべて1つの「index.html」ファイルの中に丸ごと埋め込んでください。

【CDN・外部CSSフレームワークは一切使用禁止（重要）】
Tailwind CSSやBootstrapなどのCDN（外部読み込み）は、環境制限によりデザインが反映されない・エラーになるため絶対に使用しないでください。
デザインはすべて「生のCSS（Vanilla CSS）」で記述し、CSS変数（:root）などを活用して、初心者向けに明るく爽やかで洗練されたモダンなUI（ライトモード）を実装してください。

【データ保存（必要な場合のみ）】
・ユーザーが「保存機能が必要」と答えた場合のみ、window.Zisup.saveData / loadData を使用してください。
  ・保存: await window.Zisup.saveData('識別名', データ)
  ・読込: await window.Zisup.loadData('識別名')
  ※ async/await で読み込み完了を待ってから画面を表示してください。
・保存が不要と答えた場合は、localStorage も Zisup API も使わないでください。

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
 * ユーザー入力をテンプレートに組み込んだ完成プロンプトを生成する。
 * @param appName 作りたいアプリ名（必須）
 * @param details 仕様・デザイン・機能など（任意）
 */
export function buildPromptFromTemplate(appName: string, details?: string): string {
  const name = appName.trim() || PROMPT_APP_NAME_PLACEHOLDER;
  let prompt = PROMPT_TEMPLATE.split(PROMPT_APP_NAME_PLACEHOLDER).join(name);

  const extra = details?.trim();
  if (extra) {
    const insert = `

【追加の要望・仕様（ユーザー入力）】
${extra}
・上記の要望をできるだけ反映してください。矛盾する場合はジサップのルール（シングルHTML・CDN禁止・APIキーは secret のみ）を優先してください。`;
    // 「最初の返答のルール」の直前に挿入して、AIが要望を見落とさないようにする
    const marker = "【最初の返答のルール（重要）】";
    if (prompt.includes(marker)) {
      prompt = prompt.replace(marker, `${insert}\n\n${marker}`);
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
・最初の返答ではコードを出さず、「データの保存機能は必要ですか？」と質問する。ユーザーが答えるまでコードは書かない
・保存が必要と答えた場合のみ window.Zisup.saveData / loadData を使う（localStorageは使わない）
  保存: await window.Zisup.saveData('識別名', データ)
  読込: await window.Zisup.loadData('識別名')
・保存不要なら localStorage も Zisup の保存APIも使わない
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
