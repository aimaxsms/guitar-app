class BeatScheduler {
  constructor(audioContext, { onBeat, lookahead = 25, scheduleAheadTime = 0.1 } = {}) {
    this.ctx = audioContext;
    this.onBeat = onBeat;
    this.lookahead = lookahead;
    this.scheduleAheadTime = scheduleAheadTime;
    this.bpm = 80;
    this.beatIndex = 0;
    this.nextBeatTime = 0;
    this.timerId = null;
    this.running = false;
    this.recentBeatTimes = [];
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  start() {
    this.beatIndex = 0;
    this.nextBeatTime = this.ctx.currentTime + 0.1;
    this.recentBeatTimes = [];
    this.running = true;
    this.scheduler();
  }

  stop() {
    this.running = false;
    if (this.timerId) clearTimeout(this.timerId);
  }

  nearestBeatDeltaMs(time) {
    if (!this.recentBeatTimes.length) return null;
    let best = Infinity;
    for (const beatTime of this.recentBeatTimes) {
      const delta = (time - beatTime) * 1000;
      if (Math.abs(delta) < Math.abs(best)) best = delta;
    }
    return best;
  }

  scheduler() {
    if (!this.running) return;
    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.recentBeatTimes.push(this.nextBeatTime);
      if (this.recentBeatTimes.length > 16) this.recentBeatTimes.shift();
      this.onBeat(this.beatIndex, this.nextBeatTime);
      this.nextBeatTime += 60 / this.bpm;
      this.beatIndex++;
    }
    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }
}

function playClick(audioContext, time, accent) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.frequency.value = accent ? 1500 : 1000;
  gain.gain.setValueAtTime(0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}
