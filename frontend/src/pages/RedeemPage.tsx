import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, LoaderCircle, ShieldCheck, Ticket, TicketCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { redeemCode } from '../services/loyalty';
import { CardFront } from '../components/CardArt';
import type { AxiosError } from 'axios';

const REDEEM_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function formatRedeemCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return cleaned.match(/.{1,4}/g)?.join('-') ?? '';
}

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isCodeValid = REDEEM_CODE_PATTERN.test(code);

  function handleCodeChange(raw: string) {
    setCode(formatRedeemCode(raw));
    if (error) setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formatted = formatRedeemCode(code);
    if (!REDEEM_CODE_PATTERN.test(formatted)) {
      setError('Kode harus terdiri dari 12 huruf/angka dengan format XXXX-XXXX-XXXX.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await redeemCode(formatted);
      navigate(`/card/${encodeURIComponent(result.data.card_public_token)}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'Kode belum dapat diproses. Periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="redeem-portal container">
      <div className="redeem-hero">
        <h1>
          Klaim Stamp.
          <br />
          <span>Raih Gratisnya.</span>
        </h1>
        <p className="portal-lead">
          Tukarkan kode unik dari WhatsApp SUKI setelah pesanan selesai. Kumpulkan 4 stamp untuk mendapatkan 1 Mango Juice 16 oz gratis.
        </p>

        <div className="promo-card-wrap">
          <CardFront className="promo-card" />
          <span className="promo-card-caption">Preview Kartu Loyalitas Digital SUKI</span>
        </div>

        <ol className="portal-steps" aria-label="Cara kerja redeem stamp">
          <li><b>1</b><span>Beli SUKI</span></li>
          <li><b>2</b><span>Masukkan Kode</span></li>
          <li><b>3</b><span>4 Stamp = Gratis!</span></li>
        </ol>
      </div>

      <form className="redeem-form-card" onSubmit={handleSubmit}>
        <div className="redeem-form-head">
          <div className="redeem-form-icon"><TicketCheck size={23} strokeWidth={2.3} /></div>
          <div>
            <h2>Redeem Kode Stamp</h2>
            <p>Masukkan kode dari WhatsApp setelah transaksi selesai.</p>
          </div>
        </div>

        <div className="redeem-form-divider" />

        <label htmlFor="redeem-code">KODE REDEEM</label>
        <div className="code-input-wrap">
          <Ticket className="code-input-icon" size={18} strokeWidth={2.2} />
          <input
            id="redeem-code"
            className="redeem-code-input"
            value={code}
            onChange={(event) => handleCodeChange(event.target.value)}
            placeholder="SUKI-XXXX-XXXX"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            pattern="[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}"
            maxLength={14}
          />
        </div>
        <span className="input-hint">Format kode: <b>SUKI-XXXX-XXXX</b> (12 huruf &amp; angka, huruf kapital)</span>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="primary-button" type="submit" disabled={loading || !isCodeValid}>
          {loading
            ? <><LoaderCircle className="spin" size={18} /> Memverifikasi kode...</>
            : <>KLAIM STAMP SEKARANG <ArrowRight size={18} strokeWidth={2.5} /></>}
        </button>

        <div className="redeem-trust-note">
          <ShieldCheck size={15} strokeWidth={2.3} />
          <span>Kode berlaku satu kali · Kartu digital langsung terbuka</span>
        </div>
      </form>
    </section>
  );
}
