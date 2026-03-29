const NOTIFIED_KEY = 'dailytodo_notified';

export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

function getNotifiedSet() {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markNotified(id) {
  const set = getNotifiedSet();
  set.add(id);
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

export function checkAndNotify(todos) {
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  const windowMs = 10 * 60 * 1000; // 10 minutes ahead
  const notified = getNotifiedSet();

  todos.forEach(todo => {
    if (todo.completed || !todo.dueDate || notified.has(todo.id)) return;
    const dueStr = todo.dueDate + 'T' + (todo.dueTime || '23:59:00');
    const due = new Date(dueStr);
    const diff = due - now;
    if (diff >= 0 && diff <= windowMs) {
      const minsLeft = Math.round(diff / 60000);
      new Notification(minsLeft <= 1 ? `Due now: ${todo.text}` : `Due in ${minsLeft}m: ${todo.text}`, {
        body: todo.notes || `Category: ${todo.category}`,
        icon: '/favicon.svg',
        tag: todo.id,
      });
      markNotified(todo.id);
    }
  });
}
