const SITE_TITLE = 'lolikuza.ovh - Tosho';
const SITE_URL = 'https://lolikuza.ovh/tosho/';
const SITE_DESCRIPTION = 'Tosho - katalog polskich spolszczeń, modów, aplikacji i narzędzi. Tłumaczenia, fixy i fanowskie projekty w jednym miejscu na lolikuza.ovh';

function setMeta(selector, value) {
  const tag = document.head.querySelector(selector);

  if (!tag) return;

  if (tag.tagName === 'TITLE') {
    document.title = value;
    return;
  }

  tag.setAttribute('content', value);
}

function updateMeta(item) {
  if (!item) return;

  const summary = (item.description || item.genres || []).toString().trim() || SITE_DESCRIPTION;
  const url = SITE_URL + 'uwu.html?id=' + encodeURIComponent(item.slug);
  const title = item.title + ' | Tosho';

  setMeta('title', title);
  setMeta('meta[name=\'description\']', item.title + ' — ' + summary + ' Tosho, katalog polskich spolszczeń, modów i narzędzi na lolikuza.ovh.');
  setMeta('meta[property=\'og:title\']', title);
  setMeta('meta[property=\'og:description\']', summary);
  setMeta('meta[property=\'og:url\']', url);
  setMeta('meta[name=\'twitter:title\']', title);
  setMeta('meta[name=\'twitter:description\']', summary);
}

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
let shownWallpaper = null;

const bgLayer = document.getElementById('pageBg');
const bgLabel = document.getElementById('bgLabel');
const specTable = document.getElementById('specTable');
const detailHead = document.getElementById('detailHead');
const detailCover = document.getElementById('detailCover');
const detailTitle = document.getElementById('detailTitle');
const detailBadges = document.getElementById('detailBadges');
const detailGenres = document.getElementById('detailGenres');
const detailDesc = document.getElementById('detailDesc');
const descPanel = document.getElementById('descPanel');
const desc2Panel = document.getElementById('desc2Panel');
const desc2Head = document.getElementById('desc2Head');
const detailDesc2 = document.getElementById('detailDesc2');
const detailLinks = document.getElementById('detailLinks');
const relatedList = document.getElementById('relatedList');

function hueFrom(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 360;
  }
  return hash;
}

function coverGradient(title) {
  const hue = hueFrom(title);
  return 'linear-gradient(150deg,hsl(' + hue + ' 45% 22%),hsl(' + ((hue + 40) % 360) + ' 40% 10%) 60%,#000)';
}

function initialsOf(title) {
  return title
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = String(text);
  return element.innerHTML;
}

function categoryLabel(id) {
  const found = CATEGORIES.find((entry) => entry.id === id);
  return found ? found.label : id;
}

function findSpecialDate(date) {
  return SPECIAL_DATES.find((entry) => entry.test(date)) || null;
}

function updateWallpaper() {
  const special = findSpecialDate(new Date());

  if (!special) return;

  document.body.dataset.season = special.id;

  if (special.wallpaper === shownWallpaper) return;

  shownWallpaper = special.wallpaper;
  bgLayer.style.setProperty('--bg-image', 'url("' + special.wallpaper + '")');
  bgLabel.textContent = special.name;
}

function startWallpaper() {
  updateWallpaper();
}

function currentSlug() {
  return new URLSearchParams(window.location.search).get('id') || '';
}

function createInfoBox(title, text, color, background, border) {
  const box = document.createElement('div');
  const heading = document.createElement('b');
  const message = document.createElement('span');

  box.style.cssText = 'display:block;margin-bottom:1rem;padding:.9rem 1rem;border:1px solid ' + border + ';background:' + background + ';border-radius:10px;color:#e5e7eb;font-size:.9rem;line-height:1.55;';
  heading.style.cssText = 'display:block;margin-bottom:.25rem;color:' + color + ';';
  heading.textContent = title;
  message.textContent = text;

  box.appendChild(heading);
  box.appendChild(message);

  return box;
}

function renderModInfo(item) {
  const text = (item.modInfo || '').trim();

  if (!text || !descPanel || !descPanel.parentNode) return;

  descPanel.parentNode.insertBefore(
    createInfoBox('Wgrany mod', text, '#4ade80', 'rgba(74, 222, 128, 0.08)', 'rgba(74, 222, 128, 0.45)'),
    descPanel
  );
}

function renderInstallInfo(item) {
  const text = (item.installInfo || '').trim();

  if (!text || !descPanel || !descPanel.parentNode) return;

  descPanel.parentNode.insertBefore(
    createInfoBox('Instalacja', text, '#60a5fa', 'rgba(96, 165, 250, 0.08)', 'rgba(96, 165, 250, 0.45)'),
    descPanel
  );
}

function renderCover(item) {
  if (item.cover) {
    const image = document.createElement('img');
    image.src = item.cover;
    image.alt = 'Okładka: ' + item.title;
    detailCover.innerHTML = '';
    detailCover.appendChild(image);
    return;
  }

  const placeholder = document.createElement('span');
  placeholder.className = 'detail-cover-empty';
  placeholder.style.background = coverGradient(item.title);
  placeholder.textContent = initialsOf(item.title);

  detailCover.innerHTML = '';
  detailCover.appendChild(placeholder);
}

