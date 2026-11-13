// Music Theory course: short guitar-focused lessons, each with a picture, sounds to hear and a
// quick quiz. Progress (lessons whose quiz was finished) is remembered on this device.
// Reuses NOTE_NAMES (tunings.js), getKeyChords (theory.js), buildFretboardSvg (techniques.js)
// and the plucked-string synth in audio-utils.js.

const MT_PROGRESS_KEY = 'guitarApp_theoryProgress';

// ---------- sound ----------
const mtFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// steps: [{ notes: [midi...], at: seconds }] — several notes with the same `at` are strummed.
function mtPlaySteps(steps) {
  const ctx = getSharedAudioContext();
  const go = () =>
    steps.forEach((step) =>
      step.notes.forEach((m, i) => schedulePluck(ctx, mtFreq(m), { delay: step.at + i * 0.035, gain: 0.05 }))
    );
  if (ctx.state === 'suspended') ctx.resume().then(go);
  else go();
}
const mtMelody = (notes, gap = 0.38) => notes.map((n, i) => ({ notes: [n], at: i * gap }));
const mtChords = (chords, gap = 1.1) => chords.map((c, i) => ({ notes: c, at: i * gap }));
// Arpeggio first, then the notes together.
const mtArpChord = (notes) => [...mtMelody(notes, 0.32), { notes, at: notes.length * 0.32 + 0.3 }];

// Root-position triad around the guitar's middle range, from a chord made by getKeyChords().
function mtTriadMidi(note, quality) {
  const root = 48 + NOTE_NAMES.indexOf(note);
  const third = quality === 'minor' || quality === 'diminished' ? 3 : 4;
  const fifth = quality === 'diminished' ? 6 : 7;
  return [root - 12, root, root + third, root + fifth];
}
function mtProgression(key, degrees, gap = 1.1) {
  const chords = getKeyChords(key, 'major');
  return mtChords(degrees.map((d) => mtTriadMidi(chords[d].note, chords[d].quality)), gap);
}

// ---------- small builders ----------
function mtTable(headers, rows) {
  return `<div class="mt-table-wrap"><table class="mt-table"><thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

function mtCircleOfFifths() {
  const majors = ['C', 'G', 'D', 'A', 'E', 'B', 'F#/G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
  const minors = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
  const sigs = ['none', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];
  const c = 150;
  let svg = `<svg class="mt-circle" viewBox="0 0 300 300" role="img" aria-label="Circle of fifths">`;
  svg += `<circle cx="${c}" cy="${c}" r="138" fill="#132447" stroke="#2d4880" />`;
  svg += `<circle cx="${c}" cy="${c}" r="84" fill="#172a52" stroke="#2d4880" />`;
  svg += `<circle cx="${c}" cy="${c}" r="40" fill="#0e1b36" stroke="#2d4880" />`;
  majors.forEach((m, i) => {
    const a = (i * 30 - 90) * (Math.PI / 180);
    const xo = c + Math.cos(a) * 112;
    const yo = c + Math.sin(a) * 112;
    const xi = c + Math.cos(a) * 62;
    const yi = c + Math.sin(a) * 62;
    svg += `<text x="${xo}" y="${yo + 1}" font-size="${m.length > 2 ? 12 : 16}" font-weight="800" fill="#edeae3" text-anchor="middle">${m}</text>`;
    svg += `<text x="${xo}" y="${yo + 14}" font-size="8.5" fill="#9fb0cc" text-anchor="middle">${sigs[i]}</text>`;
    svg += `<text x="${xi}" y="${yi + 4}" font-size="11" font-weight="700" fill="#7fb2ff" text-anchor="middle">${minors[i]}</text>`;
  });
  svg += `<text x="${c}" y="${c - 2}" font-size="9" fill="#9fb0cc" text-anchor="middle">clockwise</text>`;
  svg += `<text x="${c}" y="${c + 10}" font-size="9" fill="#9fb0cc" text-anchor="middle">= up a 5th</text>`;
  svg += '</svg>';
  return `<figure class="mt-figure">${svg}<figcaption>Outer ring: major keys and their sharps/flats. Inner ring: each one's relative minor.</figcaption></figure>`;
}

// Chord transposer used in the capo lesson.
const MT_FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };
function mtTransposeChord(chord, steps) {
  return chord.replace(/^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/, (m, r, acc, rest, br, bacc) => {
    const move = (letter, a) => {
      let name = letter + (a || '');
      name = MT_FLAT_TO_SHARP[name] || name;
      const i = NOTE_NAMES.indexOf(name);
      return i < 0 ? name : NOTE_NAMES[(((i + steps) % 12) + 12) % 12];
    };
    return move(r, acc) + rest + (br ? '/' + move(br, bacc) : '');
  });
}

