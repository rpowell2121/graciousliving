"""Download Gracious Living's own images and PDFs from the GoDaddy site.

Runs once in GitHub Actions (GitHub's runners can reach GoDaddy's image
servers). Images are saved as WebP in public/img/, at most 1600px wide,
keeping transparency. PDFs go to public/docs/. Files that already exist
are skipped, so re-running is safe.
"""
import io, json, pathlib, sys, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
cfg = json.loads((ROOT / "scripts" / "assets.json").read_text())
UA = {"User-Agent": "Mozilla/5.0 (asset migration for graciouslivingllc.com)"}
failed = []

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()

for item in cfg["images"]:
    out = PUBLIC / "img" / f"{item['name']}.webp"
    if out.exists():
        continue
    try:
        im = Image.open(io.BytesIO(get(item["url"])))
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, "WEBP", quality=82, method=6)
        print(f"ok   {out.relative_to(ROOT)}  {im.width}x{im.height}  {out.stat().st_size // 1024} KB")
    except Exception as e:
        failed.append(item["name"]); print(f"FAIL {item['name']}: {e}")

for item in cfg["files"]:
    out = PUBLIC / item["path"]
    if out.exists():
        continue
    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(get(item["url"]))
        print(f"ok   {out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
    except Exception as e:
        failed.append(item["path"]); print(f"FAIL {item['path']}: {e}")

# Image sizes for width/height attributes (prevents layout shift).
sizes = {}
for p in sorted((PUBLIC / "img").glob("*.webp")):
    with Image.open(p) as im:
        sizes[p.stem] = [im.width, im.height]
(ROOT / "scripts" / "image-sizes.json").write_text(json.dumps(sizes, indent=2) + "\n")

sys.exit(1 if failed else 0)
