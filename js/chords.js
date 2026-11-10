const CHORDS = [
  { name: 'E major', notes: [['E', 2], ['B', 2], ['E', 3], ['G#', 3], ['B', 3], ['E', 4]] },
  { name: 'A major', notes: [['A', 2], ['E', 3], ['A', 3], ['C#', 4], ['E', 4]] },
  { name: 'D major', notes: [['D', 3], ['A', 3], ['D', 4], ['F#', 4]] },
  { name: 'G major', notes: [['G', 2], ['B', 2], ['D', 3], ['G', 3], ['B', 3], ['G', 4]] },
  { name: 'C major', notes: [['C', 3], ['E', 3], ['G', 3], ['C', 4], ['E', 4]] },
  { name: 'E minor', notes: [['E', 2], ['B', 2], ['E', 3], ['G', 3], ['B', 3], ['E', 4]] },
  { name: 'A minor', notes: [['A', 2], ['E', 3], ['A', 3], ['C', 4], ['E', 4]] },
  { name: 'D minor', notes: [['D', 3], ['A', 3], ['D', 4], ['F', 4]] },
];

const elChordStatus = document.getElementById('chordStatus');
const elPlayChordBtn = document.getElementById('playChordBtn');
const elChordChoices = document.getElementById('chordChoices');
const elChordScore = document.getElementById('chordScore');
const elNextChordBtn = document.getElementById('nextChordBtn');

let currentChord = null;
let correctCount = 0;
let totalCount = 0;
let answered = false;

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoiceOptions(correctChord) {
  const pool = CHORDS.filter((c) => c.name !== correctChord.name);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correctChord, ...distractors]);
}

function renderChoices() {
  elChordChoices.innerHTML = '';
  buildChoiceOptions(currentChord).forEach((chord) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = chord.name;
    btn.addEventListener('click', () => handleGuess(chord, btn));
    elChordChoices.appendChild(btn);
  });
}

function pickChord() {
  let next;
  do {
    next = CHORDS[Math.floor(Math.random() * CHORDS.length)];
  } while (currentChord && next.name === currentChord.name);
  currentChord = next;
  answered = false;
  elNextChordBtn.style.display = 'none';
  elChordStatus.textContent = 'Press Play to hear the chord';
  renderChoices();
}

function strumChord(chord) {
  chord.notes.forEach(([name, octave], i) => {
    const freq = noteToFreq([name, octave]);
    playPluck(freq, { delay: i * 0.05, duration: 1.8, gain: 0.15 });
  });
}

function handleGuess(chord, btn) {
  if (answered) return;
  answered = true;
  totalCount++;
  if (chord.name === currentChord.name) correctCount++;

  elChordChoices.querySelectorAll('.choice-btn').forEach((b) => {
    if (b.textContent === currentChord.name) b.classList.add('correct');
    else if (b === btn) b.classList.add('incorrect');
    b.disabled = true;
  });

  elChordStatus.textContent = chord.name === currentChord.name ? 'Correct!' : `That was ${currentChord.name}`;
  elChordScore.textContent = `${correctCount} / ${totalCount}`;
  elNextChordBtn.style.display = '';
}

elPlayChordBtn.addEventListener('click', () => {
  if (!currentChord) pickChord();
  strumChord(currentChord);
});

elNextChordBtn.addEventListener('click', pickChord);

pickChord();
