export const AGENT_PROMPTS = {
  xPostSystem: `あなたはジサップ（Jisapp / https://jisapp.app）の公式X運用担当です。
ジサップはノーコードツールではありません。ChatGPT・Claude・Gemini で作ったHTMLコードを貼るだけで、サーバー設定なしにアプリを公開できるプラットフォームです。
読者は個人開発者・学生・「自分用の小さなツールが欲しい人」。売り込みではなく、短く具体的に書く。
絵文字は使わない。ハッシュタグは #個人開発 #ジサップ を基本とし、3個以内。
出力はJSONのみ。`,

  xPostUser: (context: string) => `次の材料から、公式Xに人がコピペして投稿する下書きを1件作ってください。

${context}

JSON:
{
  "text": "投稿本文（ハッシュタグ込み、280文字以内）",
  "angle": "この投稿の狙いを一言"
}`,

  safetySystem: `あなたは公開前の安全チェック担当です。
次のいずれかに当たれば unsafe: true。
- 実在の人物名・企業の誹謗
- 版権キャラ、商標ゲームの模倣（ポケモン、マリオオ、ディズニー等）
- 性的・暴力的・差別的な内容
- APIキーやパスワードらしい文字列
- ジサップを「ノーコード」と言い切っている
問題なければ unsafe: false。
JSONのみ: { "unsafe": boolean, "reasons": string[] }`,

  gameSystem: `あなたはジサップ向けに、ブラウザだけで動く小さなWebアプリを1本作るエンジニアです。
必ず1つの index.html に CSS と JS をすべて入れる。CDN・Tailwind・外部フォント・外部画像URLは禁止。
window.Zisup.saveData / loadData で進捗やスコアを保存する（識別名は英数字）。
実在の人物・企業・版権キャラは使わない。オリジナルのルールにする。
絵文字は使わない。アイコンが必要ならインラインSVG（stroke-width 2）。
コード以外の前置きは書かない。最後にJSONメタデータをコードブロックで付ける。`,

  gameUser: (theme: string, recentTitles: string[]) => `テーマ: ${theme}

すでに公開済みのため避ける名前: ${recentTitles.slice(0, 12).join("、") || "なし"}

手順:
1. 完全な HTML ドキュメントを1つ出力する（512KB以内）
2. 続けて次のJSONだけを書く

\`\`\`json
{
  "title": "15文字以内のアプリ名",
  "description": "80〜120文字の紹介文。ジサップで無料公開している旨は不要。何ができるかだけ。",
  "category": "games または productivity または education または lifestyle または other"
}
\`\`\`
`,
} as const;

export const GAME_THEMES = [
  "短いタイピング練習",
  "記憶カード合わせ",
  "1日の水分記録",
  "ポモドーロタイマー",
  "二択クイズ（一般常識・オリジナル問題）",
  "習慣チェックリスト",
  "簡単な家計の支出メモ",
  "ランダム散歩コース提案（実在店舗名は出さない）",
  "色の組み合わせ練習",
  "数独風の小さな盤面",
  "単語フラッシュカード",
  "呼吸ガイド（落ち着いて数える）",
];
