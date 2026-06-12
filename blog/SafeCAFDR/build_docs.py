#!/usr/bin/env python3
"""Render the paper/*.md documents into styled, light-mode HTML pages under site/docs/.

Re-run after editing any markdown file:  python3 site/build_docs.py
Self-contained: no network, no JS dependencies. Cross-links between .md files are
rewritten to .html so navigation stays inside the rendered docs.
"""
import re
from pathlib import Path
import markdown

ROOT = Path(__file__).resolve().parent.parent      # IdeaExplore/
PAPER = ROOT / "paper"
OUT = ROOT / "site" / "docs"
OUT.mkdir(parents=True, exist_ok=True)

# (source markdown, output html, page title)
DOCS = [
    ("refined_proposal.md",        "refined_proposal.html",        "Refined Proposal — ForecastHarnessAudit"),
    ("research_opportunity_map.md", "research_opportunity_map.html","Research Opportunity Map"),
    ("broader_ideas.md",           "broader_ideas.html",           "Broader Ideas — Agent Trust & Security"),
    ("external_references.md",      "external_references.html",     "External References"),
    ("classification.md",          "classification.html",          "Paper Classification"),
    ("README.md",                  "README.html",                  "Paper Library — README"),
]

CSS = """
:root{--bg:#f6f8fb;--surface:#fff;--surface2:#f3f6fa;--line:#e4e9f0;--line2:#cfd8e4;
 --text:#16202e;--muted:#51607a;--accent:#0d9488;--accent-ink:#0b7d72;--accent2:#2563eb;
 --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
 --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.7;
 -webkit-font-smoothing:antialiased}
.topbar{position:sticky;top:0;background:rgba(246,248,251,.9);backdrop-filter:blur(10px);
 border-bottom:1px solid var(--line);padding:.7rem 1.25rem;font-size:.86rem}
.topbar a{color:var(--accent-ink);text-decoration:none;font-weight:600}
.topbar a:hover{text-decoration:underline}
main{max-width:820px;margin:0 auto;padding:2.4rem 1.4rem 5rem}
h1,h2,h3,h4{line-height:1.3;letter-spacing:-.01em;margin:1.8em 0 .6em}
h1{font-size:2rem;margin-top:.2em;border-bottom:2px solid var(--line);padding-bottom:.35em}
h2{font-size:1.4rem;border-bottom:1px solid var(--line);padding-bottom:.3em}
h3{font-size:1.12rem;color:var(--accent-ink)}
p,li{color:#243042}
a{color:var(--accent2)}
code{font-family:var(--mono);font-size:.86em;background:var(--surface2);padding:.12em .42em;
 border-radius:6px;color:var(--accent-ink);border:1px solid var(--line)}
pre{background:var(--surface2);border:1px solid var(--line);border-radius:10px;padding:1rem;overflow:auto}
pre code{background:none;border:none;padding:0}
blockquote{margin:1.2em 0;padding:.6em 1em;border-left:3px solid var(--accent);
 background:rgba(13,148,136,.06);border-radius:0 8px 8px 0;color:#243042}
blockquote p{margin:.3em 0}
table{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.93rem;background:var(--surface);
 border:1px solid var(--line);border-radius:10px;overflow:hidden}
th,td{text-align:left;padding:.6rem .8rem;border-bottom:1px solid var(--line);vertical-align:top}
thead th{background:var(--surface2);font-size:.8rem;text-transform:uppercase;letter-spacing:.03em}
tbody tr:last-child td{border-bottom:none}
hr{border:none;border-top:1px solid var(--line);margin:2.4em 0}
strong{color:var(--text)}
"""

TEMPLATE = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{title}</title><style>{css}</style></head>
<body>
<div class="topbar">&larr; <a href="../index.html">Back to overview</a></div>
<main>{body}</main>
</body></html>
"""

def rewrite_links(html: str) -> str:
    # intra-doc links: foo.md -> foo.html (keep anchors/queries)
    html = re.sub(r'href="([^"]+?)\.md((?:#|\?)[^"]*)?"', r'href="\1.html\2"', html)
    # links to sibling assets that live in paper/ (not rendered): point back into paper/
    for asset in ("manifest.json",):
        html = html.replace(f'href="{asset}"', f'href="../../paper/{asset}"')
    return html

def main():
    md = markdown.Markdown(extensions=["extra", "sane_lists", "toc"])
    for src, out, title in DOCS:
        p = PAPER / src
        if not p.exists():
            print(f"  skip (missing): {src}")
            continue
        md.reset()
        body = rewrite_links(md.convert(p.read_text(encoding="utf-8")))
        (OUT / out).write_text(TEMPLATE.format(title=title, css=CSS, body=body), encoding="utf-8")
        print(f"  rendered: paper/{src} -> site/docs/{out}")

if __name__ == "__main__":
    print("Rendering markdown docs ->", OUT)
    main()
    print("Done.")
