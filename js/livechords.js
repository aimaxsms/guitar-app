// Real-time chord detection via chroma (pitch-class) template matching.
// Entirely client-side: no recognition service, no API key, no upload.
// Accuracy is lower than the old AudD path but needs zero backend/cost.

const LIVE_CHORD_QUALITIES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
};

const LIVE_CHORD_SUFFIX = {
  major: '',
  minor: 'm',
  dominant7: '7',
  major7: 'maj7',
  minor7: 'm7',
};

const CHORD_TEMPLATES = [];
NOTE_NAMES.forEach((root, rootIndex) => {
  Object.entries(LIVE_CHORD_QUALITIES).forEach(([quality, intervals]) => {
    const vector = new Array(12).fill(0);
    intervals.forEach((interval) => {
      vector[(rootIndex + interval) % 12] = 1;
    });
    CHORD_TEMPLATES.push({ label: root + LIVE_CHORD_SUFFIX[quality], vector, count: intervals.length });
  });
});

const MIN_FREQ = 70;
const MAX_FREQ = 1500;
const ANALYSIS_INTERVAL_MS = 120;
const SMOOTH_WINDOW = 5;
const SMOOTH_MIN_AGREEMENT = 3;
const SILENCE_FRAMES_THRESHOLD = 15;
const ENERGY_GATE = 0.001;
const SCORE_GATE = 0.45;
const TAB_SKELETON = 'e|\nB|\nG|\nD|\nA|\nE|';

const elLiveChordName = document.getElementById('liveChordName');
const elLiveChordStatus = document.getElementById('liveChordStatus');
const elLiveChordLog = document.getElementById('liveChordLog');
const elLiveChordStartBtn = document.getElementById('liveChordStartBtn');
const elLiveChordStopBtn = document.getElementById('liveChordStopBtn');
const elLiveChordClearBtn = document.getElementById('liveChordClearBtn');
const elLiveChordSaveResult = document.getElementById('liveChordSaveResult');

let liveStream = null;
let liveAudioContext = null;
let liveAnalyser = null;
let liveFreqData = null;
let liveIntervalId = null;

let detectedSequence = [];
let recentGuesses = [];
let committedChord = null;
let silenceFrames = 0;

function frequencyToPitchClass(freq) {
  const noteNumber = 12 * Math.log2(freq / 440) + 69;
  return ((Math.round(noteNumber) % 12) + 12) % 12;
}

function computeChroma(freqData, sampleRate, fftSize) {
  const chroma = new Array(12).fill(0);
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(MIN_FREQ / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.ceil(MAX_FREQ / binHz));

  for (let i = minBin; i <= maxBin; i++) {
    const db = freqData[i];
    if (db < -100) continue;
    const magnitude = Math.pow(10, db / 20);
    const freq = i * binHz;
    chroma[frequencyToPitchClass(freq)] += magnitude;
  }
  return chroma;
}

function bestChordMatch(chroma) {
  const totalEnergy = chroma.reduce((a, b) => a + b, 0);
  const chromaNorm = Math.sqrt(chroma.reduce((sum, v) => sum + v * v, 0));
  if (totalEnergy < 1e-9 || chromaNorm === 0) return { label: null, score: 0, energy: totalEnergy };

  let bestLabel = null;
  let bestScore = -Infinity;
  CHORD_TEMPLATES.forEach((template) => {
    let dot = 0;
    for (let i = 0; i < 12; i++) {
      if (template.vector[i]) dot += chroma[i];
    }
    const score = dot / (chromaNorm * Math.sqrt(template.count));
    if (score > bestScore) {
      bestScore = score;
      bestLabel = template.label;
    }
  });

  return { label: bestLabel, score: bestScore, energy: totalEnergy };
}

function appendChordChip(label) {
  const chip = document.createElement('span');
  chip.className = 'live-chord-chip';
  chip.textContent = label;
  elLiveChordLog.appendChild(chip);
}

