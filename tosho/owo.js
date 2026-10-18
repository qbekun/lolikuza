const SITE_TITLE = 'lolikuza.ovh - Tosho';
const SITE_URL = 'https://lolikuza.ovh/tosho/';
const SITE_DESCRIPTION = 'Tosho - katalog polskich spolszczeń, modów, aplikacji i narzędzi. Tłumaczenia, fixy i fanowskie projekty w jednym miejscu na lolikuza.ovh';
const SPECIAL_DATES = [
  { id: 'december', name: 'Święta Bożego Narodzenia', wallpaper: 'wallpaper/wp11400450.jpg', test: (date) => date.getMonth() === 11 },
  { id: 'halloween', name: 'Halloween', wallpaper: 'wallpaper/bg_hw_7.jpg', test: (date) => date.getMonth() === 9 }
];
const CATEGORIES = [
  { id: 'gry', label: 'Gry' },
  { id: 'mody', label: 'Mody' },
  { id: 'aplikacje', label: 'Aplikacje' }
];
let ITEMS = [];
const byId = (id) => document.getElementById(id);
const descPanel = byId('descPanel');
const desc2Panel = byId('desc2Panel');
const detailLinks = byId('detailLinks');

function setMeta(selector, value) {
  const tag = document.head.querySelector(selector);
  if (!tag) return;
  if (tag.tagName === 'TITLE') document.title = value;
  else tag.setAttribute('content', value);
}

function updateMeta(item) {
  const summary = (item.description || item.genres || []).toString().trim() || SITE_DESCRIPTION;
  const title = item.title + ' | Tosho';
  setMeta('title', title);
  setMeta('meta[name="description"]', item.title + ' — ' + summary + ' Tosho, katalog polskich spolszczeń, modów i narzędzi na lolikuza.ovh.');
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', summary);
  setMeta('meta[property="og:url"]', SITE_URL + 'uwu.html?id=' + encodeURIComponent(item.slug));
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', summary);
}

function categoryLabel(id) {
  return CATEGORIES.find((entry) => entry.id === id)?.label || id;
}

function hueFrom(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 360;
  return hash;
}

function coverGradient(title) {
  const hue = hueFrom(title);
  return `linear-gradient(150deg,hsl(${hue} 45% 22%),hsl(${(hue + 40) % 360} 40% 10%) 60%,#000)`;
}

function initialsOf(title) {
  return title.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function startWallpaper() {
  const special = SPECIAL_DATES.find((entry) => entry.test(new Date()));
  if (!special) return;
  document.body.dataset.season = special.id;
  byId('pageBg').style.setProperty('--bg-image', `url("${special.wallpaper}")`);
  byId('bgLabel').textContent = special.name;
}

function renderCover(item) {
  const cover = byId('detailCover');
  const element = document.createElement(item.cover ? 'img' : 'span');
  if (item.cover) {
    element.src = item.cover;
    element.alt = 'Okładka: ' + item.title;
  } else {
    element.className = 'detail-cover-empty';
    element.style.background = coverGradient(item.title);
    element.textContent = initialsOf(item.title);
  }
  cover.replaceChildren(element);
}

function renderBadges(item) {
  const badges = byId('detailBadges');
  badges.replaceChildren();
  [[categoryLabel(item.category), 'badge-cat'], [item.version || '-', 'badge-pl']].forEach(([text, className]) => {
    const badge = document.createElement('span');
    badge.className = 'badge ' + className;
    badge.textContent = text;
    badges.appendChild(badge);
  });
}

function renderSpecs(item) {
  const table = byId('specTable');
  table.replaceChildren();
  const rows = [
    ['Kategoria', categoryLabel(item.category)],
    ['Wersja', item.version || '-'],
    ['Rok', item.year || '-'],
    ['Platforma', (item.platform || []).join(', ') || '-'],
    ['Gatunek', (item.genres || []).join(', ') || '-'],
    ['Data dodania', item.date || '-']
  ];
  rows.forEach(([label, value]) => {
    const row = document.createElement('tr');
    const name = document.createElement('td');
    const content = document.createElement('td');
    name.textContent = label;
    content.textContent = value;
    content.setAttribute('align', 'right');
    row.append(name, content);
    table.appendChild(row);
  });
}

function clearAdditionalDescriptions() {
  document.querySelectorAll('[data-additional-description]').forEach((panel) => panel.remove());
  if (desc2Panel) desc2Panel.hidden = true;
}

function renderAdditionalDescriptions(item) {
  clearAdditionalDescriptions();
  const anchor = detailLinks.closest('.panel');
  const numbers = Object.keys(item)
    .map((key) => /^description(\d+)$/.exec(key))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .filter((number) => number >= 2)
    .sort((a, b) => a - b);

  numbers.forEach((number) => {
    const text = String(item['description' + number] || '').trim();
    if (!text) return;
    const title = String(item['description' + number + 'Title'] || 'Dodatkowe info').trim();
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.dataset.additionalDescription = String(number);
    const heading = document.createElement('div');
    heading.className = 'panel-hd';
    heading.textContent = title.length <= 18 ? Array.from(title).join(' ') : title;
    const body = document.createElement('div');
    body.className = 'panel-bd';
    const content = document.createElement('pre');
    content.className = 'detail-pre';
    content.textContent = text;
    body.appendChild(content);
    panel.append(heading, body);
    anchor.parentNode.insertBefore(panel, anchor);
  });
}

function renderLinks(item) {
  detailLinks.replaceChildren();
  [[item.download, 'Pobierz', 'btn btn--wide btn--download'], [item.link, 'Strona oficjalna', 'btn btn--wide']].forEach(([url, label, className]) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.className = className;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    detailLinks.append(link, document.createTextNode(' '));
  });
  if (!item.download && !item.link) {
    const empty = document.createElement('span');
    empty.className = 'tiny muted';
    empty.textContent = 'Brak linków.';
    detailLinks.appendChild(empty);
  }
}

