const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  notes: {
    list: (params = {}) => req('GET', `/notes?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/notes/${id}`),
    create: (data) => req('POST', '/notes', data),
    update: (id, data) => req('PUT', `/notes/${id}`, data),
    star: (id) => req('POST', `/notes/${id}/star`),
    trash: (id) => req('POST', `/notes/${id}/trash`),
    delete: (id) => req('DELETE', `/notes/${id}`),
  },
  notebooks: {
    list: () => req('GET', '/notebooks'),
    create: (name) => req('POST', '/notebooks', { name }),
    update: (id, name) => req('PUT', `/notebooks/${id}`, { name }),
    delete: (id) => req('DELETE', `/notebooks/${id}`),
  },
  tags: {
    list: () => req('GET', '/tags'),
    delete: (id) => req('DELETE', `/tags/${id}`),
  },
};
