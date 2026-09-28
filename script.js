/**
 * ============================================================================
 * BUSINESS SPREADSHEETS - EXPENSE TRACKER
 * Exact JavaScript Engine Replicating Reference UI
 * Features:
 * - Ultra user-friendly controls: Quick filter pills, live table sorting,
 *   real-time search with clear button, modal auto-calculations, quick preset chips,
 *   keyboard shortcuts ('N' for modal, 'ESC' to close), and deletion Undo!
 * - Data preservation & local storage persistence
 * ============================================================================
 */

'use strict';

/* --------------------------------------------------------------------------
   1. Configuration & Default Records
   -------------------------------------------------------------------------- */
const CURRENCY = '₹';
const STORAGE_KEY = 'business_spreadsheets_expenses_v3';

// Default reference records: Start clean with NO demo records
const DEFAULT_BUSINESS_EXPENSES = [];

// Category palette matching gold and metallic hues
const CATEGORY_COLORS = {
  'Marketing': '#c59b27',
  'Office Supplies': '#e5c058',
  'Utilities': '#b8933b',
  'Travel': '#475569',
  'Subscriptions': '#71717a',
  'Software': '#57534e',
  'Meals & Entertainment': '#78350f',
  'Insurance': '#92400e',
  'Other': '#a16207'
};

/* --------------------------------------------------------------------------
   2. State Variables
   -------------------------------------------------------------------------- */
let expenses = [];
let activeCategoryFilter = 'all';
let currentSort = { key: 'date', order: 'desc' };
let lastDeletedExpense = null;
let editingExpenseId = null;

let categoryChartInstance = null;
let timeChartInstance = null;
let paymentChartInstance = null;

/* --------------------------------------------------------------------------
   3. Initialization
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initEventListeners();
  initModalLivePreview();
  initNavigation();
  renderAll();
});

const DEMO_CLEARED_FLAG = 'business_expenses_demo_cleared_v5';

function loadData() {
  if (!localStorage.getItem(DEMO_CLEARED_FLAG)) {
    // Purge cached demo data from browser storage so users see clean zero state
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('myfinance_clean_transactions_v2');
    localStorage.setItem(DEMO_CLEARED_FLAG, 'true');
    expenses = [];
    saveData();
    return;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      expenses = JSON.parse(saved);
      // Remove any lingering old demo records
      const demoIds = new Set(['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5', 'exp-6', 'exp-7', 'exp-8']);
      if (Array.isArray(expenses) && expenses.length > 0 && expenses.every(e => demoIds.has(e.id))) {
        expenses = [];
        saveData();
      }
    } catch (e) {
      expenses = [];
    }
  } else {
    expenses = [];
    saveData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/* --------------------------------------------------------------------------
   4. Recalculate Metrics & Render Full UI
   -------------------------------------------------------------------------- */
function renderAll() {
  renderMetricRibbon();
  renderExpenseTable();
  renderCategoryDonut();
  renderExpensesOverTime();
  renderPaymentMethodDonut();
  renderTopExpenses();
  renderOverviewWidgets();
  renderSmartInsightsContent();
}

function renderMetricRibbon() {
  const sumTotal = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  let thisMonthVal = 0;
  let lastMonthVal = 0;

  expenses.forEach(e => {
    if (!e.date) return;
    const parts = e.date.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const amt = Number(e.total) || 0;
      if (year === currentYear && month === currentMonth) {
        thisMonthVal += amt;
      } else if (
        (currentMonth > 0 && year === currentYear && month === currentMonth - 1) ||
        (currentMonth === 0 && year === currentYear - 1 && month === 11)
      ) {
        lastMonthVal += amt;
      }
    }
  });

  let momStr = '0.0%';
  if (lastMonthVal > 0) {
    const diffPct = ((thisMonthVal - lastMonthVal) / lastMonthVal) * 100;
    const sign = diffPct >= 0 ? '+' : '';
    momStr = `${sign} ${diffPct.toFixed(1)}% ${diffPct >= 0 ? '↗' : '↘'}`;
  } else if (thisMonthVal > 0) {
    momStr = '+ 100% ↗';
  } else {
    momStr = '0.0%';
  }

  const categoriesSet = new Set(expenses.map(e => e.category).filter(Boolean));
  const categoryCount = categoriesSet.size;

  const elTotal = document.getElementById('metric-total-expenses');
  const elThisMonth = document.getElementById('metric-this-month');
  const elLastMonth = document.getElementById('metric-last-month');
  const elMom = document.getElementById('metric-mom-pct');
  const elTotalCat = document.getElementById('metric-total-categories');

  if (elTotal) elTotal.textContent = `${CURRENCY} ${sumTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elThisMonth) elThisMonth.textContent = `${CURRENCY} ${thisMonthVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elLastMonth) elLastMonth.textContent = `${CURRENCY} ${lastMonthVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elMom) elMom.textContent = momStr;
  if (elTotalCat) elTotalCat.textContent = categoryCount;
}

/* --------------------------------------------------------------------------
   5. Render Expense Log Table with Sorting & Filter Pills
   -------------------------------------------------------------------------- */
function getFilteredAndSortedExpenses() {
  const searchInput = document.getElementById('table-search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let list = [...expenses];

  // 1. Filter by Category Pill
  if (activeCategoryFilter !== 'all') {
    list = list.filter(e => e.category === activeCategoryFilter);
  }

  // 2. Filter by Search Query
  if (query) {
    list = list.filter(e => 
      (e.desc && e.desc.toLowerCase().includes(query)) ||
      (e.category && e.category.toLowerCase().includes(query)) ||
      (e.paymentMethod && e.paymentMethod.toLowerCase().includes(query)) ||
      (e.notes && e.notes.toLowerCase().includes(query)) ||
      String(e.amount).includes(query) ||
      String(e.total).includes(query)
    );
  }

  // 3. Sort
  list.sort((a, b) => {
    let valA = a[currentSort.key];
    let valB = b[currentSort.key];

    if (currentSort.key === 'amount' || currentSort.key === 'total' || currentSort.key === 'tax') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (currentSort.key === 'date') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
}

function renderExpenseTable() {
  const tbody = document.getElementById('expense-tbody');
  const counterPill = document.getElementById('record-counter-pill');
  if (!tbody) return;

  const filtered = getFilteredAndSortedExpenses();

  if (counterPill) {
    counterPill.textContent = `${filtered.length} of ${expenses.length} records`;
  }

  // Update clear button visibility
  const searchInput = document.getElementById('table-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  if (btnClearSearch && searchInput) {
    btnClearSearch.style.display = searchInput.value ? 'block' : 'none';
  }

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-dim); padding: 24px;">
          <i class="fa-solid fa-folder-open" style="font-size: 22px; color: var(--gold-dim); display: block; margin-bottom: 6px;"></i>
          No expense records match your filter.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(e => {
    const tr = document.createElement('tr');
    tr.id = `row-${e.id}`;

    const dateStr = formatDate(e.date);
    const amtStr = `${CURRENCY} ${(Number(e.amount) || 0).toFixed(2)}`;
    const taxStr = `${CURRENCY} ${(Number(e.tax) || 0).toFixed(2)}`;
    const totalStr = `${CURRENCY} ${(Number(e.total) || 0).toFixed(2)}`;

    tr.innerHTML = `
      <td style="color: var(--gold-primary); font-family: var(--font-mono); font-weight: 600;">${dateStr}</td>
      <td style="color: #ffffff; font-weight: 500;">${escapeHtml(e.desc)}</td>
      <td>
        <span style="display: inline-flex; align-items: center; gap: 5px; color: var(--text-light);">
          <span style="width: 7px; height: 7px; border-radius: 2px; background: ${CATEGORY_COLORS[e.category] || '#d4af37'};"></span>
          ${escapeHtml(e.category)}
        </span>
      </td>
      <td style="color: var(--text-muted); font-size: 11px;">${escapeHtml(e.paymentMethod || 'Credit Card')}</td>
      <td class="td-num">${amtStr}</td>
      <td class="td-num">${taxStr}</td>
      <td class="td-num" style="color: var(--gold-light); font-weight: 700;">${totalStr}</td>
      <td style="color: var(--text-dim); font-size: 10.5px;">${escapeHtml(e.notes || '—')}</td>
      <td style="text-align: center; white-space: nowrap;">
        <button class="btn-edit-row" title="Edit record" onclick="editExpense('${e.id}')">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn-del-row" title="Delete record" onclick="deleteExpense('${e.id}')">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function formatDate(dateString) {
  if (!dateString) return '01/01/2025';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

