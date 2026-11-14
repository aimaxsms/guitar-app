const SONGS = [
  {
    title: 'Practice Progression 1 (G - D - Em - C)',
    artist: 'You (demo)',
    key: 'G',
    capo: 0,
    tuning: 'Standard E',
    lines: [
      '[G]Walking down the road today',
      '[D]Nothing but blue skies and [Em]open fields',
      '[C]Taking it slow, [G]taking it easy',
      '[G]Counting the miles as they [D]pass me by',
      '[Em]Thinking of nothing, just [C]watching the [G]sky',
    ],
    tabs: [],
  },
  {
    title: 'Practice Progression 2 (Am - F - C - G)',
    artist: 'You (demo)',
    key: 'Am',
    capo: 0,
    tuning: 'Standard E',
    lines: [
      '[Am]Morning light comes through the [F]window',
      '[C]Coffee going cold on the [G]table',
      '[Am]One more verse before I [F]go',
      '[C]Out into the day, [G]ready or not',
    ],
    tabs: [],
  },
  {
    title: 'Practice Riff Demo (with tab)',
    artist: 'You (demo)',
    key: 'G',
    capo: 0,
    tuning: 'Standard E',
    lines: [
      '[G]Just a placeholder riff to show the tab view',
      '[C]Swap this out for your own [D]transcriptions',
    ],
    tabs: [
      {
        label: 'Intro',
        tab:
          'e|---------------0-2-3---|\n' +
          'B|-----------0-3----------|\n' +
          'G|-------0-2---------------|\n' +
          'D|---0-2--------------------|\n' +
          'A|-3-------------------------|\n' +
          'E|----------------------------|',
      },
      {
        label: 'Verse',
        tab:
          'e|--0-----0-----0-----0--|\n' +
          'B|----1-----1-----0-----0|\n' +
          'G|------0-----0-----0-----|\n' +
          'D|-------------------------|\n' +
          'A|-------------------------|\n' +
          'E|-------------------------|',
      },
    ],
  },
];

const elSheetSelect = document.getElementById('sheetSelect');
const elSongMeta = document.getElementById('songMeta');
const elSheetContent = document.getElementById('sheetContent');
const elTabContent = document.getElementById('tabContent');
const elLyricsViewBtn = document.getElementById('lyricsViewBtn');
const elTabViewBtn = document.getElementById('tabViewBtn');
const elChordPanel = document.getElementById('chordPanel');
const elChordPanelTitle = document.getElementById('chordPanelTitle');
const elChordPanelDiagrams = document.getElementById('chordPanelDiagrams');
const elChordPanelClose = document.getElementById('chordPanelClose');

let viewMode = 'lyrics';
let currentSongKey = null;

function parseSheetLine(line) {
  const segments = [];
  const re = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(line))) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    segments.push({ type: 'chord', value: match[1] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < line.length) segments.push({ type: 'text', value: line.slice(lastIndex) });
  return segments;
}

function getSongByKey(key) {
  if (key.startsWith('built-')) {
    return SONGS[Number(key.slice('built-'.length))];
  }
  return getMySongs().find((s) => s.id === key) || null;
}

function isPersonalKey(key) {
  return key.startsWith('my-');
}

// ---------- Capo view: show the chart for any capo position (or none) ----------
// A chart's chords are shapes played with its original capo (song.capo). Viewing it with a
// different capo moves every chord by the difference, so the song still sounds the same.
const CAPO_VIEW_KEY = 'guitarApp_capoView';
const SHEET_FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };

function transposeChordName(chord, steps) {
  if (!steps) return chord;
  const move = (note) => {
    const name = SHEET_FLAT_TO_SHARP[note] || note;
    const i = NOTE_NAMES.indexOf(name);
    return i < 0 ? note : NOTE_NAMES[(((i + steps) % 12) + 12) % 12];
  };
  const m = chord.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  if (!m) return chord;
  return move(m[1]) + m[2] + (m[3] ? '/' + move(m[3]) : '');
}

function getCapoViews() {
  try { return JSON.parse(localStorage.getItem(CAPO_VIEW_KEY)) || {}; } catch (err) { return {}; }
}
function capoViewFor(song) {
  const saved = getCapoViews()[currentSongKey];
  return Number.isInteger(saved) ? saved : Number(song.capo) || 0;
}
function setCapoView(capo) {
  const views = getCapoViews();
  views[currentSongKey] = capo;
  try { localStorage.setItem(CAPO_VIEW_KEY, JSON.stringify(views)); } catch (err) { /* not remembered */ }
}
// Chord as it should be shown for the chosen capo.
function displayChord(song, chord) {
  return transposeChordName(chord, (Number(song.capo) || 0) - capoViewFor(song));
}

function renderCapoControl(song) {
  const original = Number(song.capo) || 0;
  const view = capoViewFor(song);
  const wrap = document.createElement('label');
  wrap.className = 'capo-control';
  const text = document.createElement('span');
  text.textContent = 'Capo';
  const select = document.createElement('select');
  select.className = 'capo-select';
  for (let c = 0; c <= 9; c++) {
    const opt = document.createElement('option');
    opt.value = String(c);
    opt.textContent = (c === 0 ? 'No capo' : `Fret ${c}`) + (c === original ? ' (original)' : '');
    select.appendChild(opt);
  }
  select.value = String(view);
  select.addEventListener('change', () => {
    setCapoView(Number(select.value));
    renderSong(song);
  });
  wrap.appendChild(text);
  wrap.appendChild(select);
  return wrap;
}

