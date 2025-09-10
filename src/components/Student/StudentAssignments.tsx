import React, { useEffect, useState } from 'react';
import { listTasks, TaskItem } from '../../utils/mockData';

export function StudentAssignments() {
  const [items, setItems] = useState<TaskItem[]>([]);

  useEffect(() => {
    const all = listTasks();
    setItems(all.filter(t => t.type === 'assignment'));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignments</h2>
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 overflow-x-auto">
        {items.length === 0 ? (
          <p className="text-gray-700">No assignments yet.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}


