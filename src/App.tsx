import React, { useState } from 'react';
import { SongTrack } from './types/music';
import { SONGS_CATALOG } from './data/songs';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { PlayerView } from './components/PlayerView';
import { SongModal } from './components/SongModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'player'>('landing');
  const [selectedSong, setSelectedSong] = useState<SongTrack>(SONGS_CATALOG[0]);
  const [isSongModalOpen, setIsSongModalOpen] = useState<boolean>(false);

  const handleSelectSong = (song: SongTrack) => {
    setSelectedSong(song);
  };

  const handleOpenPlayerWithSong = (song: SongTrack) => {
    setSelectedSong(song);
    setCurrentView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSongSelect={() => setIsSongModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            onSelectSong={handleSelectSong}
            onOpenPlayer={() => {
              setCurrentView('player');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <PlayerView
            song={selectedSong}
            onBack={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSongSelect={() => setIsSongModalOpen(true)}
          />
        )}
      </main>

      {/* Song Selection & YouTube import modal */}
      <SongModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        onSelectSong={(song) => {
          setSelectedSong(song);
          setCurrentView('player');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentSongId={selectedSong.id}
      />
    </div>
  );
}
