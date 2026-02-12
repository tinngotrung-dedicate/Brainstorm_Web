'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  ready: false,
  login: () => {},
  logout: () => {},
  isAdmin: false
});

export const useAuth = () => useContext(AuthContext);

export default function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Lazy load auth state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('brainstorm_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (error) {
      // ignore parse errors
    } finally {
      setReady(true);
    }
  }, []);

  const login = (payload) => {
    const nextUser = {
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'Người dùng',
      role: 'user'
    };
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brainstorm_user', JSON.stringify(nextUser));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brainstorm_user');
    }
  };

  // Reveal animations (keep existing behavior)
  useEffect(() => {
    const sections = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      logout,
      isAdmin: false
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
