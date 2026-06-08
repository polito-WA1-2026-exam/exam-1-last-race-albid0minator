import { useEffect, useRef, useState } from 'react';

export default function GameAudio({ phase }) {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('game_music_muted') === 'true';
    } catch (error) {
      void error;
      return false;
    }
  });

  const [volume, setVolume] = useState(() => {
    try {
      const savedVolume = localStorage.getItem('game_music_volume');
      return savedVolume !== null ? parseFloat(savedVolume) : 0.4;
    } catch (error) {
      void error;
      return 0.4;
    }
  });

  const audioRef = useRef(null);

  useEffect(() => {
    if (phase !== 'planning') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio('/audio.ogg');
      audioRef.current.loop = true;
    }

    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;

    if (!isMuted) {
      audioRef.current.play().catch(() => {});
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [phase, isMuted, volume]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      try {
        localStorage.setItem('game_music_muted', String(nextMuted));
      } catch (error) {
        void error;
      }
      return nextMuted;
    });
  };

  const handleVolumeChange = (e) => {
    const nextVolume = parseFloat(e.target.value);
    setVolume(nextVolume);
    try {
      localStorage.setItem('game_music_volume', String(nextVolume));
    } catch (error) {
      void error;
    }
    if (nextVolume > 0 && isMuted) {
      setIsMuted(false);
      try {
        localStorage.setItem('game_music_muted', 'false');
      } catch (error) {
        void error;
      }
    }
  };

  if (phase !== 'planning') return null;

  return (
    <div className="d-flex align-items-center gap-2 bg-light border rounded-pill px-3 py-1 shadow-sm">
      {/* Mute/Speaker Button */}
      <button
        className="btn btn-link p-0 text-decoration-none"
        onClick={toggleMute}
        style={{ fontSize: '1.1rem', color: isMuted || volume === 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}
        title={isMuted ? "Attiva audio" : "Muta audio"}
      >
        {isMuted || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
      </button>

      {/* Volume Slider */}
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
      />
      
      {/* Percentage Indicator */}
      <span className="text-secondary fw-semibold" style={{ fontSize: '11px', width: '28px', textAlign: 'right', userSelect: 'none' }}>
        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
      </span>
    </div>
  );
}
