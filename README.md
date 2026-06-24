# bac-water-site

Demo e-commerce storefront for **bacteriostatic ("BAC") water** — built by Palmetto AI to pitch a prospect. Placeholder brand: **Water4Peptides** (swap freely).

**Live demo:** https://palmettoai.github.io/bac-water-site/

## What it is
A fast, dependency-free static storefront with a working client-side cart and a simulated checkout. No backend, no real payments — designed to *show* a prospect what their store could look and feel like.

- **Archetype:** Swiss/clinical-lab aesthetic — Certificate-of-Analysis motif, bespoke SVG vials (liquid fill scales with volume), monospace spec labels.
- **Type:** Space Grotesk · IBM Plex Sans · IBM Plex Mono.
- **Cart:** localStorage-backed, slide-out drawer, free-shipping progress bar.
- **Checkout:** order summary + simulated payment → client-side confirmation (no data leaves the browser).
- **Compliance:** prominent "research use only" positioning throughout (standard for non-pharmacy BAC water).

## Structure
```
index.html          storefront (hero, products, COA/quality, how-to, FAQ, compliance)
checkout.html       cart review + simulated checkout + confirmation
assets/css/styles.css   design tokens + all components
assets/js/store.js      product catalog + cart + drawer + checkout logic
robots.txt · sitemap.xml · 404.html
```

## Swapping for a real client
1. **Products:** edit the `PRODUCTS` array at the top of `assets/js/store.js` (single source of truth — name, SKU, price, volume, chips).
2. **Brand:** find/replace `Water4Peptides` in `index.html`, `checkout.html`, `404.html`; update the inline droplet SVG in the header/footer.
3. **Domain:** update the canonical / `og:url` / sitemap URLs and add a `CNAME` file when a custom domain is assigned.
4. **Payments:** replace the simulated payment panel in `checkout.html` with a live Stripe / Shopify Buy Button when the prospect signs.
5. **OG image:** `assets/og.png` (1200×630) — regenerate per brand.

## Deploy
GitHub Pages, served from `main` branch root. Static — no build step.

> **Demo only.** No payment is processed and nothing ships. For laboratory and research use only — not a drug, not FDA-evaluated, not for human or veterinary use.
