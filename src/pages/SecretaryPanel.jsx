import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBookings, updateBookingStatus, editBooking, checkOverlap, getConflicts, ROOMS, KELOMPOK_KERJA } from '../utils/storage';
import { CheckCircle, XCircle, AlertCircle, Clock, FileText, Pencil, X, Save, Users, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function SecretaryPanel() {
  const { isSecretary } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState('');

  const loadBookings = () => {
    const all = getBookings().sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setBookings(all);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  if (!isSecretary) {
    return (
      <div className="container mt-8 animate-fade-in text-center">
        <AlertCircle size={48} style={{ color: 'hsl(var(--color-danger))', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Akses Ditolak</h2>
        <p className="text-muted">Halaman ini khusus untuk Sekretaris Direktorat.</p>
      </div>
    );
  }

  const handleStatusUpdate = (id, newStatus) => {
    updateBookingStatus(id, newStatus);
    loadBookings();
  };

  const startEdit = (booking) => {
    setEditingId(booking.id);
    setEditError('');
    setEditData({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      roomId: booking.roomId,
      kelompokKerja: booking.kelompokKerja,
      agenda: booking.agenda || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setEditError('');
  };

  const saveEdit = (id) => {
    setEditError('');

    if (editData.startTime >= editData.endTime) {
      setEditError('Waktu selesai harus lebih besar dari waktu mulai.');
      return;
    }

    const isOverlapping = checkOverlap(editData.date, editData.startTime, editData.endTime, editData.roomId, id);
    if (isOverlapping) {
      setEditError('Jadwal bentrok dengan peminjaman lain di ruangan dan waktu yang sama.');
      return;
    }

    const room = ROOMS.find(r => r.id === editData.roomId);
    editBooking(id, {
      ...editData,
      roomName: room.name,
    });
    setEditingId(null);
    setEditData({});
    loadBookings();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const statusBadge = (status) => {
    if (status === 'PENDING') return 'badge-warning';
    if (status === 'APPROVED') return 'badge-success';
    return 'badge-danger';
  };

  const statusLabel = (status) => {
    if (status === 'PENDING') return 'Menunggu';
    if (status === 'APPROVED') return 'Disetujui';
    return 'Ditolak';
  };

  return (
    <div className="container mt-8 animate-fade-in" style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Panel Approval Sekretaris</h2>
        <p className="text-muted">Kelola dan edit pengajuan peminjaman ruangan rapat</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem', borderStyle: 'dashed' }}>
          <CheckCircle size={48} style={{ color: 'hsl(var(--color-success))', margin: '0 auto 1rem' }} />
          <h3 className="font-semibold" style={{ fontSize: '1.125rem' }}>Semua bersih!</h3>
          <p className="text-muted">Belum ada pengajuan peminjaman yang masuk.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bookings.map(b => {
            const isEditing = editingId === b.id;
            let conflicts = [];
            if (b.status === 'PENDING') {
              conflicts = getConflicts(b);
            }

            return (
              <div key={b.id} className="card" style={{ padding: '1.25rem', borderLeft: conflicts.length > 0 ? '4px solid hsl(var(--color-danger))' : '1px solid var(--border-light)' }}>

                {/* View Mode */}
                {!isEditing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Top Row: Status + Pokja + Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`badge ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span>
                        <span className="text-sm text-muted"><Users size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {b.kelompokKerja}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {b.status === 'APPROVED' && (
                          <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => startEdit(b)}>
                            <Pencil size={14} /> Edit
                          </button>
                        )}
                        {b.status === 'PENDING' && (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'hsl(var(--color-danger))', borderColor: 'hsl(var(--color-danger-light))' }}
                              onClick={() => handleStatusUpdate(b.id, 'REJECTED')}
                            >
                              <XCircle size={14} /> Tolak
                            </button>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'hsl(var(--color-success))' }}
                              onClick={() => handleStatusUpdate(b.id, 'APPROVED')}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          </>
                        )}
                        {b.status === 'REJECTED' && (
                          <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleStatusUpdate(b.id, 'PENDING')}>
                            Kembalikan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Conflict Warning */}
                    {conflicts.length > 0 && (
                      <div style={{
                        background: 'hsl(var(--color-danger-light))', color: 'hsl(var(--color-danger))',
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem',
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem'
                      }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Peringatan Bentrok Jadwal:</strong> Pengajuan ini bertabrakan dengan {conflicts.length} jadwal lain yang sudah disetujui/pending pada waktu yang sama.
                          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', marginBottom: 0 }}>
                            {conflicts.map(c => (
                              <li key={c.id}>{c.agenda} ({c.startTime} - {c.endTime}) - {c.kelompokKerja} [{c.status}]</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{b.agenda || 'Tanpa Agenda'}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <span><Clock size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {format(parseISO(b.date), 'dd MMM yyyy', { locale: id })} · {b.startTime} - {b.endTime}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{b.roomName}</span>
                    </div>
                    {b.fileDraft && (
                      <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--color-primary))' }}>
                        <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Draft: {b.fileDraft}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Mode */}
                {isEditing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>✏️ Edit Peminjaman</h3>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.5rem' }} onClick={cancelEdit}>
                        <X size={16} />
                      </button>
                    </div>

                    {editError && (
                      <div style={{ background: 'hsl(var(--color-danger-light))', color: 'hsl(var(--color-danger))', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={16} /> {editError}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label">Pokja</label>
                        <select name="kelompokKerja" value={editData.kelompokKerja} onChange={handleEditChange} className="form-control">
                          {KELOMPOK_KERJA.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Ruangan</label>
                        <select name="roomId" value={editData.roomId} onChange={handleEditChange} className="form-control">
                          {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Agenda</label>
                      <input type="text" name="agenda" value={editData.agenda} onChange={handleEditChange} className="form-control" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label">Tanggal</label>
                        <input type="date" name="date" value={editData.date} onChange={handleEditChange} className="form-control" />
                      </div>
                      <div>
                        <label className="form-label">Mulai</label>
                        <input type="time" name="startTime" value={editData.startTime} onChange={handleEditChange} className="form-control" />
                      </div>
                      <div>
                        <label className="form-label">Selesai</label>
                        <input type="time" name="endTime" value={editData.endTime} onChange={handleEditChange} className="form-control" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button className="btn btn-outline" onClick={cancelEdit}>Batal</button>
                      <button className="btn btn-primary" onClick={() => saveEdit(b.id)}>
                        <Save size={16} /> Simpan Perubahan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
