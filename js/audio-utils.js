function getSharedAudioContext() {
  if (!window.__sharedAudioCtx) {
    window.__sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window.__sharedAudioCtx;
}

function karplusStrongBuffer(ctx, frequency, duration, damping) {
  const sampleRate = ctx.sampleRate;
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;

  let index = 0;
  for (let i = 0; i < length; i++) {
    const current = ring[index];
    const next = ring[(index + 1) % period];
    data[i] = current;
    ring[index] = damping * 0.5 * (current + next);
    index = (index + 1) % period;
  }

  return buffer;
}

function schedulePluck(ctx, frequency, { delay = 0, duration = 1.3, gain = 0.15, damping = 0.996 } = {}) {
  const startTime = ctx.currentTime + delay;
  const buffer = karplusStrongBuffer(ctx, frequency, duration, damping);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-24, startTime);
  compressor.knee.setValueAtTime(20, startTime);
  compressor.ratio.setValueAtTime(10, startTime);
  compressor.attack.setValueAtTime(0.002, startTime);
  compressor.release.setValueAtTime(0.2, startTime);

  source.connect(gainNode).connect(compressor).connect(ctx.destination);
  source.start(startTime);
}

function playPluck(frequency, options = {}) {
  const ctx = getSharedAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => schedulePluck(ctx, frequency, options));
  } else {
    schedulePluck(ctx, frequency, options);
  }
}
