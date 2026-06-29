export const ROOMS = [
  { id: '1', name: 'Ruang Rapat Besar Lt.4' },
  { id: '2', name: 'Ruangan Kaca' },
  { id: '3', name: 'Ruang Kecil' },
];

export const KELOMPOK_KERJA = ['DKA', 'DKT', 'DKP', 'DKE', 'DKK'];

const BOOKINGS_KEY = 'dk_bookings';

// Format Data: { id, date, startTime, endTime, roomId, roomName, kelompokKerja, agenda, fileDraft, status: 'PENDING' | 'APPROVED' | 'REJECTED' }

export const getBookings = () => {
  const data = localStorage.getItem(BOOKINGS_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearBookings = () => {
  localStorage.removeItem(BOOKINGS_KEY);
};

export const addBooking = (booking) => {
  const bookings = getBookings();
  const newBooking = {
    ...booking,
    id: Date.now().toString(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  return newBooking;
};

export const checkOverlap = (date, startTime, endTime, roomId, excludeId = null) => {
  const bookings = getBookings();
  const relevantBookings = bookings.filter(b => 
    b.date === date && 
    b.roomId === roomId && 
    (b.status === 'APPROVED' || b.status === 'PENDING') &&
    b.id !== excludeId
  );

  const start1 = new Date(`1970-01-01T${startTime}:00`);
  const end1 = new Date(`1970-01-01T${endTime}:00`);

  for (let b of relevantBookings) {
    const start2 = new Date(`1970-01-01T${b.startTime}:00`);
    const end2 = new Date(`1970-01-01T${b.endTime}:00`);
    
    if (start1 < end2 && end1 > start2) {
      return true;
    }
  }
  return false;
};

export const updateBookingStatus = (id, status) => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index].status = status;
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    return bookings[index];
  }
  return null;
};

export const editBooking = (id, updatedFields) => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index] = { ...bookings[index], ...updatedFields };
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    return bookings[index];
  }
  return null;
};

export const deleteBooking = (id) => {
  const bookings = getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
};

export const getConflicts = (booking) => {
  const bookings = getBookings();
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
