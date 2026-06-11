import { createContext, useContext, useEffect, useRef, useState } from 'react';

const DEFAULT_VOLUME = 0.25;

const GameAudioContext = createContext(null);

function useGameAudioEngine(phase) {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('game_music_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [volume, setVolume] = useState(() => {
    try {
      const savedVolume = localStorage.getItem('game_music_volume');
      return savedVolume !== null ? parseFloat(savedVolume) : DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  });

  const bgMusicRef = useRef(null);

  useEffect(() => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio('/audio.ogg');
      bgMusicRef.current.loop = true;
      bgMusicRef.current.preload = 'auto';
    }
  }, []);

  useEffect(() => {
    if (phase !== 'planning') {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
      return;
    }

    bgMusicRef.current.volume = volume;
    bgMusicRef.current.muted = isMuted;

    if (!isMuted) {
      bgMusicRef.current.play().catch(() => {});
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, [phase, isMuted, volume]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      try {
        localStorage.setItem('game_music_muted', String(nextMuted));
      } catch {
        /* ignore */
      }
      return nextMuted;
    });
  };

  const handleVolumeChange = (e) => {
    const nextVolume = parseFloat(e.target.value);
    setVolume(nextVolume);
    try {
      localStorage.setItem('game_music_volume', String(nextVolume));
    } catch {
      /* ignore */
    }
    if (nextVolume > 0 && isMuted) {
      setIsMuted(false);
      try {
        localStorage.setItem('game_music_muted', 'false');
      } catch {
        /* ignore */
      }
    }
  };

  return { isMuted, volume, toggleMute, handleVolumeChange };
}

export function GameAudioProvider({ phase, children }) {
  const audio = useGameAudioEngine(phase);
  return (
    <GameAudioContext.Provider value={audio}>
      {children}
    </GameAudioContext.Provider>
  );
}

export function GameAudioControls() {
  const audio = useContext(GameAudioContext);
  if (!audio) return null;

  const { isMuted, volume, toggleMute, handleVolumeChange } = audio;

  return (
    <div className="audio-controls d-flex align-items-center gap-2 bg-light border rounded-pill px-3">
      <button
        className="btn btn-link audio-toggle p-0 text-decoration-none"
        onClick={toggleMute}
        style={{ fontSize: '1.1rem', color: isMuted || volume === 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}
        title={isMuted ? 'Attiva audio' : 'Muta audio'}
        aria-label={isMuted ? 'Attiva audio' : 'Muta audio'}
        type="button"
      >
        <i
          className={`bi ${
            isMuted || volume === 0
              ? 'bi-volume-mute-fill'
              : volume < 0.5
                ? 'bi-volume-down-fill'
                : 'bi-volume-up-fill'
          }`}
          aria-hidden="true"
        />
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
        className="form-range"
        style={{ width: '80px', height: '4px', cursor: 'pointer' }}
        title={`Volume: ${Math.round(volume * 100)}%`}
        aria-label="Volume musica"
      />

      <span
        className="text-secondary fw-semibold"
        style={{ fontSize: '11px', width: '28px', textAlign: 'right', userSelect: 'none' }}
      >
        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
      </span>
    </div>
  );
}
