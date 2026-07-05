import { useCallback, useEffect, useRef } from "react";

export const AUDIO_KEYS = [
  "birthday-soundtrack",
  "fireworks",
  "confetti-pop",
  "win-fanfare",
  "cash-register",
  "magic-sparkle",
  "party-whoosh",
] as const;

export type AudioKey = (typeof AUDIO_KEYS)[number];

const DEFAULT_AUDIO: Record<AudioKey, string> = {
  "birthday-soundtrack": "/assets/audio/birthday-soundtrack.mp3",
  fireworks: "/assets/audio/fireworks.mp3",
  "confetti-pop": "/assets/audio/confetti-pop.mp3",
  "win-fanfare": "/assets/audio/win-fanfare.mp3",
  "cash-register": "/assets/audio/cash-register.mp3",
  "magic-sparkle": "/assets/audio/magic-sparkle.mp3",
  "party-whoosh": "/assets/audio/party-whoosh.mp3",
};

export function useAudio(manifestAudio?: Record<string, string>) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const sfxTemplates = useRef<Partial<Record<AudioKey, HTMLAudioElement>>>({});
  const musicStarted = useRef(false);

  useEffect(() => {
    if (musicRef.current) return;

    const map = { ...DEFAULT_AUDIO, ...manifestAudio } as Record<AudioKey, string>;
    const music = new Audio(map["birthday-soundtrack"]);
    music.preload = "auto";
    music.loop = true;
    music.volume = 0.34;
    musicRef.current = music;

    AUDIO_KEYS.filter((k) => k !== "birthday-soundtrack").forEach((key) => {
      const audio = new Audio(map[key] ?? DEFAULT_AUDIO[key]);
      audio.preload = "auto";
      sfxTemplates.current[key] = audio;
    });

    return () => {
      music.pause();
      music.src = "";
      musicRef.current = null;
      Object.values(sfxTemplates.current).forEach((audio) => {
        audio?.pause();
        if (audio) audio.src = "";
      });
      sfxTemplates.current = {};
      musicStarted.current = false;
    };
  }, [manifestAudio]);

  const unlockAudio = useCallback(() => {
    const music = musicRef.current;
    if (!music) return;
    void music
      .play()
      .then(() => {
        music.pause();
        music.currentTime = 0;
      })
      .catch(() => undefined);
  }, []);

  const startMusic = useCallback(() => {
    const music = musicRef.current;
    if (!music || musicStarted.current) return;
    musicStarted.current = true;
    music.volume = 0.34;
    music.loop = true;
    void music.play().catch(() => {
      musicStarted.current = false;
    });
  }, []);

  const playSfx = useCallback((key: Exclude<AudioKey, "birthday-soundtrack">, volume = 0.55) => {
    const template = sfxTemplates.current[key];
    if (!template) return;
    const sfx = template.cloneNode(true) as HTMLAudioElement;
    sfx.volume = volume;
    void sfx.play().catch(() => undefined);
  }, []);

  return { unlockAudio, startMusic, playSfx };
}
