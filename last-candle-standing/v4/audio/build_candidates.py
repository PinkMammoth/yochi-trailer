#!/usr/bin/env python3
"""BATTLE ROYALE V4 (from V3): the two candidate music edits (audio-only previews), from the owner's track
music-source/Victory Stamp_dark_dnb.mp3. No pitch shift, no time-stretch, no new music.

Grid (measured): 176 BPM, beat P = 0.34095 s, bar 1.3638 s. The structural downbeats the arrangement uses are on
the phase of the breakdown's return slam (sub entry 94.135) and drop 2's sub entry (110.500), which are exactly
48 beats apart. (V2's grid, 12.144 + nP, sits half a beat earlier: it locked to the off-beat hats. V2's splices were
all on that same grid, so they were consistent with one another.)

  A  continuous: build + drop 1, the breakdown, the slam, and the music simply carries on (no splice after the
     slam) for 4 bars to the next structural downbeat, 99.590, where it stops: the downbeat's beat, then a tail.
  B  victory release: as A up to 1 bar after the slam (95.499), then ONE splice to drop 2's own run-up two bars
     before it (107.772: the sub drops out 0.17 s later, a pad builds), the source's own 0.12 s silence, drop 2
     (110.500, its first big hit 110.660), and the next big hit 112.368, where the music stops: that hit's beat,
     then a tail.

The ending: the dry signal is kept to the end of the accent's beat and closed with a 40 ms fade (just before the
next transient); a short tail, the last beat of the track itself through a 2.2 s room (generated here, low-passed,
decorrelated L/R), rings out under the end card. It's a controlled decay of the track's own sound, not added
music.

usage: python3 audio/build_candidates.py [A|B]   ->  audio/out/candidate-A.wav, candidate-B.wav, candidates.json,
       and audio/out/music.wav = the chosen candidate (default B, the recommendation; the film's timing map follows B)
"""
import json, os, shutil, subprocess, sys, wave
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'music-source', 'Victory Stamp_dark_dnb.mp3')
OUT = os.path.join(HERE, 'out')
SR = 48000
P = 0.34095
BAR = 4 * P
SLAM = 94.135                     # breakdown return: sub entry (V2 marked the slam's transient at 94.142)
D2 = 110.500                      # drop 2: sub entry
GRID = lambda n: 12.144 + n * P   # V2's grid (the opening and breakdown splices stay exactly as V2)

A1 = (GRID(88), GRID(120))        # 42.148 -> 53.058: the build into drop 1, 6 bars of drop 1 (V2, unchanged)
B_IN = GRID(224)                  # 88.517: the breakdown (V2, unchanged)
GATE = (GRID(240), 94.137)        # the half beat of true silence before the slam (V2, unchanged)

CANDIDATES = {
    'A': {
        'segments': [A1, (B_IN, SLAM + 4 * BAR + P)],
        'accent': SLAM + 4 * BAR,           # 99.590
        'note': 'continuous after the slam; stops on the 4th bar line after it',
    },
    'B': {
        'segments': [A1, (B_IN, SLAM + BAR), (D2 - 2 * BAR, 112.700)],
        'accent': 112.368,                  # drop 2's second big hit
        'note': 'one splice, 1 bar after the slam, into drop 2\'s run-up; drop 2; stops on its second big hit',
    },
}
XF = 0.012
TAIL = 3.0   # V4: a longer ring-out, so the end card breathes


def load():
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f4').reshape(-1, 2).T.copy()


def room(seed):
    r = np.random.default_rng(seed)
    n = int(SR * TAIL)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / (SR * TAIL / 6.9))
    ir = sosfilt(butter(2, 5000 / (SR / 2), 'low', output='sos'), ir)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))  # a little pre-delay
    return ir / np.sqrt(np.sum(ir ** 2))


def build(x, c):
    segs = c['segments']
    total = sum(b - a for a, b in segs)
    n = int(round(total * SR))
    out = np.zeros((2, n + int((TAIL + 0.2) * SR)))
    xf = int(XF * SR)
    th = np.linspace(0, np.pi / 2, xf)
    pos = 0
    v = 0.0
    edl = []
    marks = {}
    for k, (a, b) in enumerate(segs):
        i, j = int(round(a * SR)), int(round(b * SR))
        last = k == len(segs) - 1
        seg = x[:, i:j + (0 if last else xf)].copy()
        if a <= GATE[0] < b:
            gi, gj = int(round((GATE[0] - a) * SR)), int(round((GATE[1] - a) * SR))
            r = int(0.006 * SR)
            seg[:, gi:gj] = 0
            seg[:, gi - r:gi] *= np.linspace(1, 0, r)
            seg[:, gj:gj + r] *= np.linspace(0, 1, r)
            marks['silence'] = [round(v + GATE[0] - a, 3), round(v + GATE[1] - a, 3)]
            marks['slam'] = round(v + 94.142 - a, 3)
        if k > 0:
            seg[:, :xf] *= np.sin(th)
        if not last:
            seg[:, -xf:] *= np.cos(th)
        for name, s in (('drop2_sub', D2), ('drop2_hit', 110.660), ('runup_sub_cut', 107.94)):
            if a <= s < b:
                marks[name] = round(v + s - a, 3)
        if a <= c['accent'] < b:
            marks['accent'] = round(v + c['accent'] - a, 3)
        out[:, pos:pos + seg.shape[1]] += seg
        edl.append({'video_in': round(v, 3), 'video_out': round(v + b - a, 3), 'src_in': round(a, 3), 'src_out': round(b, 3)})
        pos += int(round((b - a) * SR))
        v += b - a
    # the stop: a 40 ms close on the dry signal, then the tail of the last beat
    fo = int(0.04 * SR)
    out[:, n - fo:n] *= np.linspace(1, 0, fo) ** 1.5
    acc = int(round(marks['accent'] * SR))
    beat = out[:, acc:n].copy()
    for ch in range(2):
        wet = fftconvolve(beat[ch], room(11 + ch))
        out[ch, acc:acc + len(wet)] += wet[: out.shape[1] - acc] * 0.55
    end = n + int(TAIL * SR)
    out = out[:, :end]
    out[:, -int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
    marks['stop'] = round(total, 3)
    marks['dur'] = round(end / SR, 3)
    return out, edl, marks


def write(path, y):
    y = (np.clip(y, -1, 1) * 32767).astype('<i2').T.copy()
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())


def main():
    os.makedirs(OUT, exist_ok=True)
    x = load()
    info = {}
    for name, c in CANDIDATES.items():
        y, edl, marks = build(x, c)
        write(os.path.join(OUT, f'candidate-{name}.wav'), y)
        info[name] = {'note': c['note'], 'edl': edl, 'marks': marks}
    json.dump(info, open(os.path.join(OUT, 'candidates.json'), 'w'), indent=1)
    pick = sys.argv[1] if len(sys.argv) > 1 else 'B'
    shutil.copy(os.path.join(OUT, f'candidate-{pick}.wav'), os.path.join(OUT, 'music.wav'))
    json.dump({'candidate': pick, **info[pick]}, open(os.path.join(OUT, 'edl.json'), 'w'), indent=1)
    print(json.dumps(info, indent=1))


main()
