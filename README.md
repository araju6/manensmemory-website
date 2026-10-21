# manensmemory.com

The Manens marketing site. One static page, no build step, no dependencies,
no package manager. Served directly by GitHub Pages from `main` at the
repository root.

---

## Run it locally

```bash
python3 -m http.server 8000
# → http://127.0.0.1:8000
```

Use a server rather than opening `index.html` with `file://`. The page is fine
either way, but `file://` changes how relative paths and the Content Security
Policy behave, so what you see won't match production.

There is nothing to install, compile or watch. Edit a file, reload the page.
The site ships **no JavaScript at all** — if you find yourself adding some, check
first whether CSS can do it.

One local caveat: submitting the contact form redirects to the production
thank-you page, because the redirect target is an absolute URL. The submission
itself works fine from localhost.

---

## Layout

| Path | Purpose |
|------|---------|
| `index.html` | The home page. Content lives here. |
| `contact/index.html` | The design-partner form. |
| `contact/thanks/index.html` | Where the form redirects after a successful send. |
| `style.css` | All styling for every page. Design tokens are in `:root` at the top. |
| `404.html` | Served by GitHub Pages for unknown paths. |
| `fonts/` | Self-hosted woff2 + their OFL licences. See `fonts/README.md`. |
| `favicon.svg` | Browser tab mark. |
| `apple-touch-icon.png` | 180×180 iOS home-screen icon (iOS rejects SVG here). |
| `og.png` | 1200×630 social preview card. |
| `CNAME` | Custom domain for GitHub Pages. Must contain exactly `manensmemory.com`. |
| `robots.txt`, `sitemap.xml` | Crawler directives. The site is indexable. |
| `.nojekyll` | Stops GitHub Pages running the files through Jekyll. |

---

## Things you will actually want to change

### Where the email address lives

Nowhere in this repository. The site contains no `mailto:` link and no address
in its markup — that was deliberate, to keep both inboxes out of reach of
scrapers. Every "get in touch" path leads to `/contact/`, and the destination
address is held by Web3Forms against the access key. To change who receives
enquiries, change it in the Web3Forms dashboard, not here.

### Copyright year

`index.html` and `404.html` footers. Hard-coded on purpose — a date computed in
JavaScript would disagree with what a crawler sees.

### Colour, spacing and type

Everything is a CSS custom property in the `:root` block at the top of
`style.css`. Change the token, not the rule that uses it.

```css
--accent:        #2FB8A8;   /* links, diagram, focus rings */
--accent-fill:   #0E7A70;   /* filled button background */
--section:       60px;      /* vertical gap between sections (84px ≥880px) */
--shell:         1060px;    /* max content width */
--gutter:        16px;      /* side padding (32px ≥880px) */
```

The site is single-theme dark and declares `color-scheme: dark`. To add a light
theme later, duplicate the `:root` token block inside a
`@media (prefers-color-scheme: light)` and override the values. No other rule
needs to change, because no colour is hard-coded outside `:root`.

---

## Adding a section

Follow the existing pattern so spacing and the top border come for free:

```html
<section class="section" id="your-id" aria-labelledby="your-id-title">
  <div class="shell">
    <h2 class="display" id="your-id-title">Your title</h2>
    <!-- content -->
  </div>
</section>
```

- `.section` supplies the vertical rhythm, divider and `scroll-margin-top`.
- `.shell` supplies the max-width and side gutters. Always nest one inside the other.
- The header deliberately holds only the wordmark and one call to action. It
  has no anchor links and therefore needs no mobile menu, which is why the site
  ships no JavaScript. Adding nav links back means reintroducing a mobile menu —
  weigh that before doing it.

Reusable pieces already defined: `.card-grid` / `.card`, `.feature-grid` /
`.feature`, `.steps` / `.step`, `.timeline`, `.pullout`, `.btn.btn-primary`,
`.link-arrow`, `.display`, `.measure` (line-length limit, nest inside `.shell`),
and the `.field` / `.hint` form primitives.

---

## The contact form

