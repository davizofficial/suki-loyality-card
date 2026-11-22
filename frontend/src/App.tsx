import { Link, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Instagram } from 'lucide-react';
import RedeemPage from './pages/RedeemPage';
import LoyaltyCardPage from './pages/LoyaltyCardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header-wrap">
        <div className="site-header container">
          <Link to="/" className="brand-lockup" aria-label="SUKI Loyalty home">
            <img className="brand-logo-img" src="/assets/branding/suki-logo.png" alt="SUKI logo" />
            <span className="brand-copy">
              <span className="brand-name">SUKI<span>.</span></span>
              <small className="brand-tagline">LOYALTY &amp; REWARDS</small>
            </span>
          </Link>
          <a className="instagram-link" href="https://instagram.com/sobat.suki.pwt" target="_blank" rel="noreferrer">
            <Instagram size={15} strokeWidth={2.3} /> <span>@sobat.suki.pwt</span>
          </a>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <div className="page-wave-footer-wrap">
        <img className="page-wave-decoration" src="/assets/branding/wave_decoration.png" alt="" aria-hidden="true" />
        <footer className="site-footer">
          <div className="container footer-inner">
            <span>Segar untuk kala istirahat · <b>SUKI Loyalty</b></span>
            <a href="https://instagram.com/sobat.suki.pwt" target="_blank" rel="noreferrer" className="footer-ig">
              <Instagram size={14} strokeWidth={2.3} /> @sobat.suki.pwt
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell><RedeemPage /></Shell>} />
      <Route path="/redeem" element={<Shell><RedeemPage /></Shell>} />
      <Route path="/card/:token" element={<Shell><LoyaltyCardPage /></Shell>} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