// ---------- lessons ----------
const MT_LESSONS = [
  {
    id: 'notes',
    title: 'The Musical Alphabet',
    summary: 'The 12 notes all music is built from',
    body: [
      `Music uses only <strong>12 different notes</strong>. Seven of them have letter names: <strong>A B C D E F G</strong>. After G it starts again at A, just higher.`,
      `The other five sit between letters and are called <strong>sharps (♯)</strong> or <strong>flats (♭)</strong>. A sharp is one step higher, a flat one step lower, so the note between C and D is both C♯ and D♭. Same sound, two names.`,
      `Two pairs have <strong>no note between them</strong>: <strong>B–C</strong> and <strong>E–F</strong>. Everywhere else there's a sharp/flat in between. The full list going up: C, C♯, D, D♯, E, F, F♯, G, G♯, A, A♯, B, then C again.`,
      `On guitar, <strong>every fret is the next note</strong> in that list. Walk up the low E string and you hit every note, landing back on E at the 12th fret.`,
    ],
    visual: () =>
      buildFretboardSvg({
        label: 'Every note on the low E string, frets 1–12',
        startFret: 1,
        endFret: 12,
        numbers: [3, 5, 7, 9, 12],
        dots: ['F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'].map((n, i) => ({
          s: 5, f: i + 1, label: n, kind: n.length > 1 ? 'extra' : n === 'E' ? 'root' : undefined,
        })),
      }),
    hear: [{ label: 'Walk up the low E string (all 12 notes)', steps: () => mtMelody([40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], 0.3) }],
    quiz: [
      { q: 'How many different notes are there in music?', options: ['7', '12', '8', '24'], answer: 1, explain: '7 letter names plus 5 sharps/flats = 12.' },
      { q: 'What note is one fret above E?', options: ['E♯', 'F♯', 'F', 'D♯'], answer: 2, explain: 'There is no note between E and F, so one step up from E is F.' },
      { q: 'What is another name for C♯?', options: ['D♭', 'C♭', 'B♯', 'D♯'], answer: 0, explain: 'The note between C and D is C♯ going up, or D♭ coming down.' },
    ],
  },
  {
    id: 'fretboard',
    title: 'Finding Notes on the Neck',
    summary: 'String names, octaves and the 12th fret',
    body: [
      `The open strings from thickest to thinnest are <strong>E A D G B E</strong>. A classic way to remember it: <em>"Eddie Ate Dynamite, Good Bye Eddie"</em>.`,
      `To find any note, start from the open string's name and count up the alphabet one fret per step (remember: no note between B–C and E–F). Example: A string, fret 3 = A → A♯ → B → <strong>C</strong>.`,
      `The <strong>12th fret</strong> is the same note as the open string, one <strong>octave</strong> higher (same note, higher pitch). Everything above fret 12 repeats the pattern of frets 0–11.`,
      `Learn the natural notes (no sharps/flats) on the <strong>low E</strong> and <strong>A</strong> strings first. Those two strings are where the roots of most barre chords and scale shapes live.`,
    ],
    visual: () =>
      buildFretboardSvg({
        label: 'Natural notes on the E and A strings',
        startFret: 1,
        endFret: 12,
        numbers: [3, 5, 7, 9, 12],
        dots: [
          [5, 1, 'F'], [5, 3, 'G'], [5, 5, 'A'], [5, 7, 'B'], [5, 8, 'C'], [5, 10, 'D'], [5, 12, 'E'],
          [4, 2, 'B'], [4, 3, 'C'], [4, 5, 'D'], [4, 7, 'E'], [4, 8, 'F'], [4, 10, 'G'], [4, 12, 'A'],
        ].map(([s, f, label]) => ({ s, f, label })),
      }),
    hear: [{ label: 'Open low E, then the 12th fret (an octave)', steps: () => mtMelody([40, 52], 0.8) }],
    quiz: [
      { q: 'What are the open strings, thickest to thinnest?', options: ['E B G D A E', 'E A D G B E', 'A D G C E A', 'E A D G C E'], answer: 1, explain: 'Eddie Ate Dynamite, Good Bye Eddie.' },
      { q: 'What note is on the A string, 5th fret?', options: ['C', 'D', 'E', 'D♯'], answer: 1, explain: 'A → A♯ (1) → B (2) → C (3) → C♯ (4) → D (5).' },
      { q: 'What is at the 12th fret of any string?', options: ['A fifth higher', 'The same note as the open string, an octave higher', 'A random note', 'The note one fret below'], answer: 1, explain: '12 frets = 12 half steps = one octave.' },
    ],
  },
  {
    id: 'intervals',
    title: 'Steps & Intervals',
    summary: 'Half steps, whole steps and the distance between notes',
    body: [
      `A <strong>half step</strong> (semitone) is the smallest distance: <strong>1 fret</strong>. A <strong>whole step</strong> (tone) is <strong>2 frets</strong>.`,
      `An <strong>interval</strong> is the distance between two notes, counted in half steps. Intervals give music its emotion: a major 3rd sounds bright, a minor 3rd sounds sad, a perfect 5th sounds strong and open (that's a power chord).`,
      `You don't need all of them at once. The ones guitarists use every day are the <strong>minor 3rd (3)</strong>, <strong>major 3rd (4)</strong>, <strong>perfect 4th (5)</strong>, <strong>perfect 5th (7)</strong> and <strong>octave (12)</strong>.`,
    ],
    extra: () =>
      mtTable(
        ['Half steps', 'Interval', 'From C'],
        [
          [1, 'Minor 2nd', 'C → C♯'], [2, 'Major 2nd', 'C → D'], [3, 'Minor 3rd', 'C → E♭'],
          [4, 'Major 3rd', 'C → E'], [5, 'Perfect 4th', 'C → F'], [6, 'Tritone', 'C → F♯'],
          [7, 'Perfect 5th', 'C → G'], [8, 'Minor 6th', 'C → A♭'], [9, 'Major 6th', 'C → A'],
          [10, 'Minor 7th', 'C → B♭'], [11, 'Major 7th', 'C → B'], [12, 'Octave', 'C → C'],
        ]
      ),
    visual: () =>
      buildFretboardSvg({
        label: 'Intervals from C (A string, 3rd fret)',
        startFret: 1,
        endFret: 6,
        numbers: [3, 5],
        dots: [
          { s: 4, f: 3, label: 'C', kind: 'root' },
          { s: 3, f: 1, label: 'b3' }, { s: 3, f: 2, label: '3' }, { s: 3, f: 3, label: '4' }, { s: 3, f: 5, label: '5' },
          { s: 2, f: 5, label: 'C', kind: 'root' },
        ],
      }),
    hear: [
      { label: 'Major 3rd (C → E): bright', steps: () => mtMelody([48, 52], 0.6) },
      { label: 'Minor 3rd (C → E♭): sad', steps: () => mtMelody([48, 51], 0.6) },
      { label: 'Perfect 5th (C → G): strong', steps: () => [...mtMelody([48, 55], 0.6), { notes: [48, 55], at: 1.4 }] },
      { label: 'Octave (C → C)', steps: () => mtMelody([48, 60], 0.6) },
    ],
    quiz: [
      { q: 'How many frets is a whole step?', options: ['1', '2', '3', '4'], answer: 1, explain: 'Half step = 1 fret, whole step = 2 frets.' },
      { q: 'A perfect 5th is how many half steps?', options: ['5', '6', '7', '8'], answer: 2, explain: 'C → G is 7 half steps. Root + 5th = a power chord.' },
      { q: 'How far apart are a minor 3rd and a major 3rd?', options: ['One half step', 'One whole step', 'They are the same', 'An octave'], answer: 0, explain: 'Minor 3rd = 3 half steps, major 3rd = 4. That single fret is the whole difference between minor and major.' },
    ],
  },
  {
    id: 'major-scale',
    title: 'The Major Scale',
    summary: 'Do-re-mi and the W-W-H-W-W-W-H pattern',
    body: [
      `The <strong>major scale</strong> is the "do-re-mi" sound, and almost all of music theory is measured against it. It's 7 notes built from one pattern of steps: <strong>W W H W W W H</strong> (W = whole step, H = half step).`,
      `Start that pattern on C and you get <strong>C D E F G A B C</strong>, no sharps or flats. Start it on G and you need one sharp to make the pattern fit: <strong>G A B C D E F♯ G</strong>.`,
      `Each note gets a number, its <strong>scale degree</strong>: 1 2 3 4 5 6 7. Musicians talk in those numbers ("the 3rd", "the 5th") because they work in every key.`,
      `On guitar the pattern becomes a shape you can slide anywhere: the shape below is G major, and moved up 2 frets it becomes A major.`,
    ],
    visual: () =>
      buildFretboardSvg({
        label: 'G major scale, one octave (numbers = scale degrees)',
        startFret: 1,
        endFret: 6,
        numbers: [3, 5],
        dots: [
          { s: 5, f: 3, label: '1', kind: 'root' }, { s: 5, f: 5, label: '2' },
          { s: 4, f: 2, label: '3' }, { s: 4, f: 3, label: '4' }, { s: 4, f: 5, label: '5' },
          { s: 3, f: 2, label: '6' }, { s: 3, f: 4, label: '7' }, { s: 3, f: 5, label: '1', kind: 'root' },
        ],
      }),
    hear: [{ label: 'G major scale up and down', steps: () => mtMelody([43, 45, 47, 48, 50, 52, 54, 55, 54, 52, 50, 48, 47, 45, 43], 0.3) }],
    quiz: [
      { q: 'What is the step pattern of the major scale?', options: ['W W H W W W H', 'W H W W H W W', 'H W W W H W W', 'W W W H W W H'], answer: 0, explain: 'Whole, whole, half, whole, whole, whole, half.' },
      { q: 'What is the 4th note of C major?', options: ['E', 'F', 'G', 'D'], answer: 1, explain: 'C(1) D(2) E(3) F(4).' },
      { q: 'Which sharp does G major need?', options: ['C♯', 'F♯', 'G♯', 'None'], answer: 1, explain: 'G A B C D E F♯: the 7th note has to be raised to keep the pattern.' },
    ],
  },
  {
    id: 'keys',
    title: 'Keys & the Circle of Fifths',
    summary: 'What "the key of G" means and how keys relate',
    body: [
      `A song's <strong>key</strong> is its home note plus the scale it uses. A song "in G" uses the G major scale and feels finished when it lands on G.`,
      `Each major key has a set number of sharps or flats. The <strong>circle of fifths</strong> lays them out: start at C (none) and go clockwise, each step up a 5th adds one sharp: G (1), D (2), A (3), E (4), B (5). Counter-clockwise adds flats: F (1), B♭ (2), E♭ (3)…`,
      `Sharps always appear in this order: <strong>F♯ C♯ G♯ D♯ A♯ E♯ B♯</strong>, so D major (2 sharps) has F♯ and C♯. Keys next to each other on the circle share all but one note, which is why songs often move between neighbours.`,
      `The most guitar-friendly keys are <strong>E, A, D, G and C</strong>, the keys of the open-string chords.`,
    ],
    visual: () => mtCircleOfFifths(),
    hear: [],
    quiz: [
      { q: 'How many sharps does D major have?', options: ['1', '2', '3', '0'], answer: 1, explain: 'C (0) → G (1) → D (2): F♯ and C♯.' },
      { q: 'Moving one step clockwise on the circle…', options: ['Adds a flat', 'Adds a sharp', 'Changes to minor', 'Goes down a half step'], answer: 1, explain: 'Clockwise = up a 5th = one more sharp.' },
      { q: 'Which major key has no sharps or flats?', options: ['G', 'A', 'C', 'F'], answer: 2, explain: 'C major is all natural notes (so is its relative minor, A minor).' },
    ],
  },
  {
    id: 'triads',
    title: 'Building Chords (Triads)',
    summary: 'Root, 3rd and 5th: major, minor, diminished, augmented',
    body: [
      `A basic chord, a <strong>triad</strong>, is three notes stacked in 3rds: the <strong>root</strong>, the <strong>3rd</strong> and the <strong>5th</strong>. Big open chords just repeat those three notes on more strings.`,
      `The 3rd decides the mood. <strong>Major</strong> = root + major 3rd (4 half steps) + minor 3rd (3). <strong>Minor</strong> = root + minor 3rd (3) + major 3rd (4). Move one note a single fret and a happy chord turns sad.`,
      `Two rarer types: <strong>diminished</strong> is two minor 3rds (tense), <strong>augmented</strong> is two major 3rds (dreamy, unresolved).`,
    ],
    extra: () =>
      mtTable(
        ['Type', 'Recipe (half steps)', 'C example', 'Sound'],
        [
          ['Major', '4 + 3', 'C E G', 'Happy, stable'],
          ['Minor', '3 + 4', 'C E♭ G', 'Sad, soft'],
          ['Diminished', '3 + 3', 'C E♭ G♭', 'Tense'],
          ['Augmented', '4 + 4', 'C E G♯', 'Dreamy, unresolved'],
        ]
      ),
    hear: [
      { label: 'C major', steps: () => mtArpChord([48, 52, 55, 60]) },
      { label: 'C minor', steps: () => mtArpChord([48, 51, 55, 60]) },
      { label: 'C diminished', steps: () => mtArpChord([48, 51, 54]) },
      { label: 'C augmented', steps: () => mtArpChord([48, 52, 56]) },
    ],
    quiz: [
      { q: 'Which notes make a G major chord?', options: ['G B D', 'G B♭ D', 'G C D', 'G A B'], answer: 0, explain: 'G + 4 half steps = B, + 3 more = D.' },
      { q: 'What makes a chord minor instead of major?', options: ['A lower 5th', 'A lower (minor) 3rd', 'An added 7th', 'A different root'], answer: 1, explain: 'Only the 3rd moves, down one half step.' },
      { q: 'A diminished triad is built from…', options: ['Two major 3rds', 'Two minor 3rds', 'A 4th and a 5th', 'Root and 5th only'], answer: 1, explain: '3 + 3 half steps, e.g. C E♭ G♭.' },
    ],
  },
  {
    id: 'diatonic',
    title: 'Chords in a Key',
    summary: 'The 7 chords of every major key and Roman numerals',
    body: [
      `Build a triad on each note of a major scale using only notes from that scale and you get the key's 7 chords. The pattern is the same in every major key: <strong>Major, minor, minor, Major, Major, minor, diminished</strong>.`,
      `Musicians name them with <strong>Roman numerals</strong>: uppercase = major, lowercase = minor: <strong>I ii iii IV V vi vii°</strong>. That's how you can say "a I–IV–V song" without naming a key.`,
      `The three major chords <strong>I, IV and V</strong> carry most songs. The <strong>vi</strong> chord adds the emotional, minor colour. If you know a song's key, you already know its likely chords.`,
    ],
    extra: () =>
      mtTable(
        ['Key', 'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
        ['C', 'G', 'D', 'A', 'E'].map((k) => [`<strong>${k}</strong>`, ...getKeyChords(k, 'major').map((c) => c.name)])
      ),
    hear: [{ label: 'The 7 chords of G major in order', steps: () => mtProgression('G', [0, 1, 2, 3, 4, 5, 6, 0], 0.9) }],
    quiz: [
      { q: 'In the key of G, what is the V chord?', options: ['C', 'D', 'Em', 'Am'], answer: 1, explain: 'G(I) Am(ii) Bm(iii) C(IV) D(V).' },
      { q: 'Which chords are minor in a major key?', options: ['I, IV, V', 'ii, iii, vi', 'ii, V, vi', 'iii, IV, vii'], answer: 1, explain: 'Lowercase numerals: ii, iii and vi (vii° is diminished).' },
      { q: 'What is the vi chord in C major?', options: ['Am', 'A', 'Em', 'Dm'], answer: 0, explain: 'The 6th note of C major is A, and the vi chord is minor.' },
    ],
  },
  {
    id: 'progressions',
    title: 'Common Chord Progressions',
    summary: 'The handful of progressions behind thousands of songs',
    body: [
      `A <strong>progression</strong> is the order chords are played in. Because Roman numerals work in every key, one progression can be moved to any key.`,
      `<strong>I–V–vi–IV</strong> is the "pop" progression behind countless hits. <strong>I–IV–V</strong> is the backbone of rock, country and folk. <strong>vi–IV–I–V</strong> is the same chords started on the minor one, which sounds more emotional. <strong>ii–V–I</strong> is the core of jazz.`,
      `The <strong>12-bar blues</strong> uses only I, IV and V over 12 bars: I I I I | IV IV I I | V IV I V. Learn it in A or E and you can jam with almost anyone.`,
    ],
    extra: () => {
      const prog = [
        ['I–V–vi–IV', [0, 4, 5, 3]],
        ['I–IV–V', [0, 3, 4]],
        ['vi–IV–I–V', [5, 3, 0, 4]],
        ['ii–V–I', [1, 4, 0]],
      ];
      const inKey = (k, d) => d.map((i) => getKeyChords(k, 'major')[i].name).join(' – ');
      const table = mtTable(['Progression', 'In G', 'In C', 'In D'], prog.map(([n, d]) => [`<strong>${n}</strong>`, inKey('G', d), inKey('C', d), inKey('D', d)]));
      const blues = getKeyChords('A', 'major');
      const bars = [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4].map((i) => blues[i].note);
      return table + `<p class="mt-note"><strong>12-bar blues in A:</strong> ${bars.slice(0, 4).join(' ')} | ${bars.slice(4, 8).join(' ')} | ${bars.slice(8).join(' ')}</p>`;
    },
    hear: [
      { label: 'I–V–vi–IV in G (G D Em C)', steps: () => mtProgression('G', [0, 4, 5, 3, 0], 1.0) },
      { label: 'ii–V–I in C (Dm G C)', steps: () => mtProgression('C', [1, 4, 0], 1.2) },
    ],
    quiz: [
      { q: 'What is I–V–vi–IV in C?', options: ['C G Am F', 'C F G Am', 'C G Em F', 'C Am F G'], answer: 0, explain: 'C(I) G(V) Am(vi) F(IV).' },
      { q: 'Which chords does a basic 12-bar blues use?', options: ['I, ii, V', 'I, IV, V', 'I, vi, IV', 'ii, V, I'], answer: 1, explain: 'Only the three major chords I, IV and V.' },
      { q: 'What is ii–V–I in C?', options: ['Dm G C', 'D G C', 'Em Am C', 'Dm F C'], answer: 0, explain: 'D minor (ii), G (V), C (I).' },
    ],
  },
  {
    id: 'sevenths',
    title: 'Seventh Chords',
    summary: 'maj7, 7, m7 and friends: adding one more 3rd',
    body: [
      `Stack one more 3rd on a triad and you get a <strong>seventh chord</strong>: root, 3rd, 5th and 7th. They sound richer and are everywhere in jazz, soul, R&B and blues.`,
      `<strong>Major 7 (maj7)</strong>: major triad + major 7th, dreamy and smooth. <strong>Dominant 7 (7)</strong>: major triad + minor 7th, bluesy and wants to resolve. <strong>Minor 7 (m7)</strong>: minor triad + minor 7th, mellow. <strong>Half-diminished (m7♭5)</strong>: diminished triad + minor 7th.`,
      `In a major key the 7th chords fall out the same way every time: <strong>Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7</strong>. The V7 is the one with the strongest pull back home.`,
    ],
    extra: () =>
      mtTable(
        ['Chord', 'Formula', 'In C', 'Notes'],
        [
          ['Major 7', '1 3 5 7', 'Cmaj7', 'C E G B'],
          ['Dominant 7', '1 3 5 ♭7', 'C7', 'C E G B♭'],
          ['Minor 7', '1 ♭3 5 ♭7', 'Cm7', 'C E♭ G B♭'],
          ['Half-diminished', '1 ♭3 ♭5 ♭7', 'Cm7♭5', 'C E♭ G♭ B♭'],
          ['Diminished 7', '1 ♭3 ♭5 ♭♭7', 'Cdim7', 'C E♭ G♭ A'],
        ]
      ) + `<p class="mt-note"><strong>7th chords in C major:</strong> Cmaj7 – Dm7 – Em7 – Fmaj7 – G7 – Am7 – Bm7♭5</p>`,
    hear: [
      { label: 'Cmaj7: dreamy', steps: () => mtArpChord([48, 52, 55, 59]) },
      { label: 'C7: bluesy', steps: () => mtArpChord([48, 52, 55, 58]) },
      { label: 'Cm7: mellow', steps: () => mtArpChord([48, 51, 55, 58]) },
    ],
    quiz: [
      { q: 'Which 7th chord is built on the V of a major key?', options: ['Major 7', 'Dominant 7', 'Minor 7', 'Half-diminished'], answer: 1, explain: 'V7, e.g. G7 in the key of C.' },
      { q: 'How do Cmaj7 and C7 differ?', options: ['The 3rd', 'The 5th', 'The 7th is a half step lower in C7', 'The root'], answer: 2, explain: 'Cmaj7 has B, C7 has B♭.' },
      { q: 'What notes are in G7?', options: ['G B D F', 'G B D F♯', 'G B♭ D F', 'G B D E'], answer: 0, explain: 'G major triad (G B D) + minor 7th (F).' },
    ],
  },
  {
    id: 'minor',
    title: 'Minor Keys & the Relative Minor',
    summary: 'Natural minor and why Am and C share notes',
    body: [
      `The <strong>natural minor scale</strong> follows the pattern <strong>W H W W H W W</strong>. A minor is A B C D E F G: the same notes as C major, just starting from A.`,
      `That's the <strong>relative minor</strong>: every major key shares its notes with the minor key built on its 6th note. C ↔ Am, G ↔ Em, D ↔ Bm, A ↔ F♯m, E ↔ C♯m. Guitar shortcut: the relative minor is <strong>3 frets below</strong> the major root.`,
      `Minor-key chords: <strong>i ii° III iv v VI VII</strong>. Songs often swap the minor v for a major V (E instead of Em in A minor) because it pulls home harder; that comes from the <strong>harmonic minor</strong> scale, which raises the 7th note.`,
    ],
    extra: () =>
      mtTable(
        ['Key', 'i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
        ['A', 'E', 'B'].map((k) => [`<strong>${k}m</strong>`, ...getKeyChords(k, 'minor').map((c) => c.name)])
      ),
    hear: [
      { label: 'A natural minor scale', steps: () => mtMelody([45, 47, 48, 50, 52, 53, 55, 57], 0.32) },
      { label: 'Am – Dm – E – Am (with the major V)', steps: () => mtChords([[45, 57, 60, 64], [50, 62, 65, 69], [40, 56, 59, 64], [45, 57, 60, 64]], 1.1) },
    ],
    quiz: [
      { q: 'What is the relative minor of G major?', options: ['Gm', 'Em', 'Am', 'Bm'], answer: 1, explain: 'The 6th note of G major is E, so Em shares its notes.' },
      { q: 'How many sharps or flats does A minor have?', options: ['None', '1 sharp', '3 sharps', '1 flat'], answer: 0, explain: 'Same notes as C major.' },
      { q: 'On guitar, the relative minor root is…', options: ['3 frets above the major root', '3 frets below the major root', '5 frets above', 'The same fret'], answer: 1, explain: 'C (A string fret 3) → A (open A): 3 frets lower.' },
    ],
  },
  {
    id: 'pentatonic',
    title: 'Pentatonic & Blues Scales',
    summary: 'The 5-note scale behind most guitar solos',
    body: [
      `The <strong>minor pentatonic</strong> has just 5 notes: <strong>1 ♭3 4 5 ♭7</strong>. It's the natural minor with the two "risky" notes removed, so it's very hard to hit a wrong note with it. A minor pentatonic = A C D E G.`,
      `The box shape below (A minor, 5th fret) is the most-used shape in rock and blues. Slide it so your first finger sits on another root to change key.`,
      `Add one note, the <strong>♭5</strong> (the "blue note"), and it becomes the <strong>blues scale</strong>. Use it as a passing note, not one to hold.`,
      `Bonus: the <strong>major pentatonic</strong> uses the same notes as its relative minor pentatonic. C major pentatonic = A minor pentatonic, just centred on C.`,
    ],
    visual: () =>
      buildFretboardSvg({
        label: 'A minor pentatonic box (gray = the blues ♭5)',
        startFret: 4,
        endFret: 8,
        numbers: [5, 7],
        dots: [
          { s: 0, f: 5, kind: 'root' }, { s: 0, f: 8 },
          { s: 1, f: 5 }, { s: 1, f: 8 },
          { s: 2, f: 5 }, { s: 2, f: 7 }, { s: 2, f: 8, kind: 'extra' },
          { s: 3, f: 5 }, { s: 3, f: 7, kind: 'root' },
          { s: 4, f: 5 }, { s: 4, f: 6, kind: 'extra' }, { s: 4, f: 7 },
          { s: 5, f: 5, label: 'A', kind: 'root' }, { s: 5, f: 8 },
        ],
      }),
    hear: [
      { label: 'A minor pentatonic up', steps: () => mtMelody([45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69], 0.28) },
      { label: 'A blues scale up', steps: () => mtMelody([45, 48, 50, 51, 52, 55, 57], 0.3) },
    ],
    quiz: [
      { q: 'How many notes are in a pentatonic scale?', options: ['5', '6', '7', '8'], answer: 0, explain: 'Penta = five.' },
      { q: 'Which note turns minor pentatonic into the blues scale?', options: ['♭3', '♭5', '6', '♭2'], answer: 1, explain: 'The ♭5, e.g. E♭ in A blues.' },
      { q: 'What are the notes of A minor pentatonic?', options: ['A B C E G', 'A C D E G', 'A C D F G', 'A C E G B'], answer: 1, explain: '1 ♭3 4 5 ♭7 from A.' },
    ],
  },
  {
    id: 'rhythm',
    title: 'Rhythm & Time',
    summary: 'Beats, time signatures and counting',
    body: [
      `The <strong>beat</strong> is the pulse you tap your foot to; <strong>BPM</strong> (beats per minute) is how fast it goes. Beats are grouped into <strong>bars</strong> (measures).`,
      `The <strong>time signature</strong> says how many beats are in a bar. <strong>4/4</strong> (four beats) is by far the most common. <strong>3/4</strong> is a waltz feel (ONE two three). <strong>6/8</strong> has a rolling, swaying feel (two groups of three).`,
      `Note lengths in 4/4: <strong>whole = 4 beats, half = 2, quarter = 1, eighth = ½, sixteenth = ¼</strong>. Count eighths as "<strong>1 & 2 & 3 & 4 &</strong>" and sixteenths as "<strong>1 e & a 2 e & a</strong>".`,
      `Strumming tip: your hand goes <strong>down on the numbers and up on the "&"s</strong>, all the time, even when it doesn't hit the strings. That keeps you in time (practise it in the Strum Trainer).`,
    ],
    extra: () =>
      mtTable(
        ['Note', 'Beats in 4/4', 'Counted as'],
        [
          ['Whole', '4', '1 (2 3 4)'],
          ['Half', '2', '1 (2) 3 (4)'],
          ['Quarter', '1', '1 2 3 4'],
          ['Eighth', '½', '1 & 2 & 3 & 4 &'],
          ['Sixteenth', '¼', '1 e & a 2 e & a…'],
        ]
      ),
    hear: [
      { label: 'One bar of quarter notes, then eighth notes (90 BPM)', steps: () => [...mtMelody([45, 45, 45, 45], 0.667), ...mtMelody([45, 45, 45, 45, 45, 45, 45, 45], 0.333).map((s) => ({ ...s, at: s.at + 2.667 }))] },
      { label: '3/4 waltz feel (ONE two three)', steps: () => [0, 1, 2, 3, 4, 5].map((i) => ({ notes: i % 3 === 0 ? [40, 52] : [55], at: i * 0.5 })) },
    ],
    quiz: [
      { q: 'In 4/4, how many quarter notes fit in a bar?', options: ['2', '3', '4', '8'], answer: 2, explain: 'Four beats, each a quarter note.' },
      { q: 'How do you count eighth notes?', options: ['1 2 3 4', '1 & 2 & 3 & 4 &', '1 e & a', '1 2 3'], answer: 1, explain: 'Numbers on the beats, "&" in between.' },
      { q: 'When strumming eighths, the "&" is usually…', options: ['A down strum', 'An up strum', 'Silent', 'A bass note'], answer: 1, explain: 'Down on the numbers, up on the &s.' },
    ],
  },
  {
    id: 'modes',
    title: 'Modes (a Gentle Intro)',
    summary: 'Dorian, Mixolydian and the other "flavours" of the major scale',
    body: [
      `A <strong>mode</strong> is the major scale played from a different starting note, so the same 7 notes get a different home and a different mood. Play C major's notes from D to D and you get <strong>D Dorian</strong>.`,
      `You don't need all seven to start. The two most useful on guitar: <strong>Dorian</strong> = natural minor with a raised 6th (a jazzy, funky minor; think Santana) and <strong>Mixolydian</strong> = major with a ♭7 (the bluesy-rock major sound, perfect over 7th chords).`,
      `The <strong>Aeolian</strong> mode is just the natural minor scale from lesson 10, and <strong>Ionian</strong> is the major scale itself.`,
    ],
    extra: () =>
      mtTable(
        ['Mode', 'Starts on', 'Formula', 'Feel'],
        [
          ['Ionian', 'C', '1 2 3 4 5 6 7', 'Major, happy'],
          ['Dorian', 'D', '1 2 ♭3 4 5 6 ♭7', 'Minor but bright, funky'],
          ['Phrygian', 'E', '1 ♭2 ♭3 4 5 ♭6 ♭7', 'Dark, Spanish'],
          ['Lydian', 'F', '1 2 3 ♯4 5 6 7', 'Floating, dreamy'],
          ['Mixolydian', 'G', '1 2 3 4 5 6 ♭7', 'Bluesy major, rock'],
          ['Aeolian', 'A', '1 2 ♭3 4 5 ♭6 ♭7', 'Natural minor, sad'],
          ['Locrian', 'B', '1 ♭2 ♭3 4 ♭5 ♭6 ♭7', 'Unstable, rare'],
        ]
      ) + `<p class="mt-note">All seven use only the notes of C major. Try them in the Scales tab.</p>`,
    hear: [
      { label: 'D Dorian (natural 6th)', steps: () => mtMelody([50, 52, 53, 55, 57, 59, 60, 62], 0.3) },
      { label: 'D natural minor (♭6) for comparison', steps: () => mtMelody([50, 52, 53, 55, 57, 58, 60, 62], 0.3) },
      { label: 'G Mixolydian (♭7)', steps: () => mtMelody([43, 45, 47, 48, 50, 52, 53, 55], 0.3) },
    ],
    quiz: [
      { q: 'How does Mixolydian differ from the major scale?', options: ['Flat 3rd', 'Flat 7th', 'Sharp 4th', 'Flat 6th'], answer: 1, explain: 'Major with a ♭7, the dominant 7th sound.' },
      { q: 'D Dorian uses the notes of which major scale?', options: ['D major', 'C major', 'G major', 'F major'], answer: 1, explain: 'D Dorian = C major played from D.' },
      { q: 'Which mode is the same as the natural minor scale?', options: ['Dorian', 'Phrygian', 'Aeolian', 'Locrian'], answer: 2, explain: 'Aeolian, the 6th mode (A in C major).' },
    ],
  },
  {
    id: 'capo',
    title: 'Capo & Transposing',
    summary: 'Change key without learning new shapes',
    body: [
      `<strong>Transposing</strong> means moving a song to another key by shifting every chord by the same number of half steps. G C D Em up 2 half steps becomes A D E F♯m.`,
      `A <strong>capo</strong> does it for you: each fret raises everything one half step while you keep playing the same easy shapes. G shapes with a capo on fret 2 sound in A. (Wonderwall is played with Em7–G–D–A shapes and a capo on 2.)`,
      `Two uses: play a song in its original key with easy open shapes, or move a song up or down to fit your voice. To find the real key: <strong>shape key + capo fret = actual key</strong>.`,
    ],
    interactive: 'transposer',
    hear: [],
    quiz: [
      { q: 'You play G shapes with a capo on fret 3. What key does it sound in?', options: ['A', 'A♯/B♭', 'B', 'C'], answer: 1, explain: 'G → G♯ (1) → A (2) → A♯/B♭ (3).' },
      { q: 'Transpose C – G – Am – F up 2 half steps.', options: ['D – A – Bm – G', 'D – A – B – G', 'E – B – C♯m – A', 'C♯ – G♯ – A♯m – F♯'], answer: 0, explain: 'Every chord moves 2 frets and keeps its type.' },
      { q: 'Why use a capo?', options: ['To tune the guitar', 'To keep easy shapes in a different key', 'To make chords minor', 'To mute strings'], answer: 1, explain: 'Same shapes, new key.' },
    ],
  },
];

// ---------- progress ----------
function mtGetProgress() {
  try { return JSON.parse(localStorage.getItem(MT_PROGRESS_KEY)) || {}; } catch (err) { return {}; }
}
function mtMarkDone(id) {
  const p = mtGetProgress();
  p[id] = true;
  try { localStorage.setItem(MT_PROGRESS_KEY, JSON.stringify(p)); } catch (err) { /* not remembered */ }
}

// ---------- rendering ----------
const elMtProgress = document.getElementById('mtProgress');
const elMtList = document.getElementById('mtList');
const elMtLesson = document.getElementById('mtLesson');

function mtRenderList() {
  const done = mtGetProgress();
  const count = MT_LESSONS.filter((l) => done[l.id]).length;
  elMtProgress.innerHTML = `
    <div class="mt-progress-text">${count} of ${MT_LESSONS.length} lessons complete</div>
    <div class="mt-progress-bar"><div style="width:${(count / MT_LESSONS.length) * 100}%"></div></div>`;
  elMtList.innerHTML = MT_LESSONS.map(
    (l, i) => `
      <button type="button" class="mt-list-item${done[l.id] ? ' done' : ''}" data-index="${i}">
        <span class="mt-list-num">${done[l.id] ? '✓' : i + 1}</span>
        <span class="mt-list-text"><strong>${l.title}</strong><span>${l.summary}</span></span>
      </button>`
  ).join('');
  elMtList.querySelectorAll('.mt-list-item').forEach((b) => b.addEventListener('click', () => mtOpenLesson(Number(b.dataset.index))));
  elMtProgress.style.display = '';
  elMtList.style.display = '';
  elMtLesson.style.display = 'none';
}

function mtTransposerHtml() {
  const opts = Array.from({ length: 23 }, (_, i) => i - 11)
    .map((n) => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n > 0 ? '+' + n : n} half step${Math.abs(n) === 1 ? '' : 's'}</option>`)
    .join('');
  return `
    <div class="mt-transposer">
      <div class="mt-transposer-title">Try it: transpose a progression</div>
      <input id="mtTransposeInput" class="song-finder-input" value="G C D Em" aria-label="Chords to transpose" />
      <select id="mtTransposeSteps" class="voice-lang-select" aria-label="How far to move">${opts}</select>
      <div id="mtTransposeOut" class="mt-transposer-out"></div>
    </div>`;
}

function mtWireTransposer() {
  const input = document.getElementById('mtTransposeInput');
  const steps = document.getElementById('mtTransposeSteps');
  const out = document.getElementById('mtTransposeOut');
  const update = () => {
    const n = Number(steps.value);
    const chords = input.value.split(/[\s,–-]+/).filter(Boolean);
    out.textContent = chords.length ? chords.map((c) => mtTransposeChord(c, n)).join('  ') : '';
  };
  input.addEventListener('input', update);
  steps.addEventListener('change', update);
  update();
}

function mtOpenLesson(index) {
  const lesson = MT_LESSONS[index];
  const done = mtGetProgress();
  elMtProgress.style.display = 'none';
  elMtList.style.display = 'none';
  elMtLesson.style.display = '';

  const hear = lesson.hear.length
    ? `<div class="mt-hear"><div class="mt-hear-title">🔊 Hear it</div>${lesson.hear
        .map((h, i) => `<button type="button" class="mt-hear-btn" data-hear="${i}">▶ ${h.label}</button>`)
        .join('')}</div>`
    : '';

  const quiz = lesson.quiz
    .map(
      (q, qi) => `
      <div class="mt-quiz-q" data-q="${qi}">
        <div class="mt-quiz-question">${qi + 1}. ${q.q}</div>
        <div class="mt-quiz-options">${q.options
          .map((o, oi) => `<button type="button" class="mt-quiz-opt" data-opt="${oi}">${o}</button>`)
          .join('')}</div>
        <div class="mt-quiz-feedback"></div>
      </div>`
    )
    .join('');

  elMtLesson.innerHTML = `
    <button type="button" class="mt-back">← All lessons</button>
    <div class="mt-lesson-num">Lesson ${index + 1} of ${MT_LESSONS.length}${done[lesson.id] ? ' · ✓ complete' : ''}</div>
    <h2 class="mt-lesson-title">${lesson.title}</h2>
    ${lesson.body.map((p) => `<p class="mt-p">${p}</p>`).join('')}
    ${lesson.visual ? lesson.visual() : ''}
    ${lesson.extra ? lesson.extra() : ''}
    ${lesson.interactive === 'transposer' ? mtTransposerHtml() : ''}
    ${hear}
    <div class="mt-quiz">
      <div class="mt-quiz-title">Quick check</div>
      ${quiz}
      <div class="mt-quiz-done" style="display:none;">✓ Lesson complete!</div>
    </div>
    <div class="mt-nav">
      ${index > 0 ? `<button type="button" class="start-btn secondary-btn mt-prev">← ${MT_LESSONS[index - 1].title}</button>` : '<span></span>'}
      ${index < MT_LESSONS.length - 1 ? `<button type="button" class="start-btn mt-next">Next: ${MT_LESSONS[index + 1].title} →</button>` : ''}
    </div>`;

  elMtLesson.querySelector('.mt-back').addEventListener('click', () => { mtRenderList(); mtScrollTop(); });
  const prev = elMtLesson.querySelector('.mt-prev');
  if (prev) prev.addEventListener('click', () => { mtOpenLesson(index - 1); mtScrollTop(); });
  const next = elMtLesson.querySelector('.mt-next');
  if (next) next.addEventListener('click', () => { mtOpenLesson(index + 1); mtScrollTop(); });
  elMtLesson.querySelectorAll('.mt-hear-btn').forEach((b) =>
    b.addEventListener('click', () => mtPlaySteps(lesson.hear[Number(b.dataset.hear)].steps()))
  );
  if (lesson.interactive === 'transposer') mtWireTransposer();

  const solved = new Set();
  elMtLesson.querySelectorAll('.mt-quiz-q').forEach((qEl) => {
    const qi = Number(qEl.dataset.q);
    const q = lesson.quiz[qi];
    const feedback = qEl.querySelector('.mt-quiz-feedback');
    qEl.querySelectorAll('.mt-quiz-opt').forEach((opt) =>
      opt.addEventListener('click', () => {
        const oi = Number(opt.dataset.opt);
        if (oi === q.answer) {
          opt.classList.add('correct');
          qEl.querySelectorAll('.mt-quiz-opt').forEach((o) => (o.disabled = true));
          feedback.textContent = `Correct! ${q.explain}`;
          feedback.className = 'mt-quiz-feedback good';
          solved.add(qi);
          if (solved.size === lesson.quiz.length) {
            mtMarkDone(lesson.id);
            elMtLesson.querySelector('.mt-quiz-done').style.display = '';
          }
        } else {
          opt.classList.add('wrong');
          opt.disabled = true;
          feedback.textContent = 'Not quite, try another answer.';
          feedback.className = 'mt-quiz-feedback bad';
        }
      })
    );
  });
}

function mtScrollTop() {
  const panel = document.getElementById('tab-musictheory');
  if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

mtRenderList();