function keyText(song) {
  const key = song.key && song.key !== '?' ? song.key : null;
  if (!key) return 'Key: ?';
  const view = capoViewFor(song);
  // song.key is the key the song sounds in; with a capo the shapes are lower by the capo amount.
  return view ? `Key: ${key} (shapes in ${transposeChordName(key, -view)})` : `Key: ${key}`;
}

function renderMeta(song) {
  const capoText = song.capo ? `Original capo: fret ${song.capo}` : 'Written without capo';
  const parts = [keyText(song), capoText, `Tuning: ${song.tuning}`];
  if (song.strumPattern) parts.push(`Strum: ${song.strumPattern}`);
  if (song.artist) parts.unshift(song.artist);
  elSongMeta.innerHTML = '';
  const metaText = document.createElement('span');
  metaText.textContent = parts.join('  •  ');
  elSongMeta.appendChild(metaText);
  elSongMeta.appendChild(renderCapoControl(song));

  if (isPersonalKey(currentSongKey)) {
    const renameBtn = document.createElement('button');
    renameBtn.className = 'song-meta-btn';
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', renameCurrentSong);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'song-meta-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', deleteCurrentSong);

    elSongMeta.appendChild(renameBtn);
    elSongMeta.appendChild(deleteBtn);
  }
}

function renameCurrentSong() {
  const song = getSongByKey(currentSongKey);
  if (!song) return;
  const newTitle = prompt('Rename song:', song.title);
  if (newTitle === null || !newTitle.trim()) return;
  updateMySong(song.id, { title: newTitle.trim() });
  refreshSheetSongOptions(currentSongKey);
}

function deleteCurrentSong() {
  const song = getSongByKey(currentSongKey);
  if (!song) return;
  if (!confirm(`Delete "${song.title}" from My Songs? This can't be undone.`)) return;
  deleteMySong(song.id);
  refreshSheetSongOptions();
}

function makeChordTag(name) {
  const btn = document.createElement('button');
  btn.className = 'chord-tag';
  btn.textContent = name;
  btn.addEventListener('click', () => openChordPanel(name));
  return btn;
}

// Splits "[G]Today is gon[D]na be" into tokens of { chord, text } where text is at most one word
// (plus a flag for whether a space follows), so lines can wrap between words and a chord that
// lands mid-word ("af[D]ternoon") keeps the word together.
function lineToTokens(line) {
  const tokens = [];
  let pendingChord = null;
  parseSheetLine(line).forEach((seg) => {
    if (seg.type === 'chord') {
      if (pendingChord) tokens.push({ chord: pendingChord, text: '', space: true });
      pendingChord = seg.value;
      return;
    }
    const parts = seg.value.split(/(\s+)/);
    parts.forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        if (pendingChord) { tokens.push({ chord: pendingChord, text: '', space: true }); pendingChord = null; }
        else if (tokens.length) tokens[tokens.length - 1].space = true;
        return;
      }
      tokens.push({ chord: pendingChord, text: part, space: false });
      pendingChord = null;
    });
  });
  if (pendingChord) tokens.push({ chord: pendingChord, text: '', space: true });
  return tokens;
}

function renderSheet(song) {
  elSheetContent.innerHTML = '';
  song.lines.forEach((line) => {
    const lineEl = document.createElement('div');
    const tokens = lineToTokens(line);
    const hasChord = tokens.some((t) => t.chord);
    const hasText = tokens.some((t) => t.text);

    if (!hasChord) {
      // Plain lyric or label line.
      lineEl.className = 'sheet-line sheet-text-line';
      lineEl.textContent = line.trim() ? line.trim() : '';
      if (!line.trim()) lineEl.classList.add('sheet-blank');
    } else if (!hasText) {
      // Chords only (intro, instrumental): a tidy row instead of wide gaps.
      lineEl.className = 'sheet-line sheet-chord-row';
      tokens.forEach((t) => lineEl.appendChild(makeChordTag(displayChord(song, t.chord))));
    } else {
      // Chords above the words.
      lineEl.className = 'sheet-line sheet-lyric-line';
      let group = null;
      tokens.forEach((t, i) => {
        if (!group) {
          group = document.createElement('span');
          group.className = 'sheet-word';
        }
        const chunk = document.createElement('span');
        // Mid-word piece ("af" in af|ternoon): a faint dash fills any gap the chord above leaves.
        const midWord = !t.space && i < tokens.length - 1 && t.text;
        chunk.className = 'sheet-chunk' + (midWord ? ' mid-word' : '');
        const top = document.createElement('span');
        top.className = 'sheet-chunk-chord';
        if (t.chord) top.appendChild(makeChordTag(displayChord(song, t.chord)));
        const bottom = document.createElement('span');
        bottom.className = 'sheet-chunk-text';
        bottom.textContent = t.text || '\u00a0';
        chunk.appendChild(top);
        chunk.appendChild(bottom);
        group.appendChild(chunk);
        // A word ends at a space (or the end of the line); only then may the line wrap.
        if (t.space || i === tokens.length - 1) {
          lineEl.appendChild(group);
          group = null;
        }
      });
    }
    elSheetContent.appendChild(lineEl);
  });
}

// ---------- Readable tab rendering ----------
// Text tab is re-flowed bar by bar to fit the screen (no sideways scrolling), string names are
// repeated on every line, fret numbers are bold and bright, and the dashes fade into the background.

