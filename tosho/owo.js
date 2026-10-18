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
  const url = `${SITE_URL}uwu.html?id=${encodeURIComponent(item.slug)}`;
  const title = `${item.title} | Tosho`;

  setMeta('title', title);
  setMeta('meta[name="description"]', `${item.title} — ${summary} Tosho, katalog polskich spolszczeń, modów i narzędzi na lolikuza.ovh.`);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', summary);
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', summary);
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
  return (
    'linear-gradient(150deg,' +
    `hsl(${hue} 45% 22%),` +
    `hsl(${(hue + 40) % 360} 40% 10%) 60%,` +
    '#000)'
  );
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
  return String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function categoryLabel(id) {
  const found = CATEGORIES.find((c) => c.id === id);
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
  bgLayer.style.setProperty('--bg-image', `url("${special.wallpaper}")`);
  bgLabel.textContent = special.name;
}

function startWallpaper() {
  updateWallpaper();
}

function currentSlug() {
  return new URLSearchParams(window.location.search).get('id') || '';
}

function renderCover(item) {
  if (item.cover) {
    detailCover.innerHTML = `<img src="${escapeHtml(item.cover)}" alt="Okładka: ${escapeHtml(item.title)}" />`;
    return;
  }

  detailCover.innerHTML =
    `<span class="detail-cover-empty" style="background:${coverGradient(item.title)}">` +
    `${escapeHtml(initialsOf(item.title))}</span>`;
}

function renderBadges(item) {
  const badges = [
    { text: categoryLabel(item.category), className: 'badge-cat' },
    { text: item.version || '-', className: 'badge-pl' }
  ];

  detailBadges.innerHTML = badges
    .map((badge) => `<span class="badge ${badge.className}">${escapeHtml(badge.text)}</span>`)
    .join('');
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

  specTable.innerHTML = rows
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td align="right">${escapeHtml(value)}</td></tr>`)
    .join('');
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
  const links = [];

  if (item.download) {
    links.push(
      `<a class="btn btn--wide btn--download" href="${escapeHtml(item.download)}" target="_blank" rel="noopener noreferrer">Pobierz</a>`
    );
  }

  if (item.link) {
    links.push(
      `<a class="btn btn--wide" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Strona oficjalna</a>`
    );
  }

  if (!links.length) {
    links.push('<span class="tiny muted">Brak linków.</span>');
  }

  detailLinks.innerHTML = links.join(' ');
}

function renderRelated(item) {
  const others = ITEMS.filter((entry) => entry.slug !== item.slug).slice(0, 5);

  if (!others.length) {
    relatedList.innerHTML = '<li class="tiny muted">Brak innych pozycji.</li>';
    return;
  }

  relatedList.innerHTML = others
    .map((entry) => {
      const url = `uwu.html?id=${encodeURIComponent(entry.slug)}`;
      return `<li><b><a href="${url}">${escapeHtml(entry.title)}</a></b> <span class="mini-date">${escapeHtml(entry.date)}</span></li>`;
    })
    .join('');
}

function showMissing() {
  document.title = `Nie znaleziono - ${SITE_TITLE}`;
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
  detailLinks.innerHTML = '<a class="btn" href="index.html">&lt; Wróć do listy</a>';
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
