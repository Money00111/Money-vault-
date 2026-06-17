import { db } from "./firebase.js";

import {
  ref,
  onValue,
  get,
  update,
  push,
  set
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const auth = getAuth();

const ADMIN_EMAIL = "SHYIRAMO_EMAIL_YAWE";

let currentUserRef = null;

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUserRef = ref(db, "users/" + user.uid);
// ===== REFERRAL CODE =====

const snapshot = await get(currentUserRef);

if(snapshot.exists()){

  const data = snapshot.val();

  if(!data.referralCode){

    const code =
    user.uid.substring(0,6).toUpperCase();

    await update(currentUserRef,{
      referralCode: code,
      referralCount: 0,
      referralEarnings: 0
    });

  }

}
  if (user.email === ADMIN_EMAIL) {

    const adminMenu =
      document.getElementById("adminMenu");

    if (adminMenu) {
      adminMenu.style.display = "block";
    }

  }

  onValue(currentUserRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    const welcomeUser =
      document.getElementById("welcomeUser");

    const profileName =
      document.getElementById("profileName");

    const balanceValue =
      document.getElementById("balanceValue");

    const homeBalance =
      document.getElementById("homeBalance");
const vipPlan =
document.getElementById("vipPlan");

const vipIncome =
document.getElementById("vipIncome");

const vipDays =
document.getElementById("vipDays");

const vipEarnings =
document.getElementById("vipEarnings");

if(data.vip){

  if(vipPlan){
    vipPlan.innerText =
    data.vip.plan || "None";
  }

  if(vipIncome){
    vipIncome.innerText =
    (data.vip.dailyIncome || 0) + " RWF";
  }

  if(vipDays){
    vipDays.innerText =
    data.vip.daysLeft || 0;
  }

  if(vipEarnings){
    vipEarnings.innerText =
    ((data.vip.dailyIncome || 0) *
    (30 - (data.vip.daysLeft || 30)))
    + " RWF";
  }

  }
    if (welcomeUser) {
      welcomeUser.innerText =
        "Hello, " + data.name + " 👋";
    }

    if (profileName) {
      profileName.innerText =
        data.name;
    }

    if (balanceValue) {
      balanceValue.innerText =
        (data.balance || 0) + " RWF";
    }

    if (homeBalance) {
      homeBalance.innerText =
        (data.balance || 0);
    }
    // ===== DEPOSIT =====
window.deposit = async function () {

  const amount = Number(
    document.getElementById("depositAmount").value
  );

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const snapshot = await get(currentUserRef);
  const data = snapshot.val();

  await update(currentUserRef, {
    balance: (data.balance || 0) + amount,
    totalDeposits: (data.totalDeposits || 0) + amount
  });

  const txRef = push(
    ref(
      db,
      "users/" +
      auth.currentUser.uid +
      "/transactions"
    )
  );

  await set(txRef, {
    type: "Deposit",
    amount: amount,
    date: new Date().toLocaleString()
  });

  document.getElementById(
    "depositAmount"
  ).value = "";

  alert("Deposit successful ✅");

    <select id="depositMethod">
  <option value="momo">MTN Mobile Money</option>
  <option value="airtel">Airtel Money</option>
</select>

<input
type="text"
id="depositNumber"
placeholder="Phone Number">

<input
type="number"
id="depositAmount"
placeholder="Amount">

<button
class="deposit-btn"
onclick="deposit()">
Deposit
</button>

};
  
// ===== WITHDRAW =====
window.withdraw = async function () {

  const amount = Number(
    document.getElementById("withdrawAmount").value
  );

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const snapshot = await get(currentUserRef);
  const data = snapshot.val();

  if ((data.balance || 0) < amount) {
    alert("Insufficient balance ⚠️");
    return;
  }

  await update(currentUserRef, {
    balance: data.balance - amount,
    totalWithdrawals:
      (data.totalWithdrawals || 0) + amount
  });

  const txRef = push(
    ref(
      db,
      "users/" +
      auth.currentUser.uid +
      "/transactions"
    )
  );

  await set(txRef, {
    type: "Withdraw",
    amount: amount,
    date: new Date().toLocaleString()
  });

  document.getElementById(
    "withdrawAmount"
  ).value = "";

  alert("Withdraw successful 💰");
};
    // ===== VIP 1 =====
window.buyVip1 = async function () {

  const snapshot = await get(currentUserRef);
  const data = snapshot.val();

  if ((data.balance || 0) < 5000) {
    alert("Not enough balance");
    return;
  }

  await update(currentUserRef, {
    balance: data.balance - 5000,
    vip: {
      plan: "VIP 1",
      dailyIncome: 500,
      daysLeft: 30,
      lastClaim: Date.now()
    }
  });

  alert("VIP 1 Activated 👑");
};


// ===== VIP 2 =====
window.buyVip2 = async function () {

  const snapshot = await get(currentUserRef);
  const data = snapshot.val();

  if ((data.balance || 0) < 10000) {
    alert("Not enough balance");
    return;
  }

  await update(currentUserRef, {
    balance: data.balance - 10000,
    vip: {
      plan: "VIP 2",
      dailyIncome: 1200,
      daysLeft: 30,
      lastClaim: Date.now()
    }
  });

  alert("VIP 2 Activated 👑");
};


// ===== CLAIM DAILY INCOME =====
window.claimDailyIncome = async function () {

  const snapshot = await get(currentUserRef);
  const data = snapshot.val();

  if (!data.vip) {
    alert("No VIP Plan");
    return;
  }

  if ((data.vip.daysLeft || 0) <= 0) {
    alert("VIP Expired");
    return;
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (
    data.vip.lastClaim &&
    now - data.vip.lastClaim < oneDay
  ) {
    alert("Come back tomorrow");
    return;
  }

  await update(currentUserRef, {
    balance:
      (data.balance || 0) +
      (data.vip.dailyIncome || 0),
    vip: {
      ...data.vip,
      lastClaim: now,
      daysLeft:
        (data.vip.daysLeft || 0) - 1
    }
  });

  alert("Income Claimed ✅");
};
    

  });

});
