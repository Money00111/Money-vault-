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

// ===== LOGOUT =====
const logoutBtn =
  document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "index.html";

  });

  }
