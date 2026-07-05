import { useCallback, useEffect, useRef, useState } from "react";

export const AUDIO_KEYS = [
  "birthday-intro-jingle",
  "birthday-finale-jingle",
  "fireworks",
  "firework-whistle",
  "firework-crackle",
  "firework-glitter",
  "firework-heart",
  "confetti-pop",
  "party-horn-2",
  "party-horn-3",
  "win-fanfare",
  "cash-register",
  "magic-sparkle",
  "party-whoosh",
  "warning-alert",
  "decline-whaaat",
  "decline-zonk",
  "ui-click",
  "montage-countdown-tick",
] as const;

export type AudioKey = (typeof AUDIO_KEYS)[number];
export type CelebrationPhase = "idle" | "music" | "afterMusic";
type SfxKey = Exclude<AudioKey, "birthday-intro-jingle" | "birthday-finale-jingle">;

const INTRO_DURATION_MS = 30_000;
const MUSIC_VOLUME = 0.74;
const MUSIC_FADE_IN_MS = 1_100;
const FINALE_VOLUME = 0.68;
const PARTY_HORN_VOLUME = 0.78;
const BUTTON_CLICK_VOLUME = 0.36;
const SFX_FADE_IN_MS = 120;

const PARTY_HORN_SFX = [
  "confetti-pop",
  "party-horn-2",
  "party-horn-3",
] as const satisfies readonly SfxKey[];

const FIREWORK_SFX = [
  "firework-whistle",
  "firework-crackle",
  "firework-glitter",
  "firework-heart",
  "fireworks",
] as const satisfies readonly SfxKey[];

const DEFAULT_AUDIO: Record<AudioKey, string> = {
  "birthday-intro-jingle": "/assets/audio/birthday-intro-jingle.mp3",
  "birthday-finale-jingle": "/assets/audio/birthday-finale-jingle.mp3",
  fireworks: "/assets/audio/fireworks.mp3",
  "firework-whistle": "/assets/audio/firework-whistle.mp3",
  "firework-crackle": "/assets/audio/firework-crackle.mp3",
  "firework-glitter": "/assets/audio/firework-glitter.mp3",
  "firework-heart": "/assets/audio/firework-heart.mp3",
  "confetti-pop": "/assets/audio/confetti-pop.mp3",
  "party-horn-2": "/assets/audio/party-horn-2.mp3",
  "party-horn-3": "/assets/audio/party-horn-3.mp3",
  "win-fanfare": "/assets/audio/win-fanfare.mp3",
  "cash-register": "/assets/audio/cash-register.mp3",
  "magic-sparkle": "/assets/audio/magic-sparkle.mp3",
  "party-whoosh": "/assets/audio/party-whoosh.mp3",
  "warning-alert": "/assets/audio/warning-alert.mp3",
  "decline-whaaat": "/assets/audio/decline-whaaat.mp3",
  "decline-zonk": "/assets/audio/decline-zonk.mp3",
  "ui-click": "/assets/audio/ui-click.mp3",
  "montage-countdown-tick": "/assets/audio/montage-countdown-tick.mp3",
};

function waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const done = () => {
      audio.removeEventListener("canplaythrough", done);
      audio.removeEventListener("loadeddata", done);
      resolve();
    };
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("loadeddata", done, { once: true });
    audio.load();
  });
}

function fadeAudioVolume(
  audio: HTMLAudioElement,
  toVolume: number,
  durationMs: number,
): Promise<void> {
  const fromVolume = audio.volume;
  if (durationMs <= 0 || Math.abs(toVolume - fromVolume) < 0.01) {
    audio.volume = toVolume;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = progress * progress * (3 - 2 * progress);
      audio.volume = fromVolume + (toVolume - fromVolume) * eased;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        audio.volume = toVolume;
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

async function silentUnlock(audio: HTMLAudioElement): Promise<void> {
  const savedVolume = audio.volume;
  audio.muted = true;
  audio.currentTime = 0;

  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } catch {
    await waitForAudioReady(audio);
    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Browser blockiert — wird beim echten Start erneut versucht.
    }
  } finally {
    audio.muted = false;
    audio.volume = savedVolume;
  }
}

async function playAudioElement(audio: HTMLAudioElement): Promise<boolean> {
  try {
    await audio.play();
    return true;
  } catch {
    await waitForAudioReady(audio);
    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }
}

