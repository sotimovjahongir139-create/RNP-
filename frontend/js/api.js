const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('rnp_token');
  const res = await fetch(API_BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('rnp_token');
    location.reload();
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Xato yuz berdi');
  }
  return res.json();
}

const API = {
  login:      (u, p)         => apiFetch('/auth/login',  { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  logout:     ()             => apiFetch('/auth/logout', { method: 'POST' }),
  me:         ()             => apiFetch('/auth/me'),
  getParams:  ()             => apiFetch('/data/params'),
  getFacts:   (date)         => apiFetch(`/data/facts?date=${date}`),
  saveFact:   (body)         => apiFetch('/data/facts',  { method: 'POST', body: JSON.stringify(body) }),
  deleteFact: (id)           => apiFetch(`/data/facts/${id}`, { method: 'DELETE' }),
  getSummary: (period, date) => apiFetch(`/data/summary?period=${period}&date=${date}`),
};
