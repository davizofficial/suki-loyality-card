import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ExternalLink, LoaderCircle, MessageCircle, PartyPopper, RefreshCw, RotateCw, X, ZoomIn } from 'lucide-react';
import { getPublicCard } from '../services/loyalty';
import type { PublicLoyaltyCard } from '../types/loyalty';
import { CardFront } from '../components/CardArt';

const STAMP_BOX_POSITIONS = [
  { left: '4.56%', top: '35.00%', width: '17.28%', height: '42.64%' },
  { left: '23.28%', top: '35.00%', width: '17.00%', height: '42.64%' },
  { left: '41.67%', top: '35.00%', width: '16.94%', height: '42.64%' },
  { left: '60.00%', top: '35.00%', width: '16.94%', height: '42.64%' },
];

const STAMP_ROTATIONS = [-14, -8, -16, -10];

const BALLOONS = [
  { left: '6%', color: '#e64104', delay: '0s', duration: '6.5s', size: 42 },
  { left: '16%', color: '#ffd21f', delay: '0.6s', duration: '7.2s', size: 36 },
  { left: '28%', color: '#3d8526', delay: '1.1s', duration: '6.8s', size: 40 },
  { left: '42%', color: '#ff7b3b', delay: '0.3s', duration: '7.5s', size: 34 },
  { left: '58%', color: '#ffd21f', delay: '0.9s', duration: '6.4s', size: 44 },
  { left: '72%', color: '#e64104', delay: '0.2s', duration: '7.1s', size: 38 },
  { left: '84%', color: '#3d8526', delay: '0.8s', duration: '6.7s', size: 40 },
  { left: '93%', color: '#ff9f1c', delay: '1.3s', duration: '7.4s', size: 35 },
];

