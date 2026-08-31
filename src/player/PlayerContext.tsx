import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Sermon } from '../lib/types';
import { incrementPlayCount } from '../lib/api';

// Persistent resume positions, keyed by sermon id.
const POSITIONS_KEY = 'gs_playback_positions';

function loadPositions(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePosition(sermonId: string, position: number) {
  const all = loadPositions();
  all[sermonId] = position;
  try {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(all));
  } catch {
    /* storage full/blocked — resume is best-effort */
  }
}

interface PlayerState {
  current: Sermon | null;
  queue: Sermon[];
  queueLabel: string;
  isPlaying: boolean;
  position: number;
  duration: number;
  rate: number;
}

interface PlayerContextValue extends PlayerState {
  /** Play a sermon, optionally with a queue it belongs to. */
  play: (sermon: Sermon, queue?: Sermon[], queueLabel?: string) => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (offset: number) => void;
  setRate: (rate: number) => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
  pastorName: (sermon: Sermon | null) => string;
  registerPastorNames: (names: Record<string, string>) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    current: null,
    queue: [],
    queueLabel: '',
    isPlaying: false,
    position: 0,
    duration: 0,
    rate: 1,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const pastorNamesRef = useRef<Record<string, string>>({});

  const audio = () => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = 'metadata';
      audioRef.current = el;
    }
    return audioRef.current;
  };

  // --- Media Session -------------------------------------------------------

  const updateMediaSession = useCallback((sermon: Sermon | null) => {
    if (!('mediaSession' in navigator)) return;
    if (!sermon) {
      navigator.mediaSession.metadata = null;
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: sermon.title,
        artist: pastorNamesRef.current[sermon.pastorId] || 'Grace Sermons',
        album: 'Grace Sermons',
        artwork: sermon.coverImage
          ? [{ src: sermon.coverImage, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    } catch {
      /* MediaMetadata unavailable */
    }
  }, []);

  // --- Core controls -------------------------------------------------------

  const playIndex = useCallback(
    (index: number, queue: Sermon[], queueLabel: string) => {
      const sermon = queue[index];
      if (!sermon?.audioUrl) return;
      const el = audio();
      el.src = sermon.audioUrl;
      el.playbackRate = stateRef.current.rate;
      const resume = loadPositions()[sermon.id] || 0;
      if (resume > 5) {
        el.currentTime = resume;
      }
      void el.play().catch(() => {});
      setState((prev) => ({
        ...prev,
        current: sermon,
        queue,
        queueLabel,
        position: resume,
        duration: sermon.duration || 0,
      }));
      updateMediaSession(sermon);
      void incrementPlayCount(sermon.id);
      // Let the catalog bump its in-memory count so rankings adjust live.
      window.dispatchEvent(new CustomEvent('gs:played', { detail: sermon.id }));
    },
    [updateMediaSession]
  );

  const play = useCallback(
    (sermon: Sermon, queue?: Sermon[], queueLabel = '') => {
      const q = queue?.length ? queue.filter((s) => s.audioUrl) : [sermon];
      const idx = Math.max(0, q.findIndex((s) => s.id === sermon.id));
      playIndex(idx, q, queueLabel);
    },
    [playIndex]
  );

  const toggle = useCallback(() => {
    const el = audio();
    if (el.paused) {
      void el.play().catch(() => {});
    } else {
      el.pause();
      const { current, position } = stateRef.current;
      if (current) savePosition(current.id, position);
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const el = audio();
    el.currentTime = Math.max(0, seconds);
  }, []);

  const seekBy = useCallback((offset: number) => {
    const el = audio();
    el.currentTime = Math.max(0, el.currentTime + offset);
  }, []);

  const setRate = useCallback((rate: number) => {
    audio().playbackRate = rate;
    setState((prev) => ({ ...prev, rate }));
  }, []);

  const currentIndex = useCallback(() => {
    const { current, queue } = stateRef.current;
    return current ? queue.findIndex((s) => s.id === current.id) : -1;
  }, []);

  const next = useCallback(() => {
    const { queue, queueLabel } = stateRef.current;
    const idx = currentIndex();
    if (idx >= 0 && idx < queue.length - 1) playIndex(idx + 1, queue, queueLabel);
  }, [currentIndex, playIndex]);

  const previous = useCallback(() => {
    const { queue, queueLabel } = stateRef.current;
    const idx = currentIndex();
    if (idx > 0) playIndex(idx - 1, queue, queueLabel);
  }, [currentIndex, playIndex]);

  const stop = useCallback(() => {
    const el = audio();
    const { current } = stateRef.current;
    if (current) savePosition(current.id, el.currentTime);
    el.pause();
    el.removeAttribute('src');
    el.load();
    setState((prev) => ({
      ...prev,
      current: null,
      queue: [],
      queueLabel: '',
      isPlaying: false,
      position: 0,
      duration: 0,
    }));
    updateMediaSession(null);
  }, [updateMediaSession]);

  // --- Audio element events -------------------------------------------------

  useEffect(() => {
    const el = audio();
    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onTime = () =>
      setState((prev) => ({
        ...prev,
        position: el.currentTime,
        duration: Number.isFinite(el.duration) && el.duration > 0 ? el.duration : prev.duration,
      }));
    const onEnded = () => {
      const { current, queue, queueLabel } = stateRef.current;
      if (current) savePosition(current.id, 0);
      const idx = queue.findIndex((s) => s.id === current?.id);
      if (idx >= 0 && idx < queue.length - 1) {
        playIndex(idx + 1, queue, queueLabel);
      } else {
        setState((prev) => ({ ...prev, isPlaying: false, position: 0 }));
      }
    };
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
  }, [playIndex]);

  // Persist the position every few seconds while playing.
  useEffect(() => {
    const id = setInterval(() => {
      const { current, isPlaying, position } = stateRef.current;
      if (current && isPlaying && position > 0) savePosition(current.id, position);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Media Session transport handlers.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* unsupported action */
      }
    };
    set('play', () => toggle());
    set('pause', () => toggle());
    set('previoustrack', () => previous());
    set('nexttrack', () => next());
    set('seekbackward', (d) => seekBy(-(d.seekOffset ?? 15)));
    set('seekforward', (d) => seekBy(d.seekOffset ?? 15));
    set('seekto', (d) => {
      if (typeof d.seekTime === 'number') seekTo(d.seekTime);
    });
    return () => {
      (
        ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'] as
          MediaSessionAction[]
      ).forEach((a) => set(a, null));
    };
  }, [toggle, previous, next, seekBy, seekTo]);

  const pastorName = useCallback(
    (sermon: Sermon | null) =>
      (sermon && pastorNamesRef.current[sermon.pastorId]) || 'Grace Sermons',
    []
  );

  const registerPastorNames = useCallback((names: Record<string, string>) => {
    pastorNamesRef.current = { ...pastorNamesRef.current, ...names };
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      play,
      toggle,
      seekTo,
      seekBy,
      setRate,
      next,
      previous,
      stop,
      pastorName,
      registerPastorNames,
    }),
    [state, play, toggle, seekTo, seekBy, setRate, next, previous, stop, pastorName, registerPastorNames]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
