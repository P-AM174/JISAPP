/**
 * 開発スタジオで選べるデザイン。
 * 「ジサップ」は題材に合わせて配色や形を決める今までのデザイン（PROMPT_JISAPP_DESIGN）、「指定しない」はデザインの指示を入れない。
 * ほかの6種は、見た目を決めたテンプレート（2026-11-17 追加）。プロンプトの【UI/UXデザインの指定】の部分だけを差し替え、
 * 保存・共有・ファイル・外部APIのルールは今までどおり（テンプレートの元の文にあった「localStorage を使う」などの行は、ジサップのルールとぶつかるので入れない）。
 * plan：のちに有料版で一部を解禁するときのための印（今は全部 free）。
 * ベトナム語のページでは使わない（今までのオン・オフのまま）。
 */

export type DesignId = "jisapp" | "minimal" | "utility" | "editorial" | "friendly" | "dark" | "bold" | "none";

export type DesignTemplate = {
  id: DesignId;
  name: string;
  nameEn: string;
  /** 向いているアプリ */
  fit: string;
  fitEn: string;
  /** 見本を大きく見たときの特徴（3つ） */
  points: [string, string, string];
  pointsEn: [string, string, string];
  /** 見本の画像（public/ からのパス）。「指定しない」はなし */
  image?: string;
  plan: "free" | "paid";
};

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "jisapp", name: "ジサップ", nameEn: "Jisapp",
    fit: "題材に合わせて配色を決める", fitEn: "Colors and shapes picked to suit your app",
    points: ["作るものに合わせて、色や形をAIが決める", "白いカードと、くっきりした配色", "日付や人などを、題材らしい形で見せる"],
    pointsEn: ["The AI picks colors and shapes to suit what you make", "White cards with clear, bold colors", "Dates, people and more shown in shapes that fit the theme"],
    image: "/design-templates/jisapp.webp", plan: "free",
  },
  {
    id: "minimal", name: "シンプル", nameEn: "Minimal",
    fit: "ToDo・メモ・家計簿向け", fitEn: "For to-dos, notes and budgets",
    points: ["白を基調にした、静かで端正な画面", "カードではなく、細い罫線で区切った一覧", "飾りや影はほとんどなく、中身が主役"],
    pointsEn: ["A calm, tidy screen based on white", "Lists divided by thin lines instead of cards", "Almost no decoration or shadows; the content leads"],
    image: "/design-templates/minimal.webp", plan: "free",
  },
  {
    id: "utility", name: "業務向け", nameEn: "Utility",
    fit: "シフト管理・在庫管理向け", fitEn: "For shifts and stock management",
    points: ["紺色のメニューと、白い管理画面", "表で、たくさんの情報をすっきり見せる", "状態・担当・期限で絞り込める"],
    pointsEn: ["A navy menu with a white work area", "Tables that show a lot of information neatly", "Filters by status, person and due date"],
    image: "/design-templates/utility.webp", plan: "free",
  },
  {
    id: "editorial", name: "雑誌風", nameEn: "Editorial",
    fit: "日記・旅行記・ポートフォリオ向け", fitEn: "For diaries, travel logs and portfolios",
    points: ["クリーム色の紙面に、セリフ体の大きな見出し", "細い罫線で区切る、ゆったりした一覧", "影や飾りは少なく、文字の組み方で見せる"],
    pointsEn: ["Big serif headings on a cream page", "Roomy lists divided by thin lines", "Few shadows or decorations; typography does the work"],
    image: "/design-templates/editorial.webp", plan: "free",
  },
  {
    id: "friendly", name: "やさしい", nameEn: "Friendly",
    fit: "ほしい物リスト・習慣管理向け", fitEn: "For wish lists and habit trackers",
    points: ["淡いピーチ色と、やさしい角丸", "「おかえり！」のあいさつと、小さな数字のカード", "子どもっぽすぎない、温かい雰囲気"],
    pointsEn: ["Soft peach colors and gentle rounded corners", "A short greeting and small number cards", "Warm without looking childish"],
    image: "/design-templates/friendly.webp", plan: "free",
  },
  {
    id: "dark", name: "ダーク", nameEn: "Dark",
    fit: "分析ツール・記録アプリ向け", fitEn: "For analysis tools and logs",
    points: ["チャコールの黒に、紫の差し色", "細い罫線で区切った、落ち着いた一覧", "夜に見ても目が疲れにくい"],
    pointsEn: ["Charcoal black with a purple accent", "Calm lists divided by thin lines", "Easy on the eyes at night"],
    image: "/design-templates/dark.webp", plan: "free",
  },
  {
    id: "bold", name: "ポップ", nameEn: "Bold",
    fit: "イベント・投票・ランキング向け", fitEn: "For events, votes and rankings",
    points: ["黒・白・鮮やかな黄色の、強いコントラスト", "太い文字と、角ばった黒い枠", "大きな見出しで、印象に残る画面"],
    pointsEn: ["Strong contrast in black, white and bright yellow", "Heavy type and sharp black frames", "Big headings that stick in the mind"],
    image: "/design-templates/bold.webp", plan: "free",
  },
  {
    id: "none", name: "指定しない", nameEn: "No preference",
    fit: "デザインの指示を入れない", fitEn: "Adds no design instructions",
    points: ["デザインの指示をプロンプトに入れない", "見た目はAIにまかせる", "ほかの指示（保存など）は今までどおり"],
    pointsEn: ["Leaves design instructions out of the prompt", "The AI decides the look", "Other rules (saving and so on) stay the same"],
    plan: "free",
  },
];

