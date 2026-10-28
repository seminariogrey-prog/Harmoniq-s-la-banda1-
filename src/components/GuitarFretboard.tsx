import React from 'react';
import { ChordFingering } from '../types/music';

interface GuitarFretboardProps {
  chordName: string;
  fingering: ChordFingering;
  capoFret?: number;
  activeStringIndex?: number | null; // 0 = 6th string, 5 = 1st string
  activeFret?: number | null;
  activeNoteName?: string | null;
  isArpeggioMode?: boolean;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({
  chordName,
  fingering,
  capoFret = 0,
  activeStringIndex = null,
  activeFret = null,
  activeNoteName = null,
  isArpeggioMode = false,
}) => {
  const strings = fingering.strings; // 6 values: [E, A, D, G, B, e]
  const fingers = fingering.fingers;
  const numFrets = 5;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center justify-between w-full mb-2 px-1 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          {isArpeggioMode ? 'Mástil · Arpegio en Vivo' : 'Diagrama de Guitarra'}
        </span>
        {capoFret > 0 && (
          <span className="text-[11px] text-cyan-400 font-mono">Capo Traste {capoFret}</span>
        )}
      </div>

      <div className="relative w-56 h-64 bg-[#141418] rounded-xl border border-white/10 p-4 shadow-xl flex flex-col justify-between overflow-hidden">
        {/* Subtle ambient arpeggio glow */}
        {isArpeggioMode && activeStringIndex !== null && (
          <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none transition-opacity" />
        )}

        {/* Top Nut / Capo indicator */}
        <div className="relative w-full">
          {/* String status markers (X, O, or blank) */}
          <div className="flex justify-between px-1 mb-1.5 text-xs font-mono font-bold">
            {strings.map((fret, i) => {
              const isStringActive = activeStringIndex === i;

              if (fret === -1) {
                return (
                  <span key={i} className="text-rose-500 w-4 text-center">
                    ✕
                  </span>
                );
              }
              if (fret === 0) {
                return (
                  <span
                    key={i}
                    className={`w-4 text-center transition-all ${
                      isStringActive && isArpeggioMode
                        ? 'text-emerald-300 font-black scale-125 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : 'text-cyan-400'
                    }`}
                  >
                    ○
                  </span>
                );
              }
              return (
                <span key={i} className="w-4 text-center opacity-0">
                  ·
                </span>
              );
            })}
          </div>

          {/* Nut bar */}
          <div
            className={`w-full h-1.5 rounded-sm ${
              capoFret > 0 ? 'bg-cyan-400 shadow-sm shadow-cyan-500/50' : 'bg-slate-200'
            }`}
          />
        </div>

        {/* Fret grid */}
        <div className="relative flex-1 flex flex-col justify-between my-1">
          {/* Horizontal Frets */}
          {Array.from({ length: numFrets }).map((_, fIdx) => (
            <div key={fIdx} className="w-full relative">
              <div className="w-full h-px bg-white/20" />
              {/* Fret number label on side */}
              <span className="absolute -left-3.5 -top-2 text-[10px] font-mono text-slate-500">
                {fIdx + 1}
              </span>
            </div>
          ))}

          {/* Vertical Strings (6 strings, from thickest 6th E on left to thinnest 1st e on right) */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
            {[2.5, 2.0, 1.6, 1.2, 0.9, 0.6].map((thickness, sIdx) => {
              const isStringActive = activeStringIndex === sIdx;
              return (
                <div
                  key={sIdx}
                  className={`h-full transition-all duration-75 ${
                    isStringActive && isArpeggioMode
                      ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] scale-x-125'
                      : 'bg-slate-400/50'
                  }`}
                  style={{ width: `${thickness}px` }}
                />
              );
            })}
          </div>

          {/* Barre line if applicable */}
          {fingering.barre && (
            <div
              className="absolute gradient-bg rounded-full h-5 z-10 opacity-90 shadow-md flex items-center justify-center text-[10px] text-white font-bold"
              style={{
                top: `${((fingering.barre.fret - 0.5) / numFrets) * 100}%`,
                transform: 'translateY(-50%)',
                left: `${((6 - fingering.barre.fromString) / 5) * 80 + 8}%`,
                right: `${((fingering.barre.toString - 1) / 5) * 80 + 8}%`,
              }}
            >
              1
            </div>
          )}

          {/* Finger dots */}
          {strings.map((fret, stringIdx) => {
            if (fret <= 0 || fret > numFrets) return null;
            const fingerNum = fingers[stringIdx] || 1;
            const isNoteActive =
              activeStringIndex === stringIdx &&
              (activeFret === null || activeFret === fret);

            // horizontal position: 6 strings mapped left to right (stringIdx 0 is 6th string, stringIdx 5 is 1st)
            const leftPercent = 4 + (stringIdx / 5) * 92;
            const topPercent = ((fret - 0.5) / numFrets) * 100;

            return (
              <div
                key={stringIdx}
                className={`absolute z-20 w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg transition-all ${
                  isNoteActive && isArpeggioMode
                    ? 'bg-cyan-300 ring-4 ring-cyan-400/80 scale-125 shadow-cyan-400/80 text-slate-950 animate-pulse'
                    : 'gradient-bg shadow-purple-500/40 border border-white/30'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                {fingerNum > 0 ? fingerNum : ''}
              </div>
            );
          })}
        </div>

        {/* Bottom String Tuning note badges */}
        <div className="flex justify-between px-1 text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
          {['E', 'A', 'D', 'G', 'B', 'e'].map((note, i) => {
            const isStringActive = activeStringIndex === i;
            return (
              <span
                key={i}
                className={`w-4 text-center transition-colors ${
                  isStringActive && isArpeggioMode ? 'text-cyan-400 font-bold' : ''
                }`}
              >
                {note}
              </span>
            );
          })}
        </div>
      </div>

      {/* Real-time Arpeggio Hint below fretboard */}
      {isArpeggioMode && activeStringIndex !== null ? (
        <div className="mt-2 text-xs font-mono text-cyan-300 flex items-center gap-1.5 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/50 shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>
            Pulsar: Cuerda {6 - activeStringIndex}ª ({activeNoteName || ''})
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 mt-2 font-mono">
          Dedos: 1 = Índice, 2 = Medio, 3 = Anular, 4 = Meñique
        </p>
      )}
    </div>
  );
};
