import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../authentication/firebase';
import '../styles/auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');

    if (password !== confirmPassword) {
      setNotice('Password dan konfirmasi password tidak sama.');
      return;
    }

    if (password.length < 6) {
      setNotice('Password minimal 6 karakter.');
      return;
    }

    setBusy(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/balance');
    } catch (error) {
      setNotice(
        error.code === 'auth/email-already-in-use'
          ? 'Email ini sudah terdaftar. Coba masuk.'
          : 'Pendaftaran gagal. Coba lagi.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-eyebrow">Bakerman Balance</p>
        <h1 className="auth-title">Daftar</h1>
        <p className="auth-subtitle">
          Buat akun untuk menyimpan budget gula dan riwayat treat-mu.
        </p>

        {notice && (
          <p className="auth-alert" role="alert">
            {notice}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="auth-field">
            <span>Konfirmasi password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" className="auth-button" disabled={busy}>
            {busy ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="auth-switch">
          Sudah punya akun? <Link to="/signin">Masuk</Link>
        </p>
      </section>
    </main>
  );
}