const STAFF_LINE_RE = /^\s*([A-Ga-g][#b]?)\s*\|/;
const LYRIC_LINE_RE = /^\s*♪\s*\|/;
let tabCharWidth = 0;

function measureTabCharWidth() {
  const probe = document.createElement('span');
  probe.className = 'tabx-row';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.textContent = '-'.repeat(40);
  elTabContent.appendChild(probe);
  const w = probe.getBoundingClientRect().width / 40;
  probe.remove();
  return w || 9;
}

// Splits a tab section's text into plain-text paragraphs and staff blocks (aligned rows).
function parseTabText(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const parts = [];
  let i = 0;
  while (i < lines.length) {
    if (STAFF_LINE_RE.test(lines[i])) {
      const staff = [];
      while (i < lines.length && STAFF_LINE_RE.test(lines[i])) staff.push(lines[i++]);
      // A short line right above the staff (chord names, PM) belongs to it, column-aligned.
      let annot = null;
      const prev = parts[parts.length - 1];
      if (prev && prev.type === 'text' && prev.lines.length && prev.lines[prev.lines.length - 1].trim()) {
        annot = prev.lines.pop();
        if (!prev.lines.length) parts.pop();
      }
      // A "♪|" row right under the staff holds the lyrics, lined up with the notes.
      let lyrics = null;
      if (i < lines.length && LYRIC_LINE_RE.test(lines[i])) lyrics = lines[i++];
      parts.push({ type: 'staff', staff, annot, lyrics });
    } else {
      const prev = parts[parts.length - 1];
      if (prev && prev.type === 'text') prev.lines.push(lines[i]);
      else parts.push({ type: 'text', lines: [lines[i]] });
      i++;
    }
  }
  return parts;
}

// Breaks a staff block into bars: [{ annot: '...', rows: ['---3--', ...] }]
function staffToBars(block) {
  const firstBar = block.staff.map((l) => l.indexOf('|'));
  const labels = block.staff.map((l, s) => l.slice(0, firstBar[s]).trim());
  const bodies = block.staff.map((l, s) => l.slice(firstBar[s] + 1));
  const annotBody = block.annot ? block.annot.slice(firstBar[0] + 1) : '';
  const lyricBody = block.lyrics ? block.lyrics.slice(block.lyrics.indexOf('|') + 1) : '';
  const ref = bodies[0];
  const cuts = [];
  for (let c = 0; c < ref.length; c++) if (ref[c] === '|') cuts.push(c);
  if (!cuts.length || cuts[cuts.length - 1] < ref.length - 1) cuts.push(ref.length);
  const bars = [];
  let start = 0;
  cuts.forEach((cut) => {
    if (cut > start) {
      bars.push({
        annot: annotBody.slice(start, cut),
        lyrics: lyricBody.slice(start, cut),
        rows: bodies.map((b) => b.slice(start, cut).replace(/\|/g, '-')),
      });
    }
    start = cut + 1;
  });
  return { labels, bars };
}

// A bar wider than the screen gets cut where every string is empty (and, if possible, between
// words), so no note or syllable is split.
function splitWideBar(bar, maxLen) {
  const out = [];
  let rest = bar;
  const free = (c, needLyricGap) =>
    rest.rows.every((r) => r[c] === '-' || r[c] === undefined || r[c] === ' ') &&
    (!needLyricGap || !rest.lyrics[c] || rest.lyrics[c] === ' ');
  const slice = (b, from, to) => ({
    annot: b.annot.slice(from, to),
    lyrics: (b.lyrics || '').slice(from, to),
    rows: b.rows.map((r) => r.slice(from, to)),
  });
  while (rest.rows[0].length > maxLen) {
    let cut = maxLen;
    while (cut > maxLen / 2 && !free(cut, true)) cut--;
    if (cut <= maxLen / 2) {
      cut = maxLen;
      while (cut > maxLen / 2 && !free(cut, false)) cut--;
      if (cut <= maxLen / 2) cut = maxLen;
    }
    out.push(slice(rest, 0, cut));
    rest = slice(rest, cut);
  }
  out.push(rest);
  return out;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function colorizeTabRow(row) {
  return escapeHtml(row).replace(/(-+)|(\d+)|(&lt;|&gt;|[hpbr\/\\~x()*^.=s]+)/g, (m, dash, num, tech) => {
    if (dash) return `<span class="tabx-d">${dash}</span>`;
    if (num) return `<b class="tabx-n">${num}</b>`;
    return `<i class="tabx-t">${tech}</i>`;
  });
}

function renderStaffBlock(container, block, capacity) {
  const { labels, bars } = staffToBars(block);
  const labelW = Math.max(1, ...labels.map((l) => l.length));
  const room = Math.max(12, capacity - labelW - 2);
  const pieces = [];
  bars.forEach((bar) => pieces.push(...splitWideBar(bar, room - 1)));

  // Greedily pack bars into lines that fit the screen.
  const systems = [];
  let line = [];
  let used = 0;
  pieces.forEach((p) => {
    const w = p.rows[0].length + 1;
    if (line.length && used + w > room) {
      systems.push(line);
      line = [];
      used = 0;
    }
    line.push(p);
    used += w;
  });
  if (line.length) systems.push(line);

  systems.forEach((sys) => {
    const el = document.createElement('div');
    el.className = 'tabx-system';
    const annot = sys.map((p) => p.annot.padEnd(p.rows[0].length, ' ') + ' ').join('');
    if (annot.trim()) {
      const a = document.createElement('div');
      a.className = 'tabx-row tabx-annot';
      a.textContent = ' '.repeat(labelW + 1) + annot.replace(/\s+$/, '');
      el.appendChild(a);
    }
    labels.forEach((label, s) => {
      const r = document.createElement('div');
      r.className = 'tabx-row';
      const body = sys.map((p) => colorizeTabRow(p.rows[s] || '')).join('<span class="tabx-bar">|</span>');
      r.innerHTML =
        `<span class="tabx-label">${escapeHtml(label.padEnd(labelW, ' '))}</span>` +
        `<span class="tabx-bar">|</span>${body}<span class="tabx-bar">|</span>`;
      el.appendChild(r);
    });
    const lyr = sys.map((p) => (p.lyrics || '').padEnd(p.rows[0].length, ' ') + ' ').join('');
    if (lyr.trim()) {
      const l = document.createElement('div');
      l.className = 'tabx-row tabx-lyrics';
      l.textContent = ' '.repeat(labelW + 1) + lyr.replace(/\s+$/, '');
      el.appendChild(l);
    }
    container.appendChild(el);
  });
}

let lastRenderedTabSong = null;

function renderTabs(song) {
  lastRenderedTabSong = song;
  elTabContent.innerHTML = '';
  if (!song.tabs || !song.tabs.length) {
    elTabContent.innerHTML = '<p class="chord-panel-error">No tab for this song yet.</p>';
    return;
  }
  if (elTabContent.style.display === 'none') return; // drawn when the Tab view is opened (needs its width)

  tabCharWidth = measureTabCharWidth();
  const capacity = Math.floor((elTabContent.clientWidth - 24) / tabCharWidth);

  if (song.track) {
    const t = document.createElement('div');
    t.className = 'tabx-track';
    t.textContent = `Part: ${song.track}`;
    elTabContent.appendChild(t);
  }

  song.tabs.forEach((section) => {
    const wrap = document.createElement('div');
    wrap.className = 'tab-section';
    const label = document.createElement('div');
    label.className = 'tab-section-label';
    label.textContent = section.label;
    wrap.appendChild(label);

    parseTabText(section.tab).forEach((part) => {
      if (part.type === 'staff') {
        renderStaffBlock(wrap, part, capacity);
      } else {
        const text = part.lines.join('\n').replace(/^\n+|\n+$/g, '');
        if (!text.trim()) return;
        const p = document.createElement('pre');
        p.className = 'tabx-text';
        p.textContent = text;
        wrap.appendChild(p);
      }
    });
    elTabContent.appendChild(wrap);
  });
}

let tabResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(tabResizeTimer);
  tabResizeTimer = setTimeout(() => {
    if (lastRenderedTabSong && elTabContent.style.display !== 'none') renderTabs(lastRenderedTabSong);
  }, 150);
});

// --- "Chords in this song" bar: one easy diagram per chord, can be pinned to the top while scrolling ---
const elSongChordBar = document.getElementById('songChordBar');
const PIN_CHORDS_KEY = 'guitarApp_pinChords';

function isChordBarPinned() {
  try { return localStorage.getItem(PIN_CHORDS_KEY) === '1'; } catch (err) { return false; }
}

function setChordBarPinned(pinned) {
  try { localStorage.setItem(PIN_CHORDS_KEY, pinned ? '1' : '0'); } catch (err) { /* private mode: just don't remember */ }
  elSongChordBar.classList.toggle('pinned', pinned);
  const btn = elSongChordBar.querySelector('.song-chord-pin');
  if (btn) {
    btn.textContent = pinned ? '📌 Pinned' : '📌 Pin';
    btn.classList.toggle('active', pinned);
    btn.setAttribute('aria-pressed', String(pinned));
  }
}

function songChordList(song) {
  const seen = new Set();
  const chords = [];
  song.lines.forEach((line) => {
    parseSheetLine(line).forEach((seg) => {
      const name = seg.type === 'chord' ? displayChord(song, seg.value) : null;
      if (name && !seen.has(name)) {
        seen.add(name);
        chords.push(name);
      }
    });
  });
  return chords;
}

// The shape the chart itself uses for a chord, as a diagram position, or null.
function chartVoicing(song, chordName) {
  if (!song || !song.voicings || capoViewFor(song) !== (Number(song.capo) || 0)) return null;
  const v = song.voicings[chordName];
  if (!v || !Array.isArray(v.frets) || v.frets.length !== 6) return null;
  const fretted = v.frets.filter((f) => typeof f === 'number' && f > 0);
  const max = fretted.length ? Math.max(...fretted) : 0;
  const startFret = max <= 3 ? 0 : Math.min(...fretted);
  return { startFret, frets: v.frets, fingers: Array.isArray(v.fingers) ? v.fingers : null, fromText: !!v.fromText };
}

function easiestChordSvg(chordLabel) {
  // Slash chords (D/F#) and unusual names: fall back to the plain chord before the slash.
  const parsed = parseChordName(chordLabel) || parseChordName(chordLabel.split('/')[0]);
  if (!parsed) return null;
  const positions = getChordPositions(parsed.root, parsed.quality);
  return positions.length ? buildChordDiagramSvg(positions[0]) : null;
}

function renderChordBar(song) {
  elSongChordBar.innerHTML = '';
  const chords = songChordList(song);
  if (!chords.length) {
    elSongChordBar.style.display = 'none';
    return;
  }
  elSongChordBar.style.display = '';

  const head = document.createElement('div');
  head.className = 'song-chord-bar-head';
  const title = document.createElement('span');
  title.textContent = `Chords in this song (${chords.length})`;
  const pinBtn = document.createElement('button');
  pinBtn.type = 'button';
  pinBtn.className = 'song-chord-pin';
  pinBtn.addEventListener('click', () => setChordBarPinned(!isChordBarPinned()));
  head.appendChild(title);
  head.appendChild(pinBtn);

  const row = document.createElement('div');
  row.className = 'song-chord-row';
  chords.forEach((name) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'song-chord-card';
    const own = chartVoicing(song, name);
    const svg = own ? buildChordDiagramSvg(own) : easiestChordSvg(name);
    if (own) card.classList.add('chart-shape');
    if (svg) card.innerHTML = svg;
    const label = document.createElement('span');
    label.className = 'song-chord-card-name';
    label.textContent = name;
    card.appendChild(label);
    if (own) {
      const tag = document.createElement('span');
      tag.className = 'song-chord-card-tag';
      tag.textContent = 'as in chart';
      card.appendChild(tag);
    }
    card.addEventListener('click', () => openChordPanel(name));
    row.appendChild(card);
  });

  elSongChordBar.appendChild(head);
  elSongChordBar.appendChild(row);
  setChordBarPinned(isChordBarPinned());
}

