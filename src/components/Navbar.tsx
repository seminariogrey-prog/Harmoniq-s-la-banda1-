import React from 'react';
import { Music, Play, Layers } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'player';
  onNavigate: (view: 'landing' | 'player') => void;
  onOpenSongSelect?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenSongSelect }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            Harmoniq
          </span>
        </button>

        {/* Zone 2: Clean single-line nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('landing')}
            className={`hover:text-white transition whitespace-nowrap shrink-0 ${
              currentView === 'landing' ? 'text-white' : ''
            }`}
          >
            Inicio
          </button>
          <button
            onClick={() => {
              if (onOpenSongSelect) onOpenSongSelect();
              else onNavigate('landing');
            }}
            className="hover:text-white transition whitespace-nowrap shrink-0"
          >
            Canciones
          </button>
          <button
            onClick={() => onNavigate('player')}
            className={`hover:text-white transition whitespace-nowrap shrink-0 ${
              currentView === 'player' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Estudio Interactivo
          </button>
          <a
            href="#features"
            onClick={() => onNavigate('landing')}
            className="hover:text-white transition whitespace-nowrap shrink-0"
          >
            Superpoderes IA
          </a>
        </div>

        {/* Zone 3: 1 Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentView === 'landing' ? (
            <button
              onClick={() => onNavigate('player')}
              className="gradient-bg text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/30 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              Probar Estudio Gratis
            </button>
          ) : (
            <button
              onClick={() => onNavigate('landing')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition whitespace-nowrap"
            >
              Volver al Inicio
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
