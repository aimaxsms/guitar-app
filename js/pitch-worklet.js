const WINDOW_SIZE = 4096;
const HOP_SIZE = 1024;
const DEFAULT_MIN_FREQ = 55;
const MAX_FREQ = 1200;
const YIN_THRESHOLD = 0.12;
const RMS_SILENCE_THRESHOLD = 0.01;

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ring = new Float32Array(WINDOW_SIZE);
    this.writeIndex = 0;
    this.samplesSinceAnalysis = 0;
    this.minFreq = DEFAULT_MIN_FREQ;
    this.port.onmessage = (event) => {
      if (event.data && typeof event.data.minFreq === 'number') {
        this.minFreq = event.data.minFreq;
      }
    };
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      this.ring[this.writeIndex] = input[i];
      this.writeIndex = (this.writeIndex + 1) % WINDOW_SIZE;
    }
    this.samplesSinceAnalysis += input.length;

    if (this.samplesSinceAnalysis >= HOP_SIZE) {
      this.samplesSinceAnalysis = 0;
      const frame = this.unwrapRing();
      const rms = this.computeRms(frame);
      if (rms < RMS_SILENCE_THRESHOLD) {
        this.port.postMessage({ frequency: null, rms });
      } else {
        const frequency = this.yin(frame, sampleRate);
        this.port.postMessage({ frequency, rms });
      }
    }
    return true;
  }

  unwrapRing() {
    const out = new Float32Array(WINDOW_SIZE);
    const tail = WINDOW_SIZE - this.writeIndex;
    out.set(this.ring.subarray(this.writeIndex), 0);
    out.set(this.ring.subarray(0, this.writeIndex), tail);
    return out;
  }

  computeRms(frame) {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    return Math.sqrt(sum / frame.length);
  }

  yin(frame, sampleRate) {
    const tauMin = Math.floor(sampleRate / MAX_FREQ);
    const tauMax = Math.min(Math.floor(sampleRate / this.minFreq), frame.length - 1);

    const diff = new Float32Array(tauMax + 1);
    for (let tau = tauMin; tau <= tauMax; tau++) {
      let sum = 0;
      const limit = frame.length - tau;
      for (let j = 0; j < limit; j++) {
        const delta = frame[j] - frame[j + tau];
        sum += delta * delta;
      }
      diff[tau] = sum;
    }

    const cmnd = new Float32Array(tauMax + 1);
    cmnd[tauMin] = 1;
    let runningSum = 0;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      runningSum += diff[tau];
      cmnd[tau] = tau === 0 ? 1 : diff[tau] * tau / runningSum;
    }

    let tauEstimate = -1;
    for (let tau = tauMin + 1; tau < tauMax; tau++) {
      if (cmnd[tau] < YIN_THRESHOLD) {
        while (tau + 1 < tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
        tauEstimate = tau;
        break;
      }
    }
    if (tauEstimate === -1) return null;

    const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
    const x2 = tauEstimate + 1 < tauMax ? tauEstimate + 1 : tauEstimate;
    let betterTau = tauEstimate;
    if (x0 !== tauEstimate && x2 !== tauEstimate) {
      const s0 = cmnd[x0];
      const s1 = cmnd[tauEstimate];
      const s2 = cmnd[x2];
      const denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) betterTau = tauEstimate + (s2 - s0) / denom;
    }

    return sampleRate / betterTau;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
