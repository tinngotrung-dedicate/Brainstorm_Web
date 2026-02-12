#!/usr/bin/env python3
import json
import re
import sys
import urllib.parse
import urllib.request

try:
    from bs4 import BeautifulSoup
except Exception as exc:  # pragma: no cover
    print(json.dumps({"error": "BeautifulSoup not installed", "results": []}))
    sys.exit(0)


def extract_year(text):
    match = re.search(r"\b(19|20)\d{2}\b", text)
    return match.group(0) if match else ""


def fetch_html(query):
    params = urllib.parse.urlencode({"q": query, "hl": "en"})
    url = f"https://scholar.google.com/scholar?{params}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_results(html):
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for item in soup.select(".gs_r.gs_or.gs_scl"):
        title_tag = item.select_one("h3.gs_rt")
        if not title_tag:
            continue
        link_tag = title_tag.find("a")
        title = title_tag.get_text(" ", strip=True)
        link = link_tag["href"] if link_tag else ""
        snippet_tag = item.select_one(".gs_rs")
        snippet = snippet_tag.get_text(" ", strip=True) if snippet_tag else ""
        meta_tag = item.select_one(".gs_a")
        meta = meta_tag.get_text(" ", strip=True) if meta_tag else ""
        year = extract_year(meta)
        results.append(
            {
                "title": title,
                "url": link,
                "snippet": snippet,
                "authors": meta,
                "year": year,
                "source": "Google Scholar",
            }
        )
        if len(results) >= 5:
            break
    return results


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing query", "results": []}))
        return
    query = " ".join(sys.argv[1:]).strip()
    if not query:
        print(json.dumps({"error": "Empty query", "results": []}))
        return
    try:
        html = fetch_html(query)
        results = parse_results(html)
        print(json.dumps({"results": results}))
    except Exception as exc:
        print(json.dumps({"error": str(exc), "results": []}))


if __name__ == "__main__":
    main()
