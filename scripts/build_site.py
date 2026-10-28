import json
import shutil
import xml.etree.ElementTree as ET
from datetime import date, datetime, time, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import quote

BASE_URL = 'https://lolikuza.ovh/tosho/'
ATOM = 'http://www.w3.org/2005/Atom'
ET.register_namespace('atom', ATOM)


def image_type(url):
    lower = str(url).lower().split('?')[0]
    if lower.endswith('.png'):
        return 'image/png'
    if lower.endswith('.webp'):
        return 'image/webp'
    if lower.endswith('.gif'):
        return 'image/gif'
    return 'image/jpeg'


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
            datetime.combine(day, time.min, tzinfo=timezone.utc)
        )
        category = item.get('category', 'Inne')
        ET.SubElement(node, 'category').text = categories.get(category, category)
        cover = str(item.get('cover', '')).strip()
        if cover:
            ET.SubElement(node, 'enclosure', {
                'url': cover,
                'type': image_type(cover),
                'length': '0',
            })
    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)


def main():
    source = Path(__file__).resolve().parents[1]
    data = json.loads((source / 'tosho' / 'data.json').read_text(encoding='utf-8'))
    items = data if isinstance(data, list) else data['items']
    if not isinstance(items, list):
        raise ValueError('items must be a list')
    feed = build_feed(items)
    ET.fromstring(feed)
    site = source / 'dist'
    if not (site / 'index.html').exists():
        raise ValueError('Run npm run build to compile React first')
    for name in ['public', 'tosho/music', 'tosho/wallpaper']:
        shutil.copytree(source / name, site / name, dirs_exist_ok=True)
    for name in ['CNAME', 'srtmz.html', 'style.css', 'audio.js', 'tosho/data.json', 'tosho/music.json', 'tosho/cursor.css']:
        shutil.copy2(source / name, site / name)
    (site / '.nojekyll').touch()
    (site / 'tosho' / 'rss.xml').write_bytes(feed)
    print(f'Built React website with {min(len(items), 50)} RSS entries.')


if __name__ == '__main__':
    main()
