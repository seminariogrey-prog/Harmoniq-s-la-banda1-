import { SongTrack, TimedChordEvent } from '../types/music';

// Guitar string indexing in ChordFingering: [String 6 (E), String 5 (A), String 4 (D), String 3 (G), String 2 (B), String 1 (e)]
// -1 = Muted (X), 0 = Open (O), >0 = Fret number

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BASE_MIDI_PER_STRING = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4

export function generateArpeggioPattern(strings: number[], fingers?: number[]) {
  const available = strings
    .map((fret, stringIndex) => ({ stringIndex, fret }))
    .filter((item) => item.fret >= 0);

  if (available.length === 0) return [];

  const bass = available[0];
  const others = available.slice(1);
  if (others.length === 0) {
    const midi = BASE_MIDI_PER_STRING[bass.stringIndex] + bass.fret;
    return [{
      stringIndex: bass.stringIndex,
      fret: bass.fret,
      noteName: `${CHROMATIC_SCALE[midi % 12]}${Math.floor(midi / 12) - 1}`,
      step: 0,
      pianoKey: midi % 12,
      finger: fingers ? fingers[bass.stringIndex] : 1
    }];
  }

  // 8-step picking pattern (Iconic acoustic fingerpicking)
  const patternSequence = [
    bass,
    others[0] || bass,
    others[Math.min(1, others.length - 1)],
    others[Math.min(2, others.length - 1)],
    others[others.length - 1],
    others[Math.min(2, others.length - 1)],
    others[Math.min(1, others.length - 1)],
    others[0] || bass,
  ];

  return patternSequence.map((item, step) => {
    const midi = BASE_MIDI_PER_STRING[item.stringIndex] + item.fret;
    const noteName = `${CHROMATIC_SCALE[midi % 12]}${Math.floor(midi / 12) - 1}`;
    return {
      stringIndex: item.stringIndex,
      fret: item.fret,
      noteName,
      step,
      pianoKey: midi % 12,
      finger: fingers ? fingers[item.stringIndex] : 1
    };
  });
}

// Helper to generate repetitive progressions with timestamps
function createProgression(
  sections: { section: string; chords: { chord: string; duration: number; lyrics?: string }[] }[]
): TimedChordEvent[] {
  let currentTime = 0;
  const events: TimedChordEvent[] = [];
  let eventIdx = 0;

  for (const sec of sections) {
    for (const c of sec.chords) {
      events.push({
        id: `ev-${eventIdx++}`,
        chordName: c.chord,
        startTime: Math.round(currentTime * 10) / 10,
        endTime: Math.round((currentTime + c.duration) * 10) / 10,
        section: sec.section,
        lyricsSnippet: c.lyrics
      });
      currentTime += c.duration;
    }
  }
  return events;
}