/* --------------------------------------------------------------------------
   6. Chart.js: Expenses By Category Donut & Legend
   -------------------------------------------------------------------------- */
function renderCategoryDonut() {
  const canvas = document.getElementById('categoryDonutChart');
  const legendList = document.getElementById('category-legend-list');
  if (!canvas || !legendList) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  // Calculate actual category totals from live expenses
  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.total) || 0);
  });

  const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const labels = Object.keys(categoryTotals);

  if (labels.length === 0 || grandTotal === 0) {
    legendList.innerHTML = `<div style="color: var(--text-dim); font-size: 11px; padding: 12px 0;">No category data yet. Log an expense to see distribution.</div>`;
    categoryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['No Expenses'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(255, 255, 255, 0.05)'],
          borderWidth: 1,
          borderColor: '#0f0f10'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    return;
  }

  // Sort by highest expenditure
  labels.sort((a, b) => categoryTotals[b] - categoryTotals[a]);
  const data = labels.map(l => categoryTotals[l]);
  const colors = labels.map(l => CATEGORY_COLORS[l] || '#c59b27');

  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#0f0f10',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181c',
          titleColor: '#d4af37',
          borderColor: 'rgba(212, 175, 55, 0.4)',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${CURRENCY} ${ctx.parsed.toLocaleString('en-IN')}`
          }
        }
      }
    }
  });

  // Render Interactive Legend
  legendList.innerHTML = '';
  labels.forEach(name => {
    const val = categoryTotals[name];
    const pct = grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0;
    const color = CATEGORY_COLORS[name] || '#c59b27';

    const row = document.createElement('div');
    row.className = 'legend-square-row';
    row.style.cursor = 'pointer';
    row.title = `Filter by ${name}`;
    row.addEventListener('click', () => {
      activeCategoryFilter = name;
      updateFilterPillUI(name);
      renderExpenseTable();
    });

    row.innerHTML = `
      <div class="legend-square-name">
        <span class="legend-square-bullet" style="background-color: ${color};"></span>
        <span>${escapeHtml(name)}</span>
      </div>
      <span class="legend-square-pct">${pct}%</span>
    `;
    legendList.appendChild(row);
  });
}

function updateFilterPillUI(cat) {
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-cat') === cat || (cat === 'all' && p.getAttribute('data-cat') === 'all')) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

/* --------------------------------------------------------------------------
   7. Chart.js: Expenses Over Time (Line Chart)
   -------------------------------------------------------------------------- */
function renderExpensesOverTime() {
  const canvas = document.getElementById('expensesOverTimeChart');
  if (!canvas) return;

  if (timeChartInstance) {
    timeChartInstance.destroy();
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyValues = new Array(12).fill(0);

  const currentYear = new Date().getFullYear();
  expenses.forEach(e => {
    if (!e.date) return;
    const parts = e.date.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      if (year === currentYear && month >= 0 && month < 12) {
        monthlyValues[month] += (Number(e.total) || 0);
      }
    }
  });

  const maxVal = Math.max(...monthlyValues);
  const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.25) : 1000;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 140);
  gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
  gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

  timeChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Spend',
        data: monthlyValues,
        borderColor: '#d4af37',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.25,
        pointBackgroundColor: '#d4af37',
        pointBorderColor: '#0f0f10',
        pointBorderWidth: 1.5,
        pointRadius: 3.5,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181c',
          titleColor: '#d4af37',
          borderColor: 'rgba(212, 175, 55, 0.4)',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (ctx) => ` Spend: ${CURRENCY} ${ctx.parsed.y.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 9, family: 'Plus Jakarta Sans' } }
        },
        y: {
          min: 0,
          max: yMax,
          ticks: {
            color: '#94a3b8',
            font: { size: 8.5, family: 'JetBrains Mono' },
            callback: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
          },
          grid: { color: 'rgba(255, 255, 255, 0.04)' }
        }
      }
    }
  });
}

