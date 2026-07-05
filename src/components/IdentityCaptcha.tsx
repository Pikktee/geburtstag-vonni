import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { SlidingPuzzle } from "./SlidingPuzzle";
import {
  isAnswerCorrect,
  isSlidingPuzzleQuestion,
  VERIFICATION_QUESTIONS,
} from "../config/verification";
import {
  isPuzzleSolved,
  shuffleBoard,
  type PuzzleBoard,
} from "../utils/slidingPuzzle";

interface IdentityCaptchaProps {
  onSuccess: () => void;
  puzzleImageSrc?: string;
  onPlayWarning?: () => void;
}

const CAPTCHA_THEMES = [
  {
    id: "blue",
    border: "#4a7fc1",
    headerBg: "#eef3fb",
    headerText: "#1a3a6b",
    panelBg: "linear-gradient(145deg, #dce8f7 0%, #c5d9ef 100%)",
    challengeBg: "#f8fafc",
    accent: "#2563eb",
  },
  {
    id: "green",
    border: "#3d9a5c",
    headerBg: "#edf7f0",
    headerText: "#1a4d2e",
    panelBg: "linear-gradient(145deg, #d8f0de 0%, #b8e0c4 100%)",
    challengeBg: "#f4fbf6",
    accent: "#15803d",
  },
  {
    id: "amber",
    border: "#c9892a",
    headerBg: "#fef6e8",
    headerText: "#6b3f0a",
    panelBg: "linear-gradient(145deg, #fdecc8 0%, #f5d498 100%)",
    challengeBg: "#fffbf3",
    accent: "#b45309",
  },
] as const;

const IDENTITY_TITLE = "Identitätsprüfung";

type CaptchaIntroPhase = "blink" | "settle" | "ready";

const FAKE_FAIL_MESSAGES = [
  "Verifizierung unterbrochen. Bitte erneut bestätigen.",
  "Verifizierung unterbrochen. Bitte erneut bestätigen.",
  "Verifizierung unterbrochen. Bitte erneut bestätigen.",
];

const REAL_FAIL_MESSAGES = [
  "Falsche Antwort. Bitte erneut versuchen.",
  "Eingabe nicht erkannt. Versuche es noch einmal.",
  "Das stimmt nicht. Bitte erneut eingeben.",
];

/** Lesbare Akzente — pro Wort, nicht pro Buchstabe. */
const CAPTCHA_WORD_COLORS = (accent: string) =>
  [accent, "#243d7a", "#4a2868", "#1a5c42", accent, "#5c3d1a"] as const;

function CaptchaChallengeText({ text, accent }: { text: string; accent: string }) {
  const wordColors = CAPTCHA_WORD_COLORS(accent);
  const tokens = text.match(/(\s+|[^\s]+)/g) ?? [text];
  let wordIndex = 0;

  return (
    <p className="captcha-challenge-text" aria-label={text}>
      {tokens.map((token, tokenIndex) => {
        if (/^\s+$/.test(token)) {
          return <span key={`space-${tokenIndex}`}> </span>;
        }

        const i = wordIndex++;
        const tilt = (i % 2 === 0 ? 1 : -1) * ((i * 4) % 5);

        return (
          <span
            key={`word-${tokenIndex}`}
            className="captcha-challenge-text__word"
            style={{
              color: wordColors[i % wordColors.length],
              transform: `rotate(${tilt}deg) translateY(${i % 3 === 0 ? 1 : 0}px)`,
            }}
          >
            {token}
          </span>
        );
      })}
    </p>
  );
}

interface CaptchaStepProps {
  questionIndex: number;
  selection: string;
  onSelect: (value: string) => void;
  onSubmit: () => void;
  error: ReactNode | null;
  isBusy: boolean;
  attemptCount: number;
}

function CaptchaHelpDialog({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="captcha-dialog-backdrop" onClick={onClose} role="presentation">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ duration: 0.2 }}
        className="captcha-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="captcha-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="captcha-dialog-title" className="captcha-dialog__message">
          {message}
        </p>
        <button type="button" className="captcha-dialog__close" onClick={onClose}>
          Ah, okay…
        </button>
      </motion.div>
    </div>
  );
}

