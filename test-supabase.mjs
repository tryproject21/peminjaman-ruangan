import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwtqyccdkiwizuwngyen.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uxHLPlWu0np0dulVwyd2NA_AupORTru';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSupabase() {
  console.log('Attempting to insert booking using Publishable Key...');
  const newBooking = {
    id: Date.now().toString(),
    date: '2026-06-30',
    startTime: '10:00',
    endTime: '11:00',
    roomId: '1',
    roomName: 'Ruang Rapat Besar Lt.4',
    kelompokKerja: 'DKA',
    agenda: 'Test Anon Key',
    fileDraft: null,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  const { data, error } = await supabase.from('bookings').insert([newBooking]).select();
  if (error) {
    console.error('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

testSupabase();
