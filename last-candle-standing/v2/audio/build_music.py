#!/usr/bin/env python3
"""BATTLE ROYALE V2: the music edit. Cuts the owner-supplied track (music-source/Victory Stamp_dark_dnb.mp3) into
the trailer's 3-region arrangement on its own beat grid. No pitch shift, no time-stretch: the picture follows
the music. Writes audio/out/music.wav (48 kHz stereo float -> 16-bit) and prints the edit decision list.

Grid (measured, see README): 176 BPM, beat P = 0.34095 s, beat n at 12.144 + n*P from 12 s to ~204 s; the outro
slows (ritardando to ~164 BPM): its downbeats are 206.231, 207.688 and the final stab 209.165.

usage: python3 audio/build_music.py
"""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'music-source', 'Victory Stamp_dark_dnb.mp3')
OUT = os.path.join(HERE, 'out')
SR = 48000
P = 0.34095
beat = lambda n: 12.144 + n * P

# (src_in, src_out, note). Video time is the running sum.
EDL = [
    (beat(88), beat(120), 'A: the build (2 bars) into drop 1 at beat 96, then 6 bars of drop 1'),
    (beat(224), beat(244), 'B: breakdown (phrase start, beat 224): 1 beat of drop then the floor falls away; the return slam at 94.142 (half a beat after bar 240); 1 bar after it'),
    (206.231, 212.100, 'C: the outro downbeat 2 bars before the final stab (209.165), and the stab\'s decay'),
]
XF = 0.012                 # equal-power crossfade at each splice (s); both sides are on downbeats
GATE = (beat(240), 94.137)  # the dramatic silence: the half beat before the return slam
FADE_IN = 0.02
FADE_OUT = 0.9


def load():
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f4').reshape(-1, 2).T.copy()


def main():
    x = load()
    parts, edl, v = [], [], 0.0
    gate_v = None
    for k, (a, b, note) in enumerate(EDL):
        i, j = int(round(a * SR)), int(round(b * SR))
        seg = x[:, i:j + int(XF * SR)].copy()  # carry the tail for the crossfade
        if a <= GATE[0] < b:
            gi, gj = int(round((GATE[0] - a) * SR)), int(round((GATE[1] - a) * SR))
            r = int(0.006 * SR)
            seg[:, gi:gj] = 0
            seg[:, gi - r:gi] *= np.linspace(1, 0, r)
            seg[:, gj:gj + r] *= np.linspace(0, 1, r)
            gate_v = (v + GATE[0] - a, v + GATE[1] - a)
        parts.append(seg)
        edl.append({'video_in': round(v, 3), 'video_out': round(v + b - a, 3), 'src_in': round(a, 3), 'src_out': round(b, 3), 'note': note})
        v += b - a
    n = int(round(v * SR))
    out = np.zeros((2, n + int(XF * SR)))
    pos = 0
    xf = int(XF * SR)
    th = np.linspace(0, np.pi / 2, xf)
    for k, seg in enumerate(parts):
        L = seg.shape[1]
        s = seg.copy()
        if k > 0:
            s[:, :xf] *= np.sin(th)
        if k < len(parts) - 1:
            s[:, L - xf:] *= np.cos(th)
        else:
            s = s[:, :L - xf]
        out[:, pos:pos + s.shape[1]] += s
        pos += int(round((EDL[k][1] - EDL[k][0]) * SR))
    out = out[:, :n]
    fi, fo = int(FADE_IN * SR), int(FADE_OUT * SR)
    out[:, :fi] *= np.linspace(0, 1, fi)
    out[:, -fo:] *= np.linspace(1, 0, fo) ** 2
    os.makedirs(OUT, exist_ok=True)
    y = (np.clip(out, -1, 1) * 32767).astype('<i2').T.copy()
    with wave.open(os.path.join(OUT, 'music.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
    marks = {
        'drop': beat(96) - EDL[0][0],
        'breakdown': EDL[0][1] - EDL[0][0],
        'silence': gate_v,
        'slam': EDL[0][1] - EDL[0][0] + 94.142 - EDL[1][0],
        'outro': EDL[0][1] - EDL[0][0] + EDL[1][1] - EDL[1][0],
        'stab': EDL[0][1] - EDL[0][0] + EDL[1][1] - EDL[1][0] + 209.165 - EDL[2][0],
        'dur': v,
    }
    json.dump({'edl': edl, 'marks': marks, 'beat': P, 'v_beat0': 0.0}, open(os.path.join(OUT, 'edl.json'), 'w'), indent=1)
    print(json.dumps({'edl': edl, 'marks': marks}, indent=1))


main()
