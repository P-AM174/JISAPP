// 読み上げを抜いた版（効果音だけ）を作る。映像は作ってある mp4 をそのまま使う。使い方: node novo.cjs 台本ファイル.cjs 名前
const path = require('path'), { execFileSync } = require('child_process');
const V = path.resolve(__dirname, '..');
const spec = require(path.resolve(process.argv[2])), name = process.argv[3];
const inputs = [], filters = [];
spec.sfx.forEach((s, k) => { inputs.push('-i', path.join(V, 'sfx', `${s.name}.wav`)); const ms = Math.round(s.t * 1000); filters.push(`[${k + 1}:a]aresample=48000,volume=${s.vol ?? .9},adelay=${ms}|${ms}[a${k}]`); });
const mix = `${filters.join(';')};${spec.sfx.map((_, k) => `[a${k}]`).join('')}amix=inputs=${spec.sfx.length}:normalize=0,alimiter=limit=0.95,apad,atrim=0:${spec.duration}[aout]`;
const src = path.join(V, 'out', `${name}.mp4`), out = path.join(V, 'out', `${name}_novo.mp4`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-t', String(spec.duration), '-movflags', '+faststart', out]);
console.log('done', out);
