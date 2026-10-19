# Frustrated v2: a cute girly "hyaa!" when charging, and spinning-stars twinkles when dizzy.
import numpy as np, soundfile as sf
from voicelib import voice, noise_burst, place, room, finish, interp, SR, rng
A_GIRL = (900, 1600, 3100); E_GIRL = (550, 2300, 3200); H_GIRL = (700, 1800, 3000)

# CHARGE: "hy-aa!" (cute battle cry: high, bright, bouncy), then a tiny "a!"
c = np.zeros(int(.62 * SR))
place(c, noise_burst(.05, 2500, 7000, [(0, 0), (.01, .25), (.05, 0)]), 0)                       # the soft "h"
place(c, voice(.34, [(0, 560), (.07, 760), (.2, 700), (.34, 600)], [(0, E_GIRL), (.06, A_GIRL), (.34, A_GIRL)],
               [(0, 0), (.03, .9), (.22, 1), (.34, 0)], vib=(9, .03), nasal=.05, breath=.05), .03)
place(c, voice(.12, [(0, 820), (.12, 760)], [(0, A_GIRL), (.12, A_GIRL)], [(0, 0), (.02, .8), (.12, 0)], nasal=0, breath=.04), .42)
w = noise_burst(.3, 900, 5000, [(0, 0), (.12, .18), (.3, 0)])                                       # light whoosh as it dashes
place(c, w, .3)
sf.write('frust_charge2.wav', finish(room(c, .08), -22, -6), SR, subtype='PCM_16')

# DIZZY: little stars spinning around its head (twinkles that go round and round, left-right)
n = int(1.5 * SR); L = np.zeros(n); R = np.zeros(n)
def ping(f, dur=.16, amp=.3):
    k = int(dur * SR); t = np.arange(k) / SR
    return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.0 * t) + .12 * np.sin(2 * np.pi * f * 3.01 * t)) * np.exp(-t / .055) * amp
notes = [2637, 3136, 3520, 3951, 3520, 3136]                          # E7 G7 A7 B7 A7 G7: a little circle of notes
step = .085; i = 0; at = .0
while at < 1.3:
    f = notes[i % len(notes)]; s = ping(f, amp=.3 * (1 - .35 * at / 1.3))
    ang = 2 * np.pi * i / len(notes)                                    # stars circling: pan follows the circle
    pan = np.sin(ang); a = int(at * SR); b = min(n, a + len(s))
    L[a:b] += s[:b - a] * np.sqrt(.5 * (1 - pan)); R[a:b] += s[:b - a] * np.sqrt(.5 * (1 + pan))
    at += step; i += 1
t = np.arange(n) / SR                                                  # soft sparkly shimmer underneath
sh = rng.standard_normal(n); X = np.fft.rfft(sh); fr = np.fft.rfftfreq(n, 1 / SR); X[(fr < 6000) | (fr > 11000)] = 0; sh = np.fft.irfft(X, n)
sh *= (.5 + .5 * np.sin(2 * np.pi * 11 * t)) * interp([(0, 0), (.1, .06), (1.2, .04), (1.5, 0)], n)
L += sh; R += sh
st = np.stack([L, R], 1)
st = st / np.sqrt((st ** 2).mean()) * 10 ** (-24 / 20)
pk = np.abs(st).max(); lim = 10 ** (-6 / 20)
if pk > lim: st *= lim / pk
f = int(.15 * SR); st[-f:] *= np.linspace(1, 0, f)[:, None]
sf.write('frust_dizzy2.wav', st, SR, subtype='PCM_16')
print('ok')


# ---- v3 charge (in use): angry girl voice ----
import numpy as np, soundfile as sf
from voicelib import voice, noise_burst, place, room, finish, interp, SR, rng
A_GIRL = (950, 1550, 3000); N_GIRL = (320, 1500, 2800); E_GIRL = (600, 2100, 3100)

def rough(x, rate=48, depth=.6, drive=2.2):
    t = np.arange(len(x)) / SR
    x = x * (1 - depth / 2 + depth / 2 * np.sign(np.sin(2 * np.pi * rate * t)) * .8)   # gritty, buzzing edge
    return np.tanh(x * drive) / np.tanh(drive)                                           # strained, pushed voice

def stomp(f=95, amp=.55):
    n = int(.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * (1 + 1.2 * np.exp(-t / .012)) * t) * np.exp(-t / .03) * amp

c = np.zeros(int(.8 * SR))
# 1) "nnngh..." gritted teeth, pitch pushing up (anger building)
place(c, rough(voice(.24, [(0, 420), (.24, 560)], [(0, N_GIRL), (.24, N_GIRL)], [(0, 0), (.05, .55), (.24, .75)], nasal=1.0, breath=.06), 60, .5, 1.6), 0)
# 2) "YAAH!" shout: high peak then a sharp angry fall, rough and loud
y = voice(.34, [(0, 640), (.05, 820), (.16, 760), (.34, 480)], [(0, E_GIRL), (.04, A_GIRL), (.34, A_GIRL)], [(0, 0), (.02, 1), (.2, 1), (.34, 0)], vib=(7, .02), nasal=0, breath=.12)
place(c, rough(y, 45, .55, 2.6), .22)
place(c, noise_burst(.06, 2000, 6000, [(0, 0), (.005, .45), (.06, 0)]), .21)          # breath burst at the shout
# 3) stomp-stomp and a whoosh as it rushes forward
w = noise_burst(.32, 700, 4500, [(0, 0), (.14, .22), (.32, 0)]); place(c, w, .42)
for at in (.46, .55, .64, .73): place(c, stomp(100 + 20 * (at > .5), .45), at)
sf.write('frust_charge3.wav', finish(room(c, .07), -21, -5), SR, subtype='PCM_16')
print('ok')