// --- Strumming patterns (from Ultimate Guitar) and "this chart skips words" notice ---
const elSongStrums = document.getElementById('songStrums');
const elSongNotice = document.getElementById('songNotice');

const STRUM_SYMBOL = {
  1: { s: '↓', cls: '' },
  101: { s: '↑', cls: '' },
  2: { s: '✕', cls: 'muted' },
  102: { s: '✕', cls: 'muted' },
  3: { s: '↓', cls: 'accent' },
  103: { s: '↑', cls: 'accent' },
};
const COUNT_LABELS = { 1: [''], 2: ['', '&'], 3: ['', '&', 'a'], 4: ['', 'e', '&', 'a'], 6: ['', '', '&', '', 'a', ''] };

function renderStrums(song) {
  elSongStrums.innerHTML = '';
  const strums = song.strums || [];
  if (!strums.length) {
    elSongStrums.style.display = 'none';
    return;
  }
  elSongStrums.style.display = '';
  const head = document.createElement('div');
  head.className = 'song-strums-head';
  head.textContent = 'Strumming pattern';
  elSongStrums.appendChild(head);

  strums.forEach((st) => {
    const perBeat = Math.max(1, Math.round((st.den / 4) * (st.triplet ? 1.5 : 1)));
    const labels = COUNT_LABELS[perBeat] || Array(perBeat).fill('');
    const part = document.createElement('div');
    part.className = 'song-strum-part';
    const title = document.createElement('div');
    title.className = 'song-strum-title';
    title.textContent = [st.part || 'Whole song', st.bpm ? `${st.bpm} BPM` : '', st.triplet ? 'triplet feel' : '']
      .filter(Boolean)
      .join(' · ');
    part.appendChild(title);

    const bars = document.createElement('div');
    bars.className = 'song-strum-bars';
    const perBar = perBeat * 4;
    for (let b = 0; b * perBar < st.codes.length; b++) {
      const bar = document.createElement('div');
      bar.className = 'song-strum-bar';
      st.codes.slice(b * perBar, (b + 1) * perBar).forEach((code, i) => {
        const sym = STRUM_SYMBOL[code] || { s: '', cls: 'rest' };
        const slot = document.createElement('div');
        slot.className = 'song-strum-slot' + (i % perBeat === 0 ? ' on-beat' : '');
        slot.innerHTML = `<span class="song-strum-arrow ${sym.cls}">${sym.s || '·'}</span><span class="song-strum-count">${
          i % perBeat === 0 ? Math.floor(i / perBeat) + 1 : labels[i % perBeat]
        }</span>`;
        bar.appendChild(slot);
      });
      bars.appendChild(bar);
    }
    part.appendChild(bars);
    elSongStrums.appendChild(part);
  });

  const legend = document.createElement('div');
  legend.className = 'song-strum-legend';
  legend.innerHTML = '↓ down · ↑ up · <span class="muted">✕</span> muted chuck · <span class="accent">↓</span> accent · <span class="rest">·</span> skip (keep your hand moving)';
  elSongStrums.appendChild(legend);
}

