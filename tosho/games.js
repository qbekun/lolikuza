const CATEGORIES = [
  { id: 'gry', label: 'Gry' },
  { id: 'mody', label: 'Mody' },
  { id: 'aplikacje', label: 'Aplikacje' }
];

const SPECIAL_DATES = [
  { id: 'december', name: 'Święta Bożego Narodzenia', wallpaper: 'wallpaper/wp11400450.jpg', test: (date) => date.getMonth() === 11 },
  { id: 'halloween', name: 'Halloween', wallpaper: 'wallpaper/bg_hw_7.jpg', test: () => true }
];

const LETTER_RANGES = [
  { id: 'ae', label: 'A-E', min: 'A', max: 'E' },
  { id: 'fm', label: 'F-M', min: 'F', max: 'M' },
  { id: 'ns', label: 'N-S', min: 'N', max: 'S' },
  { id: 'tz', label: 'T-Z', min: 'T', max: 'Z' }
];

const PAGE = 'uwu.html';

let ITEMS = [];
let INDEXED = [];
let shownWallpaper = null;

let activeRange = null;
let query = '';
let categoryFilter = 'all';
let sortMode = 'date';

const grid = document.getElementById('gamesGrid');
const empty = document.getElementById('gamesEmpty');
const search = document.getElementById('gamesSearch');
const searchBtn = document.getElementById('gamesSearchBtn');
const searchClear = document.getElementById('gamesSearchClear');
const index = document.getElementById('gamesIndex');
const bgLayer = document.getElementById('pageBg');
const bgLabel = document.getElementById('bgLabel');
const thumbs = document.getElementById('gamesThumbs');
const thumbsPanel = document.getElementById('thumbsPanel');
const recentList = document.getElementById('recentList');

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

