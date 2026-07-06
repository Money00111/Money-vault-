import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const content = document.getElementById("content");
const title = document.getElementById("title");

// =======================
// ADMIN CHECK
// =======================
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  // 👉 SIMPLE ADMIN CHECK (change email)
  if (user.email !== "admin@moneyvault.com") {
    alert("Not admin");
    await signOut(auth);
    return;
  }

  loadDeposits();
});

// =======================
// TABS
// =======================
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".tab-btn")
    .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const tab = btn.dataset.tab;

    if (tab === "deposits") loadDeposits();
    if (tab === "withdraws") loadWithdraws();
    if (tab === "users") loadUsers();

  });
});

// =======================
// DEPOSITS
// =======================
async function loadDeposits() {

  title.innerText = "Deposits";

  const q = query(collection(db, "deposits"));

  const snap = await getDocs(q);

  content.innerHTML = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();

    content.innerHTML += `
      <div class="card">
        <p>User: ${d.userId}</p>
        <p>Amount: ${d.amount}</p>
        <p>Status: ${d.status}</p>

        <button onclick="approveDeposit('${docSnap.id}','${d.userId}',${d.amount})">
          Approve
        </button>

        <button onclick="rejectDeposit('${docSnap.id}')">
          Reject
        </button>
      </div>
    `;
  });
}

// =======================
// WITHDRAWS
// =======================
async function loadWithdraws() {

  title.innerText = "Withdraws";

  const q = query(collection(db, "withdraws"));

  const snap = await getDocs(q);

  content.innerHTML = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();

    content.innerHTML += `
      <div class="card">
        <p>User: ${d.userId}</p>
        <p>Amount: ${d.amount}</p>
        <p>Status: ${d.status}</p>

        <button onclick="approveWithdraw('${docSnap.id}','${d.userId}',${d.amount})">
          Approve
        </button>

        <button onclick="rejectWithdraw('${docSnap.id}')">
          Reject
        </button>
      </div>
    `;
  });
}

// =======================
// USERS
// =======================
async function loadUsers() {

  title.innerText = "Users";

  const q = query(collection(db, "users"));

  const snap = await getDocs(q);

  content.innerHTML = "";

  snap.forEach(docSnap => {

    const u = docSnap.data();

    content.innerHTML += `
      <div class="card">
        <p>Name: ${u.fullName}</p>
        <p>Balance: ${u.balance}</p>
        <p>VIP: ${u.vip}</p>
      </div>
    `;
  });
}

// =======================
// APPROVE DEPOSIT
// =======================
window.approveDeposit = async (id, userId, amount) => {

  await updateDoc(doc(db, "deposits", id), {
    status: "Approved"
  });

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  const current = userSnap.data().balance || 0;

  await updateDoc(userRef, {
    balance: current + Number(amount)
  });

  alert("Deposit Approved");
};

// =======================
// REJECT DEPOSIT
// =======================
window.rejectDeposit = async (id) => {

  await updateDoc(doc(db, "deposits", id), {
    status: "Rejected"
  });

  alert("Deposit Rejected");
};

// =======================
// APPROVE WITHDRAW
// =======================
window.approveWithdraw = async (id, userId, amount) => {

  await updateDoc(doc(db, "withdraws", id), {
    status: "Approved"
  });

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  const current = userSnap.data().balance || 0;

  await updateDoc(userRef, {
    balance: current - Number(amount)
  });

  alert("Withdraw Approved");
};

// =======================
// REJECT WITHDRAW
// =======================
window.rejectWithdraw = async (id) => {

  await updateDoc(doc(db, "withdraws", id), {
    status: "Rejected"
  });

  alert("Withdraw Rejected");
};

// =======================
// LOGOUT
// =======================
document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  window.location.href = "../login.html";
};
