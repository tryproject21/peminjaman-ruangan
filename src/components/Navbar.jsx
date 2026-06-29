import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, ShieldCheck, PlusSquare } from 'lucide-react';

export default function Navbar() {
  const { role, login, isSecretary, isKelompokKerja } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
            <h1 className="text-sm font-semibold">DK-Rooms</h1>
            <p className="text-xs text-muted">Konservasi Energi</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
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

          <div style={{ width: '1px', height: '2rem', background: 'var(--border-light)' }}></div>

          <div className="flex items-center gap-2">
            {isSecretary ? (
              <div className="flex items-center gap-3">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--color-primary))' }}>
                  <ShieldCheck size={18} />
                  <span className="text-sm font-semibold">Admin Sekretaris</span>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
