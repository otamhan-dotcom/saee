"""Stamp css/js links in index.html with a short content hash.

Browsers cache CSS/JS (GitHub Pages sends max-age=600). If the HTML updates
but a stale stylesheet is reused, new markup renders with old styles. A hash
in the URL changes whenever the file changes, so the page always pulls the
matching version. Run before every commit that touches css/ or js/.
"""
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html_path = root / "index.html"
html = html_path.read_text()

for rel in ("css/style.css", "js/main.js"):
    digest = hashlib.sha256((root / rel).read_bytes()).hexdigest()[:10]
    html, n = re.subn(rf'({re.escape(rel)})(\?v=[0-9a-f]+)?"', rf'\1?v={digest}"', html)
    print(f"{rel}?v={digest}  ({n} reference{'s' if n != 1 else ''})")

html_path.write_text(html)
