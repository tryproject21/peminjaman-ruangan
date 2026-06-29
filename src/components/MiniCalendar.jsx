import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function MiniCalendar({ selectedDate, onSelectDate }) {
  const selected = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = React.useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(selected.getMonth());

  // Sync viewMonth/viewYear when selectedDate changes externally
  React.useEffect(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDay = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  // Empty cells before the 1st
  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const toDateStr = (day) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)',
      padding: '1rem',
      width: '260px',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Month/Year Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <button onClick={prevMonth} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', transition: 'var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button onClick={nextMonth} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', transition: 'var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day Name Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0',
        marginBottom: '4px',
      }}>
        {DAY_NAMES.map(day => (
          <div key={day} style={{
            textAlign: 'center',
            fontSize: '0.6875rem',
            fontWeight: '600',
            color: 'var(--text-muted)',
            padding: '4px 0',
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Date Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
      }}>
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} style={{ height: '32px' }}></div>;
          }

          const dateStr = toDateStr(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateStr)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: isSelected || isToday ? '700' : '400',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                transition: 'all 0.15s ease',
                background: isSelected
                  ? 'hsl(221, 83%, 53%)'
                  : isToday
                    ? 'hsl(221, 83%, 90%)'
                    : 'transparent',
                color: isSelected
                  ? '#fff'
                  : isToday
                    ? 'hsl(221, 83%, 40%)'
                    : 'var(--text-main)',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-main)';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday ? 'hsl(221, 83%, 90%)' : 'transparent';
                }
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