export const DEFAULT_DESIGN: DesignId = "jisapp";

export function isDesignId(v: unknown): v is DesignId {
  return typeof v === "string" && DESIGN_TEMPLATES.some((d) => d.id === v);
}

/* ───────── プロンプトに入れる文（6種のテンプレート） ───────── */

const COMMON_JA = `・ユーザーが求めた機能を実際に動作させる。ボタン、検索、タブ、フォームは見せかけにしない。空状態、エラー状態、確認、キーボード操作を考慮する。
・スマホで開かれることが多い。モバイル320pxからデスクトップまでレスポンシブにし、スマホの見た目を先に整える。文字の可読性、タップ領域、コントラスト、prefers-reduced-motion を考慮する。
・Tailwind、Bootstrap などの外部CSSフレームワークは使わない。Google Fonts だけは任意で使ってよい。
・アプリの題材に必要な画面・情報・機能を優先する。下の見本にある「タスク管理」などの言葉や項目を、関係のないアプリに流用しない。
・デザインの違いを配色だけで済ませず、ナビゲーション、情報密度、カードの使い方、文字、ボタン、余白まで、指定したスタイルに合わせる。
・データの保存・共有・ファイルの扱いは、このプロンプトの別の部分（データ保存）の決まりに従う。

【アイコン】
・絵文字（📱や✨など）や記号の文字（★●✓など）は一切使用禁止。すべてのアイコンは、線の太さ（stroke-width="2"〜"2.6"）と丸い線端（stroke-linecap="round"）を統一したインラインSVGを使用すること。
・見出しの横のアイコンはメイン色にする。`;

const CHECK_JA = `【仕上げチェック（出す前に確認する）】
□ 指定したスタイルの特徴（ナビゲーション・一覧の形・文字・角丸・影）が、配色以外でも出ているか
□ 見本の「タスク管理」の言葉や項目が、題材と関係なく残っていないか
□ 320px・375px・430px の幅で、横にはみ出したり崩れたりしていないか（グリッドの列は minmax(0, 1fr) にする）
□ 絵文字・記号の文字を使っていないか`;