function renderBadges(item) {
  const badges = [
    { text: categoryLabel(item.category), className: 'badge-cat' },
    { text: item.version || '-', className: 'badge-pl' }
  ];

  detailBadges.innerHTML = '';

  badges.forEach((badge) => {
    const element = document.createElement('span');
    element.className = 'badge ' + badge.className;
    element.textContent = badge.text;
    detailBadges.appendChild(element);
  });
}

function renderSpecs(item) {
  const rows = [
    ['Kategoria', categoryLabel(item.category)],
    ['Wersja', item.version || '-'],
    ['Rok', item.year || '-'],
    ['Platforma', (item.platform || []).join(', ') || '-'],
    ['Gatunek', (item.genres || []).join(', ') || '-'],
    ['Data dodania', item.date || '-']
  ];

  specTable.innerHTML = '';

  rows.forEach(([label, value]) => {
    const row = document.createElement('tr');
    const labelCell = document.createElement('td');
    const valueCell = document.createElement('td');

    labelCell.textContent = label;
    valueCell.textContent = value;
    valueCell.setAttribute('align', 'right');

    row.appendChild(labelCell);
    row.appendChild(valueCell);
    specTable.appendChild(row);
  });
}

function renderDescription(item) {
  const text = (item.description || '').trim();
  descPanel.hidden = !text;
  detailDesc.textContent = text;
}

function renderDescription2(item) {
  const text = (item.description2 || '').trim();

  desc2Panel.hidden = !text;
  detailDesc2.textContent = text;

  if (!text) return;

  const title = (item.description2Title || '').trim() || 'Dodatkowe info';

  if (title.length <= 18) {
    desc2Head.textContent = title.split('').join(' ');
  } else {
    desc2Head.textContent = title;
  }
}

function renderLinks(item) {
  detailLinks.innerHTML = '';

  if (item.download) {
    const download = document.createElement('a');
    download.className = 'btn btn--wide btn--download';
    download.href = item.download;
    download.target = '_blank';
    download.rel = 'noopener noreferrer';
    download.textContent = 'Pobierz';
    detailLinks.appendChild(download);
  }

  if (item.link) {
    const official = document.createElement('a');
    official.className = 'btn btn--wide';
    official.href = item.link;
    official.target = '_blank';
    official.rel = 'noopener noreferrer';
    official.textContent = 'Strona oficjalna';
    detailLinks.appendChild(official);
  }

  if (!item.download && !item.link) {
    const empty = document.createElement('span');
    empty.className = 'tiny muted';
    empty.textContent = 'Brak linków.';
    detailLinks.appendChild(empty);
  }
}

function renderRelated(item) {
  const others = ITEMS.filter((entry) => entry.slug !== item.slug).slice(0, 5);

  relatedList.innerHTML = '';

  if (!others.length) {
    const empty = document.createElement('li');
    empty.className = 'tiny muted';
    empty.textContent = 'Brak innych pozycji.';
    relatedList.appendChild(empty);
    return;
  }

  others.forEach((entry) => {
    const listItem = document.createElement('li');
    const title = document.createElement('b');
    const link = document.createElement('a');
    const date = document.createElement('span');

    link.href = 'uwu.html?id=' + encodeURIComponent(entry.slug);
    link.textContent = entry.title;
    date.className = 'mini-date';
    date.textContent = ' ' + entry.date;

    title.appendChild(link);
    listItem.appendChild(title);
    listItem.appendChild(date);
    relatedList.appendChild(listItem);
  });
}

function showMissing() {
  document.title = 'Nie znaleziono - ' + SITE_TITLE;
  detailHead.textContent = 'N i e   z n a l e z i o n o';
  detailTitle.textContent = 'Nie znaleziono pozycji';
  detailBadges.innerHTML = '';
  detailGenres.textContent = '';
  descPanel.hidden = true;
  desc2Panel.hidden = true;
  detailDesc.textContent = '';
  detailDesc2.textContent = '';
  detailCover.innerHTML = '';
  specTable.innerHTML = '';
  detailLinks.innerHTML = '';

  const backLink = document.createElement('a');
  backLink.className = 'btn';
  backLink.href = 'index.html';
  backLink.textContent = '< Wróć do listy';
  detailLinks.appendChild(backLink);

  relatedList.innerHTML = '';
}

function renderItem(item) {
  updateMeta(item);

  detailHead.textContent = item.category === 'gry'
    ? 'G r a'
    : item.category === 'mody'
      ? 'M o d'
      : 'A p l i k a c j a';

  renderCover(item);
  detailTitle.textContent = item.title;
  renderBadges(item);
  detailGenres.textContent = (item.genres || []).join(' / ');
  renderSpecs(item);
  renderModInfo(item);
  renderInstallInfo(item);
  renderDescription(item);
  renderDescription2(item);
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

  const slug = currentSlug();
  const item = ITEMS.find((entry) => entry.slug === slug);

  if (!item) {
    showMissing();
    return;
  }

  renderItem(item);
}

start();
