/**
 * Harmoniq Web Audio Engine
 * Real synthesizer with multi-track stem isolation (Vocals, Guitar, Keys, Drums, Bass)
 * + Metronome + Chord player
 */

export interface StemVolumes {
  vocals: number; // 0 - 100
  guitar: number; // 0 - 100
  keys: number;   // 0 - 100
  drums: number;  // 0 - 100
  bass: number;   // 0 - 100
}

export interface StemMutes {
  vocals: boolean;
  guitar: boolean;
  keys: boolean;
  drums: boolean;
  bass: boolean;
}

export interface StemSolos {
  vocals: boolean;
  guitar: boolean;
  keys: boolean;
  drums: boolean;
  bass: boolean;
}

// Chord root frequencies (in Hz)
const NOTE_FREQS: Record<string, number> = {
  'C': 130.81, 'C#': 138.59, 'Db': 138.59,
  'D': 146.83, 'D#': 155.56, 'Eb': 155.56,
  'E': 164.81,
  'F': 174.61, 'F#': 185.00, 'Gb': 185.00,
  'G': 196.00, 'G#': 207.65, 'Ab': 207.65,
  'A': 220.00, 'A#': 233.08, 'Bb': 233.08,
  'B': 246.94
};

function parseChordToFreqs(chordName: string): number[] {
  const clean = chordName.split('/')[0].trim();
  let root = 'C';
  let isMinor = false;
  let is7th = false;

  if (clean.length >= 2 && (clean[1] === '#' || clean[1] === 'b')) {
    root = clean.substring(0, 2);
  } else {
    root = clean.substring(0, 1);
  }

  if (clean.includes('m') && !clean.includes('maj')) {
    isMinor = true;
  }
  if (clean.includes('7')) {
    is7th = true;
  }

  const baseFreq = NOTE_FREQS[root] || 130.81;
  const thirdRatio = isMinor ? 1.1892 : 1.2599; // Minor 3rd vs Major 3rd
  const fifthRatio = 1.4983; // Perfect 5th
  const seventhRatio = is7th ? 1.7818 : 2.0; // Minor 7th or Octave

  return [
    baseFreq,
    baseFreq * thirdRatio,
    baseFreq * fifthRatio,
    baseFreq * seventhRatio
  ];
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stemGains: Record<keyof StemVolumes, GainNode | null> = {
    vocals: null,
    guitar: null,
    keys: null,
    drums: null,
    bass: null,
  };

  private isRunning: boolean = false;
  private timerId: number | null = null;
  private currentBeat: number = 0;
  private currentChord: string = 'Bm';
  private bpm: number = 74;
  private metronomeEnabled: boolean = false;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    const stems: (keyof StemVolumes)[] = ['vocals', 'guitar', 'keys', 'drums', 'bass'];
    stems.forEach(stem => {
      if (!this.ctx || !this.masterGain) return;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.connect(this.masterGain);
      this.stemGains[stem] = gain;
    });
  }

  public setChord(chord: string) {
    this.currentChord = chord;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public setVolumes(volumes: StemVolumes, mutes: StemMutes, solos: StemSolos) {
    if (!this.ctx) return;
    const hasAnySolo = Object.values(solos).some(v => v);

    (Object.keys(volumes) as (keyof StemVolumes)[]).forEach(stem => {
      const gainNode = this.stemGains[stem];
      if (!gainNode || !this.ctx) return;

      let effectiveGain = (volumes[stem] / 100);
      if (mutes[stem]) {
        effectiveGain = 0;
      } else if (hasAnySolo) {
        effectiveGain = solos[stem] ? (volumes[stem] / 100) : 0;
      }

      gainNode.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.05);
    });
  }

  public playMetronomeClick(isDownbeat: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  private triggerDrumHit(type: 'kick' | 'snare' | 'hihat') {
    if (!this.ctx || !this.stemGains.drums) return;
    const now = this.ctx.currentTime;

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.stemGains.drums);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'snare') {
      // Noise + tone
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.stemGains.drums);

      noise.start(now);
      noise.stop(now + 0.15);
    } else if (type === 'hihat') {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 8000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.stemGains.drums);

      noise.start(now);
      noise.stop(now + 0.06);
    }
  }

  private triggerStrum(frequencies: number[], stem: 'guitar' | 'keys') {
    if (!this.ctx) return;
    const gainDest = this.stemGains[stem];
    if (!gainDest) return;
    const now = this.ctx.currentTime;

    frequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (stem === 'guitar') {
        osc.type = 'sawtooth';
        // Stagger strum by 25ms per string
        const offset = idx * 0.025;
        const noteStart = now + offset;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, noteStart);
        filter.frequency.exponentialRampToValueAtTime(600, noteStart + 0.4);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

        osc.frequency.setValueAtTime(freq, noteStart);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(gainDest);

        osc.start(noteStart);
        osc.stop(noteStart + 0.65);
      } else {
        // Keys - warm electric piano chord
        osc.type = 'triangle';
        const noteStart = now;
        gain.gain.setValueAtTime(0.14, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.8);

        osc.frequency.setValueAtTime(freq, noteStart);
        osc.connect(gain);
        gain.connect(gainDest);

        osc.start(noteStart);
        osc.stop(noteStart + 0.85);
      }
    });
  }

  private triggerBass(freq: number) {
    if (!this.ctx || !this.stemGains.bass) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Bass plays 1 octave down
    osc.frequency.setValueAtTime(freq / 2, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.stemGains.bass);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  private triggerVocals(freq: number) {
    if (!this.ctx || !this.stemGains.vocals) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, now); // Vocal harmony (fifth)

    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.stemGains.vocals);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  public triggerArpeggioPluck(freq: number) {
    if (!this.ctx || !this.stemGains.guitar) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.stemGains.guitar);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  private tick() {
    if (!this.isRunning) return;

    const isDownbeat = (this.currentBeat % 4 === 0);
    const isBackbeat = (this.currentBeat % 4 === 2);
    const chordFreqs = parseChordToFreqs(this.currentChord);

    // Metronome
    if (this.metronomeEnabled) {
      this.playMetronomeClick(isDownbeat);
    }

    // Drums
    if (isDownbeat) {
      this.triggerDrumHit('kick');
    } else if (isBackbeat) {
      this.triggerDrumHit('snare');
    } else {
      this.triggerDrumHit('hihat');
    }

    // Guitar strums on beats
    this.triggerStrum(chordFreqs, 'guitar');

    // Keys trigger every 2 beats
    if (isDownbeat || isBackbeat) {
      this.triggerStrum(chordFreqs, 'keys');
    }

    // Bass note
    if (isDownbeat || isBackbeat) {
      this.triggerBass(chordFreqs[0]);
    }

    // Vocal phrase cue
    if (isDownbeat) {
      this.triggerVocals(chordFreqs[0]);
    }

    this.currentBeat = (this.currentBeat + 1) % 16;
  }

  public start() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = true;
    this.currentBeat = 0;

    const intervalMs = (60 / this.bpm) * 1000;
    if (this.timerId) window.clearInterval(this.timerId);
    this.tick();
    this.timerId = window.setInterval(() => this.tick(), intervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public playSingleChord(chordName: string) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const freqs = parseChordToFreqs(chordName);
    this.triggerStrum(freqs, 'guitar');
  }
}

export const audioEngine = new AudioEngine();
