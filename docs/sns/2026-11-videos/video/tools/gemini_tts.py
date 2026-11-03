# 読み上げ音声を作る（Gemini TTS）。使い方: GEMINI_API_KEY=... python3 gemini_tts.py lines.json 出力フォルダ
# lines.json: [{"text": "...", "max": 2.0, "voice": "Vindemiatrix"}]
# 1文ずつ作って、前後の無音を削り、max 秒に入りきらないときは atempo で少し速くする（最大 1.45 倍）
import base64, json, os, subprocess, sys, time, urllib.request, wave
KEY = os.environ.get('GEMINI_API_KEY')
if not KEY: sys.exit('GEMINI_API_KEY がありません')
MODEL = os.environ.get('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts')
STYLE = '日本のショート動画のナレーション。明るく、はっきり、少し早口で。「ジサップ」は「じ・さっぷ」と、「ジ」を強めに読む。次の文だけを読んでください：'
lines = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]

def call(text, voice):
    body = {"contents": [{"parts": [{"text": f"{STYLE}{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    for k in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r: d = json.load(r)
            return base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
        except Exception as e:
            print('retry', k, e, file=sys.stderr); time.sleep(2 ** (k + 1))
    sys.exit('Gemini TTS に失敗しました')

def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))

for i, ln in enumerate(lines):
    raw = f"{out}/vo{i:02d}.raw.wav"
    w = wave.open(raw, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(call(ln['text'], ln.get('voice', 'Vindemiatrix'))); w.close()
    trim = f"{out}/vo{i:02d}.trim.wav"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', trim], check=True)
    d, mx = dur(trim), ln.get('max', 99)
    tempo = min(1.45, max(1.0, d / mx))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', trim, '-af', f'atempo={tempo:.3f}', f"{out}/vo{i:02d}.wav"], check=True)
    print(i, f"{d:.2f}s -> {d / tempo:.2f}s (max {mx}, x{tempo:.2f})", ln['text'])
