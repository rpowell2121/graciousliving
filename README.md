# graciouslivingllc.com

Rebuild of the Gracious Living LLC site (non-medical home care, Naugatuck, CT), moving off the GoDaddy builder.

- `public/` static pages, CSS, JS, images. Plain HTML, no build step.
- `src/worker.js` Cloudflare Worker for `/api/*` (contact form to D1).
- `wrangler.jsonc` Worker config. Deploys from GitHub via Cloudflare Workers Builds.
- `scripts/fetch_assets.py` + `.github/workflows/fetch-assets.yml` one-time download of the site's own images and PDFs from GoDaddy (converted to WebP).

## Images
Only Gracious Living's own uploads are copied. The original hero video and 11 photos are GoDaddy-licensed Getty stock, which is only licensed on GoDaddy-hosted sites, so they need replacing (licensed stock or real photos).

## Still to do
- Pages: about, services, referral-partners, careers, contact, intake-form (Hipaatizer embed, workflow 01a1ca84-cdcd-796f-ba03-82a474e9524e)
- D1 database for the contact form (binding `DB`)
- Confirm with the client: minimum-hours policy (home vs services FAQ disagree), Medicare on the intake form, business hours, "home health care" wording
