// ===============================
// WITHDRAW.JS - PART 1
// ===============================

import { app } from "./firebase.js";

import {
getAuth,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// HTML Elements
// ===============================

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const availableBalance =
document.getElementById("availableBalance");

const vipStatus =
document.getElementById("vipStatus");

const withdrawAmount =
document.getElementById("withdrawAmount");

const enteredAmount =
document.getElementById("enteredAmount");

const withdrawFee =
document.getElementById("withdrawFee");

const receiveAmount =
document.getElementById("receiveAmount");

const summaryAmount =
document.getElementById("summaryAmount");

const summaryFee =
document.getElementById("summaryFee");

const summaryReceive =
document.getElementById("summaryReceive");

// ===============================
// Sidebar
// ===============================

menuBtn?.addEventListener("click",()=>{

sidebar.classList.toggle("active");

});

// ===============================
// Authentication
// ===============================

onAuthStateChanged(auth,async(user)=>{

if(!user){

window.location.href="login.html";

return;

}

loadUserData(user);

});

// ===============================
// Load User Data
// ===============================

async function loadUserData(user){

try{

const userRef = doc(db,"users",user.uid);

const snap = await getDoc(userRef);

if(!snap.exists()) return;

const data = snap.data();

availableBalance.textContent =
`${Number(data.balance || 0).toLocaleString()} RWF`;

vipStatus.textContent =
data.vip || "VIP 0";

}catch(error){

console.error(error);

}

}

// ===============================
// Withdraw Calculator
// ===============================

withdrawAmount?.addEventListener("input",()=>{

const amount =
Number(withdrawAmount.value) || 0;

const fee = amount * 0.05;

const receive = amount - fee;

enteredAmount.textContent =
`${amount.toLocaleString()} RWF`;

withdrawFee.textContent =
`${fee.toLocaleString()} RWF`;

receiveAmount.textContent =
`${receive.toLocaleString()} RWF`;

summaryAmount.textContent =
`${amount.toLocaleString()} RWF`;

summaryFee.textContent =
`${fee.toLocaleString()} RWF`;

summaryReceive.textContent =
`${receive.toLocaleString()} RWF`;

});

// ===============================
// Logout
// ===============================

logoutBtn?.addEventListener("click",async()=>{

await signOut(auth);

window.location.href="login.html";

});

// ===============================
// WITHDRAW.JS - PART 2
// Submit Withdraw Request
// ===============================

import {
collection,
addDoc,
serverTimestamp,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const withdrawForm =
document.getElementById("withdrawForm");

withdrawForm?.addEventListener("submit", async (e)=>{

e.preventDefault();

const user = auth.currentUser;

if(!user){

alert("Please login first.");

return;

}

try{

const amount =
Number(document.getElementById("withdrawAmount").value);

const method =
document.getElementById("paymentMethod").value;

const phone =
document.getElementById("receiverPhone").value;

const accountName =
document.getElementById("accountName").value;

const reason =
document.getElementById("withdrawReason").value;

const confirm =
document.getElementById("confirmWithdraw");

if(!confirm.checked){

alert("Please confirm the information.");

return;

}

// Read User Balance

const userRef = doc(db,"users",user.uid);

const snap = await getDoc(userRef);

const userData = snap.data();

const balance = Number(userData.balance || 0);

// Validation

if(amount < 2000){

alert("Minimum withdraw is 2,000 RWF");

return;

}

if(amount > balance){

alert("Insufficient Balance");

return;

}

// Fee

const fee = amount * 0.05;

const receive = amount - fee;

// Loading

const submitBtn =
document.querySelector(".submit-btn");

submitBtn.disabled = true;

submitBtn.innerHTML = "Processing...";

// Save Withdraw Request

await addDoc(collection(db,"withdraws"),{

userId:user.uid,

email:user.email,

amount,

fee,

receive,

paymentMethod:method,

phone,

accountName,

reason,

status:"Pending",

createdAt:serverTimestamp()

});

// Reserve Balance

await updateDoc(userRef,{

balance:balance-amount

});

// Success

alert("Withdraw request submitted successfully.");

withdrawForm.reset();

submitBtn.disabled=false;

submitBtn.innerHTML="Submit Withdraw Request";

}catch(error){

console.error(error);

alert(error.message);

const submitBtn =
document.querySelector(".submit-btn");

submitBtn.disabled=false;

submitBtn.innerHTML="Submit Withdraw Request";

}

});

// ===============================
// WITHDRAW.JS - PART 3
// Withdraw History (Advanced)
// ===============================

import {
collection,
query,
where,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// HTML Elements
// ===============================

const historyList =
document.getElementById("historyList");

const withdrawStatus =
document.getElementById("withdrawStatus");

// ===============================
// Load Withdraw History
// ===============================

function loadWithdrawHistory(user){

const q=query(

collection(db,"withdraws"),

where("userId","==",user.uid),

orderBy("createdAt","desc")

);

onSnapshot(q,(snapshot)=>{

historyList.innerHTML="";

if(snapshot.empty){

historyList.innerHTML=`

<div class="history-card">

<div>

<h3>No Withdraw History</h3>

<p>You haven't submitted any withdraw request yet.</p>

</div>

<span class="pending">

Waiting

</span>

</div>

`;

withdrawStatus.textContent="No Withdraw Request";

return;

}

// Total Statistics

let totalWithdraw=0;

let approvedCount=0;

let pendingCount=0;

let rejectedCount=0;

snapshot.forEach((doc)=>{

const data=doc.data();

totalWithdraw+=Number(data.amount||0);

if(data.status==="Approved") approvedCount++;

if(data.status==="Pending") pendingCount++;

if(data.status==="Rejected") rejectedCount++;

let badge="pending";

if(data.status==="Approved"){

badge="approved";

}

if(data.status==="Rejected"){

badge="rejected";

}

const date=data.createdAt?.toDate()

? data.createdAt.toDate().toLocaleString()

: "Waiting...";

historyList.innerHTML+=`

<div class="history-card">

<div>

<h3>${Number(data.amount).toLocaleString()} RWF</h3>

<p><strong>Receive:</strong>
${Number(data.receive).toLocaleString()} RWF</p>

<p><strong>Fee:</strong>
${Number(data.fee).toLocaleString()} RWF</p>

<p><strong>Method:</strong>
${data.paymentMethod}</p>

<p><strong>Phone:</strong>
${data.phone}</p>

<p><strong>Account:</strong>
${data.accountName}</p>

<p><strong>Date:</strong>
${date}</p>

</div>

<span class="${badge}">

${data.status}

</span>

</div>

`;

});

// Current Status

const latest=snapshot.docs[0].data();

withdrawStatus.innerHTML=`

<b>${latest.status}</b>

`;

console.log("========== Withdraw Stats ==========");

console.log("Total Withdraw:",totalWithdraw);

console.log("Approved:",approvedCount);

console.log("Pending:",pendingCount);

console.log("Rejected:",rejectedCount);

console.log("====================================");

});

}

// ===============================
// Start
// ===============================

onAuthStateChanged(auth,(user)=>{

if(!user) return;

loadWithdrawHistory(user);

});

// ===============================
// WITHDRAW.JS - PART 4
// Final Functions
// ===============================

// ---------- Toast Notification ----------

function showToast(message, color="#2563eb"){

const toast=document.createElement("div");

toast.innerHTML=message;

toast.style.position="fixed";
toast.style.top="20px";
toast.style.right="20px";
toast.style.padding="15px 22px";
toast.style.background=color;
toast.style.color="#fff";
toast.style.fontWeight="600";
toast.style.borderRadius="12px";
toast.style.boxShadow="0 10px 25px rgba(0,0,0,.25)";
toast.style.zIndex="99999";
toast.style.transition=".3s";

document.body.appendChild(toast);

setTimeout(()=>{

toast.remove();

},3000);

}

// ---------- Internet Status ----------

window.addEventListener("online",()=>{

showToast("✅ Internet Connected","#10b981");

});

window.addEventListener("offline",()=>{

showToast("❌ No Internet Connection","#ef4444");

});

// ---------- Prevent Double Submit ----------

let submitting=false;

withdrawForm?.addEventListener("submit",(e)=>{

if(submitting){

e.preventDefault();

showToast("⏳ Please wait...","#f59e0b");

return;

}

submitting=true;

setTimeout(()=>{

submitting=false;

},3000);

});

// ---------- Extra Validation ----------

withdrawAmount?.addEventListener("input",()=>{

const amount=Number(withdrawAmount.value);

if(amount>500000){

showToast("Maximum withdraw is 500,000 RWF","#ef4444");

withdrawAmount.value=500000;

}

});

// ---------- Confirm Before Submit ----------

withdrawForm?.addEventListener("submit",(e)=>{

const ok=confirm(

"Are you sure you want to submit this withdraw request?"

);

if(!ok){

e.preventDefault();

showToast("Request Cancelled","#ef4444");

}

});

// ---------- Auto Refresh Balance ----------

async function refreshBalance(){

const user=auth.currentUser;

if(!user) return;

await loadUserData(user);

}

setInterval(()=>{

refreshBalance();

},30000);

// ---------- Page Animation ----------

window.addEventListener("load",()=>{

document.body.style.opacity="0";

setTimeout(()=>{

document.body.style.transition="opacity .5s";

document.body.style.opacity="1";

},100);

});

// ---------- Welcome ----------

setTimeout(()=>{

showToast("💸 Withdraw Page Ready","#2563eb");

},800);

// ---------- Console ----------

console.log(`
===================================
       MONEY VAULT PRO
===================================
Withdraw Module Loaded
Firebase Connected
Security Enabled
Calculator Enabled
Realtime Enabled
===================================
`);
