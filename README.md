# ANTEIKU RP

Scroll-driven landing page for a Minecraft roleplay server. Static site, no
build step, no framework, no external requests at runtime.

## Editing content

Two files cover almost everything.

- **`site/js/config.js`** holds the server address, accepted Minecraft
  versions, promo code, social links and the headline numbers. Nothing in this
  list is hardcoded anywhere else, so changing the IP here changes it in the
  header, the hero, the setup panel and the final call to action at once.
- **`site/js/i18n.js`** holds every string in Russian and English. The markup
  carries `data-i18n` keys only. Add a key to both language objects and it is
  picked up automatically; `data-i18n-html` is available where a string needs
  a line break.

### Placeholders to replace

The following values are stand-ins and must be swapped for the real ones
before launch:

| Value | Where | Current placeholder |
|---|---|---|
| Server address | `config.serverIp` | `play.anteiku.fun` |
| Discord, Telegram, YouTube, TikTok, VK | `config.links` | `*/anteiku*` |
| Support bot and donate page | `config.links` | `t.me/anteiku_support_bot`, `/donate` |
| Registered players, years, mode count | `config.stats` and `data-count` in `index.html` | 48000 / 4 / 17 |
| Promo code | `config.promoCode` | `ANTEIKU` |

### Live player count

Set `config.statusEndpoint` to any URL returning
`{ "players": { "online": 123 } }`, which is the shape the public
`api.mcsrvstat.us/2/<host>` endpoint already returns. Leave it `null` and the
site shows `config.fallbackOnline` instead. A failed request silently keeps
the fallback rather than showing an error.

## How the motion works

Tier 2 of the standard stack: GSAP with ScrollTrigger for the scenes, Lenis
for smooth scrolling, all driven by a single `gsap.ticker`. There is no second
requestAnimationFrame loop anywhere, including the two ember canvases.

The signature interaction is the **war dive** in `#war`. A wide battlefield
plate scales toward the distant explosion while a close up plate crossfades in
underneath it and continues the push. A single image cannot survive that much
scale, so the two plates were generated as a matched pair and the handoff
happens at roughly 40% of the scene.

The zoom target is computed in element pixels rather than set as a percentage,
because `object-fit: cover` crops the plate differently at every viewport
aspect and a fixed percentage origin drifts off the explosion on ultrawide and
on portrait. See `buildWarScene` in `site/js/main.js`.

`#modes` is the one Kinetic Brutalist zone: pinned horizontal scroll with a
clamped velocity skew. Below 900px it drops the pin and becomes a plain
swipeable rail.

### Reduced motion

`prefers-reduced-motion` is a complete branch, not a softened one. Pinning is
off, the war dive becomes a static plate with all three lines shown at once,
the horizontal rail becomes a normal scroll area, counters jump to their final
values and the grain stops animating.

## Verified

Chromium at 1440x900, 390x844, and with reduced motion forced.

- Zero console errors, zero warnings, zero failed requests in all three passes
- Russian and English both render, including Cyrillic in both typefaces
- Resize from 1440 to 1024 and back mid-pin leaves the pinned scene intact
- Full page scroll: median frame 16.7ms, p95 33.4ms, one frame over 50ms

## Local preview

```
cd site && python3 -m http.server 8080
```

## Deploying

The site is plain static files in `site/`. Nothing is compiled.

**Render** (currently live): a static site pointed at this repo with publish
path `site` and no build command. Pushing to the tracked branch redeploys.

**Cloudflare Pages**: `wrangler.toml` is ready. Either connect the repo in the
Cloudflare dashboard with build command empty and output directory `site`, or
add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to GitHub secrets and
let `.github/workflows/deploy-cloudflare.yml` do it on push to `main`.

`site/_headers` sets long lived caching for `assets/` and the usual security
headers. Cloudflare Pages reads that file directly. **Render does not** - it
uses its own blueprint format, so the same rules are mirrored in
`render.yaml`, and they only take effect once that blueprint is synced from
the Render dashboard. Until then Render serves its default
`max-age=0, s-maxage=300`, which is correct but not optimal for the immutable
image and font files.

## Third party code

GSAP 3.13.0, ScrollTrigger 3.13.0 and Lenis 1.3.1 are vendored into
`site/js/vendor/`. Oswald and Inter are vendored into `site/assets/fonts/`,
latin and cyrillic subsets only. The page makes no third party requests at
runtime, which removes the CDN as a point of failure and keeps visitor data
off other people's servers.

## Assets

All imagery is generated rather than stock. Prompts, verdicts and credit spend
are recorded in `assets/manifest.md`.
