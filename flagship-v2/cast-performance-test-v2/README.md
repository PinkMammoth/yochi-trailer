# Cast performance tests v2: Cold Blooded's mask gesture, Untouchable's separated ribbons

Two new approved paintings, tested against their v1 counterparts. **Findings, choices and limitations are in
`REPORT-v2.md`.** Status: for owner review. Not integrated into the flagship, not merged.

Isolation: a new folder. v1 (`../cast-performance-test/`), the Last Legend test, the pullback, the Duels short, the
animatics and the kit are untouched. The flagship's house libraries and `yochi-2p5d` are imported read-only.

```
assets/source/       cold-blooded-mask-lowered.webp (new), cold-blooded-mask-raised.webp (v1's approved copy),
                     untouchable-landscape.webp (new, 1672x941), untouchable-portrait.webp (v1's approved copy)
assets/derived/      registrations (*-registration.json, reg/), mattes, layers/ (what the shots read)
tools/               register_cb.py, register_un.py, prep_cb.py, prep_un_hybrid.py, prep_un_strands.py, sheets.py
audio/build.py       separate music / sfx / mix stems per cut (audio/out/)
remotion/src/        ColdBlooded2.tsx, Untouchable2.tsx (WebGL strand pass), common.tsx, timing.ts (every timing)
deliverables/        renders and sheets (table in REPORT-v2.md section 3)
```

Compositions: `ColdBlooded2-Concealed`, `ColdBlooded2-Trailer`, `ColdBlooded2-Layered`, `Untouchable2-Cinematic`,
`Untouchable2-Trailer`, `Untouchable2-Rigid`. Props: `diag: true` (a readout per frame); Untouchable's
`payout: { show, handle, amount, provisional }` (provisional by default).

Rebuild: `REPORT-v2.md` section 4. Kanji: 敗 (Cold Blooded trailer only, allowed list).
