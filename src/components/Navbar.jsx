import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, ShieldCheck, PlusSquare, Bell, Moon, Sun } from 'lucide-react';
import { getBookings } from '../utils/storage';

export default function Navbar() {
  const { role, login, isSecretary, isKelompokKerja } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('dk_theme') === 'dark');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dk_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dk_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (isSecretary) {
      const fetchPending = async () => {
        const data = await getBookings();
        setPendingCount(data.filter(b => b.status === 'PENDING').length);
      };
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [isSecretary, location.pathname]);

  const handleRoleChange = (e) => {
    const selected = e.target.value;
    login(selected);
    navigate('/');
  };

  const navLinkClass = (path) => 
    `btn ${location.pathname === path ? 'btn-primary' : 'btn-outline'}`;

  return (
    <nav style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', padding: '1rem 0' }}>
      <div className="container flex items-center justify-between">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'hsl(var(--color-primary))', color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Dashboard Peminjaman Ruangan</h1>
            <p className="text-xs text-muted">Direktorat Konservasi Energi</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 navbar-right">
          <div className="flex gap-2 desktop-only">
            <Link to="/" className={navLinkClass('/')}>
              Dashboard
            </Link>
            {isKelompokKerja && (
              <Link to="/booking" className={navLinkClass('/booking')}>
                <PlusSquare size={16} /> Buat Pengajuan
              </Link>
            )}
            {isSecretary && (
              <Link to="/secretary" className={navLinkClass('/secretary')}>
                <ShieldCheck size={16} /> Approval
              </Link>
            )}
          </div>

          <div className="desktop-only" style={{ width: '1px', height: '2rem', background: 'var(--border-light)' }}></div>

          <div className="flex items-center gap-2 navbar-right">
            {isSecretary ? (
              <div className="flex items-center gap-4">
                <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => navigate('/secretary')}>
                  <Bell size={20} />
                  {pendingCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-6px', right: '-6px', background: 'hsl(var(--color-danger))',
                      color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                <div style={{ width: '1px', height: '1.5rem', background: 'var(--border-light)' }} className="desktop-only"></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--color-primary))' }}>
                  <ShieldCheck size={18} />
                  <span className="text-sm font-semibold secretary-label">Admin Sekretaris</span>
                </div>
                <button 
                  onClick={() => { login('GUEST'); navigate('/'); }} 
                  className="btn btn-outline" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <User size={18} className="text-muted" />
                <select 
                  value={role} 
                  onChange={handleRoleChange}
                  className="form-control"
                  style={{ padding: '0.5rem', width: 'auto', fontWeight: '500' }}
                >
                  <option value="GUEST">Guest (Publik)</option>
                  <optgroup label="Kelompok Kerja">
                    <option value="DKA">Pokja DKA</option>
                    <option value="DKT">Pokja DKT</option>
                    <option value="DKP">Pokja DKP</option>
                    <option value="DKE">Pokja DKE</option>
                    <option value="DKK">Pokja DKK</option>
                  </optgroup>
                </select>
              </>
            )}
            
            <button 
              onClick={() => setIsDark(!isDark)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', marginLeft: '0.5rem' }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav" style={{ display: 'none' }}>
        <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Beranda</span>
        </Link>
        {isKelompokKerja && (
          <Link to="/booking" className={`mobile-nav-item ${location.pathname === '/booking' ? 'active' : ''}`}>
            <PlusSquare size={20} />
            <span>Pengajuan</span>
          </Link>
        )}
        {isSecretary && (
          <Link to="/secretary" className={`mobile-nav-item ${location.pathname === '/secretary' ? 'active' : ''}`}>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={20} />
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px', background: 'hsl(var(--color-danger))',
                  color: 'white', fontSize: '0.5rem', fontWeight: 'bold', width: '12px', height: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                }}>{pendingCount}</span>
              )}
            </div>
            <span>Approval</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
