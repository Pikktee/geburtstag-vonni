import { useEffect, useState } from "react";

function matchMobilePortrait(breakpointPx: number) {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(`(max-width: ${breakpointPx}px)`).matches &&
    window.matchMedia("(orientation: portrait)").matches
  );
}

/** Schmales Viewport — z. B. Breakpoint-Checks ohne Orientierung. */
export function useIsMobile(breakpointPx = 768) {
  const query = `(max-width: ${breakpointPx}px)`;

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}

/** Mobile Hochformat — Montage, reduzierte Effekte, kein 3D-Karten-Parallax. */
export function useIsMobilePortrait(breakpointPx = 768) {
  const [isPortraitMobile, setIsPortraitMobile] = useState(() => matchMobilePortrait(breakpointPx));

  useEffect(() => {
    const widthMq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const portraitMq = window.matchMedia("(orientation: portrait)");

    const update = () => {
      setIsPortraitMobile(widthMq.matches && portraitMq.matches);
    };

    update();
    widthMq.addEventListener("change", update);
    portraitMq.addEventListener("change", update);
    return () => {
      widthMq.removeEventListener("change", update);
      portraitMq.removeEventListener("change", update);
    };
  }, [breakpointPx]);

  return isPortraitMobile;
}
