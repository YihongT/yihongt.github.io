import json
import os
import urllib.request
from datetime import datetime, timezone

REPOS = ["Human-Agent-Society/reef", "Human-Agent-Society/CORAL", "YihongT/CoAutoResearch"]
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "_data", "github_stars.yml")


def display(n):
    return f"{n / 1000:.1f}k" if n >= 1000 else str(n)


def fetch(repo):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)["stargazers_count"]


lines = []
for repo in REPOS:
    n = fetch(repo)
    lines.append(f'"{repo}":')
    lines.append(f"  count: {n}")
    lines.append(f'  display: "{display(n)}"')
lines.append(f'updated: "{datetime.now(timezone.utc).strftime("%Y-%m-%d")}"')

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print("\n".join(lines))
