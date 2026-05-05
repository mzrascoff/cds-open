"""Fetch HTML-published CDS pages and convert to layout text.

Some institutions (MIT post-2018, others) publish CDS as web pages instead
of PDFs. This script:
  1. Downloads the HTML from each URL in HTML_MANIFEST
  2. Extracts the body text (strips nav, footer, scripts, styles)
  3. Trims to start at "A. GENERAL INFORMATION" or the first field code
  4. Saves to raw_text/cds-<year>.txt in the SAME format as pdftotext output

After this runs, the existing parse_blocks.py and extract_metrics.py work
unchanged - the rest of the pipeline doesn't care whether text came from a
PDF or HTML page.

Configure HTML_MANIFEST in this file or load from manifest_html.py.
"""
import os, re, sys, urllib.request, html as html_lib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "raw_text")
os.makedirs(OUT, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"

def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=30).read()

def html_to_layout_text(src):
    """Convert raw HTML to a pdftotext-style layout text.
    Pipeline: strip <script>/<style>/<head>/<nav>/<footer>, replace block-end
    tags with newlines, strip all other tags, decode HTML entities, normalise
    whitespace, and trim to start at the first CDS body marker."""
    if isinstance(src, bytes):
        src = src.decode("utf-8", errors="ignore")
    text = src
    for tag in ("script", "style", "head", "header", "footer", "nav"):
        text = re.sub(rf"<{tag}[^>]*>.*?</{tag}>", "", text, flags=re.DOTALL | re.I)
    # Try to scope to <article> if the site uses it (most WP themes do)
    m = re.search(r"<article[^>]*>(.*?)</article>", text, flags=re.DOTALL | re.I)
    if m:
        text = m.group(1)
    # Block-ending tags become newlines
    text = re.sub(r"<(br|/p|/div|/li|/tr|/h[1-6])[^>]*>", "\n", text, flags=re.I)
    # Strip remaining HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    text = html_lib.unescape(text)
    # Normalise whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]*", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Trim to first CDS body marker
    m = re.search(r"A\.\s+GENERAL\s+INFORMATION|^\s*A1\.\s+Address", text, re.I | re.M)
    if m:
        text = text[m.start():]
    return text.strip()

def fetch_one(year_label, source):
    out_path = os.path.join(OUT, f"cds-{year_label}.txt")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"  [skip] {year_label}: already have {os.path.getsize(out_path):,} bytes")
        return True
    try:
        if source.startswith(("http://", "https://")):
            raw = http_get(source)
        elif os.path.isabs(source) and os.path.exists(source):
            raw = open(source, "rb").read()
        else:
            print(f"  [err] {year_label}: unrecognized source")
            return False
        text = html_to_layout_text(raw)
        if len(text) < 5000 or "A1" not in text[:1000]:
            print(f"  [err] {year_label}: extracted text too short or missing field codes ({len(text)} chars)")
            return False
        with open(out_path, "w") as f:
            f.write(text)
        print(f"  [ok]  {year_label}: {len(text):,} chars -> raw_text/cds-{year_label}.txt")
        return True
    except Exception as e:
        print(f"  [err] {year_label}: {e}")
        return False

def main():
    sys.path.insert(0, os.path.dirname(__file__))
    try:
        from manifest_html import HTML_MANIFEST
    except ImportError:
        print("ERROR: scripts/manifest_html.py not found.")
        sys.exit(1)
    if not HTML_MANIFEST:
        print("ERROR: HTML_MANIFEST is empty.")
        sys.exit(1)
    ok = sum(fetch_one(y, s) for y, s in HTML_MANIFEST)
    print(f"\nFetched {ok}/{len(HTML_MANIFEST)} HTML pages -> raw_text/")

if __name__ == "__main__":
    main()