interface CaptchaPuzzleStepProps {
  questionIndex: number;
  puzzleImageSrc: string;
  onSubmit: (board: PuzzleBoard) => void;
  error: ReactNode | null;
  isBusy: boolean;
  attemptCount: number;
}

function CaptchaPuzzleStep({
  questionIndex,
  puzzleImageSrc,
  onSubmit,
  error,
  isBusy,
  attemptCount,
}: CaptchaPuzzleStepProps) {
  const question = VERIFICATION_QUESTIONS[questionIndex];
  const theme = CAPTCHA_THEMES[questionIndex] ?? CAPTCHA_THEMES[0];
  const [board, setBoard] = useState<PuzzleBoard>(() => shuffleBoard());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(null);

    const image = new Image();
    image.decoding = "async";
    image.onload = () => setImageLoaded(true);
    image.onerror = () => setImageError("Das Rätselbild konnte nicht geladen werden.");
    image.src = puzzleImageSrc;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [puzzleImageSrc]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: 0.35 }}
      className="captcha-step"
      style={{
        borderColor: theme.border,
        background: theme.panelBg,
      }}
    >
      <div
        className="captcha-step__header"
        style={{ background: theme.headerBg, color: theme.headerText, borderColor: theme.border }}
      >
        <span className="captcha-step__badge">CAPTCHA</span>
        <span className="captcha-step__ref">Ref. #{String(questionIndex + 1).padStart(3, "0")}</span>
      </div>

      <div
        className="captcha-step__visual captcha-step__visual--puzzle"
        style={{ background: theme.challengeBg, borderColor: theme.border }}
      >
        <div className="captcha-step__lines" aria-hidden="true" />
        <CaptchaChallengeText text={question.label} accent={theme.accent} />
        <p className="captcha-step__instruction">
          Klicke auf eine Kachel neben dem leeren Feld, um sie zu verschieben.
        </p>
      </div>

      <div className="captcha-step__puzzle-area">
        {imageError && <p className="captcha-step__puzzle-status">{imageError}</p>}
        {!imageError && !imageLoaded && (
          <p className="captcha-step__puzzle-status">Rätselbild wird geladen…</p>
        )}
        {imageLoaded && !imageError && (
          <SlidingPuzzle
            imageUrl={puzzleImageSrc}
            board={board}
            onBoardChange={setBoard}
            disabled={isBusy}
          />
        )}
      </div>

      <div className="captcha-step__footer">
        <span className="captcha-step__attempts">Fehlversuche: {attemptCount}</span>
        <span className="captcha-step__brand" style={{ color: theme.accent }}>
          reCAPTCHA
        </span>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="captcha-step__error"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <button
        type="button"
        className="captcha-step__submit"
        style={{ background: theme.accent, borderColor: theme.border }}
        disabled={!imageLoaded || isBusy || !!imageError}
        onClick={() => onSubmit(board)}
      >
        {isBusy ? "Wird geprüft…" : "Verifizieren"}
      </button>
    </motion.div>
  );
}

