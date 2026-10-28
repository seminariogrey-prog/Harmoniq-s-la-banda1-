import React from 'react';
import { StemVolumes, StemMutes, StemSolos } from '../utils/audioEngine';
import { Volume2, VolumeX, Sliders, Music, Sparkles } from 'lucide-react';

interface StemMixerProps {
  volumes: StemVolumes;
  mutes: StemMutes;
  solos: StemSolos;
  onVolumeChange: (stem: keyof StemVolumes, value: number) => void;
  onToggleMute: (stem: keyof StemVolumes) => void;
  onToggleSolo: (stem: keyof StemVolumes) => void;
  onPreset: (preset: 'minusGuitar' | 'soloGuitar' | 'allMax' | 'reset') => void;
}

const STEM_CONFIG: {
  key: keyof StemVolumes;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'vocals', label: 'Voz', icon: '🎤', color: 'from-amber-400 to-rose-400' },
  { key: 'guitar', label: 'Guitarra', icon: '🎸', color: 'from-cyan-400 to-blue-500' },
  { key: 'keys', label: 'Teclado', icon: '🎹', color: 'from-purple-400 to-indigo-500' },
  { key: 'drums', label: 'Batería', icon: '🥁', color: 'from-emerald-400 to-teal-500' },
  { key: 'bass', label: 'Bajo', icon: '🎸', color: 'from-pink-400 to-rose-500' },
];

export const StemMixer: React.FC<StemMixerProps> = ({
  volumes,
  mutes,
  solos,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onPreset,
}) => {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              Mezclador de Pistas IA
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full gradient-bg text-white">
                PRO
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Aísla y silencia instrumentos individuales</p>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5 mb-5 pb-3 border-b border-white/5">
        <button
          onClick={() => onPreset('minusGuitar')}
          className={`px-2.5 py-1 text-xs rounded-lg border transition font-medium flex items-center gap-1 ${
            volumes.guitar === 0
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
          title="Baja la guitarra para tocar tú sobre la banda"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Sin Guitarra (Play Along)
        </button>
        <button
          onClick={() => onPreset('soloGuitar')}
          className="px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition font-medium"
        >
          Solo Guitarra
        </button>
        <button
          onClick={() => onPreset('reset')}
          className="px-2 py-1 text-xs rounded-lg text-slate-400 hover:text-slate-200 transition ml-auto"
        >
          Restablecer
        </button>
      </div>

      {/* 5 Stem Sliders */}
      <div className="grid grid-cols-5 gap-2 items-end justify-center py-2 bg-black/30 rounded-xl p-3 border border-white/5">
        {STEM_CONFIG.map(({ key, label, icon, color }) => {
          const val = volumes[key];
          const isMuted = mutes[key];
          const isSolo = solos[key];

          return (
            <div key={key} className="flex flex-col items-center gap-2">
              {/* Solo & Mute buttons */}
              <div className="flex gap-1 w-full justify-center">
                <button
                  onClick={() => onToggleSolo(key)}
                  className={`w-5 h-5 rounded text-[10px] font-bold transition flex items-center justify-center ${
                    isSolo
                      ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Solo"
                >
                  S
                </button>
                <button
                  onClick={() => onToggleMute(key)}
                  className={`w-5 h-5 rounded text-[10px] font-bold transition flex items-center justify-center ${
                    isMuted
                      ? 'bg-rose-500 text-white ring-1 ring-rose-300'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Mute"
                >
                  M
                </button>
              </div>

              {/* Volume value */}
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                {isMuted ? 'MUTE' : `${val}%`}
              </span>

              {/* Vertical slider */}
              <div className="relative flex items-center justify-center py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : val}
                  onChange={(e) => onVolumeChange(key, Number(e.target.value))}
                  className="vertical cursor-pointer"
                  title={`${label}: ${val}%`}
                />
              </div>

              {/* Track Name & Icon */}
              <div className="text-center mt-1">
                <div className="text-sm">{icon}</div>
                <div
                  className={`text-[10px] font-semibold truncate max-w-[52px] ${
                    key === 'guitar' ? 'text-cyan-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>💡 Baja la pista de guitarra al 0% y serás el guitarrista solista.</span>
      </div>
    </div>
  );
};