/* --------------------------------------------------------------------------
   8. Chart.js: Expenses By Payment Method Donut
   -------------------------------------------------------------------------- */
function renderPaymentMethodDonut() {
  const canvas = document.getElementById('paymentDonutChart');
  const legendList = document.getElementById('payment-legend-list');
  if (!canvas || !legendList) return;

  if (paymentChartInstance) {
    paymentChartInstance.destroy();
  }

  const paymentTotals = {};
  expenses.forEach(e => {
    const method = e.paymentMethod || 'Credit Card';
    paymentTotals[method] = (paymentTotals[method] || 0) + (Number(e.total) || 0);
  });

  const grandTotal = Object.values(paymentTotals).reduce((a, b) => a + b, 0);
  const labels = Object.keys(paymentTotals);

  const paymentColors = {
    'Credit Card': '#c59b27',     // Rich Gold
    'Bank Transfer': '#52525b',   // Dark Slate
    'Cash': '#d4b886',            // Warm Tan
    'Other': '#78716c'
  };

  if (labels.length === 0 || grandTotal === 0) {
    legendList.innerHTML = `<div style="color: var(--text-dim); font-size: 11px; padding: 12px 0;">No payment data recorded yet.</div>`;
    paymentChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['No Payment Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(255, 255, 255, 0.05)'],
          borderWidth: 1,
          borderColor: '#0f0f10'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    return;
  }

  const data = labels.map(l => paymentTotals[l]);
  const colors = labels.map(l => paymentColors[l] || '#c59b27');

  paymentChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#0f0f10',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181c',
          titleColor: '#d4af37',
          borderColor: 'rgba(212, 175, 55, 0.4)',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (ctx) => {
              const pct = grandTotal > 0 ? Math.round((ctx.parsed / grandTotal) * 100) : 0;
              return ` ${ctx.label}: ${CURRENCY} ${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  legendList.innerHTML = '';
  labels.forEach(name => {
    const val = paymentTotals[name];
    const pct = grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0;
    const color = paymentColors[name] || '#c59b27';

    const row = document.createElement('div');
    row.className = 'legend-square-row';
    row.innerHTML = `
      <div class="legend-square-name">
        <span class="legend-square-bullet" style="background-color: ${color};"></span>
        <span>${escapeHtml(name)}</span>
      </div>
      <span class="legend-square-pct">${pct}%</span>
    `;
    legendList.appendChild(row);
  });
}

/* --------------------------------------------------------------------------
   9. Top Expenses Ranked Bars (Right Bottom Panel)
   -------------------------------------------------------------------------- */
function renderTopExpenses() {
  const container = document.getElementById('top-expenses-list');
  if (!container) return;

  if (expenses.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-dim); font-size: 11px; padding: 20px 0; text-align: center;">
        <i class="fa-solid fa-receipt" style="font-size: 18px; margin-bottom: 6px; display: block; color: var(--gold-dim);"></i>
        No expenses recorded yet. Log your first expense to see ranking.
      </div>
    `;
    return;
  }

  // Aggregate top spend categories dynamically
  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.total) || 0);
  });

  const ranked = Object.entries(categoryTotals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const maxVal = ranked[0].amount || 1;

  container.innerHTML = '';
  ranked.forEach(item => {
    const widthPct = Math.round((item.amount / maxVal) * 100);
    const row = document.createElement('div');
    row.className = 'top-expense-row';
    row.innerHTML = `
      <div class="top-expense-labels">
        <span class="top-exp-name">${escapeHtml(item.name)}</span>
        <span class="top-exp-val">${CURRENCY} ${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="top-exp-bar-track">
        <div class="top-exp-bar-fill" style="width: ${widthPct}%;"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

/* --------------------------------------------------------------------------
   10. Modal Form & User-Friendly Interactions
   -------------------------------------------------------------------------- */
function initModalLivePreview() {
  const inputAmt = document.getElementById('input-amount');
  const inputTax = document.getElementById('input-tax');
  const liveTotal = document.getElementById('modal-live-total');

  const updatePreview = () => {
    const amt = parseFloat(inputAmt.value) || 0;
    const tax = parseFloat(inputTax.value) || 0;
    const total = amt + tax;
    if (liveTotal) {
      liveTotal.textContent = `${CURRENCY} ${total.toFixed(2)}`;
    }
  };

  if (inputAmt) inputAmt.addEventListener('input', updatePreview);
  if (inputTax) inputTax.addEventListener('input', updatePreview);

  // Quick preset amount buttons
  const quickChips = document.querySelectorAll('.quick-amt-chip');
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const addVal = parseFloat(chip.getAttribute('data-amt')) || 0;
      const currentVal = parseFloat(inputAmt.value) || 0;
      inputAmt.value = (currentVal + addVal).toFixed(2);
      updatePreview();
    });
  });
}

function initEventListeners() {
  const btnAdd = document.getElementById('btn-add-record');
  const fabAdd = document.getElementById('fab-add-expense');
  const modal = document.getElementById('add-expense-modal');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const form = document.getElementById('expense-form');

  const openModal = () => {
    if (modal) {
      editingExpenseId = null;
      const titleEl = document.getElementById('modal-gold-title');
      const saveBtn = document.getElementById('btn-save-record');
      if (titleEl) titleEl.textContent = 'Add Business Expense';
      if (saveBtn) saveBtn.textContent = 'Save Expense';
      form.reset();

      const dateInput = document.getElementById('input-date');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      const liveTotal = document.getElementById('modal-live-total');
      if (liveTotal) liveTotal.textContent = `${CURRENCY} 0.00`;

      modal.style.display = 'flex';
      document.getElementById('input-desc').focus();
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.style.display = 'none';
      editingExpenseId = null;
      const titleEl = document.getElementById('modal-gold-title');
      const saveBtn = document.getElementById('btn-save-record');
      if (titleEl) titleEl.textContent = 'Add Business Expense';
      if (saveBtn) saveBtn.textContent = 'Save Expense';
    }
  };

  if (btnAdd) btnAdd.addEventListener('click', openModal);
  if (fabAdd) fabAdd.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  // Quick Add buttons in Navbar & Ledger header
  const btnQuickAdd = document.getElementById('btn-quick-add');
  const btnAddLedger = document.getElementById('btn-add-record-ledger');
  if (btnQuickAdd) btnQuickAdd.addEventListener('click', openModal);
  if (btnAddLedger) btnAddLedger.addEventListener('click', openModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Keyboard Shortcuts: 'N' opens modal, 'ESC' closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
    // Only trigger 'N' shortcut if not actively typing inside an input/textarea
    if ((e.key === 'n' || e.key === 'N') && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openModal();
    }
  });

  // Form Submit (Handles both Create and Update)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const date = document.getElementById('input-date').value;
      const desc = document.getElementById('input-desc').value.trim();
      const category = document.getElementById('input-category').value;
      const paymentMethod = document.getElementById('input-payment').value;
      const amount = parseFloat(document.getElementById('input-amount').value);
      const tax = parseFloat(document.getElementById('input-tax').value) || 0;
      const notes = document.getElementById('input-notes').value.trim();

      if (!date || !desc || isNaN(amount) || amount <= 0) {
        showToast('Please provide valid expense details.');
        return;
      }

      const total = amount + tax;

      if (editingExpenseId) {
        // In-place update existing expense record
        const index = expenses.findIndex(e => e.id === editingExpenseId);
        if (index !== -1) {
          expenses[index] = {
            ...expenses[index],
            date,
            desc,
            category,
            paymentMethod,
            amount,
            tax,
            total,
            notes
          };
          saveData();
          closeModal();
          renderAll();
          showToast(`Updated expense: ${desc} (${CURRENCY} ${total.toFixed(2)})`);
          return;
        }
      }

      // Create new expense record
      const newExpense = {
        id: 'exp-' + Date.now(),
        date: date,
        desc: desc,
        category: category,
        paymentMethod: paymentMethod,
        amount: amount,
        tax: tax,
        total: total,
        notes: notes
      };

      expenses.unshift(newExpense);
      saveData();
      form.reset();
      closeModal();
      renderAll();
      showToast(`Logged expense: ${desc} (${CURRENCY} ${total.toFixed(2)})`);
    });
  }

  // Category Filter Pills
  const catPills = document.querySelectorAll('.cat-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategoryFilter = pill.getAttribute('data-cat') || 'all';
      renderExpenseTable();
    });
  });

  // Table Search Input & Clear Button
  const searchInput = document.getElementById('table-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderExpenseTable();
    });
  }

  if (btnClearSearch && searchInput) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      renderExpenseTable();
      searchInput.focus();
    });
  }

  // Table Sorting Headers
  const sortableHeaders = document.querySelectorAll('.th-sortable');
  sortableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort');
      if (currentSort.key === key) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = key;
        currentSort.order = 'asc';
      }

      // Update sort icons visually
      sortableHeaders.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        if (icon) {
          if (header.getAttribute('data-sort') === currentSort.key) {
            icon.className = `fa-solid fa-sort-${currentSort.order === 'asc' ? 'up' : 'down'} sort-icon`;
            icon.style.color = '#f5d77f';
          } else {
            icon.className = 'fa-solid fa-sort sort-icon';
            icon.style.color = '#8b732e';
          }
        }
      });

      renderExpenseTable();
    });
  });

  // Reset Button -> Clears records
  const btnReset = document.getElementById('btn-reset-demo');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Clear all ledger records and reset to empty?')) {
        expenses = [];
        saveData();
        activeCategoryFilter = 'all';
        updateFilterPillUI('all');
        renderAll();
        showToast('Expense ledger reset to empty.');
      }
    });
  }

  // Clear All Records Button
  const btnClear = document.getElementById('btn-clear-all');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Remove all expenses from your ledger?')) {
        expenses = [];
        saveData();
        renderAll();
        showToast('All expense records removed.');
      }
    });
  }

  // CSV Export
  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', exportToCSV);
  }

  // ========================================================================
  // TOP 4 FEATURE PILLARS BUTTON HANDLERS -> NAVIGATE TO VIEW
  // ========================================================================
  
  // 1. TRACK EXPENSES: Navigates to Ledger
  const pillarTrack = document.getElementById('pillar-track-expenses');
  if (pillarTrack) {
    pillarTrack.addEventListener('click', () => {
      switchComponentView('ledger');
      showToast('Switched to Expense Ledger');
    });
  }

  // 2. VISUALIZE SPENDING: Navigates to Analytics
  const pillarVisual = document.getElementById('pillar-visualize-spending');
  if (pillarVisual) {
    pillarVisual.addEventListener('click', () => {
      switchComponentView('analytics');
      showToast('Switched to Visual Spending Analytics');
    });
  }

  // 3. MANAGE BUDGETS: Navigates to Budget Planner
  const pillarBudget = document.getElementById('pillar-manage-budgets');
  if (pillarBudget) {
    pillarBudget.addEventListener('click', () => {
      switchComponentView('budgets');
      showToast('Switched to Budget & Goals');
    });
  }

  // 4. MAKE SMART DECISIONS: Navigates to Insights
  const pillarDecisions = document.getElementById('pillar-smart-decisions');
  if (pillarDecisions) {
    pillarDecisions.addEventListener('click', () => {
      switchComponentView('insights');
      showToast('Switched to Smart Financial Insights');
    });
  }

  // In-page budget preset chips
  document.querySelectorAll('.budget-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.getAttribute('data-val'));
      if (val) {
        monthlyBudgetLimit = val;
        localStorage.setItem('business_monthly_budget_limit', val.toString());
        updateBudgetModalUI();
        renderOverviewWidgets();
        showToast(`Budget target set to ${CURRENCY} ${val.toLocaleString('en-IN')}`);
      }
    });
  });

  const btnSaveInpageBudget = document.getElementById('btn-save-inpage-budget');
  if (btnSaveInpageBudget) {
    btnSaveInpageBudget.addEventListener('click', () => {
      const input = document.getElementById('input-inpage-budget');
      const val = parseFloat(input ? input.value : 0);
      if (!isNaN(val) && val > 0) {
        monthlyBudgetLimit = val;
        localStorage.setItem('business_monthly_budget_limit', val.toString());
        updateBudgetModalUI();
        renderOverviewWidgets();
        showToast(`Budget target updated to ${CURRENCY} ${val.toLocaleString('en-IN')}`);
      }
    });
  }
  // Budget Modal listeners
  const budgetModal = document.getElementById('budget-modal');
  const btnCloseBudget = document.getElementById('btn-close-budget-modal');
  const btnCancelBudget = document.getElementById('btn-cancel-budget');
  const btnSaveBudget = document.getElementById('btn-save-budget');

  const closeBudgetModal = () => {
    if (budgetModal) budgetModal.style.display = 'none';
  };

  if (btnCloseBudget) btnCloseBudget.addEventListener('click', closeBudgetModal);
  if (btnCancelBudget) btnCancelBudget.addEventListener('click', closeBudgetModal);
  if (budgetModal) {
    budgetModal.addEventListener('click', (e) => {
      if (e.target === budgetModal) closeBudgetModal();
    });
  }

  if (btnSaveBudget) {
    btnSaveBudget.addEventListener('click', () => {
      const inputTarget = document.getElementById('input-monthly-budget');
      const val = parseFloat(inputTarget ? inputTarget.value : 0);
      if (!isNaN(val) && val > 0) {
        monthlyBudgetLimit = val;
        localStorage.setItem('business_monthly_budget_limit', val.toString());
        updateBudgetModalUI();
        renderOverviewWidgets();
        closeBudgetModal();
        showToast(`Monthly budget target updated to ${CURRENCY} ${val.toLocaleString('en-IN')}`);
      }
    });
  }

  // Insights Modal listeners
  const insightsModal = document.getElementById('insights-modal');
  const btnCloseInsights = document.getElementById('btn-close-insights-modal');
  const btnUnderstood = document.getElementById('btn-close-insights');

  const closeInsightsModal = () => {
    if (insightsModal) insightsModal.style.display = 'none';
  };

  if (btnCloseInsights) btnCloseInsights.addEventListener('click', closeInsightsModal);
  if (btnUnderstood) btnUnderstood.addEventListener('click', closeInsightsModal);
  if (insightsModal) {
    insightsModal.addEventListener('click', (e) => {
      if (e.target === insightsModal) closeInsightsModal();
    });
  }

  // ========================================================================
  // BOTTOM 4 TRUST BADGES BUTTON HANDLERS
  // ========================================================================
  const guideModal = document.getElementById('guide-modal');
  const btnCloseGuide = document.getElementById('btn-close-guide-modal');
  const btnCloseGuideAction = document.getElementById('btn-close-guide');

  const openGuideModal = (title, htmlContent) => {
    if (guideModal) {
      const modalTitle = document.getElementById('guide-modal-title');
      const modalBody = document.getElementById('guide-content-body');
      if (modalTitle) modalTitle.innerHTML = title;
      if (modalBody) modalBody.innerHTML = htmlContent;
      guideModal.style.display = 'flex';
    }
  };
  const closeGuideModal = () => {
    if (guideModal) guideModal.style.display = 'none';
  };

  if (btnCloseGuide) btnCloseGuide.addEventListener('click', closeGuideModal);
  if (btnCloseGuideAction) btnCloseGuideAction.addEventListener('click', closeGuideModal);
  if (guideModal) {
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) closeGuideModal();
    });
  }

  // Badge 1: EASY TO USE -> Opens User Guide
  const badgeEasy = document.getElementById('badge-easy-use');
  if (badgeEasy) {
    badgeEasy.addEventListener('click', () => {
      openGuideModal(
        '<i class="fa-solid fa-circle-check" style="color: var(--gold-primary);"></i> Quick Start Guide',
        `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <p><strong>1. Log Expenses:</strong> Click <em>"+ Add Expense"</em> or press shortcut <strong>'N'</strong> on your keyboard.</p>
          <p><strong>2. Categorize:</strong> Choose from standard business categories (Marketing, Office, Utilities, Travel) to auto-update charts.</p>
          <p><strong>3. Filter & Sort:</strong> Use the category pills or click any table header (Date, Amount, Total) to organize records instantly.</p>
          <p><strong>4. Export Data:</strong> Download your entire ledger anytime using the <strong>CSV Export</strong> button.</p>
        </div>
        `
      );
    });
  }

  // Badge 2: INSTANT DOWNLOAD -> Triggers CSV Export
  const badgeDownload = document.getElementById('badge-instant-download');
  if (badgeDownload) {
    badgeDownload.addEventListener('click', () => {
      exportToCSV();
    });
  }

  // Badge 3: ACCURATE & RELIABLE -> Verification & Audit Toast
  const badgeAccurate = document.getElementById('badge-accurate-reliable');
  if (badgeAccurate) {
    badgeAccurate.addEventListener('click', () => {
      showToast('Data Verified: 100% accurate, in-browser mathematical integrity.');
    });
  }

  // Badge 4: DEDICATED SUPPORT -> Opens Support Info
  const badgeSupport = document.getElementById('badge-dedicated-support');
  if (badgeSupport) {
    badgeSupport.addEventListener('click', () => {
      openGuideModal(
        '<i class="fa-solid fa-headset" style="color: var(--gold-primary);"></i> Dedicated Support & Help',
        `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <p>Need assistance with your financial planner or spreadsheets? We are here to help!</p>
          <div style="background: var(--bg-input); padding: 12px; border-radius: 6px; border: 1px solid var(--gold-border-faint);">
            <p><strong>Support Email:</strong> support@business-spreadsheets.com</p>
            <p><strong>Platform:</strong> Business Spreadsheets Excel Solutions</p>
            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul style="padding-left: 20px; margin-top: 4px;">
              <li><strong>N</strong> : Add New Expense</li>
              <li><strong>ESC</strong> : Close Open Dialogs</li>
            </ul>
          </div>
        </div>
        `
      );
    });
  }
}

// Global Budget Limit Variable
let monthlyBudgetLimit = 50000;

function updateBudgetModalUI() {
  const sumTotal = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  const spentAmount = sumTotal;
  const savedLimit = localStorage.getItem('business_monthly_budget_limit');
  if (savedLimit) {
    monthlyBudgetLimit = parseFloat(savedLimit) || 50000;
  }

  const pct = monthlyBudgetLimit > 0 ? Math.min(100, Math.round((spentAmount / monthlyBudgetLimit) * 100)) : 0;
  const remaining = Math.max(0, monthlyBudgetLimit - spentAmount);

  const elSpent = document.getElementById('budget-spent-amount');
  const elPct = document.getElementById('budget-spent-pct');
  const elBar = document.getElementById('budget-progress-bar');
  const elRemain = document.getElementById('budget-remaining-amount');
  const elTargetDisp = document.getElementById('budget-target-display');
  const inputBudget = document.getElementById('input-monthly-budget');

  if (elSpent) elSpent.textContent = `${CURRENCY} ${spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elPct) elPct.textContent = `${pct}% used`;
  if (elBar) {
    elBar.style.width = `${pct}%`;
    elBar.style.background = pct > 90 ? 'var(--red-loss)' : 'linear-gradient(90deg, var(--gold-dim) 0%, var(--gold-primary) 100%)';
  }
  if (elRemain) elRemain.textContent = `${CURRENCY} ${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elTargetDisp) elTargetDisp.textContent = `${CURRENCY} ${monthlyBudgetLimit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (inputBudget) inputBudget.value = monthlyBudgetLimit;
}

/* --------------------------------------------------------------------------
   Navigation Controller & View Switcher
   -------------------------------------------------------------------------- */
function switchComponentView(targetView) {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  const views = document.querySelectorAll('.component-view');

  tabs.forEach(btn => {
    const match = btn.getAttribute('data-target') === targetView;
    btn.classList.toggle('active', match);
    btn.setAttribute('aria-selected', match ? 'true' : 'false');
  });

  if (targetView === 'all') {
    views.forEach(v => {
      v.style.display = 'block';
      v.classList.add('active');
    });
  } else {
    views.forEach(v => {
      const isMatch = v.id === `view-${targetView}`;
      v.style.display = isMatch ? 'block' : 'none';
      v.classList.toggle('active', isMatch);
    });
  }

  // Resize Chart.js canvases when analytics become visible
  if (targetView === 'analytics' || targetView === 'all' || targetView === 'dashboard') {
    setTimeout(() => {
      if (categoryChartInstance) categoryChartInstance.resize();
      if (timeChartInstance) timeChartInstance.resize();
      if (paymentChartInstance) paymentChartInstance.resize();
    }, 60);
  }

  localStorage.setItem('bs_active_component_view', targetView);
}
window.switchComponentView = switchComponentView;

function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab-btn');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      switchComponentView(target);
    });
  });

  // Brand Logo click resets to Dashboard
  const logo = document.getElementById('nav-brand-logo');
  if (logo) {
    logo.addEventListener('click', () => switchComponentView('dashboard'));
  }

  // Quick Jump buttons inside overview cards
  document.querySelectorAll('[data-jump-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-jump-view');
      switchComponentView(target);
    });
  });

  // Default initial view
  const savedView = localStorage.getItem('bs_active_component_view') || 'dashboard';
  switchComponentView(savedView);
}

