# ベトナム語 用語集（glossary）

ジサップの主な言葉のベトナム語訳を固定するための表です。辞書（`vi.json`）の訳はこの表に合わせます。

- **すべて「案」です。** 機械翻訳で、ネイティブはまだ確認していません。確認が済んだ語は「確認」の欄に ✓ を付けてください。
- 口調: 若い人向けに、親しみやすく短く。二人称は堅すぎない **「bạn」** を使います（最終判断はネイティブの確認時に）。
- ブランド名は、ラテン文字の **Jisapp** に統一します（「ジサップ」はベトナム語ページに出しません）。
- 「日本発」は売りなので隠さずに出します（フッターなどに「Made in Japan」）。

## ブランド・画面

| 日本語 | English | Tiếng Việt（案） | 確認 |
|---|---|---|---|
| ジサップ | Jisapp | Jisapp | |
| 開発スタジオ | Studio | Studio (Xưởng tạo app) ※見出しは「Studio」、説明文では「xưởng tạo app」 | |
| マーケット | Market | Chợ app | |
| マイプロジェクト | My projects | Dự án của tôi | |
| マイライブラリ | My library | Thư viện của tôi | |
| マイページ | My page | Trang của tôi | |
| リクエスト掲示板（依頼掲示板） | Request board | Bảng yêu cầu app | |
| ログイン | Sign in | Đăng nhập | |
| 新規登録 | Sign up | Đăng ký | |
| ゲスト | Guest | Khách | |
| 運営 | Jisapp team | Đội ngũ Jisapp | |

## 作る・公開する

| 日本語 | English | Tiếng Việt（案） | 確認 |
|---|---|---|---|
| アプリ | app | app | |
| プロンプト／指示文 | prompt / instructions | câu lệnh (prompt) | |
| 専用プロンプト | Jisapp prompt | câu lệnh dành riêng cho Jisapp | |
| 貼り付け | paste | dán | |
| コピー | copy | sao chép | |
| プレビュー | preview | xem trước | |
| 公開 | publish | đăng | |
| URLのみ発行 | Get a URL only | Chỉ tạo link | |
| マーケットに出品 | List on the market | Đăng lên Chợ app | |
| 出品を取り下げる | Unlist | Gỡ khỏi Chợ app | |
| 下書き保存 | Save draft | Lưu nháp | |
| コード | code | code | |
| APIキー | API key | API key | |
| 保存データ | saved data | dữ liệu đã lưu | |
| 保存容量 | storage | dung lượng lưu trữ | |
| グループ共有 | group sharing | chia sẻ nhóm | |
| 招待リンク | invite link | link mời | |
| 表示名 | display name | tên hiển thị | |

## 応援バッジ（スタンプ）

| 日本語 | English | Tiếng Việt（案） | 確認 |
|---|---|---|---|
| スタンプ／応援 | stamp / cheer | sticker cổ vũ | |
| いいね！ | Love it! | Thích quá! | |
| 天才！ | Genius! | Thiên tài! | |
| 便利！ | So useful! | Tiện quá! | |
| デザインが好き！ | Great design! | Mê thiết kế! | |
| フォロー | follow | theo dõi | |

## カテゴリ（11）

`lib/categories.ts` の `nameVi` と同じです。

| 日本語 | English | Tiếng Việt（案） | 確認 |
|---|---|---|---|
| ビジネス | Business | Kinh doanh | |
| 生産性 | Productivity | Năng suất | |
| 生活 | Lifestyle | Đời sống | |
| 学習 | Learning | Học tập | |
| 統計 | Data & Stats | Dữ liệu & Thống kê | |
| AIツール | AI Tools | Công cụ AI | |
| エンタメ | Entertainment | Giải trí | |
| 趣味 | Hobbies | Sở thích | |
| スポーツ | Sports | Thể thao | |
| ゲーム | Games | Trò chơi（ベトナム語ページでは、フラグがオンになるまで出さない） | |
| その他 | Other | Khác | |

## ネイティブ確認の進め方

1. `node scripts/i18n-extract.mjs --unreviewed` で、未確認の訳を一覧にする
2. 直した訳を `vi.json` に書き、確認した項目の `"reviewed"` を `true` にする
3. この用語集の「確認」に ✓ を付ける
