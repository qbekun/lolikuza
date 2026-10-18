const overlay = document.getElementById('enterOverlay');
const video = document.getElementById('bgVideo');
const audioToggle = document.getElementById('audioToggle');
const volumeSlider = document.getElementById('volumeSlider');
const volumeMuteX = document.getElementById('volumeMuteX');
const volumeWave1 = document.getElementById('volumeWave1');
const volumeWave2 = document.getElementById('volumeWave2');

let isMuted = true;

function updateIcon() {
  if (!volumeMuteX || !volumeWave1 || !volumeWave2) return;

  if (isMuted) {
    volumeMuteX.style.display = '';
    volumeWave1.style.display = 'none';
    volumeWave2.style.display = 'none';
  } else {
    volumeMuteX.style.display = 'none';
    volumeWave1.style.display = '';
    volumeWave2.style.display = video.volume > 0.5 ? '' : 'none';
  }
}

if (overlay && video) {
  overlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    video.muted = false;
    video.volume = 0.25;
    isMuted = false;
    updateIcon();
  });
}

if (audioToggle && video) {
  audioToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    video.muted = isMuted;

    if (!isMuted && video.volume === 0) {
      video.volume = 0.25;

      if (volumeSlider) {
        volumeSlider.value = '0.25';
      }
    }

    updateIcon();
  });
}

if (volumeSlider && video) {
  volumeSlider.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    video.volume = value;

    if (value > 0 && isMuted) {
      isMuted = false;
      video.muted = false;
    } else if (value === 0 && !isMuted) {
      isMuted = true;
      video.muted = true;
    }

    updateIcon();
  });
}
