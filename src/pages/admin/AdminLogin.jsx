import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error('Correo o contraseña incorrectos')
    else navigate('/admin')
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)' }}>
      <div className="card" style={{ width:'100%', maxWidth:380, padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:44, height:44, background:'var(--teal)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>Panel de bienestar</h1>
          <p style={{ fontSize:13, color:'var(--slate-light)' }}>Unidad de Bienestar y Salud Mental · UFT</p>
        </div>
        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label>Correo institucional</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@uft.cl" required />
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={loading}>
            {loading ? <><span className="spinner" />Ingresando...</> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
