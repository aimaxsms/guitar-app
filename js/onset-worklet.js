const ENERGY_HISTORY_SIZE = 20;
const TRIGGER_RATIO = 1.6;
const MIN_ENERGY = 0.004;
const REFRACTORY_SECONDS = 0.12;

class OnsetProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.energyHistory = [];
    this.samplesSinceLastOnset = Infinity;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);

    const avgEnergy = this.energyHistory.length
      ? this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
      : 0;

    this.samplesSinceLastOnset += input.length;
    const refractorySamples = REFRACTORY_SECONDS * sampleRate;

    if (
      rms > MIN_ENERGY &&
      rms > avgEnergy * TRIGGER_RATIO &&
      this.samplesSinceLastOnset > refractorySamples
    ) {
      this.port.postMessage({ onset: true, time: currentTime, strength: rms });
      this.samplesSinceLastOnset = 0;
    }

    this.energyHistory.push(rms);
    if (this.energyHistory.length > ENERGY_HISTORY_SIZE) this.energyHistory.shift();

    return true;
  }
}

registerProcessor('onset-processor', OnsetProcessor);
