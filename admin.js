import { db } from "./firebase.js";
window.approveDep = async (id) => {

  const depRef = ref(db, "depositRequests/" + id);

  const snap = await get(depRef);
  const data = snap.val();

  if (!data) return;

  // 1. mark approved
  await update(depRef, {
    status: "approved"
  });

  // 2. add balance to user
  const userRef = ref(db, "users/" + data.uid);

  const userSnap = await get(userRef);
  const userData = userSnap.val();

  const currentBalance = userData?.balance || 0;

  await update(userRef, {
    balance: currentBalance + data.amount
  });

  alert("Deposit approved + balance updated");
};
const depositRef = ref(db, "depositRequests");

onValue(depositRef, (snapshot) => {
  const data = snapshot.val();
  const list = document.getElementById("depositList");

  list.innerHTML = "";

  for (let id in data) {
    const d = data[id];

    list.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px;">
        <p>Amount: ${d.amount}</p>
        <p>Number: ${d.number}</p>
        <p>Method: ${d.method}</p>
        <p>Status: ${d.status}</p>

        <button onclick="approveDeposit('${id}')">Approve</button>
        <button onclick="rejectDeposit('${id}')">Reject</button>
      </div>
    `;
  }
  });
  const withdrawRef = ref(db, "withdrawRequests");

onValue(withdrawRef, (snapshot) => {
  const data = snapshot.val();
  const list = document.getElementById("withdrawList");

  list.innerHTML = "";

  for (let id in data) {
    const w = data[id];

    list.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px;">
        <p>Amount: ${w.amount}</p>
        <p>Number: ${w.number}</p>
        <p>Method: ${w.method}</p>
        <p>Status: ${w.status}</p>

        <button onclick="approveWithdraw('${id}')">Approve</button>
        <button onclick="rejectWithdraw('${id}')">Reject</button>
      </div>
    `;
  }
});
  window.approveDeposit = async function(id){
  await update(ref(db, "depositRequests/" + id), {
    status: "approved"
  });
};

window.rejectDeposit = async function(id){
  await update(ref(db, "depositRequests/" + id), {
    status: "rejected"
  });
};

window.approveWithdraw = async function(id){
  await update(ref(db, "withdrawRequests/" + id), {
    status: "approved"
  });
};

window.rejectWithdraw = async function(id){
  await update(ref(db, "withdrawRequests/" + id), {
    status: "rejected"
  });
};
window.approveW = async (id) => {

  const wRef = ref(db, "withdrawRequests/" + id);

  const snap = await get(wRef);
  const data = snap.val();

  if (!data) return;

  // 1. mark approved
  await update(wRef, {
    status: "approved"
  });

  // 2. reduce user balance
  const userRef = ref(db, "users/" + data.uid);

  const userSnap = await get(userRef);
  const userData = userSnap.val();

  const currentBalance = userData?.balance || 0;

  await update(userRef, {
    balance: currentBalance - data.amount
  });

  alert("Withdraw approved + balance updated");
};

