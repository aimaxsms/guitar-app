const elStart = document.getElementById('start');
const elNote = document.getElementById('note');
const elFreq = document.getElementById('freq');
const elGaugeSvg = document.getElementById('gaugeSvg');
const elHeadstockSvg = document.getElementById('headstockSvg');
const elBarLeft = document.getElementById('barLeft');
const elBarRight = document.getElementById('barRight');
const elStatus = document.getElementById('status');
const elTuningSelect = document.getElementById('tuning');

const DIAL_CENTER_X = 110;
const DIAL_CENTER_Y = 90;
const DIAL_RADIUS = 75;
const DIAL_MAX_CENTS = 50;
const DIAL_MAX_ANGLE = 35;
const IDLE_COLOR = '#5a72a3';

let elNeedleLine = null;
let elNeedleBadge = null;
let elNeedleBadgeText = null;

function dialPoint(radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: DIAL_CENTER_X + radius * Math.sin(rad), y: DIAL_CENTER_Y - radius * Math.cos(rad) };
}

function buildGauge() {
  let svg = '';
  svg += `
    <defs>
      <clipPath id="dialClip"><circle cx="${DIAL_CENTER_X}" cy="${DIAL_CENTER_Y}" r="${DIAL_RADIUS}" /></clipPath>
      <radialGradient id="dialBg" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#1b3060" />
        <stop offset="100%" stop-color="#0e1b36" />
      </radialGradient>
      <filter id="needleShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.55" />
      </filter>
    </defs>
  `;

  svg += `<circle cx="${DIAL_CENTER_X}" cy="${DIAL_CENTER_Y}" r="${DIAL_RADIUS}" fill="url(#dialBg)" />`;

  svg += `<g clip-path="url(#dialClip)" opacity="0.55">`;
  for (let gx = DIAL_CENTER_X - DIAL_RADIUS; gx <= DIAL_CENTER_X + DIAL_RADIUS; gx += 15) {
    svg += `<line x1="${gx}" y1="${DIAL_CENTER_Y - DIAL_RADIUS}" x2="${gx}" y2="${DIAL_CENTER_Y + DIAL_RADIUS}" stroke="#22396a" stroke-width="1" />`;
  }
  for (let gy = DIAL_CENTER_Y - DIAL_RADIUS; gy <= DIAL_CENTER_Y + DIAL_RADIUS; gy += 15) {
    svg += `<line x1="${DIAL_CENTER_X - DIAL_RADIUS}" y1="${gy}" x2="${DIAL_CENTER_X + DIAL_RADIUS}" y2="${gy}" stroke="#22396a" stroke-width="1" />`;
  }
  svg += `</g>`;

  for (let angle = 0; angle < 360; angle += 45) {
    const inner = dialPoint(DIAL_RADIUS - 8, angle);
    const outer = dialPoint(DIAL_RADIUS + 1, angle);
    svg += `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" stroke="#4a6396" stroke-width="2" stroke-linecap="round" />`;
  }

  svg += `<circle cx="${DIAL_CENTER_X}" cy="${DIAL_CENTER_Y}" r="${DIAL_RADIUS}" fill="none" stroke="#2d4880" stroke-width="3" />`;
  svg += `<circle cx="${DIAL_CENTER_X}" cy="${DIAL_CENTER_Y}" r="${DIAL_RADIUS + 4}" fill="none" stroke="#1b3060" stroke-width="1" />`;

  svg += `<line id="needleLine" x1="${DIAL_CENTER_X}" y1="${DIAL_CENTER_Y}" x2="${DIAL_CENTER_X}" y2="${DIAL_CENTER_Y + DIAL_RADIUS + 35}" stroke="${IDLE_COLOR}" stroke-width="3" stroke-linecap="round" filter="url(#needleShadow)" />`;
  svg += `<circle id="needleBadge" cx="${DIAL_CENTER_X}" cy="${DIAL_CENTER_Y}" r="18" fill="${IDLE_COLOR}" stroke="#000" stroke-opacity="0.25" stroke-width="2" filter="url(#needleShadow)" />`;
  svg += `<text id="needleBadgeText" x="${DIAL_CENTER_X}" y="${DIAL_CENTER_Y + 5}" font-size="15" font-weight="800" fill="#15110a" text-anchor="middle">—</text>`;

  elGaugeSvg.innerHTML = svg;
  elNeedleLine = document.getElementById('needleLine');
  elNeedleBadge = document.getElementById('needleBadge');
  elNeedleBadgeText = document.getElementById('needleBadgeText');
}

