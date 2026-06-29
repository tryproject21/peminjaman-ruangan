import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwtqyccdkiwizuwngyen.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uxHLPlWu0np0dulVwyd2NA_AupORTru';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const ROOMS = [
  { id: '1', name: 'Ruang Rapat Besar Lt.4' },
  { id: '2', name: 'Ruangan Kaca' },
  { id: '3', name: 'Ruang Kecil' },
];

export const KELOMPOK_KERJA = [
  'DKA', 'DKT', 'DKP', 'DKE', 'DKK'
];

export const getBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  return data || [];
};

export const addBooking = async (booking) => {
  const newBooking = {
    id: Date.now().toString(),
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    roomId: booking.roomId,
    roomName: booking.roomName,
    kelompokKerja: booking.kelompokKerja,
    agenda: booking.agenda,
    fileDraft: booking.fileDraft,
    fileData: booking.fileData,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('bookings')
    .insert([newBooking])
    .select();
    
  if (error) {
    console.error('Error adding booking:', error);
    return { error };
  }
  return data[0];
};

export const checkOverlap = async (date, startTime, endTime, roomId, excludeId = null) => {
  const bookings = await getBookings();
  const s1 = new Date(`1970-01-01T${startTime}:00`);
  const e1 = new Date(`1970-01-01T${endTime}:00`);

  const hasOverlap = bookings.some(b => {
    if (excludeId && b.id === excludeId) return false;
    if (b.date !== date || b.roomId !== roomId) return false;
    if (b.status === 'REJECTED') return false;

    const s2 = new Date(`1970-01-01T${b.startTime}:00`);
    const e2 = new Date(`1970-01-01T${b.endTime}:00`);
    
    return s1 < e2 && e1 > s2;
  });

  return hasOverlap;
};

export const updateBookingStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select();
  if (error) {
    console.error('Error updating status:', error);
    return null;
  }
  return data[0];
};

export const editBooking = async (id, updatedFields) => {
  const { data, error } = await supabase
    .from('bookings')
    .update(updatedFields)
    .eq('id', id)
    .select();
  if (error) {
    console.error('Error editing booking:', error);
    return null;
  }
  return data[0];
};

export const deleteBooking = async (id) => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting booking:', error);
  }
};

export const getConflicts = async (booking) => {
  const bookings = await getBookings();
  return bookings.filter(b =>
    b.id !== booking.id &&
    b.date === booking.date &&
    b.roomId === booking.roomId &&
    (b.status === 'APPROVED' || b.status === 'PENDING') &&
    (() => {
      const s1 = new Date(`1970-01-01T${booking.startTime}:00`);
      const e1 = new Date(`1970-01-01T${booking.endTime}:00`);
      const s2 = new Date(`1970-01-01T${b.startTime}:00`);
      const e2 = new Date(`1970-01-01T${b.endTime}:00`);
      return s1 < e2 && e1 > s2;
    })()
  );
};
