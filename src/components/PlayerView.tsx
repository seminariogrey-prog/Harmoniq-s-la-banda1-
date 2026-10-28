import React, { useState, useEffect, useRef } from 'react';
import { SongTrack, DifficultyLevel, ChordDetail, SongTip, TimedChordEvent } from '../types/music';
import { GuitarFretboard } from './GuitarFretboard';
import { PianoKeyboard } from './PianoKeyboard';
import { StemMixer } from './StemMixer';
import { PitchFeedback } from './PitchFeedback';
import { YouTubeSyncPlayer } from './YouTubeSyncPlayer';
import { ChordTimelineRibbon } from './ChordTimelineRibbon';
import { ArpeggioTabViewer } from './ArpeggioTabViewer';
import { generateArpeggioPattern } from '../data/songs';
import { audioEngine, StemVolumes, StemMutes, StemSolos } from '../utils/audioEngine';
import { getChordFingeringForCapo } from '../utils/chordTransposer';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Maximize2,
  Minimize2,
  Heart,
  Share2,
  ListMusic,
  Clock,
  Sparkles,
  Guitar,
  MessageSquare,
  Repeat,
  Plus,
  Music,
  SlidersHorizontal
} from 'lucide-react';

interface PlayerViewProps {
  song: SongTrack;
  onBack: () => void;
  onOpenSongSelect: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  song,
  onBack,
  onOpenSongSelect,
}) => {
  // Playback state synchronized with YouTube
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [metronomeOn, setMetronomeOn] = useState<boolean>(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [syncOffset, setSyncOffset] = useState<number>(0.0); // Offset in seconds
  const [audioSource, setAudioSource] = useState<'youtube' | 'stems' | 'both'>('youtube');

  // Mode: Arpeggio (Note-by-note following song) vs Full Strumming
  const [playMode, setPlayMode] = useState<'arpeggio' | 'strumming'>('arpeggio');

  // Focus mode
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Instrument view: guitar vs piano
  const [instrumentType, setInstrumentType] = useState<'guitar' | 'piano'>('guitar');

  // Capo and difficulty settings
  const [capoFret, setCapoFret] = useState<number>(song.recommendedCapo || 0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('original');

  // Stems mixer state
  const [volumes, setVolumes] = useState<StemVolumes>({
    vocals: 80,
    guitar: 0, // 0% by default so the user plays lead guitar/arpeggios!
    keys: 70,
    drums: 90,
    bass: 75,
  });
  const [mutes, setMutes] = useState<StemMutes>({
    vocals: false,
    guitar: false,
    keys: false,
    drums: false,
    bass: false,
  });
  const [solos, setSolos] = useState<StemSolos>({
    vocals: false,
    guitar: false,
    keys: false,
    drums: false,
    bass: false,
  });

  // Tips state
  const [tips, setTips] = useState<SongTip[]>(song.tips);
  const [newTipText, setNewTipText] = useState<string>('');
  const [showAddTip, setShowAddTip] = useState<boolean>(false);

  // Heart & share state
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Track previous chord and arpeggio step to avoid redundant triggers
  const prevChordRef = useRef<string>('');
  const prevArpeggioStepRef = useRef<number>(-1);

  // Reset states when song changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setSeekTime(0);
    setCapoFret(song.recommendedCapo || 0);
    setTips(song.tips);
    setSyncOffset(0.0);
    audioEngine.stop();
  }, [song.id]);

  // Sync audio engine volume / mutes / solos
  useEffect(() => {
    audioEngine.setVolumes(volumes, mutes, solos);
  }, [volumes, mutes, solos]);

  // Sync BPM & metronome
  useEffect(() => {
    audioEngine.setBpm(Math.round(song.bpm * speed));
  }, [song.bpm, speed]);

  useEffect(() => {
    audioEngine.setMetronome(metronomeOn);
  }, [metronomeOn]);

  // 1. Identify active chord event based on current time
  const timeline = song.timeline && song.timeline.length > 0 ? song.timeline : [];
  let activeEventIndex = timeline.findIndex(
    (ev) => currentTime >= ev.startTime && currentTime < ev.endTime
  );
  if (activeEventIndex === -1) {
    if (currentTime >= (timeline[timeline.length - 1]?.endTime || song.durationSeconds)) {
      activeEventIndex = timeline.length - 1;
    } else {
      activeEventIndex = 0;
    }
  }

  const activeEvent: TimedChordEvent = timeline[activeEventIndex] || {
    id: 'def',
    chordName: song.chords[0]?.name || 'Bm',
    startTime: 0,
    endTime: 4,
    section: 'Intro',
    lyricsSnippet: 'Intro'
  };

  // 2. Resolve Chord Details (fingering, beginner/advanced variations, capo transpositions)
  const baseChordDetail =
    song.chords.find((c) => c.name === activeEvent.chordName) ||
    song.chords[0] || {
      name: activeEvent.chordName,
      durationSeconds: 4,
      fingering: { strings: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], pianoKeys: [0, 4, 9] }
    };

  let displayChordName = baseChordDetail.name;
  let displayFingering = baseChordDetail.fingering;

  if (difficulty === 'beginner') {
    if (baseChordDetail.beginnerName) displayChordName = baseChordDetail.beginnerName;
    if (baseChordDetail.beginnerFingering) displayFingering = baseChordDetail.beginnerFingering;
  } else if (difficulty === 'advanced') {
    if (baseChordDetail.advancedName) displayChordName = baseChordDetail.advancedName;
    if (baseChordDetail.advancedFingering) displayFingering = baseChordDetail.advancedFingering;
  }

  if (capoFret > 0 && difficulty === 'original') {
    const transposed = getChordFingeringForCapo(baseChordDetail.name, capoFret, displayFingering);
    displayChordName = transposed.chordName;
    displayFingering = transposed.shapeFingering;
  }

  // 3. Arpeggio Calculations synchronized with song time and BPM
  const arpeggioPattern =
    baseChordDetail.arpeggioPattern ||
    generateArpeggioPattern(displayFingering.strings, displayFingering.fingers);

  const elapsedInChord = Math.max(0, currentTime - activeEvent.startTime);
  // An 8th note arpeggio step duration = (60 / BPM) / 2
  const eighthNoteSec = (60 / (song.bpm * speed)) * 0.5;
  const currentArpeggioStep =
    arpeggioPattern.length > 0
      ? Math.floor(elapsedInChord / Math.max(0.18, eighthNoteSec)) % arpeggioPattern.length
      : 0;
  const currentArpeggioNote = arpeggioPattern[currentArpeggioStep];

  // Trigger individual arpeggio note pluck in audio synthesizer if guitar is unmuted
  useEffect(() => {
    if (
      isPlaying &&
      currentArpeggioNote &&
      currentArpeggioStep !== prevArpeggioStepRef.current
    ) {
      prevArpeggioStepRef.current = currentArpeggioStep;

      if (
        (audioSource === 'stems' || audioSource === 'both') &&
        volumes.guitar > 0 &&
        !mutes.guitar
      ) {
        // Base string open string frequencies: E2=82.4, A2=110, D3=146.8, G3=196, B3=246.9, E4=329.6
        const baseFreqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
        const stringBase = baseFreqs[currentArpeggioNote.stringIndex] || 110;
        const noteFreq = stringBase * Math.pow(2, currentArpeggioNote.fret / 12);
        audioEngine.triggerArpeggioPluck(noteFreq);
      }
    }
  }, [
    currentArpeggioStep,
    isPlaying,
    audioSource,
    volumes.guitar,
    mutes.guitar,
    currentArpeggioNote,
  ]);

  // Update audio synthesizer when chord transitions
  useEffect(() => {
    if (activeEvent.chordName !== prevChordRef.current) {
      prevChordRef.current = activeEvent.chordName;
      audioEngine.setChord(activeEvent.chordName);
    }
  }, [activeEvent.chordName]);

  // Synchronized playback controls
  const handleTimeUpdateFromPlayer = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleStateChangeFromPlayer = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) {
      if (audioSource === 'stems' || audioSource === 'both') {
        audioEngine.start();
      }
    } else {
      audioEngine.stop();
    }
  };

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      if (audioSource === 'stems' || audioSource === 'both') {
        audioEngine.start();
      }
    } else {
      audioEngine.stop();
    }
  };

  const handleSeek = (seconds: number) => {
    const target = Math.max(0, Math.min(song.durationSeconds, seconds));
    setCurrentTime(target);
    setSeekTime(target);
  };

  // Upcoming chords from timeline
  const nextEvent1 = timeline[activeEventIndex + 1];
  const nextEvent2 = timeline[activeEventIndex + 2];
  const nextEvent3 = timeline[activeEventIndex + 3];

  const calcSecondsUntil = (ev?: TimedChordEvent) => {
    if (!ev) return null;
    const diff = Math.max(0, Math.round(ev.startTime - currentTime));
    return `${diff}s`;
  };

  // Mixer handlers
  const handleVolumeChange = (stem: keyof StemVolumes, val: number) => {
    setVolumes((prev) => ({ ...prev, [stem]: val }));
  };

  const handleToggleMute = (stem: keyof StemVolumes) => {
    setMutes((prev) => ({ ...prev, [stem]: !prev[stem] }));
  };

  const handleToggleSolo = (stem: keyof StemVolumes) => {
    setSolos((prev) => ({ ...prev, [stem]: !prev[stem] }));
  };

  const handlePreset = (preset: 'minusGuitar' | 'soloGuitar' | 'allMax' | 'reset') => {
    if (preset === 'minusGuitar') {
      setVolumes({ vocals: 85, guitar: 0, keys: 75, drums: 90, bass: 80 });
      setMutes({ vocals: false, guitar: false, keys: false, drums: false, bass: false });
      setSolos({ vocals: false, guitar: false, keys: false, drums: false, bass: false });
    } else if (preset === 'soloGuitar') {
      setVolumes({ vocals: 80, guitar: 100, keys: 70, drums: 90, bass: 75 });
      setSolos({ vocals: false, guitar: true, keys: false, drums: false, bass: false });
    } else if (preset === 'reset') {
      setVolumes({ vocals: 80, guitar: 70, keys: 70, drums: 80, bass: 75 });
      setMutes({ vocals: false, guitar: false, keys: false, drums: false, bass: false });
      setSolos({ vocals: false, guitar: false, keys: false, drums: false, bass: false });
    }
  };

  // Add tip handler
  const handleAddTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTipText.trim()) return;

    const newTip: SongTip = {
      id: `tip-${Date.now()}`,
      author: 'Tú',
      avatar: 'TU',
      timeAgo: 'ahora',
      timestampSeconds: Math.floor(currentTime),
      content: newTipText,
      likes: 1,
    };

    setTips([newTip, ...tips]);
    setNewTipText('');
    setShowAddTip(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col font-sans">
      {/* TOP BAR */}
      <div className="glass sticky top-0 z-40 border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back & Song Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Volver</span>
            </button>

            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md">
              <Guitar className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-white truncate flex items-center gap-2">
                {song.title}
                <button
                  onClick={onOpenSongSelect}
                  className="text-[11px] font-normal text-cyan-400 hover:underline flex items-center gap-0.5 ml-1"
                >
                  <ListMusic className="w-3 h-3" />
                  (Cambiar)
                </button>
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {song.artist} · {song.album} ({song.year})
              </p>
            </div>
          </div>

          {/* Musical Metadata badges */}
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TONO:</span>
              <span className="gradient-text font-bold">{song.key}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">BPM:</span>
              <span className="text-white font-bold">{song.bpm}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">CAPO:</span>
              <span className="text-white font-bold">{capoFret}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">SECCIÓN:</span>
              <span className="text-cyan-300 font-bold px-1.5 py-0.5 bg-cyan-950/60 rounded border border-cyan-800/40">
                {activeEvent.section}
              </span>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Metronome toggle */}
            <button
              onClick={() => setMetronomeOn(!metronomeOn)}
              className={`p-2 rounded-xl transition text-xs flex items-center gap-1 font-mono ${
                metronomeOn
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Metrónomo"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden lg:inline">{metronomeOn ? 'Bic: On' : 'Bic'}</span>
            </button>

            {/* Focus mode toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-2 rounded-xl transition ${
                isFocusMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={isFocusMode ? 'Salir del modo foco' : 'Modo Foco (Zen)'}
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Favorite */}
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-xl transition ${
                isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Guardar en favoritos"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition relative"
              title="Copiar enlace"
            >
              <Share2 className="w-4 h-4" />
              {copiedShare && (
                <span className="absolute -bottom-8 right-0 text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded shadow">
                  ¡Copiado!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div
        className={`flex-1 grid gap-6 p-4 sm:p-6 transition-all ${
          isFocusMode ? 'grid-cols-1 max-w-5xl mx-auto w-full' : 'lg:grid-cols-[1fr_380px]'
        }`}
      >
        {/* LEFT COLUMN: Synchronized YouTube Video + Arpeggio Tab + Main Chord Display + Timeline + Controls */}
        <div className="space-y-6">
          {/* 1. Synchronized YouTube Player */}
          {!isFocusMode && (
            <YouTubeSyncPlayer
              youtubeId={song.youtubeId}
              isPlaying={isPlaying}
              onPlayerTimeUpdate={handleTimeUpdateFromPlayer}
              onPlayerStateChange={handleStateChangeFromPlayer}
              seekTime={seekTime}
              onSeekHandled={() => setSeekTime(null)}
              playbackSpeed={speed}
              audioSource={audioSource}
              onToggleAudioSource={setAudioSource}
              syncOffset={syncOffset}
            />
          )}

          {/* 2. Calibration & Mode Toggle Bar */}
          <div className="glass rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border border-white/5">
            {/* Play Mode Switcher: Arpeggio vs Strumming */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              <span className="text-slate-400 px-1 hidden sm:inline">Modo:</span>
              <button
                onClick={() => setPlayMode('arpeggio')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  playMode === 'arpeggio'
                    ? 'gradient-bg text-white shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sigue el punteo y arpegio de notas individuales sincronizado con la canción"
              >
                <Music className="w-3.5 h-3.5" />
                Arpegio Nota por Nota
              </button>
              <button
                onClick={() => setPlayMode('strumming')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  playMode === 'strumming'
                    ? 'gradient-bg text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Muestra el acorde completo para rasgueo"
              >
                <Guitar className="w-3.5 h-3.5" />
                Rasgueo de Acordes
              </button>
            </div>

            {/* Sync Offset Calibration */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">Calibrar Sincronía:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSyncOffset((prev) => Math.round((prev - 0.2) * 10) / 10)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px] text-slate-300 transition"
                  title="Retrasar 0.2s"
                >
                  -0.2s
                </button>
                <button
                  onClick={() => setSyncOffset(0.0)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px] text-slate-400 hover:text-white transition"
                  title="Restablecer"
                >
                  0
                </button>
                <button
                  onClick={() => setSyncOffset((prev) => Math.round((prev + 0.2) * 10) / 10)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px] text-slate-300 transition"
                  title="Adelantar 0.2s"
                >
                  +0.2s
                </button>
              </div>
            </div>
          </div>

          {/* 3. Chord Timeline Ribbon */}
          <ChordTimelineRibbon
            timeline={timeline}
            currentTime={currentTime}
            duration={song.durationSeconds}
            onSelectTime={handleSeek}
            activeChordId={activeEvent.id}
          />

          {/* 4. MAIN CHORD DISPLAY CARD */}
          <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
            {/* Ambient glow */}
            <div className="absolute inset-0 gradient-bg opacity-10 blur-3xl pointer-events-none" />

            {/* Header: section title + instrument switcher */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-cyan-400 font-bold">{activeEvent.section}</span>
                {activeEvent.lyricsSnippet && (
                  <span className="text-slate-300 font-sans normal-case hidden sm:inline font-medium">
                    · "{activeEvent.lyricsSnippet}"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setInstrumentType('guitar')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    instrumentType === 'guitar'
                      ? 'gradient-bg text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎸 Guitarra
                </button>
                <button
                  onClick={() => setInstrumentType('piano')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    instrumentType === 'piano'
                      ? 'gradient-bg text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎹 Piano
                </button>
              </div>
            </div>

            {/* Split: Big Chord Letter on left + Interactive Diagram on right */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
              {/* Massive Chord Title & Arpeggio Guidance */}
              <div className="text-center md:text-left flex flex-col items-center md:items-start justify-center">
                <div
                  key={displayChordName}
                  className="text-7xl sm:text-8xl md:text-9xl font-black gradient-text font-mono chord-animate tracking-tight"
                >
                  {displayChordName}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {playMode === 'arpeggio' && currentArpeggioNote ? (
                    <span className="text-xs font-mono px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 animate-pulse">
                      <Music className="w-3.5 h-3.5" />
                      Nota {currentArpeggioStep + 1}: {currentArpeggioNote.noteName} (Cuerda {6 - currentArpeggioNote.stringIndex}ª)
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                      Ritmo: {baseChordDetail.strummingHint || '↓ ↓ ↑ ↑ ↓ ↑'}
                    </span>
                  )}

                  {difficulty === 'beginner' && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Modo Principiante
                    </span>
                  )}
                  {capoFret > 0 && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Capo {capoFret}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-3 max-w-sm">
                  {playMode === 'arpeggio'
                    ? 'El mástil resalta en verde y cian la cuerda y traste exactos que debes pulsar en este compás.'
                    : displayChordName.startsWith('B')
                    ? 'Presiona firmemente la cejilla sobre las 5 cuerdas con el dedo índice.'
                    : 'Mantén los dedos arqueados para que las notas resuenen limpias.'}
                </p>
              </div>

              {/* Instrument diagram: Guitar Fretboard or Piano Keyboard */}
              <div className="flex justify-center w-full md:w-auto">
                {instrumentType === 'guitar' ? (
                  <GuitarFretboard
                    chordName={displayChordName}
                    fingering={displayFingering}
                    capoFret={capoFret}
                    isArpeggioMode={playMode === 'arpeggio'}
                    activeStringIndex={
                      playMode === 'arpeggio' && currentArpeggioNote
                        ? currentArpeggioNote.stringIndex
                        : null
                    }
                    activeFret={
                      playMode === 'arpeggio' && currentArpeggioNote
                        ? currentArpeggioNote.fret
                        : null
                    }
                    activeNoteName={
                      playMode === 'arpeggio' && currentArpeggioNote
                        ? currentArpeggioNote.noteName
                        : null
                    }
                  />
                ) : (
                  <div className="w-full max-w-md">
                    <PianoKeyboard
                      chordName={displayChordName}
                      activeKeys={
                        playMode === 'arpeggio' && currentArpeggioNote?.pianoKey !== undefined
                          ? [currentArpeggioNote.pianoKey]
                          : displayFingering.pianoKeys || [0, 4, 7]
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Arpeggio Tablature View (Note-by-note staff) */}
            {playMode === 'arpeggio' && arpeggioPattern.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <ArpeggioTabViewer
                  chordName={displayChordName}
                  arpeggioPattern={arpeggioPattern}
                  currentStep={currentArpeggioStep}
                  bpm={song.bpm}
                />
              </div>
            )}

            {/* Upcoming Chords Queue */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Próximos Acordes de la Canción
                </span>
                <span className="text-[11px] text-slate-500">Sincronizado al segundo con el vídeo</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => nextEvent1 && handleSeek(nextEvent1.startTime)}
                  className="glass rounded-xl p-3.5 text-center border-cyan-500/30 border shadow-sm cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400 font-mono">
                    {nextEvent1 ? nextEvent1.chordName : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    {nextEvent1 ? `en ${calcSecondsUntil(nextEvent1)}` : 'Fin de tema'}
                  </div>
                </div>

                <div
                  onClick={() => nextEvent2 && handleSeek(nextEvent2.startTime)}
                  className="glass rounded-xl p-3.5 text-center opacity-70 border border-white/5 cursor-pointer hover:opacity-100 transition"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-slate-300 font-mono">
                    {nextEvent2 ? nextEvent2.chordName : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {nextEvent2 ? `en ${calcSecondsUntil(nextEvent2)}` : '—'}
                  </div>
                </div>

                <div
                  onClick={() => nextEvent3 && handleSeek(nextEvent3.startTime)}
                  className="glass rounded-xl p-3.5 text-center opacity-40 border border-white/5 cursor-pointer hover:opacity-100 transition"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono">
                    {nextEvent3 ? nextEvent3.chordName : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {nextEvent3 ? `en ${calcSecondsUntil(nextEvent3)}` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4.5. ARPEGGIO TABLATURE VIEWER (When in Arpeggio Mode) */}
          {playMode === 'arpeggio' && (
            <ArpeggioTabViewer
              chordName={displayChordName}
              arpeggioPattern={arpeggioPattern}
              currentStep={currentArpeggioStep}
              bpm={song.bpm}
            />
          )}

          {/* 5. TIMELINE SCRUBBER & TRANSPORT CONTROLS */}
          <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl">
            {/* Scrubber */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 w-12 text-left tabular-nums">
                {formatTime(currentTime)}
              </span>

              <div className="flex-1 relative py-2">
                <input
                  type="range"
                  min="0"
                  max={song.durationSeconds}
                  step="0.5"
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <span className="text-xs font-mono text-slate-400 w-12 text-right tabular-nums">
                {formatTime(song.durationSeconds)}
              </span>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between mt-4">
              {/* Speed Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 hidden sm:inline mr-1">Velocidad:</span>
                {[0.5, 0.75, 1.0, 1.25].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 text-xs rounded-lg font-mono transition ${
                      speed === s
                        ? 'gradient-bg text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Main Play/Pause / Step Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
                  title="Retroceder 10s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition shadow-lg shadow-purple-500/40"
                  title={isPlaying ? 'Pausar' : 'Reproducir con vídeo'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeek(Math.min(song.durationSeconds, currentTime + 10))}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
                  title="Adelantar 10s"
                >
                  <FastForward className="w-5 h-5" />
                </button>
              </div>

              {/* Loop toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition font-medium ${
                  isLooping
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Repetir progresión de acordes"
              >
                <Repeat className="w-4 h-4" />
                <span className="hidden sm:inline">Bucle</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Control Studio Sidebar */}
        {!isFocusMode && (
          <div className="space-y-6">
            {/* 1. Real-time Microphone Audio & Tuner Feedback */}
            <PitchFeedback
              targetChord={
                playMode === 'arpeggio' && currentArpeggioNote
                  ? currentArpeggioNote.noteName
                  : displayChordName
              }
            />

            {/* 2. Track Stem Mixer */}
            <StemMixer
              volumes={volumes}
              mutes={mutes}
              solos={solos}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              onToggleSolo={handleToggleSolo}
              onPreset={handlePreset}
            />

            {/* 3. Adaptive Difficulty Slider */}
            <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">Dificultad Adaptativa IA</h3>
                  <p className="text-[11px] text-slate-400">Simplifica o enriquece los acordes</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                <span className={difficulty === 'beginner' ? 'text-cyan-400 font-bold' : ''}>
                  Principiante
                </span>
                <span className={difficulty === 'original' ? 'text-white font-bold' : ''}>
                  Original
                </span>
                <span className={difficulty === 'advanced' ? 'text-purple-400 font-bold' : ''}>
                  Avanzado
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={difficulty === 'beginner' ? 0 : difficulty === 'original' ? 1 : 2}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 0) setDifficulty('beginner');
                  else if (val === 1) setDifficulty('original');
                  else setDifficulty('advanced');
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
                <span className="text-cyan-400 font-bold">Tip IA: </span>
                {difficulty === 'beginner'
                  ? 'Acordes abiertos sencillos con cejillas sustituidas para practicar sin fatiga en la mano.'
                  : difficulty === 'original'
                  ? 'Acordes exactos de la grabación original de estudio en álbum sincronizados con el vídeo.'
                  : 'Extensiones armónicas avanzadas (9nas, 7mas aumentadas) y variaciones melódicas.'}
              </div>
            </div>

            {/* 4. Virtual Capo Transposer */}
            <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Guitar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100">Capo Virtual</h3>
                    <p className="text-[11px] text-slate-400">Adapta los acordes al traste deseado</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Traste {capoFret}
                </span>
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((fret) => (
                  <button
                    key={fret}
                    onClick={() => setCapoFret(fret)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition ${
                      capoFret === fret
                        ? 'gradient-bg text-white shadow-md shadow-purple-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {fret === 0 ? 'Sin' : fret}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Community Tips with Timestamps */}
            <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100">Tips de la Comunidad</h3>
                    <p className="text-[11px] text-slate-400">Secretos de guitarristas y profesores</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddTip(!showAddTip)}
                  className="p-1 rounded-lg hover:bg-white/10 text-cyan-400 transition"
                  title="Añadir tip"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showAddTip && (
                <form onSubmit={handleAddTip} className="mb-3 space-y-2">
                  <textarea
                    placeholder="Escribe tu consejo sobre rasgueo, solos o digitación..."
                    value={newTipText}
                    onChange={(e) => setNewTipText(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTip(false)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs gradient-bg rounded-lg font-semibold text-white shadow"
                    >
                      Publicar tip
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {tips.map((tip) => (
                  <div
                    key={tip.id}
                    className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-[9px] font-bold text-white">
                          {tip.avatar}
                        </div>
                        <span className="font-semibold text-slate-300">{tip.author}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{tip.timeAgo}</span>
                    </div>

                    <p className="text-slate-400 leading-relaxed">{tip.content}</p>

                    {tip.timestampSeconds !== undefined && (
                      <button
                        onClick={() => handleSeek(tip.timestampSeconds!)}
                        className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" /> Ir al segundo {formatTime(tip.timestampSeconds)} en el vídeo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
