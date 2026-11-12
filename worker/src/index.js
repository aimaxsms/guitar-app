// Chord-chart fetcher for the guitar app (Cloudflare Worker, free tier).
//
//   GET /search?q=wonderwall            -> [{ source, title, artist, type, rating, votes, url }]
//   GET /song?url=<chart page url>      -> { title, artist, key, capo, tuning, source, sourceUrl, lines }
//
// Only fetches from an allowlist of chord sites, and only answers requests coming from the app,
// so it can't be used as an open proxy. Personal-use tool: charts are returned to the browser and
// saved on the user's own device, never stored or republished here.

const ALLOWED_ORIGINS = [
  'https://aimaxsms.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const CACHE_SECONDS = 60 * 60 * 24; // charts rarely change; be gentle on the source sites

// ---------- shared helpers ----------

const NAMED_ENTITIES = {
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', ccedil: 'ç', Ccedil: 'Ç',
  agrave: 'à', egrave: 'è', ograve: 'ò', atilde: 'ã', otilde: 'õ',
  acirc: 'â', ecirc: 'ê', ocirc: 'ô', iexcl: '¡', iquest: '¿',
  hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—',
};

function decodeEntities(s) {
  return s
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] || m)
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

// Text that may sit on a chord line besides the chords themselves: spacing, bar lines, repeat marks…
const CHORD_LINE_FILLER = /^[\s\-|/().,:x×\d*]*$/i;

// rawLines: [{ text, chords: [{ col, name }] | null }]
// Converts chord-over-lyric layout into the app's inline format: "[G]Today is gonna [D]be".
export function toInlineLines(rawLines) {
  // Square brackets in plain text ("[Verse 1]") would be read as chords by the app.
  const safe = (t) => t.replace(/\[([^\]]*)\]/g, '($1)').replace(/\s+$/, '');
  const out = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line.chords) {
      out.push(safe(line.text));
      continue;
    }
    const next = rawLines[i + 1];
    const nextIsLyric = next && !next.chords && next.text.trim() && !/^\s*\[[^\]]+\]\s*$/.test(next.text);
    if (nextIsLyric) {
      let lyric = safe(next.text);
      const maxCol = Math.max(...line.chords.map((c) => c.col));
      if (lyric.length < maxCol) lyric = lyric.padEnd(maxCol, ' ');
      [...line.chords].sort((a, b) => b.col - a.col).forEach((c) => {
        lyric = lyric.slice(0, c.col) + `[${c.name}]` + lyric.slice(c.col);
      });
      out.push(lyric.replace(/\s+$/, ''));
      i++; // consumed the lyric line
    } else {
      // chord-only line (intro, riff, instrumental): keep spacing, bracket each chord
      let text = line.text;
      [...line.chords].sort((a, b) => b.col - a.col).forEach((c) => {
        text = text.slice(0, c.col) + `[${c.name}]` + text.slice(c.col + c.name.length);
      });
      out.push(text.replace(/\s+$/, ''));
    }
  }
  // collapse runs of blank lines
  return out.filter((l, i, arr) => l.trim() || (i > 0 && arr[i - 1].trim()));
}

// Pulls chord names out of a line where they are wrapped in a marker (e.g. [ch]G[/ch] or <A>G</A>).
// Returns { text, chords } with columns measured on the marker-free text.
function splitMarkedLine(line, markerRe) {
  let text = '';
  const chords = [];
  let last = 0;
  let m;
  markerRe.lastIndex = 0;
  while ((m = markerRe.exec(line))) {
    text += line.slice(last, m.index);
    const name = m[1].trim();
    chords.push({ col: text.length, name });
    text += name;
    last = markerRe.lastIndex;
  }
  text += line.slice(last);
  if (!chords.length) return { text, chords: null };
  // Only treat it as a chord line if nothing but chords and filler is on it.
  let rest = text;
  [...chords].sort((a, b) => b.col - a.col).forEach((c) => {
    rest = rest.slice(0, c.col) + rest.slice(c.col + c.name.length);
  });
  if (!CHORD_LINE_FILLER.test(rest)) {
    // chords mixed into lyrics: keep them inline as-is
    let inline = text;
    [...chords].sort((a, b) => b.col - a.col).forEach((c) => {
      inline = inline.slice(0, c.col) + `[${c.name}]` + inline.slice(c.col + c.name.length);
    });
    return { text: inline, chords: null, preInlined: true };
  }
  return { text, chords };
}

