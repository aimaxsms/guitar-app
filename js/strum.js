const elBpm = document.getElementById('bpm');
const elBpmValue = document.getElementById('bpmValue');
const elBeatDots = document.getElementById('beatDots');
const elStrumStatus = document.getElementById('strumStatus');
const elHitResult = document.getElementById('hitResult');
const elStrumScore = document.getElementById('strumScore');
const elStrumAccuracy = document.getElementById('strumAccuracy');
const elCalibrateBtn = document.getElementById('calibrateBtn');
const elStrumStartBtn = document.getElementById('strumStartBtn');
const elStrumStopBtn = document.getElementById('strumStopBtn');

const BEATS_PER_LOOP = 4;

let strumStream = null;
let strumAudioContext = null;
let onsetNode = null;
let scheduler = null;
let latencyCompensationMs = 0;
let calibrated = false;
let mode = 'idle'; // idle | calibrating | running
let calibrationOnsets = [];
let hits = 0;
let totalScored = 0;

for (let i = 0; i < BEATS_PER_LOOP; i++) {
  const dot = document.createElement('div');
  dot.className = 'beat-dot';
  elBeatDots.appendChild(dot);
}
const dotEls = elBeatDots.querySelectorAll('.beat-dot');

elBpm.addEventListener('input', () => {
  elBpmValue.textContent = `${elBpm.value} BPM`;
  if (scheduler) scheduler.setBpm(Number(elBpm.value));
});

function flashBeat(beatIndex) {
  const dot = dotEls[beatIndex % BEATS_PER_LOOP];
  dot.classList.add('flash');
  setTimeout(() => dot.classList.remove('flash'), 120);
}

async function ensureStrumAudio() {
  if (strumAudioContext) return;

  if (!navigator.mediaDevices) {
    throw new Error('mic needs HTTPS (blocked on plain HTTP/insecure origin)');
  }

  strumStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });

  strumAudioContext = new AudioContext({ latencyHint: 'interactive' });
  await strumAudioContext.audioWorklet.addModule('js/onset-worklet.js');

  const source = strumAudioContext.createMediaStreamSource(strumStream);
  onsetNode = new AudioWorkletNode(strumAudioContext, 'onset-processor');
  onsetNode.port.onmessage = (event) => handleOnset(event.data.time);
  source.connect(onsetNode);

  scheduler = new BeatScheduler(strumAudioContext, {
    onBeat: (beatIndex, time) => {
      playClick(strumAudioContext, time, beatIndex % BEATS_PER_LOOP === 0);
      const delayMs = Math.max(0, (time - strumAudioContext.currentTime) * 1000);
      setTimeout(() => flashBeat(beatIndex), delayMs);
    },
  });
  scheduler.setBpm(Number(elBpm.value));
}

function handleOnset(time) {
  if (mode === 'calibrating') {
    calibrationOnsets.push(time);
    return;
  }
  if (mode !== 'running') return;

  const adjustedTime = time - latencyCompensationMs / 1000;
  scoreHit(adjustedTime);
}

function scoreHit(adjustedTime) {
  const delta = scheduler.nearestBeatDeltaMs(adjustedTime);
  if (delta === null) return;

  totalScored++;
  let label = null;
  if (Math.abs(delta) <= 30) {
    label = 'Perfect';
    hits++;
  } else if (Math.abs(delta) <= 70) {
    label = 'Good';
    hits++;
  } else if (Math.abs(delta) <= 150) {
    label = 'Off';
  }

  if (label) {
    elHitResult.textContent = `${label} (${delta > 0 ? '+' : ''}${delta.toFixed(0)} ms)`;
    elHitResult.className = `hit-result ${label.toLowerCase()}`;
  }

  elStrumScore.textContent = `${hits} / ${totalScored} hits`;
  elStrumAccuracy.textContent = totalScored ? `${Math.round((hits / totalScored) * 100)}% accuracy` : '';
}

elCalibrateBtn.addEventListener('click', async () => {
  try {
    await ensureStrumAudio();
  } catch (err) {
    elStrumStatus.textContent = `Mic error: ${err.message}`;
    return;
  }
  mode = 'calibrating';
  calibrationOnsets = [];
  elCalibrateBtn.disabled = true;
  elStrumStatus.textContent = 'Calibrating… strum along with the clicks';
  scheduler.start();
  setTimeout(finishCalibration, ((60 / Number(elBpm.value)) * (BEATS_PER_LOOP + 1)) * 1000);
});

function finishCalibration() {
  scheduler.stop();
  mode = 'idle';
  elCalibrateBtn.disabled = false;

  const offsets = calibrationOnsets
    .map((onsetTime) => scheduler.nearestBeatDeltaMs(onsetTime))
    .filter((delta) => delta !== null && Math.abs(delta) < 300);

  if (offsets.length) {
    latencyCompensationMs = offsets.reduce((a, b) => a + b, 0) / offsets.length;
    calibrated = true;
    elStrumStatus.textContent = `Calibrated (offset ${latencyCompensationMs.toFixed(0)} ms). Ready to start.`;
    elStrumStartBtn.disabled = false;
  } else {
    elStrumStatus.textContent = 'No strums detected — try again, strumming clearly on each click.';
  }
}

elStrumStartBtn.addEventListener('click', () => {
  mode = 'running';
  hits = 0;
  totalScored = 0;
  elStrumScore.textContent = '0 / 0 hits';
  elStrumAccuracy.textContent = '';
  elHitResult.textContent = '—';
  elHitResult.className = 'hit-result';
  elStrumStartBtn.style.display = 'none';
  elStrumStopBtn.style.display = '';
  elStrumStatus.textContent = 'Strum along with the beat';
  scheduler.start();
});

elStrumStopBtn.addEventListener('click', stopStrumming);

function stopStrumming() {
  mode = 'idle';
  if (scheduler) scheduler.stop();
  elStrumStartBtn.style.display = '';
  elStrumStopBtn.style.display = 'none';
  elStrumStatus.textContent = calibrated ? 'Ready to start.' : 'Tap Calibrate, then strum along with the clicks';
}

function stopStrumModule() {
  if (mode === 'running') stopStrumming();
  if (scheduler) scheduler.stop();
  if (strumStream) {
    strumStream.getTracks().forEach((track) => track.stop());
    strumStream = null;
  }
  if (strumAudioContext) {
    strumAudioContext.close();
    strumAudioContext = null;
  }
  onsetNode = null;
  scheduler = null;
  calibrated = false;
  mode = 'idle';
  elStrumStartBtn.disabled = true;
}

window.StrumModule = { stop: stopStrumModule };
