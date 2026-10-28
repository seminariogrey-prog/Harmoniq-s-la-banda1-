import React from 'react';

interface PianoKeyboardProps {
  chordName: string;
  activeKeys?: number[]; // indices 0 to 11 (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
  activeArpeggioKey?: number | null;
}

const KEYS = [
  { note: 'C', isBlack: false, midiIndex: 0 },
  { note: 'C#', isBlack: true, midiIndex: 1 },
  { note: 'D', isBlack: false, midiIndex: 2 },
  { note: 'D#', isBlack: true, midiIndex: 3 },
  { note: 'E', isBlack: false, midiIndex: 4 },
  { note: 'F', isBlack: false, midiIndex: 5 },
  { note: 'F#', isBlack: true, midiIndex: 6 },
  { note: 'G', isBlack: false, midiIndex: 7 },
  { note: 'G#', isBlack: true, midiIndex: 8 },
  { note: 'A', isBlack: false, midiIndex: 9 },
  { note: 'A#', isBlack: true, midiIndex: 10 },
  { note: 'B', isBlack: false, midiIndex: 11 },
];

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  chordName,
  activeKeys = [],
  activeArpeggioKey = null,
}) => {
  // Render 2 full octaves for richer chord display
  const fullOctaves = [...KEYS, ...KEYS];

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="flex items-center justify-between w-full mb-2 px-1 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Teclado de Piano · Arpegio</span>
        <span className="text-[11px] text-cyan-400 font-mono font-bold">{chordName}</span>
      </div>

      <div className="relative w-full h-36 bg-[#121216] rounded-xl border border-white/10 p-2 shadow-xl flex justify-center overflow-x-auto">
        <div className="relative flex h-full">
          {fullOctaves.map((k, idx) => {
            const isChordTone = activeKeys.includes(k.midiIndex);
            const isArpeggioPluck = activeArpeggioKey === k.midiIndex;

            if (!k.isBlack) {
              return (
                <div
                  key={idx}
                  className={`relative w-7 sm:w-8 h-full rounded-b border border-slate-700/60 transition-all flex flex-col justify-end items-center pb-1 ${
                    isArpeggioPluck
                      ? 'bg-cyan-300 text-slate-950 font-black shadow-lg shadow-cyan-400 scale-y-105 z-20'
                      : isChordTone
                      ? 'bg-gradient-to-t from-cyan-400 to-purple-400 text-slate-950 font-bold shadow-md shadow-cyan-500/50'
                      : 'bg-white hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-mono leading-none">{k.note}</span>
                  {(isChordTone || isArpeggioPluck) && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isArpeggioPluck ? 'bg-cyan-900 animate-ping' : 'bg-slate-900'
                      }`}
                    />
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* Absolute overlay of black keys */}
          <div className="absolute inset-0 pointer-events-none flex">
            {fullOctaves.map((k, idx) => {
              const isChordTone = activeKeys.includes(k.midiIndex);
              const isArpeggioPluck = activeArpeggioKey === k.midiIndex;

              if (!k.isBlack) {
                return <div key={idx} className="w-7 sm:w-8 shrink-0" />;
              }

              return (
                <div
                  key={idx}
                  className={`-ml-3 w-5 sm:w-5 h-20 rounded-b z-10 transition-all flex flex-col justify-end items-center pb-1 shadow-md ${
                    isArpeggioPluck
                      ? 'bg-cyan-400 text-slate-950 font-black ring-2 ring-white scale-110'
                      : isChordTone
                      ? 'bg-gradient-to-t from-purple-500 to-pink-500 text-white font-bold ring-2 ring-purple-300'
                      : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[9px] font-mono leading-none">{k.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 font-mono">
        Las teclas iluminadas corresponden a las notas del arpegio en la canción.
      </p>
    </div>
  );
};
