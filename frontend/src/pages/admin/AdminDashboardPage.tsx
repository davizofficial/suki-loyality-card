import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  Check,
  Copy,
  ExternalLink,
  Gift,
  LogOut,
  MessageCircle,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Stamp,
  Ticket,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  adjustCustomerStamps,
  adminLogout,
  completeAdminTransaction,
  createAdminCustomer,
  createAdminTransaction,
  getAdminCustomers,
  getAdminDashboard,
  getAdminTransactions,
  redeemCustomerReward,
  scanLoyaltyCard,
} from '../../services/admin';
import type {
  AdminCustomer,
  AdminDashboardSummary,
  AdminScanResult,
  AdminTransaction,
  AdminTransactionItemInput,
  CompleteTransactionResult,
} from '../../types/loyalty';

type TabKey = 'customers' | 'generate' | 'transactions' | 'scan';

const DEFAULT_PRICES: Record<string, number> = {
  'Mango Juice|16 oz': 15000,
  'Mango Juice|18 oz': 18000,
  'Mango Smoothies|16 oz': 18000,
  'Mango Smoothies|18 oz': 22000,
};

function extractCardToken(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/card\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : trimmed;
}

function formatWaNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function getApiError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  const firstValidation = axiosErr.response?.data?.errors
    ? Object.values(axiosErr.response.data.errors).flat()[0]
    : undefined;
  return firstValidation || axiosErr.response?.data?.message || fallback;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('customers');
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Customer form & search
  const [search, setSearch] = useState('');
  const [custName, setCustName] = useState('');
  const [custWa, setCustWa] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custSubmitting, setCustSubmitting] = useState(false);

  // Transaction form
  const [txnCustomerId, setTxnCustomerId] = useState<string>('');
  const [txnChannel, setTxnChannel] = useState<'pre_order' | 'market_day'>('pre_order');
  const [txnItems, setTxnItems] = useState<AdminTransactionItemInput[]>([
    { product_name: 'Mango Juice', variant_size: '16 oz', quantity_paid: 1, quantity_free: 0, unit_price: 15000 },
  ]);
  const [txnCompleteNow, setTxnCompleteNow] = useState(true);
  const [txnSubmitting, setTxnSubmitting] = useState(false);
  const [issuedResult, setIssuedResult] = useState<CompleteTransactionResult | null>(null);

  // Quick Generate Kode Redeem state
  const [genCustomerId, setGenCustomerId] = useState<string>('');
  const [genProduct, setGenProduct] = useState<'Mango Juice' | 'Mango Smoothies'>('Mango Juice');
  const [genSize, setGenSize] = useState<'16 oz' | '18 oz'>('16 oz');
  const [genStamps, setGenStamps] = useState<number>(1);
  const [genSubmitting, setGenSubmitting] = useState(false);
  const [genResult, setGenResult] = useState<CompleteTransactionResult | null>(null);

  // Scan & adjust
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<AdminScanResult | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Penyesuaian manual admin');
  const [actionBusy, setActionBusy] = useState(false);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const refreshAll = useCallback(async (searchQuery = '') => {
    setError('');
    try {
      const [dash, custList, txnList] = await Promise.all([
        getAdminDashboard(),
        getAdminCustomers(searchQuery),
        getAdminTransactions(),
      ]);
      setSummary(dash);
      setCustomers(custList);
      setTransactions(txnList);
      if (custList.length > 0 && !txnCustomerId) {
        setTxnCustomerId(String(custList[0].id));
      }
      if (custList.length > 0 && !genCustomerId) {
        setGenCustomerId(String(custList[0].id));
      }
    } catch (err) {
      setError(getApiError(err, 'Belum dapat mengambil data dashboard. Pastikan backend aktif.'));
    } finally {
      setLoading(false);
    }
  }, [txnCustomerId, genCustomerId]);

  useEffect(() => {
    if (!sessionStorage.getItem('suki_admin_token')) {
      navigate('/admin/login', { replace: true });
      return;
    }
    void refreshAll();
  }, [navigate, refreshAll]);

  async function handleLogout() {
    await adminLogout();
    navigate('/admin/login');
  }

  function copyText(key: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  }

  async function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await refreshAll(search);
  }

  async function handleCreateCustomer(event: FormEvent) {
    event.preventDefault();
    setCustSubmitting(true);
    setError('');
    setNotice('');
    try {
      const created = await createAdminCustomer({
        name: custName.trim(),
        whatsapp_number: custWa.trim(),
        email: custEmail.trim() || undefined,
        notes: custNotes.trim() || undefined,
      });
      setCustName('');
      setCustWa('');
      setCustEmail('');
      setCustNotes('');
      setTxnCustomerId(String(created.customer.id));
      setNotice(`Pelanggan ${created.customer.name} berhasil dibuat (Card ID: ${created.card.card_code}).`);
      await refreshAll(search);
    } catch (err) {
      setError(getApiError(err, 'Gagal menambahkan pelanggan.'));
    } finally {
      setCustSubmitting(false);
    }
  }

  function updateTxnItem(index: number, patch: Partial<AdminTransactionItemInput>) {
    setTxnItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const next = { ...item, ...patch };
        if (patch.product_name || patch.variant_size) {
          const defaultPrice = DEFAULT_PRICES[`${next.product_name}|${next.variant_size}`];
          if (defaultPrice !== undefined) next.unit_price = defaultPrice;
        }
        return next;
      }),
    );
  }

  async function handleCreateTransaction(event: FormEvent) {
    event.preventDefault();
    if (!txnCustomerId) {
      setError('Pilih pelanggan terlebih dahulu.');
      return;
    }
    setTxnSubmitting(true);
    setError('');
    setNotice('');
    setIssuedResult(null);
    try {
      const created = await createAdminTransaction({
        customer_id: Number(txnCustomerId),
        sales_channel: txnChannel,
        items: txnItems,
      });
      if (txnCompleteNow) {
        const result = await completeAdminTransaction(created.id);
        setIssuedResult(result);
        setNotice(
          result.channel === 'pre_order'
            ? `Transaksi selesai. Kode redeem: ${result.redeem_code}`
            : `Transaksi Market Day selesai. +${result.stamp_added} stamp ditambahkan langsung.`,
        );
      } else {
        setNotice(`Transaksi ${created.transaction_code} dicatat (belum diselesaikan).`);
      }
      await refreshAll(search);
    } catch (err) {
      setError(getApiError(err, 'Gagal menyimpan transaksi.'));
    } finally {
      setTxnSubmitting(false);
    }
  }

  async function handleCompleteTransaction(transactionId: number) {
    setActionBusy(true);
    setError('');
    setNotice('');
    setIssuedResult(null);
    try {
      const result = await completeAdminTransaction(transactionId);
      setIssuedResult(result);
      setNotice(
        result.channel === 'pre_order'
          ? `Transaksi selesai. Kode redeem: ${result.redeem_code}`
          : `Transaksi Market Day selesai. +${result.stamp_added} stamp ditambahkan.`,
      );
      await refreshAll(search);
    } catch (err) {
      setError(getApiError(err, 'Gagal menyelesaikan transaksi.'));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleQuickAdjust(customerId: number, delta: number, reason: string) {
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      await adjustCustomerStamps({ customer_id: customerId, stamp_delta: delta, description: reason });
      setNotice(`Saldo stamp diperbarui (${delta > 0 ? `+${delta}` : delta}).`);
      if (scanResult && scanResult.customer_id === customerId) {
        setScanResult({ ...scanResult, stamp_balance: scanResult.stamp_balance + delta });
      }
      await refreshAll(search);
    } catch (err) {
      setError(getApiError(err, 'Gagal menyesuaikan stamp.'));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRedeemReward(customerId: number) {
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await redeemCustomerReward(customerId);
      setNotice(`${res.message} Sisa stamp: ${res.stamp_balance}.`);
      if (scanResult && scanResult.customer_id === customerId) {
        setScanResult({ ...scanResult, stamp_balance: res.stamp_balance });
      }
      await refreshAll(search);
    } catch (err) {
      setError(getApiError(err, 'Gagal mencatat penukaran reward.'));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleQuickGenerateCode(event: FormEvent) {
    event.preventDefault();
    if (!genCustomerId) {
      setError('Pilih pelanggan terlebih dahulu.');
      return;
    }
    setGenSubmitting(true);
    setError('');
    setNotice('');
    setGenResult(null);
    try {
      const unitPrice = DEFAULT_PRICES[`${genProduct}|${genSize}`] ?? 15000;
      const created = await createAdminTransaction({
        customer_id: Number(genCustomerId),
        sales_channel: 'pre_order',
        items: [
          {
            product_name: genProduct,
            variant_size: genSize,
            quantity_paid: genStamps,
            quantity_free: 0,
            unit_price: unitPrice,
          },
        ],
      });
      const result = await completeAdminTransaction(created.id);
      setGenResult(result);
      setNotice(`Kode redeem berhasil dibuat: ${result.redeem_code}`);
      await refreshAll(search);
    } catch (err) {
      setError(getApiError(err, 'Gagal membuat kode redeem.'));
    } finally {
      setGenSubmitting(false);
    }
  }

  async function handleScanSubmit(event: FormEvent) {
    event.preventDefault();
    const token = extractCardToken(scanInput);
    if (!token) return;
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await scanLoyaltyCard(token);
      setScanResult(data);
    } catch (err) {
      setScanResult(null);
      setError(getApiError(err, 'Kartu tidak ditemukan untuk token tersebut.'));
    } finally {
      setActionBusy(false);
    }
  }

  const stats = [
    { label: 'Total Customers', value: summary?.customers ?? '—', icon: Users },
    { label: 'Transactions', value: summary?.transactions ?? '—', icon: ReceiptText },
    { label: 'Stamps Issued', value: summary?.stamps_issued ?? '—', icon: Stamp },
    { label: 'Rewards Redeemed', value: summary?.rewards_redeemed ?? '—', icon: Gift },
  ];

  const txnSubtotal = txnItems.reduce((sum, item) => sum + item.quantity_paid * item.unit_price, 0);

  return (
    <main className="admin-page container">
      <header className="admin-header">
        <div className="brand-lockup">
          <img className="brand-logo-img" src="/assets/branding/suki-logo.png" alt="SUKI logo" />
          <div>
            <span className="brand-name">SUKI<span>.</span></span>
            <p className="eyebrow">ADMIN DASHBOARD</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => void refreshAll(search)}
            aria-label="Refresh data"
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
          </button>
          <button type="button" className="icon-button" onClick={() => void handleLogout()} aria-label="Logout">
            <LogOut size={17} /> <span>Keluar</span>
          </button>
        </div>
      </header>

      <div className="admin-title-row">
        <div>
          <h1>Overview</h1>
          <p className="muted">Kelola pelanggan, transaksi, kode redeem, stamp, dan klaim reward SUKI.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}

      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="stat-card" key={label}>
            <Icon size={21} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <nav className="admin-tabs" aria-label="Menu Admin">
        <button
          type="button"
          className={`admin-tab ${tab === 'customers' ? 'is-active' : ''}`}
          onClick={() => setTab('customers')}
        >
          <Users size={15} /> Pelanggan ({customers.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'generate' ? 'is-active' : ''}`}
          onClick={() => setTab('generate')}
        >
          <Ticket size={15} /> Generate Kode Redeem
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'transactions' ? 'is-active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          <ReceiptText size={15} /> Transaksi ({transactions.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'scan' ? 'is-active' : ''}`}
          onClick={() => setTab('scan')}
        >
          <QrCode size={15} /> Scan &amp; Adjust Stamp
        </button>
      </nav>

      {tab === 'customers' && (
        <div className="admin-grid">
          <form className="admin-card" onSubmit={handleCreateCustomer}>
            <h2><UserPlus size={18} /> Tambah Pelanggan</h2>
            <p className="muted">Membuat profil pelanggan &amp; kartu loyalitas digital otomatis.</p>
            <label htmlFor="c-name">Nama Pelanggan *</label>
            <input
              id="c-name"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Contoh: Nadia"
              required
            />
            <label htmlFor="c-wa">Nomor WhatsApp *</label>
            <input
              id="c-wa"
              value={custWa}
              onChange={(e) => setCustWa(e.target.value)}
              placeholder="0812xxxxxxxx"
              required
            />
            <label htmlFor="c-email">Email (opsional)</label>
            <input
              id="c-email"
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="nama@email.com"
            />
            <label htmlFor="c-notes">Catatan (opsional)</label>
            <input
              id="c-notes"
              value={custNotes}
              onChange={(e) => setCustNotes(e.target.value)}
              placeholder="Pelanggan Pre-Order Batch 1"
            />
            <button type="submit" className="primary-button" disabled={custSubmitting}>
              {custSubmitting ? 'Menyimpan...' : 'SIMPAN PELANGGAN'}
            </button>
          </form>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Daftar Pelanggan</h2>
              <form className="admin-search-form" onSubmit={handleSearchSubmit}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau WA..."
                />
                <button type="submit" className="secondary-button-sm" aria-label="Cari">
                  <Search size={15} />
                </button>
              </form>
            </div>

            {customers.length === 0 ? (
              <p className="muted">Belum ada pelanggan terdaftar.</p>
            ) : (
              <div className="admin-list">
                {customers.map((customer) => {
                  const balance = customer.stamp_balance ?? 0;
                  const publicToken = customer.card?.public_token;
                  const cardUrl = publicToken ? `${appUrl}/card/${publicToken}` : '';
                  return (
                    <article className="admin-list-item" key={customer.id}>
                      <div className="admin-item-main">
                        <div className="admin-item-title">
                          <strong>{customer.name}</strong>
                          <span className="badge-code">{customer.card?.card_code ?? 'NO-CARD'}</span>
                          <span className={`badge-stamp ${balance >= 4 ? 'is-ready' : ''}`}>
                            {balance}/4 Stamp
                          </span>
                        </div>
                        <small className="muted">
                          {customer.whatsapp_number} · {customer.customer_code}
                        </small>
                      </div>

                      <div className="admin-item-actions">
                        {cardUrl && (
                          <>
                            <button
                              type="button"
                              className="mini-btn"
                              onClick={() => copyText(`url-${customer.id}`, cardUrl)}
                            >
                              {copiedKey === `url-${customer.id}` ? <Check size={13} /> : <Copy size={13} />}
                              {copiedKey === `url-${customer.id}` ? 'Disalin' : 'Salin Link'}
                            </button>
                            <a className="mini-btn" href={cardUrl} target="_blank" rel="noreferrer">
                              <ExternalLink size={13} /> Kartu
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          className="mini-btn"
                          disabled={actionBusy}
                          onClick={() => void handleQuickAdjust(customer.id, 1, 'Tambah cepat admin')}
                        >
                          +1 Stamp
                        </button>
                        <button
                          type="button"
                          className="mini-btn"
                          disabled={actionBusy || balance < 1}
                          onClick={() => void handleQuickAdjust(customer.id, -1, 'Koreksi cepat admin')}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="mini-btn is-accent"
                          disabled={actionBusy || balance < 4}
                          onClick={() => void handleRedeemReward(customer.id)}
                        >
                          <Gift size={13} /> Tukar Bonus
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'generate' && (
        <div className="admin-grid">
          <form className="admin-card" onSubmit={handleQuickGenerateCode}>
            <h2><Ticket size={18} /> Generate Kode Redeem</h2>
            <p className="muted">
              Buat kode redeem <code>SUKI-XXXX-XXXX</code> yang langsung terikat ke pelanggan terpilih (otomatis mencatat transaksi Pre-Order selesai).
            </p>

            <label htmlFor="g-customer">Pilih Pelanggan *</label>
            <select
              id="g-customer"
              className="admin-select"
              value={genCustomerId}
              onChange={(e) => setGenCustomerId(e.target.value)}
              required
            >
              <option value="">-- Pilih pelanggan --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.whatsapp_number})
                </option>
              ))}
            </select>

            <div className="gen-product-row">
              <div>
                <label htmlFor="g-product">Produk</label>
                <select
                  id="g-product"
                  className="admin-select"
                  value={genProduct}
                  onChange={(e) => setGenProduct(e.target.value as 'Mango Juice' | 'Mango Smoothies')}
                >
                  <option value="Mango Juice">Mango Juice</option>
                  <option value="Mango Smoothies">Mango Smoothies</option>
                </select>
              </div>
              <div>
                <label htmlFor="g-size">Ukuran</label>
                <select
                  id="g-size"
                  className="admin-select"
                  value={genSize}
                  onChange={(e) => setGenSize(e.target.value as '16 oz' | '18 oz')}
                >
                  <option value="16 oz">16 oz</option>
                  <option value="18 oz">18 oz</option>
                </select>
              </div>
            </div>

            <label htmlFor="g-stamps">Jumlah Stamp / Cup Berbayar *</label>
            <div className="gen-stamp-pills">
              {[1, 2, 3, 4].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  className={`mini-btn ${genStamps === qty ? 'is-accent' : ''}`}
                  onClick={() => setGenStamps(qty)}
                >
                  {qty} Stamp
                </button>
              ))}
            </div>
            <input
              id="g-stamps"
              type="number"
              min={1}
              max={20}
              value={genStamps}
              onChange={(e) => setGenStamps(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              required
            />

            <button type="submit" className="primary-button" disabled={genSubmitting || customers.length === 0}>
              {genSubmitting ? 'Membuat Kode...' : `GENERATE KODE (${genStamps} STAMP)`}
            </button>
          </form>

          <section className="admin-card">
            <h2>Hasil &amp; Status Kode Redeem</h2>
            {genResult?.redeem_code ? (
              <div className="issued-code-box">
                <span className="eyebrow">KODE REDEEM BARU ({genResult.stamp_quantity} STAMP)</span>
                <strong className="issued-code-value">{genResult.redeem_code}</strong>
                <div className="issued-code-actions">
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => copyText('gen-code', genResult.redeem_code ?? '')}
                  >
                    {copiedKey === 'gen-code' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === 'gen-code' ? 'Disalin' : 'Salin Kode'}
                  </button>
                  {genResult.customer_whatsapp && (
                    <a
                      className="mini-btn is-wa"
                      href={`https://wa.me/${formatWaNumber(genResult.customer_whatsapp)}?text=${encodeURIComponent(
                        `Halo sobat SUKI! Pesananmu sudah selesai. Klaim ${genResult.stamp_quantity} stamp kamu dengan kode redeem: *${genResult.redeem_code}* di ${appUrl}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={13} /> Kirim ke WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="muted">
                Pilih pelanggan dan jumlah stamp di sebelah kiri lalu klik <b>GENERATE KODE</b> untuk membuat kode baru.
              </p>
            )}

            <h3 className="admin-subheading">Riwayat Kode Redeem Terbaru</h3>
            {transactions.filter((t) => t.redeem_code).length === 0 ? (
              <p className="muted">Belum ada kode redeem yang diterbitkan.</p>
            ) : (
              <div className="admin-list">
                {transactions
                  .filter((t) => t.redeem_code)
                  .slice(0, 8)
                  .map((txn) => (
                    <article className="admin-list-item" key={txn.id}>
                      <div className="admin-item-title">
                        <strong>{txn.customer?.name ?? `Customer #${txn.customer_id}`}</strong>
                        <span className="badge-code">{txn.redeem_code?.stamp_quantity} Stamp</span>
                        <span className={`badge-stamp ${txn.redeem_code?.status === 'redeemed' ? 'is-ready' : ''}`}>
                          {txn.redeem_code?.status}
                        </span>
                      </div>
                      <small className="muted">
                        Transaksi {txn.transaction_code} · Rp {txn.total_amount.toLocaleString('id-ID')}
                      </small>
                    </article>
                  ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="admin-grid">
          <form className="admin-card" onSubmit={handleCreateTransaction}>
            <h2><ReceiptText size={18} /> Catat Transaksi</h2>
            <p className="muted">
              Channel <b>Pre-Order</b> menghasilkan kode <code>SUKI-XXXX-XXXX</code>; <b>Market Day</b> langsung menambah stamp.
            </p>

            <label htmlFor="t-customer">Pelanggan *</label>
            <select
              id="t-customer"
              className="admin-select"
              value={txnCustomerId}
              onChange={(e) => setTxnCustomerId(e.target.value)}
              required
            >
              <option value="">-- Pilih pelanggan --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.whatsapp_number})
                </option>
              ))}
            </select>

            <label htmlFor="t-channel">Channel Penjualan *</label>
            <select
              id="t-channel"
              className="admin-select"
              value={txnChannel}
              onChange={(e) => setTxnChannel(e.target.value as 'pre_order' | 'market_day')}
            >
              <option value="pre_order">Pre-Order (Open Batch) → Kode Redeem</option>
              <option value="market_day">Market Day → Stamp Langsung</option>
            </select>

            <div className="txn-items-head">
              <label>Item Pesanan</label>
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  setTxnItems((prev) => [
                    ...prev,
                    { product_name: 'Mango Juice', variant_size: '16 oz', quantity_paid: 1, quantity_free: 0, unit_price: 15000 },
                  ])
                }
              >
                <Plus size={13} /> Tambah Item
              </button>
            </div>

            {txnItems.map((item, idx) => (
              <div className="txn-item-row" key={idx}>
                <select
                  className="admin-select"
                  value={item.product_name}
                  onChange={(e) =>
                    updateTxnItem(idx, { product_name: e.target.value as 'Mango Juice' | 'Mango Smoothies' })
                  }
                >
                  <option value="Mango Juice">Mango Juice</option>
                  <option value="Mango Smoothies">Mango Smoothies</option>
                </select>
                <select
                  className="admin-select"
                  value={item.variant_size}
                  onChange={(e) => updateTxnItem(idx, { variant_size: e.target.value as '16 oz' | '18 oz' })}
                >
                  <option value="16 oz">16 oz</option>
                  <option value="18 oz">18 oz</option>
                </select>
                <div className="txn-nums">
                  <div>
                    <small>Bayar (Stamp)</small>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.quantity_paid}
                      onChange={(e) => updateTxnItem(idx, { quantity_paid: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <small>Gratis</small>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.quantity_free}
                      onChange={(e) => updateTxnItem(idx, { quantity_free: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <small>Harga Satuan</small>
                    <input
                      type="number"
                      min={0}
                      value={item.unit_price}
                      onChange={(e) => updateTxnItem(idx, { unit_price: Number(e.target.value) })}
                    />
                  </div>
                  {txnItems.length > 1 && (
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => setTxnItems((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Hapus item"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={txnCompleteNow}
                onChange={(e) => setTxnCompleteNow(e.target.checked)}
              />
              <span>Langsung selesaikan transaksi &amp; terbitkan kode/stamp</span>
            </label>

            <div className="txn-total-bar">
              <span>Estimasi Total Bayar</span>
              <strong>Rp {txnSubtotal.toLocaleString('id-ID')}</strong>
            </div>

            <button type="submit" className="primary-button" disabled={txnSubmitting}>
              {txnSubmitting ? 'Memproses...' : txnCompleteNow ? 'SIMPAN & SELESAIKAN' : 'SIMPAN TRANSAKSI'}
            </button>

            {issuedResult && issuedResult.redeem_code && (
              <div className="issued-code-box">
                <span className="eyebrow">KODE REDEEM SIAP DIKIRIM ({issuedResult.stamp_quantity} STAMP)</span>
                <strong className="issued-code-value">{issuedResult.redeem_code}</strong>
                <div className="issued-code-actions">
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => copyText('issued-code', issuedResult.redeem_code ?? '')}
                  >
                    {copiedKey === 'issued-code' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === 'issued-code' ? 'Disalin' : 'Salin Kode'}
                  </button>
                  {issuedResult.customer_whatsapp && (
                    <a
                      className="mini-btn is-wa"
                      href={`https://wa.me/${formatWaNumber(issuedResult.customer_whatsapp)}?text=${encodeURIComponent(
                        `Halo sobat SUKI! Pesananmu sudah selesai. Klaim ${issuedResult.stamp_quantity} stamp kamu dengan kode redeem: *${issuedResult.redeem_code}* di ${appUrl}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={13} /> Kirim ke WA
                    </a>
                  )}
                </div>
              </div>
            )}
          </form>

          <section className="admin-card">
            <h2>Riwayat Transaksi Terbaru</h2>
            {transactions.length === 0 ? (
              <p className="muted">Belum ada transaksi.</p>
            ) : (
              <div className="admin-list">
                {transactions.map((txn) => (
                  <article className="admin-list-item" key={txn.id}>
                    <div className="admin-item-main">
                      <div className="admin-item-title">
                        <strong>{txn.customer?.name ?? `Customer #${txn.customer_id}`}</strong>
                        <span className="badge-code">{txn.transaction_code}</span>
                        <span className={`badge-stamp ${txn.status === 'completed' ? 'is-ready' : ''}`}>
                          {txn.status === 'completed' ? 'Selesai' : 'Recorded'}
                        </span>
                      </div>
                      <small className="muted">
                        {txn.sales_channel === 'pre_order' ? 'Pre-Order' : 'Market Day'} · Rp{' '}
                        {txn.total_amount.toLocaleString('id-ID')}
                        {txn.redeem_code ? ` · Kode: ${txn.redeem_code.status} (${txn.redeem_code.stamp_quantity} stamp)` : ''}
                      </small>
                    </div>
                    {txn.status !== 'completed' && (
                      <div className="admin-item-actions">
                        <button
                          type="button"
                          className="mini-btn is-accent"
                          disabled={actionBusy}
                          onClick={() => void handleCompleteTransaction(txn.id)}
                        >
                          Selesaikan
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'scan' && (
        <div className="admin-grid">
          <form className="admin-card" onSubmit={handleScanSubmit}>
            <h2><QrCode size={18} /> Cek / Scan Kartu Pelanggan</h2>
            <p className="muted">Tempel URL kartu (`/card/...`) atau token kartu pelanggan hasil scan QR.</p>
            <label htmlFor="scan-token">Token atau URL Kartu</label>
            <input
              id="scan-token"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Contoh: lfOmZnUvYI atau http://.../card/lfOmZnUvYI"
              required
            />
            <button type="submit" className="primary-button" disabled={actionBusy}>
              {actionBusy ? 'Mencari...' : 'CEK KARTU PELANGGAN'}
            </button>
          </form>

          <section className="admin-card">
            <h2>Detail Kartu &amp; Penyesuaian Stamp</h2>
            {!scanResult ? (
              <p className="muted">Hasil scan kartu pelanggan akan muncul di sini.</p>
            ) : (
              <div className="scan-detail-box">
                <div className="admin-item-title">
                  <strong>{scanResult.customer_name}</strong>
                  <span className="badge-code">{scanResult.card_code}</span>
                  <span className={`badge-stamp ${scanResult.stamp_balance >= 4 ? 'is-ready' : ''}`}>
                    {scanResult.stamp_balance}/4 Stamp
                  </span>
                </div>
                <p className="muted">
                  {scanResult.whatsapp_number} · {scanResult.customer_code}
                </p>

                <div className="scan-adjust-grid">
                  <div>
                    <label htmlFor="adj-delta">Delta Stamp (-20 s/d 20)</label>
                    <input
                      id="adj-delta"
                      type="number"
                      min={-20}
                      max={20}
                      value={adjustDelta}
                      onChange={(e) => setAdjustDelta(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="adj-desc">Alasan Penyesuaian</label>
                    <input
                      id="adj-desc"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="issued-code-actions">
                  <button
                    type="button"
                    className="mini-btn"
                    disabled={actionBusy || adjustDelta === 0 || !adjustReason.trim()}
                    onClick={() => void handleQuickAdjust(scanResult.customer_id, adjustDelta, adjustReason.trim())}
                  >
                    Terapkan Stamp ({adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta})
                  </button>
                  <button
                    type="button"
                    className="mini-btn is-accent"
                    disabled={actionBusy || scanResult.stamp_balance < 4}
                    onClick={() => void handleRedeemReward(scanResult.customer_id)}
                  >
                    <Gift size={13} /> Catat Klaim Bonus (4 Stamp)
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
