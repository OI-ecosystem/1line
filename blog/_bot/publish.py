#!/usr/bin/env python3
"""Publish a finished 1LINE Answers article that is already at blog/<slug>/index.html.

Run from the repository root:
  python3 blog/_bot/publish.py <slug> <topic id> <opp_id> "<search keywords>" "<feature question>"

Adds the article's card to the top of the POSTS block in blog/index.html, makes it
the FEATURE, adds it to blog/feed.xml and to the BLOG block of sitemap.xml, and
records the opp_id in blog/_bot/covered.json. Refuses anything inconsistent.
Not published (Jekyll skips folders starting with _).
"""
import html, json, os, re, sys
from datetime import datetime

TOPICS = {"money": "Bills &amp; money", "rights": "Complaints &amp; scams", "home": "Home &amp; property",
          "family": "Gifts &amp; family", "work": "Work &amp; words", "markets": "Markets"}
if len(sys.argv) != 6:
    sys.exit(__doc__)
slug, topic, opp, keywords, question = sys.argv[1:]
if topic not in TOPICS:
    sys.exit(f"topic must be one of {', '.join(TOPICS)}")
art_path = f"blog/{slug}/index.html"
if not os.path.exists(art_path):
    sys.exit(f"{art_path} not found")
a = open(art_path, encoding="utf-8").read()
if "{{" in a:
    sys.exit("article still contains {{ placeholders")
title = re.search(r"<h1>(.*?)</h1>", a, re.S).group(1).strip()
desc = re.search(r'<meta name="description" content="([^"]*)"', a).group(1)
date = re.search(r'"datePublished":\s*"(\d{4}-\d{2}-\d{2})"', a).group(1)
stand = re.search(r'<p class="standfirst">(.*?)</p>', a, re.S).group(1).strip()
words = len(re.sub(r"<[^>]+>", " ", a.split('<div class="prose">', 1)[-1].split('<aside class="post-aside">', 1)[0]).split())
mins = max(2, round(words / 220))
d = datetime.strptime(date, "%Y-%m-%d")
label = TOPICS[topic]
q = html.escape(question.strip().strip('"“”'))

idx_path = "blog/index.html"
idx = open(idx_path, encoding="utf-8").read()
if f'href="/blog/{slug}/"' in idx:
    sys.exit("already published")
card = f'''<a class="card reveal" href="/blog/{slug}/" data-topic="{topic}" data-keywords="{html.escape(keywords)}">
        <span class="eyebrow">{label}</span>
        <h3>{title}</h3>
        <p>{stand}</p>
        <div class="card-foot"><time datetime="{date}">{d.day} {d.strftime('%b %Y')}</time><span class="dot"></span><span>{mins} min read</span></div>
      </a>
      '''
marker = '<!-- POSTS:START (newest first; one <a class="card"> per article) -->\n      '
if idx.count(marker) != 1:
    sys.exit("POSTS marker not found")
idx = idx.replace(marker, marker + card, 1)
feature = f'''<!-- FEATURE:START (newest article) -->
    <a class="feature reveal" id="feature" href="/blog/{slug}/">
      <div class="feature-art"><div class="q">&ldquo;{q}&rdquo;</div></div>
      <div class="feature-body">
        <span class="eyebrow">{label}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
        <span class="btn btn-ghost" style="align-self:flex-start">Read the answer <span class="arrow">&rarr;</span></span>
      </div>
    </a>
    <!-- FEATURE:END -->'''
idx, n = re.subn(r"<!-- FEATURE:START.*?<!-- FEATURE:END -->", lambda m: feature, idx, flags=re.S)
if n != 1:
    sys.exit("FEATURE markers not found")

feed = open("blog/feed.xml", encoding="utf-8").read()
item = f'''<item>
    <title>{html.escape(html.unescape(title))}</title>
    <link>https://lifekit333.com/blog/{slug}/</link>
    <guid>https://lifekit333.com/blog/{slug}/</guid>
    <pubDate>{d.strftime('%a, %d %b %Y')} 12:00:00 +0000</pubDate>
    <category>{label}</category>
    <description>{desc}</description>
  </item>
  '''
fm = "<!-- ITEMS:START (newest first) -->\n  "
if feed.count(fm) != 1:
    sys.exit("feed marker not found")
feed = feed.replace(fm, fm + item, 1)

sm = open("sitemap.xml", encoding="utf-8").read()
if "  <!-- BLOG:END -->" not in sm:
    sys.exit("sitemap BLOG marker not found")
sm = sm.replace("  <!-- BLOG:END -->", f"  <url>\n    <loc>https://lifekit333.com/blog/{slug}/</loc>\n    <lastmod>{date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n  <!-- BLOG:END -->")

cov_path = "blog/_bot/covered.json"
cov = json.load(open(cov_path))
cov[opp] = slug

open(idx_path, "w", encoding="utf-8").write(idx)
open("blog/feed.xml", "w", encoding="utf-8").write(feed)
open("sitemap.xml", "w", encoding="utf-8").write(sm)
json.dump(cov, open(cov_path, "w"), indent=2)
print(f"published {slug} ({label}, {date}, {mins} min)")
