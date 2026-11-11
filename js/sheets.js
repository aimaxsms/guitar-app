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

function renderMeta(song) {
  const parts = [`Key: ${song.key}`, `Capo: ${song.capo}`, `Tuning: ${song.tuning}`];
  if (song.artist) parts.unshift(song.artist);
  elSongMeta.innerHTML = '';
  const metaText = document.createElement('span');
  metaText.textContent = parts.join('  •  ');
  elSongMeta.appendChild(metaText);

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

function renderSheet(song) {
  elSheetContent.innerHTML = '';
  song.lines.forEach((line) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'sheet-line';
    parseSheetLine(line).forEach((segment) => {
      if (segment.type === 'chord') {
        const btn = document.createElement('button');
        btn.className = 'chord-tag';
        btn.textContent = segment.value;
        btn.addEventListener('click', () => openChordPanel(segment.value));
        lineEl.appendChild(btn);
      } else {
        lineEl.appendChild(document.createTextNode(segment.value));
      }
    });
    elSheetContent.appendChild(lineEl);
  });
}

function renderTabs(song) {
  elTabContent.innerHTML = '';
  if (!song.tabs || !song.tabs.length) {
    elTabContent.innerHTML = '<p class="chord-panel-error">No tab for this song yet.</p>';
    return;
  }
  song.tabs.forEach((section) => {
    const wrap = document.createElement('div');
    wrap.className = 'tab-section';
    const label = document.createElement('div');
    label.className = 'tab-section-label';
    label.textContent = section.label;
    const pre = document.createElement('pre');
    pre.className = 'tab-block';
    pre.textContent = section.tab;
    wrap.appendChild(label);
    wrap.appendChild(pre);
    elTabContent.appendChild(wrap);
  });
}

function renderSong(song) {
  renderMeta(song);
  renderSheet(song);
  renderTabs(song);
  elTabViewBtn.disabled = !song.tabs || !song.tabs.length;
}

function setViewMode(mode) {
  viewMode = mode;
  elSheetContent.style.display = mode === 'lyrics' ? '' : 'none';
  elTabContent.style.display = mode === 'tab' ? '' : 'none';
  elLyricsViewBtn.classList.toggle('active', mode === 'lyrics');
  elTabViewBtn.classList.toggle('active', mode === 'tab');
}

function openChordPanel(chordLabel) {
  elChordPanelTitle.textContent = chordLabel;
  renderChordDiagrams(elChordPanelDiagrams, chordLabel);
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