`contact/index.html` POSTs to [Web3Forms](https://web3forms.com), which relays
the submission by email. There is no server and no JavaScript involved — it is
a plain HTML form, so it works with scripting disabled.

### Flow

1. Visitor fills in name, work email, company (optional) and message.
2. The browser POSTs to `https://api.web3forms.com/submit`.
3. Web3Forms emails the address verified against `access_key`, setting
   **Reply-To to the visitor's email**, so replying in Gmail reaches them directly.
4. Web3Forms redirects the browser to `/contact/thanks/`.

### The hidden fields

| Field | Why it's there |
|---|---|
| `access_key` | Routes to the verified inbox. Public by design — it can only deliver to that one address, so exposing it costs nothing. |
| `subject` | Subject line of the notification email. |
| `from_name` | Sender name shown in the notification. |
| `redirect` | Absolute URL of the thank-you page. Must stay absolute. |
| `botcheck` | Honeypot. Hidden off-screen by `.botcheck`; bots fill it, people can't. **Do not remove.** |

`replyto` is not set explicitly — Web3Forms uses the `email` input automatically.

### Both founders receiving enquiries

The Web3Forms free tier (250 submissions/month) delivers to **one** verified
address; CC is a paid feature. Two ways to get mail to both people:

- **Gmail forwarding** — in the receiving account: Settings → Forwarding →
  add the second address. Free, takes a minute.
- **A `hello@manensmemory.com` forwarder** at the domain registrar, pointing at
  both inboxes, with Web3Forms verified against `hello@`. Tidier long-term:
  the routing stops depending on anyone's personal account.

### Spam

The honeypot stops ordinary bots. If targeted spam starts arriving, add
Cloudflare Turnstile or hCaptcha — both are Web3Forms features, and both will
need their domains added to `script-src` and `frame-src` in this page's CSP.

---

## Content Security Policy

Every page carries a strict CSP in a `<meta>` tag, because GitHub Pages cannot
set HTTP response headers. `contact/index.html` additionally allows
`form-action https://api.web3forms.com`; no other page may submit anywhere. The policy is
`default-src 'none'` with `'self'` for styles, scripts, fonts and images, so
**the page is allowed to make no third-party requests at all**.

This will silently block things if you are not expecting it:

| If you add… | You must… |
|---|---|
| Any JavaScript | There is currently none, and `script-src` allows only the JSON-LD hash. Add an external file and allow `'self'`. Never `'unsafe-inline'`. |
| An inline `style="…"` attribute | Move it into `style.css`. |
| An analytics snippet, embed, or any external script | Add that origin to `script-src` and `connect-src` — and reconsider, since it ends the no-third-party property. |
| A webfont from a CDN | Don't. Self-host it in `fonts/` instead. |
| A different form backend | Update `form-action` in `contact/index.html` to its domain. |
| An image from another domain | Add that origin to `img-src`, or commit the image here. |

Check for violations in the browser console; CSP failures appear there and
nowhere else.

Two header-only protections cannot be set from a `<meta>` tag and are therefore
absent: `X-Frame-Options` / `frame-ancestors` (clickjacking) and
`X-Content-Type-Options`. This is a GitHub Pages limitation. If that ever
matters, put the site behind a CDN that can add response headers.

### Editing the structured data

The JSON-LD block in `index.html` is an inline script, so the CSP allows it by
**SHA-256 hash**. If you change a single character inside it, regenerate the
hash and update `script-src`:

```bash
python3 - <<'PY'
import base64, hashlib, re
html = open('index.html').read()
block = re.search(r'<script type="application/ld\+json">\n(.*?)\n</script>', html, re.S).group(1)
print('sha256-' + base64.b64encode(hashlib.sha256(block.encode()).digest()).decode())
PY
```

If the hash is wrong the page still works — only the structured data is
dropped — but search engines stop seeing it.

---

## Before you push a change

No CI is configured, so this is manual:

- [ ] Load it at phone width (390px) and confirm no horizontal scrolling.
- [ ] Tab through the page — every link and button must show a visible focus ring.
- [ ] Browser console is clean, in particular no CSP violations.
- [ ] If you touched the JSON-LD, the CSP hash was regenerated.
- [ ] If you touched the copy in `index.html`, the `<meta name="description">`
      and the Open Graph / Twitter descriptions still match.
- [ ] If you touched the form, send a real test submission and confirm it
      arrives, that Reply-To is the submitter, and that `/contact/thanks/` loads.

---

## Deployment

GitHub Pages serves `main` from the repository root. Pushing to `main`
publishes; there is no build step and no action to configure.

`CNAME` is what binds the custom domain. **Do not delete or rename it** — the
GitHub Pages settings UI rewrites this file, and removing it drops the custom
domain.

DNS for the apex domain uses GitHub's four A records and four AAAA records,
with `www` as a CNAME to `araju6.github.io`. "Enforce HTTPS" must be enabled in
Settings → Pages once the certificate has been provisioned.
