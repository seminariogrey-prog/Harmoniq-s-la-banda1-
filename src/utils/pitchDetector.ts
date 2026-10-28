/**
 * Harmoniq AI Real-Time Pitch & Microphone Listening Engine
 * Uses browser Web Audio API + Autocorrelation algorithm to detect musical notes and pitch accuracy in real-time.
 */

export interface PitchDetectionResult {
  frequency: number;
  note: string;
  octave: number;
  centsOff: number;
  confidence: number;
  volume: number; // 0 - 1
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(freq: number): { note: string; octave: number; centsOff: number } {
  // A4 = 440Hz, MIDI 69
  const midi = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
  const roundedMidi = Math.round(midi);
  const centsOff = Math.floor((midi - roundedMidi) * 100);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    centsOff
  };
}

// Auto-correlation algorithm for fundamental frequency detection
function autoCorrelate(buffer: Float32Array, sampleRate: number): { freq: number; confidence: number } {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // If signal is too quiet, return no pitch
  if (rms < 0.01) {
    return { freq: -1, confidence: 0 };
  }

  // Trim silence at borders
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buffer.subarray(r1, r2);
  const c = new Float32Array(trimmed.length);
  for (let i = 0; i < trimmed.length; i++) {
    for (let j = 0; j < trimmed.length - i; j++) {
      c[i] = c[i] + trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < trimmed.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  // Parabolic interpolation for fine frequency resolution
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  const confidence = maxval / c[0];

  // Restrict to typical guitar/vocal range (60Hz to 1200Hz)
  if (freq >= 60 && freq <= 1200 && confidence > 0.45) {
    return { freq, confidence };
  }
  return { freq: -1, confidence: 0 };
}

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private buffer: Float32Array | null = null;
  private isListening: boolean = false;

  public async start(): Promise<boolean> {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      });
      this.mediaStream = stream;

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      this.buffer = new Float32Array(this.analyser.fftSize);
      this.isListening = true;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      this.isListening = false;
      return false;
    }
  }

  public stop() {
    this.isListening = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.analyser = null;
  }

  public getPitch(): PitchDetectionResult | null {
    if (!this.isListening || !this.analyser || !this.buffer || !this.audioCtx) {
      return null;
    }

    // Cast to any to satisfy TS DOM Float32Array<ArrayBuffer> definition
    (this.analyser as unknown as { getFloatTimeDomainData: (b: Float32Array) => void }).getFloatTimeDomainData(this.buffer);
    const { freq, confidence } = autoCorrelate(this.buffer, this.audioCtx.sampleRate);

    // Calculate volume
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sum += this.buffer[i] * this.buffer[i];
    }
    const volume = Math.min(1, Math.sqrt(sum / this.buffer.length) * 5);

    if (freq <= 0) {
      return {
        frequency: 0,
        note: '',
        octave: 0,
        centsOff: 0,
        confidence: 0,
        volume
      };
    }

    const { note, octave, centsOff } = frequencyToNote(freq);
    return {
      frequency: Math.round(freq * 10) / 10,
      note,
      octave,
      centsOff,
      confidence,
      volume
    };
  }

  public getWaveformData(dataArray: Uint8Array) {
    if (!this.analyser) return;
    (this.analyser as unknown as { getByteTimeDomainData: (b: Uint8Array) => void }).getByteTimeDomainData(dataArray);
  }

  public getFrequencyData(dataArray: Uint8Array) {
    if (!this.analyser) return;
    (this.analyser as unknown as { getByteFrequencyData: (b: Uint8Array) => void }).getByteFrequencyData(dataArray);
  }

  public isActive(): boolean {
    return this.isListening;
  }
}

export const pitchDetector = new PitchDetector();