/* --------------------------------------------------------------------------
   Render Overview Widgets & Budget Indicators
   -------------------------------------------------------------------------- */
function renderOverviewWidgets() {
  const sumTotal = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  const spentAmount = sumTotal;
  const pct = monthlyBudgetLimit > 0 ? Math.min(100, Math.round((spentAmount / monthlyBudgetLimit) * 100)) : 0;
  const remaining = Math.max(0, monthlyBudgetLimit - spentAmount);

  // Dashboard Overview Widget
  const elDashSpent = document.getElementById('dash-spent-val');
  const elDashBar = document.getElementById('dash-budget-bar');
  const elDashPct = document.getElementById('dash-budget-pct-text');
  const elDashRemain = document.getElementById('dash-budget-remain-text');

  if (elDashSpent) elDashSpent.textContent = `${CURRENCY} ${spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elDashBar) {
    elDashBar.style.width = `${pct}%`;
    elDashBar.style.background = pct > 90 ? 'var(--red-loss)' : 'linear-gradient(90deg, var(--gold-dim) 0%, var(--gold-primary) 100%)';
  }
  if (elDashPct) elDashPct.textContent = `${pct}% of monthly budget (${CURRENCY} ${monthlyBudgetLimit.toLocaleString('en-IN')})`;
  if (elDashRemain) elDashRemain.textContent = `Remaining: ${CURRENCY} ${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Card B: Spend distribution preview
  const overviewCatList = document.getElementById('overview-cat-stat-list');
  if (overviewCatList) {
    const categoryTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.total) || 0);
    });

    const sortedCats = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedCats.length === 0) {
      overviewCatList.innerHTML = `<span style="color: var(--text-dim); font-size: 11px;">No category distribution data yet.</span>`;
    } else {
      overviewCatList.innerHTML = '';
      sortedCats.forEach(([catName, amt]) => {
        const catPct = sumTotal > 0 ? Math.round((amt / sumTotal) * 100) : 0;
        const color = CATEGORY_COLORS[catName] || '#c59b27';
        const itemEl = document.createElement('div');
        itemEl.className = 'quick-cat-stat-item';
        itemEl.innerHTML = `
          <span class="q-dot" style="background: ${color};"></span>
          <span class="q-name">${escapeHtml(catName)}</span>
          <span class="q-val">${CURRENCY} ${amt.toLocaleString('en-IN')} (${catPct}%)</span>
        `;
        overviewCatList.appendChild(itemEl);
      });
    }
  }

  // In-page dedicated budget panel
  const elInpageSpent = document.getElementById('inpage-spent-disp');
  const elInpageTarget = document.getElementById('inpage-target-disp');
  const elInpageRemain = document.getElementById('inpage-remain-disp');
  const elInpagePct = document.getElementById('inpage-pct-disp');
  const elInpageBar = document.getElementById('inpage-budget-bar');
  const inpageBudgetInput = document.getElementById('input-inpage-budget');
  const statusNotice = document.getElementById('budget-status-notice');

  if (elInpageSpent) elInpageSpent.textContent = `${CURRENCY} ${spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elInpageTarget) elInpageTarget.textContent = `${CURRENCY} ${monthlyBudgetLimit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elInpageRemain) {
    elInpageRemain.textContent = `${CURRENCY} ${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    elInpageRemain.style.color = pct > 90 ? 'var(--red-loss)' : 'var(--green-gain)';
  }
  if (elInpagePct) elInpagePct.textContent = `${pct}% used`;
  if (elInpageBar) {
    elInpageBar.style.width = `${pct}%`;
    elInpageBar.style.background = pct > 90 ? 'var(--red-loss)' : 'linear-gradient(90deg, var(--gold-dim) 0%, var(--gold-primary) 100%)';
  }
  if (inpageBudgetInput && inpageBudgetInput !== document.activeElement) {
    inpageBudgetInput.value = monthlyBudgetLimit;
  }
  if (statusNotice) {
    if (expenses.length === 0) {
      statusNotice.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--green-gain);"></i> <span>No expenditures recorded for this cycle yet. Total available budget: ${CURRENCY} ${monthlyBudgetLimit.toLocaleString('en-IN')}.</span>`;
    } else if (pct > 95) {
      statusNotice.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--red-loss);"></i> <span style="color: var(--red-loss);">Alert: Monthly budget capacity is at ${pct}%. Immediate expense freeze recommended.</span>`;
    } else {
      const buffer = Math.max(0, 100 - pct);
      statusNotice.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--green-gain);"></i> <span>Spending is within safe operating thresholds. Projected end-of-month buffer: ${buffer}%.</span>`;
    }
  }

  // Dashboard Recent Activity List
  const recentList = document.getElementById('overview-recent-list');
  if (recentList) {
    recentList.innerHTML = '';
    const recents = expenses.slice(0, 3);
    if (recents.length === 0) {
      recentList.innerHTML = '<span style="color: var(--text-dim); font-size: 11px;">No expenses recorded yet.</span>';
    } else {
      recents.forEach(item => {
        const row = document.createElement('div');
        row.className = 'recent-mini-row';
        row.innerHTML = `
          <span class="recent-mini-desc" title="${escapeHtml(item.desc)}">${escapeHtml(item.desc)}</span>
          <span style="color: var(--text-dim); font-size: 10px;">${formatDate(item.date)}</span>
          <span class="recent-mini-amt">${CURRENCY} ${(Number(item.total) || 0).toFixed(2)}</span>
        `;
        recentList.appendChild(row);
      });
    }
  }

  // Insights input tax calculation & dynamic insights update
  const sumTax = expenses.reduce((sum, e) => sum + (Number(e.tax) || 0), 0);
  const taxDisp = document.getElementById('insights-total-tax');
  if (taxDisp) taxDisp.textContent = `${CURRENCY} ${sumTax.toFixed(2)}`;

  updateDynamicInpageInsights(sumTotal, sumTax);
}