const STYLE_JA: Record<Exclude<DesignId, "jisapp" | "none">, string> = {
  minimal: `【デザインテンプレート：Minimal】
目標：白を基調にした端正なタスク管理アプリのような外観。静かで機能的な商用アプリにする。
・背景 #F8F9FA、パネル #FFFFFF、文字 #202329、補足 #747983、罫線 #E8EAED、選択背景 #F0F1F3、強調 #22262C。
・デスクトップでは左に幅148〜176pxの細いサイドバー、右にコンテンツ。全体を白い大きなワークスペースとしてまとめる。スマホではサイドバーを折りたたみ、コンパクトなナビに変える。
・左上に小さな黒い四角アイコンとアプリ名。左メニューは細い線画アイコン＋テキスト、選択行のみ薄いグレー背景。
・メイン見出しは24〜28pxの太字。見出し下に「すべて／進行中／完了」のような文字タブを横並びにし、選択中だけ黒い下線。セグメント型の塗りタブは使わない。
・メイン情報はカードではなく、1pxの横罫線で区切ったフラットなリスト。チェックボックス、項目名、右端の日付や補足。各行の高さ44〜50px。
・追加は上部右の小さな黒塗りボタンと、リスト末尾の控えめなテキストリンク。角丸は6〜9px。影は原則なし。
・フォントはシステムのサンセリフ。本文14px、補足12px。余白は広すぎず、主役は内容そのもの。
・禁止：グラデーション、大きな統計カード、パステル、浮遊する装飾、絵文字、丸い巨大ボタン、カードの大量配置。`,
  utility: `【デザインテンプレート：Utility】
目標：紺色サイドバーとコンパクトな表を持つ業務管理SaaS。情報密度と操作効率が最優先。
・背景 #EEF3FA、コンテンツ #FFFFFF、サイドバー #173552、サイドバー選択 #294C70、主ボタン #2563EB、文字 #202938、罫線 #E2E7EE、薄い青 #E8F0FF。
・デスクトップでは左に幅160〜200pxの濃紺サイドバー。ロゴと、ダッシュボード・一覧・メンバー・レポート・設定などに相当する、題材に即した項目を配置。選択中は少し明るい紺の帯。
・メインは白い管理画面。上段に24px前後の見出しと右端の鮮やかな青の「新規作成」ボタン。
・見出しの下にコンパクトなフィルタ（状態、担当者、期限など）を横並び。枠線付きの小さな角丸4〜6pxのセレクトを使用。
・データは表が基本。列見出しは薄いグレー背景、行は横罫線で区切る。チェック、主項目、担当、日付、ステータスなどを揃える。ステータスは小さな青またはグレーのピル。
・表の数字・日付は桁を揃える。本文13〜14px。余白はコンパクト。操作性を損なう大きなヒーローや装飾カードは置かない。
・スマホでは表を横スクロール可能にするか、主要列を残した行レイアウトへ変換。サイドバーはドロワーにする。
・禁止：巨大な角丸、過度な影、抽象的なイラスト、グラデーション、情報より装飾を優先すること。`,
  editorial: `【デザインテンプレート：Editorial】
目標：クリーム色の紙面、写真、セリフ体の大きな英字見出しを持つ雑誌風のアプリ。
・背景 #F5F1EA、紙面 #FFFEFB、文字 #22201D、補足 #77716A、罫線 #DCD6CD、アクセント #8A6C52。
・デスクトップでは薄いクリーム色の大きな紙面を中央に置く。上部は細いナビゲーションを水平配置し、選択項目には短い下線。
・メイン領域は左右非対称のエディトリアル構図。左側に縦長の写真・画像・題材に合う静かなビジュアルを置き、右側に大きなセリフ体の見出しと短い導入文。写真が不要な題材では日付や余白を使った文字組みで代替し、無関係な写真を入れない。
・英字の大見出しは Georgia などのセリフ体、44〜60px、場合によってイタリック。日本語は読みやすい明朝系または上品なゴシック。本文は13〜15px。
・一覧は紙面に直接置き、細い横罫線と広めの行間で整理。チェックや小さな日付は目立たせすぎない。主ボタンも必要以上に派手にしない。
・角丸は0〜8px、影はほぼなし。大きな空白とタイポグラフィの緊張感を大切にする。
・スマホでは画像と文字を縦に並べ、見出しを34〜42pxに縮小する。
・禁止：管理画面風サイドバー、統計カードの乱用、青いSaaSボタン、グラデーション、無関係な装飾写真。`,
  friendly: `【デザインテンプレート：Friendly】
目標：淡いピーチ色、やさしい角丸、親しみのあるホーム画面。子どもっぽすぎない温かなアプリ。
・背景 #FFF6F1、サイド #FFF0E8、パネル #FFFFFF、文字 #34312E、補足 #7B746E、主色 #EA8B68、主色薄 #FFE2D2、緑 #8DBA90、線 #F1E5DE。
・デスクトップは淡いピーチ色の細いサイドバーと右のホーム領域。ロゴは小さなコーラル色の円形シンボル。選択メニューは淡いオレンジの角丸背景。
・メインの最初は「おかえり！」のような題材に合った短い挨拶と一文。見出しは22〜26px。右上に小さな雲や葉などの穏やかなSVG装飾を使ってよいが、機能に関係ない飾りは控えめに。
・その下に3つ程度の小さな統計カードを横並び。各カードに小さな線画アイコン、大きな数字、短いラベル。カードは白、角丸12〜16px、柔らかい影。
・リストは白い細長いピル寄りの行で、チェック、項目名、淡い日付チップを配置。追加ボタンはコーラル色の小さな丸みのあるボタン。
・角丸12〜18px、間隔10〜14px、本文14px。軽いアニメーションは許可するが過剰に弾ませない。
・スマホは統計3列を維持できない場合2列または横スクロールにする。
・禁止：ネオン、濃いダーク背景、過度なグラデーション、絵文字アイコン、巨大なヒーロー、装飾の盛りすぎ。`,
  dark: `【デザインテンプレート：Dark】
目標：チャコール黒と紫のアクセントによる落ち着いたダークUI。分析・記録ツールに似合う。
・画面背景 #17171C、サイドバー #1E1E25、メイン #202027、文字 #F4F2FA、補足 #A5A3B0、罫線 #34343D、アクセント #9065F2、選択 #3A315B、チップ #322B48。
・デスクトップでは左に幅145〜180pxの暗いサイドバー、右に一段明るいメイン領域。境界は薄い縦罫線。選択行はくすんだ紫の長方形。
・上段は24〜28pxの見出しと、右端に紫色の追加ボタン。文字タブを横に並べ、選択中だけ紫の下線を引く。
・一覧は暗い面に直接置き、細いダークグレーの横罫線で区切る。チェックボックスは細い線、チェック済みは紫で塗る。日付は控えめな紫チップまたはグレー文字。
・角丸は6〜9px。派手な発光やネオンは不要。必要ならボタンにごく弱い紫の影を付ける。
・本文14px、補足12px。コントラストを確保し、黒地に薄いグレー文字を使いすぎない。
・スマホではサイドバーを畳み、コンテンツを全幅表示。
・禁止：白いカードの羅列、明るい背景、グラデーション、強いグロー、ゲーム風の過剰な装飾。`,
  bold: `【デザインテンプレート：Bold】
目標：黒・白・鮮やかな黄色のネオブルータリズム。太い文字、角ばった枠、強いコントラスト。
・背景 #FFFDF1、サイドバー #101010、コンテンツ #FFFFFF、文字 #101010、黄色 #F8F51A、罫線 #161616、補足 #555555。
・デスクトップは黒いサイドバーと白いメイン画面。左上に白のアプリ名、メニューは白い線画アイコン。選択行は鮮やかな黄色の長方形で黒文字。
・メイン見出しは英字なら極太の斜体サンセリフ、40〜56px。日本語は太いゴシック。見出しを大きく、他の文字は13〜15pxに抑えてメリハリを付ける。
・追加ボタンは黄色背景、黒い太線の枠、角丸2〜4px。リストの各行も白背景に黒い1.5〜2pxの枠で囲い、間隔8〜10px。チェックボックスは角ばった黒枠。
・日付などの補足は右端の小さな白い黒枠ラベル。状態の強調に黄色を使う。装飾は画面の隅に黄色の斜めカット形状や短いストライプを少量だけ。
・影は使うなら黒の硬いオフセット影のみ。角丸は基本0〜4px。曖昧な半透明やソフトシャドウは避ける。
・スマホでは大見出しを32〜40pxに縮め、サイドバーをドロワー化。横はみ出しを防ぐ。
・禁止：パステル、丸いカード、ガラス効果、グラデーション、柔らかいSaaS風UI、黄色の使いすぎ。`,
};

