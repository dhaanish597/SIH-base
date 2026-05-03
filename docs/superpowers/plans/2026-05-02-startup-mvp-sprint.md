# Startup MVP Sprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **After completing each task:** Update `docs/MASTER_PLAN.md` — check off the completed items in the Feature Tracker.

**Goal:** Complete the multi-tenant user creation chain (Admin→School, School→Teacher, Teacher→Student) and add the gamification feedback loop (achievement toasts, XP float, level-up modal) so the app is demo-ready and startup-credible.

**Architecture:**
- Phase A (Tasks 1–4): Backend — add three missing POST endpoints and fix student creation to auto-generate credentials.
- Phase B (Tasks 5–9): Frontend — add modals/forms to admin, school, and teacher pages so each role can create the next role down. A shared `CredentialTicket` component shows generated credentials.
- Phase C (Tasks 10–12): Gamification — add a toast context, XP float CSS, a level-up modal, and wire the existing MathDungeonGame result callback to the new UI.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Express 5, Prisma, Supabase Postgres, Tailwind CSS, bcryptjs, lucide-react

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `server/routes/admin.js` | Add POST `/api/admin/schools` |
| Modify | `server/routes/schools.js` | Add POST `/:id/teachers` + POST `/:id/classes` |
| Modify | `server/routes/users.js` | Fix create-student: auto-generate studentId + PIN |
| Create | `app/components/ui/CredentialTicket.tsx` | Reusable copy-to-clipboard credential card |
| Modify | `app/(authed)/admin/schools/page.tsx` | Create School modal + credential display |
| Modify | `app/(authed)/school/teachers/page.tsx` | Add Teacher modal + credential display |
| Create | `app/(authed)/school/classes/page.tsx` | Full class management page (new page — doesn't exist) |
| Modify | `app/(authed)/teacher/add-student/page.tsx` | Simplify form, show credential ticket after creation |
| Modify | `app/globals.css` | XP float keyframe + level-up overlay animations |
| Create | `app/contexts/AchievementToastContext.tsx` | Toast queue context + provider |
| Create | `app/components/student/AchievementToasts.tsx` | Toast stack renderer |
| Create | `app/components/student/LevelUpModal.tsx` | Full-screen level-up celebration modal |
| Create | `app/(authed)/student/layout.tsx` | Student-specific layout wrapping toast + level-up providers |
| Modify | `app/components/games/MathDungeonGame.tsx` | Fire `onRewardClaimed` callback with server response |

---

## Phase A — Backend Completion

### Task 1: Add POST /api/admin/schools

**Files:**
- Modify: `server/routes/admin.js`

This endpoint creates a school record + a SCHOOL-role admin user in a single DB transaction. It returns the generated schoolCode and a one-time temp password for the admin account. `bcrypt` isn't imported yet in `admin.js` — add it.

- [ ] **Step 1: Add bcrypt import and the route handler to server/routes/admin.js**

Add `const bcrypt = require('bcryptjs');` at the top alongside the existing requires, then add this route before `module.exports`:

```javascript
// POST /api/admin/schools  — create school + school admin account
router.post('/schools', async (req, res) => {
  try {
    const { name, email, address, city, subscriptionTier = 'FREE' } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    // Generate schoolCode: first 3 letters of name + 3 random digits
    const prefix = name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const schoolCode = `${prefix}${suffix}`;

    // One-time temp password for the school admin login
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name, email, address: address || null, city: city || null, schoolCode, subscriptionTier, isActive: true },
      });
      const admin = await tx.user.create({
        data: { name: `${name} Admin`, email, passwordHash, role: 'SCHOOL', schoolId: school.id, status: 'ACTIVE' },
      });
      await tx.auditLog.create({
        data: { actorId: req.user.id, action: 'CREATE', entityType: 'school', entityId: school.id },
      });
      return { school, admin };
    });

    res.json({
      school: { id: result.school.id, name: result.school.name, schoolCode: result.school.schoolCode },
      admin: { id: result.admin.id, email: result.admin.email, tempPassword },
    });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    console.error('admin/schools POST', e);
    res.status(500).json({ error: 'Failed to create school' });
  }
});
```

- [ ] **Step 2: Verify the endpoint with curl**

With the dev server running (`npm run dev`), log in as an admin to get a cookie, then:

```bash
curl -s -X POST http://localhost:3001/api/admin/schools \
  -H "Content-Type: application/json" \
  -b "sih_access=<your_token>" \
  -d '{"name":"Greenfield Academy","email":"admin@greenfield.edu","city":"Chennai","subscriptionTier":"BASIC"}'
```

Expected response shape:
```json
{
  "school": { "id": "...", "name": "Greenfield Academy", "schoolCode": "GRE123" },
  "admin": { "id": "...", "email": "admin@greenfield.edu", "tempPassword": "ABC12345" }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/admin.js
git commit -m "feat: add POST /api/admin/schools — create school + school admin in one transaction"
```

---

### Task 2: Add POST /api/schools/:id/teachers

**Files:**
- Modify: `server/routes/schools.js`

This endpoint creates a TEACHER-role user inside the school. `bcrypt` is already imported in `schools.js`.

- [ ] **Step 1: Add the route handler to server/routes/schools.js**

Insert after the existing `GET /:id/teachers` route (around line 168):

```javascript
// POST /api/schools/:id/teachers  — create a teacher account
router.post('/:id/teachers', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, email, department, subjectsTaught } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const teacher = await prisma.user.create({
      data: {
        name, email, passwordHash,
        role: 'TEACHER', schoolId, status: 'ACTIVE',
        department: department || null,
        subjectsTaught: Array.isArray(subjectsTaught) ? subjectsTaught : [],
      },
    });
    await prisma.auditLog.create({
      data: { schoolId, actorId: req.user.id, action: 'CREATE', entityType: 'user', entityId: teacher.id },
    });
    res.json({ id: teacher.id, name: teacher.name, email: teacher.email, tempPassword });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    console.error('schools/:id/teachers POST', e);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});
```

- [ ] **Step 2: Verify with curl**

```bash
curl -s -X POST http://localhost:3001/api/schools/<schoolId>/teachers \
  -H "Content-Type: application/json" \
  -b "sih_access=<school_admin_token>" \
  -d '{"name":"Priya Sharma","email":"priya@greenfield.edu","department":"Mathematics","subjectsTaught":["Math","Statistics"]}'
```

Expected:
```json
{ "id": "...", "name": "Priya Sharma", "email": "priya@greenfield.edu", "tempPassword": "XYZ98765" }
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/schools.js
git commit -m "feat: add POST /api/schools/:id/teachers — school admin creates teacher accounts"
```

---

### Task 3: Add POST /api/schools/:id/classes

**Files:**
- Modify: `server/routes/schools.js`

- [ ] **Step 1: Add the route handler to server/routes/schools.js**

Insert after the existing `GET /:id/classes` route (around line 189):

```javascript
// POST /api/schools/:id/classes  — create a class
router.post('/:id/classes', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, gradeLevel, section, teacherId } = req.body || {};
    if (!name || !gradeLevel) return res.status(400).json({ error: 'name and gradeLevel required' });

    const cls = await prisma.class.create({
      data: {
        name,
        gradeLevel: Number(gradeLevel),
        section: section || null,
        teacherId: teacherId || null,
        schoolId,
      },
      include: { teacher: { select: { id: true, name: true } } },
    });
    res.json({ id: cls.id, name: cls.name, gradeLevel: cls.gradeLevel, section: cls.section, teacher: cls.teacher });
  } catch (e) {
    console.error('schools/:id/classes POST', e);
    res.status(500).json({ error: 'Failed to create class' });
  }
});
```

- [ ] **Step 2: Verify with curl**

```bash
curl -s -X POST http://localhost:3001/api/schools/<schoolId>/classes \
  -H "Content-Type: application/json" \
  -b "sih_access=<school_admin_token>" \
  -d '{"name":"Grade 9A","gradeLevel":9,"section":"A"}'
```

Expected:
```json
{ "id": "...", "name": "Grade 9A", "gradeLevel": 9, "section": "A", "teacher": null }
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/schools.js
git commit -m "feat: add POST /api/schools/:id/classes — school admin creates classes"
```

---

### Task 4: Fix POST /api/users/create-student — auto-generate studentId and PIN

**Files:**
- Modify: `server/routes/users.js`

Currently the route requires a manually-typed `password` and optional `studentId`. Redesign to auto-generate both. The teacher just provides `name`, `classId`, and optional `rollNumber`.

- [ ] **Step 1: Replace the create-student route in server/routes/users.js**

Replace the existing `router.post('/create-student', ...)` block (lines 85–115) entirely with:

```javascript
// POST /api/users/create-student  — teacher/school creates a student
// Auto-generates studentId and 4-digit PIN; returns plain PIN shown once.
router.post('/create-student', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { name, classId, rollNumber } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
    if (!req.user.schoolId) return res.status(400).json({ error: 'No school scope' });

    // Auto-generate studentId: school prefix + zero-padded count
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId },
      select: { schoolCode: true, name: true },
    });
    const prefix = (school?.schoolCode || school?.name || 'STU')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 3);
    const count = await prisma.user.count({
      where: { schoolId: req.user.schoolId, role: 'STUDENT' },
    });
    const studentId = `${prefix}${String(count + 1).padStart(3, '0')}`;

    // Auto-generate 4-digit PIN
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await bcrypt.hash(pin, 10);

    const student = await prisma.user.create({
      data: {
        name: name.trim(),
        studentId,
        pinHash,
        role: 'STUDENT',
        schoolId: req.user.schoolId,
        rollNumber: rollNumber || null,
        status: 'ACTIVE',
      },
    });

    if (classId) {
      await prisma.classEnrollment.create({
        data: { classId, studentId: student.id },
      }).catch(() => {});
    }

    res.json({ id: student.id, name: student.name, studentId: student.studentId, pin });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ message: 'StudentId conflict — try again.' });
    console.error('create-student', e);
    res.status(500).json({ message: 'Failed to create student' });
  }
});
```

- [ ] **Step 2: Verify with curl (logged in as teacher)**

```bash
curl -s -X POST http://localhost:3001/api/users/create-student \
  -H "Content-Type: application/json" \
  -b "sih_access=<teacher_token>" \
  -d '{"name":"Arjun Kumar","classId":"<classId>"}'
```

Expected:
```json
{ "id": "...", "name": "Arjun Kumar", "studentId": "GRE001", "pin": "4827" }
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/users.js
git commit -m "feat: auto-generate studentId + PIN in create-student, return plain PIN for teacher to share"
```

---

## Phase B — Frontend Creation Chain UI

### Task 5: Create CredentialTicket shared component

**Files:**
- Create: `app/components/ui/CredentialTicket.tsx`

A dark-themed credential display card used after any account creation (school admin, teacher, or student). Shows credentials in monospace with a one-click copy-all button.

- [ ] **Step 1: Create app/components/ui/CredentialTicket.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Copy, Check, Shield } from 'lucide-react';