function CaptchaStep({
  questionIndex,
  selection,
  onSelect,
  onSubmit,
  error,
  isBusy,
  attemptCount,
}: CaptchaStepProps) {
  const question = VERIFICATION_QUESTIONS[questionIndex];
  const theme = CAPTCHA_THEMES[questionIndex] ?? CAPTCHA_THEMES[0];
  const [showHelpButton, setShowHelpButton] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  useEffect(() => {
    setShowHelpButton(false);
    setHelpDialogOpen(false);

    if (!question.helpAfterMs) return;

    const timer = window.setTimeout(() => setShowHelpButton(true), question.helpAfterMs);
    return () => window.clearTimeout(timer);
  }, [question.id, question.helpAfterMs]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: 0.35 }}
      className="captcha-step"
      style={{
        borderColor: theme.border,
        background: theme.panelBg,
      }}
    >
      <div
        className="captcha-step__header"
        style={{ background: theme.headerBg, color: theme.headerText, borderColor: theme.border }}
      >
        <span className="captcha-step__badge">CAPTCHA</span>
        <span className="captcha-step__ref">Ref. #{String(questionIndex + 1).padStart(3, "0")}</span>
      </div>

      <div
        className="captcha-step__visual"
        style={{ background: theme.challengeBg, borderColor: theme.border }}
      >
        <div className="captcha-step__lines" aria-hidden="true" />
        <CaptchaChallengeText text={question.label} accent={theme.accent} />
        <p className="captcha-step__instruction">Bitte gib die richtige Antwort ein.</p>
      </div>

      <div className="captcha-step__field">
        <input
          type="text"
          className="captcha-step__input"
          value={selection}
          disabled={isBusy}
          placeholder={question.placeholder ?? "Antwort eingeben…"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => onSelect(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && selection.trim() && !isBusy) onSubmit();
          }}
          aria-label={question.label}
        />
        {showHelpButton && question.helpButtonLabel && question.helpDialogMessage && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            className="captcha-step__help"
            style={{ color: theme.accent, borderColor: theme.border }}
            onClick={() => setHelpDialogOpen(true)}
          >
            {question.helpButtonLabel}
          </motion.button>
        )}
      </div>

      <div className="captcha-step__footer">
        <span className="captcha-step__attempts">Fehlversuche: {attemptCount}</span>
        <span className="captcha-step__brand" style={{ color: theme.accent }}>
          reCAPTCHA
        </span>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="captcha-step__error"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {helpDialogOpen && question.helpDialogMessage && (
          <CaptchaHelpDialog
            message={question.helpDialogMessage}
            onClose={() => setHelpDialogOpen(false)}
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        className="captcha-step__submit"
        style={{ background: theme.accent, borderColor: theme.border }}
        disabled={!selection.trim() || isBusy}
        onClick={onSubmit}
      >
        {isBusy ? "Wird geprüft…" : "Verifizieren"}
      </button>
    </motion.div>
  );
}

function buildWrongAnswerMessage(
  question: (typeof VERIFICATION_QUESTIONS)[number],
  questionIndex: number,
  wrongAttempts: number,
): ReactNode {
  const baseMessage =
    question.wrongHint ?? REAL_FAIL_MESSAGES[questionIndex % REAL_FAIL_MESSAGES.length];
  const linkThreshold = question.albumLinkAfterAttempts ?? 3;

  if (question.albumLink && wrongAttempts >= linkThreshold) {
    return (
      <>
        {baseMessage}{" "}
        <a
          href={question.albumLink}
          target="_blank"
          rel="noopener noreferrer"
          className="captcha-step__error-link"
        >
          Zum Fotoalbum
        </a>
      </>
    );
  }

  return baseMessage;
}

