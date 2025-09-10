import React, { useState } from 'react';
import { addEvent } from '../../utils/mockData';

export function SchoolAddEvents() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({ name, date, description });
    setMessage('Event added successfully');
    setName('');
    setDate('');
    setDescription('');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Events</h2>
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ev-name" className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
            <input id="ev-name" value={name} onChange={e=>setName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="ev-date" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input id="ev-date" type="date" value={date} onChange={e=>setDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="ev-desc" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea id="ev-desc" value={description} onChange={e=>setDescription(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Event</button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}


