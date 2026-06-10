import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchBookings() }, [])

  async function fetchBookings() {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*, workshops(*), availability(*)').order('created_at', { ascending:false })
    setBookings(data || [])
    setLoading(false)
  }

  const counts = { all:bookings.length, pending:bookings.filter(b=>b.status==='pending').length, approved:bookings.filter(b=>b.status==='approved').length, rejected:bookings.filter(b=>b.status==='rejected').length }
  const filtered = bookings.filter(b => filter==='all' || b.status===filter)

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <header style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'0 2rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontFamily:'Inter', fontWeight:600, fontSize:14 }}>Panel admin · Bienestar UFT</span>
            <div style={{ width:1, height:20, background:'var(--border)' }} />
            <Link to="/admin/availability" style={{ fontSize:13, color:'var(--slate-mid)', textDecoration:'none' }}>Disponibilidad</Link>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Link to="/" target="_blank" style={{ fontSize:13, color:'var(--slate-mid)', textDecoration:'none' }}>Ver calendario</Link>
            <button className="btn btn-ghost" onClick={signOut} style={{ fontSize:13 }}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'2rem' }}>
        <h1 style={{ fontSize:22, fontWeight:600, marginBottom:'1.5rem' }}>Solicitudes de talleres</h1>

        <div style={{ display:'flex', gap:6, marginBottom:'1.25rem' }}>
          {[['pending','Pendientes'],['approved','Aprobadas'],['rejected','Rechazadas'],['all','Todas']].map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'7px 14px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, border:`1px solid ${filter===f?'var(--teal)':'var(--border)'}`, background:filter===f?'var(--teal-light)':'var(--white)', color:filter===f?'var(--teal-dark)':'var(--slate-mid)', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {l} <span style={{ background:filter===f?'var(--teal)':'var(--surface-alt)', color:filter===f?'white':'var(--slate-mid)', borderRadius:20, padding:'1px 7px', fontSize:11, fontWeight:600 }}>{counts[f]}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 400px':'1fr', gap:'1.5rem', alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? <p style={{ color:'var(--slate-light)', fontSize:14, padding:'2rem', textAlign:'center' }}>Cargando...</p>
              : filtered.length===0 ? <div className="card" style={{ padding:'3rem', textAlign:'center', color:'var(--slate-light)', fontSize:14 }}>No hay solicitudes</div>
              : filtered.map(b => <BookingCard key={b.id} booking={b} selected={selected?.id===b.id} onClick={() => setSelected(s => s?.id===b.id?null:b)} />)
            }
          </div>
          {selected && <BookingDetail booking={selected} onClose={() => setSelected(null)} onUpdate={() => { fetchBookings(); setSelected(null) }} />}
        </div>
      </main>
    </div>
  )
}

function BookingCard({ booking:b, selected, onClick }) {
  const avail = b.availability
  const workshop = b.workshops
  const dateStr = avail ? format(new Date(avail.date+'T12:00:00'),'d MMM yyyy',{locale:es}) : '—'
  const timeStr = avail ? `${avail.slot_start?.slice(0,5)} – ${avail.slot_end?.slice(0,5)}` : '—'
  return (
    <div className="card" onClick={onClick} style={{ padding:'1rem 1.25rem', cursor:'pointer', border:`1px solid ${selected?'var(--teal)':'var(--border)'}`, background:selected?'var(--teal-light)':'var(--white)', transition:'all 0.1s' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:6, marginBottom:6 }}>
            <span className={`badge badge-${b.status}`}>{b.status==='pending'?'Pendiente':b.status==='approved'?'Aprobada':'Rechazada'}</span>
            <span className={`badge ${b.room_type==='cowork'?'badge-cowork':'badge-own'}`}>{b.room_type==='cowork'?'Cowork':'Sala propia'}</span>
          </div>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{workshop?.name||'—'}</div>
          <div style={{ fontSize:13, color:'var(--slate-mid)', marginBottom:2 }}>{b.career} · {b.year} · {b.school}</div>
          <div style={{ fontSize:12, color:'var(--slate-light)' }}>{dateStr} · {timeStr} · {b.student_count} estudiantes</div>
        </div>
        <div style={{ fontSize:11, color:'var(--slate-light)', whiteSpace:'nowrap' }}>{format(new Date(b.created_at),'d MMM · HH:mm',{locale:es})}</div>
      </div>
    </div>
  )
}

