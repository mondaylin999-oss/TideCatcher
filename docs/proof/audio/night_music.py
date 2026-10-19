"""TideCatcher night music v2: five original calm pieces, each with its own instrument, rhythm and tune.
All sounds are synthesised in code (no samples, no existing melodies)."""
import numpy as np, soundfile as sf, sys
from scipy.signal import fftconvolve, butter, sosfilt, lfilter
from piano import piano_note, reverb_ir, midi_hz, SR

def env_adsr(n, a, d, s, r_start, r):
    t = np.arange(n) / SR; e = np.ones(n) * s
    e[t < a] = t[t < a] / a
    m = (t >= a) & (t < a + d); e[m] = 1 - (1 - s) * (t[m] - a) / d
    m = t >= r_start; e[m] *= np.exp(-(t[m] - r_start) / r)
    return e

# ---------- instruments ----------
def music_box(m, vel, rng):            # School: tiny bright tines, like a music box
    f = midi_hz(m); n = int(3.0 * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 1.4), (2.0, .25, .6), (5.4, .18, .18), (8.9, .08, .08)]:
        out += amp * np.exp(-t / dec) * np.sin(2 * np.pi * f * ratio * t + rng.uniform(0, 6))
    out[:120] *= np.linspace(0, 1, 120); return out * vel * .6

def harp(m, vel, rng, dur=3.5):        # Festival: plucked string (a soft saung-harp feel), Karplus-Strong
    f = midi_hz(m); n = int(dur * SR); L = int(SR / f)
    buf = rng.uniform(-1, 1, L); buf = lfilter([.5, .5], [1], buf)
    out = np.zeros(n); idx = 0; damp = .996 - (m - 60) * .0004
    for i in range(n):
        v = buf[idx]; out[i] = v; nxt = buf[(idx + 1) % L]; buf[idx] = damp * .5 * (v + nxt); idx = (idx + 1) % L
    sos = butter(2, min(6000, f * 7) / (SR / 2), 'low', output='sos')
    return sosfilt(sos, out) * vel * .55

def harp_fast(m, vel, rng, dur=3.5):  # vectorised version of the pluck (same sound, much faster)
    f = midi_hz(m); n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(1, 14):
        fk = k * f
        if fk > 8000: break
        amp = (1 / k) * abs(np.sin(np.pi * k * .23))           # plucked a little off-centre
        out += amp * np.exp(-t * (0.9 + 0.55 * k * k * f / 900)) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6))
    out[:60] *= np.linspace(0, 1, 60); return out * vel * .8

def bell(m, vel, rng):                 # Festival: soft temple bell (FM)
    f = midi_hz(m); n = int(5 * SR); t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t / 1.2)
    out = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 1.4 * t)) * np.exp(-t / 2.2)
    out[:200] *= np.linspace(0, 1, 200); return out * vel * .35

def epiano(m, vel, dur, rng=None):          # Lakeside: warm electric piano (Rhodes-like FM with tremolo)
    f = midi_hz(m); n = int((dur + 2.5) * SR); t = np.arange(n) / SR
    idx = (1.4 + vel) * np.exp(-t / .6)
    out = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * (np.exp(-t / 3.0))
    out += .15 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .8)
    r0 = int(dur * SR)
    if r0 < n: out[r0:] *= np.exp(-np.arange(n - r0) / (.5 * SR))
    out *= 1 + .12 * np.sin(2 * np.pi * 4.5 * t)
    out[:150] *= np.linspace(0, 1, 150); return out * vel * .5

def strings(notes, dur, rng, bright=1500, att=2.0):   # Park/Hilltop: soft bowed pad
    n = int((dur + 3) * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in notes:
        f = midi_hz(m)
        for det in (-.006, -.002, .003, .007):
            ph = rng.uniform(0, 1)
            out += 2 * (((f * (1 + det) * t + ph) % 1) - .5)       # saw
    out *= np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur + 3 - t) / 3))
    out *= 1 + .05 * np.sin(2 * np.pi * .3 * t)
    sos = butter(2, bright / (SR / 2), 'low', output='sos')
    return sosfilt(sos, out) / (len(notes) * 4)

def drone(m, dur, rng):                # Hilltop: low hum with slow breathing
    f = midi_hz(m); n = int(dur * SR); t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t + 1) + .25 * np.sin(2 * np.pi * f * 2 * t)
    out *= .6 + .4 * np.sin(2 * np.pi * t / 9) ** 2
    out *= np.minimum(1, t / 5) * np.minimum(1, (dur - t) / 6).clip(0)
    return out * .12

