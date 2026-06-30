import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROOMS, KELOMPOK_KERJA, addBooking, checkOverlap } from '../utils/storage';
import { Send, AlertCircle } from 'lucide-react';

export default function BookingForm() {
  const { role, isKelompokKerja } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    roomId: ROOMS[0].id,
    kelompokKerja: isKelompokKerja ? role : KELOMPOK_KERJA[0],
    pic: '',
    agenda: '',
    fileDraft: null
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isKelompokKerja) {
    return (
      <div className="container mt-8 animate-fade-in text-center">
        <AlertCircle size={48} style={{ color: 'hsl(var(--color-danger))', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Akses Ditolak</h2>
        <p className="text-muted">Hanya role <strong>Kelompok Kerja</strong> yang dapat mengajukan peminjaman ruangan.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Limit file size to 500KB for Supabase Base64 upload
      if (file.size > 500 * 1024) {
        alert('Maaf, ukuran file undangan terlalu besar. Maksimal 500KB.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({
          ...prev,
          fileDraft: file.name,
          fileData: evt.target.result, // base64 data URL
          fileType: file.type,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (formData.startTime >= formData.endTime) {
      setErrorMsg('Waktu selesai harus lebih besar dari waktu mulai.');
      setIsSubmitting(false);
      return;
    }

    const isOverlapping = await checkOverlap(formData.date, formData.startTime, formData.endTime, formData.roomId);
    if (isOverlapping) {
      setErrorMsg('Jadwal bentrok! Sudah ada peminjaman di ruangan dan waktu yang sama.');
      setIsSubmitting(false);
      return;
    }

    const room = ROOMS.find(r => r.id === formData.roomId);
    
    const result = await addBooking({
      ...formData,
      roomName: room.name,
    });
    
    if (result && result.error) {
      setErrorMsg(`Gagal: ${result.error.message || JSON.stringify(result.error)}`);
      setIsSubmitting(false);
      return;
    }
    
    if (!result) {
      setErrorMsg('Gagal mengirim ke database online. Pastikan ukuran file tidak terlalu besar (maks 500KB) dan koneksi internet stabil.');
      setIsSubmitting(false);
      return;
    }
    
    setSubmitted(true);
    setIsSubmitting(false);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="container mt-8 animate-fade-in text-center" style={{ maxWidth: '480px', margin: '2rem auto' }}>
        <div className="card" style={{ borderTop: '4px solid hsl(var(--color-success))' }}>
          <div style={{ width: '64px', height: '64px', background: 'hsl(var(--color-success-light))', color: 'hsl(var(--color-success))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Send size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pengajuan Berhasil!</h2>
          <p className="text-muted">Pengajuan peminjaman ruangan Anda telah dikirim dan menunggu persetujuan Sekretaris.</p>
          <p className="text-xs text-muted mt-4">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-8 animate-fade-in" style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Form Pengajuan Ruangan</h2>
          <p className="text-muted">Isi detail rapat untuk mengajukan peminjaman.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="card" style={{ background: 'hsl(var(--color-danger-light))', color: 'hsl(var(--color-danger))', padding: '1rem', border: 'none' }}>
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="font-semibold text-sm">{errorMsg}</span>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Kelompok Kerja (Pokja)</label>
            <select name="kelompokKerja" value={formData.kelompokKerja} onChange={handleChange} className="form-control" disabled={isKelompokKerja} required>
              {KELOMPOK_KERJA.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ruangan</label>
            <select name="roomId" value={formData.roomId} onChange={handleChange} className="form-control" required>
              {ROOMS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.875rem' }}>Agenda / Tentang Rapat</label>
              <input 
                type="text" 
                name="agenda" 
                value={formData.agenda} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Contoh: Rapat Evaluasi Bulanan"
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.875rem' }}>Nama PIC (Opsional)</label>
              <input 
                type="text" 
                name="pic" 
                value={formData.pic} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Contoh: Budi Santoso"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tanggal</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-control" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Waktu Mulai</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="form-control" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Waktu Selesai</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="form-control" required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Draft Undangan / Dokumen (Opsional)</label>
            <input type="file" onChange={handleFileChange} className="form-control" accept=".pdf,.doc,.docx,.jpg,.png" />
            {formData.fileDraft && <p className="text-xs mt-1" style={{ color: 'hsl(var(--color-success))' }}>File terpilih: {formData.fileDraft}</p>}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Batal</button>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
              <Send size={18} /> {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
