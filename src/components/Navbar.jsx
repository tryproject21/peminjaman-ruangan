import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearBookings } from '../utils/storage';
import { Calendar, User, ShieldCheck, PlusSquare, Trash2 } from 'lucide-react';

export default function Navbar() {
  const { role, login, isSecretary, isKelompokKerja } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (e) => {
    const selected = e.target.value;
    login(selected);
    navigate('/');
  };

  const handleResetData = () => {
    if (window.confirm("Yakin ingin menghapus semua data peminjaman ruangan?")) {
      clearBookings();
      window.location.reload();
    }
  };

  const navLinkClass = (path) => 
    `btn ${location.pathname === path ? 'btn-primary' : 'btn-outline'}`;

  const roleLabel = (r) => {
    if (r === 'SECRETARY') return 'Sekretaris';
    if (r === 'KELOMPOK_KERJA') return 'Kelompok Kerja';
    return 'Guest (Publik)';
  };

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
            <button 
              onClick={handleResetData}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.6rem', color: 'hsl(var(--color-danger))', borderColor: 'hsl(var(--color-danger-light))' }}
              title="Hapus Semua Data"
            >
              <Trash2 size={16} />
            </button>
            <User size={18} className="text-muted" />
            <select 
              value={role} 
              onChange={handleRoleChange}
              className="form-control"
              style={{ padding: '0.5rem', width: 'auto' }}
            >
              <option value="GUEST">Guest (Publik)</option>
              <option value="SECRETARY">Sekretaris</option>
              <option value="KELOMPOK_KERJA">Kelompok Kerja</option>
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}