function updateNeedle(cents, color) {
  const clamped = cents === null ? 0 : Math.max(-DIAL_MAX_CENTS, Math.min(DIAL_MAX_CENTS, cents));
  const angleDeg = (clamped / DIAL_MAX_CENTS) * DIAL_MAX_ANGLE;
  const rad = (angleDeg * Math.PI) / 180;
  const length = DIAL_RADIUS + 35;
  const tipX = DIAL_CENTER_X + length * Math.sin(rad);
  const tipY = DIAL_CENTER_Y + length * Math.cos(rad);

  elNeedleLine.setAttribute('x2', tipX);
  elNeedleLine.setAttribute('y2', tipY);
  elNeedleLine.setAttribute('stroke', color);
  elNeedleBadge.setAttribute('fill', color);
  elNeedleBadgeText.textContent = cents === null ? '—' : `${cents > 0 ? '+' : ''}${Math.round(cents)}`;

  elBarLeft.style.background = color;
  elBarRight.style.background = color;
}

// Headstock artwork (HEADSTOCK_ART, from js/headstock-art.js) is a static illustration
// matched to a specific reference image. Don't regenerate/restyle it as a side effect
// of unrelated changes — only the overlay positions below should need tuning.
const PEG_BUTTON_POSITIONS = [
  { x: 70, y: 350 },
  { x: 70, y: 230 },
  { x: 70, y: 110 },
  { x: 320, y: 110 },
  { x: 320, y: 230 },
  { x: 320, y: 350 },
];
const STRING_XS = [170, 179, 188, 206, 215, 224];
const NUT_DOT_Y = 420;

let elPegLabels = [];
let elNutDots = [];

function buildHeadstock() {
  let svg = HEADSTOCK_ART;

  PEG_BUTTON_POSITIONS.forEach((pos, index) => {
    const labelY = pos.y + 32;
    const pillWidth = 34;

    svg += `
      <g class="peg-label" data-index="${index}">
        <rect class="peg-label-bg" x="${pos.x - pillWidth / 2}" y="${labelY - 12}" width="${pillWidth}" height="24" rx="12" fill="#172a52" stroke="#2d4880" stroke-width="1.5" />
        <text class="peg-label-text" x="${pos.x}" y="${labelY + 5}" font-size="12" font-weight="700" fill="#f5f5f5" text-anchor="middle">?</text>
      </g>
    `;
  });

  STRING_XS.forEach((x, i) => {
    svg += `<circle class="nut-dot" data-index="${i}" cx="${x}" cy="${NUT_DOT_Y}" r="5" fill="transparent" />`;
  });

  elHeadstockSvg.innerHTML = svg;
  elPegLabels = Array.from(elHeadstockSvg.querySelectorAll('.peg-label'));
  elNutDots = Array.from(elHeadstockSvg.querySelectorAll('.nut-dot'));

  elPegLabels.forEach((g) => {
    const index = Number(g.dataset.index);
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => {
      focusedIndex = focusedIndex === index ? null : index;
      renderStringLabels();
      playPluck(noteToFreq(currentTuning.strings[index]), { duration: 1.4, gain: 0.05 });
    });
  });
}

function renderStringLabels(activeIndex, inTune) {
  elPegLabels.forEach((g, i) => {
    const [name, octave] = currentTuning.strings[i];
    const text = g.querySelector('.peg-label-text');
    const bg = g.querySelector('.peg-label-bg');
    text.textContent = `${name}${octave}`;

    let fill = '#172a52';
    let stroke = i === focusedIndex ? '#9ca3af' : '#2d4880';
    let textColor = '#f5f5f5';

    if (i === activeIndex) {
      const color = inTune ? '#4ade80' : '#facc15';
      fill = inTune ? '#163022' : '#3a2f0d';
      stroke = color;
      textColor = color;
    }

    bg.setAttribute('fill', fill);
    bg.setAttribute('stroke', stroke);
    text.setAttribute('fill', textColor);
  });

  elNutDots.forEach((dot, i) => {
    dot.setAttribute('fill', i === activeIndex ? (inTune ? '#4ade80' : '#facc15') : 'transparent');
  });
}

let smoothedCents = 0;
let lastStringIndex = null;
let focusedIndex = null;
let currentTuning = TUNINGS.Standard[0];
let tunerStream = null;
let tunerAudioContext = null;
let pitchNode = null;
let silenceTimer = null;
const SILENCE_HOLD_MS = 700;

function lowestStringMinFreq() {
  const lowestFreq = Math.min(...currentTuning.strings.map((s) => noteToFreq(s)));
  return lowestFreq * Math.pow(2, -3 / 12);
}

