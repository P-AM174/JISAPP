# 効果音を作る（アプリの音に合わせた短い音）
import wave, numpy as np, sys
out = sys.argv[1]; SR = 48000
def env(n, a=0.004):
    t = np.arange(n) / SR; e = np.exp(-t / max(1e-3, (n / SR) / 4)); k = int(a * SR); e[:k] *= np.linspace(0, 1, k); return e
def tone(f, d, kind='sine', v=.3):
    n = int(d * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * t
    w = {'sine': np.sin(ph), 'square': np.sign(np.sin(ph)) * .6, 'tri': 2 / np.pi * np.arcsin(np.sin(ph)), 'saw': 2 * (t * f % 1) - 1}[kind]
    return w * env(n) * v
def cat(*parts): return np.concatenate(parts)
def gap(d): return np.zeros(int(d * SR))
def save(name, x):
    x = np.clip(x, -1, 1); w = wave.open(f"{out}/{name}.wav", 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
save('tick', tone(880, .06, 'square', .18))
save('tap', tone(660, .09, 'tri', .55))
save('step', tone(320, .06, 'sine', .3))
save('good', cat(tone(784, .12, 'tri', .5), tone(1046, .25, 'tri', .5)))
save('bad', cat(tone(260, .2, 'saw', .22), tone(200, .28, 'saw', .22)))
save('pop', cat(tone(520, .05, 'sine', .45), tone(880, .07, 'sine', .35)))
save('whoosh', np.random.uniform(-1, 1, int(.25 * SR)) * np.linspace(.0, .25, int(.25 * SR)) * np.linspace(1, 0, int(.25 * SR)) ** .5)
save('click', cat(tone(180, .05, 'square', .4), tone(700, .07, 'tri', .45)))
save('warn', cat(tone(330, .2, 'saw', .18), gap(.05), tone(330, .2, 'saw', .18)))
save('boop', tone(520, .08, 'sine', .4))
save('beep', tone(820, .16, 'square', .22))
save('tada', cat(*[tone(f, .15, 'tri', .45) for f in (523, 659, 784, 1046)]))
print('ok')
