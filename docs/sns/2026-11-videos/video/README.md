# 動画の作り方（動画1〜5）

アプリを台本どおりの時間に自動で操作しながら画面を記録し（Chromium の screencast）、字幕・読み上げ・効果音を重ねて、
縦 1080×1920・30fps の mp4 にする。

- `specs/v1.cjs`〜`v5.cjs`：各動画の台本（何秒に何をするか・字幕・読み上げ・効果音）
- `specs/common.cjs`：差し込み画面（AI への一文・ジサップに貼る・公開・コメント・コードのコピー）。ジサップの画面は `studio/` の画像を使う
- `tools/make.cjs`：記録して mp4 にする。`tools/overlay.js`：撮影のときだけ足す字幕・全面の差し込み・指・カメラのズーム
- `tools/tts.py`：読み上げ（Open JTalk。`pip install pyopenjtalk-prebuilt "numpy<2"`、Python 3.11）。`tools/sfx.py`：効果音

使い方（作業用フォルダに `tools`・`specs`・`sfx`・`studio` を置いて）

```
python3.11 -P tools/sfx.py sfx
cd tools && node make.cjs ../specs/v1.cjs v1   # out/v1.mp4 ができる
```

ゲームは `?video=1` を付けて開くと、「あなた」が歩く速さが台本に合わせてゆっくりになる（ふだんは付けない）。
読み上げは Open JTalk の標準の声（男性）。本番では、好きな声で録り直して差し替えてもよい。

## 型「場面 → 数字の得」v1 で作った旅行代の精算（20秒）

- 画面：`travel-stage.html`（上にラベル「旅行の幹事へ」と字幕、真ん中に `../travel-split.html` を入れたスマホを最後まで固定、右上に「精算済み 0→3人」、大きな文字、終わりの検索窓）
- 台本と動き：`specs/t20.cjs`（声と字幕は同じ文。表は `VO`）
- 声：Gemini TTS の Vindemiatrix（`tools/gemini_tts.py`）。1文ずつ作り、前後の無音を削って、その画面の長さに入らないときだけ少し速くする（最大 1.3 倍、`TTS_MAX_TEMPO` で変えられる）。作った声は `VIDEO_HOME/tts-cache` に残し、同じ文は作り直さない

```bash
cd docs/sns/2026-11-videos/video/tools
GEMINI_API_KEY=（環境の設定に入れたもの） VIDEO_HOME=書き出し先 node make.cjs ../specs/t20.cjs t20
```

`GEMINI_API_KEY` がないときは、字幕と効果音だけで書き出す（声なし版）。`VIDEO_HOME` には `sfx/`（効果音）を置き、`out/` と `work/` が作られる。
声を作るたびに「ジサップ」の発音を聞いて確かめる。

声の長さに合わせて、全体は 21.6 秒にした（`specs/t20.cjs` の `FROM`→`TO` で画面の区切りをずらしている）。
「ジサップ」の発音は、Gemini（gemini-3.5-flash）に書き起こさせて確かめた。14〜17秒の文は何回か作り直し、「ジサップ」と聞き取れたものを使っている。

### 改訂（冒頭で「自分で作れる」・共有の一言）

`specs/t22.cjs` が今の版（約24秒）。全11文。
- 冒頭を「友達との旅行、立て替え4件。精算アプリ、自分で作れる。」にした
- 「入れた立て替えは、みんなのスマホで共有。」を足した。`travel-split.html` はグループで開くと `Jisapp.shared` で共有する
- 声は先に作り（`spec.build`）、1文ずつの長さで画面の時間割を決める。速さは `tempo`（1.2倍）。早口の指示は声がくずれるので、ふつうに読ませてから速める
- 作った声は1文ずつ Gemini（gemini-3.5-flash）に聞かせて台本どおりか確かめ、だめなら作り直す（`TTS_TRIES` 回まで、`TTS_VERIFY=0` で確かめない）