// ---------- Ultimate Guitar ----------

function ugStore(html) {
  const m = html.match(/class="js-store"\s+data-content="([^"]*)"/);
  if (!m) throw new Error('Ultimate Guitar page format not recognised (may be blocked)');
  return JSON.parse(decodeEntities(m[1])).store.page.data;
}

export function parseUgSearch(html) {
  const results = ugStore(html).results || [];
  return results
    .filter((r) => (r.type === 'Chords' || r.type === 'Tabs') && r.tab_url && /^https:\/\/tabs\.ultimate-guitar\.com\/tab\//.test(r.tab_url))
    .map((r) => ({
      source: 'Ultimate Guitar',
      category: r.type === 'Tabs' ? 'tabs' : 'chords',
      title: r.song_name,
      artist: r.artist_name,
      type: r.type,
      version: r.version,
      rating: r.rating ? Math.round(r.rating * 10) / 10 : null,
      votes: r.votes || 0,
      url: r.tab_url,
    }))
    .sort((a, b) => b.votes - a.votes);
}

export function parseUgSong(html, url) {
  const data = ugStore(html);
  const content = data.tab_view && data.tab_view.wiki_tab && data.tab_view.wiki_tab.content;
  if (!content) throw new Error('No chord chart found on that page');
  const meta = data.tab_view.meta || {};
  const base = {
    title: data.tab.song_name,
    artist: data.tab.artist_name,
    key: meta.tonality || data.tab.tonality_name || '?',
    capo: Number(meta.capo) || 0,
    tuning: (meta.tuning && meta.tuning.name) || 'Standard',
    source: 'Ultimate Guitar',
    sourceUrl: url,
  };
  if (data.tab.type === 'Tabs') return { ...base, lines: [], tabs: ugTabSections(content) };
  const raw = content
    .replace(/\r/g, '')
    .replace(/\[\/?tab\]/g, '')
    .split('\n')
    .map((l) => {
      const r = splitMarkedLine(l, /\[ch\](.*?)\[\/ch\]/g);
      return r.preInlined ? { text: r.text, chords: null, preInlined: true } : r;
    });
  return { ...base, lines: inlineKeepingPreInlined(raw), tabs: [] };
}

// Splits a UG "Tabs" page into the app's tab sections, using its [Intro] / [Riff 1] headers.
export function ugTabSections(content) {
  const sections = [];
  let current = { label: 'Notes', body: [] };
  content
    .replace(/\r/g, '')
    .replace(/\[\/?tab\]/g, '')
    .replace(/\[ch\](.*?)\[\/ch\]/g, '$1')
    .split('\n')
    .forEach((line) => {
      const header = line.match(/^\s*\[([^\]]{1,40})\]\s*$/);
      if (header) {
        sections.push(current);
        current = { label: header[1], body: [] };
      } else {
        current.body.push(line.replace(/\s+$/, ''));
      }
    });
  sections.push(current);
  return sections
    .map((s) => ({ label: s.label, tab: s.body.join('\n').replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n') }))
    .filter((s) => s.tab.trim());
}

// toInlineLines() turns "[Verse]" text into "(Verse)"; lines whose chords were already inlined
// must skip that step, so run them through untouched.
function inlineKeepingPreInlined(raw) {
  const marker = '\u0000PRE';
  const pre = [];
  const prepared = raw.map((l) => {
    if (!l.preInlined) return l;
    pre.push(l.text);
    return { text: marker + (pre.length - 1), chords: null };
  });
  return toInlineLines(prepared).map((l) =>
    l.startsWith(marker) ? pre[Number(l.slice(marker.length))] : l
  );
}

// ---------- LaCuerda.net (Spanish-language songs) ----------

export function parseLacuerdaSearch(html) {
  const arr = (name) => {
    const m = html.match(new RegExp(name + "\\s*=\\s*\\[([^\\]]*)\\]"));
    return m ? [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]) : [];
  };
  const hds = arr('hds');
  const fns = arr('fns');
  const nmaxM = html.match(/NMAX\s*=\s*(\d+)/);
  const nmax = nmaxM ? Number(nmaxM[1]) : hds.length - 1;
  const titles = [...html.matchAll(/<li id='r(\d+)'[^>]*><a[^>]*>([^<]*)<\/a>/g)];
  const titleCase = (slug) => slug.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return titles
    .map((t) => {
      const n = Number(t[1]);
      const artistSlug = hds[nmax - n];
      const songSlug = fns[n];
      if (!artistSlug || !songSlug) return null;
      return {
        source: 'LaCuerda',
        category: 'chords',
        title: decodeEntities(t[2]).trim(),
        artist: titleCase(artistSlug),
        type: 'Acordes',
        rating: null,
        votes: 0,
        url: `https://acordes.lacuerda.net/${artistSlug}/${songSlug}.shtml`,
      };
    })
    .filter(Boolean);
}

export function parseLacuerdaSong(html, url) {
  const body = html.match(/<div id=t_body><PRE>([\s\S]*?)<\/PRE>/i);
  if (!body) throw new Error('No chord chart found on that page');
  const raw = body[1]
    .replace(/\r/g, '')
    .replace(/<div><\/div>/gi, '')
    .split('\n')
    .map((l) => {
      const r = splitMarkedLine(l, /<A>(.*?)<\/A>/gi);
      const clean = (t) => decodeEntities(t.replace(/<[^>]+>/g, ''));
      return { ...r, text: clean(r.text) };
    });
  const pathParts = new URL(url).pathname.split('/').filter(Boolean);
  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const titleCase = (slug) => slug.replace(/\.shtml$/, '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: titleCase(pathParts[1] || 'Song'),
    artist: titleCase(pathParts[0] || ''),
    key: '?',
    capo: 0,
    tuning: 'Standard',
    source: 'LaCuerda',
    sourceUrl: url,
    pageTitle: titleM ? decodeEntities(titleM[1]).trim() : undefined,
    lines: inlineKeepingPreInlined(raw),
  };
}

// ---------- Songsterr (chord sheets; its note-by-note tabs need their player) ----------

// Every Songsterr song has tabs (opened in Songsterr's own player, since its notes need it);
// songs with a chord sheet also get a chords entry that loads into the app.
export function parseSongsterrSearch(list) {
  const out = [];
  (Array.isArray(list) ? list : []).forEach((s) => {
    const common = {
      source: 'Songsterr',
      title: s.title,
      artist: s.artist,
      rating: null,
      votes: 0,
      views: (s.tracks || []).reduce((sum, t) => sum + (t.views || 0), 0),
    };
    // Songsterr redirects any slug to the right one, so only the id matters.
    if (s.hasChords) {
      out.push({ ...common, category: 'chords', type: 'Chords', url: `https://www.songsterr.com/a/wsa/song-chords-s${s.songId}` });
    }
    if (s.hasPlayer !== false) {
      out.push({ ...common, category: 'tabs', type: 'Tab', url: `https://www.songsterr.com/a/wsa/song-tab-s${s.songId}` });
    }
  });
  return out;
}

function songsterrChordName(chord) {
  const base = chord.baseNote && chord.baseNote.name;
  if (!base) return '?';
  const suffix = (chord.chordType && chord.chordType.suffix) || '';
  const bass = chord.firstNote && chord.firstNote.name;
  return base + suffix + (bass && bass !== base ? '/' + bass : '');
}

export function parseSongsterrSong(html, url) {
  const m = html.match(/<script id="state" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Songsterr page format not recognised');
  const state = JSON.parse(m[1]);
  const items = state.chordpro && state.chordpro.current;
  if (!Array.isArray(items) || !items.length) throw new Error('This Songsterr song has no chord sheet');
  const info = (state.chords && state.chords.current) || (state.meta && state.meta.current) || {};
  let capo = 0;
  let tuning = 'Standard';
  const lines = [];
  items.forEach((item) => {
    if (item.type === 'capo') capo = Number(item.text) || 0;
    else if (item.type === 'tuning') tuning = item.text || tuning;
    else if (item.type === 'section') {
      if (lines.length && lines[lines.length - 1] !== '') lines.push('');
      lines.push(`(${item.text})`);
    } else if (item.type === 'line') {
      const text = (item.line || [])
        .map((p) => (p.type === 'chord' ? `[${songsterrChordName(p.chord)}]` : (p.text || '').replace(/[[\]]/g, '')))
        .join('');
      lines.push(text.replace(/\s+$/, ''));
    }
  });
  return {
    title: info.title || 'Song',
    artist: info.artist || '',
    key: '?',
    capo,
    tuning: tuning.replace(/\s*\(EADGBE\)/, ''),
    source: 'Songsterr',
    sourceUrl: url,
    lines,
  };
}

// ---------- Songsterr tabs: note data from Songsterr's CDN, turned into plain text tab ----------

const SONGSTERR_CDN = 'https://dqsljvtekg760.cloudfront.net';
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEAT_WIDTH = { 1: 8, 2: 6, 4: 4, 8: 3, 16: 2, 32: 2, 64: 2 };

function songsterrState(html) {
  const m = html.match(/<script id="state" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Songsterr page format not recognised');
  return JSON.parse(m[1]);
}

// Picks the guitar track most people look at (usually the main rhythm or lead part).
function pickSongsterrTrack(meta) {
  const tracks = meta.tracks || [];
  const isGuitar = (t) => t && /guitar/i.test(t.instrument || '') && !/bass/i.test(t.instrument || '');
  if (isGuitar(tracks[meta.popularTrackGuitar])) return meta.popularTrackGuitar;
  let best = -1;
  tracks.forEach((t, i) => { if (isGuitar(t) && (best < 0 || (t.views || 0) > (tracks[best].views || 0))) best = i; });
  return best >= 0 ? best : meta.defaultTrack || 0;
}

function stringLabels(tuning) {
  const names = tuning.map((midi) => NOTE_NAMES_SHARP[((midi % 12) + 12) % 12]);
  // Standard tab writes the top (highest) string in lowercase so e and E differ.
  if (names.length && names[0] === 'E' && names[names.length - 1] === 'E') names[0] = 'e';
  const w = Math.max(...names.map((n) => n.length));
  return names.map((n) => n.padEnd(w, ' '));
}

const beatLength = (b) => (Array.isArray(b.duration) && b.duration[1] ? b.duration[0] / b.duration[1] : 1 / (b.type || 4));

// Songsterr keeps lyrics on the vocal track as Guitar Pro-style syllables ("To-day is gon-na"),
// one per sung note. Returns [{ mi, pos, text }]: measure index, position in the measure, syllable.
export function songsterrLyricEvents(vocalPart) {
  const entry = (vocalPart.newLyrics || []).find((l) => l && l.text && l.text.trim());
  if (!entry) return [];
  const syllables = [];
  entry.text
    .replace(/\[[^\]]*\]/g, ' ') // [Verse 1] labels aren't sung
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      const parts = word.split('-').filter(Boolean);
      parts.forEach((p, i) => syllables.push(i < parts.length - 1 ? p + '-' : p));
    });
  const events = [];
  let k = 0;
  const startMeasure = Math.max(0, (entry.offset || 1) - 1);
  vocalPart.measures.forEach((m, mi) => {
    if (mi < startMeasure) return;
    let pos = 0;
    const beats = (m.voices && m.voices[0] && m.voices[0].beats) || [];
    beats.forEach((b) => {
      const sung = (b.notes || []).some((n) => !n.rest && !n.tie);
      if (sung && !b.rest && k < syllables.length) events.push({ mi, pos, text: syllables[k++] });
      pos += beatLength(b);
    });
  });
  return events;
}

export function songsterrPartToTabs(part, lyricEvents = []) {
  const strings = part.strings || (part.tuning || []).length || 6;
  const labels = stringLabels((part.tuning || []).slice(0, strings));
  const gutter = labels[0].length;
  const lyricsByMeasure = {};
  lyricEvents.forEach((e) => (lyricsByMeasure[e.mi] = lyricsByMeasure[e.mi] || []).push(e));
  const sections = [];
  let current = null;
  const startSection = (label) => {
    current = { label, annot: ' '.repeat(gutter) + ' ', lyrics: '♪'.padEnd(gutter, ' ') + '|', rows: labels.map((l) => l + '|') };
    sections.push(current);
  };
  startSection(part.name ? 'Start' : 'Tab');

  // Flatten beats (first voice) so hammer-on/pull-off can look at the next note on the string.
  const flat = [];
  part.measures.forEach((m, mi) => {
    const beats = (m.voices && m.voices[0] && m.voices[0].beats) || [];
    beats.forEach((b) => flat.push({ b, mi }));
  });
  const nextFret = (fromIndex, s) => {
    for (let i = fromIndex + 1; i < flat.length && i < fromIndex + 8; i++) {
      const n = (flat[i].b.notes || []).find((x) => x.string === s && !x.rest);
      if (n) return n.fret;
    }
    return null;
  };

  let flatIndex = 0;
  part.measures.forEach((m, mi) => {
    if (m.marker && m.marker.text) {
      if (current.rows[0].length > gutter + 1) startSection(m.marker.text);
      else current.label = m.marker.text;
    }
    const beats = (m.voices && m.voices[0] && m.voices[0].beats) || [];
    const measureLyrics = lyricsByMeasure[mi] || [];
    if (!beats.length) {
      const words = measureLyrics.map((e) => e.text).join(' ');
      const w = Math.max(8, words.length + 1);
      current.annot += ' '.repeat(w + 1);
      current.lyrics += words.padEnd(w, ' ') + ' ';
      current.rows = current.rows.map((r) => r + '-'.repeat(w) + '|');
      return;
    }
    // Each guitar beat gets the syllables sung between its start and the next beat's start.
    const starts = [];
    let pos = 0;
    beats.forEach((b) => { starts.push(pos); pos += beatLength(b); });
    beats.forEach((b, bi) => {
      const from = bi === 0 ? -Infinity : starts[bi];
      const to = bi === beats.length - 1 ? Infinity : starts[bi + 1];
      const sung = measureLyrics.filter((e) => e.pos >= from - 1e-9 && e.pos < to - 1e-9).map((e) => e.text).join(' ');
      const tokens = new Array(strings).fill('');
      (b.notes || []).forEach((n) => {
        if (n.rest || n.tie || n.string == null || n.string >= strings) return;
        let t = n.dead ? 'x' : String(n.fret);
        if (n.harmonic) t = `<${n.harmonicFret != null ? n.harmonicFret : n.fret}>`;
        if (n.ghost) t = `(${t})`;
        if (n.bend) t += 'b';
        if (n.slide) t += n.slide === 'downwards' ? '\\' : '/';
        if (n.hp) {
          const nf = nextFret(flatIndex, n.string);
          if (nf != null) t += nf > n.fret ? 'h' : 'p';
        }
        if (n.leftHandVibrato) t += '~';
        tokens[n.string] = t;
      });
      let annot = b.chord && b.chord.text ? b.chord.text : b.palmMute ? 'PM' : '';
      const base = (BEAT_WIDTH[b.type] || 3) + (b.dots ? 1 : 0);
      const width = Math.max(base, ...tokens.map((t) => t.length + 1), annot.length + 1, sung.length + 1);
      current.annot += annot.padEnd(width, ' ');
      current.lyrics += sung.padEnd(width, ' ');
      current.rows = current.rows.map((r, s) => r + tokens[s].padEnd(width, '-'));
      flatIndex++;
    });
    current.annot += ' ';
    current.lyrics += ' ';
    current.rows = current.rows.map((r) => r + '|');
  });

  return sections
    .filter((s) => s.rows[0].length > gutter + 1)
    .map((s) => {
      const lines = (s.annot.trim() ? [s.annot.replace(/\s+$/, '')] : []).concat(s.rows);
      // Lyrics go under the tab as a "♪|" row, column-aligned with the notes.
      if (s.lyrics.slice(gutter + 1).trim()) lines.push(s.lyrics.replace(/\s+$/, ''));
      return { label: s.label, tab: lines.join('\n') };
    });
}

// The vocal track is usually listed as "Vocals" even when its instrument is a placeholder sound.
function pickSongsterrVocalTrack(meta) {
  const tracks = meta.tracks || [];
  if (tracks[meta.popularTrackVocals]) return meta.popularTrackVocals;
  const i = tracks.findIndex((t) => /vocal|voice|voz|lyrics|singer/i.test(`${t.name} ${t.instrument}`));
  return i;
}

export async function loadSongsterrTab(html, url, ctx) {
  const state = songsterrState(html);
  const meta = state.meta && state.meta.current;
  if (!meta || !meta.image) throw new Error('This Songsterr song has no tab data');
  const trackIndex = pickSongsterrTrack(meta);
  const track = (meta.tracks || [])[trackIndex] || {};
  const partUrl = `${SONGSTERR_CDN}/${meta.songId}/${meta.revisionId}/${meta.image}/${trackIndex}.json`;
  const vocalIndex = pickSongsterrVocalTrack(meta);
  const [part, vocal] = await Promise.all([
    fetchPage(partUrl, ctx).then(JSON.parse),
    vocalIndex >= 0 && vocalIndex !== trackIndex
      ? fetchPage(`${SONGSTERR_CDN}/${meta.songId}/${meta.revisionId}/${meta.image}/${vocalIndex}.json`, ctx).then(JSON.parse).catch(() => null)
      : Promise.resolve(null),
  ]);
  let lyricEvents = [];
  try { lyricEvents = songsterrLyricEvents(vocal || part); } catch (err) { lyricEvents = []; }
  return {
    title: meta.title,
    artist: meta.artist,
    key: '?',
    capo: Number(part.capo) || 0,
    tuning: 'Standard',
    source: 'Songsterr',
    sourceUrl: url,
    track: track.name || track.instrument || '',
    lines: [],
    tabs: songsterrPartToTabs(part, lyricEvents),
  };
}

// ---------- YouTube lessons (played inside the app with YouTube's own embed player) ----------

// The results page is ~1.5MB; pulling just the fields we need with regexes keeps us far under
// the free plan's CPU limit instead of JSON-parsing the whole thing.
export function parseYoutubeSearch(html) {
  const out = [];
  const seen = new Set();
  const re = /"videoRenderer":\{"videoId":"([\w-]{11})"/g;
  let m;
  while ((m = re.exec(html)) && out.length < 12) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const chunk = html.slice(m.index, m.index + 8000);
    const title = chunk.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    const channel = chunk.match(/"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    const views = chunk.match(/"viewCountText":\{"simpleText":"([\d,.]+)/);
    const length = chunk.match(/"lengthText":\{(?:"accessibility":\{"accessibilityData":\{"label":"[^"]*"\}\},)?"simpleText":"([\d:]+)"/);
    if (!title || !length) continue; // skip live streams / shorts without a duration
    const unescape = (s) => JSON.parse(`"${s}"`);
    out.push({
      source: 'YouTube',
      category: 'videos',
      title: unescape(title[1]),
      artist: channel ? unescape(channel[1]) : '',
      type: 'Video lesson',
      rating: null,
      votes: 0,
      views: views ? Number(views[1].replace(/[,.]/g, '')) : 0,
      length: length[1],
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
    });
  }
  return out;
}

// ---------- Ranking: relevance to what was typed, then rating / popularity ----------

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

function relevance(query, r) {
  const q = normalize(query);
  if (!q.length) return 0;
  const hay = new Set(normalize(`${r.title} ${r.artist}`));
  const titleWords = normalize(r.title);
  const hits = q.filter((w) => hay.has(w)).length / q.length;
  const exactTitle = titleWords.join(' ') === q.join(' ') ? 0.15 : 0;
  // Long YouTube titles shouldn't win just because they repeat words; short exact titles should.
  return Math.min(1, hits + exactTitle);
}

function quality(r) {
  const log = (n, max) => Math.min(1, Math.log10((n || 0) + 1) / max);
  if (r.source === 'Ultimate Guitar') {
    // Bayesian average so a 5★ from 2 votes doesn't beat 4.8★ from 12,000.
    const bayes = ((r.rating || 0) * r.votes + 4 * 20) / (r.votes + 20);
    return 0.6 * (bayes / 5) + 0.4 * log(r.votes, 4);
  }
  if (r.source === 'Songsterr') return 0.3 + 0.7 * log(r.views, 6);
  if (r.source === 'YouTube') {
    // Music videos and live clips aren't lessons; keep them, but well below real lessons.
    const isLesson = /lesson|tutorial|how to play|chords|tab|easy guitar|acordes|c[oó]mo tocar|aprende|clase/i.test(r.title);
    return isLesson ? log(r.views, 7) : -0.6;
  }
  return 0.5; // LaCuerda shows no ratings
}

// Star rating adjusted for vote count: a handful of votes is pulled toward an average 3.5★,
// so 4.8★ from 12,000 people outranks 5★ from 2.
function adjustedStars(r) {
  if (!r.rating) return null;
  const prior = 10;
  return (r.rating * r.votes + 3.5 * prior) / (r.votes + prior);
}

// Highest rated first. Results that match only part of what was typed go below full matches;
// sites without star ratings (Songsterr, LaCuerda, YouTube) follow, ordered by popularity.
export function rankResults(query, results) {
  return results
    .map((r) => {
      const rel = relevance(query, r);
      return { ...r, relevance: Math.round(rel * 100), stars: adjustedStars(r), score: Math.round(quality(r) * 1000) / 1000 };
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => {
      const fullA = a.relevance >= 99 ? 0 : 1;
      const fullB = b.relevance >= 99 ? 0 : 1;
      if (fullA !== fullB) return fullA - fullB;
      if ((a.stars != null) !== (b.stars != null)) return a.stars != null ? -1 : 1;
      if (a.stars != null && b.stars !== a.stars) return b.stars - a.stars;
      return b.score - a.score;
    });
}

// ---------- HTTP ----------

async function fetchPage(url, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(url);
  const hit = await cache.match(cacheKey);
  if (hit) return hit.text();
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9,es;q=0.8' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${new URL(url).hostname} answered ${res.status}`);
  const text = await res.text();
  ctx.waitUntil(
    cache.put(cacheKey, new Response(text, { headers: { 'Cache-Control': `max-age=${CACHE_SECONDS}`, 'Content-Type': 'text/html' } }))
  );
  return text;
}

// Access codes live in the ACCESS_CODES secret (set with `wrangler secret put ACCESS_CODES`),
// never in this public repo. Format: "name:code,name:code". No secret set = nobody gets in.
function accessName(request, env) {
  const given = (request.headers.get('X-Access-Code') || '').trim().toLowerCase();
  if (!given) return null;
  for (const pair of (env.ACCESS_CODES || '').split(',')) {
    const i = pair.indexOf(':');
    if (i > 0 && pair.slice(i + 1).trim().toLowerCase() === given) return pair.slice(0, i).trim();
  }
  return null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Access-Code',
    'Vary': 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });
    if (!accessName(request, env)) return json({ error: 'Access code needed', needCode: true }, 401, origin);

    const url = new URL(request.url);
    try {
      if (url.pathname === '/search') {
        const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
        if (!q) return json({ error: 'Type a song name' }, 400, origin);
        const enc = encodeURIComponent(q);
        // [name, fetch+parse, max results kept per category]
        const sources = [
          ['Ultimate Guitar', () => fetchPage(`https://www.ultimate-guitar.com/search.php?search_type=title&value=${enc}`, ctx).then(parseUgSearch), 10],
          ['Songsterr', () => fetchPage(`https://www.songsterr.com/api/songs?pattern=${enc}&size=20`, ctx).then((t) => parseSongsterrSearch(JSON.parse(t))), 6],
          ['LaCuerda', () => fetchPage(`https://acordes.lacuerda.net/busca.php?exp=${enc}`, ctx).then(parseLacuerdaSearch), 6],
          ['YouTube', () => fetchPage(`https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' guitar lesson')}`, ctx).then(parseYoutubeSearch), 10],
        ];
        const settled = await Promise.allSettled(sources.map(([, run]) => run()));
        let results = [];
        const errors = [];
        settled.forEach((s, i) => {
          const [name, , limit] = sources[i];
          if (s.status !== 'fulfilled') { errors.push(`${name}: ${s.reason.message}`); return; }
          const perCategory = {};
          s.value.forEach((r) => {
            perCategory[r.category] = (perCategory[r.category] || 0) + 1;
            if (perCategory[r.category] <= limit) results.push(r);
          });
        });
        results = rankResults(q, results);
        return json({ results, errors }, 200, origin);
      }

      if (url.pathname === '/song') {
        const target = new URL(url.searchParams.get('url') || '');
        if (target.protocol !== 'https:') throw new Error('Bad link');
        if (target.hostname === 'tabs.ultimate-guitar.com') {
          return json(parseUgSong(await fetchPage(target.href, ctx), target.href), 200, origin);
        }
        if (target.hostname === 'acordes.lacuerda.net') {
          return json(parseLacuerdaSong(await fetchPage(target.href, ctx), target.href), 200, origin);
        }
        if (target.hostname === 'www.songsterr.com' && /^\/a\/wsa\/[\w-]+-tab-s\d+$/.test(target.pathname)) {
          return json(await loadSongsterrTab(await fetchPage(target.href, ctx), target.href, ctx), 200, origin);
        }
        if (target.hostname === 'www.songsterr.com' && /^\/a\/wsa\/[\w-]+-chords-s\d+$/.test(target.pathname)) {
          return json(parseSongsterrSong(await fetchPage(target.href, ctx), target.href), 200, origin);
        }
        return json({ error: 'Only Ultimate Guitar, Songsterr and LaCuerda links are supported' }, 400, origin);
      }

      return json({ error: 'Not found' }, 404, origin);
    } catch (err) {
      return json({ error: err.message || 'Something went wrong' }, 502, origin);
    }
  },
};