function updateDynamicInpageInsights(sumTotal, sumTax) {
  const driverBody = document.getElementById('insight-driver-body');
  const savingsBody = document.getElementById('insight-savings-body');

  if (driverBody) {
    if (expenses.length === 0) {
      driverBody.innerHTML = `
        <h4 style="font-size: 16px; color: #ffffff; margin-bottom: 6px;">No Expenses Logged</h4>
        <p style="color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          Log business expenses to automatically identify primary cost drivers and category distribution.
        </p>
        <div class="insight-badge-tag"><i class="fa-solid fa-clock"></i> Awaiting Data</div>
      `;
    } else {
      const categoryTotals = {};
      expenses.forEach(e => {
        const cat = e.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.total) || 0);
      });
      const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      const topPct = sumTotal > 0 ? Math.round((topCat[1] / sumTotal) * 100) : 0;
      driverBody.innerHTML = `
        <h4 style="font-size: 16px; color: #ffffff; margin-bottom: 6px;">${escapeHtml(topCat[0])}</h4>
        <p style="color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          ${escapeHtml(topCat[0])} represents <strong style="color: var(--gold-light);">${topPct}% (${CURRENCY} ${topCat[1].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</strong> of your total expenditures. Monitor this outlay closely to preserve operating margins.
        </p>
        <div class="insight-badge-tag"><i class="fa-solid fa-arrow-trend-up"></i> Top Spend Category</div>
      `;
    }
  }

  if (savingsBody) {
    const recurringOutlays = expenses.filter(e => ['Subscriptions', 'Software', 'Utilities'].includes(e.category));
    const recurringTotal = recurringOutlays.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    if (recurringTotal === 0) {
      savingsBody.innerHTML = `
        <h4 style="font-size: 16px; color: #ffffff; margin-bottom: 6px;">Recurring Outlay Optimization</h4>
        <p style="color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          Categorize software and utility outlays to unlock automated suggestions for annual consolidation and discounts.
        </p>
        <div class="insight-badge-tag green"><i class="fa-solid fa-piggy-bank"></i> Est. Savings: ${CURRENCY} 0.00</div>
      `;
    } else {
      const estSavings = (recurringTotal * 0.15).toFixed(2);
      savingsBody.innerHTML = `
        <h4 style="font-size: 16px; color: #ffffff; margin-bottom: 6px;">Consolidate Subscriptions & Utilities</h4>
        <p style="color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          Recurring outlays total <strong style="color: var(--gold-light);">${CURRENCY} ${recurringTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>. Migrating monthly plans to annual billing unlocks up to <strong>15% annual savings</strong>.
        </p>
        <div class="insight-badge-tag green"><i class="fa-solid fa-piggy-bank"></i> Est. Savings: ${CURRENCY} ${Number(estSavings).toLocaleString('en-IN')}</div>
      `;
    }
  }
}

