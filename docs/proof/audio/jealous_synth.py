# Jealous Moodling voice: a pouty, nasal "Hmph!" and a whiny sing-song "mi-ine~".
import numpy as np, soundfile as sf
SR = 44100
rng = np.random.default_rng(7)

def interp(points, n):
    """points: [(time_s, value)] -> per-sample curve of length n"""
    t = np.arange(n) / SR; xs, ys = zip(*points); return np.interp(t, xs, ys)

def formant_gain(freqs, formants):
    g = np.zeros_like(freqs)
    for (fc, bw, amp) in formants:
        g += amp / (1 + ((freqs - fc) / (bw / 2)) ** 2)
    return g

def voice(dur, f0_pts, form_pts, amp_pts, vib=(6.0, 0.0), nasal=0.0, breath=0.04):
    n = int(dur * SR); t = np.arange(n) / SR
    f0 = interp(f0_pts, n) * (1 + vib[1] * np.sin(2 * np.pi * vib[0] * t)) * (1 + .004 * rng.standard_normal(n).cumsum() / np.sqrt(np.arange(1, n + 1)))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    out = np.zeros(n)
    # formants change over time: interpolate F1,F2,F3 tracks
    F = [interp([(p[0], p[1][i]) for p in form_pts], n) for i in range(3)]
    for k in range(1, 40):
        fk = f0 * k
        if fk.min() > 9000: break
        env = (formant_gain(fk, [(F[0], 120, 1.0)]) + formant_gain(fk, [(F[1], 180, .6)]) + formant_gain(fk, [(F[2], 260, .25)]))
        env += nasal * formant_gain(fk, [(np.full(n, 270.0), 80, 1.2)])          # nasal murmur
        env *= np.where(fk < 8500, 1, 0) / k ** .55
        out += env * np.sin(k * ph)
    out += breath * rng.standard_normal(n) * formant_gain(np.full(n, 3000.0), [(F[1], 1500, 1)])
    return out * interp(amp_pts, n)

def noise_burst(dur, lo, hi, amp_pts):
    n = int(dur * SR); x = rng.standard_normal(n)
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(n, 1 / SR); X[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(X, n) * interp(amp_pts, n)

def place(buf, sig, at):
    i = int(at * SR); buf[i:i + len(sig)] += sig[:len(buf) - i]

def room(x, mix=.12):
    ir_n = int(.09 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (.025 * SR)); ir /= np.abs(ir).sum()
    return x + mix * np.convolve(x, ir)[:len(x)] * 8

def finish(x, rms_db=-23.0, peak_db=-6.0):
    fade = int(.012 * SR); x[:fade] *= np.linspace(0, 1, fade); x[-fade * 3:] *= np.linspace(1, 0, fade * 3)
    x *= 10 ** (rms_db / 20) / np.sqrt((x ** 2).mean())
    pk = np.abs(x).max(); lim = 10 ** (peak_db / 20)
    if pk > lim: x = np.tanh(x / lim * .9) * lim / np.tanh(.9)
    return x

M = (300, 1100, 2400)       # closed-mouth "m"
U = (650, 1150, 2500)       # "uh" (pouty)
I = (380, 2300, 3000)       # "ee"
A = (750, 1250, 2600)       # "ah"

# Final: just a pouty "Hmph!" (nasal rise, sharp fall, puff of air)
h = np.zeros(int(.42 * SR))
place(h, voice(.24, [(0, 400), (.13, 600), (.24, 450)], [(0, M), (.12, U), (.24, U)], [(0, 0), (.03, .8), (.17, 1), (.24, 0)], nasal=.8), 0)
place(h, noise_burst(.13, 1200, 5000, [(0, 0), (.01, .6), (.13, 0)]), .19)
sf.write('jealous_hmph.wav', finish(room(h)), SR, subtype='PCM_16')
print('ok')
