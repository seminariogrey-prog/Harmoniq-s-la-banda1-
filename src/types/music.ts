export interface ChordFingering {
  // 6 strings from low E (6th) to high e (1st): -1 for mute (X), 0 for open (O), 1-5 for fret
  strings: number[];
  // finger numbers for pressed strings: 1 (index), 2 (middle), 3 (ring), 4 (pinky), 0 for none
  fingers: number[];
  // Barre details if applicable: fret number and from string to string
  barre?: { fret: number; fromString: number; toString: number };
  baseFret?: number;
  pianoKeys?: number[]; // MIDI note numbers relative to C
}

export interface ArpeggioNote {
  // stringIndex: 0 = 6th (low E), 1 = 5th (A), 2 = 4th (D), 3 = 3rd (G), 4 = 2nd (B), 5 = 1st (high e)
  stringIndex: number;
  fret: number;
  noteName: string;
  finger?: number;
  step: number; // 0, 1, 2, 3, 4, 5, 6, 7
  pianoKey?: number;
}

export interface ChordDetail {
  name: string;
  beginnerName?: string;
  advancedName?: string;
  durationSeconds: number;
  fingering: ChordFingering;
  beginnerFingering?: ChordFingering;
  advancedFingering?: ChordFingering;
  strummingHint?: string;
  arpeggioPattern?: ArpeggioNote[];
}

export interface SongTip {
  id: string;
  author: string;
  avatar: string;
  timeAgo: string;
  timestampSeconds?: number;
  content: string;
  likes: number;
}

export interface TimedChordEvent {
  id: string;
  chordName: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  section: string;   // 'Intro' | 'Verso' | 'Coro' | 'Solo' | 'Puente' | 'Outro'
  lyricsSnippet?: string;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  year: number;
  album: string;
  bpm: number;
  key: string;
  recommendedCapo: number;
  youtubeId: string;
  durationSeconds: number;
  genre: 'Rock' | 'Pop' | 'Indie' | 'Metal' | 'Acoustic';
  chords: ChordDetail[];
  timeline: TimedChordEvent[];
  tips: SongTip[];
}

export type DifficultyLevel = 'beginner' | 'original' | 'advanced';
