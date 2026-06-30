import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =======================
// AUTH CHECK
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Username
  document.getElementById("username").innerText =
    user.displayName || "User";

  loadUserData(user.uid);
});

// =======================
// LOAD USER DATA (REALTIME)
// =======================
function loadUserData(uid) {
  const ref = doc(db, "users", uid);

  onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    // Balance
    document.getElementById("balanceBox").innerText =
      (data.balance || 0) + " RWF";

    // VIP
    document.getElementById("vipLevel").innerText =
      "VIP " + (data.vip || 0);

    document.getElementById("vipStatus").innerText =
      data.vip > 0 ? "Active" : "Inactive";

    // Referral
    document.getElementById("refBonus").innerText =
      (data.refBonus || 0) + " RWF";

    document.getElementById("referralBox").innerText =
      (data.refBonus || 0) + " RWF";

    // Deposit / Withdraw
    document.getElementById("depositTotal").innerText =
      (data.depositTotal || 0) + " RWF";

    document.getElementById("withdrawTotal").innerText =
      (data.withdrawTotal || 0) + " RWF";

    // Earnings
    document.getElementById("earningsBox").innerText =
      (data.earnings || 0) + " RWF";
  });
}

// =======================
// LOGOUT
// =======================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
