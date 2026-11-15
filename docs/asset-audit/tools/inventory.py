#!/usr/bin/env python3
"""Yochi asset inventory.

Scans every media asset (images, video, audio, fonts, SVG) in the working tree, plus the Sumi-era assets that live
only on other branches, and writes docs/asset-audit/inventory.csv with: path, branch, kind, dimensions, transparency,
duration, Git provenance (first commit, author, date; last commit), brand tier, confidence and purpose.

The tier rules are in classify() below. They encode the evidence recorded in docs/asset-audit/ASSET_INVENTORY.md;
change them there and here together. Run from the repo root:

    python3 docs/asset-audit/tools/inventory.py            # writes docs/asset-audit/inventory.csv

Read-only: it never modifies an asset.
"""
import csv, io, json, os, re, subprocess, sys, tempfile
from PIL import Image

ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
OUT = os.path.join(ROOT, 'docs/asset-audit/inventory.csv')

MEDIA = re.compile(r'\.(png|jpe?g|webp|gif|svg|mp4|mov|mkv|wav|mp3|ttf|otf|woff2?)$', re.I)
SKIP = re.compile(r'(:Zone\.Identifier|:mshield)$|/node_modules/|/out/|^docs/asset-audit/')

# Sumi-era assets that exist only on other branches (branch, path prefix).
BRANCH_SOURCES = [
    ('origin/claude/yochi-first-ad-order-a', 'film-flagship/assets/'),
    ('origin/claude/yochi-first-ad-order-a', 'film-flagship/deliverables/'),
    ('origin/claude/gracious-bell-72as9d', 'film-cast/deliverables/'),
    ('origin/claude/yochi-elysium-gameplay', 'film-gameplay/deliverables/'),
    ('origin/claude/keen-rubin-vpzk4u', 'film-yochi/deliverables/'),
]


def git(*a):
    return subprocess.run(['git', '-C', ROOT, *a], capture_output=True, text=True).stdout


def provenance(path, ref=None):
    args = ['log', '--format=%h|%an|%cs|%s']
    if ref: args.append(ref)
    lines = [l for l in git(*args, '--', path).splitlines() if l]
    if not lines: return {}
    first, last = lines[-1].split('|', 3), lines[0].split('|', 3)
    return {'first_commit': first[0], 'first_author': first[1], 'first_date': first[2], 'first_subject': first[3],
            'last_commit': last[0], 'last_date': last[2], 'n_commits': len(lines)}


def probe_image(data):
    im = Image.open(io.BytesIO(data))
    w, h = im.size
    alpha = 'none'
    if im.mode in ('RGBA', 'LA', 'PA') or (im.mode == 'P' and 'transparency' in im.info):
        a = im.convert('RGBA').getchannel('A')
        hist = a.histogram()
        n = w * h
        clear = sum(hist[:8]) / n
        partial = sum(hist[8:248]) / n
        if clear > 0.01: alpha = f'cut-out ({clear:.0%} clear, {partial:.0%} soft edge)'
        elif partial > 0.01: alpha = f'soft alpha ({partial:.0%})'
        else: alpha = 'alpha channel, fully opaque'
    return f'{w}x{h}', alpha


def probe_av(data, ext):
    with tempfile.NamedTemporaryFile(suffix=ext) as f:
        f.write(data); f.flush()
        j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                                       'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json',
                                       f.name], capture_output=True, text=True).stdout or '{}')
    dims, dur = '', ''
    for s in j.get('streams', []):
        if s.get('codec_type') == 'video' and s.get('width'):
            dims = f"{s['width']}x{s['height']}@{s.get('r_frame_rate', '').split('/')[0]}"
    if j.get('format', {}).get('duration'): dur = f"{float(j['format']['duration']):.1f}s"
    return dims, dur


def svg_dims(data):
    t = data[:600].decode('utf8', 'ignore')
    m = re.search(r'viewBox="([^"]+)"', t)
    return (f'viewBox {m.group(1)}' if m else 'vector'), 'vector (transparent ground)'


KIT_DESC = {}
def load_kit_table():
    p = os.path.join(ROOT, 'asset-pack/sumi/README.md')
    for line in open(p, encoding='utf8'):
        m = re.match(r'\| ([^|]+) \| (starter|reward) \| `cards/([^`]+)\.webp` .*\| ([^|]+) \|\s*$', line)
        if m: KIT_DESC[m.group(3)] = (m.group(1).strip(), m.group(2), m.group(4).strip())


