// ─── API SERVICE ──────────────────────────────────────────────
const BASE = '/api';

function getToken() { return localStorage.getItem('sw_token'); }
function setToken(t) { localStorage.setItem('sw_token', t); }
function clearToken() { localStorage.removeItem('sw_token'); localStorage.removeItem('sw_user'); }
function getUser() { try { return JSON.parse(localStorage.getItem('sw_user')); } catch { return null; } }
function setUser(u) { localStorage.setItem('sw_user', JSON.stringify(u)); }

async function request(method, path, body, params) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k,v]) => v != null && v !== '' && url.searchParams.append(k, v));
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`);
  return json.data ?? json;
}

export const api = {
  // Auth
  login:    (email, password) => request('POST', '/auth/login', { email, password }),
  register: (firstName, lastName, email, password) => request('POST', '/auth/register', { firstName, lastName, email, password }),

  // User
  getMe:           () => request('GET', '/users/me'),
  updateProfile:   (firstName, lastName) => request('PUT', '/users/me', { firstName, lastName }),
  changePassword:  (oldPassword, newPassword) => request('PUT', '/users/me/password', { oldPassword, newPassword }),

  // Expenses
  getExpenses: (p={}) => request('GET', '/expenses', null, p),
  getExpense:  (id)   => request('GET', `/expenses/${id}`),
  createExpense:(b)   => request('POST', '/expenses', b),
  updateExpense:(id,b)=> request('PUT', `/expenses/${id}`, b),
  deleteExpense:(id)  => request('DELETE', `/expenses/${id}`),

  // Categories
  getCategories:  ()    => request('GET',  '/categories'),
  createCategory: (b)   => request('POST', '/categories', b),
  updateCategory: (id,b)=> request('PUT',  `/categories/${id}`, b),
  deleteCategory: (id)  => request('DELETE',`/categories/${id}`),

  // Budgets
  getBudgets:   ()    => request('GET',    '/budgets'),
  getBudget:    (id)  => request('GET',    `/budgets/${id}`),
  createBudget: (b)   => request('POST',   '/budgets', b),
  updateBudget: (id,b)=> request('PUT',    `/budgets/${id}`, b),
  deleteBudget: (id)  => request('DELETE', `/budgets/${id}`),

  // Reports
  getMonthly:    (month, year)       => request('GET', '/reports/monthly', null, { month, year }),
  getYearly:     (year)              => request('GET', '/reports/yearly',  null, { year }),
  getByCategory: (from, to)          => request('GET', '/reports/by-category', null, { from, to }),
  getTopCategories:(from, to, limit) => request('GET', '/reports/top-categories', null, { from, to, limit }),

  // Admin
  adminGetUsers:          ()                  => request('GET',  '/admin/users'),
  adminUpdateRole:        (id, role)          => request('PUT',  `/admin/users/${id}/role`, { role }),
  adminGetAllExpenses:    ()                  => request('GET',  '/admin/expenses'),
  adminCreateCategory:    (userId, body)      => request('POST', `/admin/users/${userId}/categories`, body),
  adminCreateBudget:      (userId, body)      => request('POST', `/admin/users/${userId}/budgets`, body),
};

export { getToken, setToken, clearToken, getUser, setUser };