def wind(dur, rng):                    # Hilltop: soft night wind
    n = int(dur * SR); x = rng.standard_normal(n)
    x = sosfilt(butter(2, [300 / (SR / 2), 1200 / (SR / 2)], 'band', output='sos'), x)
    t = np.arange(n) / SR; x *= (.4 + .6 * np.sin(2 * np.pi * t / 13 + 1) ** 2) * np.minimum(1, t / 4) * np.minimum(1, (dur - t) / 5).clip(0)
    return x * .05

def frame_drum(vel, rng, low=True):    # Festival: soft hand drum (a gentle pat-waing-like pulse)
    n = int(.6 * SR); t = np.arange(n) / SR
    f = (95 if low else 170) * (1 + .6 * np.exp(-t / .03))
    out = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (.22 if low else .12))
    out += rng.standard_normal(n) * np.exp(-t / .015) * .15
    return sosfilt(butter(2, 1800 / (SR / 2), 'low', output='sos'), out) * vel * .5

def water_drop(m, rng):                # Lakeside: tiny water plinks
    f = midi_hz(m); n = int(.5 * SR); t = np.arange(n) / SR
    fr = f * (1 + .5 * np.exp(-t / .02))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / .09) * .12

def crickets(dur, rng):                # Park: far-away crickets
    n = int(dur * SR); t = np.arange(n) / SR
    chirp = (np.sin(2 * np.pi * 30 * t) > .6) * (np.sin(2 * np.pi * .7 * t + rng.uniform(0, 6)) > .2)
    x = np.sin(2 * np.pi * 4400 * t) * chirp
    x = sosfilt(butter(1, 200 / (SR / 2), 'low', output='sos'), chirp.astype(float)) * np.sin(2 * np.pi * 4400 * t)
    return x * .012 * np.minimum(1, t / 4) * np.minimum(1, (dur - t) / 5).clip(0)

# ---------- helpers ----------
class Mix:
    def __init__(s, seconds):
        s.N = int((seconds + 10) * SR); s.bus = {k: np.zeros((2, s.N)) for k in ('dry', 'wet', 'amb')}
    def add(s, sig, at, pan=0., bus='dry', gain=1.):
        i = int(at * SR)
        if i >= s.N: return
        j = min(s.N, i + len(sig)); x = sig[:j - i] * gain
        s.bus[bus][0, i:j] += x * np.sqrt(.5 * (1 - pan)); s.bus[bus][1, i:j] += x * np.sqrt(.5 * (1 + pan))
    def render(s, path, rng, rev=(.45, .9), hall=4.0, end=None):
        ir_s, ir_l = reverb_ir(1.1, rng, 6000), reverb_ir(hall, rng, 3800)
        src = s.bus['dry'] + s.bus['wet']
        wet = np.stack([fftconvolve(src[c], ir_s[c])[:s.N] * rev[0] + fftconvolve(src[c], ir_l[c])[:s.N] * rev[1] for c in range(2)])
        mix = s.bus['dry'] * .8 + s.bus['wet'] * .3 + wet * .45 + s.bus['amb']
        mix = sosfilt(butter(1, 55 / (SR / 2), 'high', output='sos'), mix)
        mix = sosfilt(butter(1, 8000 / (SR / 2), 'low', output='sos'), mix)
        if end: mix = mix[:, :int(end * SR)]
        f = int(4 * SR); mix[:, -f:] *= np.linspace(1, 0, f) ** 2
        mix /= np.abs(mix).max() / .8
        sf.write(path, mix.T, SR, subtype='PCM_16'); return mix.shape[1] / SR

def motif_play(mx, inst, motif, base, at, beat, rng, pan=.2, vary=0.0, vel=.6):
    """motif = [(beat_offset, scale_step, length_beats)], played on a scale from `base`."""
    for off, step, ln in motif:
        if rng.random() < vary: step += int(rng.choice([-1, 1]))
        m = base(step)
        mx.add(inst(m, vel * rng.uniform(.85, 1.05), ln * beat), at + off * beat + rng.uniform(0, .03), pan)

def scale_fn(tonic, modes):
    def f(step):
        o, i = divmod(step, len(modes)); return tonic + 12 * o + modes[i]
    return f

ION = [0, 2, 4, 5, 7, 9, 11]; LYD = [0, 2, 4, 6, 7, 9, 11]; DOR = [0, 2, 3, 5, 7, 9, 10]; PENT = [0, 2, 4, 7, 9]