function renderNotice(song) {
  elSongNotice.innerHTML = '';
  const alts = song.alternatives || [];
  if (!song.abbreviated) {
    elSongNotice.style.display = 'none';
    return;
  }
  elSongNotice.style.display = '';
  const text = document.createElement('p');
  text.textContent = alts.length
    ? 'This version skips some of the words (the writer used "etc…" or "repeat"). Load a fuller version:'
    : 'This version skips some of the words (the writer used "etc…" or "repeat"). Try another result in the search.';
  elSongNotice.appendChild(text);
  const row = document.createElement('div');
  row.className = 'song-notice-alts';
  alts.forEach((alt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'song-notice-btn';
    btn.textContent = `Version ${alt.version}${alt.rating ? ` · ★ ${alt.rating}` : ''}${alt.votes ? ` · ${alt.votes.toLocaleString()} votes` : ''}`;
    btn.addEventListener('click', () => {
      if (window.songFinderLoadChart) window.songFinderLoadChart({ title: song.title, artist: song.artist, url: alt.url });
    });
    row.appendChild(btn);
  });
  elSongNotice.appendChild(row);
}

function renderSong(song) {
  renderMeta(song);
  renderChordBar(song);
  renderNotice(song);
  renderStrums(song);
  renderSheet(song);
  renderTabs(song);
  elTabViewBtn.disabled = !song.tabs || !song.tabs.length;
}

