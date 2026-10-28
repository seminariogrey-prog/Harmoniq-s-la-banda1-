import { ChordFingering } from '../types/music';

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Common shapes for standard chords
const STANDARD_SHAPES: Record<string, ChordFingering> = {
  'Am': {
    strings: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    pianoKeys: [0, 4, 9]
  },
  'C': {
    strings: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    pianoKeys: [0, 4, 7]
  },
  'D': {
    strings: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    pianoKeys: [2, 6, 9]
  },
  'Dm': {
    strings: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    pianoKeys: [2, 5, 9]
  },
  'E': {
    strings: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    pianoKeys: [4, 8, 11]
  },
  'Em': {
    strings: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    pianoKeys: [4, 7, 11]
  },
  'G': {
    strings: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    pianoKeys: [7, 11, 2]
  },
  'A': {
    strings: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    pianoKeys: [9, 1, 4]
  },
  'F': {
    strings: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1 },
    pianoKeys: [5, 9, 0]
  },
  'Bm': {
    strings: [-1, 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
    pianoKeys: [2, 5, 9]
  },
  'F#7': {
    strings: [2, 4, 2, 3, 2, 2],
    fingers: [1, 3, 1, 2, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1 },
    pianoKeys: [6, 10, 1, 4]
  },
  'E7': {
    strings: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    pianoKeys: [4, 8, 11, 2]
  }
};

export function transposeChordName(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  const slashParts = chord.split('/');
  const mainChord = slashParts[0].trim();
  const bassNote = slashParts[1] ? slashParts[1].trim() : null;

  const transposeNote = (noteStr: string): string => {
    let root = noteStr.substring(0, 1);
    let suffix = noteStr.substring(1);

    if (noteStr.length >= 2 && (noteStr[1] === '#' || noteStr[1] === 'b')) {
      root = noteStr.substring(0, 2);
      suffix = noteStr.substring(2);
    }

    // Normalize flats to sharps
    const flatToSharp: Record<string, string> = {
      'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    const normRoot = flatToSharp[root] || root;
    const idx = CHROMATIC_SCALE.indexOf(normRoot);
    if (idx === -1) return noteStr;

    // Transpose
    const newIdx = (idx + semitones + 120) % 12;
    return CHROMATIC_SCALE[newIdx] + suffix;
  };

  const newMain = transposeNote(mainChord);
  if (bassNote) {
    return `${newMain}/${transposeNote(bassNote)}`;
  }
  return newMain;
}

export function getChordFingeringForCapo(
  originalChord: string,
  capoFret: number,
  fallbackFingering: ChordFingering
): { chordName: string; shapeFingering: ChordFingering } {
  if (capoFret === 0) {
    return { chordName: originalChord, shapeFingering: fallbackFingering };
  }

  // To keep concert pitch, shape must be lowered by capoFret semitones
  const shapeName = transposeChordName(originalChord, -capoFret);
  const foundShape = STANDARD_SHAPES[shapeName];

  if (foundShape) {
    return { chordName: `${shapeName} (Capo ${capoFret})`, shapeFingering: foundShape };
  }

  return { chordName: `${shapeName} (Capo ${capoFret})`, shapeFingering: fallbackFingering };
}
