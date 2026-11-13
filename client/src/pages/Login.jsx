import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

import { auth } from '../authentication/firebase';
import '../styles/auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/balance');
    } catch {
      setNotice('Email atau password salah. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setNotice('');

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/balance');
    } catch {
      setNotice('Login Google dibatalkan atau gagal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-eyebrow">Bakerman Balance</p>
        <h1 className="auth-title">Masuk</h1>
        <p className="auth-subtitle">
          Lihat sisa budget gula mingguan dan atur treat favoritmu.
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
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="auth-button" disabled={busy}>
            {busy ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <div className="auth-divider">atau</div>

        <button
          type="button"
          className="auth-google"
          onClick={handleGoogle}
          disabled={busy}
        >
          <FaGoogle aria-hidden="true" /> Masuk dengan Google
        </button>

        <p className="auth-switch">
          Belum punya akun? <Link to="/signup">Daftar</Link>
        </p>
      </section>
    </main>
  );
}
