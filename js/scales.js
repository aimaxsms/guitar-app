const SCALE_GROUPS = {
  'Pentatonic & Blues': [
    { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9], degrees: ['1', '2', '3', '5', '6'] },
    { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10], degrees: ['1', 'b3', '4', '5', 'b7'] },
    { name: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10], degrees: ['1', 'b3', '4', 'b5', '5', 'b7'] },
  ],
  '7-Note Scales & Modes': [
    { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ['1', '2', '3', '4', '5', '6', '7'] },
    { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10], degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
    { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
    { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'] },
    { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], degrees: ['1', '2', '3', '#4', '5', '6', '7'] },
    { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], degrees: ['1', '2', '3', '4', '5', '6', 'b7'] },
    { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'] },
  ],
};

const elScaleRoots = document.getElementById('scaleRoots');
const elScaleSelect = document.getElementById('scaleSelect');
const elScaleResult = document.getElementById('scaleResult');
const elPlayScaleBtn = document.getElementById('playScaleBtn');
const elScaleDiagram = document.getElementById('scaleDiagram');

let scaleRoot = 'C';
let scaleName = 'Major Pentatonic';

function findScaleByName(name) {
  for (const scales of Object.values(SCALE_GROUPS)) {
    const match = scales.find((s) => s.name === name);
    if (match) return match;
  }
  return SCALE_GROUPS['Pentatonic & Blues'][0];
}

function getScaleNotes(root, scale) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  return scale.intervals.map((semitones, i) => ({
    note: NOTE_NAMES[(rootIndex + semitones) % 12],
    semitones,
    degree: scale.degrees[i],
  }));
}

function renderScaleStrip(root, scale) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const scaleSemitones = new Set(scale.intervals);
  let html = '<div class="semitone-strip">';
  for (let i = 0; i < 12; i++) {
    const noteName = NOTE_NAMES[(rootIndex + i) % 12];
    let cls = 'semitone-box';
    if (i === 0) cls += ' tone-root';
    else if (scaleSemitones.has(i)) cls += ' tone-scale';
    html += `<div class="${cls}"><span class="semitone-note">${noteName}</span><span class="semitone-index">${i}</span></div>`;
  }
  html += '</div>';
  return html;
}

function renderScale() {
  const scale = findScaleByName(scaleName);
  const notes = getScaleNotes(scaleRoot, scale);

  elScaleResult.innerHTML = `
    <div class="library-title">${scaleRoot} ${scale.name}</div>
    <div class="tone-cards">
      ${notes
        .map(
          (n) => `
            <div class="tone-card">
              <div class="tone-card-note">${n.note}</div>
              <div class="tone-card-interval">${n.degree}</div>
              <div class="tone-card-semitones">${n.semitones} semitones</div>
            </div>
          `
        )
        .join('')}
    </div>
    ${renderScaleStrip(scaleRoot, scale)}
  `;

  renderScaleDiagram(elScaleDiagram, scaleRoot, scale);

  elScaleRoots.querySelectorAll('.root-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === scaleRoot);
  });
}

function playScale() {
  const scale = findScaleByName(scaleName);
  const notes = getScaleNotes(scaleRoot, scale);
  const rootIndex = NOTE_NAMES.indexOf(scaleRoot);

  notes.forEach((n, i) => {
    const octave = 4 + Math.floor((rootIndex + n.semitones) / 12);
    playPluck(noteToFreq([n.note, octave]), { delay: i * 0.3, duration: 0.5, gain: 0.25 });
  });
  playPluck(noteToFreq([scaleRoot, 5]), { delay: notes.length * 0.3, duration: 0.55, gain: 0.25 });
}

ROOTS.forEach((root) => {
  const btn = document.createElement('button');
  btn.className = 'root-btn';
  btn.textContent = root.label;
  btn.dataset.value = root.value;
  btn.addEventListener('click', () => {
    scaleRoot = root.value;
    renderScale();
  });
  elScaleRoots.appendChild(btn);
});

Object.entries(SCALE_GROUPS).forEach(([group, scales]) => {
  const optgroup = document.createElement('optgroup');
  optgroup.label = group;
  scales.forEach((scale) => {
    const option = document.createElement('option');
    option.value = scale.name;
    option.textContent = scale.name;
    optgroup.appendChild(option);
  });
  elScaleSelect.appendChild(optgroup);
});

elScaleSelect.addEventListener('change', () => {
  scaleName = elScaleSelect.value;
  renderScale();
});

elPlayScaleBtn.addEventListener('click', playScale);

renderScale();
