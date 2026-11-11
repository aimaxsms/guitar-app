const AUDD_KEY_STORAGE = 'guitarApp_auddApiToken';
const RECORD_SECONDS = 8;

const elAuddKeyInput = document.getElementById('auddApiKeyInput');
const elSaveAuddKeyBtn = document.getElementById('saveAuddKeyBtn');
const elIdentifyBtn = document.getElementById('identifyBtn');
const elSongIdStatus = document.getElementById('songIdStatus');
const elSongIdResult = document.getElementById('songIdResult');

let songIdStream = null;
let songIdRecorder = null;
let songIdCountdownTimer = null;

function getAuddKey() {
  try {
    return localStorage.getItem(AUDD_KEY_STORAGE) || '';
  } catch (err) {
    return '';
  }
}

function setAuddKey(key) {
  try {
    localStorage.setItem(AUDD_KEY_STORAGE, key);
  } catch (err) {
    // localStorage unavailable - key just won't persist across reloads
  }
}

function refreshIdentifyAvailability() {
  const hasKey = !!getAuddKey();
  elIdentifyBtn.disabled = !hasKey;
  if (hasKey) {
    elSongIdStatus.textContent = 'Ready — tap Listen';
  } else {
    elSongIdStatus.textContent = 'Add your API key above first';
  }
}

elSaveAuddKeyBtn.addEventListener('click', () => {
  const key = elAuddKeyInput.value.trim();
  if (!key) return;
  setAuddKey(key);
  refreshIdentifyAvailability();
});

function pickRecorderMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const type of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function mimeTypeExtension(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

async function startListening() {
  elIdentifyBtn.disabled = true;
  elSongIdResult.innerHTML = '';
  elSongIdStatus.textContent = 'Requesting microphone…';

  try {
    if (!navigator.mediaDevices) {
      throw new Error('mic needs HTTPS (blocked on plain HTTP/insecure origin)');
    }

    songIdStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = pickRecorderMimeType();
    songIdRecorder = mimeType
      ? new MediaRecorder(songIdStream, { mimeType })
      : new MediaRecorder(songIdStream);

    const chunks = [];
    songIdRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    songIdRecorder.onstop = () => {
      songIdStream.getTracks().forEach((track) => track.stop());
      songIdStream = null;
      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      identifyBlob(blob, mimeType || 'audio/webm');
    };

    let secondsLeft = RECORD_SECONDS;
    elSongIdStatus.textContent = `Listening… (${secondsLeft}s)`;
    songIdCountdownTimer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        elSongIdStatus.textContent = `Listening… (${secondsLeft}s)`;
      } else {
        clearInterval(songIdCountdownTimer);
        songIdCountdownTimer = null;
      }
    }, 1000);

    songIdRecorder.start();
    setTimeout(() => {
      if (songIdRecorder && songIdRecorder.state === 'recording') songIdRecorder.stop();
    }, RECORD_SECONDS * 1000);
  } catch (err) {
    elSongIdStatus.textContent = `Mic error: ${err.message}`;
    elIdentifyBtn.disabled = false;
  }
}

async function identifyBlob(blob, mimeType) {
  elSongIdStatus.textContent = 'Identifying…';

  try {
    const form = new FormData();
    form.append('api_token', getAuddKey());
    form.append('file', blob, 'recording.' + mimeTypeExtension(mimeType));

    const response = await fetch('https://api.audd.io/', { method: 'POST', body: form });
    const data = await response.json();

    if (data.status === 'success' && data.result) {
      elSongIdStatus.textContent = `Match found: ${data.result.title} — ${data.result.artist}`;
      renderSaveForm(data.result);
    } else {
      elSongIdStatus.textContent = 'No match found — try again closer to the speaker, with less background noise.';
    }
  } catch (err) {
    elSongIdStatus.textContent = `Identification error: ${err.message}`;
  } finally {
    elIdentifyBtn.disabled = false;
  }
}

const TAB_SKELETON = 'e|\nB|\nG|\nD|\nA|\nE|';

