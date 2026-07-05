import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { BookingRequest } from "../types";

interface FinaleScreenProps {
  booking: BookingRequest;
  koalaSrc: string;
  alpakaSrc: string;
  onPlayFinale: () => void;
}

const FLOATERS = ["💕", "✨", "🐨", "🦙", "💖", "⭐", "🎂", "💫"];

export function FinaleScreen({ booking, koalaSrc, alpakaSrc, onPlayFinale }: FinaleScreenProps) {
  const playedRef = useRef(false);
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.15 + Math.random() * 0.55,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
      })),
    [],
  );

  const floaters = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        glyph: FLOATERS[i % FLOATERS.length],
        left: 8 + Math.random() * 84,
        delay: Math.random() * 4,
        duration: 10 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 100,
      })),
    [],
  );

  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    void onPlayFinale();
  }, [onPlayFinale]);

  const dateLabel = format(new Date(booking.date), "EEEE, d. MMMM yyyy", { locale: de });

  return (
    <div className="finale-screen" aria-live="polite">
      <div className="finale-screen__bg" />
      <div className="finale-screen__aurora" aria-hidden="true" />

      {stars.map((star) => (
        <span
          key={star.id}
          className="finale-screen__star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}rem`,
            height: `${star.size}rem`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      <motion.div
        className="finale-screen__ring finale-screen__ring--outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
      <motion.div
        className="finale-screen__ring finale-screen__ring--inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />

      <motion.div
        className="finale-screen__orbit finale-screen__orbit--koala"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        <motion.img
          src={koalaSrc}
          alt=""
          className="finale-screen__avatar"
          animate={{ rotate: -360, scale: [1, 1.08, 1] }}
          transition={{
            rotate: { duration: 14, repeat: Infinity, ease: "linear" },
            scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </motion.div>

      <motion.div
        className="finale-screen__orbit finale-screen__orbit--alpaka"
        animate={{ rotate: -360 }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        <motion.img
          src={alpakaSrc}
          alt=""
          className="finale-screen__avatar finale-screen__avatar--alpaka"
          animate={{ rotate: 360, y: [0, -8, 0] }}
          transition={{
            rotate: { duration: 11, repeat: Infinity, ease: "linear" },
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </motion.div>

      {floaters.map((f) => (
        <span
          key={f.id}
          className="finale-screen__floater"
          style={{
            left: `${f.left}%`,
            ["--drift" as string]: `${f.drift}px`,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
          aria-hidden="true"
        >
          {f.glyph}
        </span>
      ))}

      <div className="finale-screen__content">
        <motion.h1
          className="finale-screen__title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          Deine Anfrage ist eingegangen
        </motion.h1>

        <motion.p
          className="finale-screen__date"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.65 }}
        >
          Dein Wunschtermin <strong>{dateLabel}</strong> — du erhältst in Kürze Rückmeldung.
        </motion.p>

        <motion.p
          className="finale-screen__note-box"
          initial={{ opacity: 0, rotate: -2, scale: 0.92 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ delay: 0.75, type: "spring", stiffness: 220 }}
        >
          Beachte, dass der Termin noch verifiziert werden muss. Du erhältst Bescheid, wenn es
          steht. 🦙
        </motion.p>

        {booking.note && (
          <motion.p
            className="finale-screen__user-note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95 }}
          >
            Deine Notiz: „{booking.note}"
          </motion.p>
        )}

        <motion.p
          className="finale-screen__love"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: [1, 1.03, 1] }}
          transition={{
            delay: 1.15,
            duration: 0.8,
            scale: { delay: 1.8, duration: 2.5, repeat: Infinity },
          }}
        >
          Ich hab dich lieb, Vonnilein. Happy Birthday. 💕
        </motion.p>
      </div>
    </div>
  );
}
