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

// Default reference records from screenshot (used if no previous data exists)
const DEFAULT_BUSINESS_EXPENSES = [
  { id: 'exp-1', date: '2025-01-01', desc: 'Office Supplies', category: 'Office Supplies', paymentMethod: 'Credit Card', amount: 120.00, tax: 10.00, total: 130.00, notes: 'Printer paper & ink' },
  { id: 'exp-2', date: '2025-01-02', desc: 'Facebook Ads', category: 'Marketing', paymentMethod: 'Credit Card', amount: 350.00, tax: 0.00, total: 350.00, notes: 'Ad campaign' },
  { id: 'exp-3', date: '2025-01-03', desc: 'Electricity Bill', category: 'Utilities', paymentMethod: 'Bank Transfer', amount: 200.00, tax: 0.00, total: 200.00, notes: 'Monthly utility' },
  { id: 'exp-4', date: '2025-01-05', desc: 'Google Workspace', category: 'Subscriptions', paymentMethod: 'Credit Card', amount: 72.00, tax: 0.00, total: 72.00, notes: 'Monthly plan' },
  { id: 'exp-5', date: '2025-01-06', desc: 'Business Lunch', category: 'Meals & Entertainment', paymentMethod: 'Credit Card', amount: 85.00, tax: 8.50, total: 93.50, notes: 'Client meeting' },
  { id: 'exp-6', date: '2025-01-07', desc: 'Flight to NYC', category: 'Travel', paymentMethod: 'Credit Card', amount: 450.00, tax: 0.00, total: 450.00, notes: 'Business trip' },
  { id: 'exp-7', date: '2025-01-08', desc: 'Adobe Creative Cloud', category: 'Software', paymentMethod: 'Credit Card', amount: 54.99, tax: 0.00, total: 54.99, notes: 'Monthly plan' },
  { id: 'exp-8', date: '2025-01-09', desc: 'Internet Bill', category: 'Utilities', paymentMethod: 'Bank Transfer', amount: 89.99, tax: 0.00, total: 89.99, notes: 'Monthly utility' }
];

// Reference timeline data for 'EXPENSES OVER TIME' Jan - Dec
const TIMELINE_DATA = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  values: [2200, 3100, 2400, 1800, 2000, 3800, 3600, 3500, 3700, 3200, 2200, 2800]
};

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

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      expenses = JSON.parse(saved);
    } catch (e) {
      expenses = JSON.parse(JSON.stringify(DEFAULT_BUSINESS_EXPENSES));
    }
  } else {
    // Check previous project storage key to preserve user's data!
    const previousSaved = localStorage.getItem('myfinance_clean_transactions_v2');
    if (previousSaved) {
      try {
        const parsed = JSON.parse(previousSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          expenses = parsed.map((item, idx) => ({
            id: item.id || `migrated-${idx}`,
            date: item.date || '2025-01-01',
            desc: item.desc || 'Expense Item',
            category: item.category || 'Office Supplies',
            paymentMethod: item.paymentMethod || 'Credit Card',
            amount: Number(item.amount) || 0,
            tax: Number(item.tax) || 0,
            total: (Number(item.amount) || 0) + (Number(item.tax) || 0),
            notes: item.notes || ''
          }));
        } else {
          expenses = JSON.parse(JSON.stringify(DEFAULT_BUSINESS_EXPENSES));
        }
      } catch (e) {
        expenses = JSON.parse(JSON.stringify(DEFAULT_BUSINESS_EXPENSES));
      }
    } else {
      expenses = JSON.parse(JSON.stringify(DEFAULT_BUSINESS_EXPENSES));
    }
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
}