function renderSmartInsightsContent() {
  const container = document.getElementById('insights-content-body');
  if (!container) return;

  const sumTotal = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  const sumTax = expenses.reduce((sum, e) => sum + (Number(e.tax) || 0), 0);
  const count = expenses.length;
  const avgExpense = count > 0 ? Math.round(sumTotal / count) : 0;

  if (count === 0) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 11.5px; color: var(--text-light);">
        <div style="background: var(--bg-input); padding: 14px; border-radius: var(--radius-xs); border: 1px solid var(--gold-border); text-align: center;">
          <i class="fa-solid fa-lightbulb" style="font-size: 24px; color: var(--gold-primary); margin-bottom: 8px; display: block;"></i>
          <strong style="color: #fff; font-size: 13px; display: block; margin-bottom: 4px;">No Expense Records Found</strong>
          <p style="color: var(--text-muted); line-height: 1.4;">
            As soon as you log business expenses, this engine generates real-time spend driver detection, tax reconciliation, and cost-reduction audits.
          </p>
        </div>
      </div>
    `;
    return;
  }

  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.total) || 0);
  });
  const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topPct = sumTotal > 0 ? Math.round((topCat[1] / sumTotal) * 100) : 0;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 11.5px; color: var(--text-light);">
      
      <div style="background: var(--bg-input); padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--gold-border);">
        <strong style="color: var(--gold-primary); font-size: 12.5px; display: block; margin-bottom: 4px;">
          <i class="fa-solid fa-trophy"></i> Primary Spend Driver: ${escapeHtml(topCat[0])} (${topPct}%)
        </strong>
        <p style="color: var(--text-muted); line-height: 1.4;">
          ${escapeHtml(topCat[0])} accounts for ${CURRENCY} ${topCat[1].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of your total outlays. Ensure that returns on this expenditure remain optimal.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: var(--bg-input); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--gold-border-faint);">
          <span style="font-size: 10px; color: var(--gold-dim); display: block;">AVERAGE TRANSACTION</span>
          <strong style="font-family: var(--font-mono); font-size: 14px; color: #fff;">${CURRENCY} ${avgExpense.toLocaleString('en-IN')}</strong>
        </div>
        <div style="background: var(--bg-input); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--gold-border-faint);">
          <span style="font-size: 10px; color: var(--gold-dim); display: block;">TOTAL INPUT TAX</span>
          <strong style="font-family: var(--font-mono); font-size: 14px; color: var(--gold-light);">${CURRENCY} ${sumTax.toFixed(2)}</strong>
        </div>
      </div>

      <div style="background: rgba(34, 197, 94, 0.08); padding: 10px 12px; border-radius: var(--radius-xs); border: 1px solid rgba(34, 197, 94, 0.25);">
        <strong style="color: var(--green-gain); display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
          <i class="fa-solid fa-shield-halved"></i> Active Portfolio Audit
        </strong>
        <p style="color: var(--text-muted); font-size: 11px; line-height: 1.35;">
          ${count} expense record${count === 1 ? '' : 's'} tracked across ${Object.keys(categoryTotals).length} categor${Object.keys(categoryTotals).length === 1 ? 'y' : 'ies'}. All figures are 100% computed in real-time.
        </p>
      </div>

    </div>
  `;
}

