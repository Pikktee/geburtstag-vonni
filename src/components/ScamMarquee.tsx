interface ScamMarqueeProps {
  text: string;
  fixed?: boolean;
  reverse?: boolean;
  duration?: number;
}

export function ScamMarquee({ text, fixed = false, reverse = false, duration = 50 }: ScamMarqueeProps) {
  return (
    <div className={`scam-marquee${fixed ? " scam-marquee--fixed" : ""}`}>
      <div
        className={`scam-marquee__track${reverse ? " scam-marquee__track--reverse" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}

export const BOTTOM_MARQUEE_TEXT =
  "🦙 Von Hennilein für Vonnilein mit Liebe · 🐨 Löse JETZT deine Überraschung ein · ★ Kein Rückgaberecht · ★ Teilnahmebedingungen im Kleingedruckten deines Herzens · Alle Termine unverbindlich — Bestätigung durch den Veranstalter (Henni) zwingend erforderlich · Ziel streng geheim · Irrtum vorbehalten · Nicht gültig in Bielefeld · Angebot nur solange der Koala wach ist ·";

export const TOP_MARQUEE_TEXT =
  "★★★ EXKLUSIV ★★★ NUR FÜR VONNILEIN ★★★ ZIEL GEHEIM ★★★ VON HENNILEIN ★★★ 100% LEGIT ★★★ VERTRAUEN SIE UNS ★★★";
