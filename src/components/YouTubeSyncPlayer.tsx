import React, { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (suggestedRate: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

interface YouTubeSyncPlayerProps {
  youtubeId: string;
  isPlaying: boolean;
  onPlayerTimeUpdate: (currentTime: number) => void;
  onPlayerStateChange: (isPlaying: boolean) => void;
  seekTime: number | null;
  onSeekHandled: () => void;
  playbackSpeed: number;
  audioSource: 'youtube' | 'stems' | 'both';
  onToggleAudioSource: (source: 'youtube' | 'stems' | 'both') => void;
  syncOffset: number; // in seconds (+/-)
}

export const YouTubeSyncPlayer: React.FC<YouTubeSyncPlayerProps> = ({
  youtubeId,
  isPlaying,
  onPlayerTimeUpdate,
  onPlayerStateChange,
  seekTime,
  onSeekHandled,
  playbackSpeed,
  audioSource,
  onToggleAudioSource,
  syncOffset,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const pollingTimerRef = useRef<number | null>(null);

  // Send command to iframe via postMessage as a rock-solid backup
  const sendPostMessage = useCallback((func: string, args: unknown[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (e) {
        // ignore cross-origin error
      }
    }
  }, []);

  // 1. Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      initPlayer();
    };
  }, [youtubeId]);

  const initPlayer = useCallback(() => {
    if (!window.YT || !iframeRef.current) return;

    try {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn(e);
        }
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            try {
              event.target.setPlaybackRate(playbackSpeed);
              if (audioSource === 'stems') {
                event.target.mute();
              } else {
                event.target.unMute();
              }
            } catch (e) {
              console.warn(e);
            }
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlayerStateChange(true);
              startPolling();
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              onPlayerStateChange(false);
              stopPolling();
            }
          },
        },
      });
    } catch (e) {
      console.warn('YouTube Player initialization fallback:', e);
    }
  }, [youtubeId, playbackSpeed, audioSource, onPlayerStateChange]);

  // 2. High-frequency polling of currentTime
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = window.setInterval(() => {
      if (playerRef.current) {
        try {
          const raw = playerRef.current.getCurrentTime();
          if (typeof raw === 'number' && !isNaN(raw)) {
            const calibrated = Math.max(0, raw + syncOffset);
            onPlayerTimeUpdate(calibrated);
          }
        } catch (e) {
          // fallback to postMessage ping
          sendPostMessage('getCurrentTime');
        }
      }
    }, 75); // ~13 FPS
  }, [syncOffset, onPlayerTimeUpdate, sendPostMessage]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // 3. Fallback: Listen to postMessage from YouTube iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data !== 'string') return;
        const data = JSON.parse(e.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            onPlayerTimeUpdate(Math.max(0, data.info.currentTime + syncOffset));
          }
          if (data.info.playerState === 1) {
            onPlayerStateChange(true);
          } else if (data.info.playerState === 2 || data.info.playerState === 0) {
            onPlayerStateChange(false);
          }
        }
      } catch (err) {
        // ignore non-json messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopPolling();
    };
  }, [syncOffset, onPlayerTimeUpdate, onPlayerStateChange, stopPolling]);

  // 4. Play/Pause reaction
  useEffect(() => {
    if (isPlaying) {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.playVideo();
        } catch (e) {
          sendPostMessage('playVideo');
        }
      } else {
        sendPostMessage('playVideo');
      }
      startPolling();
    } else {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          sendPostMessage('pauseVideo');
        }
      } else {
        sendPostMessage('pauseVideo');
      }
      stopPolling();
    }
  }, [isPlaying, isPlayerReady, startPolling, stopPolling, sendPostMessage]);

  // 5. Seek reaction
  useEffect(() => {
    if (seekTime !== null) {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.seekTo(seekTime, true);
        } catch (e) {
          sendPostMessage('seekTo', [seekTime, true]);
        }
      } else {
        sendPostMessage('seekTo', [seekTime, true]);
      }
      onSeekHandled();
    }
  }, [seekTime, isPlayerReady, onSeekHandled, sendPostMessage]);

  // 6. Speed reaction
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        playerRef.current.setPlaybackRate(playbackSpeed);
      } catch (e) {
        sendPostMessage('setPlaybackRate', [playbackSpeed]);
      }
    } else {
      sendPostMessage('setPlaybackRate', [playbackSpeed]);
    }
  }, [playbackSpeed, isPlayerReady, sendPostMessage]);

  // 7. Audio Source / Mute reaction
  useEffect(() => {
    if (audioSource === 'stems') {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.mute();
        } catch (e) {
          sendPostMessage('mute');
        }
      } else {
        sendPostMessage('mute');
      }
    } else {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.unMute();
        } catch (e) {
          sendPostMessage('unMute');
        }
      } else {
        sendPostMessage('unMute');
      }
    }
  }, [audioSource, isPlayerReady, sendPostMessage]);

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black flex flex-col">
      {/* Video Container with direct iframe to guarantee instantaneous display */}
      <div className="aspect-video w-full relative bg-black">
        <iframe
          ref={iframeRef}
          id="harmoniq-yt-player"
          className="w-full h-full block"
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1`}
          title="Harmoniq Video Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Sync Status & Audio Source Bar */}
      <div className="px-4 py-2.5 bg-black/60 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="font-mono text-slate-300">
            {isPlaying ? 'Sincronización activa con arpegio' : 'En pausa · Listo para sincronizar'}
          </span>
        </div>

        {/* Audio Source Selector */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          <span className="text-[11px] text-slate-400 px-1 hidden sm:inline">Audio:</span>
          <button
            onClick={() => onToggleAudioSource('youtube')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              audioSource === 'youtube'
                ? 'gradient-bg text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Escucha el audio oficial del vídeo de YouTube"
          >
            Vídeo Original
          </button>
          <button
            onClick={() => onToggleAudioSource('stems')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              audioSource === 'stems'
                ? 'gradient-bg text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Silencia el vídeo y reproduce el arpegio con el sintetizador"
          >
            Pistas Aisladas
          </button>
          <button
            onClick={() => onToggleAudioSource('both')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              audioSource === 'both'
                ? 'gradient-bg text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Combina el vídeo y el sintetizador"
          >
            Ambos
          </button>
        </div>
      </div>
    </div>
  );
};