export const SONGS_CATALOG: SongTrack[] = [
  {
    id: 'hotel-california',
    title: 'Hotel California',
    artist: 'Eagles',
    year: 1977,
    album: 'Hotel California',
    bpm: 74,
    key: 'Bm',
    recommendedCapo: 0,
    youtubeId: 'BciZRPFYp70',
    durationSeconds: 390,
    genre: 'Rock',
    chords: [
      {
        name: 'Bm',
        beginnerName: 'Am (Capo 2)',
        advancedName: 'Bm9',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [-1, 2, 4, 4, 3, 2],
          fingers: [0, 1, 3, 4, 2, 1],
          barre: { fret: 2, fromString: 5, toString: 1 },
          pianoKeys: [2, 5, 9] // D, F#, B
        },
        beginnerFingering: {
          strings: [-1, 0, 2, 2, 1, 0],
          fingers: [0, 0, 2, 3, 1, 0],
          pianoKeys: [0, 4, 9]
        },
        advancedFingering: {
          strings: [-1, 2, 0, 2, 2, 2],
          fingers: [0, 1, 0, 2, 3, 4],
          pianoKeys: [1, 2, 5, 9]
        }
      },
      {
        name: 'F#7',
        beginnerName: 'E7 (Capo 2)',
        advancedName: 'F#7#9',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [2, 4, 2, 3, 2, 2],
          fingers: [1, 3, 1, 2, 1, 1],
          barre: { fret: 2, fromString: 6, toString: 1 },
          pianoKeys: [6, 10, 1, 4]
        },
        beginnerFingering: {
          strings: [0, 2, 0, 1, 0, 0],
          fingers: [0, 2, 0, 1, 0, 0],
          pianoKeys: [4, 8, 11, 2]
        },
        advancedFingering: {
          strings: [-1, -1, 4, 3, 5, 5],
          fingers: [0, 0, 2, 1, 3, 4],
          pianoKeys: [6, 10, 1, 4, 7]
        }
      },
      {
        name: 'A',
        beginnerName: 'G (Capo 2)',
        advancedName: 'Asus2',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [-1, 0, 2, 2, 2, 0],
          fingers: [0, 0, 1, 2, 3, 0],
          pianoKeys: [9, 1, 4]
        },
        beginnerFingering: {
          strings: [3, 2, 0, 0, 0, 3],
          fingers: [2, 1, 0, 0, 0, 3],
          pianoKeys: [7, 11, 2]
        },
        advancedFingering: {
          strings: [-1, 0, 2, 2, 0, 0],
          fingers: [0, 0, 1, 2, 0, 0],
          pianoKeys: [9, 11, 4]
        }
      },
      {
        name: 'E',
        beginnerName: 'D (Capo 2)',
        advancedName: 'E7',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [0, 2, 2, 1, 0, 0],
          fingers: [0, 2, 3, 1, 0, 0],
          pianoKeys: [4, 8, 11]
        },
        beginnerFingering: {
          strings: [-1, -1, 0, 2, 3, 2],
          fingers: [0, 0, 0, 1, 3, 2],
          pianoKeys: [2, 6, 9]
        },
        advancedFingering: {
          strings: [0, 2, 0, 1, 0, 0],
          fingers: [0, 2, 0, 1, 0, 0],
          pianoKeys: [4, 8, 11, 2]
        }
      },
      {
        name: 'G',
        beginnerName: 'C (Capo 2)',
        advancedName: 'Gmaj7',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [3, 2, 0, 0, 0, 3],
          fingers: [2, 1, 0, 0, 0, 3],
          pianoKeys: [7, 11, 2]
        },
        beginnerFingering: {
          strings: [-1, 3, 2, 0, 1, 0],
          fingers: [0, 3, 2, 0, 1, 0],
          pianoKeys: [0, 4, 7]
        },
        advancedFingering: {
          strings: [3, 2, 0, 0, 0, 2],
          fingers: [3, 2, 0, 0, 0, 1],
          pianoKeys: [7, 11, 2, 6]
        }
      },
      {
        name: 'D',
        beginnerName: 'C (Capo 2)',
        advancedName: 'Dsus2',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [-1, -1, 0, 2, 3, 2],
          fingers: [0, 0, 0, 1, 3, 2],
          pianoKeys: [2, 6, 9]
        },
        beginnerFingering: {
          strings: [-1, 3, 2, 0, 1, 0],
          fingers: [0, 3, 2, 0, 1, 0],
          pianoKeys: [0, 4, 7]
        },
        advancedFingering: {
          strings: [-1, -1, 0, 2, 3, 0],
          fingers: [0, 0, 0, 1, 2, 0],
          pianoKeys: [2, 4, 9]
        }
      },
      {
        name: 'Em',
        beginnerName: 'Dm (Capo 2)',
        advancedName: 'Em7',
        durationSeconds: 6.5,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [0, 2, 2, 0, 0, 0],
          fingers: [0, 2, 3, 0, 0, 0],
          pianoKeys: [4, 7, 11]
        },
        beginnerFingering: {
          strings: [-1, -1, 0, 2, 3, 1],
          fingers: [0, 0, 0, 2, 3, 1],
          pianoKeys: [2, 5, 9]
        },
        advancedFingering: {
          strings: [0, 2, 2, 0, 3, 0],
          fingers: [0, 1, 2, 0, 3, 0],
          pianoKeys: [4, 7, 11, 2]
        }
      }
    ],
    timeline: createProgression([
      {
        section: 'Intro Acústica',
        chords: [
          { chord: 'Bm', duration: 13, lyrics: 'Arpegio inicial 12 cuerdas' },
          { chord: 'F#7', duration: 6.5 },
          { chord: 'A', duration: 6.5 },
          { chord: 'E', duration: 6.5 },
          { chord: 'G', duration: 6.5 },
          { chord: 'D', duration: 6.5 },
          { chord: 'Em', duration: 6.5 },
          { chord: 'F#7', duration: 6.5 }
        ]
      },
      {
        section: 'Verso 1',
        chords: [
          { chord: 'Bm', duration: 6.5, lyrics: 'On a dark desert highway' },
          { chord: 'F#7', duration: 6.5, lyrics: 'Cool wind in my hair' },
          { chord: 'A', duration: 6.5, lyrics: 'Warm smell of colitas' },
          { chord: 'E', duration: 6.5, lyrics: 'Rising up through the air' },
          { chord: 'G', duration: 6.5, lyrics: 'Up ahead in the distance' },
          { chord: 'D', duration: 6.5, lyrics: 'I saw a shimmering light' },
          { chord: 'Em', duration: 6.5, lyrics: 'My head grew heavy and my sight grew dim' },
          { chord: 'F#7', duration: 6.5, lyrics: 'I had to stop for the night' }
        ]
      },
      {
        section: 'Verso 2',
        chords: [
          { chord: 'Bm', duration: 6.5, lyrics: 'There she stood in the doorway' },
          { chord: 'F#7', duration: 6.5, lyrics: 'I heard the mission bell' },
          { chord: 'A', duration: 6.5, lyrics: 'And I was thinking to myself' },
          { chord: 'E', duration: 6.5, lyrics: 'This could be Heaven or this could be Hell' },
          { chord: 'G', duration: 6.5, lyrics: 'Then she lit up a candle' },
          { chord: 'D', duration: 6.5, lyrics: 'And she showed me the way' },
          { chord: 'Em', duration: 6.5, lyrics: 'There were voices down the corridor' },
          { chord: 'F#7', duration: 6.5, lyrics: 'I thought I heard them say' }
        ]
      },
      {
        section: 'Coro 1',
        chords: [
          { chord: 'G', duration: 6.5, lyrics: 'Welcome to the Hotel California' },
          { chord: 'D', duration: 6.5, lyrics: 'Such a lovely place (such a lovely face)' },
          { chord: 'F#7', duration: 6.5, lyrics: 'Plenty of room at the Hotel California' },
          { chord: 'Bm', duration: 6.5, lyrics: 'Any time of year, you can find it here' },
          { chord: 'G', duration: 6.5, lyrics: 'Her mind is Tiffany-twisted' },
          { chord: 'D', duration: 6.5, lyrics: 'She got the Mercedes bends' },
          { chord: 'Em', duration: 6.5, lyrics: 'She got a lot of pretty, pretty boys' },
          { chord: 'F#7', duration: 6.5, lyrics: 'She calls friends' }
        ]
      },
      {
        section: 'Solo Legendario',
        chords: [
          { chord: 'Bm', duration: 6.5, lyrics: 'Solo de Don Felder (Pentatónica de Bm)' },
          { chord: 'F#7', duration: 6.5 },
          { chord: 'A', duration: 6.5 },
          { chord: 'E', duration: 6.5 },
          { chord: 'G', duration: 6.5, lyrics: 'Respuesta de Joe Walsh' },
          { chord: 'D', duration: 6.5 },
          { chord: 'Em', duration: 6.5 },
          { chord: 'F#7', duration: 6.5 },
          { chord: 'Bm', duration: 6.5, lyrics: 'Doble solo armonizado' },
          { chord: 'F#7', duration: 6.5 },
          { chord: 'A', duration: 6.5 },
          { chord: 'E', duration: 6.5 },
          { chord: 'G', duration: 6.5, lyrics: 'Arpegio final a dos guitarras' },
          { chord: 'D', duration: 6.5 },
          { chord: 'Em', duration: 6.5 },
          { chord: 'F#7', duration: 25, lyrics: 'Final fade out' }
        ]
      }
    ]),
    tips: [
      {
        id: 'tip-1',
        author: 'Marco R.',
        avatar: 'MR',
        timeAgo: 'hace 2d',
        timestampSeconds: 202,
        content: 'El solo legendario de Don Felder y Joe Walsh empieza en 3:22. Usad escala de B menor pentatónica y cuerdas calibre 10.',
        likes: 42
      },
      {
        id: 'tip-2',
        author: 'Laura S.',
        avatar: 'LS',
        timeAgo: 'hace 5d',
        timestampSeconds: 58,
        content: 'Rasgueo recomendado para la estrofa: abajo, abajo, arriba, arriba, abajo, arriba con acento en el tiempo 2 y 4.',
        likes: 28
      },
      {
        id: 'tip-3',
        author: 'David Guitarrista',
        avatar: 'DG',
        timeAgo: 'hace 1 sem',
        timestampSeconds: 0,
        content: 'Si te cuesta la cejilla de Bm, pon el Capo en traste 2 y toca Am - E7 - G - D. Suena brillante en acústica.',
        likes: 67
      }
    ]
  },
  {
    id: 'zombie',
    title: 'Zombie',
    artist: 'The Cranberries',
    year: 1994,
    album: 'No Need to Argue',
    bpm: 90,
    key: 'Em',
    recommendedCapo: 0,
    youtubeId: '63qWxBC4Vx8',
    durationSeconds: 308,
    genre: 'Rock',
    chords: [
      {
        name: 'Em',
        durationSeconds: 5.3,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [0, 2, 2, 0, 0, 0],
          fingers: [0, 2, 3, 0, 0, 0],
          pianoKeys: [4, 7, 11]
        }
      },
      {
        name: 'C',
        durationSeconds: 5.3,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [-1, 3, 2, 0, 1, 0],
          fingers: [0, 3, 2, 0, 1, 0],
          pianoKeys: [0, 4, 7]
        }
      },
      {
        name: 'G',
        durationSeconds: 5.3,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [3, 2, 0, 0, 0, 3],
          fingers: [2, 1, 0, 0, 0, 3],
          pianoKeys: [7, 11, 2]
        }
      },
      {
        name: 'D/F#',
        durationSeconds: 5.3,
        strummingHint: '↓ ↓ ↑ ↑ ↓ ↑',
        fingering: {
          strings: [2, 0, 0, 2, 3, 2],
          fingers: [1, 0, 0, 2, 4, 3],
          pianoKeys: [6, 9, 2]
        }
      }
    ],
    timeline: createProgression([
      {
        section: 'Intro Limpia',
        chords: [
          { chord: 'Em', duration: 5.3, lyrics: 'Intro guitarra limpia' },
          { chord: 'C', duration: 5.3 },
          { chord: 'G', duration: 5.3 },
          { chord: 'D/F#', duration: 5.3 },
          { chord: 'Em', duration: 5.3, lyrics: 'Entrada de bajo y batería' },
          { chord: 'C', duration: 5.3 },
          { chord: 'G', duration: 5.3 },
          { chord: 'D/F#', duration: 5.3 }
        ]
      },
      {
        section: 'Intro Distorsión',
        chords: [
          { chord: 'Em', duration: 5.3, lyrics: 'Entran guitarras pesadas con distorsión' },
          { chord: 'C', duration: 5.3 },
          { chord: 'G', duration: 5.3 },
          { chord: 'D/F#', duration: 5.3 }
        ]
      },
      {
        section: 'Verso 1',
        chords: [
          { chord: 'Em', duration: 5.3, lyrics: 'Another head hangs lowly' },
          { chord: 'C', duration: 5.3, lyrics: 'Child is slowly taken' },
          { chord: 'G', duration: 5.3, lyrics: 'And the violence, caused such silence' },
          { chord: 'D/F#', duration: 5.3, lyrics: 'Who are we mistaken?' },
          { chord: 'Em', duration: 5.3, lyrics: 'But you see, it\'s not me' },
          { chord: 'C', duration: 5.3, lyrics: 'It\'s not my family' },
          { chord: 'G', duration: 5.3, lyrics: 'In your head, in your head, they are fighting' },
          { chord: 'D/F#', duration: 5.3, lyrics: 'With their tanks, and their bombs' }
        ]
      },
      {
        section: 'Coro',
        chords: [
          { chord: 'Em', duration: 5.3, lyrics: 'In your head, in your head, Zombie, Zombie' },
          { chord: 'C', duration: 5.3, lyrics: 'Zombie-ie-ie' },
          { chord: 'G', duration: 5.3, lyrics: 'What\'s in your head, in your head' },
          { chord: 'D/F#', duration: 5.3, lyrics: 'Zombie, Zombie, Zombie-ie-ie-ie' },
          { chord: 'Em', duration: 5.3, lyrics: 'Oh-oh-oh-oh-oh-oh' },
          { chord: 'C', duration: 5.3 },
          { chord: 'G', duration: 5.3 },
          { chord: 'D/F#', duration: 25 }
        ]
      }
    ]),
    tips: [
      {
        id: 'zb-1',
        author: 'Elena Gomez',
        avatar: 'EG',
        timeAgo: 'hace 3d',
        timestampSeconds: 42,
        content: 'El cambio a distorsión en 0:42 suena increíble si usas power chords Em5 - C5 - G5 - D5.',
        likes: 35
      }
    ]
  },
  {
    id: 'wonderwall',
    title: 'Wonderwall',
    artist: 'Oasis',
    year: 1995,
    album: "(What's the Story) Morning Glory?",
    bpm: 87,
    key: 'Em (Capo 2)',
    recommendedCapo: 2,
    youtubeId: 'bx1Bh8ZvH84',
    durationSeconds: 258,
    genre: 'Rock',
    chords: [
      {
        name: 'Em7',
        durationSeconds: 5.5,
        strummingHint: '↓ ↓ ↓ ↑ ↓ ↑',
        fingering: {
          strings: [0, 2, 2, 0, 3, 3],
          fingers: [0, 1, 2, 0, 3, 4],
          pianoKeys: [4, 7, 11, 2]
        }
      },
      {
        name: 'G',
        durationSeconds: 5.5,
        strummingHint: '↓ ↓ ↓ ↑ ↓ ↑',
        fingering: {
          strings: [3, 2, 0, 0, 3, 3],
          fingers: [2, 1, 0, 0, 3, 4],
          pianoKeys: [7, 11, 2]
        }
      },
      {
        name: 'Dsus4',
        durationSeconds: 5.5,
        strummingHint: '↓ ↓ ↓ ↑ ↓ ↑',
        fingering: {
          strings: [-1, -1, 0, 2, 3, 3],
          fingers: [0, 0, 0, 1, 2, 3],
          pianoKeys: [2, 7, 9]
        }
      },
      {
        name: 'A7sus4',
        durationSeconds: 5.5,
        strummingHint: '↓ ↓ ↓ ↑ ↓ ↑',
        fingering: {
          strings: [-1, 0, 2, 0, 3, 3],
          fingers: [0, 0, 1, 0, 2, 3],
          pianoKeys: [9, 2, 4, 7]
        }
      }
    ],
    timeline: createProgression([
      {
        section: 'Intro Acústica',
        chords: [
          { chord: 'Em7', duration: 5.5, lyrics: 'Rasgueo rítmico acústico Noel Gallagher' },
          { chord: 'G', duration: 5.5 },
          { chord: 'Dsus4', duration: 5.5 },
          { chord: 'A7sus4', duration: 5.5 }
        ]
      },
      {
        section: 'Verso 1',
        chords: [
          { chord: 'Em7', duration: 5.5, lyrics: 'Today is gonna be the day' },
          { chord: 'G', duration: 5.5, lyrics: 'That they\'re gonna throw it back to you' },
          { chord: 'Dsus4', duration: 5.5, lyrics: 'By now you should\'ve somehow' },
          { chord: 'A7sus4', duration: 5.5, lyrics: 'Realized what you gotta do' },
          { chord: 'Em7', duration: 5.5, lyrics: 'I don\'t believe that anybody' },
          { chord: 'G', duration: 5.5, lyrics: 'Feels the way I do about you now' },
          { chord: 'Dsus4', duration: 5.5 },
          { chord: 'A7sus4', duration: 5.5 }
        ]
      },
      {
        section: 'Coro',
        chords: [
          { chord: 'G', duration: 5.5, lyrics: 'Because maybe' },
          { chord: 'Em7', duration: 5.5, lyrics: 'You\'re gonna be the one that saves me' },
          { chord: 'Dsus4', duration: 5.5, lyrics: 'And after all' },
          { chord: 'A7sus4', duration: 5.5, lyrics: 'You\'re my wonderwall' }
        ]
      }
    ]),
    tips: [
      {
        id: 'ww-1',
        author: 'Noel G. Fan',
        avatar: 'NG',
        timeAgo: 'hace 4d',
        timestampSeconds: 0,
        content: '¡El secreto de Wonderwall! Los dedos 3 y 4 (anular y meñique) NUNCA se mueven de las cuerdas 1 y 2 en el traste 3.',
        likes: 89
      }
    ]
  },
  {
    id: 'creep',
    title: 'Creep',
    artist: 'Radiohead',
    year: 1992,
    album: 'Pablo Honey',
    bpm: 92,
    key: 'G',
    recommendedCapo: 0,
    youtubeId: 'XFkzRNyygfk',
    durationSeconds: 238,
    genre: 'Indie',
    chords: [
      {
        name: 'G',
        durationSeconds: 5.2,
        strummingHint: '↓ ↑ ↓ ↑ Arpegio',
        fingering: {
          strings: [3, 5, 5, 4, 3, 3],
          fingers: [1, 3, 4, 2, 1, 1],
          barre: { fret: 3, fromString: 6, toString: 1 },
          pianoKeys: [7, 11, 2]
        }
      },
      {
        name: 'B',
        durationSeconds: 5.2,
        strummingHint: '↓ ↑ ↓ ↑ Arpegio',
        fingering: {
          strings: [-1, 2, 4, 4, 4, 2],
          fingers: [0, 1, 2, 3, 4, 1],
          barre: { fret: 2, fromString: 5, toString: 1 },
          pianoKeys: [11, 3, 6]
        }
      },
      {
        name: 'C',
        durationSeconds: 5.2,
        strummingHint: '↓ ↑ ↓ ↑ Arpegio',
        fingering: {
          strings: [-1, 3, 5, 5, 5, 3],
          fingers: [0, 1, 2, 3, 4, 1],
          barre: { fret: 3, fromString: 5, toString: 1 },
          pianoKeys: [0, 4, 7]
        }
      },
      {
        name: 'Cm',
        durationSeconds: 5.2,
        strummingHint: '↓ ↑ ↓ ↑ Arpegio',
        fingering: {
          strings: [-1, 3, 5, 5, 4, 3],
          fingers: [0, 1, 3, 4, 2, 1],
          barre: { fret: 3, fromString: 5, toString: 1 },
          pianoKeys: [0, 3, 7]
        }
      }
    ],
    timeline: createProgression([
      {
        section: 'Intro Arpegio',
        chords: [
          { chord: 'G', duration: 5.2, lyrics: 'Arpegio limpio Thom Yorke' },
          { chord: 'B', duration: 5.2 },
          { chord: 'C', duration: 5.2 },
          { chord: 'Cm', duration: 5.2 }
        ]
      },
      {
        section: 'Verso 1',
        chords: [
          { chord: 'G', duration: 5.2, lyrics: 'When you were here before' },
          { chord: 'B', duration: 5.2, lyrics: 'Couldn\'t look you in the eye' },
          { chord: 'C', duration: 5.2, lyrics: 'You\'re just like an angel' },
          { chord: 'Cm', duration: 5.2, lyrics: 'Your skin makes me cry' },
          { chord: 'G', duration: 5.2, lyrics: 'You float like a feather' },
          { chord: 'B', duration: 5.2, lyrics: 'In a beautiful world' },
          { chord: 'C', duration: 5.2, lyrics: 'I wish I was special' },
          { chord: 'Cm', duration: 5.2, lyrics: 'You\'re so fuckin\' special' }
        ]
      },
      {
        section: 'Estallido y Coro',
        chords: [
          { chord: 'G', duration: 5.2, lyrics: '¡Clack-clack de Greenwood! But I\'m a creep' },
          { chord: 'B', duration: 5.2, lyrics: 'I\'m a weirdo' },
          { chord: 'C', duration: 5.2, lyrics: 'What the hell am I doin\' here?' },
          { chord: 'Cm', duration: 15, lyrics: 'I don\'t belong here' }
        ]
      }
    ]),
    tips: [
      {
        id: 'cr-1',
        author: 'Thom Yorke admirador',
        avatar: 'TY',
        timeAgo: 'hace 6d',
        timestampSeconds: 58,
        content: 'El "clack-clack" de Jonny Greenwood antes del estribillo en 0:58 son rasgueos muteados con la mano izquierda apoyada.',
        likes: 54
      }
    ]
  },
  {
    id: 'let-it-be',
    title: 'Let It Be',
    artist: 'The Beatles',
    year: 1970,
    album: 'Let It Be',
    bpm: 71,
    key: 'C',
    recommendedCapo: 0,
    youtubeId: 'QDYfEBY9NM4',
    durationSeconds: 243,
    genre: 'Pop',
    chords: [
      {
        name: 'C',
        durationSeconds: 3.4,
        strummingHint: '↓ ↓ ↓ ↓ Piano pulse',
        fingering: {
          strings: [-1, 3, 2, 0, 1, 0],
          fingers: [0, 3, 2, 0, 1, 0],
          pianoKeys: [0, 4, 7]
        }
      },
      {
        name: 'G',
        durationSeconds: 3.4,
        strummingHint: '↓ ↓ ↓ ↓ Piano pulse',
        fingering: {
          strings: [3, 2, 0, 0, 0, 3],
          fingers: [2, 1, 0, 0, 0, 3],
          pianoKeys: [7, 11, 2]
        }
      },
      {
        name: 'Am',
        durationSeconds: 3.4,
        strummingHint: '↓ ↓ ↓ ↓ Piano pulse',
        fingering: {
          strings: [-1, 0, 2, 2, 1, 0],
          fingers: [0, 0, 2, 3, 1, 0],
          pianoKeys: [9, 0, 4]
        }
      },
      {
        name: 'F',
        durationSeconds: 3.4,
        strummingHint: '↓ ↓ ↓ ↓ Piano pulse',
        fingering: {
          strings: [1, 3, 3, 2, 1, 1],
          fingers: [1, 3, 4, 2, 1, 1],
          barre: { fret: 1, fromString: 6, toString: 1 },
          pianoKeys: [5, 9, 0]
        }
      }
    ],
    timeline: createProgression([
      {
        section: 'Intro Piano',
        chords: [
          { chord: 'C', duration: 3.4, lyrics: 'Intro piano Paul McCartney' },
          { chord: 'G', duration: 3.4 },
          { chord: 'Am', duration: 3.4 },
          { chord: 'F', duration: 3.4 },
          { chord: 'C', duration: 3.4 },
          { chord: 'G', duration: 3.4 },
          { chord: 'F', duration: 3.4 },
          { chord: 'C', duration: 3.4 }
        ]
      },
      {
        section: 'Verso 1',
        chords: [
          { chord: 'C', duration: 3.4, lyrics: 'When I find myself in times of trouble' },
          { chord: 'G', duration: 3.4, lyrics: 'Mother Mary comes to me' },
          { chord: 'Am', duration: 3.4, lyrics: 'Speaking words of wisdom' },
          { chord: 'F', duration: 3.4, lyrics: 'Let it be' },
          { chord: 'C', duration: 3.4, lyrics: 'And in my hour of darkness' },
          { chord: 'G', duration: 3.4, lyrics: 'She is standing right in front of me' },
          { chord: 'F', duration: 3.4, lyrics: 'Speaking words of wisdom' },
          { chord: 'C', duration: 3.4, lyrics: 'Let it be' }
        ]
      },
      {
        section: 'Coro',
        chords: [
          { chord: 'Am', duration: 3.4, lyrics: 'Let it be, let it be' },
          { chord: 'G', duration: 3.4, lyrics: 'Let it be, let it be' },
          { chord: 'F', duration: 3.4, lyrics: 'Whisper words of wisdom' },
          { chord: 'C', duration: 15, lyrics: 'Let it be' }
        ]
      }
    ]),
    tips: [
      {
        id: 'lib-1',
        author: 'Paul M. fan',
        avatar: 'PM',
        timeAgo: 'hace 3d',
        timestampSeconds: 0,
        content: 'Perfecto para empezar en piano y guitarra. La cadencia C - G - Am - F es la progresión más hermosa de la historia.',
        likes: 61
      }
    ]
  }
];
