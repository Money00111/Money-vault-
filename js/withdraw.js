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

