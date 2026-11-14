/*
 * Basic Pitch (polyphonic note detection) by Spotify, adapted to run as a plain browser script.
 * Original: https://github.com/spotify/basic-pitch-ts  (@spotify/basic-pitch 1.0.1)
 * Copyright 2022 Spotify AB. Licensed under the Apache License, Version 2.0 (see LICENSE here).
 *
 * Changes from the original: uses the global `tf` (TensorFlow.js loaded separately) instead of
 * ES module imports; MIDI file export and pitch bends were removed; the model is loaded from a
 * URL passed in; the "melodia" pass finds its next peak with a cached per-frame maximum instead
 * of rescanning every frame (same result, much faster on long recordings).
 */
(function () {
  const OUTPUT_TO_TENSOR_NAME = { contours: 'Identity', onsets: 'Identity_2', frames: 'Identity_1' };
  const AUDIO_SAMPLE_RATE = 22050;
  const FFT_HOP = 256;
  const ANNOTATIONS_FPS = Math.floor(AUDIO_SAMPLE_RATE / FFT_HOP);
  const AUDIO_WINDOW_LENGTH_SECONDS = 2;
  const AUDIO_N_SAMPLES = AUDIO_SAMPLE_RATE * AUDIO_WINDOW_LENGTH_SECONDS - FFT_HOP;
  const N_OVERLAPPING_FRAMES = 30;
  const N_OVERLAP_OVER_2 = Math.floor(N_OVERLAPPING_FRAMES / 2);
  const OVERLAP_LENGTH_FRAMES = N_OVERLAPPING_FRAMES * FFT_HOP;
  const HOP_SIZE = AUDIO_N_SAMPLES - OVERLAP_LENGTH_FRAMES;

  const MIDI_OFFSET = 21;
  const ANNOT_N_FRAMES = ANNOTATIONS_FPS * AUDIO_WINDOW_LENGTH_SECONDS;
  const WINDOW_OFFSET = (FFT_HOP / AUDIO_SAMPLE_RATE) * (ANNOT_N_FRAMES - AUDIO_N_SAMPLES / FFT_HOP) + 0.0018;
  const MAX_FREQ_IDX = 87;

  class BasicPitch {
    constructor(modelUrl) {
      this.model = tf.loadGraphModel(modelUrl);
    }

    async evaluateModel(audio, onComplete, percentCallback) {
      const model = await this.model;
      const wav = tf.concat1d([tf.zeros([Math.floor(OVERLAP_LENGTH_FRAMES / 2)], 'float32'), tf.tensor(audio)]);
      const framed = tf.expandDims(tf.signal.frame(wav, AUDIO_N_SAMPLES, HOP_SIZE, true, 0), -1);
      wav.dispose();
      const nOutputFramesOriginal = Math.floor(audio.length * (ANNOTATIONS_FPS / AUDIO_SAMPLE_RATE));
      let calculated = 0;
      const unwrap = (t) => {
        const sliced = t.slice([0, N_OVERLAP_OVER_2, 0], [-1, t.shape[1] - 2 * N_OVERLAP_OVER_2, -1]);
        const s = sliced.shape;
        const r = sliced.reshape([s[0] * s[1], s[2]]);
        sliced.dispose();
        return r;
      };
      for (let i = 0; i < framed.shape[0]; ++i) {
        percentCallback(i / framed.shape[0]);
        const batch = tf.slice(framed, i, 1);
        const out = model.execute(batch, [OUTPUT_TO_TENSOR_NAME.frames, OUTPUT_TO_TENSOR_NAME.onsets, OUTPUT_TO_TENSOR_NAME.contours]);
        batch.dispose();
        let frames = unwrap(out[0]);
        let onsets = unwrap(out[1]);
        out.forEach((t) => t.dispose());
        const n = frames.shape[0];
        if (calculated < nOutputFramesOriginal) {
          if (n + calculated >= nOutputFramesOriginal) {
            const keep = nOutputFramesOriginal - calculated;
            const f2 = frames.slice([0, 0], [keep, -1]);
            const o2 = onsets.slice([0, 0], [keep, -1]);
            frames.dispose();
            onsets.dispose();
            frames = f2;
            onsets = o2;
          }
          calculated += n;
          onComplete(await frames.array(), await onsets.array());
        }
        frames.dispose();
        onsets.dispose();
        // Let the page repaint between windows so the progress bar moves.
        await new Promise((r) => setTimeout(r, 0));
      }
      framed.dispose();
      percentCallback(1);
    }
  }

  function globalMax(array) {
    let m = 0;
    for (const row of array) for (const v of row) if (v > m) m = v;
    return m;
  }

  function getInferredOnsets(onsets, frames, nDiff = 2) {
    const nF = frames.length;
    const nP = frames[0].length;
    // min over n=1..nDiff of (frames[t] - frames[t-n]), clipped at 0
    const frameDiff = [];
    for (let t = 0; t < nF; t++) {
      const row = new Array(nP).fill(0);
      if (t >= nDiff) {
        for (let p = 0; p < nP; p++) {
          let m = Infinity;
          for (let n = 1; n <= nDiff; n++) m = Math.min(m, frames[t][p] - frames[t - n][p]);
          row[p] = Math.max(m, 0);
        }
      }
      frameDiff.push(row);
    }
    const onsetMax = globalMax(onsets);
    const diffMax = globalMax(frameDiff) || 1;
    return onsets.map((row, t) => row.map((v, p) => Math.max(v, (onsetMax * frameDiff[t][p]) / diffMax)));
  }

  function outputToNotesPoly(frames, onsets, onsetThresh = 0.5, frameThresh = 0.3, minNoteLen = 5, energyTolerance = 11) {
    const nFrames = frames.length;
    if (!nFrames) return [];
    const inferred = getInferredOnsets(onsets, frames);
    const nP = inferred[0].length;

    // Peaks of onset activation along time (order 1), above the threshold.
    const starts = [];
    for (let p = 0; p < nP; p++) {
      for (let t = 0; t < nFrames; t++) {
        const v = inferred[t][p];
        const prev = t > 0 ? inferred[t - 1][p] : -Infinity;
        const next = t < nFrames - 1 ? inferred[t + 1][p] : -Infinity;
        if (v > prev && v > next && v > onsetThresh) starts.push([t, p]);
      }
    }
    // Original walks peaks in reverse (time-major order) when claiming energy.
    starts.sort((a, b) => b[0] - a[0] || b[1] - a[1]);

    const remaining = frames.map((f) => f.slice());
    const notes = [];
    for (const [start, p] of starts) {
      if (start >= nFrames - 1) continue;
      let i = start + 1;
      let k = 0;
      while (i < nFrames - 1 && k < energyTolerance) {
        k = remaining[i][p] < frameThresh ? k + 1 : 0;
        i += 1;
      }
      i -= k;
      if (i - start <= minNoteLen) continue;
      for (let j = start; j < i; ++j) {
        remaining[j][p] = 0;
        if (p < MAX_FREQ_IDX) remaining[j][p + 1] = 0;
        if (p > 0) remaining[j][p - 1] = 0;
      }
      let amp = 0;
      for (let j = start; j < i; j++) amp += frames[j][p];
      notes.push({ startFrame: start, durationFrames: i - start, pitchMidi: p + MIDI_OFFSET, amplitude: amp / (i - start) });
    }

    // "Melodia trick": pick up sustained notes that had no clear onset, loudest first.
    const rowMax = remaining.map((r) => Math.max(...r));
    const refresh = (t) => { rowMax[t] = Math.max(...remaining[t]); };
    let guard = 0;
    for (;;) {
      let iMid = 0;
      for (let t = 1; t < nFrames; t++) if (rowMax[t] > rowMax[iMid]) iMid = t;
      if (!(rowMax[iMid] > frameThresh) || guard++ > 20000) break;
      const row = remaining[iMid];
      let p = 0;
      for (let q = 1; q < row.length; q++) if (row[q] > row[p]) p = q;
      remaining[iMid][p] = 0;
      refresh(iMid);
      const clear = (t) => {
        remaining[t][p] = 0;
        if (p < MAX_FREQ_IDX) remaining[t][p + 1] = 0;
        if (p > 0) remaining[t][p - 1] = 0;
        refresh(t);
      };
      let i = iMid + 1;
      let k = 0;
      while (i < nFrames - 1 && k < energyTolerance) {
        k = remaining[i][p] < frameThresh ? k + 1 : 0;
        clear(i);
        i += 1;
      }
      const iEnd = i - 1 - k;
      i = iMid - 1;
      k = 0;
      while (i > 0 && k < energyTolerance) {
        k = remaining[i][p] < frameThresh ? k + 1 : 0;
        clear(i);
        i -= 1;
      }
      const iStart = i + 1 + k;
      if (iEnd - iStart <= minNoteLen) continue;
      let amp = 0;
      for (let j = iStart; j < iEnd; j++) amp += frames[j][p];
      notes.push({ startFrame: iStart, durationFrames: iEnd - iStart, pitchMidi: p + MIDI_OFFSET, amplitude: amp / (iEnd - iStart) });
    }
    return notes;
  }

  const modelFrameToTime = (frame) => (frame * FFT_HOP) / AUDIO_SAMPLE_RATE - WINDOW_OFFSET * Math.floor(frame / ANNOT_N_FRAMES);

  function noteFramesToTime(notes) {
    return notes.map((n) => ({
      pitchMidi: n.pitchMidi,
      amplitude: n.amplitude,
      startTimeSeconds: modelFrameToTime(n.startFrame),
      durationSeconds: modelFrameToTime(n.startFrame + n.durationFrames) - modelFrameToTime(n.startFrame),
    }));
  }

  window.BasicPitchLite = { BasicPitch, outputToNotesPoly, noteFramesToTime, SAMPLE_RATE: AUDIO_SAMPLE_RATE };
})();
