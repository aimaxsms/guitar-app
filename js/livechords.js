// Real-time chord detection via chroma (pitch-class) template matching.
// Entirely client-side: no recognition service, no API key, no upload.
// Accuracy is lower than a trained ML model but needs zero backend/cost.

// Only major/minor triads — a 7th chord shares 3 of its 4 notes with the plain major/minor
// version of the same root, so keeping 7th-chord templates around just gives the matcher more
// near-identical options to confuse. With only major/minor to choose from, a played 7th chord
// naturally "rounds" to whichever of the two it's actually closest to.
const LIVE_CHORD_QUALITIES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

const LIVE_CHORD_SUFFIX = {
  major: '',
  minor: 'm',
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

// --- Key detection: match the detected chord set against every possible key's diatonic chords ---
// Reuses MAJOR_KEY_INTERVALS/MAJOR_KEY_QUALITIES/MINOR_KEY_INTERVALS/MINOR_KEY_QUALITIES from theory.js
// (loaded earlier) rather than redeclaring them, since duplicate top-level const names across
// classic <script> files throw a SyntaxError that silently kills this entire script.
function keyChordSet(root, keyQuality) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const intervals = keyQuality === 'minor' ? MINOR_KEY_INTERVALS : MAJOR_KEY_INTERVALS;
  const qualities = keyQuality === 'minor' ? MINOR_KEY_QUALITIES : MAJOR_KEY_QUALITIES;
  const set = new Set();
  intervals.forEach((interval, i) => {
    const note = NOTE_NAMES[(rootIndex + interval) % 12];
    const suffix = qualities[i] === 'minor' ? 'm' : qualities[i] === 'diminished' ? '°' : '';
    set.add(note + suffix);
  });
  return set;
}

function detectKey(sequence) {
  if (!sequence.length) return null;
  const uniqueChords = [...new Set(sequence)];
  const frequency = {};
  sequence.forEach((c) => {
    frequency[c] = (frequency[c] || 0) + 1;
  });
  const firstChord = sequence[0];

  const candidates = [];
  NOTE_NAMES.forEach((root) => {
    ['major', 'minor'].forEach((keyQuality) => {
      const chordSet = keyChordSet(root, keyQuality);
      const matchCount = uniqueChords.filter((c) => chordSet.has(c)).length;
      candidates.push({ root, keyQuality, matchCount });
    });
  });

  const maxMatch = Math.max(...candidates.map((c) => c.matchCount));
  const top = candidates.filter((c) => c.matchCount === maxMatch);

  function tonicLabel(c) {
    return c.root + (c.keyQuality === 'minor' ? 'm' : '');
  }
  top.sort((a, b) => {
    const aFirst = tonicLabel(a) === firstChord ? 1 : 0;
    const bFirst = tonicLabel(b) === firstChord ? 1 : 0;
    if (aFirst !== bFirst) return bFirst - aFirst;
    return (frequency[tonicLabel(b)] || 0) - (frequency[tonicLabel(a)] || 0);
  });

  return top[0];
}

// --- Strum pattern guess, from onset density (how many strums per chord on average) ---
function guessStrumPattern(avgStrumsPerChord) {
  const n = Math.round(avgStrumsPerChord);
  if (n <= 1) return 'D';
  if (n === 2) return 'D U';
  if (n === 3) return 'D DU';
  if (n === 4) return 'D DU UD';
  if (n === 5) return 'D DU UDU';
  return 'D DU UDU DU';
}

const MIN_FREQ = 70;
const MAX_FREQ = 1500;
const ANALYSIS_INTERVAL_MS = 120;
const SMOOTH_WINDOW = 5;
const SMOOTH_MIN_AGREEMENT = 3;
const SILENCE_FRAMES_THRESHOLD = 15;
const ENERGY_GATE = 0.001;
const SCORE_GATE = 0.45;
const TAB_SKELETON = 'e|\nB|\nG|\nD|\nA|\nE|';

// Spectral flatness tells apart tonal, peaky spectra (a plucked guitar string, which
// concentrates energy at a handful of sharp harmonic frequencies) from broadband/noisy
// spectra (drum hits, claps, consonant bursts in speech) and the flatter, formant-shaped
// spectra of a singing/spoken voice. It's not a substitute for real source separation —
// it can't perfectly isolate guitar from a voice singing a clean sustained note — but it
// reliably rejects drums/percussion and meaningfully reduces false triggers from speech.
const MAX_SPECTRAL_FLATNESS = 0.35;

const ONSET_ENERGY_HISTORY = 8;
const ONSET_TRIGGER_RATIO = 1.4;
const ONSET_MIN_ENERGY = 0.0005;
const ONSET_REFRACTORY_SEC = 0.15;

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
let lyricSegments = [];
let currentSegmentIndex = -1;
let recentGuesses = [];
let committedChord = null;
let silenceFrames = 0;

let energyHistory = [];
let lastOnsetTime = 0;
let onsetCount = 0;
let sessionStartTime = 0;

let speechRecognition = null;
let speechActive = false;

const SPEECH_SUPPORTED = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

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

