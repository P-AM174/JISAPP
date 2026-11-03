# 読み上げ音声を作る（Gemini TTS）。使い方: python3 gemini_tts.py lines.json 出力フォルダ
# キーは GEMINI_API_KEY か、環境の「ネットワークのシークレット」（x-goog-api-key ヘッダーを自動で付ける）のどちらか
# lines.json: [{"text": "...", "max": 2.0, "voice": "Vindemiatrix"}]
# 1文ずつ作って、前後の無音を削り、max 秒に入りきらないときは atempo で少し速くする（最大 1.45 倍）
import base64, hashlib, json, os, shutil, subprocess, sys, time, urllib.request, wave
KEY = os.environ.get('GEMINI_API_KEY')
MODEL = os.environ.get('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts')
STYLE = '日本のショート動画のナレーション。明るく、はっきり、少し早口で。次の文だけを、書いてあるとおりに読んでください：'
# 読み方の注意は、その言葉が入っている文のときだけ付ける（ほかの文に混ざって読まれないように）
HINTS = {'ジサップ': '（「ジサップ」は「じ・さっぷ」と読む）'}
def style(text): return ''.join(h for w, h in HINTS.items() if w in text) + STYLE
lines = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]

def call(text, voice):
    body = {"contents": [{"parts": [{"text": f"{style(text)}{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **({"x-goog-api-key": KEY} if KEY else {})})
    for k in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r: d = json.load(r)
            return base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
        except Exception as e:
            print('retry', k, e, file=sys.stderr); time.sleep(2 ** (k + 1))
    sys.exit('Gemini TTS に失敗しました')

# 作った声を Gemini に聞かせて、台本どおりに読めているか確かめる（言い間違い・抜け・固有名詞の読み）
def verify(f, text):
    if os.environ.get('TTS_VERIFY', '1') == '0': return True, ''
    a = base64.b64encode(open(f, 'rb').read()).decode()
    q = f"この音声は、次の台本どおりに読めていますか。言葉の抜け・言い間違い・聞き取れない所があれば NG。カタカナ語「ジサップ」は「じさっぷ」と聞こえれば OK。\n台本：{text}\n1行目に OK か NG、2行目に聞こえたとおりの書き起こしだけを書いてください。"
    body = {"contents": [{"parts": [{"inlineData": {"mimeType": "audio/wav", "data": a}}, {"text": q}]}]}
    for k in range(3):
        try:
            req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **({"x-goog-api-key": KEY} if KEY else {})})
            with urllib.request.urlopen(req, timeout=120) as r: t = json.load(r)["candidates"][0]["content"]["parts"][-1]["text"].strip()
            return t.upper().startswith('OK'), t.split('\n')[-1]
        except Exception as e: time.sleep(2 ** (k + 1))
    return True, '(確かめられませんでした)'

def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))

for i, ln in enumerate(lines):
    raw = f"{out}/vo{i:02d}.raw.wav"
    # 同じ文・同じ声は作り直さない（TTS_CACHE に残す）。作り直すときはそのファイルを消す
    cache = os.environ.get('TTS_CACHE'); voice = ln.get('voice', 'Vindemiatrix')
    cf = cache and os.path.join(cache, hashlib.sha1(f"{MODEL}|{voice}|{style(ln['text'])}|{ln['text']}".encode()).hexdigest()[:16] + '.wav')
    if cf and os.path.exists(cf): shutil.copy(cf, raw)
    else:
        for k in range(int(os.environ.get('TTS_TRIES', 4))):
            w = wave.open(raw, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(call(ln['text'], voice)); w.close()
            ok, heard = verify(raw, ln['text'])
            print(f"  check {i}-{k}: {'OK' if ok else 'NG'} {heard}", file=sys.stderr, flush=True)
            if ok: break
        if cf: os.makedirs(cache, exist_ok=True); shutil.copy(raw, cf)
    trim = f"{out}/vo{i:02d}.trim.wav"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', trim], check=True)
    # tempo があればその倍率で速くする。なければ max 秒に入るように（最大 TTS_MAX_TEMPO 倍）
    d, mx = dur(trim), ln.get('max', 99)
    tempo = ln['tempo'] if ln.get('tempo') else min(float(os.environ.get('TTS_MAX_TEMPO', 1.3)), max(1.0, d / mx))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', trim, '-af', f'atempo={tempo:.3f}', f"{out}/vo{i:02d}.wav"], check=True)
    print(json.dumps({'i': i, 'dur': round(d / tempo, 3)}), flush=True)
    print(i, f"{d:.2f}s -> {d / tempo:.2f}s (max {mx}, x{tempo:.2f})", ln['text'])
