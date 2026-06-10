@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --teal: #0a7c6e; --teal-light: #e6f4f2; --teal-mid: #4db6a8; --teal-dark: #075a50;
  --slate: #1e2a35; --slate-mid: #4a5568; --slate-light: #8a97a6;
  --surface: #f7f9fb; --surface-alt: #eef2f7; --border: #dde3ec;
  --white: #ffffff; --danger: #c0392b; --danger-light: #fdf0ee;
  --warning: #b07d2a; --warning-light: #fdf6e3;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  font-family: 'DM Sans', sans-serif; color: var(--slate); background: var(--surface);
}
body { min-height: 100vh; }
h1,h2,h3,h4 { font-family: 'Inter', sans-serif; font-weight: 600; }
button { font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; background: none; }
input, select, textarea { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--slate); background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; width: 100%; outline: none; transition: border-color 0.15s; }
input:focus, select:focus, textarea:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(10,124,110,0.1); }
input::placeholder, textarea::placeholder { color: var(--slate-light); }
label { font-size: 13px; font-weight: 500; color: var(--slate-mid); display: block; margin-bottom: 5px; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; transition: all 0.15s; }
.btn-primary { background: var(--teal); color: white; }
.btn-primary:hover { background: var(--teal-dark); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--white); color: var(--slate); border: 1px solid var(--border); }
.btn-danger { background: var(--danger-light); color: var(--danger); border: 1px solid #f0c0bb; }
.btn-ghost { color: var(--slate-mid); padding: 7px 12px; }
.btn-ghost:hover { background: var(--surface-alt); color: var(--slate); }
.card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.badge-pending { background: var(--warning-light); color: var(--warning); }
.badge-approved { background: var(--teal-light); color: var(--teal); }
.badge-rejected { background: var(--danger-light); color: var(--danger); }
.badge-own { background: var(--surface-alt); color: var(--slate-mid); }
.badge-cowork { background: #eef0ff; color: #4a4dd0; }
.form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
.error-msg { font-size: 12px; color: var(--danger); margin-top: 4px; }
.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
