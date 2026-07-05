import { LOCATION_IMAGES } from "../types";
import { LOCATION_META } from "../config/locations";

interface MobileImageStripProps {
  imagePaths: Record<string, string>;
}

function MobileCard({
  label,
  tagline,
  src,
  tilt,
}: {
  label: string;
  tagline: string;
  src: string;
  tilt: number;
}) {
  return (
    <div className="mobile-card" style={{ ["--tilt" as string]: `${tilt}deg` }}>
      <img className="mobile-card__img" src={src} alt="" loading="lazy" decoding="async" />
      <div className="mobile-card__shade" aria-hidden="true" />
      <div className="mobile-card__label">
        <span className="mobile-card__eyebrow">✈ Reiseziel</span>
        <span className="mobile-card__name">{label}</span>
        <span className="mobile-card__tagline">{tagline}</span>
      </div>
    </div>
  );
}

function MobileRow({
  imagePaths,
  reverse,
  duration,
}: {
  imagePaths: Record<string, string>;
  reverse?: boolean;
  duration: number;
}) {
  const ids = reverse ? [...LOCATION_IMAGES].reverse() : LOCATION_IMAGES;
  const cards = ids.map((id, i) => ({
    id,
    label: LOCATION_META[id].label,
    tagline: LOCATION_META[id].tagline,
    src: imagePaths[id] ?? `/assets/images/${id}.jpg`,
    tilt: (i % 2 === 0 ? 1 : -1) * (2 + (i % 3)),
  }));

  return (
    <div className={`mobile-image-strip__row${reverse ? " mobile-image-strip__row--reverse" : ""}`}>
      <div
        className="mobile-image-strip__track"
        style={{ animationDuration: `${duration}s` }}
      >
        {[...cards, ...cards].map((card, i) => (
          <MobileCard key={`${card.id}-${i}`} {...card} />
        ))}
      </div>
    </div>
  );
}

export function MobileImageStrip({ imagePaths }: MobileImageStripProps) {
  return (
    <div className="mobile-image-strip" aria-hidden="true">
      <MobileRow imagePaths={imagePaths} duration={28} />
      <MobileRow imagePaths={imagePaths} reverse duration={36} />
    </div>
  );
}