function analyzeFrame() {
  liveAnalyser.getFloatFrequencyData(liveFreqData);
  const chroma = computeChroma(liveFreqData, liveAudioContext.sampleRate, liveAnalyser.fftSize);
  const { label, score, energy } = bestChordMatch(chroma);

  if (!label || energy < ENERGY_GATE || score < SCORE_GATE) {
    silenceFrames++;
    recentGuesses = [];
    if (silenceFrames > SILENCE_FRAMES_THRESHOLD) {
      elLiveChordName.textContent = '—';
      elLiveChordStatus.textContent = 'Listening…';
      committedChord = null;
    }
    return;
  }

  silenceFrames = 0;
  recentGuesses.push(label);
  if (recentGuesses.length > SMOOTH_WINDOW) recentGuesses.shift();

  const counts = {};
  recentGuesses.forEach((g) => {
    counts[g] = (counts[g] || 0) + 1;
  });
  const [topLabel, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  if (topCount >= SMOOTH_MIN_AGREEMENT) {
    elLiveChordName.textContent = topLabel;
    elLiveChordStatus.textContent = 'Listening…';
    if (topLabel !== committedChord) {
      committedChord = topLabel;
      detectedSequence.push(topLabel);
      appendChordChip(topLabel);
    }
  }
}

async function startLiveChords() {
  elLiveChordStatus.textContent = 'Requesting microphone…';
  try {
    if (!navigator.mediaDevices) {
      throw new Error('mic needs HTTPS (blocked on plain HTTP/insecure origin)');
    }

    liveStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    liveAudioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const source = liveAudioContext.createMediaStreamSource(liveStream);
    liveAnalyser = liveAudioContext.createAnalyser();
    liveAnalyser.fftSize = 16384;
    liveAnalyser.minDecibels = -90;
    liveAnalyser.maxDecibels = -10;
    liveAnalyser.smoothingTimeConstant = 0.4;
    source.connect(liveAnalyser);
    liveFreqData = new Float32Array(liveAnalyser.frequencyBinCount);

    detectedSequence = [];
    recentGuesses = [];
    committedChord = null;
    silenceFrames = 0;
    elLiveChordLog.innerHTML = '';
    elLiveChordSaveResult.innerHTML = '';

    elLiveChordStartBtn.style.display = 'none';
    elLiveChordStopBtn.style.display = '';
    elLiveChordStatus.textContent = 'Listening…';

    liveIntervalId = setInterval(analyzeFrame, ANALYSIS_INTERVAL_MS);
  } catch (err) {
    elLiveChordStatus.textContent = `Mic error: ${err.message}`;
  }
}

function stopLiveChords() {
  if (liveIntervalId) {
    clearInterval(liveIntervalId);
    liveIntervalId = null;
  }
  if (liveStream) {
    liveStream.getTracks().forEach((track) => track.stop());
    liveStream = null;
  }
  if (liveAudioContext) {
    liveAudioContext.close();
    liveAudioContext = null;
  }
  liveAnalyser = null;

  elLiveChordStartBtn.style.display = '';
  elLiveChordStopBtn.style.display = 'none';
  elLiveChordName.textContent = '—';
  elLiveChordStatus.textContent = detectedSequence.length
    ? 'Stopped — review and save below'
    : 'Tap Start and play a chord';

  if (detectedSequence.length) renderSaveForm();
}

function buildChordLinesFromSequence(sequence) {
  const lines = [];
  for (let i = 0; i < sequence.length; i += 4) {
    lines.push(
      sequence
        .slice(i, i + 4)
        .map((c) => `[${c}]`)
        .join(' ')
    );
  }
  return lines;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderSaveForm() {
  const prefillLines = buildChordLinesFromSequence(detectedSequence).join('\n');

  elLiveChordSaveResult.innerHTML = `
    <div class="songid-card">
      <label class="songid-label">Title</label>
      <input type="text" id="liveTitle" class="tuning-select" placeholder="Song title" />

      <label class="songid-label">Artist</label>
      <input type="text" id="liveArtist" class="tuning-select" placeholder="Artist (optional)" />

      <div class="songid-row">
        <div>
          <label class="songid-label">Key</label>
          <select id="liveKey" class="tuning-select"></select>
        </div>
        <div>
          <label class="songid-label">Capo</label>
          <div class="songid-capo-row">
            <button type="button" id="liveCapoMinus" class="capo-step-btn">−</button>
            <span id="liveCapoDisplay" class="songid-capo-display">No Capo</span>
            <button type="button" id="liveCapoPlus" class="capo-step-btn">+</button>
          </div>
          <button type="button" id="liveNoCapoBtn" class="start-btn secondary-btn capo-none-btn">No Capo</button>
          <input type="hidden" id="liveCapoValue" value="0" />
        </div>
      </div>

      <label class="songid-label">Tuning</label>
      <select id="liveTuning" class="tuning-select"></select>

      <label class="songid-label">Strumming Pattern (e.g. "D DU UDU")</label>
      <input type="text" id="liveStrumPattern" class="tuning-select" placeholder="D DU UDU" />

      <label class="songid-label">Chords &amp; Lyrics (detected progression below — add lyrics alongside each chord if you want)</label>
      <textarea id="liveLines" class="songid-textarea" rows="6">${prefillLines}</textarea>

      <label class="songid-label">Tab (optional, standard ASCII tab)</label>
      <textarea id="liveTab" class="songid-textarea songid-textarea-mono" rows="7">${TAB_SKELETON}</textarea>

      <button id="liveSaveBtn" class="start-btn">Save to My Songs</button>
    </div>
  `;

  const elKey = document.getElementById('liveKey');
  ROOTS.forEach((root) => {
    const option = document.createElement('option');
    option.value = root.value;
    option.textContent = root.label;
    elKey.appendChild(option);
  });

  const elTuning = document.getElementById('liveTuning');
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

  let capoValue = 0;
  const elCapoDisplay = document.getElementById('liveCapoDisplay');
  const elCapoHidden = document.getElementById('liveCapoValue');
  function updateCapoDisplay() {
    elCapoDisplay.textContent = capoValue === 0 ? 'No Capo' : `Capo: Fret ${capoValue}`;
    elCapoHidden.value = capoValue;
  }
  document.getElementById('liveCapoMinus').addEventListener('click', () => {
    capoValue = Math.max(0, capoValue - 1);
    updateCapoDisplay();
  });
  document.getElementById('liveCapoPlus').addEventListener('click', () => {
    capoValue = Math.min(12, capoValue + 1);
    updateCapoDisplay();
  });
  document.getElementById('liveNoCapoBtn').addEventListener('click', () => {
    capoValue = 0;
    updateCapoDisplay();
  });
  updateCapoDisplay();

  document.getElementById('liveSaveBtn').addEventListener('click', () => {
    const lines = document
      .getElementById('liveLines')
      .value.split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const tabText = document.getElementById('liveTab').value.trim();
    const hasTabContent = /\d/.test(tabText);
    const strumPattern = document.getElementById('liveStrumPattern').value.trim();

    const saved = addMySong({
      title: document.getElementById('liveTitle').value.trim() || 'Untitled',
      artist: document.getElementById('liveArtist').value.trim() || 'Unknown',
      key: elKey.value,
      capo: Number(elCapoHidden.value) || 0,
      tuning: elTuning.value,
      strumPattern: strumPattern || null,
      lines: lines.length ? lines : ['(no chords detected)'],
      tabs: hasTabContent ? [{ label: 'Tab', tab: tabText }] : [],
    });

    elLiveChordSaveResult.innerHTML = `<p class="songid-saved">Saved "${escapeHtml(saved.title)}" to My Songs — find it in the Song Library tab.</p>`;
    if (typeof refreshSheetSongOptions === 'function') refreshSheetSongOptions();
  });
}

elLiveChordClearBtn.addEventListener('click', () => {
  detectedSequence = [];
  elLiveChordLog.innerHTML = '';
  elLiveChordSaveResult.innerHTML = '';
});

elLiveChordStartBtn.addEventListener('click', startLiveChords);
elLiveChordStopBtn.addEventListener('click', stopLiveChords);

window.LiveChordsModule = { stop: stopLiveChords };