const COMMON_EN = `- Make every feature the user asked for really work. Buttons, search, tabs and forms must not be fake. Handle empty states, errors, confirmations and keyboard use.
- The app is mostly opened on phones. Make it responsive from 320px mobile up to desktop, and get the phone layout right first. Mind readability, tap areas, contrast and prefers-reduced-motion.
- Do not use external CSS frameworks such as Tailwind or Bootstrap. Google Fonts are optional and allowed.
- Put the screens, information and features the app's subject needs first. Do not reuse words or items from the sample below (such as "Tasks") in an unrelated app.
- Do not make the difference only in colors. Match the given style in navigation, information density, how cards are used, type, buttons and spacing.
- For saving, sharing and files, follow the rules in the other part of this prompt (data storage).

[Icons]
- Never use emoji (such as 📱 or ✨) or symbol characters (such as ★ ● ✓). Every icon must be an inline SVG with a consistent stroke width (stroke-width="2" to "2.6") and round line caps (stroke-linecap="round").
- Icons next to headings use the main color.`;

const CHECK_EN = `[Final check (before you output)]
□ Does the given style show in more than colors (navigation, list shape, type, corner radius, shadows)?
□ Are words or items from the "Tasks" sample left over where they don't fit the subject?
□ At 320px, 375px and 430px widths, does anything overflow sideways or break (use minmax(0, 1fr) for grid columns)?
□ Are there any emoji or symbol characters?`;

