import React, { useState } from 'react';

interface AddStudentProps {
  onSuccess?: (student: { id: string; name: string; email: string; class: string | null }) => void;
}

export function AddStudent({ onSuccess }: AddStudentProps) {
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState<string>('10');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, class: studentClass, email, password })
      });
      if (!res.ok) throw new Error('Failed to add student');
      const json = await res.json();
      setMessage('Student added successfully');
      setName('');
      setStudentClass('10');
      setEmail('');
      setPassword('');
      onSuccess && onSuccess(json);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const classes = Array.from({ length: 7 }, (_, i) => (i + 6).toString());

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Student</h2>
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Password (optional)</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Leave empty to auto-generate" />
          </div>
          <div className="flex items-center space-x-3">
            <button disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loading ? 'Adding...' : 'Add Student'}
            </button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}


