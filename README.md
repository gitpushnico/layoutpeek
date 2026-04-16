# LayoutPeek

Bookmarklet: hover any element for dimensions, spacing, and alignment; ruler lines (**G**, then **H** / **V**) and **Alt**/**Option**-measure for distances. Runs only in your browser tab.

**Live:** [layoutpeek.xyz](https://layoutpeek.xyz).

Made by [gitpushnico](https://github.com/gitpushnico).

## Quick start

- On the live site, add the bookmark: drag **LayoutPeek** to the bar (Chrome/Firefox) or **Copy code** → new bookmark URL (Safari).
- Open any page and click the bookmark.
- Hover for readouts; **G** for ruler mode, **H** / **V** to place lines, **Alt**/**Option** to measure from a line.

## How it’s built

**Vite** builds an **IIFE** bookmarklet, inlined into static pages under `landing/`. From clone: `npm ci` → `npm run build` → `npm run release`. Preview the same landing as the live site locally with `npx serve landing`.

## License

MIT — see `LICENSE`. Third-party assets and logo attribution are in `THIRD_PARTY_NOTICES.md`.
