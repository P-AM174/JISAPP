# ベトナム語版（/vi）公開前のチェックリスト

ブランチ `feat/vietnamese-version`。ここに書いたことが済むまで、本番には出さない。

## 1. 本番に出す前にすること

### SQL（Supabase の SQL Editor で実行）

- `scripts/add-analytics-events.sql`
  - 計測の表と、運営画面の集計用の関数、通報の対応時刻（`app_reports.resolved_at`）を作る
  - 実行するまでは、計測は記録されないだけで、アプリの動作には影響しない

### 切り替えスイッチ（Vercel の環境変数。変えたら再デプロイ）

| 変数 | 初期値 | 意味 |
|---|---|---|
| `NEXT_PUBLIC_VI_PUBLIC` | なし（オフ） | `1` で正式公開。ブラウザの言語がベトナム語の人を /vi へ自動で案内し、サイトマップ・hreflang・検索エンジンに載せる。オフのあいだも、/vi を直接開けば見られる |
| `NEXT_PUBLIC_VI_SHOW_GAMES` | なし（オフ） | `1` でベトナム語ページにゲーム（ホームのゲーム欄・ゲームのカテゴリ・ゲームのアプリ）を出す。弁護士の確認（政令147号）が取れるまでオフ |
| `NEXT_PUBLIC_VI_BETA` | なし（表示する） | `0` でロゴ横の「Beta」を消す。ネイティブの確認が済んだら |

## 2. AI への指示文（vi）のテスト

開発スタジオ（`/vi/playground`）の「Tạo câu lệnh từ mẫu」（テンプレートから作る）で、下の 5 つを入れて指示文を作り、
ChatGPT・Gemini・Claude それぞれに送って、返ってきたコードをスタジオに貼る。

| # | 作りたいもの（ベトナム語のまま入れる） | 見るところ |
|---|---|---|
| 1 | App quản lý chi tiêu hằng ngày, có tổng theo tháng | 保存（再読み込みしても残る）、金額が 1.000 区切り・₫ |
| 2 | Thẻ học từ vựng tiếng Nhật, lật thẻ, đánh dấu từ đã thuộc | 声調記号の表示、ボタンの文字が切れない |
| 3 | Hẹn giờ Pomodoro 25 phút làm việc, 5 phút nghỉ | 画面の文言がすべてベトナム語 |
| 4 | Bảng điểm danh cho câu lạc bộ, cả nhóm cùng xem（「だれが使う」でグループを選ぶ） | グループ共有の保存 |
| 5 | Công cụ tính điểm trung bình học kỳ, thang điểm 10 | 小数の表示（vi では 8,5 のようにカンマ）、日付が dd/mm/yyyy |

全部に共通して確かめること

- [ ] 貼ってそのまま動く
- [ ] 画面の文言がベトナム語で、声調記号（ạ ầ ẩ ẫ ậ ơ ư đ）が崩れない（日本語版 Windows でも）
- [ ] `<html lang="vi">`、外部フォント・CDN を読み込んでいない
- [ ] AI の説明文（コードの外）もベトナム語

※ 日本語版 Windows では、フォントに `system-ui` を使うと日本語フォントになり、声調記号がばらけて表示される。
指示文では `system-ui` を使わないよう指定してある。AI が勝手に `system-ui` を使ったら、そのパターンを記録して指示文を直す。

## 3. 翻訳（ネイティブ確認）

- 辞書：`lib/i18n/dictionaries/vi.json`（1,406 文。すべて機械翻訳で未確認）
- 用語集：`lib/i18n/dictionaries/glossary.md`
- 未確認の一覧：`node scripts/i18n-extract.mjs --unreviewed`
- 確認したら `"reviewed": true` にする（取り込み `--merge` で確認済みの訳は上書きされない）
- コードの文を変えたら `node scripts/i18n-extract.mjs` で、辞書にない文が 0 件か確かめる
- 辞書ではなくコードに直接ベトナム語を書いた所（これも未確認）
  - `lib/categories.ts` の `nameVi`
  - `lib/seo/site.ts` の `SITE_*_VI`
  - `lib/playground/sample-app-vi.ts`（サンプルの割り勘アプリ）
  - `components/playground/prompt-builder-modal.tsx` の `APP_EXAMPLES_VI`
  - `app/og/site/[file]/route.tsx`（サイトの共有画像）
  - `app/og/apps/[file]/route.tsx`（アプリの共有画像の文言）
  - `app/api/auth/*/route.ts` の `EMAIL_VI`（メール）

## 4. まだできていないこと・判断が必要なこと

- **Zalo の共有**：Zalo の公式の共有ボタンは Zalo 公式アカウント（OA）の ID が必要で、ID なしで使える共有 URL は公開されていない。
  今は「スマホの共有シート（Zalo を選べる）を開き、使えなければ URL をコピーして案内」で代わりにしている。
  OA を作るなら、公式の共有ボタンに差し替えられる
- **Messenger の共有**：スマホのみ（Messenger アプリを開く）。PC で使うには Facebook アプリ ID が必要
- **Facebook・Zalo での共有プレビュー（OGP）の実機確認**：公開 URL でないと確認できない。公開後に Facebook のシェアデバッガーと Zalo で確認
- **利用規約・プライバシーポリシーのベトナム語版**：弁護士の確認待ち。今は英語版と「確認中」の表示を出している
- **個人データの同意の記録・削除依頼の窓口**：ベトナムの個人データ保護のルールに合わせた画面は未実装（弁護士の確認後に仕様を決める）
- **ユーザーごとの言語設定（DB）とアプリの言語の列**：本番 DB に列を足す前にコードが使うと公開処理などが止まるため、今回は足していない。
  - 言語はページの URL（/vi）と cookie で決め、メールはそのページの言語で送る
  - アプリの言語タグ・絞り込みは、アプリ名と説明文から推定している（`lib/i18n/text.ts` の `detectTextLang`）
- **ベトナム語のアプリを運営が数本用意して出品する**：アプリづくりは許可をもらってから
- **ベトナム語 LP を別 URL で出す**：今は `/vi` のトップが LP の役割。テスト用に別 URL が必要なら作る
- 日付の書式：`Intl.DateTimeFormat('vi-VN')` は 2/10/2026 のように 0 を付けない。dd/mm/yyyy に厳密にそろえるなら、日付を出している所を個別に直す
- 単位だけの短い文（「件」「人」「回」）など 7 か所は、ベトナム語ページでは英語のまま（`node scripts/i18n-extract.mjs --dynamic`）
- Google ログインでの新規登録は計測の `signup` に入っていない（メール登録のみ）

## 5. 計測

- 運営画面：`/admin/analytics`（ベトナムからの月間訪問数、言語別の利用の流れ、ベトナム語ページの流入元）
- 記録するもの：ページ表示（英語・ベトナム語ページと、ベトナムからのアクセスのみ）→ 指示文のコピー → スタジオに貼り付け → プレビュー → 公開 → 共有（チャネル別）→ 新規登録
- 英語・ベトナム語ページから共有したリンクには `utm_source`（facebook / messenger / zalo / x / copy など）がつく。日本語版の共有リンクは今までどおり