function setViewMode(mode) {
  viewMode = mode;
  elSheetContent.style.display = mode === 'lyrics' ? '' : 'none';
  elSongChordBar.classList.toggle('hidden-in-tab', mode !== 'lyrics');
  elSongStrums.classList.toggle('hidden-in-tab', mode !== 'lyrics');
  elSongNotice.classList.toggle('hidden-in-tab', mode !== 'lyrics');
  elTabContent.style.display = mode === 'tab' ? '' : 'none';
  elLyricsViewBtn.classList.toggle('active', mode === 'lyrics');
  elTabViewBtn.classList.toggle('active', mode === 'tab');
  // Tabs are laid out to the screen width, so draw them once the Tab view is visible.
  if (mode === 'tab' && lastRenderedTabSong) renderTabs(lastRenderedTabSong);
}

function openChordPanel(chordLabel) {
  elChordPanelTitle.textContent = chordLabel;
  renderChordDiagrams(elChordPanelDiagrams, chordLabel);
  const own = chartVoicing(getSongByKey(currentSongKey), chordLabel);
  if (own) {
    const card = document.createElement('div');
    card.className = 'diagram-card chart-shape';
    card.innerHTML = `${buildChordDiagramSvg(own)}<div class="diagram-label">${own.fromText ? 'As written in this chart' : 'As used in this chart'}</div>`;
    // If the generic list only had an error message, replace it.
    if (elChordPanelDiagrams.querySelector('.chord-panel-error')) elChordPanelDiagrams.innerHTML = '';
    elChordPanelDiagrams.prepend(card);
  }
  elChordPanel.classList.add('open');
}

elChordPanelClose.addEventListener('click', () => {
  elChordPanel.classList.remove('open');
});

elSheetSelect.addEventListener('change', () => {
  currentSongKey = elSheetSelect.value;
  renderSong(getSongByKey(currentSongKey));
  setViewMode('lyrics');
  elChordPanel.classList.remove('open');
});

elLyricsViewBtn.addEventListener('click', () => setViewMode('lyrics'));
elTabViewBtn.addEventListener('click', () => setViewMode('tab'));

function refreshSheetSongOptions(selectKey) {
  elSheetSelect.innerHTML = '';

  const mySongs = getMySongs();
  if (mySongs.length) {
    const myGroup = document.createElement('optgroup');
    myGroup.label = 'My Songs';
    mySongs.forEach((song) => {
      const option = document.createElement('option');
      option.value = song.id;
      option.textContent = `${song.title} — ${song.artist}`;
      myGroup.appendChild(option);
    });
    elSheetSelect.appendChild(myGroup);
  }

  const demoGroup = document.createElement('optgroup');
  demoGroup.label = 'Demo Songs';
  SONGS.forEach((song, i) => {
    const option = document.createElement('option');
    option.value = `built-${i}`;
    option.textContent = `${song.title} — ${song.artist}`;
    demoGroup.appendChild(option);
  });
  elSheetSelect.appendChild(demoGroup);

  const targetKey = selectKey && getSongByKey(selectKey) ? selectKey : mySongs.length ? mySongs[mySongs.length - 1].id : 'built-0';
  elSheetSelect.value = targetKey;
  currentSongKey = targetKey;
  renderSong(getSongByKey(targetKey));
  setViewMode('lyrics');
}

refreshSheetSongOptions('built-0');