function computeSpectralFlatness(freqData, sampleRate, fftSize) {
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(MIN_FREQ / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.ceil(MAX_FREQ / binHz));
  const eps = 1e-12;

  let logSum = 0;
  let linSum = 0;
  let count = 0;
  for (let i = minBin; i <= maxBin; i++) {
    const db = freqData[i];
    const magnitude = db < -100 ? eps : Math.pow(10, db / 20);
    logSum += Math.log(magnitude + eps);
    linSum += magnitude;
    count++;
  }
  if (count === 0 || linSum === 0) return 1;

  const geoMean = Math.exp(logSum / count);
  const arithMean = linSum / count;
  return geoMean / (arithMean + eps);
}

function scoreTemplate(template, chroma, chromaNorm) {
  let dot = 0;
  for (let i = 0; i < 12; i++) {
    if (template.vector[i]) dot += chroma[i];
  }
  return dot / (chromaNorm * Math.sqrt(template.count));
}

// How much higher a different chord's score has to be than the chord currently held
// before we accept it as a real change. Chords that share most of their notes with the
// current one (G vs Em, G vs G7) naturally score close to each other frame-to-frame as
// mic noise wobbles slightly — without this margin, that wobble alone flickers the
// label back and forth even though nothing you're playing has actually changed.
const HYSTERESIS_MARGIN = 0.08;

function bestChordMatch(chroma, heldLabel) {
  const totalEnergy = chroma.reduce((a, b) => a + b, 0);
  const chromaNorm = Math.sqrt(chroma.reduce((sum, v) => sum + v * v, 0));
  if (totalEnergy < 1e-9 || chromaNorm === 0) return { label: null, score: 0, energy: totalEnergy };

  let bestLabel = null;
  let bestScore = -Infinity;
  CHORD_TEMPLATES.forEach((template) => {
    const score = scoreTemplate(template, chroma, chromaNorm);
    if (score > bestScore) {
      bestScore = score;
      bestLabel = template.label;
    }
  });

  if (heldLabel && heldLabel !== bestLabel) {
    const heldTemplate = CHORD_TEMPLATES.find((t) => t.label === heldLabel);
    if (heldTemplate) {
      const heldScore = scoreTemplate(heldTemplate, chroma, chromaNorm);
      if (heldScore + HYSTERESIS_MARGIN >= bestScore) {
        return { label: heldLabel, score: heldScore, energy: totalEnergy };
      }
    }
  }

  return { label: bestLabel, score: bestScore, energy: totalEnergy };
}

function appendChordChip(label) {
  const chip = document.createElement('span');
  chip.className = 'live-chord-chip';
  chip.textContent = label;
  elLiveChordLog.appendChild(chip);
}

function trackOnset(energy) {
  const avgEnergy = energyHistory.length ? energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length : 0;
  const now = liveAudioContext.currentTime;
  if (energy > ONSET_MIN_ENERGY && energy > avgEnergy * ONSET_TRIGGER_RATIO && now - lastOnsetTime > ONSET_REFRACTORY_SEC) {
    onsetCount++;
    lastOnsetTime = now;
  }
  energyHistory.push(energy);
  if (energyHistory.length > ONSET_ENERGY_HISTORY) energyHistory.shift();
}

function analyzeFrame() {
  liveAnalyser.getFloatFrequencyData(liveFreqData);
  const chroma = computeChroma(liveFreqData, liveAudioContext.sampleRate, liveAnalyser.fftSize);
  const { label, score, energy } = bestChordMatch(chroma, committedChord);
  const flatness = computeSpectralFlatness(liveFreqData, liveAudioContext.sampleRate, liveAnalyser.fftSize);

  trackOnset(energy);

  if (!label || energy < ENERGY_GATE || score < SCORE_GATE || flatness > MAX_SPECTRAL_FLATNESS) {
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
      lyricSegments.push('');
      currentSegmentIndex = lyricSegments.length - 1;
      appendChordChip(topLabel);
    }
  }
}

function setupSpeechRecognition() {
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SpeechRecognitionCtor();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = 'en-US';

  rec.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (!event.results[i].isFinal) continue;
      const text = event.results[i][0].transcript.trim();
      if (text && currentSegmentIndex >= 0 && currentSegmentIndex < lyricSegments.length) {
        lyricSegments[currentSegmentIndex] = (lyricSegments[currentSegmentIndex] + ' ' + text).trim();
      }
    }
  };
  rec.onerror = () => {};
  rec.onend = () => {
    if (speechActive) {
      try {
        rec.start();
      } catch (err) {
        // already started or otherwise unavailable - stop trying
      }
    }
  };

  return rec;
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
    lyricSegments = [];
    currentSegmentIndex = -1;
    recentGuesses = [];
    committedChord = null;
    silenceFrames = 0;
    energyHistory = [];
    lastOnsetTime = 0;
    onsetCount = 0;
    sessionStartTime = liveAudioContext.currentTime;
    elLiveChordLog.innerHTML = '';
    elLiveChordSaveResult.innerHTML = '';

    if (SPEECH_SUPPORTED) {
      speechActive = true;
      speechRecognition = setupSpeechRecognition();
      try {
        speechRecognition.start();
      } catch (err) {
        speechActive = false;
      }
    }

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

  const sessionDuration = liveAudioContext ? liveAudioContext.currentTime - sessionStartTime : 0;

  speechActive = false;
  if (speechRecognition) {
    speechRecognition.onend = null;
    try {
      speechRecognition.stop();
    } catch (err) {
      // already stopped
    }
    speechRecognition = null;
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

  if (detectedSequence.length) renderSaveForm(sessionDuration);
}