type Credential = { label: string; value: string };

type Props = {
  title: string;
  credentials: Credential[];
  note?: string;
};

export default function CredentialTicket({ title, credentials, note }: Props) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = credentials.map((c) => `${c.label}: ${c.value}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">{title}</p>
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-100 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/20"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy all'}</span>
        </button>
      </div>
      <div className="space-y-2">
        {credentials.map((c) => (
          <div key={c.label} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2.5">
            <span className="text-xs text-gray-400 w-24 shrink-0">{c.label}</span>
            <span className="font-mono text-sm font-bold text-white tracking-wider">{c.value}</span>
          </div>
        ))}
      </div>
      {note && (
        <p className="text-xs text-amber-400/80 flex items-start gap-1.5">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiled**

Open the dev server and check browser console for TypeScript errors. No runtime test needed yet — this component is used in Tasks 6–9.

- [ ] **Step 3: Commit**

```bash
git add app/components/ui/CredentialTicket.tsx
git commit -m "feat: add CredentialTicket component for displaying generated login credentials"
```

---

### Task 6: Admin Schools page — Create School modal

**Files:**
- Modify: `app/(authed)/admin/schools/page.tsx`

Replace the entire file. Adds a "New School" button that opens a slide-in modal form. On success, shows the CredentialTicket with the school admin credentials.

- [ ] **Step 1: Replace app/(authed)/admin/schools/page.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Building2, Search, Plus, X, Users } from 'lucide-react';
import CredentialTicket from '../../../components/ui/CredentialTicket';

type School = {
  id: string; name: string; schoolCode: string; address: string | null;
  email: string; isActive: boolean; subscriptionTier: string | null;
  createdAt: string; _count: { users: number };
};
type NewCredential = { schoolCode: string; adminEmail: string; tempPassword: string; schoolName: string };

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [credential, setCredential] = useState<NewCredential | null>(null);
  const [form, setForm] = useState({ name: '', email: '', city: '', subscriptionTier: 'FREE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const r = await fetch('/api/admin/schools', { credentials: 'include' });
    if (r.ok) setSchools(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = schools.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
           s.schoolCode.toLowerCase().includes(search.toLowerCase()) ||
           s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const createSchool = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSubmitting(true); setError('');
    const r = await fetch('/api/admin/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(data.error || 'Failed to create school.'); return; }
    setCredential({ schoolCode: data.school.schoolCode, adminEmail: data.admin.email, tempPassword: data.admin.tempPassword, schoolName: data.school.name });
    setShowModal(false);
    setForm({ name: '', email: '', city: '', subscriptionTier: 'FREE' });
    await load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold text-white">Schools</h1>
        <span className="text-sm text-gray-400">{schools.length} total</span>
        <button
          onClick={() => { setShowModal(true); setCredential(null); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New School
        </button>
      </header>

      {/* Credential display after creation */}
      {credential && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-3">
          <p className="text-sm font-bold text-emerald-400">✓ School "{credential.schoolName}" created! Share these credentials with the school admin:</p>
          <CredentialTicket
            title="School Admin Login"
            credentials={[
              { label: 'School Code', value: credential.schoolCode },
              { label: 'Email', value: credential.adminEmail },
              { label: 'Password', value: credential.tempPassword },
            ]}
            note="This password is shown only once. Ask the admin to change it after first login."
          />
          <button onClick={() => setCredential(null)} className="text-xs text-gray-400 hover:text-gray-200 underline">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text" placeholder="Search by name, code or email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {['School', 'Code', 'Email', 'Tier', 'Users', 'Status', 'Joined'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No schools found.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 font-mono text-gray-400 text-xs">{s.schoolCode}</td>
                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[140px]">{s.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">{s.subscriptionTier || 'FREE'}</span>
                </td>
                <td className="px-4 py-3 text-gray-400"><div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{s._count?.users ?? 0}</div></td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create School Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create New School</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">School Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Greenfield Academy"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Admin Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@school.edu"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Chennai"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Subscription Tier</label>
                <select value={form.subscriptionTier} onChange={(e) => setForm((f) => ({ ...f, subscriptionTier: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="FREE">Free</option>
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={createSchool} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Creating…' : 'Create School'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Open browser at /admin/schools, click "New School", fill the form, submit**

Expected: modal closes, credential ticket appears at top with schoolCode, admin email, and temp password. Copy-all button copies to clipboard.

- [ ] **Step 3: Commit**

```bash
git add app/(authed)/admin/schools/page.tsx
git commit -m "feat: admin schools page — Create School modal with credential ticket"
```

---

### Task 7: School Teachers page — Add Teacher modal

**Files:**
- Modify: `app/(authed)/school/teachers/page.tsx`

Same pattern as Task 6. Add "Add Teacher" button, modal form, credential ticket on success.

- [ ] **Step 1: Replace app/(authed)/school/teachers/page.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { GraduationCap, Search, Plus, X } from 'lucide-react';
import CredentialTicket from '../../../components/ui/CredentialTicket';

type Teacher = {
  id: string; name: string; email: string | null; status: string;
  department: string | null; subjectsTaught: string[]; classesHandled: string[]; lastLogin: string | null;
};
type NewCred = { name: string; email: string; tempPassword: string };

export default function SchoolTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [credential, setCredential] = useState<NewCred | null>(null);
  const [form, setForm] = useState({ name: '', email: '', department: '', subjectsTaught: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user?.schoolId) return;
    const r = await fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' });
    if (r.ok) setTeachers(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = teachers.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) ||
           (t.department || '').toLowerCase().includes(search.toLowerCase()),
  );

  const addTeacher = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSubmitting(true); setError('');
    const subjects = form.subjectsTaught.split(',').map((s) => s.trim()).filter(Boolean);
    const r = await fetch(`/api/schools/${user!.schoolId}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: form.name, email: form.email, department: form.department || undefined, subjectsTaught: subjects }),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(data.error || 'Failed to add teacher.'); return; }
    setCredential({ name: data.name, email: data.email, tempPassword: data.tempPassword });
    setShowModal(false);
    setForm({ name: '', email: '', department: '', subjectsTaught: '' });
    await load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">Teachers</h1>
        <span className="text-sm text-gray-400">{teachers.length} total</span>
        <button
          onClick={() => { setShowModal(true); setCredential(null); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </header>

      {credential && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-3">
          <p className="text-sm font-bold text-emerald-400">✓ Teacher "{credential.name}" added! Share these login credentials:</p>
          <CredentialTicket
            title="Teacher Login"
            credentials={[
              { label: 'Email', value: credential.email },
              { label: 'Password', value: credential.tempPassword },
            ]}
            note="This password is shown only once."
          />
          <button onClick={() => setCredential(null)} className="text-xs text-gray-400 hover:text-gray-200 underline">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search by name or department…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>{['Name', 'Email', 'Department', 'Subjects', 'Status', 'Last login'].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(4)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => (
                <td key={j} className="px-4 py-3"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
              ))}</tr>)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No teachers yet. Add your first teacher above.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                <td className="px-4 py-3 text-gray-400">{t.email || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{t.department || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{(t.subjectsTaught || []).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>{t.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{t.lastLogin ? new Date(t.lastLogin).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add Teacher</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Priya Sharma' },
                { label: 'Email *', key: 'email', type: 'email', placeholder: 'teacher@school.edu' },
                { label: 'Department', key: 'department', type: 'text', placeholder: 'e.g. Mathematics' },
                { label: 'Subjects (comma-separated)', key: 'subjectsTaught', type: 'text', placeholder: 'Math, Physics' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm font-semibold rounded-xl hover:bg-white/10">Cancel</button>
              <button onClick={addTeacher} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Adding…' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Open browser at /school/teachers, click "Add Teacher", fill form, submit**

Expected: teacher appears in list, credential ticket shown with email + temp password.

- [ ] **Step 3: Commit**

```bash
git add app/(authed)/school/teachers/page.tsx
git commit -m "feat: school teachers page — Add Teacher modal with credential ticket"
```

---

### Task 8: School Classes page — create from scratch

**Files:**
- Create: `app/(authed)/school/classes/page.tsx`

This page doesn't exist at all. Fetches teachers list for the teacher selector in the Create Class modal.

- [ ] **Step 1: Create app/(authed)/school/classes/page.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { BookOpen, Plus, X, Users } from 'lucide-react';

type Cls = {
  id: string; name: string; gradeLevel: number; section: string | null;
  teacher: { id: string; name: string } | null; _count: { enrollments: number };
};
type Teacher = { id: string; name: string };

export default function SchoolClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', gradeLevel: '9', section: '', teacherId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user?.schoolId) return;
    const [clsRes, tchRes] = await Promise.all([
      fetch(`/api/schools/${user.schoolId}/classes`, { credentials: 'include' }),
      fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' }),
    ]);
    if (clsRes.ok) setClasses(await clsRes.json());
    if (tchRes.ok) setTeachers(await tchRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const createClass = async () => {
    if (!form.name.trim() || !form.gradeLevel) { setError('Name and grade level are required.'); return; }
    setSubmitting(true); setError('');
    const r = await fetch(`/api/schools/${user!.schoolId}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        gradeLevel: Number(form.gradeLevel),
        section: form.section || undefined,
        teacherId: form.teacherId || undefined,
      }),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(data.error || 'Failed to create class.'); return; }
    setShowModal(false);
    setForm({ name: '', gradeLevel: '9', section: '', teacherId: '' });
    await load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-gold-400 text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Classes</h1>
        <span className="text-sm text-gray-400">{classes.length} total</span>
        <button
          onClick={() => { setShowModal(true); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Class
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-1/3" />
            </div>
          ))
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No classes yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first class to get started.</p>
          </div>
        ) : classes.map((c) => (
          <div key={c.id} className="bg-white/5 border border-white/10 hover:border-yellow-500/40 rounded-2xl p-5 space-y-3 transition-colors">
            <div>
              <h3 className="font-bold text-white text-lg">{c.name}</h3>
              <p className="text-sm text-gray-400">Grade {c.gradeLevel}{c.section ? ` · Section ${c.section}` : ''}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{c._count?.enrollments ?? 0} students</span>
              {c.teacher ? (
                <span className="text-cyan-400 text-xs">{c.teacher.name}</span>
              ) : (
                <span className="text-gray-600 text-xs">No teacher assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">New Class</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Class Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Grade 9A"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Grade *</label>
                  <select value={form.gradeLevel} onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    {[6,7,8,9,10,11,12].map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Section</label>
                  <input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Assign Teacher</label>
                <select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option value="">No teacher (assign later)</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm font-semibold rounded-xl hover:bg-white/10">Cancel</button>
              <button onClick={createClass} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Creating…' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify at /school/classes — create a class, confirm it appears in the grid with grade + teacher info**

- [ ] **Step 3: Commit**

```bash
git add app/(authed)/school/classes/page.tsx
git commit -m "feat: create school classes page with class grid and Create Class modal"
```

---

### Task 9: Teacher Add Student page — show credential ticket after creation

**Files:**
- Modify: `app/(authed)/teacher/add-student/page.tsx`

The current form requires the teacher to manually type a password and optional studentId. Replace with auto-generation: teacher enters name + class only, system generates studentId + PIN, result shown in CredentialTicket.

- [ ] **Step 1: Replace app/(authed)/teacher/add-student/page.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import CredentialTicket from '../../../components/ui/CredentialTicket';

type ClassItem = { id: string; name: string; gradeLevel: number; section?: string | null };
type CreatedStudent = { name: string; studentId: string; pin: string };

export default function AddStudentPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState({ name: '', classId: '', rollNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedStudent | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/classes/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.classId) { setError('Name and class are required.'); return; }
    setSubmitting(true); setError(''); setCreated(null);
    const r = await fetch('/api/users/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: form.name.trim(), classId: form.classId, rollNumber: form.rollNumber || undefined }),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(data.message || data.error || 'Failed to add student.'); return; }
    setCreated({ name: data.name, studentId: data.studentId, pin: data.pin });
    setForm({ name: '', classId: form.classId, rollNumber: '' }); // keep class selected for quick multi-add
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-brand-primary" /> ADD STUDENT
      </h1>

      <section className="card p-6 space-y-4">
        <p className="text-sm text-text-secondary">Fill in the student's details. Login credentials (Student ID + PIN) are generated automatically.</p>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">FULL NAME *</label>
          <input type="text" className="input" placeholder="Student full name"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">CLASS *</label>
          <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="input">
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''} · Grade {c.gradeLevel}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">ROLL NUMBER (OPTIONAL)</label>
          <input type="text" className="input" placeholder="e.g. 2024001"
            value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button onClick={submit} disabled={!form.name.trim() || !form.classId || submitting}
          className="btn btn-primary btn-block flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" />
          {submitting ? 'ADDING…' : 'ADD STUDENT'}
        </button>
      </section>

      {created && (
        <section className="card p-6 space-y-3">
          <p className="font-bold text-accent-green">✓ Student "{created.name}" added!</p>
          <p className="text-sm text-text-secondary">Hand these credentials to the student. The PIN cannot be recovered — ask them to remember it.</p>
          <CredentialTicket
            title="Student Login Credentials"
            credentials={[
              { label: 'Student ID', value: created.studentId },
              { label: 'PIN', value: created.pin },
            ]}
            note="The PIN is shown only once and stored encrypted. Cannot be recovered — only reset."
          />
          <button onClick={() => setCreated(null)} className="text-xs text-text-secondary hover:text-text-primary underline">Add another student</button>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Log in as a teacher, go to Add Student, add a student with name + class**

Expected: credential ticket appears with auto-generated studentId (e.g. `GRE001`) and 4-digit PIN.

- [ ] **Step 3: Verify student can log in using those credentials**

On the login page, select Student role, enter the generated studentId and PIN. Should successfully log in and reach the student dashboard.

- [ ] **Step 4: Commit**

```bash
git add app/(authed)/teacher/add-student/page.tsx
git commit -m "feat: teacher add-student — auto-generated studentId+PIN with credential ticket display"
```

---

## Phase C — Gamification Feedback Loop

### Task 10: Add XP float animation CSS + LevelUpModal component

**Files:**
- Modify: `app/globals.css`
- Create: `app/components/student/LevelUpModal.tsx`

- [ ] **Step 1: Add animation keyframes to app/globals.css**

Append to the end of `app/globals.css`:

```css
/* ── Gamification animations ───────────────────────────────────────────── */

@keyframes xp-float {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  60%  { opacity: 1; transform: translateY(-40px) scale(1.15); }
  100% { opacity: 0; transform: translateY(-80px) scale(0.9); }
}
.animate-xp-float {
  animation: xp-float 1.8s ease-out forwards;
  pointer-events: none;
  position: absolute;
  z-index: 50;
}

@keyframes level-burst {
  0%   { transform: scale(0.5); opacity: 0; }
  50%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-level-burst { animation: level-burst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

@keyframes particle-pop {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
.animate-particle { animation: particle-pop 0.8s ease-out forwards; }

@keyframes toast-in {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
@keyframes toast-out {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(110%); opacity: 0; }
}
.animate-toast-in  { animation: toast-in  0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.animate-toast-out { animation: toast-out 0.3s ease-in forwards; }
```

- [ ] **Step 2: Create app/components/student/LevelUpModal.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

type Props = {
  prevLevel: number;
  newLevel: number;
  levelTitle?: string;
  onDismiss: () => void;
};

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * 2 * Math.PI;
  const dist = 80 + Math.random() * 60;
  return {
    tx: `${Math.cos(angle) * dist}px`,
    ty: `${Math.sin(angle) * dist}px`,
    color: ['#6B4BFF', '#18D6FF', '#FFC93C', '#10B981'][i % 4],
    delay: `${Math.random() * 0.3}s`,
    size: 6 + Math.random() * 8,
  };
});

export default function LevelUpModal({ prevLevel, newLevel, levelTitle, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) { onDismiss(); return null; }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={() => { setVisible(false); onDismiss(); }}
    >
      <div className="relative flex flex-col items-center gap-6 animate-level-burst select-none">
        {/* Particle burst */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-particle"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                '--tx': p.tx,
                '--ty': p.ty,
                animationDelay: p.delay,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Badge */}
        <div className="relative">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_60px_rgba(107,75,255,0.7)]">
            <div className="text-center">
              <p className="text-xs font-bold text-violet-200 uppercase tracking-widest mb-0.5">Level</p>
              <p className="text-6xl font-black text-white leading-none">{newLevel}</p>
            </div>
          </div>
          <div className="absolute -top-2 -right-2">
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest">Level Up!</p>
          <p className="text-4xl font-black text-white tracking-tight">
            {prevLevel} → {newLevel}
          </p>
          {levelTitle && (
            <p className="text-violet-300 text-lg font-semibold">{levelTitle}</p>
          )}
        </div>

        <p className="text-gray-500 text-sm animate-pulse">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify animations compile — open any student page and temporarily add `<LevelUpModal prevLevel={4} newLevel={5} levelTitle="Scholar" onDismiss={() => {}} />` to the page to see the modal**

Remove the test import after verifying.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/components/student/LevelUpModal.tsx
git commit -m "feat: add XP float + level-up modal CSS animations and LevelUpModal component"
```

---

### Task 11: Achievement Toast system — context + renderer + student layout

**Files:**
- Create: `app/contexts/AchievementToastContext.tsx`
- Create: `app/components/student/AchievementToasts.tsx`
- Create: `app/(authed)/student/layout.tsx`

- [ ] **Step 1: Create app/contexts/AchievementToastContext.tsx**

```tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'xp' | 'coins' | 'badge' | 'quest' | 'streak';

export type AchievementToast = {
  id: string;
  type: ToastType;
  title: string;
  subtitle?: string;
  amount?: number;
  removing?: boolean;
};

type ContextValue = {
  toasts: AchievementToast[];
  addToast: (t: Omit<AchievementToast, 'id'>) => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  addBadge: (name: string) => void;
  addQuest: (name: string, reward: string) => void;
  addStreak: (days: number) => void;
  removeToast: (id: string) => void;
};

const AchievementToastContext = createContext<ContextValue>({
  toasts: [],
  addToast: () => {},
  addXP: () => {},
  addCoins: () => {},
  addBadge: () => {},
  addQuest: () => {},
  addStreak: () => {},
  removeToast: () => {},
});

export function useAchievementToast() {
  return useContext(AchievementToastContext);
}

export function AchievementToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AchievementToast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
  }, []);

  const addToast = useCallback((t: Omit<AchievementToast, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]); // max 3 visible
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const addXP    = useCallback((amount: number) => addToast({ type: 'xp',     title: `+${amount} XP`,    amount }), [addToast]);
  const addCoins = useCallback((amount: number) => addToast({ type: 'coins',  title: `+${amount} Coins`, amount }), [addToast]);
  const addBadge = useCallback((name: string)   => addToast({ type: 'badge',  title: 'Badge Unlocked!',  subtitle: name }), [addToast]);
  const addQuest = useCallback((name: string, reward: string) =>
    addToast({ type: 'quest', title: 'Quest Complete!', subtitle: `${name} · ${reward}` }), [addToast]);
  const addStreak = useCallback((days: number)  => addToast({ type: 'streak', title: `${days}-Day Streak!`, subtitle: 'Keep it up!' }), [addToast]);

  return (
    <AchievementToastContext.Provider value={{ toasts, addToast, addXP, addCoins, addBadge, addQuest, addStreak, removeToast }}>
      {children}
    </AchievementToastContext.Provider>
  );
}
```

- [ ] **Step 2: Create app/components/student/AchievementToasts.tsx**

```tsx
'use client';

import { useAchievementToast } from '../../contexts/AchievementToastContext';
import { X, Zap, Coins, Star, Trophy, Flame } from 'lucide-react';

const CONFIG = {
  xp:     { icon: Zap,    bg: 'from-violet-600 to-violet-800',  border: 'border-violet-400/40', small: true },
  coins:  { icon: Coins,  bg: 'from-yellow-500 to-amber-700',   border: 'border-yellow-400/40', small: true },
  badge:  { icon: Star,   bg: 'from-cyan-600 to-cyan-800',      border: 'border-cyan-400/40',   small: false },
  quest:  { icon: Trophy, bg: 'from-emerald-600 to-emerald-800',border: 'border-emerald-400/40',small: false },
  streak: { icon: Flame,  bg: 'from-orange-500 to-red-700',     border: 'border-orange-400/40', small: false },
};

export default function AchievementToasts() {
  const { toasts, removeToast } = useAchievementToast();
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const cfg = CONFIG[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 bg-gradient-to-r ${cfg.bg} border ${cfg.border} rounded-2xl shadow-2xl
              ${cfg.small ? 'px-4 py-2.5' : 'px-4 py-3'}
              ${toast.removing ? 'animate-toast-out' : 'animate-toast-in'}`}
          >
            <div className="shrink-0 w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{toast.title}</p>
              {toast.subtitle && <p className="text-white/70 text-xs truncate">{toast.subtitle}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create app/(authed)/student/layout.tsx**

```tsx
import { AchievementToastProvider } from '../../../contexts/AchievementToastContext';
import AchievementToasts from '../../../components/student/AchievementToasts';
import { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AchievementToastProvider>
      {children}
      <AchievementToasts />
    </AchievementToastProvider>
  );
}
```

- [ ] **Step 4: Verify toasts render — temporarily add this to app/(authed)/student/page.tsx to test**

```tsx
// Add at top: import { useAchievementToast } from '../../../contexts/AchievementToastContext';
// Inside the component:
const { addXP, addCoins, addBadge } = useAchievementToast();
// In JSX somewhere:
<button onClick={() => addXP(25)}>Test XP Toast</button>
<button onClick={() => addBadge('Math Master')}>Test Badge Toast</button>
```

Expected: clicking the buttons shows animated toast pills sliding in from the right. Remove the test buttons after verifying.

- [ ] **Step 5: Commit**

```bash
git add app/contexts/AchievementToastContext.tsx app/components/student/AchievementToasts.tsx app/(authed)/student/layout.tsx
git commit -m "feat: achievement toast system — context, queue, animated renderer, student layout"
```

---

### Task 12: Wire MathDungeonGame result to toasts + level-up modal

**Files:**
- Modify: `app/components/games/MathDungeonGame.tsx`

The game already starts a session with `/api/games/start` and calls `/api/games/complete` in `claimReward()`. The API response includes `{ rewards, level, newTotals, questsCompleted }`. We need to:
1. Read `level` from the API response vs the user's current level to detect level-up.
2. Call toast hooks after a successful claim.
3. Show `LevelUpModal` if level increased.

The component needs two new optional props: `onRewardClaimed` (to notify the parent) — or use the toast context directly by calling `useAchievementToast()` inside the component. We'll use the context directly since MathDungeonGame is always rendered inside the student layout.

- [ ] **Step 1: Add imports and hooks to MathDungeonGame.tsx**

Find the import block at the top (lines 1–5) and add:

```tsx
import { useAchievementToast } from '../../contexts/AchievementToastContext';
import LevelUpModal from './LevelUpModal';
```

Wait — `LevelUpModal` is at `app/components/student/LevelUpModal.tsx` and `MathDungeonGame` is at `app/components/games/MathDungeonGame.tsx`, so the import is `'../student/LevelUpModal'`.

- [ ] **Step 2: Add the `useAchievementToast` hook and level-up state inside the MathDungeonGame component**

Find the existing state declarations (around line 57–59):

```tsx
const [result, setResult] = useState<GameResult | null>(null);
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
```

Add directly below:

```tsx
const [levelUp, setLevelUp] = useState<{ prev: number; next: number } | null>(null);
const { addXP, addCoins, addQuest } = useAchievementToast();
```

- [ ] **Step 3: Replace the claimReward function in MathDungeonGame.tsx**

Find the existing `claimReward` function (lines 309–336) and replace it entirely with:

```tsx
const claimReward = async () => {
  if (!result || saving || saved) return;
  setSaving(true);
  try {
    const sessionId = sessionIdRef.current;
    if (sessionId) {
      const r = await fetch('/api/games/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          score: result.score,
          questionsAttempted: result.questionsAttempted,
          questionsCorrect: result.questionsCorrect,
          durationSec: result.durationSec,
          starsEarned: result.stars,
          outcome: result.won ? 'won' : 'lost',
        }),
      });
      if (r.ok) {
        const data = await r.json();
        // Fire achievement toasts
        if (data.rewards?.xp > 0)    addXP(data.rewards.xp);
        if (data.rewards?.coins > 0) addCoins(data.rewards.coins);
        if (Array.isArray(data.questsCompleted)) {
          data.questsCompleted.forEach((q: { key: string; rewardXp?: number; rewardCoins?: number }) => {
            addQuest(q.key, q.rewardXp ? `+${q.rewardXp} XP` : q.rewardCoins ? `+${q.rewardCoins} coins` : 'Reward claimed!');
          });
        }
        // Detect level-up: compare previous level (from result local calc) vs server level
        const prevLevel = Math.floor(result.xp / 100) + 1; // rough local estimate
        if (data.level && data.level > prevLevel) {
          setLevelUp({ prev: prevLevel, next: data.level });
        }
      }
    }
    setSaved(true);
  } catch {
    setSaved(true);
  } finally {
    setSaving(false);
  }
};
```

- [ ] **Step 4: Add the LevelUpModal render to MathDungeonGame's return statement**

Find the return statement of MathDungeonGame (around line 338). It starts with `<div className="flex flex-col h-full bg-[#0f0f23] relative">`. Add the modal just before the closing div:

```tsx
{levelUp && (
  <LevelUpModal
    prevLevel={levelUp.prev}
    newLevel={levelUp.next}
    onDismiss={() => setLevelUp(null)}
  />
)}
```

- [ ] **Step 5: Import LevelUpModal at the top of MathDungeonGame.tsx**

Add to the import block at lines 1–5:

```tsx
import { useAchievementToast } from '../../contexts/AchievementToastContext';
import LevelUpModal from '../student/LevelUpModal';
```

- [ ] **Step 6: Verify end-to-end — log in as a student, play Math Dungeon, complete the game, click "Claim Rewards"**

Expected:
- XP toast slides in from top-right: "+45 XP"
- Coins toast slides in: "+11 Coins"
- If level increased, full-screen level-up modal appears
- "✓ Rewards claimed!" button appears in the result overlay

- [ ] **Step 7: Update docs/MASTER_PLAN.md**

Mark the following as `[x]` in MASTER_PLAN.md:
- Phase 1: 1.1 through 1.5 items (all completed)
- Phase 2: 2.1 (Achievement Toast System), 2.2 (XP Float), 2.3 (Level-Up Full Screen), 2.6 (Game result wired to DB)

Update the Session Log with today's date and summary.

- [ ] **Step 8: Commit**

```bash
git add app/components/games/MathDungeonGame.tsx docs/MASTER_PLAN.md
git commit -m "feat: wire Math Dungeon result to achievement toasts and level-up modal"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Admin creates school + school admin account | Task 1 (backend) + Task 6 (UI) |
| School admin creates teacher + shows credentials | Task 2 (backend) + Task 7 (UI) |
| School admin creates class, assigns teacher | Task 3 (backend) + Task 8 (UI) |
| Teacher adds student → auto-generated studentId + PIN | Task 4 (backend) + Task 9 (UI) |
| Credential ticket (copy-able, shown once) | Task 5 |
| Achievement toast system (XP, coins, badge, quest) | Task 11 |
| XP float animation CSS | Task 10 |
| Level-up full-screen modal | Task 10 |
| Game result wired to real DB awards | Task 12 |
| docs/MASTER_PLAN.md updated after completion | Task 12, Step 7 |

**Placeholder scan:** No TBD/TODO placeholders in code steps. All code is complete and typed.

**Type consistency:**
- `AchievementToast.type` is `'xp' | 'coins' | 'badge' | 'quest' | 'streak'` — consistent across context, renderer, and callers.
- `CredentialTicket` props `{ title, credentials, note? }` — used identically in Tasks 6, 7, 9.
- `LevelUpModal` props `{ prevLevel, newLevel, levelTitle?, onDismiss }` — consistent between Task 10 definition and Task 12 usage.
- `claimReward` reads `data.rewards.xp`, `data.rewards.coins`, `data.level`, `data.questsCompleted` — matches the `/api/games/complete` response shape in `server/routes/games.js` line 131–143.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-02-startup-mvp-sprint.md`.
