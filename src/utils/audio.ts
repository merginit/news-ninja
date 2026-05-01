const BPM = 138;
const STEP_DURATION = 60 / BPM / 4;
const STEPS_PER_LOOP = 64; // 4 bars
const SCHEDULE_AHEAD = 0.1;
const SCHEDULE_INTERVAL = 25;

const F: Record<string, number> = {
  D2: 73.42, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81, D3: 146.83,
  F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63, D4: 293.66,
  F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25, D5: 587.33,
};

// 64-step patterns — 4 bars, breakbeat-influenced
//                    |--- bar 1 ---|--- bar 2 ---|--- bar 3 ---|--- bar 4 (fill) ---|
const KICK_PATTERN = [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0,
                      1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0,  1,0,0,1, 0,1,0,0, 1,0,0,0, 0,0,1,0];
// snare = 2, clack = 1
const PERC_PATTERN = [0,0,0,0, 2,0,0,1, 0,0,0,0, 2,0,1,0,  0,0,0,1, 2,0,0,0, 0,1,0,0, 2,0,0,1,
                      0,0,0,0, 2,0,0,1, 0,0,0,0, 2,0,1,0,  0,1,0,0, 2,0,1,0, 2,0,1,0, 2,0,2,1];
const BASS_STEPS: (string | '')[] =
                     ['D2','','','',  '','','D2','',  '','','F2','',  '','G2','','',
                      'A2','','','',  '','','A2','',  '','','G2','',  '','F2','','',
                      'D2','','','',  '','','D2','',  '','','Bb2','', '','A2','','',
                      'C3','','','',  '','','C3','',  '','','A2','',  '','','D2',''];
// Chord stabs: Dm, Bb, C, Dm
const STAB_STEPS: Record<number, string[]> = {
  0: ['D4','F4','A4'],  2: ['D4','F4','A4'],
  16: ['Bb3','D4','F4'], 20: ['Bb3','D4','F4'],
  32: ['C4','G4','C5'],  36: ['C4','G4','C5'],
  48: ['D4','F4','A4'],  52: ['D4','A4','D5'],
};
const LEAD_NOTES: (string | '')[] =
                     ['D5','','A4','',  'F4','','G4','',  'A4','','','Bb4', '','A4','','',
                      'G4','','F4','',  'D4','','','F4',  'G4','','A4','',  '','','','',
                      'D5','','C5','',  'Bb4','','A4','', 'G4','','','A4',  'Bb4','','A4','G4',
                      'F4','','G4','',  'A4','','D5','',  '','C5','','A4',  '','','',''];

interface LayerGains { kick: GainNode; perc: GainNode; bass: GainNode; stab: GainNode; lead: GainNode }
const LAYER_THRESHOLDS = { kick: 1, perc: 2, bass: 4, stab: 8, lead: 15 };
const FADE_IN = 0.5;
const FADE_OUT = 1.0;

class MusicEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private layers: LayerGains;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private playing = false;
  private combo = 0;
  private noiseShort: AudioBuffer;
  private noiseLong: AudioBuffer;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.30;
    this.master.connect(ctx.destination);
    this.layers = {
      kick: this.makeGain(), perc: this.makeGain(),
      bass: this.makeGain(), stab: this.makeGain(), lead: this.makeGain(),
    };
    this.noiseShort = this.makeNoise(0.03);
    this.noiseLong = this.makeNoise(0.12);
  }

  private makeGain(): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = 0;
    g.connect(this.master);
    return g;
  }

  private makeNoise(seconds: number): AudioBuffer {
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.combo = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.syncLayers();
    this.timerId = setInterval(() => this.tick(), SCHEDULE_INTERVAL);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    if (this.timerId !== null) { clearInterval(this.timerId); this.timerId = null; }
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.3);
    setTimeout(() => {
      this.master.gain.value = 0.30;
      for (const k of Object.keys(this.layers) as (keyof LayerGains)[]) this.layers[k].gain.value = 0;
    }, 350);
  }

  pause() {
    if (this.timerId !== null) { clearInterval(this.timerId); this.timerId = null; }
  }

  resume() {
    if (!this.playing) return;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.syncLayers();
    this.timerId = setInterval(() => this.tick(), SCHEDULE_INTERVAL);
  }

  updateCombo(c: number) { this.combo = c; this.syncLayers(); }

  private syncLayers() {
    const t = this.ctx.currentTime;
    for (const k of Object.keys(LAYER_THRESHOLDS) as (keyof typeof LAYER_THRESHOLDS)[]) {
      const g = this.layers[k];
      const on = this.combo >= LAYER_THRESHOLDS[k];
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(on ? 1 : 0, t + (on ? FADE_IN : FADE_OUT));
    }
  }

  private tick() {
    while (this.nextTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
      this.emit(this.step, this.nextTime);
      this.step = (this.step + 1) % STEPS_PER_LOOP;
      this.nextTime += STEP_DURATION;
    }
  }

  private emit(s: number, t: number) {
    if (KICK_PATTERN[s]) this.kick(t);
    if (PERC_PATTERN[s]) this.perc(t, PERC_PATTERN[s]);
    if (BASS_STEPS[s]) this.bass(t, BASS_STEPS[s]);
    if (STAB_STEPS[s]) this.stab(t, STAB_STEPS[s]);
    if (LEAD_NOTES[s]) this.lead(t, LEAD_NOTES[s]);
  }

  // --- Kick: sine body + triangle click transient ---
  private kick(t: number) {
    const body = this.ctx.createOscillator();
    const click = this.ctx.createOscillator();
    const gBody = this.ctx.createGain();
    const gClick = this.ctx.createGain();

    body.type = 'sine';
    body.frequency.setValueAtTime(160, t);
    body.frequency.exponentialRampToValueAtTime(35, t + 0.07);
    gBody.gain.setValueAtTime(0.9, t);
    gBody.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    click.type = 'triangle';
    click.frequency.setValueAtTime(1200, t);
    click.frequency.exponentialRampToValueAtTime(200, t + 0.02);
    gClick.gain.setValueAtTime(0.4, t);
    gClick.gain.exponentialRampToValueAtTime(0.01, t + 0.025);

    body.connect(gBody); gBody.connect(this.layers.kick);
    click.connect(gClick); gClick.connect(this.layers.kick);
    body.start(t); body.stop(t + 0.2);
    click.start(t); click.stop(t + 0.03);
  }

  // --- Percussion: snare (noise burst + body) or clack (metallic click) ---
  private perc(t: number, type: number) {
    if (type === 2) {
      // Snare: noise burst through bandpass + sine body
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseLong;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 1.2;
      const gNoise = this.ctx.createGain();
      gNoise.gain.setValueAtTime(0.5, t);
      gNoise.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      noise.connect(bp); bp.connect(gNoise); gNoise.connect(this.layers.perc);
      noise.start(t); noise.stop(t + 0.12);

      const body = this.ctx.createOscillator();
      body.type = 'triangle';
      body.frequency.setValueAtTime(200, t);
      body.frequency.exponentialRampToValueAtTime(120, t + 0.04);
      const gB = this.ctx.createGain();
      gB.gain.setValueAtTime(0.35, t);
      gB.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      body.connect(gB); gB.connect(this.layers.perc);
      body.start(t); body.stop(t + 0.07);
    } else {
      // Clack: very short high-freq metallic click (newsroom typewriter feel)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseShort;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 6000;
      const gN = this.ctx.createGain();
      gN.gain.setValueAtTime(0.25, t);
      gN.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
      noise.connect(hp); hp.connect(gN); gN.connect(this.layers.perc);
      noise.start(t); noise.stop(t + 0.03);

      const ping = this.ctx.createOscillator();
      ping.type = 'square';
      ping.frequency.setValueAtTime(2800, t);
      ping.frequency.exponentialRampToValueAtTime(1400, t + 0.01);
      const gP = this.ctx.createGain();
      gP.gain.setValueAtTime(0.08, t);
      gP.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
      ping.connect(gP); gP.connect(this.layers.perc);
      ping.start(t); ping.stop(t + 0.02);
    }
  }

  // --- Bass: detuned dual-saw "reese" through aggressive LP filter ---
  private bass(t: number, note: string) {
    const freq = F[note];
    if (!freq) return;
    const dur = STEP_DURATION * 1.8;
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth';
    o1.frequency.setValueAtTime(freq, t);
    o2.frequency.setValueAtTime(freq, t);
    o2.detune.setValueAtTime(12, t); // slight detune for thickness
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 4;
    lp.frequency.setValueAtTime(600, t);
    lp.frequency.exponentialRampToValueAtTime(150, t + dur * 0.8);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.setValueAtTime(0.35, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0.01, t + dur);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.layers.bass);
    o1.start(t); o1.stop(t + dur);
    o2.start(t); o2.stop(t + dur);
  }

  // --- Stab: punchy filtered chord hit with fast filter sweep ---
  private stab(t: number, notes: string[]) {
    const dur = STEP_DURATION * 2;
    const mix = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(4000, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + dur * 0.6);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.linearRampToValueAtTime(0.01, t + dur);
    mix.connect(lp); lp.connect(g); g.connect(this.layers.stab);

    for (let i = 0; i < notes.length; i++) {
      const freq = F[notes[i]];
      if (!freq) continue;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, t);
      o.detune.setValueAtTime((i - 1) * 6, t);
      o.connect(mix);
      o.start(t); o.stop(t + dur);
    }
  }

  // --- Lead: saw+square unison with vibrato ---
  private lead(t: number, note: string) {
    const freq = F[note];
    if (!freq) return;
    const dur = STEP_DURATION * 0.85;
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    o1.frequency.setValueAtTime(freq, t);
    o2.frequency.setValueAtTime(freq * 1.002, t); // slight detune

    // Vibrato via LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.setValueAtTime(0, t);
    lfoGain.gain.linearRampToValueAtTime(4, t + dur * 0.5);
    lfo.connect(lfoGain);
    lfoGain.connect(o1.frequency);
    lfoGain.connect(o2.frequency);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.linearRampToValueAtTime(1200, t + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.setValueAtTime(0.1, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0.01, t + dur);

    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.layers.lead);
    lfo.start(t); o1.start(t); o2.start(t);
    lfo.stop(t + dur); o1.stop(t + dur); o2.stop(t + dur);
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
