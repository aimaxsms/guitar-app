// Song analyzer: turns a recording (audio file or something recorded here) into a chord chart,
// key, tempo, strumming guess and tab for single-note riffs. Note detection uses Spotify's
// open-source Basic Pitch model (vendor/basic-pitch), running entirely in this browser.

const SA_TF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/tensorflow/3.21.0/tf.min.js';
const SA_BP_URL = 'vendor/basic-pitch/basic-pitch.js';
const SA_MODEL_URL = 'vendor/basic-pitch/model/model.json';
const SA_MAX_SECONDS = 6 * 60;
const SA_OPEN_STRINGS = [64, 59, 55, 50, 45, 40]; // high e … low E (MIDI)

let saBasicPitch = null;

function saLoadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Couldn't load ${src.split('/').pop()}`));
    document.head.appendChild(s);
  });
}

async function saEnsureModel() {
  if (saBasicPitch) return saBasicPitch;
  if (!window.tf) await saLoadScript(SA_TF_URL);
  if (!window.BasicPitchLite) await saLoadScript(SA_BP_URL);
  saBasicPitch = new BasicPitchLite.BasicPitch(SA_MODEL_URL);
  await saBasicPitch.model;
  return saBasicPitch;
}

// Any audio the browser can play -> mono Float32Array at Basic Pitch's 22,050 Hz.
async function saDecodeToMono(arrayBuffer) {
  const ctx = getSharedAudioContext();
  const decoded = await new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (p && p.then) p.then(resolve, reject);
  });
  const seconds = Math.min(decoded.duration, SA_MAX_SECONDS);
  const rate = BasicPitchLite.SAMPLE_RATE;
  const offline = new OfflineAudioContext(1, Math.ceil(seconds * rate), rate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return { samples: rendered.getChannelData(0), seconds, trimmed: decoded.duration > SA_MAX_SECONDS };
}

async function saTranscribe(samples, onProgress) {
  const bp = await saEnsureModel();
  const frames = [];
  const onsets = [];
  await bp.evaluateModel(
    samples,
    (f, o) => { frames.push(...f); onsets.push(...o); },
    (pct) => onProgress(pct)
  );
  const notes = BasicPitchLite.noteFramesToTime(BasicPitchLite.outputToNotesPoly(frames, onsets, 0.5, 0.3, 5));
  return notes
    .filter((n) => n.pitchMidi >= 28 && n.pitchMidi <= 96 && n.durationSeconds > 0)
    .map((n) => ({ t: n.startTimeSeconds, d: n.durationSeconds, p: n.pitchMidi, a: n.amplitude }))
    .sort((a, b) => a.t - b.t || a.p - b.p);
}

// ---------- tempo & beats ----------
function saBeats(notes, seconds) {
  const rate = 100; // onset envelope at 10 ms
  const env = new Float32Array(Math.ceil(seconds * rate) + 1);
  notes.forEach((n) => {
    const i = Math.round(n.t * rate);
    if (i >= 0 && i < env.length) env[i] += n.a;
  });
  const smooth = new Float32Array(env.length);
  for (let i = 0; i < env.length; i++) smooth[i] = env[i] + 0.5 * ((env[i - 1] || 0) + (env[i + 1] || 0));

  let best = { bpm: 100, score: -1 };
  for (let bpm = 60; bpm <= 180; bpm++) {
    const lag = (60 / bpm) * rate;
    const l0 = Math.floor(lag);
    const frac = lag - l0;
    let ac = 0;
    for (let i = 0; i + l0 + 1 < smooth.length; i++) ac += smooth[i] * ((1 - frac) * smooth[i + l0] + frac * smooth[i + l0 + 1]);
    const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 105) / 0.8, 2));
    const score = ac * prior;
    if (score > best.score) best = { bpm, score };
  }
  // Fine-tune tempo and phase together (0.05 BPM steps) so the beat grid doesn't drift over a
  // long song: a 1 BPM error is already a third of a beat off after 8 bars.
  const alignScore = (period, off) => {
    let s = 0;
    for (let x = off; x < smooth.length; x += period) {
      const i = Math.round(x);
      s += Math.max(smooth[i] || 0, 0.7 * (smooth[i - 1] || 0), 0.7 * (smooth[i + 1] || 0));
    }
    return s;
  };
  let fit = { bpm: best.bpm, off: 0, score: -1 };
  for (let bpm = best.bpm - 1.5; bpm <= best.bpm + 1.5; bpm += 0.05) {
    const period = (60 / bpm) * rate;
    for (let off = 0; off < period; off++) {
      const s = alignScore(period, off);
      if (s > fit.score) fit = { bpm, off, score: s };
    }
  }
  const period = (60 / fit.bpm) * rate;
  const beats = [];
  for (let x = fit.off; x / rate < seconds; x += period) beats.push(x / rate);
  return { bpm: Math.round(fit.bpm), beats, beatDur: 60 / fit.bpm };
}

