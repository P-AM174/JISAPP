// 縦動画（1080x1920）を作る。使い方: node make.cjs 台本ファイル.cjs 出力名
// 1) アプリを台本の時間どおりに動かしながら画面を記録（CDP の screencast）
// 2) 字幕と読み上げ（Open JTalk）・効果音を重ねて mp4 にする
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const V = path.resolve(__dirname, '..');
// 書き出し先と効果音の場所（リポジトリに入れないものは VIDEO_HOME に置ける）
const H = process.env.VIDEO_HOME || V;
const spec = require(path.resolve(process.argv[2]));
const name = process.argv[3];
const work = path.join(H, 'work', name); fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(path.join(work, 'frames'), { recursive: true });

// 画面の上に重ねる部品（字幕・全面の差し込み・指）
const OVERLAY = fs.readFileSync(path.join(__dirname, 'overlay.js'), 'utf8');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ja-JP' });
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  await page.goto(spec.url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (spec.prep) await spec.prep(page);
  await page.waitForTimeout(800);

  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => {
    frames.push({ ts: f.metadata.timestamp, data: f.data });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  await page.waitForTimeout(500);
  // 動きのない最初の1枚を確実にとる
  await page.evaluate(() => window.__nudge && window.__nudge());
  await page.waitForTimeout(200);

  const t0 = Date.now() / 1000;
  const events = [...spec.events].sort((a, b) => a.t - b.t);
  for (const ev of events) {
    const wait = t0 + ev.t - Date.now() / 1000;
    if (wait > 0) await page.waitForTimeout(wait * 1000);
    try { await ev.do(page); } catch (e) { console.error('event', ev.t, e.message); }
  }
  const end = t0 + spec.duration - Date.now() / 1000; if (end > 0) await page.waitForTimeout(end * 1000 + 300);
  await cdp.send('Page.stopScreencast');
  await b.close();

  // フレームを並べる（t0 より前は、直前の1枚を 0 秒の絵にする）
  const before = frames.filter(f => f.ts < t0), after = frames.filter(f => f.ts >= t0 && f.ts <= t0 + spec.duration);
  const seq = [...(before.length ? [{ ts: t0, data: before[before.length - 1].data }] : []), ...after];
  let list = '';
  seq.forEach((f, i) => {
    const file = path.join(work, 'frames', `f${String(i).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    const next = i + 1 < seq.length ? seq[i + 1].ts : t0 + spec.duration;
    list += `file '${file}'\nduration ${Math.max(0.001, next - f.ts).toFixed(4)}\n`;
  });
  list += `file '${path.join(work, 'frames', `f${String(seq.length - 1).padStart(5, '0')}.jpg`)}'\n`;
  fs.writeFileSync(path.join(work, 'frames.txt'), list);
  console.log('frames', seq.length);

  // 読み上げ
  // spec.voice が 'gemini' のときは Gemini TTS（GEMINI_API_KEY がなければ声なしで書き出す）。ほかは Open JTalk
  let vo = spec.vo;
  if (spec.voice === 'gemini') {
    if (process.env.NO_VOICE) { console.log('声なしで書き出します'); vo = []; }
    else {
      fs.writeFileSync(path.join(work, 'vo.json'), JSON.stringify(vo.map(v => ({ text: v.say ?? v.text, max: v.max, voice: spec.voiceName }))));
      try { console.log(execFileSync('python3', [path.join(__dirname, 'gemini_tts.py'), path.join(work, 'vo.json'), work]).toString()); }
      catch (e) { console.log('Gemini TTS が使えないので、声なしで書き出します'); vo = []; }
    }
  } else {
    fs.writeFileSync(path.join(work, 'vo.json'), JSON.stringify(vo.map(v => ({ text: v.text, speed: v.speed ?? 1.2 }))));
    console.log(execFileSync('python3.11', ['-P', path.join(__dirname, 'tts.py'), path.join(work, 'vo.json'), work], { cwd: path.join(V, 'tools') }).toString());
  }

  // 音をまとめる（読み上げ＋効果音）
  const inputs = [], filters = [];
  const add = (file, t, vol) => { const k = inputs.length / 2; inputs.push('-i', file); filters.push(`[${k}:a]aresample=48000,volume=${vol},adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[a${k}]`); };
  vo.forEach((v, i) => add(path.join(work, `vo${String(i).padStart(2, '0')}.wav`), v.t, spec.voVol ?? 1.6));
  spec.sfx.forEach(s => add(path.join(H, 'sfx', `${s.name}.wav`), s.t, s.vol ?? .9));
  const mix = `${filters.join(';')};${inputs.filter((_, i) => i % 2 === 1).map((_, k) => `[a${k}]`).join('')}amix=inputs=${inputs.length / 2}:normalize=0,alimiter=limit=0.95,apad,atrim=0:${spec.duration}[aout]`;
  const audio = path.join(work, 'audio.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', mix, '-map', '[aout]', '-ac', '2', audio]);

  // 動画にする
  const out = path.join(H, 'out', `${name}.mp4`); fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(work, 'frames.txt'), '-i', audio,
    '-vf', 'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-t', String(spec.duration), '-movflags', '+faststart', out]);
  console.log('done', out);
})();