export function IdentityCaptcha({
  onSuccess,
  puzzleImageSrc = "/assets/images/koala-alpaka-frankfurt.jpg",
  onPlayWarning,
}: IdentityCaptchaProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selection, setSelection] = useState("");
  const [error, setError] = useState<ReactNode | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);
  const [wrongAttemptsForQuestion, setWrongAttemptsForQuestion] = useState(0);
  const [introPhase, setIntroPhase] = useState<CaptchaIntroPhase>("blink");
  const warningPlayedRef = useRef(false);

  const currentQuestion = VERIFICATION_QUESTIONS[questionIndex];
  const isPuzzleStep = isSlidingPuzzleQuestion(currentQuestion);

  useEffect(() => {
    const settleTimer = window.setTimeout(() => setIntroPhase("settle"), 1400);
    const readyTimer = window.setTimeout(() => setIntroPhase("ready"), 2200);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    if (introPhase !== "blink" || warningPlayedRef.current) return;
    warningPlayedRef.current = true;

    // Kurz verzögert, damit Sound und erste Blink-Phase zusammen starten
    const alarmTimer = window.setTimeout(() => onPlayWarning?.(), 60);
    return () => window.clearTimeout(alarmTimer);
  }, [introPhase, onPlayWarning]);

  useEffect(() => {
    setWrongAttemptsForQuestion(0);
  }, [questionIndex]);

  const handleTextSubmit = useCallback(() => {
    const trimmed = selection.trim();
    if (!trimmed || isBusy) return;

    const question = VERIFICATION_QUESTIONS[questionIndex];
    const isLast = questionIndex >= VERIFICATION_QUESTIONS.length - 1;

    setIsBusy(true);
    setError(null);

    window.setTimeout(() => {
      if (!isAnswerCorrect(trimmed, question.correct)) {
        setWrongAttemptsForQuestion((prev) => {
          const nextWrongAttempts = prev + 1;
          setError(buildWrongAnswerMessage(question, questionIndex, nextWrongAttempts));
          return nextWrongAttempts;
        });
        setAttemptCount((c) => c + 1);
        setIsBusy(false);
        return;
      }

      if (!isLast) {
        setError(FAKE_FAIL_MESSAGES[questionIndex % FAKE_FAIL_MESSAGES.length]);
        setAttemptCount((c) => c + 1);

        window.setTimeout(() => {
          setQuestionIndex((i) => i + 1);
          setSelection("");
          setError(null);
          setIsBusy(false);
        }, 1600);
        return;
      }

      setError(null);
      setIsBusy(false);
      onSuccess();
    }, 700);
  }, [selection, isBusy, questionIndex, onSuccess]);

  const handlePuzzleSubmit = useCallback(
    (board: PuzzleBoard) => {
      if (isBusy) return;

      const question = VERIFICATION_QUESTIONS[questionIndex];
      setIsBusy(true);
      setError(null);

      window.setTimeout(() => {
        if (!isPuzzleSolved(board)) {
          setWrongAttemptsForQuestion((prev) => {
            const nextWrongAttempts = prev + 1;
            setError(buildWrongAnswerMessage(question, questionIndex, nextWrongAttempts));
            return nextWrongAttempts;
          });
          setAttemptCount((c) => c + 1);
          setIsBusy(false);
          return;
        }

        setError(null);
        setIsBusy(false);
        onSuccess();
      }, 700);
    },
    [isBusy, questionIndex, onSuccess],
  );

  const showSplash = introPhase === "blink";
  const showHeader = introPhase === "settle" || introPhase === "ready";
  const showCaptcha = introPhase === "ready";

  return (
    <div className={`identity-captcha${showSplash ? " identity-captcha--splash-active" : ""}`}>
      <LayoutGroup id="captcha-identity-intro">
        {showSplash ? (
          <div className="captcha-title-anchor captcha-title-anchor--splash" aria-hidden={!showSplash}>
            <motion.p
              layoutId="captcha-identity-title"
              className="captcha-title--splash captcha-title--blink"
              transition={{ layout: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }}
            >
              {IDENTITY_TITLE}
            </motion.p>
          </div>
        ) : showHeader ? (
          <div className="captcha-header">
            <span className="captcha-header__icon">🛡️</span>
            <div>
              <motion.p
                layoutId="captcha-identity-title"
                className="captcha-header__title"
                transition={{ layout: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }}
              >
                {IDENTITY_TITLE}
              </motion.p>
              <motion.p
                className="captcha-header__sub"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: showCaptcha ? 1 : 0, y: showCaptcha ? 0 : 6 }}
                transition={{ duration: 0.35, delay: showCaptcha ? 0.1 : 0 }}
              >
                Bitte löse das Captcha, um fortzufahren.
              </motion.p>
            </div>
          </div>
        ) : null}
      </LayoutGroup>

      {showCaptcha && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            {isPuzzleStep ? (
              <CaptchaPuzzleStep
                key={`captcha-${questionIndex}`}
                questionIndex={questionIndex}
                puzzleImageSrc={puzzleImageSrc}
                onSubmit={handlePuzzleSubmit}
                error={error}
                isBusy={isBusy}
                attemptCount={attemptCount}
              />
            ) : (
              <CaptchaStep
                key={`captcha-${questionIndex}`}
                questionIndex={questionIndex}
                selection={selection}
                onSelect={(value) => {
                  setSelection(value);
                  setError(null);
                }}
                onSubmit={handleTextSubmit}
                error={error}
                isBusy={isBusy}
                attemptCount={attemptCount}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