function CelebrationBalloons() {
  return (
    <div className="celebration-layer" aria-hidden="true">
      {BALLOONS.map((b, idx) => (
        <span
          key={idx}
          className="celebration-balloon"
          style={{
            left: b.left,
            width: `${b.size}px`,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        >
          <svg viewBox="0 0 48 82" fill="none">
            <path d="M24 49C24 58 19 64 25 73C28 77 23 81 23 81" stroke="#b38d65" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="24" cy="23" rx="18" ry="22" fill={b.color} />
            <ellipse cx="17" cy="15" rx="4.5" ry="7.5" transform="rotate(-20 17 15)" fill="rgba(255,255,255,0.42)" />
            <polygon points="24,44 20,49 28,49" fill={b.color} />
          </svg>
        </span>
      ))}
    </div>
  );
}

const REWARD_BOX_POSITION = {
  left: '78.20%',
  top: '35.00%',
  width: '17.20%',
  height: '42.64%',
};

function RedStampWatermark({ index }: { index: number }) {
  const angle = STAMP_ROTATIONS[index % STAMP_ROTATIONS.length];
  return (
    <svg
      className="red-stamp-watermark"
      style={{ transform: `rotate(${angle}deg)` }}
      viewBox="0 0 128 128"
      fill="none"
      aria-label={`Cap stempel ${index + 1}`}
    >
      <circle cx="64" cy="64" r="54" fill="rgba(255, 250, 240, 0.72)" />
      <circle cx="64" cy="64" r="55" stroke="#c81414" strokeWidth="5.5" strokeDasharray="28 3 42 2.5 32 3" />
      <circle cx="64" cy="64" r="46" stroke="#c81414" strokeWidth="2.2" />

      <text
        x="64"
        y="37"
        textAnchor="middle"
        fill="#c81414"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="14"
        letterSpacing="1.8"
      >
        ★ SUKI ★
      </text>

      <rect x="10" y="46" width="108" height="34" rx="8" fill="#fffaf0" stroke="#c81414" strokeWidth="3.6" />
      <rect x="13" y="49" width="102" height="28" rx="5.5" fill="#c81414" />
      <text
        x="64"
        y="69"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="16.5"
        letterSpacing="1.6"
      >
        STAMPED
      </text>

      <text
        x="64"
        y="100"
        textAnchor="middle"
        fill="#c81414"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="14"
        letterSpacing="1"
      >
        CUP #{index + 1} ✓
      </text>
    </svg>
  );
}

export default function LoyaltyCardPage() {
  const { token = '' } = useParams();
  const [card, setCard] = useState<PublicLoyaltyCard | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCard() {
    setLoading(true);
    setError('');
    try {
      setCard(await getPublicCard(token));
    } catch {
      setError('Kartu tidak ditemukan atau tautannya sudah tidak berlaku.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCard();
  }, [token]);

  useEffect(() => {
    if (!qrModalOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setQrModalOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [qrModalOpen]);

  if (loading && !card) {
    return (
      <div className="center-state">
        <LoaderCircle className="spin" />
        <p>Menyiapkan kartu SUKI...</p>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="center-state">
        <h2>Kartu tidak ditemukan</h2>
        <p>{error}</p>
        <Link className="text-link" to="/">Kembali ke halaman redeem</Link>
      </div>
    );
  }

  const target = card.stamp_target || 4;
  const progress = Math.min(card.stamp_balance, target);
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const cardUrl = `${appUrl}/card/${encodeURIComponent(token)}`;
  const rewardLabel = card.reward_name || 'Mango Juice 16 oz';
  const adminWa = (import.meta.env.VITE_ADMIN_WHATSAPP || '6281234567890').replace(/[^0-9]/g, '');
  const waMessage = `Halo Admin SUKI! Saya ${card.customer_name} (ID Kartu: ${card.card_code}) sudah mengumpulkan ${card.stamp_balance}/${target} stamp dan ingin mengklaim bonus ${rewardLabel} gratis. Link kartu: ${cardUrl}`;
  const whatsappUrl = `https://wa.me/${adminWa}?text=${encodeURIComponent(waMessage)}`;

  return (
    <section className="card-page container">
      {card.reward_available && <CelebrationBalloons />}
      <Link to="/" className="back-link anim-fade-up"><ArrowLeft size={16} /> Kembali</Link>

      <div className="card-page-heading anim-fade-up anim-delay-1">
        <span className="eyebrow">YOUR SUKI REWARDS · {card.card_code}</span>
        <h1>Hi, {card.customer_name}!</h1>
        <p>Kartu loyalitas digitalmu sudah siap digunakan.</p>
      </div>

      <div className="loyalty-card-perspective anim-fade-up anim-delay-2">
        <button
          type="button"
          className={`loyalty-card-stage ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
          aria-label="Balik kartu loyalitas"
        >
          <span className="loyalty-card-inner">
            {/* FRONT — front_card.png */}
            <CardFront />

            {/* BACK — back_card_new.png + watermark cap stempel merah */}
            <span className="loyalty-card-face loyalty-card-back">
              <img
                className="card-face-art"
                src="/assets/loyality_card/card-back-bg.png"
                alt="SUKI Loyalty Card — sisi belakang"
                decoding="async"
              />

              {STAMP_BOX_POSITIONS.slice(0, target).map((pos, index) => {
                const filled = index < progress;
                if (!filled) return null;
                return (
                  <span
                    key={index}
                    className="stamp-watermark-slot"
                    style={{ ...pos, animationDelay: `${index * 90}ms` }}
                  >
                    <RedStampWatermark index={index} />
                  </span>
                );
              })}

              {card.reward_available && (
                <span
                  className="card-reward-unlocked-ring"
                  style={REWARD_BOX_POSITION}
                  aria-label="Reward gratis siap diklaim"
                />
              )}
            </span>
          </span>
        </button>
      </div>

      <div className="flip-hint-wrap anim-fade-up anim-delay-3">
        <button type="button" className="flip-hint-pill" onClick={() => setFlipped(!flipped)}>
          <RotateCw size={13} className={flipped ? 'is-rotated' : ''} />
          <span>{flipped ? 'Lihat bagian depan kartu' : 'Ketuk kartu untuk melihat stamp kamu'}</span>
        </button>
      </div>

      {card.reward_available && (
        <div className="reward-celebration-banner anim-fade-up anim-delay-3" role="status">
          <div className="reward-celebration-head">
            <span className="reward-celebration-icon"><PartyPopper size={24} strokeWidth={2.2} /></span>
            <div>
              <span className="eyebrow">REWARD TERBUKA</span>
              <h2>Selamat! Stamp Kamu Sudah Penuh!</h2>
              <p>
                Kamu berhak mendapatkan <b>1 {rewardLabel} Gratis</b>. Klaim bonusmu sekarang ke admin SUKI melalui WhatsApp.
              </p>
            </div>
          </div>
          <a
            className="whatsapp-claim-button"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={19} strokeWidth={2.3} />
            <span>KLAIM BONUS VIA WHATSAPP</span>
            <ExternalLink size={16} strokeWidth={2.3} />
          </a>
        </div>
      )}

      <div className="card-progress-panel anim-fade-up anim-delay-4">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STAMP COLLECTION</span>
            <h2>{progress} dari {target} stamp</h2>
          </div>
          <span className="progress-number">{Math.round((progress / target) * 100)}%</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${(progress / target) * 100}%` }} />
        </div>
        <p>
          {card.reward_available
            ? `Yeay! Reward ${rewardLabel} kamu sudah tersedia. Tunjukkan kartu kepada admin SUKI.`
            : `Kumpulkan ${Math.max(0, target - progress)} stamp lagi untuk mendapatkan ${rewardLabel} gratis.`}
        </p>
      </div>

      <div className="member-qr-panel anim-fade-up anim-delay-5">
        <div>
          <h3>QR Kartu Pelanggan · {card.card_code}</h3>
          <p>
            Tunjukkan QR ini kepada admin saat melakukan pembelian di Market Day maupun saat pengambilan pesanan Pre-Order (Open Batch).
          </p>
          <span className="qr-tap-hint"><ZoomIn size={13} /> Ketuk kode QR untuk memperbesar</span>
        </div>
        <button
          type="button"
          className="qr-wrap qr-trigger"
          onClick={() => setQrModalOpen(true)}
          aria-label="Perbesar QR Kartu Pelanggan"
        >
          <QRCodeSVG value={cardUrl} size={116} level="M" />
        </button>
      </div>

      <button type="button" className="secondary-button anim-fade-up anim-delay-5" onClick={() => void loadCard()}>
        <RefreshCw size={16} /> Refresh kartu
      </button>

      {qrModalOpen && (
        <div
          className="qr-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          onClick={() => setQrModalOpen(false)}
        >
          <div className="qr-modal-card" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="qr-modal-close"
              onClick={() => setQrModalOpen(false)}
              aria-label="Tutup tampilan QR"
            >
              <X size={18} />
            </button>
            <span className="eyebrow">SUKI LOYALTY QR</span>
            <h3 id="qr-modal-title">{card.customer_name}</h3>
            <span className="qr-modal-code">{card.card_code}</span>
            <div className="qr-modal-box">
              <QRCodeSVG value={cardUrl} size={236} level="M" />
            </div>
            <p className="qr-modal-note">
              Tunjukkan QR ini kepada admin saat pembelian di Market Day atau pengambilan Pre-Order (Open Batch).
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
