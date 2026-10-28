import React from 'react';
import { ArpeggioNote } from '../types/music';

interface ArpeggioTabViewerProps {
  chordName: string;
  arpeggioPattern: ArpeggioNote[];
  currentStep: number; // 0 to pattern.length - 1
  bpm: number;
}

const STRING_NAMES = [
  { name: 'e', label: '1ª (e)' },
  { name: 'B', label: '2ª (B)' },
  { name: 'G', label: '3ª (G)' },
  { name: 'D', label: '4ª (D)' },
  { name: 'A', label: '5ª (A)' },
  { name: 'E', label: '6ª (E)' },
];

export const ArpeggioTabViewer: React.FC<ArpeggioTabViewerProps> = ({
  chordName,
  arpeggioPattern,
  currentStep,
  bpm,
}) => {
  if (!arpeggioPattern || arpeggioPattern.length === 0) {
    return null;
  }

  const activeNote = arpeggioPattern[currentStep % arpeggioPattern.length];

  return (
    <div className="glass rounded-2xl p-4 border border-white/10 shadow-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            Tablatura de Arpegio Nota por Nota ({chordName})
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {arpeggioPattern.length} notas por compás
          </span>
        </div>

        {activeNote && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Pulsando:</span>
            <span className="text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              {activeNote.noteName} · Cuerda {6 - activeNote.stringIndex}ª (Traste {activeNote.fret})
            </span>
          </div>
        )}
      </div>

      {/* Tablature 6-line staff */}
      <div className="relative bg-[#0d0d12] rounded-xl p-3 border border-white/5 overflow-x-auto select-none">
        <div className="min-w-[420px] flex flex-col gap-2 py-1 relative">
          {/* 6 lines: string 1 (index 5) down to string 6 (index 0) */}
          {STRING_NAMES.map((strInfo, lineIdx) => {
            // stringIndex in ChordFingering: 0 = low E (string 6), 5 = high e (string 1)
            // So lineIdx 0 (high e) maps to stringIndex 5
            const targetStringIndex = 5 - lineIdx;

            return (
              <div key={lineIdx} className="relative flex items-center h-5">
                {/* String name tag */}
                <span className="w-12 text-[10px] font-mono text-slate-400 shrink-0 font-bold">
                  {strInfo.label}
                </span>

                {/* Horizontal string line */}
                <div className="flex-1 h-px bg-slate-700/80 relative flex items-center">
                  {/* Step notes along the string */}
                  <div className="w-full grid grid-cols-8 gap-1 px-4">
                    {arpeggioPattern.map((note, stepIdx) => {
                      const isPlayedOnThisString = note.stringIndex === targetStringIndex;
                      const isCurrentStep = stepIdx === (currentStep % arpeggioPattern.length);

                      return (
                        <div key={stepIdx} className="flex justify-center items-center relative">
                          {isPlayedOnThisString ? (
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                                isCurrentStep
                                  ? 'bg-cyan-400 text-slate-950 scale-125 shadow-lg shadow-cyan-400/80 ring-2 ring-white z-20'
                                  : 'bg-zinc-800 text-slate-300 border border-slate-600'
                              }`}
                            >
                              {note.fret}
                            </div>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                              —
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Numbers & Finger guide below tab */}
        <div className="min-w-[420px] flex items-center pl-16 pr-4 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500 justify-between">
          {arpeggioPattern.map((note, idx) => {
            const isCurrent = idx === (currentStep % arpeggioPattern.length);
            return (
              <div
                key={idx}
                className={`text-center w-6 transition-colors ${
                  isCurrent ? 'text-cyan-400 font-bold' : ''
                }`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>💡 El arpegio avanza automáticamente sincronizado con el tempo ({bpm} BPM) del vídeo.</span>
        <span className="font-mono text-xs text-cyan-400">
          Nota {((currentStep % arpeggioPattern.length) + 1)} de {arpeggioPattern.length}
        </span>
      </div>
    </div>
  );
};
