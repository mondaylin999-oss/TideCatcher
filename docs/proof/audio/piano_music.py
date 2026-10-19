"""Original calm ambient piano pieces for TideCatcher (one per place).
Slow, sparse solo piano with soft echo and a quiet pad: the peaceful, nostalgic feel of sandbox-game music,
written from scratch (algorithmic, no samples, no existing melodies)."""
import numpy as np, soundfile as sf, sys
from scipy.signal import fftconvolve, butter, sosfilt
SR = 44100

def midi_hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def piano_note(m, vel, dur, rng):
    """Additive piano-like tone: inharmonic partials, two-stage decay, slightly detuned strings, soft hammer."""
    f0 = midi_hz(m); B = 0.00035 * (1 + (m - 60) / 60)
    length = min(dur + 2.2, 7.5); n = int(length * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    bright = 0.55 + 0.45 * vel
    t60 = np.interp(m, [36, 60, 84, 96], [9.0, 6.0, 3.2, 2.0])
    for k in range(1, 16):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 9000: break
        amp = (1 / k ** (1.55 - 0.5 * bright)) * (0.75 if k % 7 == 0 else 1)
        dk = t60 / (1 + 0.55 * (k - 1) ** 1.1)              # higher partials fade sooner
        env = 0.65 * np.exp(-6.9 * t / (dk * 0.18)) + 0.35 * np.exp(-6.9 * t / dk)   # quick fall, long tail
        for det in (-0.6, 0.0, 0.7):                          # three strings, tiny detune -> gentle shimmer
            ph = rng.uniform(0, 2 * np.pi)
            out += (amp / 3) * env * np.sin(2 * np.pi * fk * (1 + det * 1e-3 * (k ** 0.3)) * t + ph)
    att = int(0.006 * SR); out[:att] *= np.linspace(0, 1, att)
    # release when the key is let go (damper), then soft fade
    r0 = int(dur * SR)
    if r0 < n:
        rel = np.exp(-np.arange(n - r0) / (0.35 * SR)); out[r0:] *= rel
    # felt hammer: a tiny soft thump
    hn = int(0.03 * SR); thump = rng.standard_normal(hn) * np.exp(-np.arange(hn) / (0.004 * SR)) * 0.02 * vel
    sos = butter(2, min(2500, f0 * 4) / (SR / 2), 'low', output='sos'); out[:hn] += sosfilt(sos, thump)
    return out * vel

def pad_chord(notes, dur, rng):
    n = int((dur + 3) * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in notes:
        f = midi_hz(m)
        for det in (-0.004, 0.004):
            out += np.sin(2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6.28)) * 0.5
            out += 0.18 * np.sin(2 * np.pi * 2 * f * (1 + det) * t)
    env = np.minimum(1, t / 2.5) * np.minimum(1, np.maximum(0, (dur + 3 - t) / 3))
    sos = butter(2, 1400 / (SR / 2), 'low', output='sos')
    return sosfilt(sos, out * env) / max(1, len(notes))

def reverb_ir(seconds, rng, tone=5000):
    n = int(seconds * SR); t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        x = rng.standard_normal(n) * np.exp(-6.9 * t / seconds)
        sos = butter(2, tone / (SR / 2), 'low', output='sos'); x = sosfilt(sos, x)
        x[:int(.012 * SR)] = 0; irs.append(x / np.sqrt((x ** 2).sum()))
    return irs

def render(spec, path):
    rng = np.random.default_rng(spec['seed'])
    total = spec['length']; N = int((total + 8) * SR)
    dry = np.zeros((2, N)); padbus = np.zeros(N)
    beat = 60 / spec['bpm']
    def add(sig, at, pan=0.0, bus=None):
        i = int(at * SR); j = min(N, i + len(sig)); s = sig[:j - i]
        if bus is not None: bus[i:j] += s; return
        dry[0, i:j] += s * np.sqrt(.5 * (1 - pan)); dry[1, i:j] += s * np.sqrt(.5 * (1 + pan))
    scale = spec['scale']                      # melody notes (MIDI)
    t0 = 2.0; bar = 0; prev = rng.choice(scale)
    prog = spec['chords']
    while t0 < total - 10:
        chord = prog[bar % len(prog)]; barlen = 4 * beat * rng.uniform(.97, 1.08)   # a little rubato
        root = chord[0]
        # left hand: slow broken chord, low and soft
        lh = [root - 12, root - 5, chord[1] if len(chord) > 1 else root + 4]
        for i, m in enumerate(lh):
            add(piano_note(m, .34 + .06 * rng.random(), 2.6, rng), t0 + i * beat * spec['lh_spread'] + rng.uniform(0, .04), -.25)
        # pad underneath, very quiet
        if spec['pad']: add(pad_chord([root, *chord[1:]], barlen, rng), t0, bus=padbus)
        # right hand: sparse melody, some bars rest completely (space is the point)
        phrase_rest = (bar % spec['phrase']) == spec['phrase'] - 1
        if not phrase_rest and rng.random() > spec['rest_chance']:
            slots = sorted(rng.choice(np.arange(0, 8), size=rng.integers(spec['notes'][0], spec['notes'][1] + 1), replace=False))
            for s in slots:
                tones = [m for m in scale if abs(m - prev) <= 5] or scale
                # prefer chord tones on strong beats
                cand = [m for m in tones if (m - root) % 12 in [(c - root) % 12 for c in chord]] if s % 4 == 0 else tones
                m = int(rng.choice(cand or tones)); prev = m
                add(piano_note(m, .5 + .2 * rng.random(), beat * rng.uniform(1.2, 2.4), rng), t0 + s * beat / 2 + rng.uniform(0, .05), .2)
                if spec.get('octave') and rng.random() < spec['octave']:
                    add(piano_note(m + 12, .22, beat, rng), t0 + s * beat / 2 + .02, .35)
        t0 += barlen; bar += 1
    # ending: one last soft chord that rings out
    last = prog[0]
    for i, m in enumerate([last[0] - 12, last[0] - 5, *last[1:], last[0] + 12]):
        add(piano_note(m, .38, 5.5, rng), t0 + i * .32, (i % 3 - 1) * .3)
    # mix: soft echo (two reverbs: small room + long hall), pad bus
    ir_s, ir_l = reverb_ir(1.2, rng, 6000), reverb_ir(4.2, rng, 3800)
    pads = fftconvolve(padbus, ir_l[0])[:N] * .0 + padbus
    wet = np.stack([fftconvolve(dry[c], ir_s[c])[:N] * .55 + fftconvolve(dry[c], ir_l[c])[:N] * .85 for c in range(2)])
    mix = dry * .78 + wet * .42 + np.stack([pads, pads]) * spec['pad']
    # gentle low-cut and very soft top so it stays warm
    mix = sosfilt(butter(1, 60 / (SR / 2), 'high', output='sos'), mix)
    mix = sosfilt(butter(1, 7500 / (SR / 2), 'low', output='sos'), mix)
    end = int((t0 + 9) * SR); mix = mix[:, :min(N, end)]
    f = int(4 * SR); mix[:, -f:] *= np.linspace(1, 0, f) ** 2
    mix /= np.abs(mix).max() / 0.8
    sf.write(path, mix.T, SR, subtype='PCM_16'); return mix.shape[1] / SR

def maj(scale_root, steps): return [scale_root + s for s in steps]
LYD = [0, 2, 4, 6, 7, 9, 11]; ION = [0, 2, 4, 5, 7, 9, 11]; AEO = [0, 2, 3, 5, 7, 8, 10]; PENT = [0, 2, 4, 7, 9]
def scale_from(root, modes, lo=72, hi=88):
    return [m for m in range(lo, hi + 1) if (m - root) % 12 in modes]

SPECS = {
  # School, 11 PM-Midnight: light and curious, F with a dreamy raised 4th
  'school':   dict(seed=11, bpm=72, length=100, lh_spread=.9, phrase=4, rest_chance=.15, notes=(2, 4), pad=.10, octave=.10,
                   chords=[[53, 57, 64], [57, 60, 67], [58, 62, 69], [60, 64, 67]], scale=scale_from(65, LYD)),
  # Park, 1 AM: calm and warm, D major
  'park':     dict(seed=23, bpm=64, length=100, lh_spread=1.0, phrase=4, rest_chance=.25, notes=(2, 3), pad=.12, octave=.0,
                   chords=[[50, 54, 61], [47, 50, 57], [43, 47, 54], [45, 49, 52]], scale=scale_from(62, PENT, 69, 86)),
  # Lighting Festival, 2 AM: a little brighter, bell-like octaves, G major
  'festival': dict(seed=37, bpm=76, length=96, lh_spread=.75, phrase=4, rest_chance=.10, notes=(3, 5), pad=.10, octave=.35,
                   chords=[[55, 59, 66], [52, 55, 62], [48, 52, 59], [50, 54, 57]], scale=scale_from(67, PENT, 71, 91)),
  # Hilltop Park, 3 AM: mysterious and wide, E minor with soft open chords
  'hilltop':  dict(seed=41, bpm=60, length=104, lh_spread=1.1, phrase=3, rest_chance=.3, notes=(1, 3), pad=.16, octave=.05,
                   chords=[[52, 55, 62], [48, 52, 59], [45, 48, 55], [47, 54, 57]], scale=scale_from(64, AEO, 67, 84)),
  # Lakeside, 4-5 AM: the most peaceful, slow and spacious, E-flat major
  'lakeside': dict(seed=59, bpm=56, length=108, lh_spread=1.2, phrase=4, rest_chance=.3, notes=(1, 3), pad=.14, octave=.15,
                   chords=[[51, 55, 62], [48, 51, 58], [44, 48, 55], [46, 50, 53]], scale=scale_from(63, ION, 70, 87)),
}
if __name__ == '__main__':
    for name in (sys.argv[1:] or SPECS):
        d = render(SPECS[name], f'piano_{name}.wav'); print(name, round(d, 1), 's')