// --- Free song finder: hands the search off to free chord sites (no API, no cost) ---
(function setupSongFinder() {
  const form = document.getElementById('songFinderForm');
  const input = document.getElementById('songFinderInput');
  if (!form || !input) return;

  const buildUrl = {
    ug: (q) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}`,
    chordify: (q) => `https://chordify.net/search/${encodeURIComponent(q)}`,
    songsterr: (q) => `https://www.songsterr.com/?pattern=${encodeURIComponent(q)}`,
    youtube: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' guitar chords lesson')}`,
  };

  // The site buttons are real <a target="_blank"> links, so they always open in a new tab
  // on phone and computer, and can never reload this page. We just keep their hrefs in
  // sync with whatever is typed.
  const links = form.querySelectorAll('.song-finder-link');
  function updateLinks() {
    const query = input.value.trim();
    links.forEach((link) => {
      if (query) link.href = buildUrl[link.dataset.site](query);
    });
  }
  input.addEventListener('input', updateLinks);
  links.forEach((link) => link.addEventListener('click', (event) => {
    updateLinks();
    if (!input.value.trim()) { event.preventDefault(); input.focus(); }
  }));

  // --- In-app search: our Cloudflare Worker fetches the chart and returns it in the app's format ---
  const CHORD_API = 'https://guitar-app-chords.aimax-sms.workers.dev';
  const searchBtn = document.getElementById('songFinderSearchBtn');
  const statusEl = document.getElementById('songFinderStatus');
  const resultsEl = document.getElementById('songFinderResults');

  function setStatus(text) { statusEl.textContent = text; }

  // --- Private access: each person has their own code, remembered on this device ---
  const ACCESS_KEY = 'guitarApp_accessCode';
  const codeRow = document.getElementById('songFinderCodeRow');
  const codeInput = document.getElementById('songFinderCodeInput');
  const codeBtn = document.getElementById('songFinderCodeBtn');
  let retryAfterCode = null;

  function getAccessCode() {
    try { return localStorage.getItem(ACCESS_KEY) || ''; } catch (err) { return ''; }
  }
  function setAccessCode(code) {
    try {
      if (code) localStorage.setItem(ACCESS_KEY, code);
      else localStorage.removeItem(ACCESS_KEY);
    } catch (err) { /* private browsing: they'll be asked again next time */ }
  }
  function askForCode(message) {
    codeRow.style.display = '';
    setStatus(message || '');
    codeInput.value = '';
    codeInput.focus();
  }
  function saveCode() {
    const code = codeInput.value.trim();
    if (!code) { codeInput.focus(); return; }
    setAccessCode(code);
    codeRow.style.display = 'none';
    const retry = retryAfterCode;
    retryAfterCode = null;
    if (retry) retry();
    else setStatus('Code saved. Search for a song.');
  }
  codeBtn.addEventListener('click', saveCode);
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveCode(); } });

  class NeedCodeError extends Error {}
  // First time asked: just show the box. After a rejected code: say so.
  const codeHint = (err) => (err.message === 'Access code needed' ? '' : `${err.message}. Check it and try again.`);

  async function callApi(path) {
    // Only asks for a code if the server is in private mode (answers 401).
    const code = getAccessCode();
    const res = await fetch(CHORD_API + path, code ? { headers: { 'X-Access-Code': code } } : {});
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setAccessCode('');
      throw new NeedCodeError(code ? 'That access code didn\'t work' : 'Access code needed');
    }
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    return data;
  }

  const videoEl = document.getElementById('songFinderVideo');
  const SECTIONS = [
    { key: 'chords', title: 'Chords & Lyrics', hint: 'Tap to save to My Songs' },
    { key: 'tabs', title: 'Tabs', hint: 'Tap to save to My Songs and open the Tab view' },
    { key: 'videos', title: 'Video Lessons', hint: 'Tap to watch here' },
  ];
  const SECTION_PREVIEW = 5;
  const expanded = {};
  const SOURCE_CLASS = {
    'Ultimate Guitar': 'src-ug',
    Songsterr: 'src-songsterr',
    LaCuerda: 'src-lacuerda',
    YouTube: 'src-youtube',
  };
  let lastResults = [];

  function formatViews(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M views';
    if (n >= 1e3) return Math.round(n / 1e3) + 'K views';
    return n + ' views';
  }

  function renderResults() {
    resultsEl.innerHTML = '';
    SECTIONS.forEach((section) => {
      const items = lastResults.filter((r) => r.category === section.key);
      const wrap = document.createElement('div');
      wrap.className = 'song-finder-section';

      const head = document.createElement('div');
      head.className = 'song-finder-section-head';
      const h = document.createElement('h3');
      h.textContent = `${section.title} (${items.length})`;
      const hint = document.createElement('span');
      hint.className = 'song-finder-section-hint';
      hint.textContent = items.length ? section.hint : 'Nothing found';
      head.appendChild(h);
      head.appendChild(hint);
      wrap.appendChild(head);

      const shown = expanded[section.key] ? items : items.slice(0, SECTION_PREVIEW);
      shown.forEach((r) => wrap.appendChild(renderResult(r)));

      if (items.length > SECTION_PREVIEW) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'song-finder-more';
        more.textContent = expanded[section.key] ? 'Show less' : `Show all ${items.length}`;
        more.addEventListener('click', () => {
          expanded[section.key] = !expanded[section.key];
          renderResults();
        });
        wrap.appendChild(more);
      }
      resultsEl.appendChild(wrap);
    });
  }

  function renderResult(r) {
        // External results (Songsterr's tab player) are real new-tab links so they open reliably.
        const btn = document.createElement(r.external ? 'a' : 'button');
        if (r.external) {
          btn.href = r.url;
          btn.target = '_blank';
          btn.rel = 'noopener';
        } else {
          btn.type = 'button';
        }
        btn.className = 'song-finder-result';

        if (r.videoId) {
          const thumb = document.createElement('img');
          thumb.className = 'song-finder-thumb';
          thumb.src = `https://i.ytimg.com/vi/${r.videoId}/mqdefault.jpg`;
          thumb.alt = '';
          thumb.loading = 'lazy';
          btn.appendChild(thumb);
        }

        const textWrap = document.createElement('span');
        textWrap.className = 'song-finder-result-text';
        const main = document.createElement('span');
        main.className = 'song-finder-result-title';
        main.textContent = r.videoId ? r.title : `${r.title} — ${r.artist}`;
        const sub = document.createElement('span');
        sub.className = 'song-finder-result-sub';
        const badge = document.createElement('span');
        badge.className = 'song-finder-badge ' + (SOURCE_CLASS[r.source] || '');
        badge.textContent = r.source;
        sub.appendChild(badge);
        const bits = [];
        if (r.videoId) {
          if (r.artist) bits.push(r.artist);
          if (r.length) bits.push(r.length);
        } else if (r.version) bits.push(`version ${r.version}`);
        if (r.rating) bits.push(`★ ${r.rating}`);
        if (r.votes) bits.push(`${r.votes.toLocaleString()} votes`);
        if (r.views) bits.push(formatViews(r.views));
        if (r.external) bits.push('opens Songsterr ↗');
        sub.appendChild(document.createTextNode(' ' + bits.join(' · ')));
        textWrap.appendChild(main);
        textWrap.appendChild(sub);
        btn.appendChild(textWrap);

        if (!r.external) btn.addEventListener('click', () => (r.videoId ? playVideo(r) : loadChart(r)));
        return btn;
  }

  function playVideo(r) {
    videoEl.innerHTML = '';
    const frameWrap = document.createElement('div');
    frameWrap.className = 'song-finder-video-frame';
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${r.videoId}?autoplay=1&playsinline=1&rel=0`;
    frame.title = r.title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frameWrap.appendChild(frame);
    const bar = document.createElement('div');
    bar.className = 'song-finder-video-bar';
    const label = document.createElement('span');
    label.textContent = r.title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'song-meta-btn';
    close.textContent = 'Close video';
    close.addEventListener('click', () => { videoEl.innerHTML = ''; videoEl.style.display = 'none'; });
    bar.appendChild(label);
    bar.appendChild(close);
    videoEl.appendChild(frameWrap);
    videoEl.appendChild(bar);
    videoEl.style.display = '';
    videoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function runSearch() {
    const query = input.value.trim();
    if (!query) { input.focus(); return; }
    input.blur();
    resultsEl.innerHTML = '';
    setStatus('Searching Ultimate Guitar, Songsterr, LaCuerda and YouTube…');
    searchBtn.disabled = true;
    try {
      const { results } = await callApi('/search?q=' + encodeURIComponent(query));
      lastResults = results;
      SECTIONS.forEach((s) => { expanded[s.key] = false; });
      if (!results.length) {
        setStatus('Nothing found. Try adding the artist, or use the links below.');
        return;
      }
      setStatus('Highest rated first in each section');
      renderResults();
    } catch (err) {
      if (err instanceof NeedCodeError) {
        retryAfterCode = runSearch;
        askForCode(codeHint(err));
        return;
      }
      setStatus(`Couldn't search right now (${err.message}). Use the links below instead.`);
    } finally {
      searchBtn.disabled = false;
    }
  }

  async function loadChart(result) {
    setStatus(`Loading ${result.title}…`);
    try {
      const chart = await callApi('/song?url=' + encodeURIComponent(result.url));
      const saved = addMySong({
        title: chart.title || result.title,
        artist: chart.artist || result.artist,
        key: chart.key || '?',
        capo: chart.capo || 0,
        tuning: chart.tuning || 'Standard',
        lines: chart.lines && chart.lines.length ? chart.lines : ['(Tab only — tap the Tab button above)'],
        tabs: chart.tabs || [],
        source: chart.source,
        sourceUrl: chart.sourceUrl,
        track: chart.track || '',
        strums: chart.strums || [],
        voicings: chart.voicings || {},
        abbreviated: !!chart.abbreviated,
        alternatives: chart.alternatives || [],
      });
      const isTab = !(chart.lines && chart.lines.length) && saved.tabs.length;
      setStatus(`Saved "${saved.title}"${isTab ? ' (tab)' : ''} to My Songs.`);
      refreshSheetSongOptions(saved.id);
      if (isTab) setViewMode('tab');
      elSheetSelect.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      if (err instanceof NeedCodeError) {
        retryAfterCode = () => loadChart(result);
        askForCode(`${err.message}. Check it and try again.`);
        return;
      }
      setStatus(`Couldn't load that chart (${err.message}). Try another result.`);
    }
  }

  searchBtn.addEventListener('click', runSearch);
  // Lets the "load a fuller version" buttons on a saved song reuse the same loader.
  window.songFinderLoadChart = loadChart;

  // --- Voice search: say the song, it fills the box and searches ---
  // Uses the browser's speech recognition (Safari sends the audio to Apple, Chrome to Google).
  const micBtn = document.getElementById('songFinderMicBtn');
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let listening = null;

  // "Search for wonderwall by oasis chords" -> "wonderwall oasis"
  function cleanSpokenQuery(text) {
    return text
      .replace(/^\s*(hey\s+)?(please\s+)?(can you\s+)?(search( for)?|find( me)?|look up|show me|play|get( me)?|i'?m looking for|i want)\s+/i, '')
      .replace(/\s+(chords?|tabs?|lyrics|on (the )?guitar|guitar|please)\s*$/i, '')
      .replace(/\s+(chords?|tabs?)\s*$/i, '')
      .replace(/\bby\b/gi, ' ')
      .replace(/[.?!]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stopListening() {
    if (listening) { try { listening.stop(); } catch (err) { /* already stopped */ } }
  }

  if (SpeechRec && micBtn) {
    micBtn.style.display = '';
    document.getElementById('songFinderLangRow').style.display = '';
    attachVoiceLangSelect(document.getElementById('songFinderVoiceLang'));
    micBtn.addEventListener('click', () => {
      if (listening) { stopListening(); return; }
      const rec = new SpeechRec();
      rec.lang = getVoiceLang();
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      let finalText = '';
      listening = rec;
      micBtn.classList.add('listening');
      const langLabel = (VOICE_LANGUAGES.find((l) => l.code === rec.lang) || {}).label || rec.lang;
      setStatus(`Listening in ${langLabel}… say the song name (and the artist if you know it)`);

      rec.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
        input.value = text;
        if (event.results[event.results.length - 1].isFinal) finalText = text;
      };
      rec.onerror = (event) => {
        const messages = {
          'not-allowed': 'Microphone access was blocked. Allow it for this site in your browser settings.',
          'service-not-allowed': 'Voice search is turned off in this browser.',
          'no-speech': "Didn't hear anything. Tap 🎤 and try again.",
          'network': 'Voice search needs an internet connection.',
        };
        setStatus(messages[event.error] || `Voice search stopped (${event.error}).`);
        finalText = '';
      };
      rec.onend = () => {
        listening = null;
        micBtn.classList.remove('listening');
        const query = cleanSpokenQuery(finalText || input.value);
        if (query) {
          input.value = query;
          updateLinks();
          runSearch();
        }
      };
      try {
        rec.start();
      } catch (err) {
        listening = null;
        micBtn.classList.remove('listening');
        setStatus("Couldn't start voice search on this browser.");
      }
    });
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runSearch();
  });
  updateLinks();
})();