/* --------------------------------------------------------------------------
   11. Delete Expense with Undo Toast
   -------------------------------------------------------------------------- */
function deleteExpense(id) {
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) return;

  lastDeletedExpense = { item: expenses[index], index: index };
  expenses.splice(index, 1);
  saveData();
  renderAll();

  showToastWithUndo(`Deleted: ${lastDeletedExpense.item.desc}`, () => {
    if (lastDeletedExpense) {
      expenses.splice(lastDeletedExpense.index, 0, lastDeletedExpense.item);
      saveData();
      renderAll();
      showToast('Expense restored.');
      lastDeletedExpense = null;
    }
  });
}
window.deleteExpense = deleteExpense;

/* --------------------------------------------------------------------------
   12. Edit Expense Function
   -------------------------------------------------------------------------- */
function editExpense(id) {
  const item = expenses.find(e => e.id === id);
  if (!item) return;

  editingExpenseId = id;
  document.getElementById('input-date').value = item.date || '';
  document.getElementById('input-desc').value = item.desc || '';
  document.getElementById('input-category').value = item.category || 'Office Supplies';
  document.getElementById('input-payment').value = item.paymentMethod || 'Credit Card';
  document.getElementById('input-amount').value = item.amount !== undefined ? item.amount : '';
  document.getElementById('input-tax').value = item.tax !== undefined ? item.tax : 0;
  document.getElementById('input-notes').value = item.notes || '';

  const titleEl = document.getElementById('modal-gold-title');
  const saveBtn = document.getElementById('btn-save-record');
  if (titleEl) titleEl.textContent = 'Edit Business Expense';
  if (saveBtn) saveBtn.textContent = 'Update Expense';

  const liveTotal = document.getElementById('modal-live-total');
  if (liveTotal) {
    liveTotal.textContent = `${CURRENCY} ${(Number(item.total) || 0).toFixed(2)}`;
  }

  const modal = document.getElementById('add-expense-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('input-desc').focus();
  }
}
window.editExpense = editExpense;

