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

