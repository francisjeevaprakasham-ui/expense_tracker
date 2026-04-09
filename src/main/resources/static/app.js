import { api, getToken, setToken, clearToken, getUser, setUser } from './api.js';
import {
  $, $$, h, money, formatDate, monthName, todayISO,
  toast, spinner, emptyState, openModal, confirm,
  createTagInput, colorPicker, CATEGORY_ICONS
} from './utils.js';

// ─── STATE ──────────────────────────────────────────────────────
let appRoot;
let chart1 = null, chart2 = null;
let activePage = 'dashboard';
let expFilters = { page: 0, size: 15, categoryId: '', from: '', to: '' };
let cachedCategories = [];
let budgetMonth = null, budgetYear = null;
let reportMonth = null, reportYear = null;

const PAGES = {
  dashboard:  { label: 'Dashboard',  icon: '📊' },
  expenses:   { label: 'Expenses',   icon: '💳' },
  categories: { label: 'Categories', icon: '📁' },
  budgets:    { label: 'Budgets',    icon: '🎯' },
  reports:    { label: 'Reports',    icon: '📈' },
};

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  appRoot = $('#app');
  checkAuthAndRender();
});

function checkAuthAndRender() {
  if (getToken()) {
    renderAppShell();
    navigateTo('dashboard');
  } else {
    renderAuth();
  }
}

// ─── AUTH VIEW ───────────────────────────────────────────────────
function renderAuth() {
  let isLogin = true;

  const renderForm = () => {
    appRoot.innerHTML = '';

    const nameRow = isLogin ? null : h('div', { class: 'form-row' },
      formGroup('First Name', 'text', 'f_firstName', 'John', true),
      formGroup('Last Name',  'text', 'f_lastName',  'Doe',  true)
    );

    const form = h('form', { onsubmit: handleAuth },
      ...(nameRow ? [nameRow] : []),
      formGroup('Email Address', 'email',    'f_email',    'john@example.com', true),
      formGroup('Password',      'password', 'f_password', '••••••••',          true),
      h('button', { class: 'btn btn-primary', type: 'submit', style: 'width:100%;margin-top:4px' },
        isLogin ? 'Sign In →' : 'Create Account →'
      )
    );

    const view = h('div', { id: 'auth-view' },
      h('div', { class: 'auth-card' },
        h('div', { class: 'auth-logo' },
          h('div', { class: 'auth-logo-icon' }, '💸'),
          h('div', { class: 'auth-logo-text' }, 'SpendWise')
        ),
        h('h1', { class: 'auth-title' },
          isLogin ? 'Welcome back' : 'Create your account'
        ),
        h('p', { class: 'auth-subtitle' },
          isLogin
            ? 'Sign in to manage your expenses and budgets.'
            : 'Join SpendWise to start tracking your finances.'
        ),
        h('div', { class: 'auth-tabs' },
          h('button', { class: `auth-tab ${isLogin ? 'active' : ''}`, type: 'button',
            onclick: () => { isLogin = true;  renderForm(); } }, 'Sign In'),
          h('button', { class: `auth-tab ${!isLogin ? 'active' : ''}`, type: 'button',
            onclick: () => { isLogin = false; renderForm(); } }, 'Register')
        ),
        form
      )
    );
    appRoot.appendChild(view);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const btn = $('button[type="submit"]', e.target);
    const orig = btn.textContent;
    btn.textContent = 'Please wait…';
    btn.disabled = true;
    try {
      if (isLogin) {
        const res = await api.login($('#f_email').value, $('#f_password').value);
        setToken(res.token);
        setUser(res.user);
        toast('Welcome back! 🎉', 'success');
        checkAuthAndRender();
      } else {
        const res = await api.register(
          $('#f_firstName').value, $('#f_lastName').value,
          $('#f_email').value, $('#f_password').value
        );
        setToken(res.token);
        setUser(res.user);
        toast('Account created! Welcome to SpendWise 🎉', 'success');
        checkAuthAndRender();
      }
    } catch (err) {
      toast(err.message || 'Authentication failed', 'error');
      btn.textContent = orig;
      btn.disabled = false;
    }
  };

  renderForm();
}

