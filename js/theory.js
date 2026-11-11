const INTERVAL_NAMES = {
  0: 'Root',
  3: 'Minor 3rd',
  4: 'Major 3rd',
  7: 'Perfect 5th',
};

const elTheoryRoots = document.getElementById('theoryRoots');
const elTheoryQuality = document.getElementById('theoryQuality');
const elTheoryResult = document.getElementById('theoryResult');
const elTheoryDiagrams = document.getElementById('theoryDiagrams');

let theoryRoot = 'C';
let theoryQuality = 'major';

function getChordTones(root, quality) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const intervals = quality === 'minor' ? [0, 3, 7] : [0, 4, 7];
  return intervals.map((semitones) => ({
    note: NOTE_NAMES[(rootIndex + semitones) % 12],
    semitones,
    interval: INTERVAL_NAMES[semitones],
  }));
}

function renderSemitoneStrip(root, quality) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const thirdOffset = quality === 'minor' ? 3 : 4;
  let html = '<div class="semitone-strip">';
  for (let i = 0; i < 12; i++) {
    const noteName = NOTE_NAMES[(rootIndex + i) % 12];
    let cls = 'semitone-box';
    if (i === 0) cls += ' tone-root';
    else if (i === thirdOffset) cls += ' tone-third';
    else if (i === 7) cls += ' tone-fifth';
    html += `<div class="${cls}"><span class="semitone-note">${noteName}</span><span class="semitone-index">${i}</span></div>`;
  }
  html += '</div>';
  return html;
}

const MAJOR_KEY_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_KEY_QUALITIES = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
const MAJOR_KEY_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

const MINOR_KEY_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
const MINOR_KEY_QUALITIES = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
const MINOR_KEY_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

function getKeyChords(root, quality) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const intervals = quality === 'minor' ? MINOR_KEY_INTERVALS : MAJOR_KEY_INTERVALS;
  const qualities = quality === 'minor' ? MINOR_KEY_QUALITIES : MAJOR_KEY_QUALITIES;
  const numerals = quality === 'minor' ? MINOR_KEY_NUMERALS : MAJOR_KEY_NUMERALS;

  return intervals.map((interval, i) => {
    const note = NOTE_NAMES[(rootIndex + interval) % 12];
    const chordQuality = qualities[i];
    const suffix = chordQuality === 'minor' ? 'm' : chordQuality === 'diminished' ? '°' : '';
    return { numeral: numerals[i], note, quality: chordQuality, name: note + suffix };
  });
}

function renderKeyInfo() {
  const chords = getKeyChords(theoryRoot, theoryQuality);
  const elKeyInfo = document.getElementById('keyInfo');
  elKeyInfo.innerHTML = `
    <div class="library-title">Key of ${theoryRoot} ${theoryQuality}</div>
    <div class="key-chords-row">
      ${chords
        .map(
          (c) => `
            <div class="key-chord-card key-chord-${c.quality}">
              <div class="key-chord-numeral">${c.numeral}</div>
              <div class="key-chord-name">${c.name}</div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderTheory() {
  const tones = getChordTones(theoryRoot, theoryQuality);

  elTheoryResult.innerHTML = `
    <div class="library-title">${theoryRoot} ${theoryQuality}</div>
    <div class="chord-formula">${tones.map((t) => t.interval).join(' + ')}</div>
    <div class="tone-cards">
      ${tones
        .map(
          (t) => `
            <div class="tone-card">
              <div class="tone-card-note">${t.note}</div>
              <div class="tone-card-interval">${t.interval}</div>
              <div class="tone-card-semitones">${t.semitones} semitones</div>
            </div>
          `
        )
        .join('')}
    </div>
    ${renderSemitoneStrip(theoryRoot, theoryQuality)}
  `;

  const chordLabel = theoryQuality === 'minor' ? `${theoryRoot}m` : theoryRoot;
  renderChordDiagrams(elTheoryDiagrams, chordLabel, { labelMode: 'note' });

  renderKeyInfo();

  elTheoryRoots.querySelectorAll('.root-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === theoryRoot);
  });
  elTheoryQuality.querySelectorAll('.quality-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === theoryQuality);
  });
}

ROOTS.forEach((root) => {
  const btn = document.createElement('button');
  btn.className = 'root-btn';
  btn.textContent = root.label;
  btn.dataset.value = root.value;
  btn.addEventListener('click', () => {
    theoryRoot = root.value;
    renderTheory();
  });
  elTheoryRoots.appendChild(btn);
});

QUALITIES.forEach((quality) => {
  const btn = document.createElement('button');
  btn.className = 'quality-btn';
  btn.textContent = quality.label;
  btn.dataset.value = quality.value;
  btn.addEventListener('click', () => {
    theoryQuality = quality.value;
    renderTheory();
  });
  elTheoryQuality.appendChild(btn);
});

renderTheory();
