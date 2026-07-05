import { useLayoutEffect, useRef, useState } from "react";

interface ScamMarqueeProps {
  text: string;
  fixed?: boolean | "top" | "bottom";
  reverse?: boolean;
  duration?: number;
}

export function ScamMarquee({ text, fixed = false, reverse = false, duration = 50 }: ScamMarqueeProps) {
  const unitRef = useRef<HTMLSpanElement>(null);
  const [unitWidth, setUnitWidth] = useState(0);

  const fixedClass =
    fixed === "top"
      ? " scam-marquee--fixed scam-marquee--fixed-top"
      : fixed === "bottom" || fixed === true
        ? " scam-marquee--fixed scam-marquee--fixed-bottom"
        : "";

  useLayoutEffect(() => {
    const el = unitRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setUnitWidth(width);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [text]);

  const ready = unitWidth > 0;

  return (
    <div className={`scam-marquee${fixedClass}`}>
      <div className="scam-marquee__viewport">
        <div
          className={`scam-marquee__track${reverse ? " scam-marquee__track--reverse" : ""}${ready ? " scam-marquee__track--ready" : ""}`}
          style={{
            animationDuration: `${duration}s`,
            ...(ready ? { ["--marquee-shift" as string]: `${unitWidth}px` } : {}),
          }}
        >
          <span ref={unitRef} className="scam-marquee__unit">
            {text}
          </span>
          <span className="scam-marquee__unit" aria-hidden>
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}

export const BOTTOM_MARQUEE_TEXT =
  "🦙 Von Hennilein für Vonnilein mit Liebe · 🐨 Löse JETZT deine Überraschung ein · ★ Kein Rückgaberecht · ★ Teilnahmebedingungen im Kleingedruckten deines Herzens · Alle Termine unverbindlich — Bestätigung durch den Veranstalter (Henni) zwingend erforderlich · Ziel streng geheim · Irrtum vorbehalten · Nicht gültig in Bielefeld · Angebot nur solange der Koala wach ist · ";

export const TOP_MARQUEE_TEXT =
  "★★★ EXKLUSIV ★★★ NUR FÜR VONNILEIN ★★★ ZIEL GEHEIM ★★★ VON HENNILEIN ★★★ 100% LEGIT ★★★ VERTRAUEN SIE UNS ★★★ · ";