// ─── APP SHELL ───────────────────────────────────────────────────
function renderAppShell() {
  const user = getUser();
  appRoot.innerHTML = '';

  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'sidebar-logo' },
      h('div', { class: 'sidebar-logo-icon' }, '💸'),
      h('div', { class: 'sidebar-logo-label' }, 'SpendWise')
    ),
    h('div', { class: 'sidebar-section-label' }, 'Menu'),
    ...Object.entries(PAGES).map(([id, { label, icon }]) =>
      h('div', { class: 'nav-item', id: `nav-${id}`, onclick: () => navigateTo(id) },
        h('span', { class: 'nav-item-icon' }, icon), label
      )
    ),
    h('div', { class: 'sidebar-footer' },
      h('div', { class: 'user-chip' },
        h('div', { class: 'user-avatar' }, user?.firstName?.charAt(0)?.toUpperCase() || 'U'),
        h('div', { class: 'user-info' },
          h('div', { class: 'user-name' },
            `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'
          ),
          h('div', { class: 'user-email' }, user?.email || '')
        )
      ),
      h('button', {
        class: 'btn btn-ghost btn-sm',
        style: 'width:100%;margin-top:10px;justify-content:center',
        onclick: handleLogout
      }, '🚪 Sign Out')
    )
  );

  const main = h('main', { class: 'main-content' },
    h('div', { class: 'topbar' },
      h('div', { class: 'topbar-title', id: 'topbar-title' }, 'Dashboard'),
      h('div', { class: 'topbar-actions' },
        h('button', { class: 'btn btn-primary btn-sm', id: 'topbar-btn', onclick: () => {} },
          '+ Add'
        )
      )
    ),
    h('div', { class: 'page-body', id: 'page-container' })
  );

  appRoot.appendChild(h('div', { id: 'app-view' }, sidebar, main));
}

function handleLogout() {
  clearToken();
  appRoot.innerHTML = '';
  checkAuthAndRender();
}

function navigateTo(pageId) {
  activePage = pageId;
  $$('.nav-item').forEach(el => el.classList.remove('active'));
  $(`#nav-${pageId}`)?.classList.add('active');
  if ($('#topbar-title')) $('#topbar-title').textContent = PAGES[pageId]?.label || pageId;

  const c = $('#page-container');
  if (c) { c.innerHTML = ''; c.appendChild(spinner('spinner-lg')); }

  updateTopbarBtn(pageId);
  ({ dashboard: loadDashboard, expenses: loadExpenses,
     categories: loadCategories, budgets: loadBudgets,
     reports: loadReports })[pageId]?.();
}

function updateTopbarBtn(pageId) {
  const btn = $('#topbar-btn');
  if (!btn) return;
  const map = {
    dashboard:  ['+ Add Expense',   () => openExpenseModal(null,   () => loadDashboard())],
    expenses:   ['+ Add Expense',   () => openExpenseModal(null,   () => fetchAndRenderExpenses())],
    categories: ['+ Add Category',  () => openCategoryModal(null,  loadCategories)],
    budgets:    ['+ Add Budget',    () => openBudgetModal(null,    loadBudgets)],
    reports:    ['↻ Refresh',       () => loadReports()],
  };
  const [label, fn] = map[pageId] || ['+ Add', () => {}];
  btn.textContent = label;
  btn.onclick = fn;
}

// ─── HELPERS ─────────────────────────────────────────────────────
function formGroup(label, type, id, placeholder, required = false) {
  const attrs = { class: 'form-input', type, id, placeholder };
  if (required) attrs.required = 'true';
  return h('div', { class: 'form-group' },
    h('label', { class: 'form-label' }, label),
    h('input', attrs)
  );
}

function makeSelect(id, options, selectedVal, onChange) {
  const sel = h('select', { class: 'form-input form-select', id });
  options.forEach(opt => {
    const o = h('option', { value: String(opt.value ?? '') }, opt.label);
    if (String(opt.value ?? '') === String(selectedVal ?? '')) o.selected = true;
    sel.appendChild(o);
  });
  if (onChange) sel.addEventListener('change', e => onChange(e.target.value));
  return sel;
}

function statCard(label, value, sub, color, icon) {
  return h('div', { class: `stat-card ${color}` },
    h('div', { class: 'stat-header' },
      h('div', { class: 'stat-label' }, label),
      h('div', { class: `stat-icon ${color}` }, icon)
    ),
    h('div', { class: 'stat-value' }, String(value)),
    h('div', { class: 'stat-change' }, sub)
  );
}

function safeDestroyChart(c) {
  try { c?.destroy(); } catch (_) {}
  return null;
}

function catBadge(cat) {
  if (!cat) return h('span', { class: 'badge badge-gray' }, '—');
  const style = cat.color
    ? `background:${cat.color}20;color:${cat.color};border-color:${cat.color}40`
    : '';
  return h('span', { class: 'badge badge-gray', style },
    cat.icon ? `${cat.icon} ${cat.name}` : cat.name
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────
async function loadDashboard() {
  const c = $('#page-container');
  try {
    const d = new Date();
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();
    const pad   = n => String(n).padStart(2, '0');
    const from  = `${year}-${pad(month)}-01`;
    const to    = d.toISOString().slice(0, 10);

    const [monthly, expPage, budgets, catSp] = await Promise.all([
      api.getMonthly(month, year).catch(() => ({ totalSpent: 0, budgetLimit: 0, spentPercentage: 0 })),
      api.getExpenses({ page: 0, size: 8 }).catch(() => ({ content: [] })),
      api.getBudgets().catch(() => []),
      api.getByCategory(from, to).catch(() => ({ spending: {} })),
    ]);

    const totalSpent  = Number(monthly.totalSpent  ?? 0);
    const budgetLimit = Number(monthly.budgetLimit  ?? 0);
    const spentPct    = Number(monthly.spentPercentage ?? 0);
    const expenses    = expPage.content || [];
    const spending    = catSp.spending  || {};
    const monthBudgets = (Array.isArray(budgets) ? budgets : [])
      .filter(b => b.month === month && b.year === year);

    c.innerHTML = '';

    // ── Stats ──
    c.appendChild(h('div', { class: 'stats-grid animate-in' },
      statCard('Total Spent',    money(totalSpent),  `${monthName(month)} ${year}`, 'purple', '💳'),
      statCard('Budget Limit',   money(budgetLimit), 'All categories this month', 'cyan',   '🏦'),
      statCard('Remaining',
        money(Math.max(0, budgetLimit - totalSpent)),
        `${spentPct.toFixed(1)}% used`,
        spentPct > 90 ? 'amber' : 'green', '💰'
      ),
      statCard('Transactions',   expenses.length,    'Loaded (latest 8)',  'amber', '📝'),
    ));

    // ── Middle row: chart + budget progress ──
    const midRow = h('div', { class: 'grid-2 animate-in', style: 'animation-delay:.1s;margin-bottom:28px' },
      h('div', { class: 'card' },
        h('div', { class: 'section-header' },
          h('div', { class: 'section-title' }, `Spending by Category — ${monthName(month)}`)
        ),
        h('div', { class: 'chart-container' },
          h('canvas', { id: 'dash-cat-chart', height: '240' })
        )
      ),
      h('div', { class: 'card' },
        h('div', { class: 'section-header' },
          h('div', { class: 'section-title' }, 'Budget Progress'),
          h('span', { class: 'btn btn-ghost btn-sm', onclick: () => navigateTo('budgets') }, 'View All')
        ),
        h('div', { style: 'display:flex;flex-direction:column;gap:10px;max-height:270px;overflow-y:auto' },
          ...(monthBudgets.length
            ? monthBudgets.slice(0, 6).map(b => budgetBar(b, spending))
            : [emptyState('🎯', 'No budgets', `Nothing set for ${monthName(month)} ${year}.`)])
        )
      )
    );
    c.appendChild(midRow);

    // ── Recent transactions ──
    const table = h('div', { class: 'card animate-in', style: 'animation-delay:.2s' },
      h('div', { class: 'section-header' },
        h('div', { class: 'section-title' }, 'Recent Transactions'),
        h('span', { class: 'btn btn-ghost btn-sm', onclick: () => navigateTo('expenses') }, 'View All')
      ),
      expenses.length
        ? expTable(expenses, false)
        : emptyState('🏜️', 'No transactions', 'Start adding expenses to see them here.')
    );
    c.appendChild(table);

    // ── Charts ──
    requestAnimationFrame(() => initDoughnut('dash-cat-chart', spending));

  } catch (err) {
    c.innerHTML = '';
    c.appendChild(emptyState('❌', 'Error', err.message));
  }
}

function budgetBar(b, spendingMap = {}) {
  const spent = Number(spendingMap[b.category?.name] ?? 0);
  const limit = Number(b.monthlyLimit ?? 0);
  const pct   = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const fill  = pct > 90 ? 'danger' : pct > 70 ? 'warning' : '';
  return h('div', {},
    h('div', { class: 'budget-header' },
      h('div', { class: 'budget-name' },
        b.category?.icon ? `${b.category.icon} ` : '', b.category?.name || 'Unknown'
      ),
      h('div', { class: 'budget-amounts' },
        h('span', { class: 'budget-spent' }, money(spent)),
        h('span', { class: 'budget-limit' }, ` / ${money(limit)}`)
      )
    ),
    h('div', { class: 'progress-bar-wrap' },
      h('div', { class: `progress-bar-fill ${fill}`, style: `width:${pct}%` })
    )
  );
}

function initDoughnut(canvasId, spendingObj) {
  if (typeof Chart === 'undefined') return;
  const ctx = $(`#${canvasId}`);
  if (!ctx) return;
  chart1 = safeDestroyChart(chart1);
  const entries = Object.entries(spendingObj || {});
  const COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ec4899','#6366f1','#ef4444','#84cc16','#f97316'];
  chart1 = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.length ? entries.map(([k]) => k) : ['No Data'],
      datasets: [{
        data: entries.length ? entries.map(([, v]) => Number(v)) : [1],
        backgroundColor: entries.length ? COLORS : ['#252538'],
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: {
        legend: { position: 'right', labels: { color: '#c4c2d4', usePointStyle: true, boxWidth: 8, font: { size: 12 } } }
      }
    }
  });
}

// ─── EXPENSE TABLE (shared) ───────────────────────────────────────
function expTable(expenses, showActions, onSave) {
  return h('div', { class: 'table-wrapper' },
    h('table', {},
      h('thead', {}, h('tr', {},
        h('th', {}, 'Date'),
        h('th', {}, 'Category'),
        h('th', {}, 'Description'),
        h('th', { style: 'text-align:right' }, 'Amount'),
        ...(showActions ? [h('th', { style: 'text-align:center' }, 'Actions')] : [])
      )),
      h('tbody', {},
        ...expenses.map(e => h('tr', {},
          h('td', { class: 'td-muted' }, formatDate(e.date)),
          h('td', {}, catBadge(e.category)),
          h('td', {}, e.description || '—'),
          h('td', { style: 'text-align:right;font-weight:600' }, money(e.amount)),
          ...(showActions ? [h('td', { style: 'text-align:center' },
            h('div', { class: 'action-btns' },
              h('button', { class: 'btn btn-ghost btn-xs', onclick: () => openExpenseModal(e, onSave) }, '✏️'),
              h('button', { class: 'btn btn-danger-xs', onclick: () => deleteExpense(e.id, onSave) }, '🗑️')
            )
          )] : [])
        ))
      )
    )
  );
}

// ─── EXPENSES PAGE ────────────────────────────────────────────────
async function loadExpenses() {
  const c = $('#page-container');
  cachedCategories = await api.getCategories().catch(() => []);
  renderExpensesPage(c);
  await fetchAndRenderExpenses();
}

function renderExpensesPage(c) {
  c.innerHTML = '';
  const catOpts = [
    { value: '', label: 'All Categories' },
    ...cachedCategories.map(cat => ({ value: cat.id, label: `${cat.icon || ''} ${cat.name}` }))
  ];

  const filterBar = h('div', { class: 'filter-bar card animate-in' },
    h('div', { class: 'filter-group' },
      h('label', { class: 'form-label' }, 'Category'),
      makeSelect('fil-cat', catOpts, expFilters.categoryId, v => {
        expFilters.categoryId = v; expFilters.page = 0; fetchAndRenderExpenses();
      })
    ),
    h('div', { class: 'filter-group' },
      h('label', { class: 'form-label' }, 'From'),
      h('input', { class: 'form-input', type: 'date', id: 'fil-from', value: expFilters.from,
        onchange: e => { expFilters.from = e.target.value; expFilters.page = 0; fetchAndRenderExpenses(); } })
    ),
    h('div', { class: 'filter-group' },
      h('label', { class: 'form-label' }, 'To'),
      h('input', { class: 'form-input', type: 'date', id: 'fil-to', value: expFilters.to,
        onchange: e => { expFilters.to = e.target.value; expFilters.page = 0; fetchAndRenderExpenses(); } })
    ),
    h('button', { class: 'btn btn-ghost btn-sm', style: 'align-self:flex-end',
      onclick: () => {
        expFilters = { page: 0, size: 15, categoryId: '', from: '', to: '' };
        renderExpensesPage(c);
        fetchAndRenderExpenses();
      }
    }, '✕ Clear')
  );
  c.appendChild(filterBar);
  c.appendChild(h('div', { id: 'exp-area' }));
}

async function fetchAndRenderExpenses() {
  const area = $('#exp-area');
  if (!area) return;
  area.innerHTML = '';
  area.appendChild(spinner());
  try {
    const params = { page: expFilters.page, size: expFilters.size };
    if (expFilters.categoryId) params.categoryId = expFilters.categoryId;
    if (expFilters.from)       params.from = expFilters.from;
    if (expFilters.to)         params.to   = expFilters.to;

    const res  = await api.getExpenses(params);
    const rows = res.content || [];
    const totalEl = res.totalElements || 0;
    const totalPg = res.totalPages    || 1;
    area.innerHTML = '';

    if (!rows.length) {
      area.appendChild(h('div', { class: 'card' },
        emptyState('💳', 'No expenses found', 'Try different filters or add a new expense.')
      ));
      return;
    }

    const card = h('div', { class: 'card animate-in' },
      h('div', { class: 'section-header' },
        h('div', { class: 'section-title' }, `${totalEl} Expense${totalEl !== 1 ? 's' : ''}`)
      ),
      expTable(rows, true, fetchAndRenderExpenses)
    );

    if (totalPg > 1) {
      const prev = h('button', { class: 'btn btn-ghost btn-sm',
        onclick: () => { expFilters.page--; fetchAndRenderExpenses(); } }, '← Prev');
      prev.disabled = expFilters.page === 0;
      const next = h('button', { class: 'btn btn-ghost btn-sm',
        onclick: () => { expFilters.page++; fetchAndRenderExpenses(); } }, 'Next →');
      next.disabled = expFilters.page >= totalPg - 1;
      card.appendChild(h('div', { class: 'pagination' },
        prev,
        h('span', { class: 'pag-info' }, `Page ${expFilters.page + 1} of ${totalPg}`),
        next
      ));
    }

    area.appendChild(card);
  } catch (err) {
    area.innerHTML = '';
    area.appendChild(emptyState('❌', 'Error', err.message));
  }
}

async function openExpenseModal(expense, onSave) {
  if (!cachedCategories.length) {
    cachedCategories = await api.getCategories().catch(() => []);
  }
  const isEdit = !!expense;
  const catOpts = [
    { value: '', label: '— No Category —' },
    ...cachedCategories.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))
  ];

  const amtIn  = h('input', { class: 'form-input', type: 'number', step: '0.01', min: '0.01',
    id: 'em-amount', required: 'true', value: isEdit ? expense.amount : '', placeholder: '0.00' });
  const descIn = h('input', { class: 'form-input', type: 'text', id: 'em-desc',
    value: isEdit ? (expense.description || '') : '', placeholder: 'e.g. Grocery shopping' });
  const dateIn = h('input', { class: 'form-input', type: 'date', id: 'em-date',
    required: 'true', value: isEdit ? expense.date : todayISO() });
  const catSel = makeSelect('em-cat', catOpts, isEdit ? (expense.category?.id ?? '') : '');
  const { el: tagEl, getTags } = createTagInput(isEdit ? (expense.tags || []) : []);

  const body = h('div', { class: 'modal-body' },
    h('div', { class: 'form-row' },
      h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Amount *'), amtIn),
      h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Date *'),   dateIn)
    ),
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Description'), descIn),
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Category'),   catSel),
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Tags'),       tagEl)
  );

  const saveBtn = h('button', { class: 'btn btn-primary', onclick: async () => {
    if (!amtIn.value || !dateIn.value) { toast('Amount and date are required', 'error'); return; }
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const payload = {
        amount:      parseFloat(amtIn.value),
        description: descIn.value || null,
        date:        dateIn.value,
        categoryId:  catSel.value ? parseInt(catSel.value) : null,
        tags:        getTags()
      };
      if (isEdit) await api.updateExpense(expense.id, payload);
      else        await api.createExpense(payload);
      overlay.remove();
      toast(isEdit ? 'Expense updated!' : 'Expense added!', 'success');
      onSave?.();
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
    }
  } }, 'Save');

  const overlay = openModal(
    isEdit ? 'Edit Expense' : 'Add Expense',
    body,
    [h('button', { class: 'btn btn-ghost', onclick: () => overlay.remove() }, 'Cancel'), saveBtn]
  );
}

async function deleteExpense(id, onDelete) {
  confirm('Delete this expense? This action cannot be undone.', async () => {
    try {
      await api.deleteExpense(id);
      toast('Expense deleted', 'success');
      onDelete?.();
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ─── CATEGORIES PAGE ──────────────────────────────────────────────
async function loadCategories() {
  const c = $('#page-container');
  try {
    const cats = await api.getCategories();
    c.innerHTML = '';
    if (!cats.length) {
      c.appendChild(h('div', { class: 'card' },
        emptyState('📁', 'No Categories', 'Click "+ Add Category" to create your first category.')
      ));
      return;
    }
    const grid = h('div', { class: 'category-grid animate-in' });
    cats.forEach(cat => grid.appendChild(renderCatCard(cat)));
    c.appendChild(grid);
  } catch (err) {
    c.innerHTML = '';
    c.appendChild(emptyState('❌', 'Error', err.message));
  }
}

function renderCatCard(cat) {
  const color = cat.color || '#7c3aed';
  return h('div', { class: 'category-card', style: `border-top:3px solid ${color}` },
    h('div', { class: 'category-card-header' },
      h('div', { class: 'category-icon-wrap', style: `background:${color}20;color:${color}` },
        cat.icon || '📁'
      ),
      h('div', { class: 'category-actions' },
        h('button', { class: 'btn btn-ghost btn-xs', onclick: () => openCategoryModal(cat, loadCategories) }, '✏️'),
        h('button', { class: 'btn btn-danger-xs', onclick: () => deleteCategory(cat.id) }, '🗑️')
      )
    ),
    h('div', { class: 'category-name' }, cat.name),
    h('div', { class: 'category-desc' },
      h('span', { class: 'badge badge-gray', style: `background:${color}15;color:${color};border-color:${color}30` },
        cat.icon || '#'
      )
    )
  );
}

async function openCategoryModal(category, onSave) {
  const isEdit = !!category;
  const nameIn = h('input', { class: 'form-input', type: 'text', id: 'cm-name', required: 'true',
    value: isEdit ? category.name : '', placeholder: 'e.g. Food & Dining' });

  // Icon picker
  let selectedIcon = isEdit ? (category.icon || '🛒') : '🛒';
  const iconDisplay = h('div', { class: 'icon-preview', onclick: () => {
    iconGrid.style.display = iconGrid.style.display === 'none' ? 'flex' : 'none';
  } },
    h('span', { style: 'font-size:28px' }, selectedIcon),
    h('span', { class: 'icon-preview-hint' }, 'Click to change')
  );
  const iconGrid = h('div', { class: 'icon-grid', style: 'display:none' });
  CATEGORY_ICONS.forEach(ic => {
    const btn = h('button', { class: `icon-btn${ic === selectedIcon ? ' selected' : ''}`, type: 'button',
      onclick: () => {
        selectedIcon = ic;
        iconDisplay.querySelector('span').textContent = ic;
        $$('.icon-btn', iconGrid).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        iconGrid.style.display = 'none';
      }
    }, ic);
    iconGrid.appendChild(btn);
  });

  // Color picker
  const { el: cpEl, getColor } = colorPicker(isEdit ? category.color : undefined);

  const body = h('div', { class: 'modal-body' },
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Name *'), nameIn),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label' }, 'Icon'),
      iconDisplay, iconGrid
    ),
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Color'), cpEl)
  );

  const saveBtn = h('button', { class: 'btn btn-primary', onclick: async () => {
    if (!nameIn.value.trim()) { toast('Name is required', 'error'); return; }
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const payload = { name: nameIn.value.trim(), icon: selectedIcon, color: getColor() };
      if (isEdit) await api.updateCategory(category.id, payload);
      else        await api.createCategory(payload);
      overlay.remove();
      cachedCategories = []; // invalidate cache
      toast(isEdit ? 'Category updated!' : 'Category created!', 'success');
      onSave?.();
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
    }
  } }, 'Save');

  const overlay = openModal(
    isEdit ? 'Edit Category' : 'Add Category',
    body,
    [h('button', { class: 'btn btn-ghost', onclick: () => overlay.remove() }, 'Cancel'), saveBtn]
  );
}

async function deleteCategory(id) {
  confirm('Delete this category? Expenses in this category will become uncategorized.', async () => {
    try {
      await api.deleteCategory(id);
      cachedCategories = [];
      toast('Category deleted', 'success');
      loadCategories();
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ─── BUDGETS PAGE ─────────────────────────────────────────────────
async function loadBudgets() {
  const c = $('#page-container');
  const d = new Date();
  if (!budgetMonth) budgetMonth = d.getMonth() + 1;
  if (!budgetYear)  budgetYear  = d.getFullYear();

  try {
    const pad = n => String(n).padStart(2, '0');
    const lastDay = new Date(budgetYear, budgetMonth, 0).getDate();
    const from  = `${budgetYear}-${pad(budgetMonth)}-01`;
    const to    = `${budgetYear}-${pad(budgetMonth)}-${pad(lastDay)}`;

    const [budgets, catSp] = await Promise.all([
      api.getBudgets(),
      api.getByCategory(from, to).catch(() => ({ spending: {} }))
    ]);

    const spending = catSp.spending || {};
    const monthBudgets = (Array.isArray(budgets) ? budgets : [])
      .filter(b => b.month === budgetMonth && b.year === budgetYear);

    c.innerHTML = '';

    // Month/Year picker
    c.appendChild(h('div', { class: 'filter-bar card animate-in' },
      h('div', { class: 'filter-group' },
        h('label', { class: 'form-label' }, 'Month'),
        makeSelect('bm-month',
          Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) })),
          budgetMonth,
          v => { budgetMonth = parseInt(v); loadBudgets(); }
        )
      ),
      h('div', { class: 'filter-group' },
        h('label', { class: 'form-label' }, 'Year'),
        h('input', { class: 'form-input', type: 'number', id: 'bm-year',
          value: budgetYear, style: 'width:110px',
          onchange: e => { budgetYear = parseInt(e.target.value); loadBudgets(); } })
      ),
      h('div', { class: 'filter-period-label' }, `${monthName(budgetMonth)} ${budgetYear}`)
    ));

    if (!monthBudgets.length) {
      c.appendChild(h('div', { class: 'card animate-in' },
        emptyState('🎯', 'No budgets set',
          `No budgets for ${monthName(budgetMonth)} ${budgetYear}. Click "+ Add Budget" to create one.`)
      ));
      return;
    }

    // Calculate totals
    const totalLimit = monthBudgets.reduce((s, b) => s + Number(b.monthlyLimit), 0);
    const totalSpent = monthBudgets.reduce((s, b) => s + Number(spending[b.category?.name] ?? 0), 0);

    // Summary strip
    c.appendChild(h('div', { class: 'stats-grid animate-in', style: 'animation-delay:.05s;grid-template-columns:repeat(3,1fr)' },
      statCard('Total Budget', money(totalLimit), `${monthBudgets.length} categories`, 'cyan', '🏦'),
      statCard('Total Spent',  money(totalSpent), 'Across all budget categories', 'purple', '💳'),
      statCard('Remaining',    money(Math.max(0, totalLimit - totalSpent)),
        `${totalLimit > 0 ? ((totalSpent / totalLimit) * 100).toFixed(1) : 0}% used`,
        totalSpent / totalLimit > 0.9 ? 'amber' : 'green', '💰')
    ));

    // Budget cards
    const listCard = h('div', { class: 'card animate-in', style: 'animation-delay:.1s' },
      h('div', { class: 'section-header' },
        h('div', { class: 'section-title' }, `${monthBudgets.length} Budget${monthBudgets.length !== 1 ? 's' : ''} — ${monthName(budgetMonth)} ${budgetYear}`)
      )
    );

    monthBudgets.forEach(b => {
      const spent = Number(spending[b.category?.name] ?? 0);
      const limit = Number(b.monthlyLimit ?? 0);
      const pct   = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
      const fill  = pct > 90 ? 'danger' : pct > 70 ? 'warning' : '';
      const color = b.category?.color || '#7c3aed';
      const badgeClass = pct > 90 ? 'badge-red' : pct > 70 ? 'badge-yellow' : 'badge-green';

      listCard.appendChild(h('div', { class: 'budget-row', style: `border-left:3px solid ${color}` },
        h('div', { class: 'budget-row-top' },
          h('div', { class: 'budget-row-left' },
            h('span', { style: 'font-size:22px' }, b.category?.icon || '📁'),
            h('div', {},
              h('div', { class: 'budget-row-name' }, b.category?.name || 'Unknown'),
              h('div', { class: 'budget-row-period' }, `${monthName(b.month)} ${b.year}`)
            )
          ),
          h('div', { class: 'budget-row-right' },
            h('span', { class: `budget-row-spent`, style: `color:${pct > 90 ? '#ef4444' : 'inherit'}` },
              money(spent)
            ),
            h('span', { class: 'budget-row-limit' }, ` / ${money(limit)}`),
            h('span', { class: `badge ${badgeClass}`, style: 'margin-left:8px' }, `${pct.toFixed(0)}%`)
          )
        ),
        h('div', { class: 'progress-bar-wrap', style: 'margin:10px 0 4px' },
          h('div', { class: `progress-bar-fill ${fill}`, style: `width:${pct}%` })
        ),
        h('div', { class: 'budget-row-actions' },
          h('button', { class: 'btn btn-ghost btn-xs', onclick: () => openBudgetModal(b, loadBudgets) }, '✏️ Edit'),
          h('button', { class: 'btn btn-danger-xs btn-xs', onclick: () => deleteBudget(b.id) }, '🗑️ Delete')
        )
      ));
    });

    c.appendChild(listCard);

  } catch (err) {
    c.innerHTML = '';
    c.appendChild(emptyState('❌', 'Error', err.message));
  }
}

async function openBudgetModal(budget, onSave) {
  const isEdit = !!budget;
  const d = new Date();
  const cats = await api.getCategories().catch(() => []);

  const catSel  = makeSelect('bm-cat', cats.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` })),
    isEdit ? (budget.category?.id ?? '') : '');
  const limIn   = h('input', { class: 'form-input', type: 'number', step: '0.01', min: '0',
    id: 'bm-limit', value: isEdit ? budget.monthlyLimit : '', placeholder: '5000.00' });
  const monthSel = makeSelect('bm-mo',
    Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) })),
    isEdit ? budget.month : (budgetMonth || d.getMonth() + 1)
  );
  const yearIn  = h('input', { class: 'form-input', type: 'number', id: 'bm-yr',
    value: isEdit ? budget.year : (budgetYear || d.getFullYear()), placeholder: '2024' });

  const body = h('div', { class: 'modal-body' },
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Category *'), catSel),
    h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Monthly Limit *'), limIn),
    h('div', { class: 'form-row' },
      h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Month'), monthSel),
      h('div', { class: 'form-group' }, h('label', { class: 'form-label' }, 'Year'),  yearIn)
    )
  );

  const saveBtn = h('button', { class: 'btn btn-primary', onclick: async () => {
    if (!catSel.value || !limIn.value) { toast('Category and limit are required', 'error'); return; }
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const payload = {
        categoryId:   parseInt(catSel.value),
        monthlyLimit: parseFloat(limIn.value),
        month:        parseInt(monthSel.value),
        year:         parseInt(yearIn.value)
      };
      if (isEdit) await api.updateBudget(budget.id, payload);
      else        await api.createBudget(payload);
      overlay.remove();
      toast(isEdit ? 'Budget updated!' : 'Budget created!', 'success');
      onSave?.();
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
    }
  } }, 'Save');

  const overlay = openModal(
    isEdit ? 'Edit Budget' : 'Add Budget',
    body,
    [h('button', { class: 'btn btn-ghost', onclick: () => overlay.remove() }, 'Cancel'), saveBtn]
  );
}

async function deleteBudget(id) {
  confirm('Delete this budget?', async () => {
    try {
      await api.deleteBudget(id);
      toast('Budget deleted', 'success');
      loadBudgets();
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────
async function loadReports() {
  const c = $('#page-container');
  const d = new Date();
  if (!reportMonth) reportMonth = d.getMonth() + 1;
  if (!reportYear)  reportYear  = d.getFullYear();

  c.innerHTML = '';

  // Period picker
  c.appendChild(h('div', { class: 'filter-bar card animate-in' },
    h('div', { class: 'filter-group' },
      h('label', { class: 'form-label' }, 'Month'),
      makeSelect('rep-mo',
        Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) })),
        reportMonth, v => { reportMonth = parseInt(v); loadReports(); }
      )
    ),
    h('div', { class: 'filter-group' },
      h('label', { class: 'form-label' }, 'Year'),
      h('input', { class: 'form-input', type: 'number', id: 'rep-yr', style: 'width:110px',
        value: reportYear, onchange: e => { reportYear = parseInt(e.target.value); loadReports(); } })
    ),
    h('div', { class: 'filter-period-label' }, `${monthName(reportMonth)} ${reportYear}`)
  ));

  const loadingRow = h('div', { class: 'grid-2 animate-in', style: 'animation-delay:.1s' },
    h('div', { class: 'card' },
      h('div', { class: 'section-header' }, h('div', { class: 'section-title' }, `Monthly Spending — ${reportYear}`)),
      h('div', { class: 'chart-container' }, spinner())
    ),
    h('div', { class: 'card' },
      h('div', { class: 'section-header' }, h('div', { class: 'section-title' }, `By Category — ${monthName(reportMonth)}`)),
      h('div', { class: 'chart-container' }, spinner())
    )
  );
  c.appendChild(loadingRow);

  try {
    const pad = n => String(n).padStart(2, '0');
    const lastDay = new Date(reportYear, reportMonth, 0).getDate();
    const from = `${reportYear}-${pad(reportMonth)}-01`;
    const to   = `${reportYear}-${pad(reportMonth)}-${pad(lastDay)}`;

    // Fetch all 12 months for bar chart + category breakdown
    const [monthlyAll, catSp] = await Promise.all([
      Promise.all(Array.from({ length: 12 }, (_, i) =>
        api.getMonthly(i + 1, reportYear).catch(() => ({ totalSpent: 0 }))
      )),
      api.getByCategory(from, to).catch(() => ({ spending: {} }))
    ]);

    const spending = catSp.spending || {};
    const entries  = Object.entries(spending).sort((a, b) => Number(b[1]) - Number(a[1]));
    const total    = entries.reduce((s, [, v]) => s + Number(v), 0);

    // Replace loading row with real charts
    loadingRow.innerHTML = '';
    loadingRow.appendChild(
      h('div', { class: 'card' },
        h('div', { class: 'section-header' }, h('div', { class: 'section-title' }, `Monthly Spending — ${reportYear}`)),
        h('div', { class: 'chart-container' }, h('canvas', { id: 'rep-bar-chart', height: '260' }))
      )
    );
    loadingRow.appendChild(
      h('div', { class: 'card' },
        h('div', { class: 'section-header' }, h('div', { class: 'section-title' }, `By Category — ${monthName(reportMonth)} ${reportYear}`)),
        h('div', { class: 'chart-container' }, h('canvas', { id: 'rep-cat-chart', height: '260' }))
      )
    );

    // Category breakdown table
    if (entries.length) {
      c.appendChild(h('div', { class: 'card animate-in', style: 'animation-delay:.2s' },
        h('div', { class: 'section-header' },
          h('div', { class: 'section-title' }, `Category Breakdown — ${monthName(reportMonth)} ${reportYear}`),
          h('div', { class: 'section-title', style: 'color:var(--text-secondary);font-size:14px;font-weight:500' },
            `Total: ${money(total)}`)
        ),
        h('div', { class: 'table-wrapper' },
          h('table', {},
            h('thead', {}, h('tr', {},
              h('th', {}, 'Category'),
              h('th', { style: 'text-align:right' }, 'Amount'),
              h('th', { style: 'text-align:right' }, '% of Total'),
              h('th', {}, 'Bar')
            )),
            h('tbody', {},
              ...entries.map(([name, amount]) => {
                const pctVal = total > 0 ? (Number(amount) / total * 100) : 0;
                return h('tr', {},
                  h('td', { style: 'font-weight:500' }, name),
                  h('td', { style: 'text-align:right;font-weight:600' }, money(Number(amount))),
                  h('td', { style: 'text-align:right;color:var(--text-secondary)' }, `${pctVal.toFixed(1)}%`),
                  h('td', { style: 'width:120px' },
                    h('div', { class: 'progress-bar-wrap', style: 'margin:0' },
                      h('div', { class: 'progress-bar-fill', style: `width:${pctVal}%` })
                    )
                  )
                );
              })
            )
          )
        )
      ));
    } else {
      c.appendChild(h('div', { class: 'card animate-in' },
        emptyState('📊', 'No spending data',
          `No expenses found for ${monthName(reportMonth)} ${reportYear}.`)
      ));
    }

    // Init charts
    requestAnimationFrame(() => {
      initBarChart('rep-bar-chart', monthlyAll);
      chart1 = safeDestroyChart(chart1);
      initDoughnut('rep-cat-chart', spending);
    });

  } catch (err) {
    c.innerHTML = '';
    c.appendChild(emptyState('❌', 'Error', err.message));
  }
}

function initBarChart(canvasId, monthlyAll) {
  if (typeof Chart === 'undefined') return;
  const ctx = $(`#${canvasId}`);
  if (!ctx) return;
  chart2 = safeDestroyChart(chart2);
  const data   = monthlyAll.map(m => Number(m.totalSpent ?? 0));
  const labels = Array.from({ length: 12 }, (_, i) => monthName(i + 1));
  const maxVal = Math.max(...data, 1);

  chart2 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spent',
        data,
        backgroundColor: data.map(v =>
          v / maxVal > 0.9 ? 'rgba(239,68,68,0.75)'
          : v / maxVal > 0.7 ? 'rgba(245,158,11,0.75)'
          : 'rgba(124,58,237,0.7)'
        ),
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(124,58,237,1)'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#c4c2d4', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: {
          color: '#c4c2d4', font: { size: 11 },
          callback: v => money(v).replace(/\.00$/, '')
        } }
      }
    }
  });
}