# ---------- the five pieces ----------
def school(path):   # waltz in 3/4, music box + piano, light and curious (F Lydian)
    rng = np.random.default_rng(101); beat = 60 / 96; bar = 3 * beat; mx = Mix(100)
    sc = scale_fn(77, LYD)                       # F5 music box
    motif = [(0, 0, 1), (1, 2, 1), (2, 4, 1), (3, 6, 1.5), (4.5, 4, .5), (5, 2, 1)]   # rising "what's this?" figure
    answer = [(0, 5, 1), (1, 4, 1), (2, 2, 1), (3, 1, 1), (4, 0, 2)]
    chords = [(53, [57, 60, 64]), (55, [59, 62, 65]), (57, [60, 64, 67]), (48, [55, 60, 64])]   # F, G(#11 colour), Am, C
    t0 = 2.0; b = 0
    while t0 < 92:
        root, ch = chords[(b // 2) % 4]
        mx.add(piano_note(root - 12, .42, bar * 1.6, rng), t0, -.3)                       # "oom"
        for k in (1, 2): mx.add(piano_note(ch[0], .26, beat * .8, rng) + piano_note(ch[1], .22, beat * .8, rng), t0 + k * beat, -.1)   # "pah pah"
        if b % 8 in (0, 4): motif_play(mx, lambda m, v, l: music_box(m, v, rng), motif, sc, t0, beat, rng, .35, vary=.15 if b >= 8 else 0)
        if b % 8 in (2, 6): motif_play(mx, lambda m, v, l: music_box(m, v, rng), answer, sc, t0, beat, rng, .35, vary=.1)
        t0 += bar; b += 1
    for m in (41, 53, 57, 60, 64, 77): mx.add(piano_note(m, .35, 5, rng), t0 + (m - 41) * .01, 0)
    return mx.render(path, rng, rev=(.35, .6), hall=2.8, end=t0 + 8)

def park(path):     # rolling piano arpeggios over warm strings, crickets far away (D major), 4/4
    rng = np.random.default_rng(202); beat = 60 / 68; mx = Mix(104)
    chords = [(50, [57, 62, 66, 69]), (47, [54, 59, 62, 66]), (43, [55, 59, 62, 67]), (45, [57, 61, 64, 69])]   # D, Bm, G, A
    sc = scale_fn(74, PENT)
    tune = [(0, 4, 1.5), (1.5, 3, .5), (2, 2, 2), (4, 1, 1), (5, 2, 1), (6, 0, 2)]      # slow singing line
    t0 = 2.0; b = 0
    mx.add(crickets(104, rng), 0, 0, 'amb')
    while t0 < 94:
        root, ch = chords[b % 4]
        mx.add(strings([root, ch[0], ch[2]], 4 * beat, rng, 1200, 2.5), t0, 0, 'wet', .55)
        mx.add(piano_note(root - 12, .4, 3.5, rng), t0, -.2)
        pat = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[2], ch[3]]                     # gentle rolling eighths
        for i, m in enumerate(pat): mx.add(piano_note(m, .24 + .05 * (i % 4 == 0), beat * .9, rng), t0 + i * beat / 2 + rng.uniform(0, .02), -.05)
        if b % 4 == 0 and b >= 4: motif_play(mx, lambda m, v, l: piano_note(m, v, l, rng), tune, sc, t0, beat, rng, .25, vary=.2, vel=.55)
        t0 += 4 * beat; b += 1
    for i, m in enumerate((38, 50, 57, 62, 66)): mx.add(piano_note(m, .35, 6, rng), t0 + i * .25, 0)
    return mx.render(path, rng, rev=(.45, .7), hall=3.5, end=t0 + 9)

def festival(path): # plucked harp + soft bells + hand-drum pulse, a gentle Myanmar-festival feel (G pentatonic)
    rng = np.random.default_rng(303); beat = 60 / 84; mx = Mix(98)
    sc = scale_fn(67, PENT)
    hook = [(0, 2, .5), (.5, 3, .5), (1, 4, 1), (2, 3, .5), (2.5, 2, .5), (3, 0, 1)]
    hook2 = [(0, 5, .5), (.5, 4, .5), (1, 3, .5), (1.5, 2, .5), (2, 3, 1), (3, 2, 1)]
    roots = [43, 43, 40, 38]
    t0 = 2.0; b = 0
    while t0 < 88:
        r = roots[b % 4]
        for k, m in enumerate([r, r + 7, r + 12, r + 16 if b % 4 != 2 else r + 15, r + 12, r + 7]):   # rolling harp
            mx.add(harp_fast(m + 12, .45, rng, 2.5), t0 + k * beat * 2 / 3, -.25)
        if b >= 2:
            for k in range(4): mx.add(frame_drum(.55 if k % 2 == 0 else .3, rng, k % 2 == 0), t0 + k * beat, .1, 'wet')
        if b % 2 == 0 and b >= 2: motif_play(mx, lambda m, v, l: harp_fast(m + 12, v, rng, 2.5), hook if b % 4 == 0 else hook2, sc, t0, beat, rng, .3, vary=.1, vel=.7)
        if b % 4 == 3: mx.add(bell(sc(4) + 12, .5, rng), t0 + 2 * beat, .4)
        t0 += 4 * beat; b += 1
    mx.add(bell(sc(0) + 12, .6, rng), t0, 0)
    for m in (43, 55, 62, 67): mx.add(harp_fast(m + 12, .5, rng, 4), t0 + (m - 43) * .02, 0)
    return mx.render(path, rng, rev=(.4, .55), hall=2.6, end=t0 + 7)

def hilltop(path):  # low drone, wind, slow strings, a few far-away piano notes with long echo (E Dorian), free time
    rng = np.random.default_rng(404); mx = Mix(106)
    mx.add(drone(28, 104, rng), 0, 0, 'amb'); mx.add(wind(104, rng), 0, 0, 'amb')
    sc = scale_fn(76, DOR)
    calls = [[0, 2, 4], [4, 3, 1], [0, 4, 7, 6], [6, 4, 2, 1]]          # question-like little calls
    chords = [[40, 47, 54], [36, 43, 52], [38, 45, 54], [35, 42, 50]]
    t0 = 3.0; i = 0
    while t0 < 96:
        mx.add(strings(chords[i % 4], 9, rng, 900, 4), t0, 0, 'wet', .7)
        call = calls[i % 4]
        for k, step in enumerate(call):
            mx.add(piano_note(sc(step), .45, 2.5, rng), t0 + 2.5 + k * 1.1 + rng.uniform(0, .2), rng.uniform(-.5, .5), 'wet')
        if i % 2 == 1: mx.add(piano_note(sc(step) + 12, .22, 2, rng), t0 + 7.5, .5, 'wet')   # a faint echo higher up
        t0 += 10.5; i += 1
    mx.add(piano_note(sc(0), .4, 6, rng), t0, 0, 'wet')
    return mx.render(path, rng, rev=(.3, 1.3), hall=6.0, end=t0 + 10)

def lakeside(path): # lullaby in 6/8 on warm electric piano, water plinks, very slow (E-flat major)
    rng = np.random.default_rng(505); beat = 60 / 132; bar = 6 * beat; mx = Mix(110)   # dotted feel, ~44 bars/min
    sc = scale_fn(75, ION)
    lull = [(0, 2, 2), (2, 1, 1), (3, 0, 2), (5, 1, 1), (6, 2, 2), (8, 4, 1), (9, 2, 3)]
    lull2 = [(0, 4, 2), (2, 3, 1), (3, 2, 2), (5, 1, 1), (6, 0, 6)]
    chords = [(51, [58, 62, 67]), (48, [55, 58, 63]), (44, [51, 55, 60]), (46, [53, 58, 62])]   # Eb, Cm, Ab, Bb
    t0 = 2.5; b = 0
    while t0 < 100:
        root, ch = chords[(b // 2) % 4]
        pat = [root, ch[0], ch[1], ch[2], ch[1], ch[0]]
        for i, m in enumerate(pat): mx.add(epiano(m, .32 if i else .42, beat * 1.5, rng), t0 + i * beat, -.15)
        if b % 4 == 0 and b >= 2: motif_play(mx, lambda m, v, l: epiano(m, v, l, rng), lull, sc, t0, beat, rng, .2, vary=.1, vel=.5)
        if b % 4 == 2 and b >= 2: motif_play(mx, lambda m, v, l: epiano(m, v, l, rng), lull2, sc, t0, beat, rng, .2, vary=.1, vel=.45)
        if rng.random() < .5: mx.add(water_drop(rng.choice([87, 91, 94, 98]), rng), t0 + rng.uniform(0, bar), rng.uniform(-.7, .7), 'wet')
        t0 += bar; b += 1
    for i, m in enumerate((39, 51, 58, 63, 67)): mx.add(epiano(m, .4, 6, rng), t0 + i * .3, 0)
    return mx.render(path, rng, rev=(.5, .8), hall=4.5, end=t0 + 9)

PIECES = dict(school=school, park=park, festival=festival, hilltop=hilltop, lakeside=lakeside)
if __name__ == '__main__':
    for n in (sys.argv[1:] or PIECES): print(n, round(PIECES[n](f'v2_{n}.wav'), 1), 's')
