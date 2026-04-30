'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

type Role = 'student' | 'teacher' | 'school' | 'admin';

const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: 'student', label: 'Student',  icon: '⚔️' },
  { id: 'teacher', label: 'Teacher',  icon: '🧙' },
  { id: 'school',  label: 'School',   icon: '🏰' },
  { id: 'admin',   label: 'Admin',    icon: '🛡' },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [role, setRole] = useState<Role>('student');

  const [studentId,  setStudentId]  = useState('');
  const [pin,        setPin]        = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [twoFactor,  setTwoFactor]  = useState('');
  const [showPwd,    setShowPwd]    = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [shake,   setShake]   = useState(false);

  useEffect(() => {
    if (user) {
      const dest = user.role === 'STUDENT' ? '/student' : user.role === 'TEACHER' ? '/teacher' : user.role === 'SCHOOL' ? '/school' : '/admin';
      router.replace(dest);
    }
  }, [user, router]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (role === 'student') {
        if (!studentId || !pin) { setError('Student ID and PIN are required'); setLoading(false); triggerShake(); return; }
        body.studentId = studentId; body.pin = pin;
        if (schoolCode) body.schoolCode = schoolCode;
      } else {
        if (!email || !password) { setError('Email and password are required'); setLoading(false); triggerShake(); return; }
        body.email = email; body.password = password;
        if (role === 'school' && schoolCode) body.schoolCode = schoolCode;
        if (role === 'admin' && twoFactor) body.twoFactor = twoFactor;
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      await refresh();
      const r = data.user?.role?.toUpperCase();
      const dest = r === 'STUDENT' ? '/student' : r === 'TEACHER' ? '/teacher' : r === 'SCHOOL' ? '/school' : '/admin';
      router.replace(dest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arena-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }} className={shake ? 'shake' : ''}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div className="icon-shield" style={{ width: 44, height: 50 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1, color: 'var(--ink-1)' }}>QUEST</div>
              <div style={{ fontFamily: 'var(--f-hud)', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.3em', fontWeight: 700 }}>ACADEMY</div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.15em', marginTop: 4 }}>
            YOUR SCHOOL&apos;S GAME WORLD
          </div>
        </div>

        {/* CARD */}
        <div className="card" style={{ padding: '28px 24px', border: '2px solid var(--line)' }}>

          {/* ROLE TABS */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', letterSpacing: '0.2em', marginBottom: 10 }}>
              SELECT YOUR ROLE
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
              padding: 6, background: 'var(--bg-elev-2)', borderRadius: 14,
              border: '2px solid var(--line)',
            }}>
              {ROLES.map(r => {
                const active = role === r.id;
                return (
                  <button key={r.id} type="button" onClick={() => { setRole(r.id); setError(null); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 10,
                      background: active ? 'var(--violet)' : 'transparent',
                      border: active ? '1.5px solid var(--violet-bright)' : '1.5px solid transparent',
                      color: active ? '#fff' : 'var(--ink-3)',
                      boxShadow: active ? 'var(--hd-violet)' : 'none',
                      fontFamily: 'var(--f-hud)', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all .15s',
                    }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.2em' }}>
              {role.toUpperCase()} LOGIN
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {role === 'student' && <>
              <ArcadeInput placeholder="School Code (optional)" value={schoolCode} onChange={setSchoolCode} icon="🏰" />
              <ArcadeInput placeholder="Student ID" value={studentId} onChange={setStudentId} icon="🆔" required />
              <ArcadeInput placeholder="PIN" type={showPwd ? 'text' : 'password'} value={pin} onChange={setPin} icon="🔑" required
                right={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)} />} />
            </>}

            {role === 'teacher' && <>
              <ArcadeInput placeholder="Email" type="email" value={email} onChange={setEmail} icon="📧" required />
              <ArcadeInput placeholder="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={setPassword} icon="🔑" required
                right={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)} />} />
            </>}

            {role === 'school' && <>
              <ArcadeInput placeholder="School Code" value={schoolCode} onChange={setSchoolCode} icon="🏰" required />
              <ArcadeInput placeholder="Admin Email" type="email" value={email} onChange={setEmail} icon="📧" required />
              <ArcadeInput placeholder="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={setPassword} icon="🔑" required
                right={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)} />} />
            </>}

            {role === 'admin' && <>
              <ArcadeInput placeholder="Admin Email" type="email" value={email} onChange={setEmail} icon="📧" required />
              <ArcadeInput placeholder="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={setPassword} icon="🔑" required
                right={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)} />} />
              <ArcadeInput placeholder="2FA Code" value={twoFactor} onChange={setTwoFactor} icon="🔐" />
            </>}

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,90,77,0.12)',
                border: '1.5px solid var(--hot)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontFamily: 'var(--f-hud)', fontSize: 12, color: 'var(--hot)', letterSpacing: '0.04em' }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
              {loading
                ? <span style={{ animation: 'spinSlow 1s linear infinite', display: 'inline-block' }}>⚙️</span>
                : '▶ ENTER THE ARENA'}
            </button>

            {role === 'student' && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.1em' }}>
                FORGOT PIN? ASK YOUR TEACHER
              </div>
            )}
          </form>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1.5px solid var(--line)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              Don&apos;t have an account?<br />
              <span style={{ color: 'var(--cyan)' }}>Contact your school admin.</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.15em' }}>
          LEARN · BATTLE · CONQUER
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function ArcadeInput({ placeholder, value, onChange, type = 'text', icon, required, right }: {
  placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; icon?: string; required?: boolean; right?: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, lineHeight: 1, pointerEvents: 'none', zIndex: 1,
        }}>{icon}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: `12px ${right ? '44px' : '14px'} 12px ${icon ? '40px' : '14px'}`,
          background: 'var(--bg-elev-2)',
          border: '2px solid var(--line)',
          borderRadius: 10,
          color: 'var(--ink-1)',
          fontFamily: 'var(--f-body)',
          fontSize: 14, fontWeight: 600,
          outline: 'none',
          transition: 'border-color .15s, box-shadow .15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--violet)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(107,75,255,0.25)'; }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'var(--line)';   e.currentTarget.style.boxShadow = 'none'; }}
      />
      {right && (
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>
      )}
    </div>
  );
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle} style={{ color: 'var(--ink-3)', fontSize: 16, padding: 4, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>
      {show ? '🙈' : '👁️'}
    </button>
  );
}
