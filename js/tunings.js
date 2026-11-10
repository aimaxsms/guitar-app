const SEMITONES_FROM_A = {
  C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4,
  'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToFreq([name, octave]) {
  const semitones = SEMITONES_FROM_A[name] + (octave - 4) * 12;
  return 440 * Math.pow(2, semitones / 12);
}

const STANDARD_STRING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E'];

function fretToNoteName(stringIndex, fret) {
  const openIndex = NOTE_NAMES.indexOf(STANDARD_STRING_NOTES[stringIndex]);
  return NOTE_NAMES[(openIndex + fret) % 12];
}

const TUNINGS = {
  Standard: [
    { name: 'Standard E', strings: [['E', 2], ['A', 2], ['D', 3], ['G', 3], ['B', 3], ['E', 4]] },
    { name: 'Half Step Down (Eb)', strings: [['D#', 2], ['G#', 2], ['C#', 3], ['F#', 3], ['A#', 3], ['D#', 4]] },
    { name: 'Full Step Down (D)', strings: [['D', 2], ['G', 2], ['C', 3], ['F', 3], ['A', 3], ['D', 4]] },
    { name: 'Drop D', strings: [['D', 2], ['A', 2], ['D', 3], ['G', 3], ['B', 3], ['E', 4]] },
    { name: 'Drop C', strings: [['C', 2], ['G', 2], ['C', 3], ['F', 3], ['A', 3], ['D', 4]] },
    { name: 'Drop B', strings: [['B', 1], ['F#', 2], ['B', 2], ['E', 3], ['G#', 3], ['C#', 4]] },
  ],
  'Open Tunings': [
    { name: 'Open G', strings: [['D', 2], ['G', 2], ['D', 3], ['G', 3], ['B', 3], ['D', 4]] },
    { name: 'Open D', strings: [['D', 2], ['A', 2], ['D', 3], ['F#', 3], ['A', 3], ['D', 4]] },
    { name: 'Open C', strings: [['C', 2], ['G', 2], ['C', 3], ['G', 3], ['C', 4], ['E', 4]] },
    { name: 'Open E', strings: [['E', 2], ['B', 2], ['E', 3], ['G#', 3], ['B', 3], ['E', 4]] },
    { name: 'Open A', strings: [['E', 2], ['A', 2], ['E', 3], ['A', 3], ['C#', 4], ['E', 4]] },
  ],
  Other: [
    { name: 'DADGAD', strings: [['D', 2], ['A', 2], ['D', 3], ['G', 3], ['A', 3], ['D', 4]] },
  ],
};
