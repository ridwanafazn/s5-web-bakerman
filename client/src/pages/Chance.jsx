import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../authentication/firebase';
import '../styles/chance.css';

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
};

const getErrorMessage = (error) =>
  error.response?.data?.error || error.message || 'Terjadi kesalahan. Coba lagi.';

const Chance = () => {
  const [authUser, setAuthUser] = useState(undefined);
  const [user, setUser] = useState(null);
  const [buyHistory, setBuyHistory] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [stravaLink, setStravaLink] = useState('');
  const [purchaseCode, setPurchaseCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => setAuthUser(nextUser));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authUser === undefined) return undefined;

    if (!authUser) {
      setUser(null);
      setBuyHistory([]);
      setStatus('idle');
      return undefined;
    }

    let active = true;
    setStatus('loading');
    setError('');
    setNotice('');

    (async () => {
      try {
        const syncedUser = await axios.post('/api/user/sync', {
          email: authUser.email,
          name: authUser.displayName || '',
        });
        if (!active) return;

        setUser(syncedUser.data);
        setStravaLink(syncedUser.data.stravaLink || '');

        const history = await axios.get('/api/user/buy-history', {
          params: { email: authUser.email },
        });
        if (!active) return;

        setBuyHistory(Array.isArray(history.data) ? history.data : []);
        setStatus('ready');
      } catch (requestError) {
        if (!active) return;
        setError(getErrorMessage(requestError));
        setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [authUser]);

  const handleGenerateCode = async () => {
    if (!authUser || busy) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const { data } = await axios.post('/api/purchase/generate-code', {
        email: authUser.email,
        productList: 'Bakerman surprise box',
        price: 0,
      });
      setPurchaseCode(data.uniqueCode);
      setUser((current) =>
        current ? { ...current, chances: data.remainingChances } : current
      );
      setNotice('Kode pembelian dibuat. Tunjukkan kode ini di toko untuk menukarkannya.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const handleRedeem = async () => {
    if (!authUser || !purchaseCode || busy) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const { data } = await axios.post('/api/purchase/redeem-purchase', {
        purchaseCode,
        email: authUser.email,
      });
      setBuyHistory(Array.isArray(data.buyHistory) ? data.buyHistory : buyHistory);
      setPurchaseCode('');
      setNotice('Kode berhasil ditukar dan tercatat di riwayat pembelian.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(purchaseCode);
      setNotice('Kode disalin ke clipboard.');
    } catch {
      setNotice('Kode tidak bisa disalin otomatis. Salin manual ya.');
    }
  };

  const handleStravaSubmit = async (event) => {
    event.preventDefault();
    if (!authUser || busy) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const { data } = await axios.post('/api/user/strava-link', {
        email: authUser.email,
        link: stravaLink,
      });
      setUser(data.user);
      setNotice('Link Strava tersimpan.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="chance-page">
      <header className="chance-hero">
        <p className="chance-eyebrow">Bakerman Rewards</p>
        <h1 className="chance-title">
          {user?.name ? `Hello, ${user.name}` : 'Your weekly chances'}
        </h1>
        <p className="chance-subtitle">
          Kumpulkan kesempatan, tukarkan jadi kode pembelian, dan nikmati baked goods
          favoritmu.
        </p>
      </header>

      {authUser === undefined && (
        <div className="chance-card">
          <p className="chance-muted">Memeriksa sesi login…</p>
        </div>
      )}

      {authUser === null && (
        <div className="chance-card chance-login">
          <h2>Masuk untuk mulai</h2>
          <p className="chance-muted">
            Sisa kesempatan dan riwayat pembelianmu tersimpan di akun Bakerman.
          </p>
          <Link className="chance-button" to="/signin">
            Sign in
          </Link>
        </div>
      )}

      {authUser && status === 'loading' && (
        <div className="chance-card">
          <p className="chance-muted">Memuat data akun…</p>
        </div>
      )}

      {authUser && status === 'error' && (
        <div className="chance-card">
          <p className="chance-alert chance-alert-error" role="alert">
            {error}
          </p>
          <p className="chance-muted">
            Pastikan backend dan database berjalan, lalu muat ulang halaman ini.
          </p>
        </div>
      )}

      {authUser && status === 'ready' && user && (
        <>
          <div className="chance-stats">
            <div className="chance-card chance-stat">
              <span className="chance-stat-value">{user.chances}</span>
              <span className="chance-stat-label">sisa kesempatan</span>
            </div>
            <div className="chance-card chance-stat">
              <span className="chance-stat-value">{buyHistory.length}</span>
              <span className="chance-stat-label">pembelian tercatat</span>
            </div>
          </div>

          {error && (
            <p className="chance-alert chance-alert-error" role="alert">
              {error}
            </p>
          )}
          {notice && <p className="chance-alert chance-alert-success">{notice}</p>}

          <section className="chance-card">
            <h2>Tukar kesempatan</h2>
            <p className="chance-muted">
              Setiap kode memakai 1 kesempatan. Tunjukkan kode ke kasir untuk menukarkannya.
            </p>

            {purchaseCode ? (
              <div className="chance-code-box">
                <p className="chance-code-label">Kode pembelianmu</p>
                <p className="chance-code">{purchaseCode}</p>
                <div className="chance-actions">
                  <button type="button" className="chance-button" onClick={handleCopyCode}>
                    Copy code
                  </button>
                  <button
                    type="button"
                    className="chance-button chance-button-outline"
                    onClick={handleRedeem}
                    disabled={busy}
                  >
                    {busy ? 'Memproses…' : 'Redeem now'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="chance-button"
                onClick={handleGenerateCode}
                disabled={busy || user.chances < 1}
              >
                {busy ? 'Memproses…' : 'Generate purchase code'}
              </button>
            )}
          </section>

          <section className="chance-card">
            <h2>Strava</h2>
            <p className="chance-muted">
              Tempel link profil Strava-mu sebagai bukti aktivitas. Tim Bakerman akan
              memverifikasinya.
            </p>
            <form className="chance-form" onSubmit={handleStravaSubmit}>
              <input
                type="url"
                value={stravaLink}
                onChange={(event) => setStravaLink(event.target.value)}
                placeholder="https://www.strava.com/athletes/..."
                aria-label="Link profil Strava"
              />
              <button type="submit" className="chance-button" disabled={busy}>
                {busy ? 'Menyimpan…' : 'Save link'}
              </button>
            </form>
          </section>

          <section className="chance-card">
            <h2>Buy history</h2>
            {buyHistory.length === 0 ? (
              <p className="chance-muted">Belum ada pembelian tercatat.</p>
            ) : (
              <div className="chance-table-wrap">
                <table className="chance-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Product list</th>
                      <th>Price</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyHistory.map((item, index) => (
                      <tr key={`${item.productList}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{item.productList}</td>
                        <td>
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                          }).format(item.price || 0)}
                        </td>
                        <td>{formatDate(item.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default Chance;