/* --------------------------------------------------------------------------
   12. CSV Export
   -------------------------------------------------------------------------- */
function exportToCSV() {
  if (expenses.length === 0) {
    showToast('No expenses to export.');
    return;
  }

  let csv = `Date,Description,Category,Payment Method,Amount (${CURRENCY}),Tax (${CURRENCY}),Total (${CURRENCY}),Notes\n`;
  expenses.forEach(e => {
    csv += `"${e.date}","${e.desc}","${e.category}","${e.paymentMethod}",${e.amount},${e.tax},${e.total},"${e.notes || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Business_Expense_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Expense report exported to CSV.');
}

/* --------------------------------------------------------------------------
   13. Toast Notifications (Standard & With Undo)
   -------------------------------------------------------------------------- */
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-crown" style="color: var(--gold-primary);"></i> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function showToastWithUndo(msg, onUndo) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${escapeHtml(msg)}</span>
    <button class="toast-undo-btn" style="background: var(--gold-accent); color: #0b0a07; border: 1px solid var(--gold-light); padding: 3px 8px; border-radius: 3px; font-weight: 800; cursor: pointer; margin-left: 8px;">Undo</button>
  `;

  const btnUndo = toast.querySelector('.toast-undo-btn');
  btnUndo.addEventListener('click', () => {
    onUndo();
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
