import React, { createContext, useState, useContext } from 'react';
import { useTheme } from './ThemeContext';
import { apiUrl } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { updateBrandSettings } = useTheme();
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('currentAdmin');
    return saved ? JSON.parse(saved) : null;
  });

  const userRegister = async (name, email, password) => {
    const res = await fetch(`${apiUrl('/api/auth/register')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    setUser(data.user);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    return data.user;
  };

  const userLogin = async (email, password) => {
    const res = await fetch(`${apiUrl('/api/auth/login')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    setUser(data.user);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    return data.user;
  };

  const adminRegister = async (brandData, brandLogoFile) => {
    const formData = new FormData();
    formData.append('email', brandData.email);
    formData.append('password', brandData.password);
    formData.append('brandName', brandData.brandName);
    formData.append('tagline', brandData.tagline || '');
    formData.append('description', brandData.description || '');
    formData.append('howToOrder', brandData.howToOrder || '');
    formData.append('contactInfo', JSON.stringify(brandData.contactInfo || {}));
    if (brandLogoFile) {
      formData.append('brandLogoFile', brandLogoFile);
    } else {
      formData.append('brandLogo', brandData.brandLogo || '');
    }

    const res = await fetch(`${apiUrl('/api/auth/admin/register')}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Admin setup failed');
    setAdmin(data.admin);
    localStorage.setItem('currentAdmin', JSON.stringify(data.admin));
    localStorage.setItem('token', data.token);
    updateBrandSettings(data.admin);
    return data.admin;
  };

  const adminLogin = async (email, password) => {
    const res = await fetch(`${apiUrl('/api/auth/admin/login')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Admin login failed');
    setAdmin(data.admin);
    localStorage.setItem('currentAdmin', JSON.stringify(data.admin));
    localStorage.setItem('token', data.token);
    updateBrandSettings(data.admin);
    return data.admin;
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, admin, userLogin, userRegister, adminLogin, adminRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
