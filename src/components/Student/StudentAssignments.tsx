import React, { useEffect, useMemo, useState } from 'react';
import { listTasks, TaskItem } from '../../utils/mockData';
import { Link } from 'react-router-dom';

export function StudentAssignments() {
  const [items, setItems] = useState<TaskItem[]>([]);

  useEffect(() => {
    const all = listTasks();
    setItems(all.filter(t => t.type === 'assignment'));
  }, []);

  const now = Date.now();
  const upcoming = useMemo(() => {
    return items
      .filter(t => new Date(t.dueDate).getTime() >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [items, now]);

  const recentlyCompleted = useMemo(() => {
    return items
      .filter(t => new Date(t.dueDate).getTime() < now)
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 3);
  }, [items, now]);

  function formatCountdown(dueISO: string) {
    const ms = new Date(dueISO).getTime() - now;
    if (ms <= 0) return 'Due';
    const totalMins = Math.floor(ms / 60000);
    const days = Math.floor(totalMins / (60 * 24));
    const hours = Math.floor((totalMins % (60 * 24)) / 60);
    const mins = totalMins % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  function progressUntilDue(dueISO: string) {
    const due = new Date(dueISO).getTime();
    const start = due - 3 * 24 * 60 * 60 * 1000;
    const pct = Math.max(0, Math.min(100, ((now - start) / (due - start)) * 100));
    return isNaN(pct) ? 0 : pct;
  }

  const isEmpty = items.length === 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
        {!isEmpty && (
          <Link to="/lessons/science/chapter1" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">Explore Lessons →</Link>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <div className="aspect-[4/3] w-full rounded-lg bg-gradient-to-br from-amber-50 via-indigo-50 to-sky-50 border border-gray-100 flex items-center justify-center">
                <div className="text-6xl select-none">📝</div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments assigned!</h3>
              <p className="text-gray-600 mb-4">Use this time to revise a topic or challenge yourself with a quick quiz.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/quizzes" className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow">Go to Quizzes</Link>
                <Link to="/lessons/science/chapter1" className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:border-indigo-500 hover:text-indigo-700">Open Lessons</Link>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Upcoming assignments</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0,1,2].map((i) => (
                <div key={i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-500">Placeholder</div>
                  <div className="font-medium text-gray-900">Science project outline</div>
                  <div className="text-xs text-gray-500 mb-2">Due next week</div>
                  <div className="w-full h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-indigo-500 rounded" style={{ width: `${25 + i*10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming assignments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-gray-500">{new Date(item.dueDate).toLocaleDateString()}</div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{item.description}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">{formatCountdown(item.dueDate)}</div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 rounded">
                        <div className="h-2 bg-indigo-600 rounded" style={{ width: `${progressUntilDue(item.dueDate)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(item.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentlyCompleted.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recently completed</h3>
              <div className="flex flex-col gap-3">
                {recentlyCompleted.map(item => (
                  <div key={item.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Completed</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


