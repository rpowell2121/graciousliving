# graciouslivingllc.com

Rebuild of the Gracious Living LLC site (non-medical home care, Naugatuck, CT), moving off the GoDaddy builder.

- `templates/pages/*.html` page content; `templates/partials/` shared head, header, footer, Connect block and schema.
- `scripts/build_pages.py` builds `public/*.html` from the templates (and inlines `public/css/site.css`). Run `python3 scripts/build_pages.py` after editing a template or the CSS, and commit the built files. Cloudflare serves `public/` as is.
- `public/` the built site: pages, CSS, JS, fonts, images, PDFs.
- `src/worker.js` Cloudflare Worker for `/api/*`: `/api/contact` (contact forms) and `/api/apply` (careers application, resume up to 1.5 MB) both save to D1. The intake form is a Hipaatizer embed, so health information never touches this site or D1.
- `wrangler.jsonc` Worker config. Deploys from GitHub via Cloudflare Workers Builds.
- `scripts/fetch_assets.py` + `.github/workflows/fetch-assets.yml` one-time download of the site's own images and PDFs from GoDaddy (converted to WebP).

## Images
Only Gracious Living's own uploads are copied. The original hero video and 11 photos are GoDaddy-licensed Getty stock, which is only licensed on GoDaddy-hosted sites, so they need replacing (licensed stock or real photos).

## Still to do
- Create the D1 database and add the `DB` binding in `wrangler.jsonc`. Until then both forms answer 503 and the page tells visitors to call or email.
- Replace the interim photos in the Getty spots (marked with an "Interim photo" comment in the templates).
- Confirm with the client:
  - minimum-hours policy (homepage FAQ and Services FAQ disagree)
  - Medicare on the intake form
  - business hours
  - "home health care" wording
  - Medicaid wording
  - permission to show the Google reviews
  - the careers question about convictions: check it against Connecticut's fair-chance hiring law
