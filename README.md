# ANTEIKU RolePlay

Hero screen only. Static files in `site/`, no build step, no runtime requests
to any third party.

## Layout reference

The composition follows the agreed reference: a fixed full viewport hero, a
centred title stack, two foreground characters flanking it and one dimmed
character behind, blurred square clusters on both edges, a promo strip pinned
to the bottom. The geometry was matched against the reference at every
breakpoint; the CSS is written from scratch rather than copied.

Deliberate departures:

- **No launcher button.** The reference sells a download. This server has no
  launcher, so the same slot carries **Скопировать IP**, which copies
  `config.serverIp` to the clipboard and confirms with a toast.
- **Logo is type, not an image.** The header, the mobile menu and the
  preloader all carry the same live Montserrat wordmark. Nothing to export,
  sharp at any density, and it restyles with CSS. `img/logo.svg` survives
  only as the browser tab icon.
- **Surface.** The backdrop is a drawn grid masked to the centre rather than
  a tiled logo pattern, so the page ships no pattern image.
- **Restraint over glow.** The primary action gets a grounded shadow and a
  top highlight instead of a halo, and the promo code carries one steady
  accent rather than a pulsing one. Both were the kind of decoration that
  reads as machine made.

## Motion

Three independent layers per character so no transform fights another:
`.character` slides in from its edge, `.char-depth` follows the pointer, and
the image itself breathes on a slow offset loop. Entrances run in reading
order — name, sub label, action, badge, description — with the header, scroll
cue and promo strip arriving last, once the stage is set.

Pointer parallax writes `--px` / `--py` on the hero once per frame and lets a
CSS transition ease them. Smoothing in JS as well would double-ease the
transform and make the layers crawl.

Everything animated is `transform` or `opacity` only.

## Editing

- `site/js/config.js` - server address, promo code, social links, player
  count. Nothing server specific is hardcoded anywhere else.
- `site/js/i18n.js` - every string, Russian and English, matching keys. The
  markup carries `data-i18n` keys only.

### Placeholders to replace before launch

| Value | Key | Current |
|---|---|---|
| Server address | `serverIp` | `play.anteiku.fun` |
| Promo code | `promoCode` | `ANTEIKU` |
| Discord, Telegram, YouTube, TikTok, VK | `links` | `*/anteiku*` |
| Support bot, rules, donate | `links` | placeholder paths |
| Player count | `fallbackOnline` | 1240 |

Set `statusEndpoint` to any URL returning `{ "players": { "online": N } }`,
the shape `api.mcsrvstat.us/2/<host>` already returns, and the count goes
live. A failed request keeps the fallback rather than showing an error.

### Characters

`site/img/pers/1-3.webp` fill the three hero slots: front left, front right,
and a dimmed rear figure. They are generated to match the reference set in
`assets/` — orthographic voxel, flat matte shading with soft ambient
occlusion, no rim light, no glow, no cinematic grade — and are anime genre
archetypes rather than any specific licensed character. Drop replacements in
at the same paths and the layout needs no changes.

## Verified

Chromium at 1920, 1440, 1280, 1024, 834, 390 and 360, plus English and
forced reduced motion. Zero console errors, zero failed requests, no header
overflow at any width, no character overlapping the copy column at any width,
no horizontal page scroll, Montserrat confirmed loaded, and the copy button
verified to put the address on the clipboard.

Motion is asserted rather than assumed: the reveal is sampled at 250, 700,
1100, 1500, 2000 and 2900ms, the idle loop is confirmed running on the image
layer, and the parallax is confirmed to actually move the depth layer.

## Local preview

```
cd site && python3 -m http.server 8080
```

## Notes

Montserrat is self hosted in `site/fonts/`, latin and cyrillic subsets only,
so the page makes no call to Google Fonts. `--vh` is recalculated on resize
and orientation change so the hero stays exactly one screen tall while mobile
browser chrome collapses.
