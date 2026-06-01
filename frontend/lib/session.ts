import { v4 as uuidv4 } from 'uuid';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('syncwatch_session_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('syncwatch_session_id', id);
  }
  return id;
}

export function getStoredName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('syncwatch_name') || '';
}

export function storeName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('syncwatch_name', name);
}