// ---------- chords ----------
const SA_QUALITIES_SIMPLE = { '': [0, 4, 7], m: [0, 3, 7] };
const SA_QUALITIES_DETAILED = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
  sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6],
};

function saTemplates(detailed) {
  const quals = detailed ? SA_QUALITIES_DETAILED : SA_QUALITIES_SIMPLE;
  const out = [];
  for (let root = 0; root < 12; root++) {
    Object.entries(quals).forEach(([suffix, ivs]) => {
      const v = new Array(12).fill(0);
      ivs.forEach((iv, k) => { v[(root + iv) % 12] = k === 0 ? 1 : k === 3 ? 0.6 : 0.85; });
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      out.push({ name: NOTE_NAMES[root] + suffix, root, v: v.map((x) => x / norm), penalty: ivs.length > 3 ? 0.03 : 0 });
    });
  }
  return out;
}

function saChroma(notes, from, to) {
  const c = new Array(12).fill(0);
  const bass = new Array(12).fill(0);
  let lowest = null;
  notes.forEach((n) => {
    const ov = Math.min(n.t + n.d, to) - Math.max(n.t, from);
    if (ov <= 0) return;
    const w = n.a * ov;
    c[n.p % 12] += w;
    if (n.p < 55) bass[n.p % 12] += w;
    if (!lowest || n.p < lowest.p) lowest = n;
  });
  return { c, bass, energy: c.reduce((s, x) => s + x, 0) };
}

function saChordPerBeat(notes, beats, beatDur, templates) {
  const chromas = beats.map((b) => saChroma(notes, b, b + beatDur));
  const maxEnergy = Math.max(...chromas.map((x) => x.energy), 1e-9);
  const N = templates.length; // index N = no chord
  const scores = chromas.map(({ c, bass, energy }) => {
    const row = new Array(N + 1).fill(0);
    const norm = Math.sqrt(c.reduce((s, x) => s + x * x, 0)) || 1;
    const bassSum = bass.reduce((s, x) => s + x, 0) || 1;
    templates.forEach((tpl, i) => {
      let dot = 0;
      for (let k = 0; k < 12; k++) dot += (c[k] / norm) * tpl.v[k];
      row[i] = dot + 0.15 * (bass[tpl.root] / bassSum) - tpl.penalty;
    });
    row[N] = energy < maxEnergy * 0.04 ? 1 : 0.35; // silence → "no chord"
    return row;
  });
  // Viterbi: best labels with a penalty for changing chord, so it doesn't flicker beat to beat.
  const SWITCH = 0.22;
  let prev = scores[0].slice();
  const back = [];
  for (let t = 1; t < scores.length; t++) {
    let bestPrev = 0;
    for (let j = 1; j <= N; j++) if (prev[j] > prev[bestPrev]) bestPrev = j;
    const cur = new Array(N + 1);
    const ptr = new Array(N + 1);
    for (let j = 0; j <= N; j++) {
      const stay = prev[j];
      const move = prev[bestPrev] - SWITCH;
      if (stay >= move) { cur[j] = stay + scores[t][j]; ptr[j] = j; } else { cur[j] = move + scores[t][j]; ptr[j] = bestPrev; }
    }
    back.push(ptr);
    prev = cur;
  }
  let state = 0;
  for (let j = 1; j <= N; j++) if (prev[j] > prev[state]) state = j;
  const labels = new Array(scores.length);
  labels[scores.length - 1] = state;
  for (let t = scores.length - 2; t >= 0; t--) { state = back[t][state]; labels[t] = state; }
  return { labels: labels.map((i) => (i === N ? null : templates[i].name)), chromas };
}

// ---------- key ----------
const SA_MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const SA_MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function saKey(chromas) {
  const total = new Array(12).fill(0);
  chromas.forEach(({ c }) => c.forEach((v, k) => (total[k] += v)));
  const corr = (a, b) => {
    const ma = a.reduce((s, x) => s + x, 0) / 12;
    const mb = b.reduce((s, x) => s + x, 0) / 12;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < 12; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return num / Math.sqrt(da * db || 1);
  };
  let best = { name: '?', r: -2 };
  for (let k = 0; k < 12; k++) {
    const rot = (prof) => prof.map((_, i) => prof[(i - k + 12) % 12]);
    const rMaj = corr(total, rot(SA_MAJOR_PROFILE));
    const rMin = corr(total, rot(SA_MINOR_PROFILE));
    if (rMaj > best.r) best = { name: NOTE_NAMES[k], r: rMaj };
    if (rMin > best.r) best = { name: NOTE_NAMES[k] + 'm', r: rMin };
  }
  return best.name;
}