function rangeOf(title) {
  const letter = title.charAt(0).toUpperCase();
  return LETTER_RANGES.find((r) => letter >= r.min && letter <= r.max) || null;
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

const COMPARATORS = {
  date: (a, b) => (a.game.date !== b.game.date ? (a.game.date < b.game.date ? 1 : -1) : a.position - b.position),
  title: (a, b) => a.game.title.localeCompare(b.game.title, 'pl'),
  year: (a, b) => (b.game.year || 0) - (a.game.year || 0) || a.position - b.position
};

function currentList() {
  const needle = query.trim().toLowerCase();

  const filtered = INDEXED.filter(({ game }) => {
    if (categoryFilter !== 'all' && game.category !== categoryFilter) return false;

    if (activeRange) {
      const range = rangeOf(game.title);
      if (!range || range.id !== activeRange) return false;
    }

    if (!needle) return true;

    const haystack = [
      game.title,
      game.year,
      game.version,
      game.category,
      (game.genres || []).join(' '),
      (game.platform || []).join(' '),
      game.note
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });

  return filtered.sort(COMPARATORS[sortMode] || COMPARATORS.date);
}

function pageUrl(item) {
  return `${PAGE}?id=${encodeURIComponent(item.slug)}`;
}

function renderRow(entry, position) {
  const game = entry.game;
  const hot = game.hot ? '<span class="hot-badge">HOT</span>' : '';
  const sub = [game.note, (game.genres || []).join(' / ')].filter(Boolean).join(' - ');

  return `
    <tr>
      <td class="game-idx">${position + 1}.</td>
      <td>
        <span class="game-title"><span class="tag-pl">${escapeHtml(game.version || 'PL')}</span>
          <a href="${pageUrl(game)}">${escapeHtml(game.title)}</a>${hot}</span>
        ${sub ? `<span class="game-sub">${escapeHtml(sub)}</span>` : ''}
      </td>
      <td>${escapeHtml(categoryLabel(game.category))}</td>
      <td>${escapeHtml(game.year || '-')}</td>
      <td>${escapeHtml((game.platform || []).join(', ') || '-')}</td>
    </tr>`;
}

function renderThumb(game) {
  const inner = game.cover
    ? `<img src="${escapeHtml(game.cover)}" alt="Okladka: ${escapeHtml(game.title)}" loading="lazy" />`
    : `<span class="thumb-empty" style="background:${coverGradient(game.title)}">${escapeHtml(initialsOf(game.title))}</span>`;

  return `
    <a class="thumb" href="${pageUrl(game)}" title="${escapeHtml(game.title)}">
      ${inner}
      <span class="thumb-caption">${escapeHtml(game.title)}</span>
    </a>`;
}

function updateStats() {
  const inCategory = (id) => ITEMS.filter((game) => game.category === id).length;

  document.getElementById('statCount').textContent = ITEMS.length;
  document.getElementById('statTotal').textContent = ITEMS.length;
  document.getElementById('statGames').textContent = inCategory('gry');
  document.getElementById('statMods').textContent = inCategory('mody');
  document.getElementById('statApps').textContent = inCategory('aplikacje');
}

function newestGames() {
  return INDEXED
    .filter(({ game }) => game.category === 'gry')
    .sort(COMPARATORS.date)
    .slice(0, 3);
}

function render() {
  const list = currentList();

  grid.innerHTML = list.map(renderRow).join('');
  empty.hidden = list.length > 0;

  const games = newestGames();
  thumbsPanel.hidden = games.length === 0;
  thumbs.innerHTML = games.map((entry) => renderThumb(entry.game)).join('');

  recentList.innerHTML = list
    .slice(0, 5)
    .map(({ game }) => `<li><b><a href="${pageUrl(game)}">${escapeHtml(game.title)}</a></b><span class="mini-date"> ${escapeHtml(game.date)}</span></li>`)
    .join('');

  index.querySelectorAll('a').forEach((link) => {
    link.classList.toggle('is-on', link.dataset.range === activeRange);
  });

  updateStats();
}

function renderIndex() {
  index.innerHTML = LETTER_RANGES.map((range) => {
    const has = ITEMS.some((game) => {
      const found = rangeOf(game.title);
      return found && found.id === range.id;
    });

    const state = has ? '' : ' class="is-off"';
    const disabled = has ? '' : ' aria-disabled="true"';

    return `<a href="#gry" data-range="${range.id}"${state}${disabled}>[ ${escapeHtml(range.label)} ]</a>`;
  }).join('');
}

function runSearch() {
  query = search.value;
  render();
}

search.addEventListener('input', runSearch);
searchBtn.addEventListener('click', runSearch);
searchClear.addEventListener('click', () => {
  search.value = '';
  query = '';
  render();
  search.focus();
});

index.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-range]');
  if (!link || link.getAttribute('aria-disabled') === 'true') return;

  event.preventDefault();
  activeRange = activeRange === link.dataset.range ? null : link.dataset.range;
  render();
});

document.querySelectorAll('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    categoryFilter = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((b) => b.classList.toggle('is-on', b === button));
    render();
  });
});

document.querySelectorAll('[data-sort]').forEach((button) => {
  button.addEventListener('click', () => {
    sortMode = button.dataset.sort;
    document.querySelectorAll('[data-sort]').forEach((b) => b.classList.toggle('is-on', b === button));
    render();
  });
});

function showLoadError() {
  grid.innerHTML = '';
  empty.hidden = false;
  empty.textContent = 'Nie udało się wczytać pliku data.json. Strona musi być otwarta przez serwer, a nie przez file://.';
}

async function start() {
  startWallpaper();

  try {
    const response = await fetch('data.json', { cache: 'no-cache' });

    if (!response.ok) throw new Error(String(response.status));

    const data = await response.json();
    ITEMS = Array.isArray(data) ? data : data.items || [];
    INDEXED = ITEMS.map((game, position) => ({ game, position }));
  } catch (error) {
    showLoadError();
    return;
  }

  renderIndex();
  render();
  startPlayer();
}

start();