"""Build public/*.html from templates/pages/*.html plus shared partials.

Each page template starts with a JSON block between <!--meta and -->:
  <!--meta {"out": "about.html", "path": "/about", "title": "...", "description": "...",
             "header": "inner", "nav": "about", "schema": true} -->
The rest of the file is the page's <main> content. The script wraps it with
the shared <head>, header, "Connect With Us" block and footer, so those are
edited in one place (templates/partials/).

Run:  python3 scripts/build_pages.py
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "templates"
PUBLIC = ROOT / "public"
SITE = "https://graciouslivingllc.com"

def part(name):
    return (T / "partials" / name).read_text()

NAV = [("home", "/", "Home"), ("about", "/about", "About")]
MORE = [("services", "/services", "Services"), ("referral-partners", "/referral-partners", "Referral Partners"),
        ("careers", "/careers", "Careers"), ("contact", "/contact", "Contact"), ("intake-form", "/intake-form", "Intake Form")]

def nav_html(current):
    top = "\n".join(f'    <a href="{h}"{" aria-current=\"page\"" if k == current else ""}>{t}</a>' for k, h, t in NAV)
    more = "\n".join(f'        <a href="{h}"{" aria-current=\"page\"" if k == current else ""}>{t}</a>' for k, h, t in MORE)
    more_on = " more-on" if current in [k for k, _, _ in MORE] else ""
    return top, more, more_on

def build(src):
    raw = src.read_text()
    m = re.match(r"\s*<!--meta\s+(\{.*?\})\s*-->\s*", raw, re.S)
    meta = json.loads(m.group(1)); body = raw[m.end():]
    top, more, more_on = nav_html(meta.get("nav", ""))
    canonical = SITE + meta["path"]
    head = part("head.html")
    schema = part("schema.html") if meta.get("schema") else ""
    breadcrumb = ""
    if meta["path"] != "/":
        breadcrumb = ('<script type="application/ld+json">' + json.dumps({
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": meta["crumb"], "item": canonical}]}) + "</script>")
    for k, v in {"title": meta["title"], "description": meta["description"], "canonical": canonical,
                 "og_title": meta.get("og_title", meta["title"]), "extra_head": meta.get("extra_head", "") + schema + breadcrumb,
                 "preload": meta.get("preload", "")}.items():
        head = head.replace("{{" + k + "}}", v)
    header = part("header.html").replace("{{nav_top}}", top).replace("{{nav_more}}", more) \
        .replace("{{more_on}}", more_on).replace("{{header_class}}", meta.get("header", "inner"))
    connect = part("connect.html") if meta.get("connect", True) else ""
    # Inline the stylesheet (about 6 KB gzipped) so first paint doesn't wait on a separate CSS request.
    css = (PUBLIC / "css" / "site.css").read_text()
    head = head.replace('<link rel="stylesheet" href="/css/site.css">', "<style>" + css + "</style>")
    html = head + header + '<main id="main">\n' + body.rstrip() + "\n" + connect + "</main>\n" + part("footer.html")
    (PUBLIC / meta["out"]).write_text(html)
    return meta["out"]

if __name__ == "__main__":
    built = [build(p) for p in sorted((T / "pages").glob("*.html"))]
    print("built:", ", ".join(built))