function BookingDetail({ booking:b, onClose, onUpdate }) {
  const [comment, setComment] = useState(b.admin_comment||'')
  const [rejection, setRejection] = useState(b.rejection_reason||'')
  const [loading, setLoading] = useState(null)
  const avail = b.availability
  const workshop = b.workshops
  const gcLink = avail&&workshop ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(workshop.name)}&dates=${avail.date?.replace(/-/g,'')}T${avail.slot_start?.replace(':','')}00/${avail.date?.replace(/-/g,'')}T${avail.slot_end?.replace(':','')}00&details=${encodeURIComponent(`Carrera: ${b.career}\nEscuela: ${b.school}\nAño: ${b.year}\nEstudiantes: ${b.student_count}`)}` : '#'

  async function approve() {
    setLoading('approve')
    const { error } = await supabase.from('bookings').update({ status:'approved', admin_comment:comment.trim()||null, confirmed_at:new Date().toISOString() }).eq('id',b.id)
    if (error) { toast.error('Error al aprobar'); setLoading(null); return }
    toast.success('Solicitud aprobada')
    onUpdate()
  }

  async function reject() {
    if (!rejection.trim()) { toast.error('Debes ingresar el motivo del rechazo'); return }
    setLoading('reject')
    const [r1, r2] = await Promise.all([
      supabase.from('bookings').update({ status:'rejected', rejection_reason:rejection.trim() }).eq('id',b.id),
      supabase.from('availability').update({ is_blocked:true }).eq('id',b.availability_id),
    ])
    if (r1.error||r2.error) { toast.error('Error al rechazar'); setLoading(null); return }
    toast.success('Rechazada y horario eliminado del calendario')
    onUpdate()
  }

  const dateStr = avail ? format(new Date(avail.date+'T12:00:00'),"EEEE d 'de' MMMM yyyy",{locale:es}) : '—'
  const timeStr = avail ? `${avail.slot_start?.slice(0,5)} – ${avail.slot_end?.slice(0,5)}` : '—'

  return (
    <div className="card" style={{ padding:'1.25rem', position:'sticky', top:'1.5rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <h3 style={{ fontSize:15, fontWeight:600 }}>Detalle</h3>
        <button className="btn btn-ghost" onClick={onClose} style={{ padding:'4px 8px' }}>✕</button>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:'1rem' }}>
        <span className={`badge badge-${b.status}`}>{b.status==='pending'?'Pendiente':b.status==='approved'?'Aprobada':'Rechazada'}</span>
        <span className={`badge ${b.room_type==='cowork'?'badge-cowork':'badge-own'}`}>{b.room_type==='cowork'?'Cowork':'Sala propia'}</span>
      </div>
      <div style={{ fontSize:13, display:'flex', flexDirection:'column', gap:7, marginBottom:'1.25rem' }}>
        {[['Taller',workshop?.name],['Fecha',dateStr.charAt(0).toUpperCase()+dateStr.slice(1)],['Horario',timeStr],['Carrera',`${b.career} – ${b.year}`],['Escuela',b.school],['Estudiantes',`${b.student_count}`],['Sala',b.room_type==='own_room'?`Propia: ${b.own_room_name}`:'Cowork'],['Motivo',b.reason||'—'],['Solicitante',b.requester_name],['Correo',b.requester_email],['Cargo',b.requester_role]].map(([k,v]) => (
          <div key={k} style={{ display:'flex', gap:8 }}>
            <span style={{ color:'var(--slate-light)', minWidth:80 }}>{k}</span>
            <span style={{ fontWeight:500, flex:1 }}>{v}</span>
          </div>
        ))}
      </div>
      <a href={gcLink} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--teal)', textDecoration:'none', marginBottom:'1rem', fontWeight:500 }}>📅 Ver en Google Calendar</a>
      {b.status==='pending' && b.room_type==='cowork' && (
        <>
          <hr className="divider" />
          <div className="form-group">
            <label>Comentario al aprobar <span style={{ color:'var(--slate-light)', fontWeight:400 }}>(opcional)</span></label>
            <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Ej: Confirmar asistencia 48 hrs antes..." />
          </div>
          <div className="form-group">
            <label>Motivo de rechazo <span style={{ color:'var(--danger)' }}>*</span></label>
            <textarea rows={2} value={rejection} onChange={e => setRejection(e.target.value)} placeholder="Ej: El coworker ya tiene actividad..." />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-danger" onClick={reject} disabled={!!loading} style={{ flex:1, justifyContent:'center' }}>
              {loading==='reject'?'...':'Rechazar'}
            </button>
            <button className="btn btn-primary" onClick={approve} disabled={!!loading} style={{ flex:2, justifyContent:'center' }}>
              {loading==='approve'?<><span className="spinner"/>Aprobando...</>:'Aprobar'}
            </button>
          </div>
        </>
      )}
      {b.status==='rejected' && b.rejection_reason && <div style={{ padding:'10px 12px', background:'var(--danger-light)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--danger)' }}><strong>Motivo:</strong> {b.rejection_reason}</div>}
      {b.status==='approved' && b.admin_comment && <div style={{ padding:'10px 12px', background:'var(--teal-light)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--teal-dark)' }}><strong>Comentario:</strong> {b.admin_comment}</div>}
    </div>
  )
}