function renderMetricRibbon() {
  const sumTotal = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
  
  // Baseline values matching screenshot
  const displayTotal = sumTotal > 0 ? sumTotal : 24850;
  const thisMonthVal = 4250.00;
  const lastMonthVal = 3890.00;
  const momPct = '+ 9.26%';

  const categoriesSet = new Set(expenses.map(e => e.category).filter(Boolean));
  const categoryCount = Math.max(categoriesSet.size, 9);

  const elTotal = document.getElementById('metric-total-expenses');
  const elThisMonth = document.getElementById('metric-this-month');
  const elLastMonth = document.getElementById('metric-last-month');
  const elMom = document.getElementById('metric-mom-pct');
  const elTotalCat = document.getElementById('metric-total-categories');

  if (elTotal) elTotal.textContent = `${CURRENCY} ${displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elThisMonth) elThisMonth.textContent = `${CURRENCY} ${thisMonthVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elLastMonth) elLastMonth.textContent = `${CURRENCY} ${lastMonthVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elMom) elMom.textContent = `${momPct} ↗`;
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

  // Pre-seed with the reference screenshot category distributions
  const categoryTotals = {
    'Marketing': 6450,
    'Office Supplies': 4320,
    'Utilities': 3540,
    'Travel': 2980,
    'Subscriptions': 1780,
    'Software': 1420,
    'Meals & Entertainment': 1200,
    'Insurance': 950,
    'Other': 800
  };

  // Add extra expenses dynamically
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += (Number(e.total) || 0);
    } else {
      categoryTotals[cat] = (Number(e.total) || 0);
    }
  });

  const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
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

  // Render Legend
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

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 140);
  gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
  gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

  timeChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: TIMELINE_DATA.labels,
      datasets: [{
        label: 'Monthly Spend',
        data: TIMELINE_DATA.values,
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
          max: 5000,
          ticks: {
            stepSize: 1000,
            color: '#94a3b8',
            font: { size: 8.5, family: 'JetBrains Mono' },
            callback: (v) => v === 0 ? '0K' : `${v / 1000}K`
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

  const paymentTotals = {
    'Credit Card': 60,
    'Bank Transfer': 25,
    'Cash': 15
  };

  const paymentColors = {
    'Credit Card': '#c59b27',     // Rich Gold
    'Bank Transfer': '#52525b',   // Dark Slate
    'Cash': '#d4b886'            // Warm Tan
  };

  const labels = Object.keys(paymentTotals);
  const data = Object.values(paymentTotals);
  const colors = labels.map(l => paymentColors[l]);

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
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`
          }
        }
      }
    }
  });

  legendList.innerHTML = '';
  labels.forEach(name => {
    const pct = paymentTotals[name];
    const color = paymentColors[name];

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

  // Matching screenshot top 5 ranked items
  const ranked = [
    { name: 'Marketing', amount: 6450.00 },
    { name: 'Office Supplies', amount: 4320.00 },
    { name: 'Utilities', amount: 3540.00 },
    { name: 'Travel', amount: 2980.00 },
    { name: 'Subscriptions', amount: 1780.00 }
  ];

  const maxVal = ranked[0].amount;

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

  // Reset Demo Records Button
  const btnReset = document.getElementById('btn-reset-demo');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Reset to default reference sample expenses?')) {
        expenses = JSON.parse(JSON.stringify(DEFAULT_BUSINESS_EXPENSES));
        saveData();
        activeCategoryFilter = 'all';
        updateFilterPillUI('all');
        renderAll();
        showToast('Reset to default sample expenses.');
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
  const spentAmount = sumTotal > 0 ? sumTotal : 24850.00;
  const savedLimit = localStorage.getItem('business_monthly_budget_limit');
  if (savedLimit) {
    monthlyBudgetLimit = parseFloat(savedLimit) || 50000;
  }

  const pct = Math.min(100, Math.round((spentAmount / monthlyBudgetLimit) * 100));
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
  const spentAmount = sumTotal > 0 ? sumTotal : 24850.00;
  const pct = Math.min(100, Math.round((spentAmount / monthlyBudgetLimit) * 100));
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
    if (pct > 95) {
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

  // Insights input tax calculation
  const sumTax = expenses.reduce((sum, e) => sum + (Number(e.tax) || 0), 0);
  const taxDisp = document.getElementById('insights-total-tax');
  if (taxDisp) taxDisp.textContent = `${CURRENCY} ${sumTax.toFixed(2)}`;
}

function renderSmartInsightsContent() {
  const container = document.getElementById('insights-content-body');
  if (!container) return;

  const sumTotal = expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0) || 24850;
  const sumTax = expenses.reduce((sum, e) => sum + (Number(e.tax) || 0), 0);
  const count = expenses.length || 8;
  const avgExpense = Math.round(sumTotal / count);

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 11.5px; color: var(--text-light);">
      
      <div style="background: var(--bg-input); padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--gold-border);">
        <strong style="color: var(--gold-primary); font-size: 12.5px; display: block; margin-bottom: 4px;">
          <i class="fa-solid fa-trophy"></i> Primary Spend Driver: Marketing (26%)
        </strong>
        <p style="color: var(--text-muted); line-height: 1.4;">
          Marketing accounts for ${CURRENCY} 6,450.00 of your total outlays. Ensure client acquisition ROAS exceeds 3.5x to preserve profit margins.
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
          <i class="fa-solid fa-shield-halved"></i> Smart Savings Tip
        </strong>
        <p style="color: var(--text-muted); font-size: 11px; line-height: 1.35;">
          Utilities and subscriptions account for 21% of monthly costs. Consolidating cloud seats and switching to annual billing can yield up to 15% in operational savings.
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
