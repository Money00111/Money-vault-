import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ===============================
// VIP PLANS
// ===============================
const vipPlans = {
  "VIP 1": { price: 10000, daily: 500 },
  "VIP 2": { price: 25000, daily: 1500 },
  "VIP 3": { price: 50000, daily: 3500 },
  "VIP 4": { price: 100000, daily: 8000 }
};

// ===============================
// NOTIFICATIONS
// ===============================
function showNotification(msg) {
  const list = document.getElementById("notificationList");
  if (!list) return;

  const div = document.createElement("div");
  div.className = "notification-card";
  div.textContent = "🔔 " + msg;

  list.prepend(div);
  setTimeout(() => div.remove(), 5000);
}

// ===============================
// LOAD DASHBOARD
// ===============================
async function loadDashboard(user) {
  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);

  if (!snap.exists()) return;

  const data = snap.val();

  document.getElementById("balanceBox").textContent =
    `${(data.balance || 0).toLocaleString()} RWF`;

  document.getElementById("vipLevel").textContent =
    data.vip || "VIP 0";

  document.getElementById("vipStatus").textContent =
    data.vipActive ? "Active" : "Inactive";

  document.getElementById("depositTotal").textContent =
    `${(data.deposit || 0).toLocaleString()} RWF`;

  document.getElementById("withdrawTotal").textContent =
    `${(data.withdraw || 0).toLocaleString()} RWF`;

  document.getElementById("refBonus").textContent =
    `${(data.referralBonus || 0).toLocaleString()} RWF`;

  document.getElementById("earningsBox").textContent =
    `${(data.earnings || 0).toLocaleString()} RWF`;

  document.getElementById("username").textContent =
    data.name || user.email;
}

// ===============================
// VIP BUY (FIXED)
// ===============================
window.buyVIP = async (vipName) => {
  const user = auth.currentUser;
  if (!user) return alert("Login first");

  const plan = vipPlans[vipName];
  const userRef = ref(db, "users/" + user.uid);

  const snap = await get(userRef);
  if (!snap.exists()) return alert("User not found");

  const data = snap.val();

  if ((data.balance || 0) < plan.price) {
    return alert("❌ Not enough balance");
  }

  const newBalance = (data.balance || 0) - plan.price;

  const expire = Date.now() + 30 * 24 * 60 * 60 * 1000;

  await update(userRef, {
    balance: newBalance,
    vip: vipName,
    vipActive: true,
    dailyEarning: plan.daily,
    vipExpire: expire
  });

  showNotification("💎 VIP Activated!");
  loadDashboard(user);
};

// ===============================
// DAILY EARNING (FIXED)
// ===============================
setInterval(async () => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);

  if (!snap.exists()) return;

  const data = snap.val();

  if (!data.vipActive) return;

  if (data.vipExpire && Date.now() > data.vipExpire) {
    await update(userRef, {
      vip: "VIP 0",
      vipActive: false,
      dailyEarning: 0
    });

    showNotification("VIP expired");
    return;
  }

  await update(userRef, {
    balance: (data.balance || 0) + (data.dailyEarning || 0)
  });

}, 60000);

// ===============================
// AUTH STATE (ONLY ONCE - FIXED)
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadDashboard(user);

  setInterval(() => loadDashboard(user), 30000);
});

// ===============================
// LOGOUT
// ===============================
document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = "login.html";
});
