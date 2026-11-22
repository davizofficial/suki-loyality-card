import type { ReactNode } from 'react';

export function Checker({ className }: { className: string }) {
  return (
    <span className={`card-checker ${className}`} aria-hidden="true">
      <span /><span className="is-empty" /><span /><span className="is-empty" />
      <span className="is-empty" /><span /><span className="is-empty" /><span />
    </span>
  );
}

interface CardFrontProps {
  className?: string;
  children?: ReactNode;
}

/** Kartu sisi depan menggunakan desain resmi front_card.png. */
export function CardFront({ className = '', children }: CardFrontProps) {
  return (
    <span className={`loyalty-card-face loyalty-card-front ${className}`}>
      <img
        className="card-face-art"
        src="/assets/loyality_card/card-front-bg.png"
        alt="SUKI Loyalty Card — sisi depan"
        decoding="async"
      />
      {children}
    </span>
  );
}
