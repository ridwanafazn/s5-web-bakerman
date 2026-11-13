import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase2.css';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';

const PRESETS = [
  { key: 'santai', label: 'Santai', grams: 120, description: 'Lebih longgar' },
  { key: 'seimbang', label: 'Seimbang', grams: 90, description: 'Rekomendasi' },
  { key: 'ketat', label: 'Ketat', grams: 60, description: 'Lebih disiplin' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

function formatWeekLabel(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

function formatWeekRange(week) {
  if (!week) return '—';
  return `${formatWeekLabel(week.weekStart)} – ${formatWeekLabel(week.weekEnd)}`;
}

function jakartaToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
}

function currentWeekRange() {
  const today = jakartaToday();
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const monday = new Date(
    date.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10);

  return { min: monday, max: today };
}

function formatActivityDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export default function Balance() {
  const { profile, budget, status, error, updateProfile, syncSession, refresh } =
    useSession();

  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [strava, setStrava] = useState(null);
  const [stravaStatus, setStravaStatus] = useState('idle');
  const [stravaError, setStravaError] = useState('');
  const [stravaNotice, setStravaNotice] = useState('');
  const [stravaBusy, setStravaBusy] = useState('');
  const [recap, setRecap] = useState(null);
  const [recapStatus, setRecapStatus] = useState('idle');
  const [recapError, setRecapError] = useState('');
  const [manual, setManual] = useState(null);
  const [manualStatus, setManualStatus] = useState('idle');
  const [manualError, setManualError] = useState('');
  const [manualNotice, setManualNotice] = useState('');
  const [manualBusy, setManualBusy] = useState(false);
  const [deletingManualId, setDeletingManualId] = useState('');
  const [manualDate, setManualDate] = useState(jakartaToday());
  const [manualType, setManualType] = useState('Run');
  const [manualMinutes, setManualMinutes] = useState('45');
  const [manualNote, setManualNote] = useState('');
  const [manualFile, setManualFile] = useState(null);
  const [manualPreview, setManualPreview] = useState('');
  const manualFileRef = useRef(null);

  const manualRange = useMemo(
    () =>
      manual
        ? { min: manual.minDate, max: manual.maxDate }
        : currentWeekRange(),
    [manual]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('strava');

    if (result === 'connected') {
      setStravaNotice('Strava berhasil terhubung.');
    } else if (result === 'error') {
      setStravaNotice(
        `Gagal menghubungkan Strava: ${params.get('message') || 'unknown'}`
      );
    }

    if (result) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadStrava = useCallback(async () => {
    if (!profile) return;

    setStravaStatus('loading');
    setStravaError('');

    try {
      const { data } = await api.get('/v1/strava/status');
      setStrava(data);
      setStravaStatus('ready');
    } catch (requestError) {
      setStravaError(requestError.friendlyMessage || 'Gagal memuat status Strava');
      setStravaStatus('error');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadStrava();
  }, [profile, loadStrava]);

  const loadRecap = useCallback(async () => {
    if (!profile) return;

    setRecapStatus('loading');
    setRecapError('');

    try {
      const { data } = await api.get('/v1/me/recap', { params: { weeks: 4 } });
      setRecap(data);
      setRecapStatus('ready');
    } catch (requestError) {
      setRecapError(requestError.friendlyMessage || 'Gagal memuat rekap mingguan.');
      setRecapStatus('error');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadRecap();
  }, [profile, loadRecap]);

  const loadManual = useCallback(async () => {
    if (!profile) return;

    setManualStatus('loading');
    setManualError('');

    try {
      const { data } = await api.get('/v1/activities/manual');
      setManual(data);
      setManualStatus('ready');
      setManualDate((current) =>
        current < data.minDate || current > data.maxDate
          ? data.maxDate
          : current
      );
    } catch (requestError) {
      setManualError(
        requestError.friendlyMessage || 'Gagal memuat aktivitas manual.'
      );
      setManualStatus('error');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadManual();
  }, [profile, loadManual]);

  useEffect(() => {
    return () => {
      if (manualPreview) URL.revokeObjectURL(manualPreview);
    };
  }, [manualPreview]);

  const handlePreset = async (preset) => {
    setSaving(`preset-${preset}`);
    setMessage('');

    try {
      await updateProfile({ budgetPreset: preset });
      await loadRecap();
      setMessage('Preset budget diperbarui.');
    } catch (requestError) {
      setMessage(requestError.friendlyMessage || 'Gagal memperbarui budget.');
    } finally {
      setSaving('');
    }
  };

  const handleMode = async (mode) => {
    setSaving(`mode-${mode}`);
    setMessage('');

    try {
      await updateProfile({ budgetMode: mode });
      setMessage('Mode budget diperbarui.');
    } catch (requestError) {
      setMessage(requestError.friendlyMessage || 'Gagal memperbarui mode.');
    } finally {
      setSaving('');
    }
  };

  const handleConnectStrava = async () => {
    setStravaBusy('connect');
    setStravaError('');
    setStravaNotice('');

    try {
      const { data } = await api.get('/v1/strava/connect');
      if (data.url) window.location.href = data.url;
    } catch (requestError) {
      setStravaError(
        requestError.friendlyMessage ||
          'Strava belum dikonfigurasi. Gunakan simulasi di bawah.'
      );
    } finally {
      setStravaBusy('');
    }
  };

  const handleSyncStrava = async () => {
    setStravaBusy('sync');
    setStravaError('');
    setStravaNotice('');

    try {
      const { data } = await api.post('/v1/strava/sync');
      setStrava(data);
      await refresh();
      await loadRecap();
      setStravaNotice(`Sync selesai. ${data.imported ?? 0} aktivitas diproses.`);
    } catch (requestError) {
      setStravaError(requestError.friendlyMessage || 'Gagal sync Strava.');
    } finally {
      setStravaBusy('');
    }
  };

  const handleDemo = async () => {
    setStravaBusy('demo');
    setStravaError('');
    setStravaNotice('');

    try {
      const { data } = await api.post('/v1/strava/demo');
      setStrava(data);
      await refresh();
      await loadRecap();
      setStravaNotice('Aktivitas simulasi 45 menit ditambahkan.');
    } catch (requestError) {
      setStravaError(requestError.friendlyMessage || 'Gagal menambah simulasi.');
    } finally {
      setStravaBusy('');
    }
  };

  const handleResetDemo = async () => {
    setStravaBusy('reset');
    setStravaError('');
    setStravaNotice('');

    try {
      const { data } = await api.delete('/v1/strava/demo');
      setStrava(data);
      await refresh();
      await loadRecap();
      setStravaNotice('Simulasi aktivitas direset.');
    } catch (requestError) {
      setStravaError(requestError.friendlyMessage || 'Gagal reset simulasi.');
    } finally {
      setStravaBusy('');
    }
  };

  const handleDisconnectStrava = async () => {
    setStravaBusy('disconnect');
    setStravaError('');
    setStravaNotice('');

    try {
      const { data } = await api.delete('/v1/strava/disconnect');
      setStrava(data);
      await refresh();
      await loadRecap();
      setStravaNotice('Koneksi Strava diputuskan.');
    } catch (requestError) {
      setStravaError(requestError.friendlyMessage || 'Gagal memutus Strava.');
    } finally {
      setStravaBusy('');
    }
  };

  const handleManualFile = (event) => {
    const file = event.target.files?.[0] || null;
    setManualError('');
    setManualNotice('');

    if (!file) {
      setManualFile(null);
      setManualPreview('');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setManualError('Screenshot harus JPG, PNG, atau WebP.');
      setManualFile(null);
      setManualPreview('');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setManualError('Screenshot maksimal 5 MB.');
      setManualFile(null);
      setManualPreview('');
      event.target.value = '';
      return;
    }

    setManualFile(file);
    setManualPreview(URL.createObjectURL(file));
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setManualError('');
    setManualNotice('');

    if (!manual?.configured) {
      setManualError(
        'Upload bukti belum dikonfigurasi. Isi CLOUDINARY_* di server/.env.'
      );
      return;
    }

    if (!manualFile) {
      setManualError('Screenshot bukti aktivitas wajib diunggah.');
      return;
    }

    const minutes = Number(manualMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      setManualError('Durasi harus bilangan bulat 1–600 menit.');
      return;
    }

    setManualBusy(true);

    try {
      const formData = new FormData();
      formData.append('date', manualDate);
      formData.append('type', manualType);
      formData.append('minutes', String(minutes));
      formData.append('note', manualNote);
      formData.append('screenshot', manualFile);

      const { data } = await api.post('/v1/activities/manual', formData);

      setManualNotice(
        `Aktivitas ${data.activity.minutes} menit dicatat. Bonus aktivitas diperbarui.`
      );
      setManualMinutes('45');
      setManualNote('');
      setManualFile(null);
      setManualPreview('');
      if (manualFileRef.current) manualFileRef.current.value = '';

      await refresh();
      await Promise.all([loadRecap(), loadStrava(), loadManual()]);
    } catch (requestError) {
      const code = requestError.response?.data?.code;
      const fallback =
        code === 'CLOUDINARY_NOT_CONFIGURED'
          ? 'Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.'
          : code === 'SCREENSHOT_REQUIRED'
            ? 'Screenshot bukti aktivitas wajib diunggah.'
            : requestError.friendlyMessage || 'Gagal menyimpan aktivitas manual.';
      setManualError(fallback);
    } finally {
      setManualBusy(false);
    }
  };

  const handleManualDelete = async (activityId) => {
    setDeletingManualId(activityId);
    setManualError('');
    setManualNotice('');

    try {
      await api.delete(`/v1/activities/manual/${activityId}`);
      setManualNotice('Aktivitas manual dihapus. Bonus aktivitas diperbarui.');
      await refresh();
      await Promise.all([loadRecap(), loadStrava(), loadManual()]);
    } catch (requestError) {
      setManualError(
        requestError.friendlyMessage || 'Gagal menghapus aktivitas manual.'
      );
    } finally {
      setDeletingManualId('');
    }
  };

  if (status === 'loading') {
    return (
      <main className="catalog-page">
        <div className="catalog-state">Memuat budget…</div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="catalog-page">
        <div className="catalog-state catalog-state-error" role="alert">
          <h1>Gagal memuat budget</h1>
          <p>{error || 'Coba lagi beberapa saat.'}</p>
          <button type="button" className="catalog-cta" onClick={syncSession}>
            Coba lagi
          </button>
        </div>
      </main>
    );
  }

  if (!profile || !budget) {
    return (
      <main className="catalog-page">
        <div className="catalog-state">
          <h1>Masuk untuk mengatur budget</h1>
          <p>Budget gula mingguan dan bonus aktivitas tersimpan di akunmu.</p>
          <Link className="catalog-cta" to="/signin">
            Masuk
          </Link>
        </div>
      </main>
    );
  }

  const total = budget.totalGrams || 0;
  const consumed = budget.consumedGrams || 0;
  const remaining = budget.remainingGrams || 0;
  const usedPercent = total > 0 ? Math.min(100, Math.max(0, (consumed / total) * 100)) : 0;

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="catalog-eyebrow">Bakerman Balance</p>
        <h1 className="catalog-title">Budget mingguanmu</h1>
        <p className="catalog-subtitle">
          {formatDate(budget.weekStart)} – {formatDate(budget.weekEnd)} ·{' '}
          {profile.email}
        </p>
      </header>

      {error && (
        <div className="catalog-state catalog-state-error" role="alert">
          <p>{error}</p>
          <button type="button" className="catalog-cta" onClick={syncSession}>
            Coba lagi
          </button>
        </div>
      )}

      <section className="balance-grid">
        <div className="balance-card balance-summary">
          <p className="balance-label">Sisa budget</p>
          <p className={`balance-big${remaining < 0 ? ' is-over' : ''}`}>
            {remaining} g
          </p>
          <p className="balance-muted">
            {consumed} g terpakai dari {total} g
          </p>

          <div
            className="budget-bar-track balance-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax={total}
            aria-valuenow={Math.min(consumed, total)}
            aria-label="Pemakaian budget"
          >
            <div className="budget-bar-fill" style={{ width: `${usedPercent}%` }} />
          </div>

          {remaining < 0 && (
            <p className="balance-warning">
              Kamu melewati budget {Math.abs(remaining)} g minggu ini.
            </p>
          )}

          <Link to="/menu" className="catalog-cta balance-menu-link">
            Pilih menu
          </Link>
        </div>

        <div className="balance-card">
          <h2>Preset budget</h2>
          <p className="balance-muted">
            Budget hanya menghitung gula dari produk Bakerman, bukan total diet.
          </p>

          <div className="balance-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`balance-preset${
                  profile.budgetPreset === preset.key ? ' is-active' : ''
                }`}
                onClick={() => handlePreset(preset.key)}
                disabled={Boolean(saving)}
              >
                <strong>{preset.label}</strong>
                <span>{preset.grams} g/minggu</span>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>

          <h2 className="balance-subheading">Mode budget</h2>
          <div className="balance-modes">
            <button
              type="button"
              className={`balance-mode${profile.budgetMode === 'guide' ? ' is-active' : ''}`}
              onClick={() => handleMode('guide')}
              disabled={Boolean(saving)}
            >
              <strong>Guide</strong>
              <span>Boleh lewat budget, dengan konfirmasi dan catatan overage.</span>
            </button>
            <button
              type="button"
              className={`balance-mode${profile.budgetMode === 'strict' ? ' is-active' : ''}`}
              onClick={() => handleMode('strict')}
              disabled={Boolean(saving)}
            >
              <strong>Strict</strong>
              <span>Order di atas budget akan ditolak server.</span>
            </button>
          </div>

          {message && (
            <p className="balance-message" role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>

        <div className="balance-card balance-strava">
          <div className="balance-strava-head">
            <div>
              <h2>Bonus aktivitas</h2>
              <p className="balance-muted">
                Hubungkan Strava; menit aktif menambah budget gula mingguan.
              </p>
            </div>
            {strava?.connected && (
              <span className="balance-connected">
                Terhubung{strava.athleteName ? ` · ${strava.athleteName}` : ''}
              </span>
            )}
          </div>

          {stravaStatus === 'loading' && (
            <p className="balance-muted">Memuat status Strava…</p>
          )}

          {stravaStatus === 'error' && (
            <p className="balance-warning">
              {stravaError}{' '}
              <button type="button" className="balance-inline-button" onClick={loadStrava}>
                Coba lagi
              </button>
            </p>
          )}

          {strava && (
            <>
              <div className="balance-strava-stats">
                <div>
                  <span>Menit aktif</span>
                  <strong>{strava.minutes} menit</strong>
                </div>
                <div>
                  <span>Bonus didapat</span>
                  <strong>+{strava.bonusGrams} g</strong>
                </div>
                <div>
                  <span>Aktivitas</span>
                  <strong>{strava.activities}</strong>
                </div>
              </div>

              {(strava.stravaMinutes > 0 || strava.manualMinutes > 0) && (
                <p className="balance-muted balance-activity-breakdown">
                  Strava {strava.stravaMinutes || 0} menit · Manual{' '}
                  {strava.manualMinutes || 0} menit
                </p>
              )}

              <div className="balance-tiers" aria-label="Tier bonus aktivitas">
                {strava.tiers.map((tier) => (
                  <span
                    key={tier.minMinutes}
                    className={strava.minutes >= tier.minMinutes ? 'is-reached' : ''}
                  >
                    {tier.minMinutes}+ mnt · +{tier.bonusGrams} g
                  </span>
                ))}
              </div>

              {strava.connected ? (
                <div className="balance-strava-actions">
                  <button
                    type="button"
                    className="catalog-cta"
                    onClick={handleSyncStrava}
                    disabled={Boolean(stravaBusy)}
                  >
                    {stravaBusy === 'sync' ? 'Sync…' : 'Sync sekarang'}
                  </button>
                  <button
                    type="button"
                    className="balance-secondary"
                    onClick={handleDisconnectStrava}
                    disabled={Boolean(stravaBusy)}
                  >
                    Putuskan
                  </button>
                </div>
              ) : strava.configured ? (
                <button
                  type="button"
                  className="catalog-cta"
                  onClick={handleConnectStrava}
                  disabled={Boolean(stravaBusy)}
                >
                  {stravaBusy === 'connect' ? 'Mengalihkan…' : 'Hubungkan Strava'}
                </button>
              ) : (
                <p className="balance-muted">
                  {strava.demoMode
                    ? 'OAuth Strava belum dikonfigurasi. Isi STRAVA_CLIENT_ID dan STRAVA_CLIENT_SECRET di server/.env untuk mengaktifkan tombol hubungkan.'
                    : 'Strava belum tersedia di lingkungan ini.'}
                </p>
              )}

              {strava.demoMode && (
                <div className="balance-demo">
                  <p className="balance-muted">
                    Mode simulasi aktif (dev). Tambah aktivitas 45 menit untuk
                    melihat bonus tanpa Strava app.
                  </p>
                  <div className="balance-strava-actions">
                    <button
                      type="button"
                      className="catalog-cta"
                      onClick={handleDemo}
                      disabled={Boolean(stravaBusy)}
                    >
                      {stravaBusy === 'demo' ? 'Menambah…' : 'Simulasi 45 menit'}
                    </button>
                    {strava.demoActivities > 0 && (
                      <button
                        type="button"
                        className="balance-secondary"
                        onClick={handleResetDemo}
                        disabled={Boolean(stravaBusy)}
                      >
                        {stravaBusy === 'reset' ? 'Reset…' : 'Reset simulasi'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {strava.lastSyncAt && (
                <p className="balance-muted">
                  Sync terakhir: {formatDateTime(strava.lastSyncAt)}
                </p>
              )}
            </>
          )}

          {stravaError && strava && (
            <p className="balance-warning" role="alert">
              {stravaError}
            </p>
          )}
          {stravaNotice && (
            <p className="balance-message" role="status" aria-live="polite">
              {stravaNotice}
            </p>
          )}
        </div>
      </section>

      <section
        className="manual-activity-section"
        aria-labelledby="manual-activity-title"
      >
        <div className="manual-activity-head">
          <div>
            <p className="catalog-eyebrow">Tanpa Strava</p>
            <h2 id="manual-activity-title">Catat aktivitas manual</h2>
            <p className="balance-muted">
              Upload screenshot bukti aktivitas. Bonus dihitung dengan tier yang
              sama; screenshot otomatis dihapus setelah{' '}
              {manual?.retentionDays || 7} hari, sedangkan catatan aktivitas
              tetap tersimpan.
            </p>
          </div>
          {manual?.mock && (
            <span className="manual-badge">Mode simulasi bukti (dev)</span>
          )}
        </div>

        {manualStatus === 'loading' && !manual && (
          <p className="balance-muted" role="status">
            Memuat aktivitas manual…
          </p>
        )}

        {manualStatus === 'error' && (
          <p className="balance-warning" role="alert">
            {manualError}{' '}
            <button
              type="button"
              className="balance-inline-button"
              onClick={loadManual}
            >
              Coba lagi
            </button>
          </p>
        )}

        {manual && (
          <div className="manual-activity-layout">
            <form className="manual-activity-form" onSubmit={handleManualSubmit}>
              {!manual.configured && (
                <p className="manual-warning">
                  Cloudinary belum dikonfigurasi. Isi{' '}
                  <code>CLOUDINARY_CLOUD_NAME</code>,{' '}
                  <code>CLOUDINARY_API_KEY</code>, dan{' '}
                  <code>CLOUDINARY_API_SECRET</code> di <code>server/.env</code>{' '}
                  untuk mengaktifkan upload bukti.
                </p>
              )}

              <div className="manual-fields">
                <label>
                  <span>Tanggal</span>
                  <input
                    type="date"
                    min={manualRange.min}
                    max={manualRange.max}
                    value={manualDate}
                    onChange={(event) => setManualDate(event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Jenis</span>
                  <select
                    value={manualType}
                    onChange={(event) => setManualType(event.target.value)}
                  >
                    {manual.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Durasi (menit)</span>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={manualMinutes}
                    onChange={(event) => setManualMinutes(event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="manual-note">
                <span>Catatan (opsional)</span>
                <textarea
                  value={manualNote}
                  onChange={(event) => setManualNote(event.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder="Contoh: lari pagi 5K di Dago."
                />
              </label>

              <label className="manual-file">
                <span>Screenshot bukti</span>
                <input
                  ref={manualFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleManualFile}
                  required
                />
              </label>

              {manualPreview && (
                <img
                  className="manual-preview"
                  src={manualPreview}
                  alt="Pratinjau screenshot bukti"
                />
              )}

              <p className="manual-hint">
                Wajib screenshot JPG/PNG/WebP maksimal 5 MB. Bukti dihapus
                otomatis dari Cloudinary setelah {manual.retentionDays} hari.
                Catatan aktivitas tetap tersimpan untuk bonus.
              </p>

              {manualError && (
                <p className="manual-warning" role="alert">
                  {manualError}
                </p>
              )}
              {manualNotice && (
                <p className="manual-success" role="status" aria-live="polite">
                  {manualNotice}
                </p>
              )}

              <button
                type="submit"
                className="catalog-cta manual-submit"
                disabled={manualBusy || !manual.configured}
              >
                {manualBusy ? 'Mengunggah…' : 'Kirim aktivitas'}
              </button>
            </form>

            <div className="manual-list">
              <div className="manual-list-head">
                <h3>Aktivitas minggu ini</h3>
                <span>
                  {manual.minutes} menit · +{manual.bonusGrams} g
                </span>
              </div>

              {manual.activities.length === 0 ? (
                <p className="balance-muted">
                  Belum ada aktivitas manual minggu ini.
                </p>
              ) : (
                <ul className="manual-items">
                  {manual.activities.map((activity) => (
                    <li className="manual-item" key={activity.id}>
                      <div>
                        <strong>
                          {activity.type} · {activity.minutes} menit
                        </strong>
                        <span>{formatActivityDate(activity.date)}</span>
                        {activity.note && <p>{activity.note}</p>}
                        <small>
                          {activity.screenshotUrl ? (
                            <a
                              href={activity.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Lihat bukti
                            </a>
                          ) : activity.screenshotExpired ? (
                            'Bukti sudah dihapus'
                          ) : activity.screenshotMock ? (
                            'Bukti simulasi (dev)'
                          ) : (
                            'Bukti tidak tersedia'
                          )}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="manual-delete"
                        onClick={() => handleManualDelete(activity.id)}
                        disabled={Boolean(deletingManualId)}
                      >
                        {deletingManualId === activity.id
                          ? 'Menghapus…'
                          : 'Hapus'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="recap-section" aria-labelledby="recap-title">
        <div className="recap-head">
          <div>
            <p className="catalog-eyebrow">Rekap mingguan</p>
            <h2 id="recap-title">Empat minggu terakhir</h2>
            <p className="balance-muted">
              Gula, order, dan menit aktif dalam satu tampilan. Data dihitung
              dari budget mingguan serta order yang tidak dibatalkan.
            </p>
          </div>
          <button
            type="button"
            className="balance-secondary"
            onClick={loadRecap}
            disabled={recapStatus === 'loading'}
          >
            {recapStatus === 'loading' ? 'Memuat…' : 'Refresh rekap'}
          </button>
        </div>

        {recapStatus === 'loading' && !recap && (
          <p className="balance-muted" role="status">
            Memuat rekap mingguan…
          </p>
        )}

        {recapStatus === 'error' && (
          <p className="balance-warning" role="alert">
            {recapError}{' '}
            <button type="button" className="balance-inline-button" onClick={loadRecap}>
              Coba lagi
            </button>
          </p>
        )}

        {recap && (
          <>
            <div className="recap-summary">
              <div>
                <span>Order aktif</span>
                <strong>{recap.summary.totalOrders}</strong>
              </div>
              <div>
                <span>Selesai</span>
                <strong>{recap.summary.completedOrders}</strong>
              </div>
              <div>
                <span>Menit aktif</span>
                <strong>{recap.summary.totalActiveMinutes}</strong>
              </div>
              <div>
                <span>Minggu on-budget</span>
                <strong>
                  {recap.summary.onBudgetWeeks}/{recap.summary.weeksWithData}
                </strong>
              </div>
            </div>

            <ul className="recap-chart" aria-label="Pemakaian gula per minggu">
              {recap.weeks.map((week) => {
                const percent =
                  week.totalGrams > 0
                    ? Math.min(
                        100,
                        Math.round((week.consumedGrams / week.totalGrams) * 100)
                      )
                    : 0;
                const overBudget =
                  week.totalGrams > 0 && week.consumedGrams > week.totalGrams;

                return (
                  <li
                    key={week.weekStart}
                    className={`recap-bar-item${week.hasData ? '' : ' is-empty'}`}
                  >
                    <div className="recap-bar-track" aria-hidden="true">
                      <div
                        className={`recap-bar-fill${overBudget ? ' is-over' : ''}`}
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <strong>{week.hasData ? `${week.consumedGrams} g` : '—'}</strong>
                    <span>{formatWeekLabel(week.weekStart)}</span>
                    <small>
                      {week.hasData ? `dari ${week.totalGrams} g` : 'belum ada data'}
                    </small>
                  </li>
                );
              })}
            </ul>

            <div className="recap-weeks">
              {recap.weeks.map((week, index) => (
                <article
                  className={`recap-week${week.hasData ? '' : ' is-empty'}`}
                  key={week.weekStart}
                >
                  <div className="recap-week-head">
                    <strong>{formatWeekRange(week)}</strong>
                    {index === recap.weeks.length - 1 && (
                      <span className="recap-current">Minggu ini</span>
                    )}
                  </div>

                  {week.hasData ? (
                    <>
                      <p>
                        {week.consumedGrams} g terpakai · sisa{' '}
                        {week.remainingGrams} g
                      </p>
                      <p className="balance-muted">
                        {week.orders.total} order aktif · {week.orders.completed}{' '}
                        selesai · {week.activity.minutes} menit aktif · bonus +
                        {week.bonusGrams} g
                      </p>
                      {week.topProducts.length > 0 && (
                        <p className="balance-muted">
                          Top produk:{' '}
                          {week.topProducts
                            .map((product) => `${product.name} ×${product.qty}`)
                            .join(', ')}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="balance-muted">
                      Belum ada catatan budget atau order minggu ini.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
