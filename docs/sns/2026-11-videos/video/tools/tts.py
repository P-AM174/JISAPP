# 読み上げ音声を作る（Open JTalk）。使い方: python3.11 -P tts.py lines.json 出力フォルダ
import json, sys, wave, numpy as np, pyopenjtalk
lines = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[2]
for i, ln in enumerate(lines):
    x, sr = pyopenjtalk.tts(ln['text'], speed=ln.get('speed', 1.2), half_tone=ln.get('tone', 1.0))
    x = np.clip(x * 1.2, -32768, 32767).astype(np.int16)
    w = wave.open(f"{out}/vo{i:02d}.wav", 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(x.tobytes()); w.close()
    print(i, round(len(x) / sr, 2), ln['text'])
