"""Creates characters/<id>/character.json for a painted cast member from house data, so scaling to the whole
collection needs no hand-authored hints. Then run prepare_character.py <id> and review build/check.jpg.

    python3 prep/add_character.py ronin --card asset-pack/sumi/avatars/cards/ronin.webp
    python3 prep/add_character.py whale --card ... --whole-image "matte took the whole painting (audit)"
    python3 prep/add_character.py quick-draw --card <path> --whole-image "no house matte" --head 860,520

Matte: the raw BiRefNet matte from the house cast pipeline (`git show` from the branch below, copied into the
character folder), unless --whole-image. Head point: the cast pipeline's (cast.json, painting px + rect origin),
unless --head. Existing character.json files are never overwritten (pass --force to regenerate).
"""
import argparse, json, os, subprocess

PKG = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT = os.path.abspath(os.path.join(PKG, ".."))
BRANCH = "origin/claude/yochi-first-ad-order-a"
CAST = "film-flagship/assets/cast"
RECT0 = (72, 150)


def git_show(path):
    return subprocess.run(["git", "-C", ROOT, "show", f"{BRANCH}:{path}"], capture_output=True, check=True).stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("--card", required=True, help="card path, relative to the repo root")
    ap.add_argument("--name")
    ap.add_argument("--cast-id", help="id in the house cast pipeline (default: card file name without -v2)")
    ap.add_argument("--whole-image", metavar="REASON")
    ap.add_argument("--head", help="x,y in card px")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    cdir = os.path.join(PKG, "characters", a.id)
    path = os.path.join(cdir, "character.json")
    if os.path.exists(path) and not a.force:
        print(f"{a.id}: character.json exists, left as is")
        return
    os.makedirs(cdir, exist_ok=True)
    stem = os.path.splitext(os.path.basename(a.card))[0]
    cast_id = a.cast_id or stem.replace("-v2", "")
    cast = json.loads(git_show(f"{CAST}/cast.json"))
    entry = cast.get(stem) or cast.get(cast_id)
    if a.head:
        head = [int(v) for v in a.head.split(",")]
    elif entry:
        head = [round(entry["head"][0] + RECT0[0]), round(entry["head"][1] + RECT0[1])]
    else:
        raise SystemExit(f"{a.id}: no house head point; pass --head x,y")
    if a.whole_image:
        matte = {"source": "none", "provenance": f"Whole-image treatment: {a.whole_image}."}
    else:
        data = raw = None
        for cand in dict.fromkeys([a.cast_id, stem, cast_id]):
            if not cand:
                continue
            try:
                raw = f"{CAST}/raw/{cand}.png"
                data = git_show(raw)
                break
            except subprocess.CalledProcessError:
                continue
        if data is None:
            raise SystemExit(f"{a.id}: no house raw matte for {stem}; use --whole-image or author a grabcut matte")
        open(os.path.join(cdir, "source-matte.png"), "wb").write(data)
        sha = subprocess.run(["git", "-C", ROOT, "log", "-1", "--format=%h %cs", BRANCH, "--", raw], capture_output=True, text=True).stdout.strip()
        matte = {"source": "cast", "file": "source-matte.png",
                 "provenance": f"Raw BiRefNet matte from the house cast pipeline: {BRANCH.split('/', 1)[1]}:{raw} ({sha}), copied."}
    cfg = {
        "id": a.id,
        "name": a.name or a.id.replace("-", " ").title(),
        "card": a.card,
        "ground": "paper",
        "matte": matte,
        "anchor": [head[0], 1978],
        "head": head,
        "headNote": "house cast.json head point" if not a.head else "authored",
    }
    json.dump(cfg, open(path, "w"), indent=1)
    print(f"{a.id}: {matte['source']} matte, head {head}")


if __name__ == "__main__":
    main()
