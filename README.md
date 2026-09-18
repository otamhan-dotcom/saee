# Dr. Saee Anawalikar — Portfolio

A static one-page portfolio site. No build step, no backend — plain HTML, CSS and JavaScript.

## Structure

```
index.html          all page content (8 sections)
css/style.css       all styling
js/main.js          scroll, animations, lightbox, carousel, gallery, nav
assets/images/      photography, organised by section
assets/og-image.jpg social share preview (1200×630)
assets/favicon.svg  site icon
```

Third-party libraries are loaded from CDNs at the bottom of `index.html`:
GSAP + ScrollTrigger (animation) and Lenis (smooth scroll).

## Page order

`01 About · 02 Testimonials · 03 Expertise · 04 Case Work · 05 Gallery · 06 Credentials · 07 Research · 08 Contact`

## Editing content

- **Text** — edit `index.html` directly. Each section is marked with a comment banner.
- **Photos** — replace the file in `assets/images/…` keeping the same filename.

### Image sizing (important)

Grid and gallery images are served at ~700px (`*-thumb.jpg`) while the lightbox
loads the full-size original. This matters: a 1600×1600 JPEG decodes to roughly
10 MB of bitmap memory, so showing 25 of them at thumbnail size made scrolling
crawl. When adding a new image, generate both:

```bash
sips -s format jpeg -s formatOptions 72 -Z 700 photo.jpg --out photo-thumb.jpg
```

Reference the `-thumb` version in `src` and the full-size one in `data-full`.

## Before committing CSS or JS changes

```bash
python3 scripts/stamp-assets.py
```

This rewrites the `?v=` hash on the stylesheet and script links in
`index.html`. GitHub Pages lets browsers cache CSS/JS for 10 minutes, so
without it a visitor can get the new page with the old stylesheet — new
markup rendered with stale styles (e.g. images blowing up to full size).

## Running locally

```bash
ruby -run -e httpd . -p 8000
```

Then open http://localhost:8000

## Deploying (free)

**GitHub Pages**
1. Push this folder to a GitHub repository.
2. Settings → Pages → source: `main` branch, `/` root.
3. Live at `https://<username>.github.io/<repo>/`

**Netlify** — drag this folder onto https://app.netlify.com/drop. The contact
form works automatically there (it already carries `data-netlify="true"`); on
GitHub Pages the form will not submit anywhere, so use the email/phone links.

### After deploying

Update the `og:image` and `twitter:image` tags in `index.html` to absolute URLs
(e.g. `https://yourdomain.com/assets/og-image.jpg`). Relative paths are ignored
by WhatsApp, LinkedIn and X when generating link previews.

## Accessibility notes

Respects `prefers-reduced-motion` (all animation is skipped). Content is written
into the markup rather than injected by JavaScript, so it remains readable if
scripts fail — except the gallery, which is generated in `main.js`.
