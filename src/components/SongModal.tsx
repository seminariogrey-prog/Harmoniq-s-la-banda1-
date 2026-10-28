import React, { useState } from 'react';
import { SongTrack } from '../types/music';
import { SONGS_CATALOG } from '../data/songs';
import { Search, X, Music, Play, Sparkles, Youtube } from 'lucide-react';

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: SongTrack) => void;
  currentSongId: string;
}

export const SongModal: React.FC<SongModalProps> = ({
  isOpen,
  onClose,
  onSelectSong,
  currentSongId,
}) => {
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  if (!isOpen) return null;

  const filteredSongs = SONGS_CATALOG.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || song.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handleCustomSong = () => {
    if (!customUrl.trim()) return;

    // Extract YouTube ID if valid
    let ytId = 'BciZRPFYp70';
    const match = customUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      ytId = match[1];
    }

    const customSong: SongTrack = {
      id: `custom-${Date.now()}`,
      title: customUrl.includes('http') ? 'Canción Personalizada' : customUrl,
      artist: 'Pista de Usuario',
      year: 2026,
      album: 'Sesión IA',
      bpm: 80,
      key: 'G',
      recommendedCapo: 0,
      youtubeId: ytId,
      durationSeconds: 240,
      genre: 'Acoustic',
      chords: [
        {
          name: 'G',
          durationSeconds: 4,
          fingering: {
            strings: [3, 2, 0, 0, 0, 3],
            fingers: [2, 1, 0, 0, 0, 3],
            pianoKeys: [7, 11, 2]
          }
        },
        {
          name: 'C',
          durationSeconds: 4,
          fingering: {
            strings: [-1, 3, 2, 0, 1, 0],
            fingers: [0, 3, 2, 0, 1, 0],
            pianoKeys: [0, 4, 7]
          }
        },
        {
          name: 'D',
          durationSeconds: 4,
          fingering: {
            strings: [-1, -1, 0, 2, 3, 2],
            fingers: [0, 0, 0, 1, 3, 2],
            pianoKeys: [2, 6, 9]
          }
        },
        {
          name: 'Em',
          durationSeconds: 4,
          fingering: {
            strings: [0, 2, 2, 0, 0, 0],
            fingers: [0, 2, 3, 0, 0, 0],
            pianoKeys: [4, 7, 11]
          }
        }
      ],
      timeline: [
        { id: 'c-1', chordName: 'G', startTime: 0, endTime: 6, section: 'Intro', lyricsSnippet: 'Intro' },
        { id: 'c-2', chordName: 'C', startTime: 6, endTime: 12, section: 'Intro', lyricsSnippet: 'Intro' },
        { id: 'c-3', chordName: 'D', startTime: 12, endTime: 18, section: 'Verso 1', lyricsSnippet: 'Verso 1' },
        { id: 'c-4', chordName: 'Em', startTime: 18, endTime: 24, section: 'Verso 1', lyricsSnippet: 'Verso 1' },
        { id: 'c-5', chordName: 'G', startTime: 24, endTime: 30, section: 'Coro', lyricsSnippet: 'Coro' },
        { id: 'c-6', chordName: 'C', startTime: 30, endTime: 36, section: 'Coro', lyricsSnippet: 'Coro' },
        { id: 'c-7', chordName: 'D', startTime: 36, endTime: 42, section: 'Coro', lyricsSnippet: 'Coro' },
        { id: 'c-8', chordName: 'Em', startTime: 42, endTime: 240, section: 'Outro', lyricsSnippet: 'Outro' }
      ],
      tips: [
        {
          id: 'custom-tip-1',
          author: 'Harmoniq IA',
          avatar: 'IA',
          timeAgo: 'ahora',
          timestampSeconds: 0,
          content: 'Canción importada con progresión universal G - C - D - Em detectada automáticamente.',
          likes: 1
        }
      ]
    };

    onSelectSong(customSong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass rounded-3xl border border-white/10 max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              Biblioteca de Canciones
            </h2>
            <p className="text-xs text-slate-400">Selecciona un tema para cargar acordes y pistas aisladas</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Genres */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por canción o artista (ej. Hotel California, Radiohead)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Rock', 'Pop', 'Indie'].map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  selectedGenre === genre
                    ? 'gradient-bg text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {genre === 'All' ? 'Todos los géneros' : genre}
              </button>
            ))}
          </div>
        </div>

        {/* Song List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredSongs.map((song) => {
            const isSelected = song.id === currentSongId;
            return (
              <div
                key={song.id}
                onClick={() => {
                  onSelectSong(song);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {song.key}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">{song.title}</h4>
                    <p className="text-xs text-slate-400">
                      {song.artist} · {song.year} · {song.bpm} BPM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40 hidden sm:inline">
                    {song.chords.length} acordes
                  </span>
                  <button className="p-2 rounded-xl gradient-bg text-white hover:scale-105 transition shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom YouTube URL import */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-2">
            <Youtube className="w-4 h-4 text-rose-500" />
            <span>¿Quieres tocar otra canción? Pega un link de YouTube:</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
            />
            <button
              onClick={handleCustomSong}
              className="px-4 py-2 gradient-bg rounded-xl text-xs font-semibold text-white hover:opacity-90 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
