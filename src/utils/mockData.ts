// Simple localStorage-backed mock store for assignments/homework and events

export type TaskItem = {
  id: string;
  type: 'homework' | 'assignment';
  title: string;
  description: string;
  dueDate: string; // ISO
};

export type SchoolEvent = {
  id: string;
  name: string;
  date: string; // ISO
  description: string;
};

const TASKS_KEY = 'mock_tasks';
const EVENTS_KEY = 'mock_events';

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function addTask(task: Omit<TaskItem, 'id'>): TaskItem {
  const current = read<TaskItem>(TASKS_KEY);
  const newItem: TaskItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...task };
  current.push(newItem);
  write(TASKS_KEY, current);
  return newItem;
}

export function listTasks(): TaskItem[] {
  return read<TaskItem>(TASKS_KEY);
}

export function addEvent(event: Omit<SchoolEvent, 'id'>): SchoolEvent {
  const current = read<SchoolEvent>(EVENTS_KEY);
  const newItem: SchoolEvent = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...event };
  current.push(newItem);
  write(EVENTS_KEY, current);
  return newItem;
}

export function listEvents(): SchoolEvent[] {
  return read<SchoolEvent>(EVENTS_KEY);
}


