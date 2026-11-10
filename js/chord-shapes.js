const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };

const MAJOR_SHAPES = [
  { name: 'E-shape', root: 'E', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { name: 'A-shape', root: 'A', frets: ['x', 0, 2, 2, 2, 0], fingers: ['x', 0, 1, 2, 3, 0] },
  { name: 'D-shape', root: 'D', frets: ['x', 'x', 0, 2, 3, 2], fingers: ['x', 'x', 0, 1, 3, 2] },
  { name: 'C-shape', root: 'C', frets: ['x', 3, 2, 0, 1, 0], fingers: ['x', 3, 2, 0, 1, 0] },
  { name: 'G-shape', root: 'G', frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] },
];

const MINOR_SHAPES = [
  { name: 'Em-shape', root: 'E', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { name: 'Am-shape', root: 'A', frets: ['x', 0, 2, 2, 1, 0], fingers: ['x', 0, 2, 3, 1, 0] },
  { name: 'Dm-shape', root: 'D', frets: ['x', 'x', 0, 2, 3, 1], fingers: ['x', 'x', 0, 2, 3, 1] },
];

function parseChordName(label) {
  const match = label.trim().match(/^([A-G])([b#]?)(.*)$/);
  if (!match) return null;
  let [, letter, accidental, suffix] = match;
  let root = letter + accidental;
  if (FLAT_TO_SHARP[root]) root = FLAT_TO_SHARP[root];
  if (!(root in SEMITONES_FROM_A)) return null;
  const isMinor = /^m(?!aj)/i.test(suffix);
  return { root, quality: isMinor ? 'minor' : 'major', suffix };
}

function computeBarreFingers(frets, startFret) {
  const fingers = frets.map((f) => (f === 'x' ? 'x' : null));
  const barreIndexes = [];
  const others = [];

  frets.forEach((f, i) => {
    if (f === 'x') return;
    if (f - startFret === 0) barreIndexes.push(i);
    else others.push({ index: i, relative: f - startFret });
  });

  barreIndexes.forEach((i) => {
    fingers[i] = 1;
  });

  others.sort((a, b) => a.relative - b.relative || a.index - b.index);
  others.forEach((item, idx) => {
    fingers[item.index] = idx + 2;
  });

  return fingers;
}

function getChordPositions(root, quality) {
  const shapes = quality === 'minor' ? MINOR_SHAPES : MAJOR_SHAPES;
  const targetSemitone = SEMITONES_FROM_A[root];
  return shapes
    .map((shape) => {
      const diff = targetSemitone - SEMITONES_FROM_A[shape.root];
      const startFret = ((diff % 12) + 12) % 12;
      const frets = shape.frets.map((f) => (f === 'x' ? 'x' : f + startFret));
      const fingers = startFret === 0 ? shape.fingers : computeBarreFingers(frets, startFret);
      return { shapeName: shape.name, startFret, frets, fingers };
    })
    .sort((a, b) => a.startFret - b.startFret);
}
