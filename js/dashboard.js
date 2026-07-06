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

// ================= VIP PLANS =================
const vipPlans = {
  "VIP 1": { price: 10000, daily: 500 },
  "VIP 2": { price: 25000, daily: 1500 },
  "VIP 3": { price: 50000, daily: 3500 },
  "VIP 4": { price: 100000, daily: 8000 }
};

// ================= LOAD DASHBOARD =================
async function loadDashboard(user){
  const snap = await get(ref(db, "users/" + user.uid));
  if(!snap.exists()) return;

  const data = snap.val();

  document.getElementById("balanceBox").textContent =
    (data.balance || 0).toLocaleString() + " RWF";

  document.getElementById("vipLevel").textContent =
    data.vip || "VIP 0";

  document.getElementById("vipStatus").textContent =
    data.vipActive ? "ACTIVE" : "INACTIVE";
}

// ================= BUY VIP =================
window.buyVIP = async (vipName) => {
  const user = auth.currentUser;
  if(!user) return alert("Login first");

  const plan = vipPlans[vipName];
  const userRef = ref(db, "users/" + user.uid);

  const snap = await get(userRef);
  if(!snap.exists()) return alert("User not found");

  const data = snap.val();

  if((data.balance || 0) < plan.price){
    return alert("Not enough balance");
  }

  await update(userRef, {
    balance: (data.balance || 0) - plan.price,
    vip: vipName,
    vipActive: true,
    dailyEarning: plan.daily,
    vipExpire: Date.now() + 30*24*60*60*1000
  });

  alert("VIP Activated!");
  loadDashboard(user);
};

// ================= DAILY EARNINGS =================
setInterval(async () => {
  const user = auth.currentUser;
  if(!user) return;

  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);
  if(!snap.exists()) return;

  const data = snap.val();

  if(!data.vipActive) return;

  if(data.vipExpire && Date.now() > data.vipExpire){
    await update(userRef, {
      vip: "VIP 0",
      vipActive: false,
      dailyEarning: 0
    });
    return;
  }

  await update(userRef, {
    balance: (data.balance || 0) + (data.dailyEarning || 0)
  });

}, 60000);

// ================= AUTH =================
onAuthStateChanged(auth, async(user)=>{
  if(!user){
    window.location.href = "login.html";
    return;
  }

  await loadDashboard(user);
});

// ================= LOGOUT =================
document.getElementById("logoutBtn")?.addEventListener("click", async(e)=>{
  e.preventDefault();
  await signOut(auth);
  window.location.href = "login.html";
});
