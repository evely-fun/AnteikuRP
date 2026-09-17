# ANTEIKU RolePlay

Hero screen only. Static files in `site/`, no build step, no runtime requests
to any third party.

## Layout reference

The composition follows the agreed reference: a fixed full viewport hero, a
centred title stack, two foreground characters flanking it and one dimmed
character behind, blurred square clusters on both edges, a promo strip pinned
to the bottom. The geometry was matched against the reference at every
breakpoint; the CSS is written from scratch rather than copied.

Two deliberate departures:

- **No launcher button.** The reference sells a download. This server has no
  launcher, so the same slot carries **Скопировать IP**, which copies
  `config.serverIp` to the clipboard and confirms with a toast.
- **Logo lockup.** The mark is a geometric SVG and the wordmark is live text
  in Montserrat, rather than one traced image. It stays sharp at any size and
  the wordmark can be restyled without re-exporting artwork.

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

`site/img/pers/1-3.webp` are placeholders: transparent-background Minecraft
renders in the three hero slots (front left, front right, dimmed rear). Drop
in your own at the same paths and the layout needs no changes.

## Verified

Chromium at 1920, 1440, 1280, 1024, 834, 390 and 360, plus English and
forced reduced motion. Zero console errors, zero failed requests, no header
overflow at any width, no horizontal page scroll, Montserrat confirmed
loaded, and the copy button verified to put the address on the clipboard.

## Local preview

```
cd site && python3 -m http.server 8080
```

## Notes

Montserrat is self hosted in `site/fonts/`, latin and cyrillic subsets only,
so the page makes no call to Google Fonts. `--vh` is recalculated on resize
and orientation change so the hero stays exactly one screen tall while mobile
browser chrome collapses.