def classify(path, branch):
    """-> (tier, confidence, purpose). Tiers: APPROVED, LIKELY CURRENT, LEGACY, UNCERTAIN."""
    p = path
    b = os.path.basename(p)
    stem = re.sub(r'\.(webp|png)$', '', b)
    A, L, X, U = 'APPROVED / CURRENT', 'LIKELY CURRENT', 'LEGACY / DO NOT USE', 'UNCERTAIN / NEEDS REVIEW'

    # --- Sumi kit (owner-committed 28-30 Oct, the documented source of truth) ---
    if p.startswith('asset-pack/sumi/avatars/'):
        form = 'framed 3:4 card' if '/cards/' in p else 'unframed portrait'
        if stem == 'gunslinger':
            return X, 'high', f'Gunslinger {form}: retired, replaced by Ronin (kit README)'
        name = KIT_DESC.get(stem, (stem, '?', ''))
        if stem in ('starter-perma-bull', 'cold-blooded'):
            return X, 'high', (f'{stem} {form}: retired, replaced by the owner\'s v2 painting (confirmed canonical '
                               f'15 Nov; the kit README names it)')
        return A, 'high', f'{name[0]} ({name[1]}) {form}: {name[2]}'
    if p.startswith('asset-pack/sumi/logo/'):
        if 'cyan' in b: return X, 'high', 'Retired cyan Y raster. Only allowed as the "before" shot of the 予知 reveal'
        if 'seal' in b: return A, 'high', 'Main mark: Y knocked out of a vermilion hanko seal'
        return A, 'high', 'Plain one-colour Y mark for small lockups beside the YOCHI wordmark'
    if p.startswith('asset-pack/sumi/fonts/'):
        if b.endswith('.txt'): return A, 'high', 'OFL licence'
        role = {'dela': 'Display: moments, names, results, wordmark', 'jetbrains': 'Every number, tracked caps labels',
                'zen-kaku': 'Sentences', 'YujiSyuku': 'Kanji only (seals, brushed glyphs)'}
        return A, 'high', next((v for k, v in role.items() if k in b), 'font')
    if p.startswith('asset-pack/sumi/reference/screens/'):
        return A, 'high', ('Approved design mock' if b.startswith('mock') else 'Capture of the built Sumi app') + \
            ': reference to rebuild in the renderer, not to paste'
    if p.startswith('asset-pack/Elysium/'):
        return A, 'high', 'Official Elysium mark (owner-supplied 7 Nov); colourised SVG used in the approved landscape card'
    if p.startswith('asset-pack/4k clips + hq stills/'):
        return A, 'high', 'Real Sumi UI capture (30 Oct, owner-supplied 7 Nov). Fictional players: never present as a real match'
    if p == 'asset-pack/audio/Victory Stamp.mp3':
        return A, 'high', 'Track of THE CAST, flagship and the locked first ad (142.3 BPM)'
    if p == 'asset-pack/audio/trailer.wav':
        return U, 'medium', 'September trailer track (130.4 BPM). Still named as a fallback in the v2 prompts; not used in any Sumi film'
    if p.startswith('asset-pack/audio/'):
        return X, 'medium', 'Timing notes for the September trailer track'

    # --- Pre-rebrand asset pack (September cyan brand) ---
    if p.startswith('asset-pack/characters/'):
        return X, 'high', 'Hooded LED-visor contestants and rigs (cyan brand); banned by SHARED-RULES'
    if p.startswith('asset-pack/avatars/'):
        return X, 'high', 'Pepe/bull/bear sticker avatars; retired in the app 24 Oct'
    if p.startswith('asset-pack/props/'):
        return X, 'high', 'Glass-tower / arena props for the September film'
    if p.startswith('asset-pack/raw-clips/'):
        return X, 'high', 'Screen recording of the cyan app (PUMP/DUMP, pepes)'
    if p.startswith('asset-pack/yochi-card-16x9') or b in ('1.png', 'ffa-victory-full.png'):
        return X, 'high', 'Cyan-era mode card / app capture'
    if b == 'Yochi_logo.png':
        return X, 'high', 'Retired cyan Y raster (same image as yochi-mark-original-cyan.png)'
    if p.startswith('stills/'):
        return X, 'high', 'Screenshot of the cyan app (28 Sep, reference for the September film)'
    if p.startswith('film/'):
        return X, 'high', 'September cyan trailer: assets and renders (SHARED-RULES: "that film is the retired brand")'

    # --- Approved co-branded cards ---
    if p.startswith('card-elysium-landscape/deliverables/'):
        if 'wash107' in b: return L, 'high', 'Comparison render (+7% wash); the non-suffixed files are the approved version'
        return A, 'high', 'Approved 16:9 YOCHI x ELYSIUM testnet card'
    if p.startswith('card-elysium/deliverables/'):
        return L, 'medium', '4:5 YOCHI x ELYSIUM testnet card (v1; ELYSIUM in type, no official mark)'
    if p.startswith('card-elysium'):
        return L, 'high', 'Copy of kit asset inside the card project'

    # --- The USDC short (under review) ---
    if p.startswith('shorts/01-usdc-eliminated/deliverables/'):
        return U, 'high', 'USDC vs HYPE v1 render: invented pixel fighters, not the painted cast. Under review'
    if p.startswith('shorts/assets/'):
        return L, 'high', 'Copy of kit / Elysium asset inside the shorts engine'

    # --- Branch-only Sumi-era assets ---
    if branch:
        if '/cast/source/' in p:
            return L, 'high', ('Copy of the owner\'s v2 painting inside the flagship project (canonical copy now in '
                               'asset-pack/sumi/avatars/)')
        if '/avatars/portraits/' in p and '-v2' in b and ('perma' in b or 'cold' in b):
            return L, 'high', 'Copy of the kit\'s v2 portrait used for app-framed slots in the locked first ad'
        if '/avatars/portraits/' in p:
            return A, 'high', 'Copy of the kit portrait used for app-framed small slots in the locked first ad'
        if '/cast/raw/' in p:
            return L, 'high', 'Raw BiRefNet matte of a kit card (THE CAST pipeline); input to cast_prep.py'
        if re.search(r'-(fig)\.webp$', b):
            return L, 'high', 'Figure cut-out (transparent) from the THE CAST pipeline. Reuse for 2.5D'
        if re.search(r'-(plate)\.webp$', b):
            return L, 'high', 'Background plate (figure filled) from THE CAST pipeline. Reuse for parallax'
        if re.search(r'-(card)\.webp$', b):
            return L, 'high', 'Half-size framed card from THE CAST pipeline'
        if '/achievements/' in p:
            return L, 'high', 'Achievement badge copied from the app (app/client/public/achievements)'
        if '/logo/' in p or '/fonts/' in p:
            return L, 'high', 'Copy of kit asset inside the film project'
        if 'first-ad-final' in b:
            return A, 'high', 'The locked first ad (latest signed-off film). Primary style reference'
        if 'yochi-flagship.' in b or 'yochi-flagship-poster' in b or 'yochi-flagship-contact' in b:
            return A, 'high', 'Approved flagship trailer (fallback)'
        if 'film-flagship/deliverables/' in p:
            return L, 'medium', 'Review cut on the flagship / first-ad approval chain'
        if 'film-cast/' in p:
            return L, 'high', 'THE CAST (Sumi). Base of the flagship'
        if 'film-gameplay/' in p:
            return L, 'high', 'Elysium gameplay trailers built from the real UI captures (mainnet cut: hold until mainnet)'
        if 'film-yochi/' in p:
            return U, 'medium', ('予知 film from 17 Oct: sumi-e, but made before the kit landed (28 Oct) and never '
                                 'carried forward. Not evidence of current rules')
    if p.startswith('shorts/'):
        return U, 'medium', 'Shorts engine file'
    return U, 'low', 'Unclassified'


