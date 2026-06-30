import React, { useState, useEffect } from 'react';
import { getBookings, editBooking, deleteBooking, checkOverlap, ROOMS, KELOMPOK_KERJA } from '../utils/storage';
import { ChevronLeft, ChevronRight, Users, X, Clock, MapPin, FileText, Download, Pencil, Save, AlertCircle, Trash2 } from 'lucide-react';
import MiniCalendar from '../components/MiniCalendar';
import { useAuth } from '../context/AuthContext';

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 60;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS_ARRAY = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

const GROUP_COLORS = {
  'DKA': { bg: '#1a73e8', light: '#d2e3fc', text: '#174ea6' },
  'DKT': { bg: '#0b8043', light: '#ceead6', text: '#0d652d' },
  'DKP': { bg: '#f4511e', light: '#fce8e6', text: '#c5221f' },
  'DKE': { bg: '#8e24aa', light: '#e8daef', text: '#6a1b9a' },
  'DKK': { bg: '#e67c73', light: '#fce8e6', text: '#c5221f' },
};

const DAY_NAMES_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Dashboard() {
  const { role, isSecretary, isKelompokKerja } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = async () => {
    setIsLoading(true);
    const allBookings = await getBookings();
    setBookings(allBookings.filter(b => b.status === 'APPROVED'));
    setIsLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const offset = d.getTimezoneOffset();
    setSelectedDate(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
  };

  const getPosition = (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    const startMinutes = (sh - START_HOUR) * 60 + sm;
    const endMinutes = (eh - START_HOUR) * 60 + em;
    const s = Math.max(0, startMinutes);
    const e = Math.min(TOTAL_HOURS * 60, endMinutes);
    if (s >= e) return null;
    const top = (s / 60) * HOUR_HEIGHT;
    const height = ((e - s) / 60) * HOUR_HEIGHT;
    return { top, height };
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAY_NAMES_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_LONG[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getWeekDays = (dateStr) => {
    const curr = new Date(dateStr + 'T00:00:00');
    const first = curr.getDate() - curr.getDay() + 1; // Start from Monday
    const days = [];
    for (let i = 0; i < 5; i++) { // Render Monday to Friday for weekly view
      const d = new Date(curr.setDate(first + i));
      const offset = d.getTimezoneOffset();
      days.push(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
    }
    return days;
  };

  // Download file handler
  const handleDownload = (booking) => {
    if (!booking.fileData) return;
    const link = document.createElement('a');
    link.href = booking.fileData;
    link.download = booking.fileDraft || 'undangan';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detail Modal Actions
  const openDetail = (booking) => {
    setSelectedBooking(booking);
    setIsEditing(false);
    setEditError('');
  };

  const closeDetail = () => {
    setSelectedBooking(null);
    setIsEditing(false);
    setEditData({});
    setEditError('');
  };

  const handleDelete = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      await deleteBooking(selectedBooking.id);
      await loadBookings();
      closeDetail();
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditError('');
    setEditData({
      date: selectedBooking.date,
      startTime: selectedBooking.startTime,
      endTime: selectedBooking.endTime,
      roomId: selectedBooking.roomId,
      kelompokKerja: selectedBooking.kelompokKerja,
      pic: selectedBooking.pic || '',
      agenda: selectedBooking.agenda || '',
    });
  };

  const saveEdit = async () => {
    setEditError('');
    if (editData.startTime >= editData.endTime) {
      setEditError('Waktu selesai harus lebih besar dari waktu mulai.');
      return;
    }
    const isOverlapping = await checkOverlap(editData.date, editData.startTime, editData.endTime, editData.roomId, selectedBooking.id);
    if (isOverlapping) {
      setEditError('Jadwal bentrok dengan peminjaman lain.');
      return;
    }
    const room = ROOMS.find(r => r.id === editData.roomId);
    await editBooking(selectedBooking.id, { ...editData, roomName: room.name });
    await loadBookings();
    closeDetail();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Current time indicator
  const now = new Date();
  const nowMinutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= 0 && nowMinutes <= TOTAL_HOURS * 60;
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  const canEditOrDelete = selectedBooking && (isSecretary || (isKelompokKerja && role === selectedBooking.kelompokKerja));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }} className="animate-fade-in">
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => {
            const today = new Date();
            const offset = today.getTimezoneOffset();
            setSelectedDate(new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
          }} className="btn btn-outline" style={{ padding: '0.4rem 1.1rem', fontSize: '0.8125rem' }}>
            Hari Ini
          </button>
          
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button 
              className={`btn ${viewMode === 'daily' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', border: 'none', borderRadius: 0 }}
              onClick={() => setViewMode('daily')}
            >
              Harian
            </button>
            <button 
              className={`btn ${viewMode === 'weekly' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', border: 'none', borderRadius: 0 }}
              onClick={() => setViewMode('weekly')}
            >
              Mingguan
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
            <button onClick={() => changeDate(viewMode === 'weekly' ? -7 : -1)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
              borderRadius: '50%', color: 'var(--text-muted)'
            }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => changeDate(viewMode === 'weekly' ? 7 : 1)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
              borderRadius: '50%', color: 'var(--text-muted)'
            }}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          <h2 style={{ fontSize: '1.375rem', fontWeight: '400', color: 'var(--text-main)', margin: 0 }}>
            {viewMode === 'daily' ? formatDateLabel(selectedDate) : `Minggu dari ${formatDateLabel(getWeekDays(selectedDate)[0])}`}
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem', border: '4px solid rgba(0,0,0,0.1)', borderLeftColor: 'hsl(var(--color-primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p>Memuat jadwal dari database online...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
          <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          {/* Legend */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
            padding: '1rem', width: '260px',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kelompok Kerja
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(GROUP_COLORS).map(([group, colors]) => (
                <div key={group} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: colors.bg, flexShrink: 0 }}></div>
                  {group}
                </div>
              ))}
            </div>
            
            {viewMode === 'weekly' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ruangan
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ROOMS.map((r, i) => (
                    <div key={r.id}>R{i+1}: {r.name}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Calendar Time Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
          }}>

            {/* Column Headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: '64px', flexShrink: 0 }}></div>
              
              {viewMode === 'daily' ? (
                ROOMS.map(room => (
                  <div key={room.id} style={{
                    flex: 1, padding: '0.875rem 0.5rem', textAlign: 'center',
                    fontWeight: '600', fontSize: '0.8125rem', color: 'var(--text-main)',
                    borderLeft: '1px solid var(--border-light)', background: 'var(--bg-main)',
                  }}>
                    {room.name}
                  </div>
                ))
              ) : (
                getWeekDays(selectedDate).map((dayDate, i) => (
                  <div key={dayDate} style={{
                    flex: 1, padding: '0.875rem 0.5rem', textAlign: 'center',
                    fontWeight: '600', fontSize: '0.8125rem', color: 'var(--text-main)',
                    borderLeft: '1px solid var(--border-light)', background: 'var(--bg-main)',
                  }}>
                    {DAY_NAMES_LONG[i+1].substring(0,3)}, {dayDate.substring(8,10)}
                  </div>
                ))
              )}
            </div>

            {/* Time Grid */}
            <div style={{ display: 'flex', position: 'relative', overflow: 'hidden' }}>

              {/* Time Labels */}
              <div style={{ width: '64px', flexShrink: 0, position: 'relative' }}>
                {HOURS_ARRAY.map(hour => (
                  <div key={hour} style={{ height: `${HOUR_HEIGHT}px`, position: 'relative' }}>
                    <span style={{
                      position: 'absolute', top: '-9px', right: '12px',
                      fontSize: '0.6875rem', fontWeight: '500', color: 'var(--text-muted)', lineHeight: 1,
                    }}>
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid Columns */}
              {viewMode === 'daily' ? (
                // DAILY VIEW (Columns = Rooms)
                ROOMS.map(room => {
                  const roomBookings = bookings.filter(b => b.date === selectedDate && b.roomId === room.id);
                  return (
                    <div key={room.id} style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border-light)' }}>
                      {HOURS_ARRAY.map(hour => (
                        <div key={hour} style={{ height: `${HOUR_HEIGHT}px`, borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderBottom: '1px dashed #f5f5f5' }}></div>
                        </div>
                      ))}

                      {roomBookings.map(b => {
                        const pos = getPosition(b.startTime, b.endTime);
                        if (!pos) return null;
                        const colors = GROUP_COLORS[b.kelompokKerja] || { bg: '#5f6368' };
                        const isShort = pos.height < 40;

                        return (
                          <div
                            key={b.id}
                            onClick={() => openDetail(b)}
                            style={{
                              position: 'absolute', top: `${pos.top + 2}px`, left: '4px', right: '4px', height: `${pos.height - 4}px`,
                              background: colors.bg, borderRadius: '6px', padding: isShort ? '2px 8px' : '6px 10px',
                              color: '#fff', overflow: 'hidden', cursor: 'pointer', zIndex: 5,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.12)', display: 'flex',
                              flexDirection: isShort ? 'row' : 'column', gap: isShort ? '6px' : '2px',
                              alignItems: isShort ? 'center' : 'flex-start',
                            }}
                          >
                            <div style={{
                              fontWeight: '600', fontSize: isShort ? '0.6875rem' : '0.75rem',
                              lineHeight: 1.2, width: '100%',
                              display: '-webkit-box', WebkitLineClamp: isShort ? 1 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            }}>{b.agenda || 'Rapat'}</div>
                            {!isShort && (
                              <div style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: '500', display: 'flex', flexDirection: 'column' }}>
                                <span>{b.startTime} – {b.endTime}</span>
                                {b.pic && <span>PIC: {b.pic}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                // WEEKLY VIEW (Columns = Days, Sub-columns = Rooms)
                getWeekDays(selectedDate).map((dayDate) => {
                  const dayBookings = bookings.filter(b => b.date === dayDate);
                  return (
                    <div key={dayDate} style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border-light)' }}>
                      {HOURS_ARRAY.map(hour => (
                        <div key={hour} style={{ height: `${HOUR_HEIGHT}px`, borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderBottom: '1px dashed #f5f5f5' }}></div>
                        </div>
                      ))}

                      {dayBookings.map(b => {
                        const pos = getPosition(b.startTime, b.endTime);
                        if (!pos) return null;
                        const colors = GROUP_COLORS[b.kelompokKerja] || { bg: '#5f6368' };
                        const roomIndex = ROOMS.findIndex(r => r.id === b.roomId);
                        const leftPct = (roomIndex * 33.33);
                        
                        return (
                          <div
                            key={b.id}
                            onClick={() => openDetail(b)}
                            title={`${b.agenda}\n${b.roomName}`}
                            style={{
                              position: 'absolute', top: `${pos.top + 2}px`, 
                              left: `${leftPct}%`, width: '33.33%', height: `${pos.height - 4}px`,
                              background: colors.bg, borderRadius: '4px', padding: '2px 4px',
                              color: '#fff', overflow: 'hidden', cursor: 'pointer', zIndex: 5,
                              border: '1px solid rgba(255,255,255,0.3)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column'
                            }}
                          >
                            <div style={{ fontWeight: '700', fontSize: '0.625rem', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              R{roomIndex+1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}

              {/* Current Time Indicator */}
              {showNowLine && viewMode === 'daily' && selectedDate === now.toISOString().split('T')[0] && (
                <div style={{ position: 'absolute', top: `${nowTop}px`, left: '52px', right: 0, zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: '0', top: '-5px', width: '10px', height: '10px', borderRadius: '50%', background: '#ea4335' }}></div>
                  <div style={{ marginLeft: '10px', height: '2px', background: '#ea4335' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: 0, overflow: 'hidden' }}>
            
            {(() => {
              const colors = GROUP_COLORS[selectedBooking.kelompokKerja] || { bg: '#5f6368' };
              return (
                <div style={{ background: colors.bg, color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: '#fff' }}>
                      {selectedBooking.agenda || 'Rapat'}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
                      Diajukan oleh Pokja {selectedBooking.kelompokKerja} {selectedBooking.pic ? `(PIC: ${selectedBooking.pic})` : ''}
                    </p>
                  </div>
                  <button onClick={closeDetail} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff', flexShrink: 0,
                  }}>
                    <X size={18} />
                  </button>
                </div>
              );
            })()}

            <div style={{ padding: '1.5rem' }}>

              {/* View Mode */}
              {!isEditing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <Clock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: '600' }}>{formatDateLabel(selectedBooking.date)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{selectedBooking.startTime} – {selectedBooking.endTime} WIB</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <MapPin size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontWeight: '500' }}>{selectedBooking.roomName}</span>
                  </div>

                  {selectedBooking.fileDraft && (
                    <div style={{
                      background: 'var(--bg-main)', borderRadius: 'var(--radius-md)',
                      padding: '0.875rem 1rem', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', border: '1px solid var(--border-light)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-main)', overflow: 'hidden' }}>
                        <FileText size={18} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedBooking.fileDraft}
                        </span>
                      </div>
                      {selectedBooking.fileData && (
                        <button
                          onClick={() => handleDownload(selectedBooking)}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.875rem', fontSize: '0.75rem', flexShrink: 0 }}
                        >
                          <Download size={14} /> Download
                        </button>
                      )}
                    </div>
                  )}

                  {/* Edit / Delete Buttons */}
                  {canEditOrDelete && (
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-outline" onClick={handleDelete} style={{ fontSize: '0.8125rem', color: 'hsl(var(--color-danger))', borderColor: 'hsl(var(--color-danger-light))' }}>
                        <Trash2 size={14} /> Hapus
                      </button>
                      <button className="btn btn-outline" onClick={startEdit} style={{ fontSize: '0.8125rem' }}>
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode */}
              {isEditing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editError && (
                    <div style={{
                      background: 'hsl(var(--color-danger-light))', color: 'hsl(var(--color-danger))',
                      padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                      <AlertCircle size={16} /> {editError}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">Pokja</label>
                      <select name="kelompokKerja" value={editData.kelompokKerja} onChange={handleEditChange} className="form-control" disabled={isKelompokKerja}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">Agenda</label>
                      <input type="text" name="agenda" value={editData.agenda} onChange={handleEditChange} className="form-control" />
                    </div>
                    <div>
                      <label className="form-label">PIC (Opsional)</label>
                      <input type="text" name="pic" value={editData.pic} onChange={handleEditChange} className="form-control" />
                    </div>
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Batal</button>
                    <button className="btn btn-primary" onClick={saveEdit}>
                      <Save size={16} /> Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
