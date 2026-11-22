import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { api } from '../../services/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('suki_admin_token')) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/admin/auth/login', { email, password });
      sessionStorage.setItem('suki_admin_token', response.data.data.token);
      navigate('/admin');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Login gagal. Periksa email, password, dan koneksi API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="brand-lockup">
          <img className="brand-logo-img" src="/assets/branding/suki-logo.png" alt="SUKI logo" />
          <span className="brand-name">SUKI<span>.</span></span>
        </div>
        <span className="eyebrow">ADMINISTRATION</span>
        <h1>Admin login</h1>
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={loading}>
          {loading ? 'Memeriksa...' : 'LOGIN'}
        </button>
      </form>
    </main>
  );
}