export function useAudio(manifestAudio?: Record<string, string>) {
  const introRef = useRef<HTMLAudioElement | null>(null);
  const finaleRef = useRef<HTMLAudioElement | null>(null);
  const sfxTemplates = useRef<Partial<Record<AudioKey, HTMLAudioElement>>>({});
  const introEnded = useRef(false);
  const introEndTimer = useRef<number | null>(null);
  const introFadeFrame = useRef(0);
  const fireworkPick = useRef(0);
  const partyHornPick = useRef(0);
  const finalePlayedRef = useRef(false);
  const unlockedRef = useRef(false);
  const sfxUnlockedRef = useRef<Set<SfxKey>>(new Set());
  const musicPlayingRef = useRef(false);
  const [celebrationPhase, setCelebrationPhase] = useState<CelebrationPhase>("idle");

  const endIntro = useCallback(() => {
    if (introEnded.current) return;
    introEnded.current = true;
    musicPlayingRef.current = false;

    const intro = introRef.current;
    if (intro) {
      intro.pause();
      intro.onended = null;
    }
    if (introEndTimer.current) {
      window.clearTimeout(introEndTimer.current);
      introEndTimer.current = null;
    }
    if (introFadeFrame.current) {
      cancelAnimationFrame(introFadeFrame.current);
      introFadeFrame.current = 0;
    }

    setCelebrationPhase("afterMusic");
  }, []);

  useEffect(() => {
    if (introRef.current) return;

    const map = { ...DEFAULT_AUDIO, ...manifestAudio } as Record<AudioKey, string>;

    const intro = new Audio(map["birthday-intro-jingle"]);
    intro.preload = "auto";
    intro.loop = false;
    intro.volume = 0;
    introRef.current = intro;
    void intro.load();

    const finale = new Audio(map["birthday-finale-jingle"]);
    finale.preload = "auto";
    finale.loop = false;
    finale.volume = FINALE_VOLUME;
    finaleRef.current = finale;

    AUDIO_KEYS.filter(
      (k) => k !== "birthday-intro-jingle" && k !== "birthday-finale-jingle",
    ).forEach((key) => {
      const src = map[key] ?? DEFAULT_AUDIO[key];
      const audio = new Audio(src);
      audio.preload = "auto";
      sfxTemplates.current[key] = audio;
    });

    return () => {
      intro.pause();
      intro.src = "";
      introRef.current = null;
      finale.pause();
      finale.src = "";
      finaleRef.current = null;
      if (introEndTimer.current) {
        window.clearTimeout(introEndTimer.current);
        introEndTimer.current = null;
      }
      if (introFadeFrame.current) {
        cancelAnimationFrame(introFadeFrame.current);
        introFadeFrame.current = 0;
      }
      Object.values(sfxTemplates.current).forEach((audio) => {
        audio?.pause();
        if (audio) audio.src = "";
      });
      sfxTemplates.current = {};
      introEnded.current = false;
      unlockedRef.current = false;
      sfxUnlockedRef.current.clear();
      musicPlayingRef.current = false;
      setCelebrationPhase("idle");
    };
    // Einmalig initialisieren — manifest.json lädt später mit denselben Pfaden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockAudio = useCallback(async (): Promise<void> => {
    if (unlockedRef.current) return;

    const primary = [introRef.current, finaleRef.current].filter(
      (audio): audio is HTMLAudioElement => audio !== null,
    );

    await Promise.all(primary.map(silentUnlock));
    unlockedRef.current = true;
  }, []);

  const ensureSfxReady = useCallback(async (key: SfxKey): Promise<void> => {
    const template = sfxTemplates.current[key];
    if (!template || sfxUnlockedRef.current.has(key)) return;

    await silentUnlock(template);
    sfxUnlockedRef.current.add(key);
  }, []);

  const startMusic = useCallback(async (): Promise<boolean> => {
    const intro = introRef.current;
    if (!intro || introEnded.current) return false;

    await waitForAudioReady(intro);

    setCelebrationPhase("music");
    intro.pause();
    intro.currentTime = 0;
    intro.volume = 0;
    intro.onended = () => endIntro();
    introEndTimer.current = window.setTimeout(() => endIntro(), INTRO_DURATION_MS);

    const playing = await playAudioElement(intro);
    if (!playing) {
      endIntro();
      return false;
    }

    musicPlayingRef.current = true;
    void fadeAudioVolume(intro, MUSIC_VOLUME, MUSIC_FADE_IN_MS);
    return true;
  }, [endIntro]);

  const beginCelebration = useCallback(async (): Promise<boolean> => {
    await unlockAudio();
    return startMusic();
  }, [unlockAudio, startMusic]);

  const playSfx = useCallback((key: SfxKey, volume = 0.55, fadeInMs = 0) => {
    const template = sfxTemplates.current[key];
    if (!template) return;

    const playClone = () => {
      const sfx = template.cloneNode(true) as HTMLAudioElement;
      sfx.currentTime = 0;

      if (fadeInMs > 0) {
        sfx.volume = 0;
        void sfx
          .play()
          .then(() => fadeAudioVolume(sfx, volume, fadeInMs))
          .catch(() => undefined);
        return;
      }

      sfx.volume = volume;
      void sfx.play().catch(() => undefined);
    };

    if (sfxUnlockedRef.current.has(key)) {
      playClone();
      return;
    }

    void ensureSfxReady(key).then(playClone);
  }, [ensureSfxReady]);

  const playFireworkBurst = useCallback(
    (volume = 0.5) => {
      const key = FIREWORK_SFX[fireworkPick.current % FIREWORK_SFX.length];
      fireworkPick.current += 1;
      playSfx(key, volume, 80);
    },
    [playSfx],
  );

  const playPartyHorn = useCallback(
    (volume = PARTY_HORN_VOLUME) => {
      const key = PARTY_HORN_SFX[partyHornPick.current % PARTY_HORN_SFX.length];
      partyHornPick.current += 1;
      playSfx(key, volume, SFX_FADE_IN_MS);
    },
    [playSfx],
  );

  const playButtonClick = useCallback(
    (volume = BUTTON_CLICK_VOLUME) => {
      playSfx("ui-click", volume, 25);
    },
    [playSfx],
  );

  const playFinaleJingle = useCallback(async (): Promise<boolean> => {
    const finale = finaleRef.current;
    if (!finale) return false;
    if (finalePlayedRef.current) return true;

    finale.currentTime = 0;
    finale.volume = 0;
    const playing = await playAudioElement(finale);
    if (!playing) return false;

    finalePlayedRef.current = true;
    void fadeAudioVolume(finale, FINALE_VOLUME, 900);
    return true;
  }, []);

  return {
    unlockAudio,
    startMusic,
    beginCelebration,
    playSfx,
    playFireworkBurst,
    playPartyHorn,
    playButtonClick,
    playFinaleJingle,
    celebrationPhase,
    musicPlayingRef,
    musicPlaying: celebrationPhase === "music",
  };
}
