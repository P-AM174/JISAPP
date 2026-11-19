# ジサップ公式コラムの作り方（Claude などのAIと人向けの手順書）

題材の決め方から、写真・見出し画像・下書きの保存までの手順。
本文の書き方の決まりは [writing-guide.md](writing-guide.md)（英語は [writing-guide-en.md](writing-guide-en.md)）を先に読む。
2026年11月に作ったコラム（サークルの鍵、Team Cricket、車出し当番、PTA引き継ぎ、部費の集金、合宿のしおり、今日どこ？ボード、夕飯ボード）の型。

## 1. 題材を決める

- **ジサップにある「グループで使うアプリ」を紹介する記事にする。** 新しく作るより、公式アプリ（作った人が「ジサップ公式」）や運営のアプリを先に使う
- ほかのユーザーが作ったアプリは、本人の許可なしに記事に出さない（参考にして公式で作り直すのはよい）
- 使われていない（グループが0件）アプリについて「使われている」と書かない
- 動画で反応がよかった題材（サークルの出欠、PTAの車出し・引き継ぎ）や、季節（年末・合宿・年度末）に合うものを選ぶ
- タグがかたよらないようにする

## 2. アプリの中身を確かめる

```bash
node --env-file=.env.local scripts/columns/fetch-app.mjs <アプリのID> <作業フォルダ>
```

説明文・グループの数・HTML が手元に来る。**記事に書く機能は、この HTML で確かめたことだけ。**
（例：「まだ入れていない人は『未入力』と出る」と書きかけたが、コードを読むと今日入力した人しか並ばない作りだった）

## 3. 本文を書く

[writing-guide.md](writing-guide.md) の構成と決まりで書く。写真を入れる場所には、行を分けて次のように書く。

```
![写真の下に出る説明]({{img:撮った写真の名前}})
```

プロンプトは、アプリのカードのすぐ下に入れる。

```
::app[アプリのID]

:::prompt このアプリのプロンプト
{{prompt}}
:::
```

## 4. プロンプトを作る

開発スタジオと同じ組み立て方の「ジサップのオリジナルプロンプト」（デザイン付き・グループ共有）を作る。機能の箇条書き（1行に1つ、「・」で始める）をファイルに書いて渡すと、「追加の要望・仕様」の欄に入る。

```bash
node --experimental-strip-types scripts/columns/prompt.ts "部費の集金" features.txt prompt-fee.txt ja
```

英語版は最後を `en` にする。

## 5. 写真を撮る

本物のアプリに架空のデータを入れて、スマホの大きさ（390×760 の2倍）で撮る。撮影の設定ファイルを作って、`shoot.mjs` に渡す。

```js
// shots.mjs（撮影の設定）。名前・チーム名はすべて架空にする
const fee = {
  fix: '2026-11-18T19:30:00+09:00', me: '高橋', group: 'バドミントン部',
  vals: { fee_config: { members: ['はると', 'あおい', 'そうた'], collections: [{ id: 'c3', title: '11月の部費', amount: 2000, due: '2026-11-20' }] } },
  items: { fee_paid: [['高橋', { cid: 'c3', name: 'はると', paid: true }, 120]] },
};
export const SHOTS = [
  { name: 'fee-top', html: '<アプリのID>.html', spec: fee },
  { name: 'fee-remind', html: '<アプリのID>.html', spec: fee, act: "document.getElementById('remind').click();" },
];
```

```bash
node scripts/columns/shoot.mjs shots.mjs shots
```

- データのキーと値の形は、アプリの HTML の `Jisapp.shared.add('キー', 値)` / `save('キー', 値)` を読んで合わせる
- `items` の1件は `[書いた人, 値, 何分前, id]`（id は、ほかの値から指したいときだけ）
- `act` で、タブを押す・スクロールする（`scrollIntoView()`）・ボタンを押すなど、撮る前の操作を書ける
- 撮った写真は必ず目で見て、中身が見えていない・崩れているものは撮り直す

## 6. 記事の写真と見出し画像を作る

```bash
node scripts/columns/images.mjs cover.json shots out
```

```json
{ "key": "fee", "bg": "#eef0fb", "dot": "#4f46e5", "hi": "#ffb4c8",
  "phones": [["まだの人が<b>ひと目で</b>", "fee-members"], ["集まった額も<b>自動</b>", "fee-top"], ["催促文も<b>ワンタップ</b>", "fee-remind"]],
  "photos": ["fee-top", "fee-members", "fee-remind"] }
```

- **記事の写真**：1200×1000 の台紙の真ん中にスマホ画面（webp）。1本に2〜3枚
- **見出し画像**：1200×628 の jpg。点々の地に、黒いピルのラベル（`<b>` の部分だけ色を変える）と、黒ふちのスマホを1〜3台
- 台紙の色（bg）は、アプリの色に合わせてうすくする

## 7. 下書きで保存する

```bash
node --experimental-strip-types --env-file=.env.local scripts/columns/save-draft.mjs post.json
```

```json
{ "slug": "club-fee-app", "locale": "ja", "tags": ["サークル", "お金"],
  "description": "検索結果に出る説明（日本語100字・英語150字くらい）",
  "xText": "Xの投稿文",
  "body": "fee.md", "prompt": "prompt-fee.txt", "images": "out", "cover": "out/cover-fee.jpg" }
```

- 写真と見出し画像を上げ、本文の `{{img:…}}` と `{{prompt}}` を差しかえて、**下書き**で保存する。公開中の記事は書きかえない
- 保存のあと、記事ページと同じ読み方で形を確かめ、画像が全部開けるかも見る
- **公開は人が管理画面でする。** 管理画面は管理者パスワードが要るので、AIは見た目を確かめられない。そのことを伝える

## 8. Xの投稿文

- note のように、場面から入る。最後は「〜の話を書きました」と、絵文字を1つ
- 改行を多めにして、1〜2行ずつ区切る
- 英語版は、届けたい集まりのハッシュタグを3〜4個つける（例：`#ClubCricket #VibeCoding #NoCode #ChatGPT`。アプリを使う人の集まり＋AIでアプリを作る人の集まり）
- 280字まで（リンクは自動でつくので書かない）

例：

```
「鍵いまだれ持ってる？」
サークルのLINEに送ったのは、練習の15分前。

既読はつくのに、だれも返事をしない。
たぶん、みんな「自分じゃない」と思ってる。

部室の鍵と練習室の予約を、
みんなのスマホで同じ画面にする話を書きました🎸
```
