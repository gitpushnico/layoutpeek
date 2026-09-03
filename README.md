# LayoutPeek

Bookmarklet: hover any element for dimensions, spacing, and alignment; ruler lines (**G**, then **H** / **V**); **Alt**/**Option** to measure between elements (select mode) or between ruler lines (ruler mode). Runs only in your browser tab. No account, no tracking.

**Live:** [layoutpeek.xyz](https://layoutpeek.xyz).

Made by [gitpushnico](https://github.com/gitpushnico).

## Quick start

- On the live site, add the bookmark: drag **LayoutPeek** to the bar (Chrome/Firefox) or **Copy code** → new bookmark URL (Safari).
- Open any page and click the bookmark.
- Hover for readouts; **G** for ruler mode, **H** / **V** to place lines.
- **Alt**/**Option** in select mode (**S**): measure gaps between elements (click one, then hover another) or from ruler lines to a hovered element.
- **Alt**/**Option** in ruler mode: measure the distance between placed lines of the same direction.
- **Alt+Shift** (Option+Shift): pin measurements on screen so you can release the keys and take a screenshot. Press again or click **Pinned** to unpin.

## Privacy

Fonts are IBM Plex files in this repo (`landing/fonts/`), loaded with `@font-face` from the same origin. Nothing is fetched from Google Fonts or any other font CDN at runtime.

The site sets no cookies, loads no analytics, and includes no third-party scripts. The bookmarklet runs only in the current browser tab and does not call LayoutPeek (or any other host) when you use it on another site.

`landing/vercel.json` enforces this in the Content-Security-Policy: `font-src 'self'` and `connect-src 'none'`.

## How it’s built

**Vite** builds an **IIFE** bookmarklet, inlined into static pages under `landing/`. From clone: `npm ci` → `npm run build` → `npm run release`. Preview the same landing as the live site locally with `npx serve landing`.

## License

MIT — see `LICENSE`. Third-party font licensing is in `THIRD_PARTY_NOTICES.md`.