const STYLE_EN: Record<Exclude<DesignId, "jisapp" | "none">, string> = {
  minimal: `[Design template: Minimal]
Goal: a tidy, white-based look like a polished task app. A calm, functional, professional app.
- Background #F8F9FA, panels #FFFFFF, text #202329, secondary text #747983, lines #E8EAED, selected background #F0F1F3, emphasis #22262C.
- On desktop, a thin sidebar 148-176px wide on the left and content on the right, all held together as one large white workspace. On phones, fold the sidebar into a compact navigation.
- A small black square icon and the app name at the top left. The left menu uses thin line icons plus text; only the selected row has a light gray background.
- Main heading 24-28px bold. Under it, text tabs side by side (like "All / Active / Done"), with a black underline only on the selected one. No filled segmented tabs.
- Main information is a flat list divided by 1px horizontal lines, not cards: checkbox, item name, and a date or note at the right end. Each row 44-50px tall.
- Adding is a small black button at the top right and a quiet text link at the end of the list. Corner radius 6-9px. Basically no shadows.
- System sans-serif fonts. Body 14px, notes 12px. Spacing not too wide; the content itself is the star.
- Not allowed: gradients, big stat cards, pastels, floating decorations, emoji, huge round buttons, lots of cards.`,
  utility: `[Design template: Utility]
Goal: a business admin tool with a navy sidebar and compact tables. Information density and efficiency come first.
- Background #EEF3FA, content #FFFFFF, sidebar #173552, selected in sidebar #294C70, primary button #2563EB, text #202938, lines #E2E7EE, light blue #E8F0FF.
- On desktop, a dark navy sidebar 160-200px wide on the left, with the logo and items that fit the subject (like a dashboard, lists, members, reports and settings). The selected item is a slightly lighter navy band.
- The main area is a white admin screen: a heading around 24px at the top and a bright blue "New" button at the right end.
- Under the heading, compact filters side by side (status, person, due date, etc.) as small bordered selects with 4-6px corners.
- Data is shown in tables. Column headers on a light gray background, rows divided by horizontal lines. Align columns such as checkbox, main item, person, date and status. Status is a small blue or gray pill.
- Align digits of numbers and dates. Body 13-14px. Compact spacing. No big heroes or decorative cards that get in the way.
- On phones, let tables scroll sideways or turn them into rows that keep the main columns. The sidebar becomes a drawer.
- Not allowed: huge rounded corners, heavy shadows, abstract illustrations, gradients, decoration over information.`,
  editorial: `[Design template: Editorial]
Goal: a magazine-like app with a cream page, photos and big serif headings.
- Background #F5F1EA, page #FFFEFB, text #22201D, secondary text #77716A, lines #DCD6CD, accent #8A6C52.
- On desktop, place a large light cream page in the center. A thin horizontal navigation at the top, with a short underline on the selected item.
- The main area uses an asymmetric editorial layout: a tall photo, image or quiet visual that fits the subject on the left, and a big serif heading with a short intro on the right. If the subject needs no photo, use type built from dates and white space instead; never add unrelated photos.
- Big English headings in a serif such as Georgia, 44-60px, sometimes italic. Japanese text in a readable Mincho or a refined Gothic. Body 13-15px.
- Lists sit directly on the page, organized with thin horizontal lines and generous line spacing. Don't make checkboxes or small dates stand out too much, and keep the main button modest.
- Corner radius 0-8px, almost no shadows. Value large white space and tension in the typography.
- On phones, stack image and text vertically and shrink headings to 34-42px.
- Not allowed: admin-style sidebars, overuse of stat cards, blue SaaS buttons, gradients, unrelated decorative photos.`,
  friendly: `[Design template: Friendly]
Goal: a home screen with pale peach colors, gentle rounded corners and a friendly feel. Warm without looking childish.
- Background #FFF6F1, side #FFF0E8, panels #FFFFFF, text #34312E, secondary text #7B746E, main #EA8B68, light main #FFE2D2, green #8DBA90, lines #F1E5DE.
- On desktop, a thin pale peach sidebar and a home area on the right. The logo is a small coral circle. The selected menu item has a pale orange rounded background.
- The main area starts with a short greeting that fits the subject (like "Welcome back!") and one sentence. Headings 22-26px. Small calm SVG decorations such as clouds or leaves may go at the top right, but keep decoration unrelated to features modest.
- Below that, about 3 small stat cards side by side, each with a small line icon, a big number and a short label. Cards are white with 12-16px corners and soft shadows.
- Lists use white, slim, pill-like rows with a checkbox, item name and a pale date chip. The add button is a small rounded coral button.
- Corner radius 12-18px, gaps 10-14px, body 14px. Light animation is fine, but don't overdo the bounce.
- On phones, if 3 stat columns don't fit, use 2 columns or sideways scrolling.
- Not allowed: neon, dark backgrounds, heavy gradients, emoji icons, huge heroes, too much decoration.`,
  dark: `[Design template: Dark]
Goal: a calm dark UI in charcoal black with a purple accent. Suits analysis and logging tools.
- Screen background #17171C, sidebar #1E1E25, main #202027, text #F4F2FA, secondary text #A5A3B0, lines #34343D, accent #9065F2, selected #3A315B, chips #322B48.
- On desktop, a dark sidebar 145-180px wide on the left and a slightly lighter main area on the right, separated by a thin vertical line. The selected row is a muted purple rectangle.
- At the top, a 24-28px heading with a purple add button at the right end. Text tabs side by side, with a purple underline only on the selected one.
- Lists sit directly on the dark surface, divided by thin dark gray horizontal lines. Checkboxes are thin outlines; checked ones are filled purple. Dates are subtle purple chips or gray text.
- Corner radius 6-9px. No flashy glow or neon. If needed, give buttons a very faint purple shadow.
- Body 14px, notes 12px. Keep contrast high and don't overuse pale gray text on black.
- On phones, fold the sidebar and show content full width.
- Not allowed: rows of white cards, light backgrounds, gradients, strong glow, over-the-top game-like decoration.`,
  bold: `[Design template: Bold]
Goal: neo-brutalism in black, white and bright yellow. Heavy type, sharp frames, strong contrast.
- Background #FFFDF1, sidebar #101010, content #FFFFFF, text #101010, yellow #F8F51A, lines #161616, secondary text #555555.
- On desktop, a black sidebar and a white main screen. The app name in white at the top left; menu items with white line icons. The selected row is a bright yellow rectangle with black text.
- Main heading in an extra-bold italic sans-serif for English, 40-56px; Japanese in a heavy Gothic. Make headings big and keep other text at 13-15px for contrast.
- The add button has a yellow background, a thick black border and 2-4px corners. Each list row is white with a 1.5-2px black border, 8-10px apart. Checkboxes are square black outlines.
- Notes such as dates are small white labels with black borders at the right end. Use yellow to highlight states. Decoration is only a little: yellow diagonal cut shapes or short stripes in the corners.
- If you use shadows, only hard black offset shadows. Corner radius basically 0-4px. Avoid vague transparency and soft shadows.
- On phones, shrink big headings to 32-40px and turn the sidebar into a drawer. Prevent sideways overflow.
- Not allowed: pastels, rounded cards, glass effects, gradients, soft SaaS-style UI, too much yellow.`,
};

/** 6種のテンプレートの【UI/UXデザインの指定】の文。ジサップ・指定しないは null（呼ぶ側で扱う） */
export function designTemplatePrompt(id: DesignId, en: boolean): string | null {
  if (id === "jisapp" || id === "none") return null;
  return en
    ? `[UI/UX design]\n${STYLE_EN[id]}\n\n[Rules for this design]\n${COMMON_EN}\n\n${CHECK_EN}`
    : `【UI/UXデザインの指定】\n${STYLE_JA[id]}\n\n【このデザインで守ること】\n${COMMON_JA}\n\n${CHECK_JA}`;
}
