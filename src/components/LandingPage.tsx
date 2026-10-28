import React, { useState } from 'react';
import { SongTrack } from '../types/music';
import { SONGS_CATALOG } from '../data/songs';
import { Play, Search, Sliders, Mic, Sparkles, Layers, ArrowRight, ShieldCheck, Star } from 'lucide-react';

interface LandingPageProps {
  onSelectSong: (song: SongTrack) => void;
  onOpenPlayer: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectSong, onOpenPlayer }) => {
  const [searchInput, setSearchInput] = useState('');
  const [previewChord, setPreviewChord] = useState('Bm');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      onOpenPlayer();
      return;
    }
    const found = SONGS_CATALOG.find(
      (s) =>
        s.title.toLowerCase().includes(searchInput.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchInput.toLowerCase())
    );
    if (found) {
      onSelectSong(found);
      onOpenPlayer();
    } else {
      // Default to Hotel California
      onOpenPlayer();
    }
  };

  const handleQuickSong = (title: string) => {
    const song = SONGS_CATALOG.find((s) => s.title.toLowerCase().includes(title.toLowerCase()));
    if (song) {
      onSelectSong(song);
      onOpenPlayer();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/20 to-pink-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-8 border border-white/10 shadow-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Potenciado por IA · 4.8★ de 75K+ músicos</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6">
            No solo toques la canción.
            <br />
            <span className="gradient-text">Sé la banda.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            La primera plataforma que aísla los instrumentos, adapta los acordes a tu nivel y te
            escucha tocar en tiempo real con IA.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-6">
            <div className="glass rounded-2xl p-2 flex items-center gap-2 border border-white/15 shadow-2xl">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Pega un link de YouTube o busca una canción..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 py-3 px-2 text-sm md:text-base font-normal"
              />
              <button
                type="submit"
                className="gradient-bg text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/25 shrink-0 text-sm"
              >
                Buscar y Tocar
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mb-14">
            <span className="text-slate-500">Prueba con:</span>
            <button
              onClick={() => handleQuickSong('Hotel California')}
              className="hover:text-cyan-400 transition underline underline-offset-4 decoration-cyan-400/40"
            >
              Hotel California
            </button>
            <span>·</span>
            <button
              onClick={() => handleQuickSong('Zombie')}
              className="hover:text-cyan-400 transition underline underline-offset-4 decoration-cyan-400/40"
            >
              Zombie
            </button>
            <span>·</span>
            <button
              onClick={() => handleQuickSong('Wonderwall')}
              className="hover:text-cyan-400 transition underline underline-offset-4 decoration-cyan-400/40"
            >
              Wonderwall
            </button>
            <span>·</span>
            <button
              onClick={() => handleQuickSong('Creep')}
              className="hover:text-cyan-400 transition underline underline-offset-4 decoration-cyan-400/40"
            >
              Creep
            </button>
          </div>

          {/* Floating Interactive Mockup */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 gradient-bg opacity-20 blur-3xl rounded-full" />
            <div className="relative glass rounded-3xl p-5 md:p-6 border border-white/10 shadow-2xl text-left">
              {/* Window header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs text-slate-500 font-mono">
                    harmoniq.app/player · Hotel California (Eagles)
                  </span>
                </div>
                <button
                  onClick={onOpenPlayer}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  Abrir Estudio Completo <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Mockup Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={onOpenPlayer}
                  className="md:col-span-2 bg-black/60 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden border border-white/5"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition z-20">
                    <Play className="w-7 h-7 text-white fill-current ml-1" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-slate-300 z-20">
                    Clic para iniciar práctica interactiva
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div
                    onClick={() => setPreviewChord('Bm')}
                    className="p-3.5 rounded-2xl glass-card border border-cyan-500/40 cursor-pointer shadow-md"
                  >
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
                      Ahora
                    </div>
                    <div className="text-3xl font-black gradient-text font-mono">Bm</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tónica en cuerda 5 · Traste 2</div>
                  </div>

                  <div
                    onClick={() => setPreviewChord('F#7')}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 opacity-70 hover:opacity-100 transition cursor-pointer"
                  >
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Siguiente (en 4s)</div>
                    <div className="text-xl font-bold text-slate-300 font-mono">F#7</div>
                  </div>

                  <div
                    onClick={() => setPreviewChord('A')}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 opacity-40 hover:opacity-100 transition cursor-pointer"
                  >
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Luego (en 8s)</div>
                    <div className="text-xl font-bold text-slate-400 font-mono">A</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6 border-t border-white/5 bg-[#0d0d12]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Superpoderes para músicos</h2>
            <p className="text-slate-400 text-sm md:text-base">
              Todo lo que necesitas para aprender, practicar y dominar tus canciones favoritas como un
              profesional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass rounded-3xl p-8 hover:bg-white/5 transition group border border-white/5">
              <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg shadow-cyan-500/20">
                <Sliders className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Dificultad Adaptativa</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                ¿Acordes con cejilla difíciles? Desliza a Principiante y nuestra IA los simplifica al
                instante (ej. Am con Capo 2 en lugar de Bm) sin cambiar el tono original de la canción.
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-cyan-300 font-mono">
                Am (Capo 2) = Sonido original de Bm
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-3xl p-8 hover:bg-white/5 transition group border border-white/5">
              <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg shadow-purple-500/20">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Aislamiento de Pistas con IA</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Silencia la guitarra original y sé tú quien toca esa parte sobre el bajo, la batería y la voz real. Aísla pistas para escuchar cada detalle con precisión de cirujano.
              </p>
              <div className="flex gap-1.5 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Voz</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Batería</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Bajo</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Teclado</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-3xl p-8 hover:bg-white/5 transition group border border-white/5">
              <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg shadow-pink-500/20">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Feedback de Audio en Tiempo Real</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Activa tu micrófono sin cables ni accesorios. El algoritmo de autocorrelación detecta tus notas y te dice si estás a tiempo y en el acorde correcto al instante.
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Afinación exacta</span>
                <span className="text-emerald-400 font-bold">±2 Cents · En Tono</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SONG CATALOG SECTION */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Canciones Disponibles</h2>
              <p className="text-slate-400 text-sm">
                Completamente desglosadas con acordes, pistas aisladas y tips de músicos.
              </p>
            </div>
            <button
              onClick={onOpenPlayer}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-1.5 self-start md:self-auto"
            >
              Abrir reproductor <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SONGS_CATALOG.map((song) => (
              <div
                key={song.id}
                onClick={() => {
                  onSelectSong(song);
                  onOpenPlayer();
                }}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/40 font-semibold">
                      Tono: {song.key}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{song.bpm} BPM</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition mb-1">
                    {song.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {song.artist} · {song.album} ({song.year})
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex gap-1">
                    {song.chords.slice(0, 4).map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded font-mono text-slate-300">
                        {c.name}
                      </span>
                    ))}
                    {song.chords.length > 4 && (
                      <span className="px-1 py-0.5 text-slate-500 font-mono">+{song.chords.length - 4}</span>
                    )}
                  </div>
                  <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Tocar <Play className="w-3 h-3 fill-current" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY TESTIMONIALS */}
      <section className="py-20 px-6 bg-[#0c0c11] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-bold mb-3">Creado por y para músicos</h2>
            <p className="text-slate-400 text-sm">
              Descubre cómo guitarristas y pianistas aceleran su aprendizaje musical.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-xs text-white">
                  MR
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Marco Rodríguez</h4>
                  <p className="text-xs text-slate-400">Guitarrista acústico · 3 años tocando</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "Poder apagar la guitarra del tema y dejar solo la voz de Don Henley y la batería me
                ha permitido practicar el solo de Hotel California a mi propio ritmo. Brutal."
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-xs text-white">
                  LS
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Laura Santillán</h4>
                  <p className="text-xs text-slate-400">Estudiante de guitarra y canto</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "La dificultad adaptativa es mágica. Cuando un acorde con cejilla me cansa la mano,
                lo simplifico y sigo practicando la canción completa sin frustrarme."
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-xs text-white">
                  DG
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">David Gálvez</h4>
                  <p className="text-xs text-slate-400">Profesor de música</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "Uso Harmoniq con todos mis alumnos. El feedback con micrófono les ayuda a saber de
                inmediato si el acorde está bien afinado y en tiempo."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center glass rounded-3xl p-12 relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-4">¿Listo para tocar?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm md:text-base">
              Únete a más de 75,000 músicos que ya están mejorando su técnica con Harmoniq.
            </p>
            <button
              onClick={onOpenPlayer}
              className="gradient-bg text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-xl shadow-purple-500/40 text-base inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Empezar ahora — Es gratis
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        Harmoniq — Sé la banda · Hecho con ❤️ para músicos · © 2026
      </footer>
    </div>
  );
};
