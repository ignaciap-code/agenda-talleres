import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, isPast, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'

export default function PublicCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState([])
  const [bookings, setBookings] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [currentMonth])

  async function fetchData() {
    setLoading(true)
    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const [{ data: avail }, { data: bks }, { data: wks }] = await Promise.all([
      supabase.from('availability').select('*').gte('date', from).lte('date', to).order('date').order('slot_start'),
      supabase.from('bookings').select('*, workshops(*), availability(*)').in('status', ['pending', 'approved']),
      supabase.from('workshops').select('*').order('name'),
    ])
    setAvailability(avail || [])
    setBookings(bks || [])
    setWorkshops(wks || [])
    setLoading(false)
  }

  function getDayInfo(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const daySlots = availability.filter(a => a.date === dateStr)
    const past = isPast(startOfDay(date)) && !isToday(date)
    if (past) return { date, status: 'past', slots: daySlots }
    if (daySlots.length === 0) return { date, status: 'blocked', slots: [] }
    if (daySlots.some(s => s.is_blocked)) return { date, status: 'blocked', slots: daySlots }
    const bookedIds = new Set(bookings.map(b => b.availability_id))
    const free = daySlots.filter(s => !bookedIds.has(s.id))
    if (free.length === 0) return { date, status: 'full', slots: daySlots }
    if (free.length < daySlots.length) return { date, status: 'partial', slots: daySlots }
    return { date, status: 'available', slots: daySlots }
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfWeek = (getDay(startOfMonth(currentMonth)) + 6) % 7
  const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const bookedIds = new Set(bookings.map(b => b.availability_id))

  const statusStyle = {
    available: { bg:'#f0faf8', border:'#4db6a8' },
    partial:   { bg:'#fffbeb', border:'#f59e0b' },
    full:      { bg:'var(--surface-alt)', border:'var(--border)' },
    blocked:   { bg:'var(--surface-alt)', border:'transparent' },
    past:      { bg:'transparent', border:'transparent' },
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <header style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'0 2rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, background:'var(--teal)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:'Inter', fontWeight:600, fontSize:15 }}>Talleres de bienestar</div>
              <div style={{ fontSize:12, color:'var(--slate-light)' }}>Unidad de Bienestar y Salud Mental · UFT</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'2rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:26, fontWeight:600, marginBottom:6 }}>Agenda un taller para tu carrera</h1>
          <p style={{ fontSize:15, color:'var(--slate-mid)' }}>Selecciona un día disponible y elige el horario y taller que mejor se ajuste a tu curso.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'1.5rem', alignItems:'start' }}>
          <div className="card" style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentMonth(m => subMonths(m,1))} style={{ padding:'6px 10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <h2 style={{ fontSize:17, fontWeight:600, textTransform:'capitalize' }}>{format(currentMonth,'MMMM yyyy',{locale:es})}</h2>
              <button className="btn btn-ghost" onClick={() => setCurrentMonth(m => addMonths(m,1))} style={{ padding:'6px 10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            </div>

            <div style={{ display:'flex', gap:16, marginBottom:'1rem', flexWrap:'wrap' }}>
              {[{c:'#0a7c6e',l:'Con disponibilidad'},{c:'#f59e0b',l:'Parcialmente ocupado'},{c:'#94a3b8',l:'Sin disponibilidad'}].map(({c,l}) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:c }} />
                  <span style={{ fontSize:12, color:'var(--slate-light)' }}>{l}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
              {dayNames.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--slate-light)', textTransform:'uppercase', letterSpacing:'0.05em', padding:'4px 0' }}>{d}</div>)}
            </div>

            {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'var(--slate-light)', fontSize:14 }}>Cargando...</div> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                {Array.from({length:firstDayOfWeek}).map((_,i) => <div key={i} />)}
                {days.map(day => {
                  const info = getDayInfo(day)
                  const isSelected = selectedDay ? isSameDay(day, selectedDay.date) : false
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6
                  const clickable = !isWeekend && info.status !== 'blocked' && info.status !== 'past' && info.status !== 'full'
                  const sc = isSelected ? {bg:'var(--teal)',border:'var(--teal)'} : isWeekend || info.status==='past' ? {bg:'transparent',border:'transparent'} : statusStyle[info.status]
                  const freeCount = info.slots.filter(s => !s.is_blocked && !bookedIds.has(s.id)).length
                  const takenCount = info.slots.filter(s => !s.is_blocked && bookedIds.has(s.id)).length
                  return (
                    <div key={day.toISOString()} onClick={() => clickable && setSelectedDay(info)}
                      style={{ minHeight:56, border:`1.5px solid ${sc.border}`, borderRadius:'var(--radius-sm)', background:sc.bg, padding:6, cursor:clickable?'pointer':'default', opacity:info.status==='past'||isWeekend?0.35:1, transition:'all 0.1s' }}>
                      <div style={{ fontSize:13, fontWeight:isToday(day)?700:500, color:isSelected?'white':isToday(day)?'var(--teal)':'var(--slate)', marginBottom:4 }}>{format(day,'d')}</div>
                      {!isWeekend && info.status !== 'past' && (
                        <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                          {freeCount > 0 && <div style={{ fontSize:9, background:isSelected?'rgba(255,255,255,0.2)':'#e0f5f0', color:isSelected?'white':'var(--teal)', borderRadius:3, padding:'1px 4px' }}>{freeCount} libre{freeCount>1?'s':''}</div>}
                          {takenCount > 0 && <div style={{ fontSize:9, background:'var(--surface-alt)', color:'var(--slate-light)', borderRadius:3, padding:'1px 4px' }}>{takenCount} res.</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            {!selectedDay ? (
              <div className="card" style={{ padding:'2rem', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                <p style={{ fontSize:14, color:'var(--slate-mid)', lineHeight:1.6 }}>Selecciona un día disponible para ver los horarios y agendar un taller.</p>
              </div>
            ) : (
              <DayPanel dayInfo={selectedDay} bookings={bookings} workshops={workshops} onBook={() => { fetchData(); setSelectedDay(null) }} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function DayPanel({ dayInfo, bookings, workshops, onBook }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const bookedIds = new Set(bookings.map(b => b.availability_id))
  const freeSlots = dayInfo.slots.filter(s => !s.is_blocked && !bookedIds.has(s.id))
  const takenSlots = dayInfo.slots.filter(s => !s.is_blocked && bookedIds.has(s.id))

  return (
    <div className="card" style={{ padding:'1.25rem' }}>
      <h3 style={{ fontSize:15, fontWeight:600, marginBottom:'1rem', textTransform:'capitalize' }}>
        {format(dayInfo.date,"EEEE d 'de' MMMM",{locale:es})}
      </h3>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:'1rem' }}>
        {freeSlots.map(slot => (
          <SlotRow key={slot.id} slot={slot} status="free" selected={selectedSlot?.id===slot.id} onClick={() => setSelectedSlot(s => s?.id===slot.id?null:slot)} />
        ))}
        {takenSlots.map(slot => (
          <SlotRow key={slot.id} slot={slot} status="taken" selected={false} onClick={() => {}} />
        ))}
      </div>
      {selectedSlot && (
        <BookingModal slot={selectedSlot} date={dayInfo.date} workshops={workshops} existingBookings={bookings} onSuccess={onBook} onCancel={() => setSelectedSlot(null)} />
      )}
    </div>
  )
}

function SlotRow({ slot, status, selected, onClick }) {
  return (
    <div onClick={status==='free'?onClick:undefined}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', border:`1.5px solid ${selected?'var(--teal)':'var(--border)'}`, borderRadius:'var(--radius-sm)', background:selected?'var(--teal-light)':status==='taken'?'var(--surface-alt)':'var(--white)', cursor:status==='free'?'pointer':'default', opacity:status==='taken'?0.6:1, transition:'all 0.1s' }}>
      <span style={{ fontSize:13, fontWeight:500 }}>{slot.slot_start.slice(0,5)} – {slot.slot_end.slice(0,5)}</span>
      <span className={`badge ${status==='free'?'badge-approved':'badge-own'}`}>{status==='free'?'Disponible':'Reservado'}</span>
    </div>
  )
}
