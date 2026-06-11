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

let currentUserRef = null;

// ===== CHECK LOGIN =====
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUserRef = ref(db, "users/" + user.uid);

  // LIVE DATA
  onValue(currentUserRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    const welcomeUser =
      document.getElementById("welcomeUser");

    const balanceValue =
      document.getElementById("balanceValue");

    const profileName =
      document.getElementById("profileName");

    if (welcomeUser) {
      welcomeUser.innerText =
        "Hello, " + data.name + " 👋";
    }

    if (balanceValue) {
      balanceValue.innerText =
        (data.balance || 0) + " RWF";
    }

    if (profileName) {
      profileName.innerText =
        data.name;
    }
const txList =
document.getElementById("transactionList");

if(txList){

  let html = "";

  if(data.transactions){

    Object.values(data.transactions)
    .reverse()
    .forEach(tx => {

      html += `
      <div class="tx-item">
        <div>
          <strong>${tx.type}</strong><br>
          <small>${tx.date}</small>
        </div>
        <div class="${tx.type === "Deposit" ? "green" : "red"}">
          ${tx.type === "Deposit" ? "+" : "-"}
          ${tx.amount} RWF
        </div>
      </div>
      `;

    });

  } else {

    html = "No transactions yet";

  }

  txList.innerHTML = html;
      }
  });


if(data.vip){

 document.getElementById("vipPlan").innerText =
 data.vip.plan || "None";

 document.getElementById("vipIncome").innerText =
 (data.vip.dailyIncome || 0) + " RWF";

 document.getElementById("vipDays").innerText =
 data.vip.daysLeft || 0;

}
const totalDeposits =
document.getElementById("totalDeposits");

const totalWithdrawals =
document.getElementById("totalWithdrawals");

if(totalDeposits){
  totalDeposits.innerText =
  data.totalDeposits || 0;
}

if(totalWithdrawals){
  totalWithdrawals.innerText =
  data.totalWithdrawals || 0;
}
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
  });

// ===== DEPOSIT =====
window.deposit = async function () {

  const amount =
    Number(document.getElementById("depositAmount").value);

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const snapshot = await get(currentUserRef);
  const data = snapshot.val();

  await update(currentUserRef, {
    balance: (data.balance || 0) + amount,
    totalDeposits: (data.totalDeposits || 0) + amount
 const txRef = push(
  ref(db, "users/" + auth.currentUser.uid + "/transactions")
);

await set(txRef,{
  type:"Deposit",
  amount:amount,
  date:new Date().toLocaleString()
});

  document.getElementById("depositAmount").value = "";

  alert("Deposit successful ✅");
};
  });
  

// ===== WITHDRAW =====
window.withdraw = async function () {

  const amount =
    Number(document.getElementById("withdrawAmount").value);

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
 const txRef = push(
  ref(db, "users/" + auth.currentUser.uid + "/transactions")
);

await set(txRef,{
  type:"Withdraw",
  amount:amount,
  date:new Date().toLocaleString()
});
  document.getElementById("withdrawAmount").value = "";

  alert("Withdraw successful 💰");
};

  });

// ===== VIP 1 =====
window.buyVip1 = async function(){

 const snapshot = await get(currentUserRef);
 const data = snapshot.val();

 if((data.balance || 0) < 5000){
   alert("Not enough balance");
   return;
 }

 await update(currentUserRef,{
   balance:data.balance - 5000,
   vip:{
     plan:"VIP 1",
     dailyIncome:500,
     daysLeft:30
   }
 });

 alert("VIP 1 Activated 👑");
};
await update(currentUserRef, {
  balance: data.balance - 5000,
  vip: {
    plan: "VIP 1",
    dailyIncome: 500,
    daysLeft: 30,
    lastClaim: Date.now()
  }
});

// ===== VIP 2 =====
window.buyVip2 = async function(){

 const snapshot = await get(currentUserRef);
 const data = snapshot.val();

 if((data.balance || 0) < 10000){
   alert("Not enough balance");
   return;
 }

 await update(currentUserRef,{
   balance:data.balance - 10000,
   vip:{
     plan:"VIP 2",
     dailyIncome:1200,
     daysLeft:30
   }
 });

 alert("VIP 2 Activated 👑");
};
await update(currentUserRef, {
  balance: data.balance - 10000,
  vip: {
    plan: "VIP 2",
    dailyIncome: 1200,
    daysLeft: 30,
    lastClaim: Date.now()
  }
});
// ===== LOGOUT =====
const logoutBtn =
  document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "index.html";

  });

}
