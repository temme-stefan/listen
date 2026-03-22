import type { Card, MetaResult, ListConfig } from './types';

let _token: string | null = sessionStorage.getItem('auth_token');

export function setToken(t: string) {
  _token = t;
  sessionStorage.setItem('auth_token', t);
}

export function clearToken() {
  _token = null;
  sessionStorage.removeItem('auth_token');
}

export function hasToken(): boolean {
  return !!_token;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.reload();
  }
  return res;
}

export async function login(password: string): Promise<string> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, list: '_' }),
  });
  if (!res.ok) throw new Error('Falsches Passwort');
  const data = await res.json();
  setToken(data.token);
  return data.token;
}

export async function fetchListsConfig(): Promise<ListConfig[]> {
  const res = await apiFetch('/api/lists-config');
  return res.json();
}

export async function saveListsConfig(configs: ListConfig[]): Promise<void> {
  await apiFetch('/api/lists-config', {
    method: 'PUT',
    body: JSON.stringify(configs),
  });
}

export async function fetchList(name: string): Promise<Card[]> {
  const res = await apiFetch(`/api/lists/${name}`);
  return res.json();
}

export async function saveList(name: string, cards: Card[]): Promise<void> {
  await apiFetch(`/api/lists/${name}`, {
    method: 'PUT',
    body: JSON.stringify(cards),
  });
}

export async function fetchMeta(url: string): Promise<MetaResult> {
  const res = await apiFetch('/api/meta', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function downloadImage(listName: string, imageUrl: string, title: string, index: number): Promise<string> {
  const res = await apiFetch(`/api/images/${listName}`, {
    method: 'POST',
    body: JSON.stringify({ url: imageUrl, title, index }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.filename;
}

export async function uploadImage(listName: string, file: File, title: string, index: number): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  form.append('title', title);
  form.append('index', String(index));

  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`/api/images/${listName}`, { method: 'POST', headers, body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.filename;
}

export async function deployList(name: string): Promise<void> {
  const res = await apiFetch(`/api/deploy/${name}`, { method: 'POST' });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
}

export async function listExists(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/listen/${name}/index.html`, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

