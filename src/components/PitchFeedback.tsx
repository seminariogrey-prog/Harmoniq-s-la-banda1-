import React, { useEffect, useRef, useState } from 'react';
import { pitchDetector, PitchDetectionResult } from '../utils/pitchDetector';
import { Mic, MicOff, CheckCircle2, AlertCircle, Radio, Music2 } from 'lucide-react';

interface PitchFeedbackProps {
  targetChord: string;
}

const GUITAR_STRINGS = [
  { name: '6ª E', note: 'E', freq: 82.4 },
  { name: '5ª A', note: 'A', freq: 110.0 },
  { name: '4ª D', note: 'D', freq: 146.8 },
  { name: '3ª G', note: 'G', freq: 196.0 },
  { name: '2ª B', note: 'B', freq: 246.9 },
  { name: '1ª e', note: 'E', freq: 329.6 },
];

export const PitchFeedback: React.FC<PitchFeedbackProps> = ({ targetChord }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'feedback' | 'tuner'>('feedback');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const toggleMic = async () => {
    if (isActive) {
      pitchDetector.stop();
      setIsActive(false);
      setPitchData(null);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    } else {
      setIsRequesting(true);
      setErrorMessage(null);
      const ok = await pitchDetector.start();
      setIsRequesting(false);
      if (ok) {
        setIsActive(true);
        dataArrayRef.current = new Uint8Array(128);
        startVisualizerLoop();
      } else {
        setErrorMessage('Por favor, permite acceso al micrófono en el navegador para activar el detector.');
      }
    }
  };

  const startVisualizerLoop = () => {
    const loop = () => {
      // 1. Check pitch
      const result = pitchDetector.getPitch();
      if (result && result.frequency > 0) {
        setPitchData(result);
      }

      // 2. Render waveform to canvas
      const canvas = canvasRef.current;
      if (canvas && dataArrayRef.current) {
        pitchDetector.getWaveformData(dataArrayRef.current);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#22d3ee');
          gradient.addColorStop(1, '#a855f7');
          ctx.strokeStyle = gradient;

          ctx.beginPath();
          const sliceWidth = canvas.width / dataArrayRef.current.length;
          let x = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const v = dataArrayRef.current[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      pitchDetector.stop();
    };
  }, []);

  // Determine if the detected note matches target chord
  const targetClean = targetChord.split('/')[0].replace('m', '').replace('7', '').replace('maj', '');
  const isMatch = pitchData && pitchData.note && (
    targetChord.includes(pitchData.note) || pitchData.note === targetClean
  );

  return (
    <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              Feedback IA con Micrófono
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EN VIVO
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">Escucha tu guitarra o voz en tiempo real</p>
          </div>
        </div>

        <button
          onClick={toggleMic}
          disabled={isRequesting}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
            isActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'gradient-bg text-white hover:opacity-90 shadow-md shadow-purple-500/30'
          }`}
        >
          {isActive ? (
            <>
              <MicOff className="w-3.5 h-3.5" /> Desactivar
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" /> {isRequesting ? 'Conectando...' : 'Activar'}
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs: Feedback vs Afinador */}
      <div className="flex items-center gap-2 mb-3 bg-black/30 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
            activeTab === 'feedback'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Detección de Acordes
        </button>
        <button
          onClick={() => setActiveTab('tuner')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
            activeTab === 'tuner'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Afinador de Guitarra
        </button>
      </div>

      {activeTab === 'feedback' ? (
        <div className="space-y-3">
          {/* Waveform visualizer */}
          <div className="relative h-14 bg-black/40 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
            {isActive ? (
              <canvas
                ref={canvasRef}
                width={300}
                height={56}
                className="w-full h-full block"
              />
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Radio className="w-4 h-4 text-slate-600" />
                <span>Haz clic en "Activar" para iniciar la escucha de IA</span>
              </div>
            )}
          </div>

          {/* Real-time pitch readout */}
          {isActive ? (
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              {pitchData && pitchData.frequency > 0 ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Nota Detectada</div>
                    <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                      <span className="text-cyan-400">{pitchData.note}</span>
                      <span className="text-xs text-slate-400 font-normal">{pitchData.octave}</span>
                      <span className="text-xs text-slate-500 ml-2">({pitchData.frequency} Hz)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Evaluación</div>
                    <div
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isMatch
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ¡En el acorde!
                        </>
                      ) : (
                        <>
                          <Music2 className="w-3 h-3 text-amber-400" /> Ajustando acorde...
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-1 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Toca tu guitarra o canta una nota hacia el micrófono...</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              La IA analiza el tono y los armónicos de tu instrumento para decirte si estás tocando el acorde correcto y a tiempo con la canción.
            </p>
          )}
        </div>
      ) : (
        /* Tuner tab */
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-1 text-center">
            {GUITAR_STRINGS.map((str, idx) => {
              const isClose = pitchData && pitchData.note === str.note;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-xs transition ${
                    isClose
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-md shadow-cyan-500/30'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  <div className="font-bold">{str.name}</div>
                  <div className="text-[9px] font-mono text-slate-500">{str.freq}Hz</div>
                </div>
              );
            })}
          </div>

          {/* Needle meter */}
          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>-50¢ (Grave)</span>
              <span className="text-emerald-400 font-bold">AFINADO</span>
              <span>+50¢ (Agudo)</span>
            </div>
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-emerald-400 -ml-0.5 z-10" />
              {pitchData && pitchData.frequency > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-2.5 rounded-full bg-cyan-400 transition-all duration-100 shadow-md shadow-cyan-400"
                  style={{
                    left: `${Math.max(5, Math.min(95, 50 + pitchData.centsOff))}%`,
                  }}
                />
              )}
            </div>
            <div className="text-center mt-2 text-xs font-mono text-slate-300">
              {pitchData && pitchData.frequency > 0
                ? `${pitchData.note}${pitchData.octave}: ${pitchData.centsOff > 0 ? `+${pitchData.centsOff}` : pitchData.centsOff} cents`
                : 'Toca una cuerda al aire para calibrar'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
