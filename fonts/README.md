# Fonts

Both families are self-hosted (no third-party font CDN) and licensed under the
SIL Open Font License 1.1, which permits redistribution. The full licence text
for each is included in this directory, as the OFL requires.

| File | Family | Notes |
|------|--------|-------|
| `source-sans-3-var-latin.woff2`   | Source Sans 3   | Variable, weight axis 400–600, `latin` subset |
| `instrument-serif-400-latin.woff2`| Instrument Serif| Regular only, `latin` subset |

Only the `latin` subset is shipped. If the site ever needs accented or
non-Latin characters beyond Latin-1, download the matching `latin-ext`
(or other) subset from Google Fonts and add a second `@font-face` with the
appropriate `unicode-range`.

Instrument Serif is a stand-in for Signifier (Klim Type Foundry), the serif
used as design reference. To swap in a licensed Signifier, drop its `.woff2`
here, add an `@font-face`, and change `--font-serif` in `../style.css`.
