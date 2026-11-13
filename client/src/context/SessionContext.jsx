/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../authentication/firebase';
import api from '../lib/api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [budget, setBudget] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return unsubscribe;
  }, []);

  const syncSession = useCallback(async () => {
    if (!auth.currentUser) return null;

    setStatus('loading');
    setError('');

    try {
      const { data } = await api.post('/v1/auth/session');
      setProfile(data.user);
      setBudget(data.budget);
      setStatus('ready');
      return data;
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Gagal memuat sesi');
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (firebaseUser === undefined) return;

    if (!firebaseUser) {
      setProfile(null);
      setBudget(null);
      setError('');
      setStatus('anonymous');
      return;
    }

    syncSession();
  }, [firebaseUser, syncSession]);

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return null;

    const { data } = await api.get('/v1/me');
    setProfile(data.user);
    setBudget(data.budget);
    setStatus('ready');
    return data;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.patch('/v1/me', payload);
    setProfile(data.user);
    setBudget(data.budget);
    setStatus('ready');
    return data;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      budget,
      status,
      error,
      refresh,
      updateProfile,
      syncSession,
    }),
    [firebaseUser, profile, budget, status, error, refresh, updateProfile, syncSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession harus dipakai di dalam SessionProvider');
  }
  return context;
}
