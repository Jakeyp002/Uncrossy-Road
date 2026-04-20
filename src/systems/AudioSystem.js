export class AudioSystem {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  resume() {
    if (!this.enabled) return;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.enabled = false;
        return;
      }
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  tone(freq, duration, type = "square", gain = 0.06, slide = 0) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, freq + slide), now + duration);
    }
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration, gain = 0.08) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = this.context.createBufferSource();
    const amp = this.context.createGain();
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.buffer = buffer;
    source.connect(amp).connect(this.context.destination);
    source.start(now);
  }

  deploy(type) {
    this.resume();
    if (type === "car") this.tone(450, 0.08, "square", 0.045, 160);
    if (type === "truck") this.tone(220, 0.11, "sawtooth", 0.055, -70);
    if (type === "bus") {
      this.tone(170, 0.13, "sawtooth", 0.06, -35);
      setTimeout(() => this.tone(230, 0.1, "square", 0.04, -45), 70);
    }
    if (type === "plow") {
      this.noise(0.12, 0.06);
      this.tone(115, 0.18, "sawtooth", 0.055, 40);
    }
    if (type === "roadblock") {
      this.noise(0.1, 0.08);
      this.tone(135, 0.16, "square", 0.055, -35);
    }
  }

  splat(combo) {
    this.resume();
    this.noise(0.08, 0.075);
    this.tone(190 + Math.min(combo, 7) * 35, 0.08, "triangle", 0.055, 80);
  }

  escape() {
    this.resume();
    this.tone(130, 0.18, "sawtooth", 0.06, -70);
  }

  denied() {
    this.resume();
    this.tone(92, 0.08, "square", 0.035, -18);
  }

  buy() {
    this.resume();
    this.tone(520, 0.07, "triangle", 0.045, 120);
    setTimeout(() => this.tone(760, 0.08, "triangle", 0.04, 80), 70);
  }

  roadblock() {
    this.resume();
    this.noise(0.18, 0.1);
    this.tone(95, 0.23, "sawtooth", 0.075, 55);
  }

  start() {
    this.resume();
    this.tone(330, 0.08, "square", 0.04, 120);
    setTimeout(() => this.tone(495, 0.08, "square", 0.04, 120), 80);
  }

  gameOver() {
    this.resume();
    this.tone(300, 0.1, "triangle", 0.05, -40);
    setTimeout(() => this.tone(180, 0.2, "sawtooth", 0.055, -80), 90);
  }
}