// ---------- strumming & riffs ----------
// Groups notes that start together (a strum) into events.
// A strum rolls across the strings over ~50-80 ms, so notes that follow each other within 30 ms
// are chained into the same event.
function saEvents(notes) {
  const events = [];
  let lastT = -Infinity;
  notes.forEach((n) => {
    const last = events[events.length - 1];
    if (last && n.t - lastT < 0.03) last.notes.push(n);
    else events.push({ t: n.t, notes: [n] });
    lastT = n.t;
  });
  return events;
}

function saStrumPattern(events, beats, beatDur, bpm) {
  const counts = {};
  for (let b = 0; b + 4 <= beats.length; b += 4) {
    const start = beats[b];
    const slots = new Array(8).fill(false);
    let strums = 0;
    events.forEach((e) => {
      if (e.notes.length < 3 || e.t < start - beatDur / 4 || e.t >= start + 4 * beatDur - beatDur / 4) return;
      const slot = Math.round((e.t - start) / (beatDur / 2));
      if (slot >= 0 && slot < 8) { slots[slot] = true; strums++; }
    });
    if (strums >= 2) {
      const key = slots.map((x) => (x ? 1 : 0)).join('');
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 2) return [];
  const codes = top[0].split('').map((x, i) => (x === '1' ? (i % 2 === 0 ? 1 : 101) : 202));
  return [{ part: 'Detected from the recording', bpm, den: 8, triplet: false, codes }];
}

// Easiest playable path for a run of notes: small stretches, low frets, few string jumps.
function saFingering(seq) {
  const cands = seq.map((n) => {
    const opts = [];
    SA_OPEN_STRINGS.forEach((open, s) => {
      const f = n.p - open;
      if (f >= 0 && f <= 17) opts.push({ s, f });
    });
    return opts;
  });
  if (cands.some((c) => !c.length)) return null;
  let cost = cands[0].map((c) => 0.05 * c.f);
  const back = [];
  for (let i = 1; i < cands.length; i++) {
    const next = [];
    const ptr = [];
    cands[i].forEach((c) => {
      let best = Infinity, bi = 0;
      cands[i - 1].forEach((pc, j) => {
        const jump = c.f === 0 || pc.f === 0 ? 0 : Math.abs(c.f - pc.f);
        const v = cost[j] + jump + 0.3 * Math.abs(c.s - pc.s) + 0.05 * c.f + (c.f > 12 ? 0.5 : 0);
        if (v < best) { best = v; bi = j; }
      });
      next.push(best);
      ptr.push(bi);
    });
    back.push(ptr);
    cost = next;
  }
  let k = cost.indexOf(Math.min(...cost));
  const path = new Array(cands.length);
  for (let i = cands.length - 1; i >= 0; i--) {
    path[i] = cands[i][k];
    if (i > 0) k = back[i - 1][k];
  }
  return path;
}

function saRiffTabs(events, beats, beatDur, barCount) {
  // A bar counts as "single notes" when almost every event in it is one note.
  // Notes played a hair before the beat still belong to the bar they start (1/32-note grace).
  const barOf = (t) => Math.floor((t - beats[0] + beatDur / 8) / (4 * beatDur));
  const perBar = Array.from({ length: barCount }, () => []);
  events.forEach((e) => { const b = barOf(e.t); if (b >= 0 && b < barCount) perBar[b].push(e); });
  // A bar is a single-note riff when, on average, few notes ring at once (strummed chords keep
  // 3+ strings ringing; riffs stay around 1-2). Quiet ghost notes are ignored.
  const allNotes = events.flatMap((e) => e.notes).filter((n) => n.a >= 0.4);
  const isLead = perBar.map((evs, b) => {
    if (evs.length < 3) return false;
    const from = beats[0] + b * 4 * beatDur;
    const to = from + 4 * beatDur;
    let ringing = 0;
    allNotes.forEach((n) => {
      const ov = Math.min(n.t + n.d, to) - Math.max(n.t, from);
      if (ov > 0) ringing += ov;
    });
    return ringing / (to - from) <= 2.6;
  });

  const passages = [];
  for (let b = 0; b < barCount; b++) {
    if (!isLead[b]) continue;
    let e = b;
    while (e + 1 < barCount && isLead[e + 1] && e - b < 7) e++;
    passages.push([b, e]);
    b = e;
  }
  const labels = ['e', 'B', 'G', 'D', 'A', 'E'];
  const COL = 2; // characters per sixteenth note (a bar fits a phone screen)
  return passages.slice(0, 4).map(([b0, b1], idx) => {
    // Pick the note each event actually adds. The model re-reports notes that are still ringing
    // and sometimes hears a quiet octave ghost, so: ignore quiet notes, prefer a pitch that wasn't
    // sounding in the previous event, then take the loudest. Skip what a guitar can't play.
    let prevPitches = new Set();
    const evs = [];
    perBar.slice(b0, b1 + 1).flat().forEach((e) => {
      const loudest = Math.max(...e.notes.map((n) => n.a));
      const real = e.notes.filter((n) => n.a >= 0.4 && n.a >= 0.6 * loudest && n.p >= 40 && n.p <= 81);
      if (!real.length) return;
      const fresh = real.filter((n) => !prevPitches.has(n.p));
      const pick = (fresh.length ? fresh : real).reduce((best, n) => (n.a > best.a ? n : best));
      prevPitches = new Set(real.map((n) => n.p));
      evs.push({ t: e.t, top: pick });
    });
    const path = saFingering(evs.map((e) => e.top)) || evs.map(() => null);
    const nBars = b1 - b0 + 1;
    const rows = labels.map(() => Array.from({ length: nBars }, () => '-'.repeat(16 * COL)));
    evs.forEach((e, i) => {
      const pos = path[i];
      if (!pos) return;
      const rel = (e.t - beats[0]) / beatDur - b0 * 4;
      const bar = Math.floor((rel + 0.125) / 4);
      const col = Math.max(0, Math.min(15, Math.round((rel - bar * 4) * 4)));
      if (bar < 0 || bar >= nBars) return;
      const str = String(pos.f);
      const row = rows[pos.s][bar];
      rows[pos.s][bar] = row.slice(0, col * COL) + str + row.slice(col * COL + str.length);
    });
    const startSec = beats[0] + b0 * 4 * beatDur;
    return {
      label: `Riff ${idx + 1} (${saClock(startSec)})`,
      tab: labels.map((l, s) => `${l}|${rows[s].join('|')}|`).join('\n'),
    };
  });
}

const saClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

function saAnalyze(notes, seconds, { detailed }) {
  if (notes.length < 8) throw new Error('Not enough notes were heard. Try a louder or clearer recording.');
  const { bpm, beats, beatDur } = saBeats(notes, seconds);
  const templates = saTemplates(detailed);
  const { labels, chromas } = saChordPerBeat(notes, beats, beatDur, templates);
  const key = saKey(chromas);

  const barCount = Math.ceil(beats.length / 4);
  const bars = [];
  for (let b = 0; b < barCount; b++) {
    const ls = labels.slice(b * 4, b * 4 + 4);
    const counts = new Map();
    ls.forEach((l) => { if (l) counts.set(l, (counts.get(l) || 0) + 1); });
    let names = [...new Set(ls.filter(Boolean))];
    // A chord heard for a single beat next to a longer one is usually the last chord still
    // ringing (or a passing chord), so round it away.
    if (names.length > 1) names = names.filter((n) => counts.get(n) >= 2);
    if (names.length > 2) names = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2).map((x) => x[0]);
    if (!names.length && counts.size) names = [[...counts.entries()].sort((x, y) => y[1] - x[1])[0][0]];
    names.sort((x, y) => ls.indexOf(x) - ls.indexOf(y));
    bars.push(names);
  }
  // Drop silent bars at the start and end.
  while (bars.length && !bars[0].length) { bars.shift(); beats.splice(0, 4); }
  while (bars.length && !bars[bars.length - 1].length) bars.pop();

  const lines = [];
  for (let i = 0; i < bars.length; i += 4) {
    const start = beats[i * 4] != null ? beats[i * 4] : 0;
    const cells = bars.slice(i, i + 4).map((names) => (names.length ? names.map((n) => `[${n}]`).join(' ') : '–'));
    lines.push(`${saClock(start)}  | ${cells.join(' | ')} |`);
  }
  const events = saEvents(notes);
  const strums = saStrumPattern(events, beats, beatDur, bpm);
  const tabs = saRiffTabs(events, beats, beatDur, bars.length);
  const chordSet = [...new Set(bars.flat())];
  return { bpm, key, lines, tabs, strums, chordSet, barCount: bars.length };
}

