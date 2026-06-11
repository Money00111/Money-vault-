import { db } from "./firebase.js";
import {
  ref,
  onValue,
  get,
  update
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

  });

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
  });

  document.getElementById("depositAmount").value = "";

  alert("Deposit successful ✅");
};

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
  });

  document.getElementById("withdrawAmount").value = "";

  alert("Withdraw successful 💰");
};
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
// ===== LOGOUT =====
const logoutBtn =
  document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "index.html";

  });

}
