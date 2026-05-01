const BPM = 130;
const STEP_DURATION = 60 / BPM / 4; // 16th note duration
const STEPS_PER_LOOP = 32; // 2 bars of 16 16th-notes
const SCHEDULE_AHEAD = 0.1; // seconds to look ahead
const SCHEDULE_INTERVAL = 25; // ms between scheduler ticks

// A minor pentatonic scale frequencies
const NOTE_FREQS: Record<string, number> = {
  A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81,
  F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94, C4: 261.63,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
  C5: 523.25, E5: 659.26,
};

// Step patterns (1 = trigger, 0 = silent) — 32 steps = 2 bars
const KICK_PATTERN =    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1, 1,0,0,0, 1,0,1,0];
const HIHAT_PATTERN =   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1];
const BASS_NOTES =      ['A2','','','A2', '','','C3','', 'D3','','','D3', '','','E3','',
                         'A2','','','A2', '','','G3','', 'E3','','','E3', '','','C3',''];
const PAD_CHANGES: Record<number, string[]> = {
  0:  ['A3', 'C4', 'E4'],    // Am
  16: ['F3', 'A3', 'C4'],    // F
};
const ARP_NOTES =       ['A4','C5','E5','C5', 'A4','E4','A4','C5', 'E5','C5','A4','E4', 'G4','A4','C5','E5',
                         'E5','C5','A4','G4', 'A4','C5','E5','A4', 'C5','E5','A4','G4', 'E4','G4','A4','C5'];

interface LayerGains {
  kick: GainNode;
  hihat: GainNode;
  bass: GainNode;
  pad: GainNode;
  arp: GainNode;
}

const LAYER_THRESHOLDS = { kick: 0, hihat: 2, bass: 4, pad: 8, arp: 15 };
const FADE_IN_TIME = 0.5;
const FADE_OUT_TIME = 1.0;

class MusicEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private layerGains: LayerGains;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private currentStep = 0;
  private nextStepTime = 0;
  private isPlaying = false;
  private combo = 0;
  private activePadOscs: OscillatorNode[] = [];
  private activePadGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(ctx.destination);

    this.layerGains = {
      kick: this.createLayerGain(0),
      hihat: this.createLayerGain(0),
      bass: this.createLayerGain(0),
      pad: this.createLayerGain(0),
      arp: this.createLayerGain(0),
    };

    this.noiseBuffer = this.createNoiseBuffer();
  }

  private createLayerGain(initialVolume: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = initialVolume;
    g.connect(this.masterGain);
    return g;
  }

  private createNoiseBuffer(): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 0.05; // 50ms of noise
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.combo = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.updateLayerVolumes();
    this.schedulerId = setInterval(() => this.schedule(), SCHEDULE_INTERVAL);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.stopPad();
    // Quick fade out master
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
    setTimeout(() => {
      this.masterGain.gain.value = 0.35;
      for (const key of Object.keys(this.layerGains) as (keyof LayerGains)[]) {
        this.layerGains[key].gain.value = 0;
      }
    }, 350);
  }

  pause() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.stopPad();
  }

  resume() {
    if (!this.isPlaying) return;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.updateLayerVolumes();
    this.restartPad();
    this.schedulerId = setInterval(() => this.schedule(), SCHEDULE_INTERVAL);
  }

  updateCombo(combo: number) {
    this.combo = combo;
    this.updateLayerVolumes();
  }

  private updateLayerVolumes() {
    const now = this.ctx.currentTime;
    for (const key of Object.keys(LAYER_THRESHOLDS) as (keyof typeof LAYER_THRESHOLDS)[]) {
      const gain = this.layerGains[key];
      const shouldBeActive = this.combo >= LAYER_THRESHOLDS[key];
      const target = shouldBeActive ? 1.0 : 0.0;
      const fadeTime = shouldBeActive ? FADE_IN_TIME : FADE_OUT_TIME;

      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(target, now + fadeTime);
    }

    // Restart pad oscillators if pad layer just became active
    if (this.combo >= LAYER_THRESHOLDS.pad && !this.activePadGain) {
      this.restartPad();
    } else if (this.combo < LAYER_THRESHOLDS.pad && this.activePadGain) {
      // Let the gain fade handle it; pad will be stopped on next stop/pause or volume reaches 0
    }
  }

  private schedule() {
    while (this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.currentStep = (this.currentStep + 1) % STEPS_PER_LOOP;
      this.nextStepTime += STEP_DURATION;
    }
  }

  private scheduleStep(step: number, time: number) {
    if (KICK_PATTERN[step]) this.scheduleKick(time);
    if (HIHAT_PATTERN[step]) this.scheduleHihat(time);
    if (BASS_NOTES[step]) this.scheduleBass(time, BASS_NOTES[step]);
    if (PAD_CHANGES[step] && this.activePadGain) this.schedulePadChange(time, PAD_CHANGES[step]);
    if (ARP_NOTES[step]) this.scheduleArp(time, ARP_NOTES[step]);
  }

  private scheduleKick(time: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(gain);
    gain.connect(this.layerGains.kick);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private scheduleHihat(time: number) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.layerGains.hihat);
    source.start(time);
    source.stop(time + 0.05);
  }

  private scheduleBass(time: number, note: string) {
    const freq = NOTE_FREQS[note];
    if (!freq) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.linearRampToValueAtTime(200, time + STEP_DURATION * 0.9);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.linearRampToValueAtTime(0.01, time + STEP_DURATION * 0.9);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.layerGains.bass);
    osc.start(time);
    osc.stop(time + STEP_DURATION);
  }

  private restartPad() {
    this.stopPad();
    if (this.combo < LAYER_THRESHOLDS.pad) return;

    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.15;
    padGain.connect(this.layerGains.pad);
    this.activePadGain = padGain;

    // Determine which chord based on current step
    const chordNotes = this.currentStep < 16
      ? PAD_CHANGES[0]
      : (PAD_CHANGES[16] || PAD_CHANGES[0]);

    this.activePadOscs = chordNotes.map((note, i) => {
      const freq = NOTE_FREQS[note];
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 8; // slight detune for width
      osc.connect(padGain);
      osc.start();
      return osc;
    });
  }

  private stopPad() {
    for (const osc of this.activePadOscs) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.activePadOscs = [];
    if (this.activePadGain) {
      try { this.activePadGain.disconnect(); } catch { /* ok */ }
      this.activePadGain = null;
    }
  }

  private schedulePadChange(time: number, notes: string[]) {
    // Smoothly retune existing pad oscillators
    if (this.activePadOscs.length === notes.length) {
      notes.forEach((note, i) => {
        const freq = NOTE_FREQS[note];
        this.activePadOscs[i].frequency.setValueAtTime(this.activePadOscs[i].frequency.value, time);
        this.activePadOscs[i].frequency.linearRampToValueAtTime(freq, time + 0.1);
      });
    }
  }

  private scheduleArp(time: number, note: string) {
    const freq = NOTE_FREQS[note];
    if (!freq) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.setValueAtTime(0.08, time + STEP_DURATION * 0.5);
    gain.gain.linearRampToValueAtTime(0.01, time + STEP_DURATION * 0.9);
    osc.connect(gain);
    gain.connect(this.layerGains.arp);
    osc.start(time);
    osc.stop(time + STEP_DURATION);
  }
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastSwingTime: number = 0;
  private music: MusicEngine | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.music) {
      if (this.isMuted) {
        this.music.pause();
      } else {
        this.music.resume();
      }
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  public startMusic() {
    if (this.isMuted) return;
    this.init();
    if (!this.music) {
      this.music = new MusicEngine(this.ctx!);
    }
    this.music.start();
  }

  public stopMusic() {
    this.music?.stop();
  }

  public pauseMusic() {
    this.music?.pause();
  }

  public resumeMusic() {
    if (this.isMuted) return;
    this.music?.resume();
  }

  public updateMusicCombo(combo: number) {
    this.music?.updateCombo(combo);
  }

  public playSlice(combo: number) {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch goes up with combo
    const baseFreq = 200;
    osc.frequency.setValueAtTime(baseFreq + combo * 50, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + combo * 50 + 200, ctx.currentTime + 0.1);

    osc.type = 'square';

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public playSwing() {
    if (this.isMuted) return;
    const now = Date.now();
    // Throttle swing sounds so it doesn't sound like a machine gun
    if (now - this.lastSwingTime < 150) return;
    this.lastSwingTime = now;

    this.init();
    const ctx = this.ctx!;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public playBomb() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  public playDrop() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    osc.type = 'triangle';

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  public playPowerup() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.ctx!;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }
}

export const audio = new AudioManager();
