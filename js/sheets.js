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
  const capoText = song.capo ? `Capo: Fret ${song.capo}` : 'No Capo';
  const parts = [`Key: ${song.key}`, capoText, `Tuning: ${song.tuning}`];
  if (song.strumPattern) parts.push(`Strum: ${song.strumPattern}`);
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

  async function callApi(path) {
    const res = await fetch(CHORD_API + path);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    return data;
  }

  const videoEl = document.getElementById('songFinderVideo');
  const SECTIONS = [
    { key: 'chords', title: 'Chords & Lyrics', hint: 'Tap to save to My Songs' },
    { key: 'tabs', title: 'Tabs', hint: 'Ultimate Guitar tabs save to My Songs · Songsterr opens its tab player' },
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
      setStatus('Best matches first in each section');
      renderResults();
    } catch (err) {
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
      });
      const isTab = !(chart.lines && chart.lines.length) && saved.tabs.length;
      setStatus(`Saved "${saved.title}"${isTab ? ' (tab)' : ''} to My Songs.`);
      refreshSheetSongOptions(saved.id);
      if (isTab) setViewMode('tab');
      elSheetSelect.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setStatus(`Couldn't load that chart (${err.message}). Try another result.`);
    }
  }

  searchBtn.addEventListener('click', runSearch);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runSearch();
  });
  updateLinks();
})();
