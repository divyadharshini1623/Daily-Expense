// ===== Categories =====
const categories = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other Income"],
  expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Rent", "Other Expense"]
};

// ===== Storage =====
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// ===== DOM Elements =====
const form = document.getElementById("transactionForm");
const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("category");
const customCategoryGroup = document.getElementById("customCategoryGroup");
const customCategoryInput = document.getElementById("customCategory");
const amountInput = document.getElementById("amount");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const transactionBody = document.getElementById("transactionBody");
const filterType = document.getElementById("filterType");
const clearAllBtn = document.getElementById("clearAllBtn");

const totalBalanceEl = document.getElementById("totalBalance");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const categorySummaryEl = document.getElementById("categorySummary");

// ===== Init =====
function init() {
  dateInput.value = new Date().toISOString().split("T")[0];
  populateCategories();
  render();
}

// ===== Populate category dropdown based on type =====
function populateCategories() {
  const list = categories[typeSelect.value];
  categorySelect.innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join("");
  toggleCustomCategory();
}

typeSelect.addEventListener("change", populateCategories);
categorySelect.addEventListener("change", toggleCustomCategory);

// ===== Toggle custom category input =====
function toggleCustomCategory() {
  const isOther = categorySelect.value === "Other Income" || categorySelect.value === "Other Expense";
  customCategoryGroup.style.display = isOther ? "block" : "none";
  customCategoryInput.required = isOther;
  if (!isOther) customCategoryInput.value = "";
}

// ===== Add Transaction =====
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const isOther = categorySelect.value === "Other Income" || categorySelect.value === "Other Expense";
  const finalCategory = isOther && customCategoryInput.value.trim()
    ? customCategoryInput.value.trim()
    : categorySelect.value;

  const transaction = {
    id: Date.now(),
    type: typeSelect.value,
    category: finalCategory,
    amount: parseFloat(amountInput.value),
    description: descriptionInput.value.trim() || "-",
    date: dateInput.value
  };

  transactions.push(transaction);
  saveAndRender();

  form.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  populateCategories();
});

// ===== Delete Transaction =====
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveAndRender();
}

// ===== Clear All =====
clearAllBtn.addEventListener("click", function () {
  if (transactions.length === 0) return;
  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    saveAndRender();
  }
});

// ===== Filter =====
filterType.addEventListener("change", render);

// ===== Save & Render =====
function saveAndRender() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  render();
}

// ===== Main Render =====
function render() {
  renderSummary();
  renderTable();
  renderCategorySummary();
}

// ===== Render Summary Cards =====
function renderSummary() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  totalBalanceEl.textContent = formatCurrency(balance);

  totalBalanceEl.style.color = balance >= 0 ? "#185fa5" : "#a32d2d";
}

// ===== Render Transaction Table =====
function renderTable() {
  const filter = filterType.value;
  let list = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filter !== "all") {
    list = list.filter(t => t.type === filter);
  }

  if (list.length === 0) {
    transactionBody.innerHTML = `<tr><td colspan="6" class="empty-msg">No transactions found</td></tr>`;
    return;
  }

  transactionBody.innerHTML = list.map(t => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td><span class="type-badge type-${t.type}">${t.type}</span></td>
      <td>${t.category}</td>
      <td>${escapeHtml(t.description)}</td>
      <td class="amount-${t.type}">${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${t.id})" title="Delete">🗑</button></td>
    </tr>
  `).join("");
}

// ===== Render Category-wise Summary (Expenses only) =====
function renderCategorySummary() {
  const expenses = transactions.filter(t => t.type === "expense");

  if (expenses.length === 0) {
    categorySummaryEl.innerHTML = `<p class="empty-msg">No expenses yet. Add a transaction to see analytics.</p>`;
    return;
  }

  const totals = {};
  let grandTotal = 0;

  expenses.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
    grandTotal += t.amount;
  });

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  categorySummaryEl.innerHTML = sorted.map(([category, amount]) => {
    const percent = ((amount / grandTotal) * 100).toFixed(1);
    return `
      <div class="category-row">
        <div class="category-row-top">
          <span class="category-name">${category}</span>
          <span class="category-amount">${formatCurrency(amount)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <span class="category-percent">${percent}% of total expenses</span>
      </div>
    `;
  }).join("");
}

// ===== Helpers =====
function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===== Run =====
init();