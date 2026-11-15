# THE CANDLE DOESN'T CARE: voice-over cue sheet

The film ships **narration-free** (captions carry every line). Speech generation in this environment was
espeak-class only, and the owner asked not to use a robotic voice just because one is available. This sheet is
for a recorded human read (or a high-quality voice the owner approves). Drop it in with:

```bash
VO=path/to/read.wav python3 tools/make_audio.py      # 48 kHz WAV, lines placed at the times below; ducks the music
cd project && npx remotion render src/index.ts Candle-9x16 out/candle-vo.mp4 --gl=swangle --crf=16 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

## Direction

Low, unhurried, totally sincere: an old master narrating his own legend, or a samurai-film trailer.
No wink, no irony, no "movie trailer guy" bombast. Close to the mic, room tone only. The joke only works if
this is played absolutely straight. Leave air between lines; let the ellipses breathe.

| cue | in (s) | must end by (s) | line | caption on screen |
|---|---|---|---|---|
| 1 | 0.35 | 2.40 | "I have studied the markets for twenty years..." | 0.30 to 2.35 |
| 2 | 2.75 | 4.85 | "I have mastered technical analysis..." | 2.70 to 4.85 |
| 3 | 5.35 | 6.30 | "I cannot lose." (quieter, certain, a half-beat after the eyes land) | 5.20 to 6.30 |

Nothing after 6.40 s. The silence, the candle and the squeak carry the rest. The title is read by no one.

Timings come from `project/src/timing.ts`. Move a caption window there and both picture and sound follow.
