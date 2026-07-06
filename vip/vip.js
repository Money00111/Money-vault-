import {
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import { auth, db } from "./firebase.js";

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
// BUY VIP
// ===============================
window.buyVIP = async (vipName) => {

  const user = auth.currentUser;
  if (!user) return;

  const plan = vipPlans[vipName];

  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);

  if (!snap.exists()) return;

  const data = snap.val();

  if (data.balance < plan.price) {
    alert("Not enough balance");
    return;
  }

  const newBalance = data.balance - plan.price;

  const expireTime = Date.now() + (30 * 24 * 60 * 60 * 1000);

  await update(userRef, {
    balance: newBalance,
    vip: vipName,
    vipActive: true,
    dailyEarning: plan.daily,
    vipExpire: expireTime
  });

  alert("VIP Activated Successfully!");
};

// ===============================
// DAILY EARNINGS SYSTEM
// ===============================
setInterval(async () => {

  const user = auth.currentUser;
  if (!user) return;

  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);

  if (!snap.exists()) return;

  const data = snap.val();

  if (!data.vipActive) return;

  const now = Date.now();

  if (data.vipExpire && now > data.vipExpire) {
    await update(userRef, {
      vip: "VIP 0",
      vipActive: false,
      dailyEarning: 0
    });
    return;
  }

  const newBalance = (data.balance || 0) + (data.dailyEarning || 0);

  await update(userRef, {
    balance: newBalance
  });

}, 24 * 60 * 60 * 1000); // every day
