import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminAvailability() {
  const { signOut } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newSlotStart, setNewSlotStart] = useState('')
  const [newSlotEnd, setNewSlotEnd] = useState('')
  const [semester, setSemester] = useState('2025-2')

  useEffect(() => { fetchAvailability() }, [currentMonth])

  async function fetchAvailability() {
    setLoading(true)
    const from = format(startOfMonth(currentMonth),'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth),'yyyy-MM-dd')
    const { data } = await supabase.from('availability').select('*').gte('date',from).lte('date',to).order('slot_start')
    setAvailability(data||[])
    setLoading(false)
  }

  const days = eachDayOfInterval({ start:startOfMonth(currentMonth), end:endOfMonth(currentMonth) })
  const firstDayOfWeek = (getDay(startOfMonth(currentMonth))+6)%7
  const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

  function getSlotsForDate(dateStr) { return availability.filter(a => a.date===dateStr) }

  async function toggleBlock(slot) {
    setSaving(true)
    const { error } = await supabase.from('availability').update({ is_blocked:!slot.is_blocked }).eq('id',slot.id)
    if (error) toast.error('Error')
    else { toast.success(slot.is_blocked?'Habilitado':'Bloqueado'); fetchAvailability() }
    setSaving(false)
  }

  async function deleteSlot(id) {
    setSaving(true)
    const { error } = await supabase.from('availability').delete().eq('id',id)
    if (error) toast.error('Error')
    else { toast.success('Eliminado'); fetchAvailability() }
    setSaving(false)
  }

  async function addSlot() {
    if (!selectedDate||!newSlotStart||!newSlotEnd) return
    setSaving(true)
    const { error } = await supabase.from('availability').insert({ date:selectedDate, slot_start:newSlotStart+':00', slot_end:newSlotEnd+':00', is_blocked:false, semester })
    if (error) toast.error('Error')
    else { toast.success('Horario agregado'); setNewSlotStart(''); setNewSlotEnd(''); fetchAvailability() }
    setSaving(false)
  }

  async function addDefaultSlots() {
    if (!selectedDate) return
    setSaving(true)
    const inserts = [['08:30','10:00'],['10:15','11:45'],['14:00','15:30'],['15:45','17:15']].map(([s,e]) => ({ date:selectedDate, slot_start:s+':00', slot_end:e+':00', is_blocked:false, semester }))
    const { error } = await supabase.from('availability').insert(inserts)
    if (error) toast.error('Error')
    else { toast.success('Horarios agregados'); fetchAvailability() }
    setSaving(false)
  }

  async function blockFullDay() {
    if (!selectedDate) return
    setSaving(true)
    const existing = getSlotsForDate(selectedDate)
    if (existing.length>0) await supabase.from('availability').update({ is_blocked:true }).eq('date',selectedDate)
    else await supabase.from('availability').insert({ date:selectedDate, slot_start:'08:00:00', slot_end:'18:00:00', is_blocked:true, semester })
    toast.success('Día bloqueado')
    fetchAvailability()
    setSaving(false)
  }

  const selectedSlots = selectedDate ? getSlotsForDate(selectedDate) : []

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <header style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'0 2rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <Link to="/admin" style={{ fontSize:13, color:'var(--slate-mid)', textDecoration:'none' }}>← Volver</Link>
            <div style={{ width:1, height:20, background:'var(--border)' }} />
            <span style={{ fontFamily:'Inter', fontWeight:600, fontSize:14 }}>Gestión de disponibilidad</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, color:'var(--slate-mid)', marginBottom:0 }}>Semestre</label>
              <select value={semester} onChange={e => setSemester(e.target.value)} style={{ width:'auto', fontSize:13, padding:'6px 10px' }}>
                <option value="2025-1">2025-1</option>
                <option value="2025-2">2025-2</option>
                <option value="2026-1">2026-1</option>
              </select>
            </div>
            <button className="btn btn-ghost" onClick={signOut} style={{ fontSize:13 }}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'2rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'1.5rem', alignItems:'start' }}>
          <div className="card" style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentMonth(m => subMonths(m,1))} style={{ padding:'6px 10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <h2 style={{ fontSize:16, fontWeight:600, textTransform:'capitalize' }}>{format(currentMonth,'MMMM yyyy',{locale:es})}</h2>
              <button className="btn btn-ghost" onClick={() => setCurrentMonth(m => addMonths(m,1))} style={{ padding:'6px 10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
              {dayNames.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--slate-light)', textTransform:'uppercase', letterSpacing:'0.05em', padding:'4px 0' }}>{d}</div>)}
            </div>
            {loading ? <div style={{ textAlign:'center', padding:'2rem', color:'var(--slate-light)', fontSize:14 }}>Cargando...</div> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                {Array.from({length:firstDayOfWeek}).map((_,i) => <div key={i} />)}
                {days.map(day => {
                  const isWeekend = getDay(day)===0||getDay(day)===6
                  const dateStr = format(day,'yyyy-MM-dd')
                  const slots = getSlotsForDate(dateStr)
                  const isSelected = selectedDate===dateStr
                  const allBlocked = slots.length>0 && slots.every(s=>s.is_blocked)
                  const hasSlots = slots.some(s=>!s.is_blocked)
                  return (
                    <div key={dateStr} onClick={() => !isWeekend && setSelectedDate(d => d===dateStr?null:dateStr)}
                      style={{ minHeight:52, border:`1.5px solid ${isSelected?'var(--teal)':allBlocked?'#f0c0bb':hasSlots?'#4db6a8':'var(--border)'}`, borderRadius:'var(--radius-sm)', background:isSelected?'var(--teal-light)':allBlocked?'var(--danger-light)':hasSlots?'#f0faf8':'var(--white)', padding:6, cursor:isWeekend?'default':'pointer', opacity:isWeekend?0.3:1, transition:'all 0.1s' }}>
                      <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{format(day,'d')}</div>
                      {!isWeekend && slots.length>0 && <div style={{ fontSize:10, color:allBlocked?'var(--danger)':'var(--teal)', fontWeight:500 }}>{allBlocked?'Bloqueado':`${slots.filter(s=>!s.is_blocked).length} horario${slots.filter(s=>!s.is_blocked).length!==1?'s':''}`}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ padding:'1.25rem' }}>
            {!selectedDate ? <div style={{ padding:'2rem', textAlign:'center' }}><p style={{ fontSize:14, color:'var(--slate-light)' }}>Selecciona un día para editar sus horarios</p></div> : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                  <h3 style={{ fontSize:15, fontWeight:600, textTransform:'capitalize' }}>{format(new Date(selectedDate+'T12:00:00'),"d 'de' MMMM",{locale:es})}</h3>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-secondary" onClick={addDefaultSlots} disabled={saving} style={{ fontSize:12, padding:'5px 10px' }}>+ Horarios tipo</button>
                    <button className="btn btn-danger" onClick={blockFullDay} disabled={saving} style={{ fontSize:12, padding:'5px 10px' }}>Bloquear día</button>
                  </div>
                </div>
                {selectedSlots.length===0 ? <p style={{ fontSize:13, color:'var(--slate-light)', marginBottom:'1rem' }}>Sin horarios configurados</p> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:'1rem' }}>
                    {selectedSlots.map(slot => (
                      <div key={slot.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', border:`1px solid ${slot.is_blocked?'#f0c0bb':'var(--border)'}`, borderRadius:'var(--radius-sm)', background:slot.is_blocked?'var(--danger-light)':'var(--white)', fontSize:13 }}>
                        <span style={{ fontWeight:500 }}>{slot.slot_start.slice(0,5)} – {slot.slot_end.slice(0,5)}</span>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <span style={{ fontSize:11, color:slot.is_blocked?'var(--danger)':'var(--teal)', fontWeight:500 }}>{slot.is_blocked?'Bloqueado':'Disponible'}</span>
                          <button className="btn btn-ghost" onClick={() => toggleBlock(slot)} disabled={saving} style={{ fontSize:11, padding:'3px 8px', color:slot.is_blocked?'var(--teal)':'var(--warning)' }}>{slot.is_blocked?'Habilitar':'Bloquear'}</button>
                          <button className="btn btn-ghost" onClick={() => deleteSlot(slot.id)} disabled={saving} style={{ padding:'4px 6px', color:'var(--danger)' }}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <hr className="divider" style={{ margin:'12px 0' }} />
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Agregar horario</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label>Inicio</label>
                    <input type="time" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label>Fin</label>
                    <input type="time" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={addSlot} disabled={!newSlotStart||!newSlotEnd||saving} style={{ width:'100%', justifyContent:'center', fontSize:13 }}>Agregar horario</button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
