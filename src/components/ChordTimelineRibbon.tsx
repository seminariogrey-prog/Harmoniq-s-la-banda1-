import React, { useRef, useEffect } from 'react';
import { TimedChordEvent } from '../types/music';

interface ChordTimelineRibbonProps {
  timeline: TimedChordEvent[];
  currentTime: number;
  duration: number;
  onSelectTime: (time: number) => void;
  activeChordId?: string;
}

export const ChordTimelineRibbon: React.FC<ChordTimelineRibbonProps> = ({
  timeline,
  currentTime,
  duration,
  onSelectTime,
  activeChordId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the ribbon to keep the active chord in view
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeChordId]);

  return (
    <div className="glass rounded-2xl p-4 border border-white/10 shadow-lg space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Línea de Tiempo de Acordes Sincronizados</span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {timeline.length} cambios de acorde
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Haz clic en cualquier bloque para saltar</span>
      </div>

      {/* Horizontal scrollable chord events strip */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent select-none"
      >
        {timeline.map((event) => {
          const isActive =
            event.id === activeChordId ||
            (currentTime >= event.startTime && currentTime < event.endTime);

          return (
            <button
              key={event.id}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onSelectTime(event.startTime)}
              className={`flex-col items-center justify-between p-2.5 rounded-xl border text-left shrink-0 transition-all min-w-[84px] max-w-[130px] group ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/25 to-purple-500/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 scale-[1.03] ring-1 ring-cyan-300'
                  : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400'
              }`}
            >
              {/* Top: Section tag */}
              <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400 mb-1">
                <span className="truncate max-w-[50px]">{event.section}</span>
                <span className="text-[9px] tabular-nums">
                  {Math.floor(event.startTime / 60)}:
                  {String(Math.floor(event.startTime % 60)).padStart(2, '0')}
                </span>
              </div>

              {/* Middle: Chord Name */}
              <div
                className={`text-xl font-black font-mono tracking-tight my-0.5 ${
                  isActive ? 'text-white' : 'text-slate-200 group-hover:text-cyan-300'
                }`}
              >
                {event.chordName}
              </div>

              {/* Bottom: Lyrics snippet */}
              <div className="w-full text-[10px] truncate text-slate-400 mt-1 font-sans">
                {event.lyricsSnippet || '·'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