function renderRelated(item) {
  const list = byId('relatedList');
  list.replaceChildren();
  const others = ITEMS.filter((entry) => entry.slug !== item.slug).slice(0, 5);
  if (!others.length) {
    const empty = document.createElement('li');
    empty.className = 'tiny muted';
    empty.textContent = 'Brak innych pozycji.';
    list.appendChild(empty);
    return;
  }
  others.forEach((entry) => {
    const row = document.createElement('li');
    const title = document.createElement('b');
    const link = document.createElement('a');
    link.href = 'uwu.html?id=' + encodeURIComponent(entry.slug);
    link.textContent = entry.title;
    title.appendChild(link);
    const date = document.createElement('span');
    date.className = 'mini-date';
    date.textContent = ' ' + entry.date;
    row.append(title, date);
    list.appendChild(row);
  });
}

function showMissing() {
  clearAdditionalDescriptions();
  document.title = 'Nie znaleziono - ' + SITE_TITLE;
  byId('detailHead').textContent = 'N i e   z n a l e z i o n o';
  byId('detailTitle').textContent = 'Nie znaleziono pozycji';
  ['detailBadges', 'detailCover', 'specTable', 'relatedList'].forEach((id) => byId(id).replaceChildren());
  byId('detailGenres').textContent = '';
  byId('detailDesc').textContent = '';
  byId('detailDesc2').textContent = '';
  descPanel.hidden = true;
  detailLinks.replaceChildren();
  const back = document.createElement('a');
  back.className = 'btn';
  back.href = 'index.html';
  back.textContent = '< Wróć do listy';
  detailLinks.appendChild(back);
}

function renderItem(item) {
  updateMeta(item);
  byId('detailHead').textContent = item.category === 'gry' ? 'G r a' : item.category === 'mody' ? 'M o d' : 'A p l i k a c j a';
  renderCover(item);
  byId('detailTitle').textContent = item.title;
  renderBadges(item);
  byId('detailGenres').textContent = (item.genres || []).join(' / ');
  renderSpecs(item);
  const description = String(item.description || '').trim();
  descPanel.hidden = !description;
  byId('detailDesc').textContent = description;
  renderAdditionalDescriptions(item);
  renderLinks(item);
  renderRelated(item);
}

async function start() {
  startWallpaper();
  try {
    const response = await fetch('data.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    ITEMS = Array.isArray(data) ? data : data.items || [];
  } catch (error) {
    showMissing();
    return;
  }
  const slug = new URLSearchParams(window.location.search).get('id') || '';
  const item = ITEMS.find((entry) => entry.slug === slug);
  if (!item) {
    showMissing();
    return;
  }
  renderItem(item);
}

start();
