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
    .filter((r) => r.type === 'Chords' && r.tab_url && /^https:\/\/tabs\.ultimate-guitar\.com\/tab\//.test(r.tab_url))
    .map((r) => ({
      source: 'Ultimate Guitar',
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
  const raw = content
    .replace(/\r/g, '')
    .replace(/\[\/?tab\]/g, '')
    .split('\n')
    .map((l) => {
      const r = splitMarkedLine(l, /\[ch\](.*?)\[\/ch\]/g);
      return r.preInlined ? { text: r.text, chords: null, preInlined: true } : r;
    });
  return {
    title: data.tab.song_name,
    artist: data.tab.artist_name,
    key: meta.tonality || data.tab.tonality_name || '?',
    capo: Number(meta.capo) || 0,
    tuning: (meta.tuning && meta.tuning.name) || 'Standard',
    source: 'Ultimate Guitar',
    sourceUrl: url,
    lines: inlineKeepingPreInlined(raw),
  };
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

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const url = new URL(request.url);
    try {
      if (url.pathname === '/search') {
        const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
        if (!q) return json({ error: 'Type a song name' }, 400, origin);
        const [ug, lc] = await Promise.allSettled([
          fetchPage(`https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}`, ctx).then(parseUgSearch),
          fetchPage(`https://acordes.lacuerda.net/busca.php?exp=${encodeURIComponent(q)}`, ctx).then(parseLacuerdaSearch),
        ]);
        const results = [
          ...(ug.status === 'fulfilled' ? ug.value.slice(0, 10) : []),
          ...(lc.status === 'fulfilled' ? lc.value.slice(0, 10) : []),
        ];
        const errors = [ug, lc].filter((r) => r.status === 'rejected').map((r) => r.reason.message);
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
        return json({ error: 'Only Ultimate Guitar and LaCuerda links are supported' }, 400, origin);
      }

      return json({ error: 'Not found' }, 404, origin);
    } catch (err) {
      return json({ error: err.message || 'Something went wrong' }, 502, origin);
    }
  },
};