// ---------- UI ----------
(function setupSongAnalyzer() {
  const fileInput = document.getElementById('analyzerFile');
  const recordBtn = document.getElementById('analyzerRecordBtn');
  const detailedBox = document.getElementById('analyzerDetailed');
  const statusEl = document.getElementById('analyzerStatus');
  const barEl = document.getElementById('analyzerProgress');
  const resultEl = document.getElementById('analyzerResult');
  if (!fileInput) return;

  let busy = false;
  const setStatus = (t) => { statusEl.textContent = t; };
  const setProgress = (p) => {
    barEl.style.display = p == null ? 'none' : '';
    if (p != null) barEl.firstElementChild.style.width = `${Math.round(p * 100)}%`;
  };

  async function run(arrayBuffer, name) {
    if (busy) return;
    busy = true;
    resultEl.innerHTML = '';
    fileInput.disabled = true;
    try {
      setStatus('Reading the audio…');
      setProgress(0);
      if (!window.BasicPitchLite) {
        setStatus('Loading the note-detection model (first time only)…');
        await saEnsureModel();
      }
      const { samples, seconds, trimmed } = await saDecodeToMono(arrayBuffer);
      setStatus('Listening for notes…');
      await saEnsureModel();
      const notes = await saTranscribe(samples, (p) => {
        setProgress(p * 0.95);
        setStatus(`Listening for notes… ${Math.round(p * 100)}%`);
      });
      setStatus('Working out the chords, key and tempo…');
      await new Promise((r) => setTimeout(r, 0));
      const a = saAnalyze(notes, seconds, { detailed: detailedBox.checked });
      setProgress(1);

      const title = (name || 'Recording').replace(/\.[a-z0-9]+$/i, '');
      const saved = addMySong({
        title,
        artist: 'Analyzed recording',
        key: a.key,
        capo: 0,
        tuning: 'Standard',
        lines: [`Tempo: about ${a.bpm} BPM · Key: ${a.key} · AI guess, check it by ear`, '', ...a.lines],
        tabs: a.tabs,
        strums: a.strums,
        source: 'Song analyzer',
      });
      refreshSheetSongOptions(saved.id);

      resultEl.innerHTML = '';
      const summary = document.createElement('div');
      summary.className = 'analyzer-summary';
      summary.innerHTML = `
        <div><strong>Key:</strong> ${a.key} &nbsp; <strong>Tempo:</strong> ~${a.bpm} BPM &nbsp; <strong>Bars:</strong> ${a.barCount}</div>
        <div><strong>Chords:</strong> ${a.chordSet.join(', ') || '—'}</div>
        <div><strong>Riffs tabbed:</strong> ${a.tabs.length || 'none (mostly chords)'}${a.strums.length ? ' · <strong>Strumming:</strong> detected' : ''}</div>`;
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'start-btn';
      open.textContent = 'Open in Chord Sheets';
      open.addEventListener('click', () => {
        const btn = document.querySelector('.tab-btn[data-tab="sheets"]');
        if (btn) btn.click();
        refreshSheetSongOptions(saved.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      resultEl.appendChild(summary);
      resultEl.appendChild(open);
      setStatus(`Done! Saved "${title}" to My Songs.${trimmed ? ' (Only the first 6 minutes were analyzed.)' : ''}`);
    } catch (err) {
      console.error(err);
      setStatus(`Couldn't analyze that recording: ${err.message || err}`);
    } finally {
      setProgress(null);
      busy = false;
      fileInput.disabled = false;
      fileInput.value = '';
    }
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    run(await file.arrayBuffer(), file.name);
  });

  // Record straight from the mic, then analyze.
  let recorder = null;
  let chunks = [];
  let stream = null;
  let recordTimer = null;
  if (!window.MediaRecorder || !navigator.mediaDevices) {
    recordBtn.style.display = 'none';
  } else {
    recordBtn.addEventListener('click', async () => {
      if (busy && !recorder) return;
      if (recorder) { recorder.stop(); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      } catch (err) {
        setStatus('Microphone access was blocked. Allow it for this site to record.');
        return;
      }
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        clearInterval(recordTimer);
        stream.getTracks().forEach((t) => t.stop());
        recordBtn.textContent = '🎙 Record';
        recordBtn.classList.remove('recording');
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        recorder = null;
        const stamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        run(await blob.arrayBuffer(), `My recording ${stamp}`);
      };
      recorder.start();
      const started = Date.now();
      recordBtn.textContent = '⏹ Stop & analyze';
      recordBtn.classList.add('recording');
      recordTimer = setInterval(() => {
        const s = (Date.now() - started) / 1000;
        setStatus(`Recording… ${saClock(s)} (tap Stop when you're done)`);
        if (s >= SA_MAX_SECONDS && recorder) recorder.stop();
      }, 250);
    });
  }
})();
