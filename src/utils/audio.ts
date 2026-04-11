class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastSwingTime: number = 0;

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
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
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
