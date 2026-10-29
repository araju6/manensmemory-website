# manens — site

A static site: the home page and a results page. White, black, one red.
No build step, no package manager, no third-party requests. The typographic
feel (mono labels, one oversized lowercase headline) borrows from
[maximiliankaspar.com](https://www.maximiliankaspar.com/), credited in the footer.

---

## Run it locally

```bash
python3 -m http.server 8000
# → http://127.0.0.1:8000
```

Use a server rather than `file://` so the Content Security Policy behaves as
it will in production. Edit a file, reload.

---

## Files

| Path | Purpose |
|------|---------|
| `index.html` | The home page. |
| `results/index.html` | The simulation results: setup, what the memory held, the three measurements, limits. |
| `style.css` | All styling for both pages. Tokens in `:root`; `--red` is the one accent. |
| `script.js` | The brain, tab highlighting, and the with/without animation. No dependencies. Home page only. |
| `fonts/` | Self-hosted Instrument Sans (text) and Geist Mono (labels, data). Both OFL. |
| `favicon.svg` | Red square. |

---

## Home page, top to bottom

1. **Hero** — "the place remembers." beside a rotating brain.
2. **Product** — two robots put the glasses away on a 12-second loop. Both
   are trained; only one knows this household keeps glasses on the left
   shelf. The one without memory puts them on the right and a person moves
   them. The one with manens reads the preference and gets it right first time.
3. **Results** — the three simulation numbers as bars, with the setup in one
   paragraph and a link to the full results page.
4. **Environment** — memory belongs to the place: an environment ID card
   between what writes into it and what queries it, then two example queries
   (a robot mid-task; a person in their LLM via MCP).
5. **How it works** — reads / serves / checks, the stack diagram, two memory
   excerpts (a home, a warehouse).
6. **Contact** — design-partner form (Web3Forms, same access key as
   manensmemory.com, redirects to that site's thank-you page).

## Results page

Everything on it comes from the simulation as described so far: 24,000
household tasks, about 500 hours, same model in both conditions, a plain-text
memory of preferences, rules, object locations and location probabilities;
64 → 83 % task success, 15 → 0 % rule violations, and a new robot given the
old robot's memory performing on par. The "what this does not show" section
is there so the numbers can be trusted. When there is more detail (simulator,
task families, how "on par" was measured), it belongs on this page.

---

## How the pieces work

**Red.** The blinking square, the active tab, one phrase per headline
(`<em>`), the with-manens side of the comparison, the improved bars, the
manens block in the stack diagram, the brain, and the primary button.
Nowhere else.

**The brain.** A procedural point cloud in `script.js`: an ellipsoid with a
deep central fissure and sine-wave folds for the two hemispheres, a smaller
ellipsoid for the cerebellum, a short stem. Each point carries a fold value
(ridge or sulcus) and an approximate surface normal. Points are shaded by how
much they face the camera, with ridges dense and folds faint, which is what
makes a dot cloud read as a brain. Faint fibres join nearby points; a few
points "fire" black every half second. The camera sits well above, so the
top view with both hemispheres is always in frame while it turns. Pointer
movement nudges the angle. Under `prefers-reduced-motion` it draws one frame.

**Tabs.** Mono, boxed when active, with a red square. The tab for whichever
section is at a third of the viewport height is marked.

**The comparison.** Two SVG kitchens with a `<path data-route>` each. The
script moves the robot along the path, carries the glasses group with it,
drops them on a shelf, and in the without-memory panel shows the correction.
Timings are at the top of section 3 in `script.js`.

---

## Things you will want to change

- **Copy** — in the two HTML files. Headlines are `.display`; the red phrase
  in each is the `<em>`.
- **Numbers** — the bars are SVG `rect` widths (out of 300 px for 100 %) in
  both HTML files; change both places together.
- **Contact form** — if this site gets its own domain, point the `redirect`
  hidden field at a thank-you page here.

---

## Content Security Policy

Declared in a `<meta>` tag on each page. Same-origin styles, scripts, fonts
and images, plus `form-action` to Web3Forms on the home page. Inline
`style=""` attributes and inline `<script>` are blocked, so put them in the
files. SVG presentation attributes (`fill`, `stroke`, `transform`) are fine.

---

## Deployment

Served by GitHub Pages from `main` at the repository root. Pushing to `main`
deploys. `CNAME` must contain exactly `manensmemory.com`; `.nojekyll` stops
GitHub running the files through Jekyll. `/contact/` redirects to the form on
the home page; `/contact/thanks/` is where Web3Forms sends people after a
successful submission, so keep that path.