function renderSaveForm(result) {
  elSongIdResult.innerHTML = `
    <div class="songid-card">
      <label class="songid-label">Title</label>
      <input type="text" id="songIdTitle" class="tuning-select" value="${escapeHtml(result.title || '')}" />

      <label class="songid-label">Artist</label>
      <input type="text" id="songIdArtist" class="tuning-select" value="${escapeHtml(result.artist || '')}" />

      <div class="songid-row">
        <div>
          <label class="songid-label">Key</label>
          <select id="songIdKey" class="tuning-select"></select>
        </div>
        <div>
          <label class="songid-label">Capo</label>
          <div class="songid-capo-row">
            <button type="button" id="songIdCapoMinus" class="capo-step-btn">−</button>
            <span id="songIdCapoDisplay" class="songid-capo-display">No Capo</span>
            <button type="button" id="songIdCapoPlus" class="capo-step-btn">+</button>
          </div>
          <button type="button" id="songIdNoCapoBtn" class="start-btn secondary-btn capo-none-btn">No Capo</button>
          <input type="hidden" id="songIdCapo" value="0" />
        </div>
      </div>

      <label class="songid-label">Tuning</label>
      <select id="songIdTuning" class="tuning-select"></select>

      <label class="songid-label">Strumming Pattern (e.g. "D DU UDU")</label>
      <input type="text" id="songIdStrumPattern" class="tuning-select" placeholder="D DU UDU" />

      <label class="songid-label">Chords &amp; Lyrics (one line per row, e.g. "[G]Walking down the road")</label>
      <textarea id="songIdLines" class="songid-textarea" rows="6" placeholder="[G]Line one here&#10;[D]Line two [Em]here"></textarea>

      <label class="songid-label">Tab (optional, standard ASCII tab)</label>
      <textarea id="songIdTab" class="songid-textarea songid-textarea-mono" rows="7">${TAB_SKELETON}</textarea>

      <button id="songIdSaveBtn" class="start-btn">Save to My Songs</button>
    </div>
  `;

  let capoValue = 0;
  const elCapoDisplay = document.getElementById('songIdCapoDisplay');
  const elCapoHidden = document.getElementById('songIdCapo');
  function updateCapoDisplay() {
    elCapoDisplay.textContent = capoValue === 0 ? 'No Capo' : `Capo: Fret ${capoValue}`;
    elCapoHidden.value = capoValue;
  }
  document.getElementById('songIdCapoMinus').addEventListener('click', () => {
    capoValue = Math.max(0, capoValue - 1);
    updateCapoDisplay();
  });
  document.getElementById('songIdCapoPlus').addEventListener('click', () => {
    capoValue = Math.min(12, capoValue + 1);
    updateCapoDisplay();
  });
  document.getElementById('songIdNoCapoBtn').addEventListener('click', () => {
    capoValue = 0;
    updateCapoDisplay();
  });
  updateCapoDisplay();

  const elKey = document.getElementById('songIdKey');
  ROOTS.forEach((root) => {
    const option = document.createElement('option');
    option.value = root.value;
    option.textContent = root.label;
    elKey.appendChild(option);
  });

  const elTuning = document.getElementById('songIdTuning');
  Object.entries(TUNINGS).forEach(([group, tunings]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group;
    tunings.forEach((tuning) => {
      const option = document.createElement('option');
      option.value = tuning.name;
      option.textContent = tuning.name;
      optgroup.appendChild(option);
    });
    elTuning.appendChild(optgroup);
  });

  document.getElementById('songIdSaveBtn').addEventListener('click', () => {
    const lines = document
      .getElementById('songIdLines')
      .value.split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const tabText = document.getElementById('songIdTab').value.trim();
    const hasTabContent = /\d/.test(tabText);
    const strumPattern = document.getElementById('songIdStrumPattern').value.trim();

    const saved = addMySong({
      title: document.getElementById('songIdTitle').value.trim() || 'Untitled',
      artist: document.getElementById('songIdArtist').value.trim() || 'Unknown',
      key: elKey.value,
      capo: Number(document.getElementById('songIdCapo').value) || 0,
      tuning: elTuning.value,
      strumPattern: strumPattern || null,
      lines: lines.length ? lines : ['(no chords entered yet)'],
      tabs: hasTabContent ? [{ label: 'Tab', tab: tabText }] : [],
    });

    elSongIdResult.innerHTML = `<p class="songid-saved">Saved "${escapeHtml(saved.title)}" to My Songs — find it in the Song Library tab.</p>`;
    if (typeof refreshSheetSongOptions === 'function') refreshSheetSongOptions();
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function stopSongId() {
  if (songIdCountdownTimer) {
    clearInterval(songIdCountdownTimer);
    songIdCountdownTimer = null;
  }
  if (songIdRecorder && songIdRecorder.state === 'recording') {
    songIdRecorder.onstop = null;
    songIdRecorder.stop();
  }
  songIdRecorder = null;
  if (songIdStream) {
    songIdStream.getTracks().forEach((track) => track.stop());
    songIdStream = null;
  }
  elIdentifyBtn.disabled = !getAuddKey();
}

window.SongIdModule = { stop: stopSongId };

elIdentifyBtn.addEventListener('click', startListening);

elAuddKeyInput.value = getAuddKey();
refreshIdentifyAvailability();
