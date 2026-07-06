// ======================================
// TRANSACTIONS.JS - CLEAN FINAL VERSION
// Firebase Auth + Firestore
// ======================================

import { app } from "./firebase.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// INIT
// ===============================
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// ELEMENTS
// ===============================
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loadingScreen = document.getElementById("loadingScreen");

const balanceEl = document.getElementById("balance");
const totalDepositEl = document.getElementById("totalDeposit");
const totalWithdrawEl = document.getElementById("totalWithdraw");
const bonusEl = document.getElementById("bonus");

const transactionsList = document.getElementById("transactionsList");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

// ===============================
// STATE
// ===============================
let allTransactions = [];
let currentFilter = "All";
let currentUser = null;

// ===============================
// SIDEBAR
// ===============================
menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// ===============================
// LOGOUT (ONLY ONE HANDLER)
// ===============================
logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!confirm("Urashaka gusohoka?")) return;

  await signOut(auth);
  window.location.href = "login.html";
});

// ===============================
// AUTH
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  await loadUserSummary(user);
  loadTransactions(user);

  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 800);
});

// ===============================
// LOAD USER SUMMARY
// ===============================
async function loadUserSummary(user) {
  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) return;

  const data = snap.data();

  balanceEl.textContent = format(data.balance);
  totalDepositEl.textContent = format(data.totalDeposit);
  totalWithdrawEl.textContent = format(data.totalWithdraw);
  bonusEl.textContent = format(data.bonus);
}

// ===============================
// LOAD TRANSACTIONS (REALTIME)
// ===============================
function loadTransactions(user) {

  const depositsQ = query(
    collection(db, "deposits"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const withdrawsQ = query(
    collection(db, "withdraws"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  // Deposits
  onSnapshot(depositsQ, (snap) => {

    allTransactions = allTransactions.filter(t => t.type !== "Deposit");

    snap.forEach(doc => {
      const d = doc.data();

      allTransactions.push({
        id: doc.id,
        type: "Deposit",
        amount: d.amount,
        method: d.paymentMethod,
        transactionId: d.transactionId,
        status: d.status,
        date: d.createdAt,
        icon: "📥"
      });
    });

    render();
  });

  // Withdraws
  onSnapshot(withdrawsQ, (snap) => {

    allTransactions = allTransactions.filter(t => t.type !== "Withdraw");

    snap.forEach(doc => {
      const d = doc.data();

      allTransactions.push({
        id: doc.id,
        type: "Withdraw",
        amount: d.amount,
        fee: d.fee,
        receive: d.receive,
        phone: d.phone,
        status: d.status,
        date: d.createdAt,
        icon: "📤"
      });
    });

    render();
  });
}

// ===============================
// RENDER (ONLY ONE FUNCTION)
// ===============================
function render() {

  let list = [...allTransactions];

  // FILTER
  if (currentFilter !== "All") {
    list = list.filter(t => t.type === currentFilter);
  }

  // SEARCH
  const keyword = searchInput?.value?.toLowerCase() || "";

  if (keyword) {
    list = list.filter(t =>
      (t.type || "").toLowerCase().includes(keyword) ||
      (t.method || "").toLowerCase().includes(keyword) ||
      (t.transactionId || "").toLowerCase().includes(keyword) ||
      (t.phone || "").toLowerCase().includes(keyword) ||
      (t.status || "").toLowerCase().includes(keyword)
    );
  }

  // EMPTY
  if (list.length === 0) {
    transactionsList.innerHTML = `
      <div class="transaction-card">
        <h3>No Transactions Found</h3>
      </div>
    `;
    return;
  }

  // SORT
  list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

  // DISPLAY
  transactionsList.innerHTML = "";

  list.forEach(t => {

    const date = t.date?.toDate
      ? t.date.toDate().toLocaleString()
      : "Loading...";

    let badge = "pending";
    if (t.status === "Approved") badge = "approved";
    if (t.status === "Rejected") badge = "rejected";

    transactionsList.innerHTML += `
      <div class="transaction-card ${t.type.toLowerCase()}">
        <div>
          <h3>${t.icon} ${t.type}</h3>
          <p><strong>Amount:</strong> ${format(t.amount)}</p>

          ${t.type === "Withdraw" ? `
            <p><strong>Fee:</strong> ${format(t.fee)}</p>
            <p><strong>Receive:</strong> ${format(t.receive)}</p>
            <p><strong>Phone:</strong> ${t.phone}</p>
          ` : `
            <p><strong>Method:</strong> ${t.method}</p>
            <p><strong>ID:</strong> ${t.transactionId}</p>
          `}

          <p><strong>Date:</strong> ${date}</p>
        </div>

        <span class="${badge}">${t.status}</span>
      </div>
    `;
  });
}

// ===============================
// FILTER BUTTONS
// ===============================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.textContent.trim();
    render();
  });
});

// ===============================
// SEARCH
// ===============================
searchInput?.addEventListener("input", render);

// ===============================
// UTIL
// ===============================
function format(amount) {
  return (Number(amount || 0)).toLocaleString() + " RWF";
          }