def kind_of(b):
    e = b.rsplit('.', 1)[-1].lower()
    return {'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'webp': 'image', 'gif': 'image', 'svg': 'vector',
            'mp4': 'video', 'mov': 'video', 'mkv': 'video', 'wav': 'audio', 'mp3': 'audio'}.get(e, 'font')


def describe(path, data):
    k = kind_of(path)
    dims, alpha, dur = '', '', ''
    try:
        if k == 'image': dims, alpha = probe_image(data)
        elif k == 'vector': dims, alpha = svg_dims(data)
        elif k in ('video', 'audio'):
            dims, dur = probe_av(data, os.path.splitext(path)[1])
            alpha = 'none'
    except Exception as e:
        dims = f'error: {e}'
    return k, dims, alpha, dur


def main():
    load_kit_table()
    rows = []
    tracked = git('ls-files').splitlines()
    for p in tracked:
        if not MEDIA.search(p) or SKIP.search(p): continue
        data = open(os.path.join(ROOT, p), 'rb').read()
        k, dims, alpha, dur = describe(p, data)
        tier, conf, purpose = classify(p, None)
        rows.append({'path': p, 'branch': '(this branch)', 'kind': k, 'bytes': len(data), 'dims': dims,
                     'transparency': alpha, 'duration': dur, 'tier': tier, 'confidence': conf, 'purpose': purpose,
                     **provenance(p)})
    for ref, prefix in BRANCH_SOURCES:
        for p in git('ls-tree', '-r', '--name-only', ref, prefix).splitlines():
            if not MEDIA.search(p) or SKIP.search(p): continue
            data = subprocess.run(['git', '-C', ROOT, 'show', f'{ref}:{p}'], capture_output=True).stdout
            k, dims, alpha, dur = describe(p, data)
            tier, conf, purpose = classify(p, ref)
            rows.append({'path': p, 'branch': ref.replace('origin/', ''), 'kind': k, 'bytes': len(data), 'dims': dims,
                         'transparency': alpha, 'duration': dur, 'tier': tier, 'confidence': conf, 'purpose': purpose,
                         **provenance(p, ref)})
    cols = ['tier', 'confidence', 'path', 'branch', 'kind', 'dims', 'transparency', 'duration', 'bytes', 'purpose',
            'first_commit', 'first_author', 'first_date', 'first_subject', 'last_commit', 'last_date', 'n_commits']
    order = {'APPROVED / CURRENT': 0, 'LIKELY CURRENT': 1, 'UNCERTAIN / NEEDS REVIEW': 2, 'LEGACY / DO NOT USE': 3}
    rows.sort(key=lambda r: (order[r['tier']], r['branch'] != '(this branch)', r['path']))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', newline='', encoding='utf8') as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore')
        w.writeheader(); w.writerows(rows)
    from collections import Counter
    print(f'{len(rows)} assets -> {os.path.relpath(OUT, ROOT)}')
    for t, n in sorted(Counter(r['tier'] for r in rows).items(), key=lambda x: order[x[0]]): print(f'  {t}: {n}')


if __name__ == '__main__':
    main()