function buildChordLyricLines(sequence, segments) {
  return sequence.map((chord, i) => `[${chord}]${(segments[i] || '').trim()}`.trimEnd());
}

function buildChordTabSections(sequence) {
  const seen = new Set();
  const sections = [];
  sequence.forEach((chordLabel) => {
    if (seen.has(chordLabel)) return;
    seen.add(chordLabel);
    const parsed = parseChordName(chordLabel);
    if (!parsed) return;
    const positions = getChordPositions(parsed.root, parsed.quality);
    const pos = positions[0];
    if (!pos) return;

    const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
    const tabLines = pos.frets
      .map((fret, i) => `${stringNames[i]}|--${fret === 'x' ? 'x' : fret}--`)
      .join('\n');
    sections.push({ label: `${chordLabel} (${pos.startFret === 0 ? 'open' : pos.startFret + 'fr'})`, tab: tabLines });
  });
  return sections;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderSaveForm(sessionDuration) {
  const prefillLines = buildChordLyricLines(detectedSequence, lyricSegments).join('\n');
  const detectedKeyInfo = detectKey(detectedSequence);
  const chordTabSections = buildChordTabSections(detectedSequence);
  const avgStrumsPerChord = detectedSequence.length ? onsetCount / detectedSequence.length : 0;
  const strumGuess = guessStrumPattern(avgStrumsPerChord);

  const chordTabsHtml = chordTabSections.length
    ? `
      <label class="songid-label">Auto-generated chord shapes (reference, based on the detected progression)</label>
      <div class="chord-diagrams live-chord-tab-reference">
        ${chordTabSections
          .map(
            (section) => `
              <div class="diagram-card">
                <pre class="tab-block live-chord-tab-mini">${section.tab}</pre>
                <div class="diagram-label">${section.label}</div>
              </div>
            `
          )
          .join('')}
      </div>
    `
    : '';

  const speechNote = SPEECH_SUPPORTED
    ? 'Words below were transcribed live with your browser\'s speech recognition — built for speech, not singing, so expect rough accuracy.'
    : 'Lyric transcription needs Chrome or Edge (not supported in this browser) — add words yourself below if you want.';

  elLiveChordSaveResult.innerHTML = `
    <div class="songid-card">
      <label class="songid-label">Title</label>
      <input type="text" id="liveTitle" class="tuning-select" placeholder="Song title" />

      <label class="songid-label">Artist</label>
      <input type="text" id="liveArtist" class="tuning-select" placeholder="Artist (optional)" />

      <div class="songid-row">
        <div>
          <label class="songid-label">Key (auto-guessed)</label>
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

      <label class="songid-label">Strumming Pattern (auto-guessed from strum density — adjust as needed)</label>
      <input type="text" id="liveStrumPattern" class="tuning-select" value="${escapeHtml(strumGuess)}" />

      <label class="songid-label">Chords &amp; Lyrics</label>
      <p class="songid-hint">${speechNote}</p>
      <textarea id="liveLines" class="songid-textarea" rows="6">${prefillLines}</textarea>

      ${chordTabsHtml}

      <label class="songid-label">Your own tab notes (optional)</label>
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
  if (detectedKeyInfo) elKey.value = detectedKeyInfo.root;

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
    const manualTabText = document.getElementById('liveTab').value.trim();
    const hasManualTab = /\d/.test(manualTabText);
    const strumPattern = document.getElementById('liveStrumPattern').value.trim();

    const tabs = [...chordTabSections];
    if (hasManualTab) tabs.push({ label: 'Your notes', tab: manualTabText });

    const saved = addMySong({
      title: document.getElementById('liveTitle').value.trim() || 'Untitled',
      artist: document.getElementById('liveArtist').value.trim() || 'Unknown',
      key: elKey.value,
      capo: Number(elCapoHidden.value) || 0,
      tuning: elTuning.value,
      strumPattern: strumPattern || null,
      lines: lines.length ? lines : ['(no chords detected)'],
      tabs,
    });

    elLiveChordSaveResult.innerHTML = `<p class="songid-saved">Saved "${escapeHtml(saved.title)}" to My Songs — find it in the Song Library tab.</p>`;
    if (typeof refreshSheetSongOptions === 'function') refreshSheetSongOptions();
  });
}

elLiveChordClearBtn.addEventListener('click', () => {
  detectedSequence = [];
  lyricSegments = [];
  elLiveChordLog.innerHTML = '';
  elLiveChordSaveResult.innerHTML = '';
});

elLiveChordStartBtn.addEventListener('click', startLiveChords);
elLiveChordStopBtn.addEventListener('click', stopLiveChords);

window.LiveChordsModule = { stop: stopLiveChords };
