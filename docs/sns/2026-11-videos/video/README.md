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
