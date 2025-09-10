import React, { useState } from 'react';
import { addTask } from '../../utils/mockData';

export function TeacherAssignAssignments() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({ type: 'assignment', title, description, dueDate });
    setMessage('Assignment created successfully');
    setTitle('');
    setDescription('');
    setDueDate('');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Assign Assignments</h2>
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="as-title" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input id="as-title" value={title} onChange={e=>setTitle(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="as-desc" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea id="as-desc" value={description} onChange={e=>setDescription(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="as-due" className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input id="as-due" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}


