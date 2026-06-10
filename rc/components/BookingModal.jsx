import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { supabase, Availability, Workshop, Booking } from '../lib/supabase'

const SCHOOLS = [
  'Arquitectura', 'Derecho', 'Diseño', 'Educación', 'Enfermería',
  'Ingeniería Comercial', 'Medicina', 'Nutrición', 'Psicología',
  'Tecnología Médica', 'Trabajo Social',
]
const YEARS = ['1er año', '2do año', '3er año', '4to año', '5to año', '6to año']
const ROLES = ['Docente', 'Director de carrera', 'Jefe de departamento', 'Coordinador académico']

interface Props {
  slot: Availability
  date: Date
  workshops: Workshop[]
  existingBookings: Booking[]
  onSuccess: () => void
  onCancel?: () => void
}

export default function BookingModal({ slot, date, workshops, existingBookings, onSuccess, onCancel: _onCancel }: Props) {
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    workshop_id: '',
    school: '',
    career: '',
    year: '',
    student_count: '',
    reason: '',
    room_type: '' as 'own_room' | 'cowork' | '',
    own_room_name: '',
    requester_name: '',
    requester_email: '',
    requester_role: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
    if (field === 'workshop_id' || field === 'career' || field === 'year') {
      checkDuplicate({ ...form, [field]: value })
    }
  }

  function checkDuplicate(f: typeof form) {
    if (!f.workshop_id || !f.career || !f.year) return
    const exists = existingBookings.some(b =>
      b.workshop_id === f.workshop_id &&
      b.career.toLowerCase() === f.career.toLowerCase() &&
      b.year === f.year &&
      b.status !== 'rejected'
    )
    setDuplicateWarning(exists)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.workshop_id) e.workshop_id = 'Selecciona un taller'
    if (!form.school) e.school = 'Selecciona una escuela'
    if (!form.career.trim()) e.career = 'Ingresa el nombre de la carrera'
    if (!form.year) e.year = 'Selecciona el año'
    if (!form.student_count || parseInt(form.student_count) < 1) e.student_count = 'Ingresa la cantidad de estudiantes'
    if (!form.room_type) e.room_type = 'Selecciona el tipo de espacio'
    if (form.room_type === 'own_room' && !form.own_room_name.trim()) e.own_room_name = 'Indica el nombre de la sala'
    if (!form.requester_name.trim()) e.requester_name = 'Ingresa tu nombre'
    if (!form.requester_email.trim()) e.requester_email = 'Ingresa tu correo institucional'
    else if (!form.requester_email.endsWith('.cl') && !form.requester_email.includes('@uft')) e.requester_email = 'Usa tu correo institucional'
    if (!form.requester_role) e.requester_role = 'Selecciona tu cargo'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    setLoading(true)
    try {
      const isInstant = form.room_type === 'own_room'
      const { error } = await supabase.from('bookings').insert({
        workshop_id: form.workshop_id,
        availability_id: slot.id,
        school: form.school,
        career: form.career.trim(),
        year: form.year,
        student_count: parseInt(form.student_count),
        reason: form.reason.trim() || null,
        room_type: form.room_type,
        own_room_name: form.room_type === 'own_room' ? form.own_room_name.trim() : null,
        requester_name: form.requester_name.trim(),
        requester_email: form.requester_email.trim().toLowerCase(),
        requester_role: form.requester_role,
        status: isInstant ? 'approved' : 'pending',
        confirmed_at: isInstant ? new Date().toISOString() : null,
      })
      if (error) throw error
      setStep('done')
    } catch (err) {
      toast.error('Hubo un error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const selectedWorkshop = workshops.find(w => w.id === form.workshop_id)
  const isInstant = form.room_type === 'own_room'
  const dateLabel = format(date, "EEEE d 'de' MMMM yyyy", { locale: es })
  const timeLabel = `${slot.slot_start.slice(0,5)} – ${slot.slot_end.slice(0,5)}`

  if (step === 'done') {
    return (
      <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--teal-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--teal-mid)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--teal-dark)' }}>
            {isInstant ? 'Taller confirmado' : 'Solicitud enviada'}
          </h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--teal-dark)', lineHeight: 1.6, marginBottom: 12 }}>
          {isInstant
            ? `Tu taller ha sido confirmado para el ${dateLabel} de ${timeLabel}. Recibirás un correo de confirmación en ${form.requester_email}.`
            : `Tu solicitud fue recibida. Las psicólogas de bienestar la revisarán y recibirás una respuesta en ${form.requester_email}.`
          }
        </p>
        <button className="btn btn-secondary" onClick={onSuccess} style={{ fontSize: 13 }}>Volver al calendario</button>
      </div>
    )
  }

  if (step === 'confirm') {
    const gcLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedWorkshop?.name || '')}&dates=${format(date,'yyyyMMdd')}T${slot.slot_start.replace(':','')}00/${format(date,'yyyyMMdd')}T${slot.slot_end.replace(':','')}00&details=${encodeURIComponent(`Carrera: ${form.career}\nEscuela: ${form.school}\nAño: ${form.year}\nEstudiantes: ${form.student_count}\nSala: ${form.room_type === 'own_room' ? form.own_room_name : 'Sala bienestar'}`)}`

    return (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem', fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--slate)' }}>Resumen de la reserva</div>
          {[
            ['Taller', selectedWorkshop?.name],
            ['Fecha', `${dateLabel} · ${timeLabel}`],
            ['Carrera', `${form.career} – ${form.year}`],
            ['Escuela', form.school],
            ['Estudiantes', form.student_count],
            ['Espacio', form.room_type === 'own_room' ? `Sala propia: ${form.own_room_name}` : 'Cowork bienestar'],
            ['Solicitante', `${form.requester_name} (${form.requester_role})`],
          ].map(([k, v]) => (
            <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--slate-mid)' }}>{k}</span>
              <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>

        {isInstant && (
          <a href={gcLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--teal)', textDecoration: 'none', marginBottom: 12, fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Añadir a Google Calendar
          </a>
        )}

        {!isInstant && (
          <div style={{ padding: '10px 12px', background: 'var(--warning-light)', border: '1px solid #e8d5a3', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--warning)', marginBottom: 12 }}>
            <strong>Pendiente de aprobación.</strong> La confirmación llegará por correo una vez que bienestar apruebe la solicitud.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setStep('form')} style={{ flex: 1 }}>Editar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ flex: 2 }}>
            {loading ? <><span className="spinner" />Enviando...</> : isInstant ? 'Confirmar reserva' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: '1rem', color: 'var(--slate)' }}>Reservar este horario</h4>

      {duplicateWarning && (
        <div style={{ padding: '10px 12px', background: 'var(--warning-light)', border: '1px solid #e8d5a3', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--warning)', marginBottom: 12 }}>
          <strong>Atención:</strong> Este taller ya fue agendado para {form.career} {form.year}. Recuerda unificar secciones para no repetir el mismo taller al mismo año.
        </div>
      )}

      {/* Taller */}
      <div className="form-group">
        <label>Taller</label>
        <select value={form.workshop_id} onChange={e => set('workshop_id', e.target.value)}>
          <option value="">Seleccionar taller...</option>
          {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        {errors.workshop_id && <span className="error-msg">{errors.workshop_id}</span>}
      </div>

      {/* Espacio */}
      <div className="form-group">
        <label>Tipo de espacio</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ v: 'own_room', label: 'Sala propia', desc: 'Confirmación inmediata' }, { v: 'cowork', label: 'Cowork bienestar', desc: 'Sujeto a aprobación' }].map(opt => (
            <div
              key={opt.v}
              onClick={() => set('room_type', opt.v)}
              style={{
                padding: '10px 12px',
                border: `1.5px solid ${form.room_type === opt.v ? 'var(--teal)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: form.room_type === opt.v ? 'var(--teal-light)' : 'var(--white)',
                transition: 'all 0.1s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: form.room_type === opt.v ? 'var(--teal-dark)' : 'var(--slate)', marginBottom: 2 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: form.room_type === opt.v ? 'var(--teal)' : 'var(--slate-light)' }}>{opt.desc}</div>
            </div>
          ))}
        </div>
        {errors.room_type && <span className="error-msg">{errors.room_type}</span>}
      </div>

      {form.room_type === 'own_room' && (
        <div className="form-group">
          <label>Nombre de la sala</label>
          <input placeholder="Ej: Sala C-201" value={form.own_room_name} onChange={e => set('own_room_name', e.target.value)} />
          {errors.own_room_name && <span className="error-msg">{errors.own_room_name}</span>}
        </div>
      )}

      {/* Escuela y carrera */}
      <div className="form-row-2">
        <div className="form-group">
          <label>Escuela</label>
          <select value={form.school} onChange={e => set('school', e.target.value)}>
            <option value="">Seleccionar...</option>
            {SCHOOLS.map(s => <option key={s}>{s}</option>)}
          </select>
          {errors.school && <span className="error-msg">{errors.school}</span>}
        </div>
        <div className="form-group">
          <label>Carrera</label>
          <input placeholder="Ej: Enfermería" value={form.career} onChange={e => set('career', e.target.value)} />
          {errors.career && <span className="error-msg">{errors.career}</span>}
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label>Año</label>
          <select value={form.year} onChange={e => set('year', e.target.value)}>
            <option value="">Seleccionar...</option>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          {errors.year && <span className="error-msg">{errors.year}</span>}
        </div>
        <div className="form-group">
          <label>Cantidad de estudiantes</label>
          <input type="number" min="1" placeholder="Ej: 35" value={form.student_count} onChange={e => set('student_count', e.target.value)} />
          {errors.student_count && <span className="error-msg">{errors.student_count}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Motivo o contexto <span style={{ color: 'var(--slate-light)', fontWeight: 400 }}>(opcional)</span></label>
        <textarea rows={2} placeholder="Ej: semana de bienvenida, grupo en situación de riesgo..." value={form.reason} onChange={e => set('reason', e.target.value)} />
      </div>

      <hr className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 10 }}>Datos del solicitante</div>

      <div className="form-group">
        <label>Nombre completo</label>
        <input placeholder="Ej: María González" value={form.requester_name} onChange={e => set('requester_name', e.target.value)} />
        {errors.requester_name && <span className="error-msg">{errors.requester_name}</span>}
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label>Correo institucional</label>
          <input type="email" placeholder="nombre@uft.cl" value={form.requester_email} onChange={e => set('requester_email', e.target.value)} />
          {errors.requester_email && <span className="error-msg">{errors.requester_email}</span>}
        </div>
        <div className="form-group">
          <label>Cargo</label>
          <select value={form.requester_role} onChange={e => set('requester_role', e.target.value)}>
            <option value="">Seleccionar...</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          {errors.requester_role && <span className="error-msg">{errors.requester_role}</span>}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        onClick={() => { if (validate()) setStep('confirm') }}
      >
        Revisar reserva →
      </button>
    </div>
  )
}
