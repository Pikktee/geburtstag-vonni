/**
 * Identitätsfragen – nur Vonnie kann diese korrekt beantworten.
 * Antworten bei Bedarf anpassen.
 */
export type VerificationQuestionType = "text" | "sliding-puzzle";

export interface VerificationQuestion {
  id: string;
  type?: VerificationQuestionType;
  label: string;
  correct?: string;
  /** Meldung bei falscher Antwort (optional, sonst Standardtext) */
  wrongHint?: string;
  placeholder?: string;
  /** Hilfe-Button erscheint nach X Millisekunden */
  helpAfterMs?: number;
  helpButtonLabel?: string;
  helpDialogMessage?: string;
  /** Album-Link nach N Fehlversuchen bei dieser Frage */
  albumLink?: string;
  albumLinkAfterAttempts?: number;
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function isAnswerCorrect(input: string, correct: string | undefined): boolean {
  if (!correct) return false;
  return normalizeAnswer(input) === normalizeAnswer(correct);
}

export function isSlidingPuzzleQuestion(question: VerificationQuestion): boolean {
  return question.type === "sliding-puzzle";
}

export const VERIFICATION_QUESTIONS: VerificationQuestion[] = [
  {
    id: "tryghed",
    label: "Die Definition zu welchem Wort hast du mir am 21. Juni geschickt?",
    correct: "Tryghed",
    wrongHint: "Das ist flasch! Tipp: Es ist ein dänisches Wort!",
    placeholder: "Antwort eingeben…",
  },
  {
    id: "shaqa-mobilje",
    label: "Wie lautet die letzten drei Ziffern der Telefonnummer von SHAQA MOBILJE?",
    correct: "856",
    placeholder: "Antwort eingeben…",
    helpAfterMs: 5000,
    helpButtonLabel: "Hää, was soll das sein?",
    helpDialogMessage:
      "Na die Telefonnummer im Hintergrund des Fotos von Dir, kurz bevor du in Dhërmi in den Bus eingestiegen bist!",
    albumLink:
      "https://photos.google.com/u/1/album/AF1QipOKf2pTuGOJYO0taEbQHr6J3Gz5pFznHVNhK9zb",
    albumLinkAfterAttempts: 3,
  },
  {
    id: "koala-alpaka-puzzle",
    type: "sliding-puzzle",
    label:
      "Bringe Vonnilein und Hennilein wieder zusammen — ordne die neun Kacheln in die richtige Reihenfolge!",
    wrongHint: "Noch nicht ganz! Schieb die Kacheln weiter, bis Koala und Alpaka wieder ein Paar sind.",
  },
];