function sendMinFreqToWorklet() {
  if (pitchNode) pitchNode.port.postMessage({ minFreq: lowestStringMinFreq() });
}

function populateTuningSelect() {
  Object.entries(TUNINGS).forEach(([group, tunings]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group;
    tunings.forEach((tuning) => {
      const option = document.createElement('option');
      option.value = tuning.name;
      option.textContent = tuning.name;
      optgroup.appendChild(option);
    });
    elTuningSelect.appendChild(optgroup);
  });
}

function findTuningByName(name) {
  for (const tunings of Object.values(TUNINGS)) {
    const match = tunings.find((t) => t.name === name);
    if (match) return match;
  }
  return TUNINGS.Standard[0];
}

function findNearestString(frequency) {
  let bestIndex = 0;
  let bestCents = Infinity;
  currentTuning.strings.forEach((string, index) => {
    const targetFreq = noteToFreq(string);
    const cents = 1200 * Math.log2(frequency / targetFreq);
    if (Math.abs(cents) < Math.abs(bestCents)) {
      bestCents = cents;
      bestIndex = index;
    }
  });
  return { index: bestIndex, cents: bestCents };
}

function updateDisplay(frequency) {
  if (frequency === null) {
    if (!silenceTimer) {
      silenceTimer = setTimeout(() => {
        silenceTimer = null;
        elStatus.textContent = 'Listening…';
        updateNeedle(null, IDLE_COLOR);
        lastStringIndex = null;
        renderStringLabels();
      }, SILENCE_HOLD_MS);
    }
    return;
  }

  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  let index, cents;
  if (focusedIndex !== null) {
    index = focusedIndex;
    cents = 1200 * Math.log2(frequency / noteToFreq(currentTuning.strings[index]));
  } else {
    ({ index, cents } = findNearestString(frequency));
  }

  const sameString = lastStringIndex === index;
  const jumpedFar = sameString && Math.abs(cents - smoothedCents) > 25;
  smoothedCents = sameString && !jumpedFar ? smoothedCents * 0.5 + cents * 0.5 : cents;
  lastStringIndex = index;

  const [name, octave] = currentTuning.strings[index];
  elNote.textContent = `${name}${octave}`;
  elFreq.textContent = `${frequency.toFixed(1)} Hz`;

  const inTune = Math.abs(smoothedCents) <= 5;
  const close = Math.abs(smoothedCents) <= 15;
  const statusColor = inTune ? '#4ade80' : close ? '#facc15' : '#f87171';
  updateNeedle(smoothedCents, statusColor);
  elNote.style.color = statusColor;
  elStatus.textContent = inTune ? 'In tune' : smoothedCents > 0 ? 'Too sharp' : 'Too flat';

  renderStringLabels(index, inTune);
}

async function start() {
  try {
    if (!navigator.mediaDevices) {
      throw new Error('mic needs HTTPS (blocked on plain HTTP/insecure origin)');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const audioContext = new AudioContext({ latencyHint: 'interactive' });
    await audioContext.audioWorklet.addModule('js/pitch-worklet.js');

    const source = audioContext.createMediaStreamSource(stream);
    pitchNode = new AudioWorkletNode(audioContext, 'pitch-processor');

    pitchNode.port.onmessage = (event) => {
      updateDisplay(event.data.frequency);
    };

    source.connect(pitchNode);
    sendMinFreqToWorklet();

    tunerStream = stream;
    tunerAudioContext = audioContext;

    elStart.style.display = 'none';
    elStatus.textContent = 'Listening…';
  } catch (err) {
    elStatus.textContent = `Mic error: ${err.message}`;
  }
}

function stopTuner() {
  if (tunerStream) {
    tunerStream.getTracks().forEach((track) => track.stop());
    tunerStream = null;
  }
  if (tunerAudioContext) {
    tunerAudioContext.close();
    tunerAudioContext = null;
  }
  pitchNode = null;
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  elStart.style.display = '';
  elStatus.textContent = 'Tap start and allow microphone access';
  updateNeedle(null, IDLE_COLOR);
  lastStringIndex = null;
  renderStringLabels();
}

window.TunerModule = { stop: stopTuner };

elStart.addEventListener('click', start);
elTuningSelect.addEventListener('change', () => {
  currentTuning = findTuningByName(elTuningSelect.value);
  focusedIndex = null;
  lastStringIndex = null;
  sendMinFreqToWorklet();
  renderStringLabels();
});

populateTuningSelect();
buildGauge();
buildHeadstock();
renderStringLabels();
updateNeedle(null, IDLE_COLOR);
