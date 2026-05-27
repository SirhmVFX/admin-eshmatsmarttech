'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AdminProfile, ALL_PERMISSIONS } from './roles';

type AuthCtx = {
  user: User | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    const ref = doc(db, 'admins', u.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setAdminProfile({ id: snap.id, ...snap.data() } as AdminProfile);
    } else {
      // First user ever — auto-create as super_admin
      const profile: AdminProfile = {
        uid: u.uid,
        email: u.email ?? '',
        displayName: u.displayName ?? u.email ?? 'Super Admin',
        role: 'super_admin',
        permissions: ALL_PERMISSIONS,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(ref, profile);
      setAdminProfile({ id: u.uid, ...profile });
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setAdminProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <Ctx.Provider value={{
      user,
      adminProfile,
      loading,
      signIn: async (e, p) => { await signInWithEmailAndPassword(auth, e, p); },
      logOut: async () => { await signOut(auth); setAdminProfile(null); },
      refreshProfile,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
