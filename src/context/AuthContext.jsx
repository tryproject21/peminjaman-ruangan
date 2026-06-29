import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = ['GUEST', 'KELOMPOK_KERJA', 'SECRETARY'];

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('dk_role') || 'GUEST';
  });

  useEffect(() => {
    localStorage.setItem('dk_role', role);
  }, [role]);

  const login = (newRole) => setRole(newRole);
  const logout = () => setRole('GUEST');

  const isSecretary = role === 'SECRETARY';
  const isKelompokKerja = role === 'KELOMPOK_KERJA';

  return (
    <AuthContext.Provider value={{ role, login, logout, isSecretary, isKelompokKerja }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
