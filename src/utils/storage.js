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

// Google Calendar ID for subscription
export const GOOGLE_CALENDAR_ID = 'sganteng005@gmail.com';

// ============================================================
// Google Calendar Sync via Supabase Edge Function
// ============================================================

/**
 * Invoke the google-calendar-sync Edge Function
 * @param {string} action - 'create' | 'update' | 'delete'
 * @param {object} params - { booking?, eventId? }
 * @returns {Promise<{success: boolean, googleEventId?: string, error?: string}>}
 */
const invokeCalendarSync = async (action, params = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
      body: { action, ...params },
    });

    if (error) {
      console.error('Calendar sync invocation error:', error);
      return { success: false, error: error.message || 'Invocation failed' };
    }

    return data || { success: false, error: 'No response data' };
  } catch (err) {
    console.error('Calendar sync network error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
};

/**
 * Create a Google Calendar event for an approved booking
 */
export const createCalendarEvent = async (booking) => {
  const result = await invokeCalendarSync('create', { booking });
  if (result.success && result.googleEventId) {
    // Save the Google Event ID back to the booking
    await supabase
      .from('bookings')
      .update({ googleEventId: result.googleEventId })
      .eq('id', booking.id);
  }
  return result;
};

/**
 * Update an existing Google Calendar event
 */
export const updateCalendarEvent = async (booking) => {
  if (!booking.googleEventId) return { success: false, error: 'No Google Event ID' };
  return await invokeCalendarSync('update', {
    eventId: booking.googleEventId,
    booking,
  });
};

/**
 * Delete a Google Calendar event
 */
export const deleteCalendarEvent = async (googleEventId) => {
  if (!googleEventId) return { success: false, error: 'No Google Event ID' };
  return await invokeCalendarSync('delete', { eventId: googleEventId });
};

// ============================================================
// Booking CRUD Operations
// ============================================================

export const getBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, date, startTime, endTime, roomId, roomName, kelompokKerja, pic, agenda, fileDraft, status, createdAt, googleEventId')
    .order('createdAt', { ascending: false });
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  return data || [];
};

export const getBookingFileData = async (id) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('fileData')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error fetching fileData:', error);
    return null;
  }
  return data?.fileData || null;
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
    pic: booking.pic || null,
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
  
  // Send Telegram Notification (Fire and forget, don't block the UI)
  supabase.functions.invoke('telegram-notify', {
    body: { booking: newBooking },
  }).catch(err => console.error("Error invoking telegram-notify:", err));

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

/**
 * Update booking status, with Google Calendar sync
 * - APPROVED → Create calendar event
 * - REJECTED (from APPROVED) → Delete calendar event
 */
export const updateBookingStatus = async (id, status) => {
  // First get current booking to check if it has a Google Event ID
  const { data: currentBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select();
  if (error) {
    console.error('Error updating status:', error);
    return { booking: null, calendarResult: null };
  }

  const updatedBooking = data[0];
  let calendarResult = null;

  // Sync with Google Calendar
  if (status === 'APPROVED') {
    // Create event when approved
    calendarResult = await createCalendarEvent(updatedBooking);
  } else if (status === 'REJECTED' && currentBooking?.googleEventId) {
    // Delete event when rejected (and had a calendar event)
    calendarResult = await deleteCalendarEvent(currentBooking.googleEventId);
    // Clear the googleEventId
    await supabase
      .from('bookings')
      .update({ googleEventId: null })
      .eq('id', id);
  }

  return { booking: updatedBooking, calendarResult };
};

/**
 * Edit booking with Google Calendar sync
 */
export const editBooking = async (id, updatedFields) => {
  const { data, error } = await supabase
    .from('bookings')
    .update(updatedFields)
    .eq('id', id)
    .select();
  if (error) {
    console.error('Error editing booking:', error);
    return { booking: null, calendarResult: null };
  }

  const updatedBooking = data[0];
  let calendarResult = null;

  // If this booking is approved and has a Google Event ID, update the calendar event
  if (updatedBooking.status === 'APPROVED' && updatedBooking.googleEventId) {
    calendarResult = await updateCalendarEvent(updatedBooking);
  }

  return { booking: updatedBooking, calendarResult };
};

/**
 * Delete booking with Google Calendar sync
 */
export const deleteBooking = async (id) => {
  // First get the booking to check for Google Event ID
  const { data: booking } = await supabase
    .from('bookings')
    .select('googleEventId')
    .eq('id', id)
    .single();

  let calendarResult = null;
  if (booking?.googleEventId) {
    calendarResult = await deleteCalendarEvent(booking.googleEventId);
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting booking:', error);
  }

  return { calendarResult };
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
