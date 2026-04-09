// ─── UTILITY HELPERS ──────────────────────────────────────────

export function $(sel, ctx = document) { return ctx.querySelector(sel); }
export function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    el.append(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(child) : child);
  }
  return el;
}

export function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(str) {
  if (!str) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(str));
}

export function todayISO() { return new Date().toISOString().slice(0, 10); }

export function monthName(n) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][n - 1] ?? '';
}

// ─── TOAST ────────────────────────────────────────────────────
let toastContainer;
function ensureToast() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = h('div', { class: `toast ${type}` },
    h('span', { class: 'toast-icon' }, icons[type] || 'ℹ️'),
    h('span', { class: 'toast-msg' }, msg),
    h('span', { class: 'toast-dismiss', onclick: () => el.remove() }, '✕')
  );
  ensureToast().appendChild(el);
  setTimeout(() => el.classList.add('fade-out'), 3500);
  setTimeout(() => el.remove(), 3800);
}

// ─── MODAL ────────────────────────────────────────────────────
export function openModal(title, bodyEl, footerEl, size = '') {
  const overlay = h('div', { class: 'modal-overlay', onclick: e => { if (e.target === overlay) overlay.remove(); } },
    h('div', { class: `modal ${size}` },
      h('div', { class: 'modal-header' },
        h('h2', { class: 'modal-title' }, title),
        h('button', { class: 'modal-close', onclick: () => overlay.remove() }, '✕')
      ),
      bodyEl,
      footerEl ? h('div', { class: 'modal-footer' }, ...footerEl) : null
    )
  );
  document.body.appendChild(overlay);
  return overlay;
}

// ─── LOADING ──────────────────────────────────────────────────
export function spinner(size = '') {
  return h('div', { class: 'loading-container' }, h('div', { class: `spinner ${size}` }));
}

// ─── EMPTY STATE ──────────────────────────────────────────────
export function emptyState(icon, title, body) {
  return h('div', { class: 'empty-state' },
    h('div', { class: 'empty-icon' }, icon),
    h('div', { class: 'empty-title' }, title),
    h('div', { class: 'empty-body' }, body)
  );
}

// ─── CONFIRM ──────────────────────────────────────────────────
export function confirm(msg, onYes) {
  const body = h('p', { style: 'color:var(--text-secondary);font-size:14px;line-height:1.7' }, msg);
  const overlay = openModal('Confirm Action', body, [
    h('button', { class: 'btn btn-ghost', onclick: () => overlay.remove() }, 'Cancel'),
    h('button', { class: 'btn btn-danger', onclick: () => { overlay.remove(); onYes(); } }, 'Delete'),
  ]);
}

// ─── TAG INPUT ────────────────────────────────────────────────
export function createTagInput(initial = []) {
  let tags = [...initial];
  const input = h('input', { class: 'tag-text-input', placeholder: 'Add tag…', type: 'text' });
  const container = h('div', { class: 'tag-container' });

  function render() {
    container.innerHTML = '';
    tags.forEach((t, i) => {
      container.append(h('span', { class: 'tag-chip' }, t,
        h('span', { class: 'tag-remove', onclick: () => { tags.splice(i, 1); render(); } }, '✕')
      ));
    });
    container.appendChild(input);
  }

  input.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      const v = input.value.trim().replace(/,$/, '');
      if (v && !tags.includes(v)) tags.push(v);
      input.value = '';
      render();
    }
    if (e.key === 'Backspace' && !input.value && tags.length) {
      tags.pop(); render();
    }
  });
  container.addEventListener('click', () => input.focus());
  render();
  return { el: container, getTags: () => tags };
}

// ─── PRESET COLORS ────────────────────────────────────────────
export const COLORS = [
  '#7c3aed','#8b5cf6','#06b6d4','#0ea5e9','#10b981','#34d399',
  '#f59e0b','#f97316','#ef4444','#ec4899','#6366f1','#84cc16'
];

export function colorPicker(initial) {
  let selected = initial || COLORS[0];
  const row = h('div', { class: 'color-row' });
  COLORS.forEach(c => {
    const sw = h('div', { class: `color-swatch ${c === selected ? 'selected' : ''}`,
      style: `background:${c}`, onclick: () => {
        selected = c;
        $$('.color-swatch', row).forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
      }
    });
    row.appendChild(sw);
  });
  return { el: row, getColor: () => selected };
}

// ─── ICONS SHORTCUTS ──────────────────────────────────────────
export const CATEGORY_ICONS = [
  '🍔','🛒','🚗','✈️','🏥','📚','🎬','💡','🏠','👗','💻','🎮','🏋️','☕','💊','🎁','🐾','🌿'
];
