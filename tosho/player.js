const playerPanel = document.getElementById('playerPanel');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerNow = document.getElementById('playerNow');
const playerTotal = document.getElementById('playerTotal');
const playerSeek = document.getElementById('playerSeek');
const playerPlay = document.getElementById('playerPlay');
const playerIcon = document.getElementById('playerIcon');
const playerPrev = document.getElementById('playerPrev');
const playerNext = document.getElementById('playerNext');
const playerVol = document.getElementById('playerVol');
const playerList = document.getElementById('playerList');
const playerAudio = document.getElementById('playerAudio');

const ICON_PLAY = '<polygon points="6 4 20 12 6 20"></polygon>';
const ICON_PAUSE = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';

let TRACKS = [];
let trackIndex = 0;

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = String(total % 60).padStart(2, '0');

  return `${min}:${sec}`;
}

function renderTrackList() {
  playerList.innerHTML = TRACKS
    .map((track, index) => {
      const active = index === trackIndex ? ' class="is-active"' : '';
      const label = track.artist ? `${track.title} - ${track.artist}` : track.title;

      return `<li${active} data-index="${index}"><a href="#">${escapeHtml(label)}</a></li>`;
    })
    .join('');
}

function loadTrack(index) {
  const track = TRACKS[index];
  if (!track) return;

  trackIndex = index;
  playerAudio.src = track.file;
  playerAudio.volume = parseFloat(playerVol.value);

  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist || '';
  playerSeek.value = 0;
  playerNow.textContent = '0:00';
  playerTotal.textContent = '0:00';

  renderTrackList();
}

function togglePlay() {
  if (!playerAudio.src) return;

  if (playerAudio.paused) {
    playerAudio.play().catch(() => {});
  } else {
    playerAudio.pause();
  }
}

function stepTrack(delta) {
  if (!TRACKS.length) return;

  const next = (trackIndex + delta + TRACKS.length) % TRACKS.length;
  const wasPlaying = !playerAudio.paused;

  loadTrack(next);

  if (wasPlaying) playerAudio.play().catch(() => {});
}

function setIcon(playing) {
  playerIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  playerPlay.title = playing ? 'Pauza' : 'Odtwórz';
  playerPlay.setAttribute('aria-label', playerPlay.title);
}

function initPlayer(tracks) {
  TRACKS = tracks;

  if (!TRACKS.length) {
    playerPanel.hidden = true;
    return;
  }

  loadTrack(0);
  setIcon(false);

  playerPlay.addEventListener('click', togglePlay);
  playerPrev.addEventListener('click', () => stepTrack(-1));
  playerNext.addEventListener('click', () => stepTrack(1));

  playerList.addEventListener('click', (event) => {
    const item = event.target.closest('li[data-index]');
    if (!item) return;

    event.preventDefault();

    const index = Number(item.dataset.index);
    const wasPlaying = !playerAudio.paused;

    loadTrack(index);

    if (wasPlaying) playerAudio.play().catch(() => {});
  });

  playerAudio.addEventListener('play', () => setIcon(true));
  playerAudio.addEventListener('pause', () => setIcon(false));
  playerAudio.addEventListener('ended', () => stepTrack(1));

  playerAudio.addEventListener('loadedmetadata', () => {
    playerTotal.textContent = formatTime(playerAudio.duration);
  });

  playerAudio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = playerAudio;

    playerNow.textContent = formatTime(currentTime);

    if (Number.isFinite(duration) && duration > 0) {
      playerSeek.value = Math.round((currentTime / duration) * 1000);
    }
  });

  playerSeek.addEventListener('input', () => {
    const { duration } = playerAudio;
    if (!Number.isFinite(duration) || duration <= 0) return;

    playerAudio.currentTime = (Number(playerSeek.value) / 1000) * duration;
  });

  playerVol.addEventListener('input', () => {
    playerAudio.volume = parseFloat(playerVol.value);
  });

  playerAudio.addEventListener('error', () => {
    playerTitle.textContent = 'Blad odtwarzania pliku';
  });
}

async function startPlayer() {
  try {
    const response = await fetch('music.json', { cache: 'no-cache' });

    if (!response.ok) throw new Error(String(response.status));

    const data = await response.json();
    initPlayer(Array.isArray(data) ? data : data.tracks || []);
  } catch (error) {
    playerPanel.hidden = true;
  }
}

startPlayer();
