import json
import shutil
import xml.etree.ElementTree as ET
from datetime import date, datetime, time
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

BASE_URL = 'https://lolikuza.ovh/tosho/'
ATOM = 'http://www.w3.org/2005/Atom'
ET.register_namespace('atom', ATOM)


def build_feed(items):
    root = ET.Element('rss', {'version': '2.0'})
    channel = ET.SubElement(root, 'channel')
    for key, value in [
        ('title', 'Tosho | lolikuza'),
        ('link', BASE_URL),
        ('description', 'Nowe gry, spolszczenia, mody i aplikacje w Tosho.'),
        ('language', 'pl-PL'),
    ]:
        ET.SubElement(channel, key).text = value
    ET.SubElement(channel, f'{{{ATOM}}}link', {
        'href': BASE_URL + 'rss.xml',
        'rel': 'self',
        'type': 'application/rss+xml',
    })
    seen = set()
    dated = []
    for item in items:
        slug = item['slug']
        if not isinstance(slug, str) or not slug.strip() or slug in seen:
            raise ValueError('Invalid or duplicate slug')
        seen.add(slug)
        if not isinstance(item.get('title'), str) or not item['title'].strip():
            raise ValueError('Missing title')
        dated.append((date.fromisoformat(item['date']), item))
    dated.sort(key=lambda pair: pair[0], reverse=True)
    categories = {'gry': 'Gry', 'mody': 'Mody', 'aplikacje': 'Aplikacje'}
    for day, item in dated[:50]:
        node = ET.SubElement(channel, 'item')
        url = BASE_URL + 'uwu.html?id=' + quote(item['slug'], safe='')
        ET.SubElement(node, 'title').text = item['title']
        ET.SubElement(node, 'link').text = url
        ET.SubElement(node, 'guid', {'isPermaLink': 'false'}).text = 'urn:lolikuza:tosho:' + item['slug']
        ET.SubElement(node, 'description').text = str(item.get('description', ''))
        ET.SubElement(node, 'pubDate').text = format_datetime(
            datetime.combine(day, time.min, tzinfo=ZoneInfo('Europe/Warsaw'))
        )
        category = item.get('category', 'Inne')
        ET.SubElement(node, 'category').text = categories.get(category, category)
    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)


def add_feed_links(site):
    discovery = '<link rel="alternate" type="application/rss+xml" title="Tosho | lolikuza — Nowości" href="/tosho/rss.xml" />'
    for name in ['index.html', 'uwu.html']:
        path = site / 'tosho' / name
        html = path.read_text(encoding='utf-8')
        if 'type="application/rss+xml"' not in html:
            if '</head>' not in html:
                raise ValueError(f'Missing head in {name}')
            html = html.replace('</head>', '  ' + discovery + '\n</head>', 1)
        if name == 'index.html' and 'id="rssLink"' not in html:
            marker = '<span class="status-grow"></span>'
            if marker not in html:
                raise ValueError('Missing statusbar RSS anchor')
            button = '<a class="btn" id="rssLink" href="/tosho/rss.xml" title="Subskrybuj nowości Tosho">RSS</a>'
            html = html.replace(marker, marker + '\n      ' + button, 1)
        path.write_text(html, encoding='utf-8')


def main():
    source = Path(__file__).resolve().parents[1]
    data = json.loads((source / 'tosho' / 'data.json').read_text(encoding='utf-8'))
    items = data if isinstance(data, list) else data['items']
    if not isinstance(items, list):
        raise ValueError('items must be a list')
    feed = build_feed(items)
    ET.fromstring(feed)
    site = source / '_site'
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    excluded = {'_site', 'scripts', 'output', '__pycache__'}
    for entry in source.iterdir():
        if entry.name.startswith('.') or entry.name in excluded:
            continue
        if entry.is_symlink():
            raise ValueError(f'Symlinks are not allowed: {entry.name}')
        destination = site / entry.name
        if entry.is_dir():
            shutil.copytree(entry, destination, ignore=shutil.ignore_patterns('.git', '__pycache__'))
        else:
            shutil.copy2(entry, destination)
    (site / '.nojekyll').touch()
    (site / 'tosho' / 'rss.xml').write_bytes(feed)
    add_feed_links(site)
    print(f'Built website with {min(len(items), 50)} RSS entries.')


if __name__ == '__main__':
    main()
