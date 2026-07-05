// ======================================
// PROFILE.JS - PART 1A
// Realtime Database Version
// ======================================

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
ref,
get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loadingScreen = document.getElementById("loadingScreen");

const profilePhoto = document.getElementById("profilePhoto");

const fullName = document.getElementById("fullName");
const userEmail = document.getElementById("userEmail");

const balance = document.getElementById("balance");
const bonus = document.getElementById("bonus");
const referralBonus = document.getElementById("referralBonus");

const vipLevel = document.getElementById("vipLevel");
const vipCard = document.getElementById("vipCard");

const totalDeposit = document.getElementById("totalDeposit");
const totalWithdraw = document.getElementById("totalWithdraw");
const totalTransactions = document.getElementById("totalTransactions");

const accountId = document.getElementById("accountId");
const joinDate = document.getElementById("joinDate");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const countryInput = document.getElementById("country");
const addressInput = document.getElementById("address");

// ======================================
// MENU
// ======================================

menuBtn?.addEventListener("click",()=>{

sidebar.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click",async(e)=>{

e.preventDefault();

if(!confirm("Logout now?")) return;

try{

await signOut(auth);

window.location.href="login.html";

}catch(err){

alert(err.message);

}

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth,async(user)=>{

if(!user){

window.location.href="login.html";

return;

}

await loadProfile(user);

setTimeout(()=>{

loadingScreen.style.display="none";

},800);

});

// ======================================
// LOAD PROFILE
// ======================================

async function loadProfile(user){

try{

const snapshot = await get(ref(db,"users/"+user.uid));

if(!snapshot.exists()) return;

const data = snapshot.val();

// Header

fullName.textContent =
data.fullName || "Money Vault User";

userEmail.textContent =
user.email;

// Wallet

balance.textContent =
(Number(data.balance)||0).toLocaleString()+" RWF";

bonus.textContent =
(Number(data.bonus)||0).toLocaleString()+" RWF";

referralBonus.textContent =
(Number(data.referralBonus)||0).toLocaleString()+" RWF";

// VIP

vipLevel.textContent =
data.vip || "VIP 0";

vipCard.textContent =
data.vip || "VIP 0";

// Statistics

totalDeposit.textContent =
(Number(data.totalDeposit)||0).toLocaleString()+" RWF";

totalWithdraw.textContent =
(Number(data.totalWithdraw)||0).toLocaleString()+" RWF";

totalTransactions.textContent =
data.totalTransactions || 0;

// Account

accountId.textContent =
user.uid.substring(0,12);

joinDate.textContent =
new Date(user.metadata.creationTime).toLocaleDateString();

// Form

nameInput.value =
data.fullName || "";

phoneInput.value =
data.phone || "";

emailInput.value =
user.email;

countryInput.value =
data.country || "Rwanda";

addressInput.value =
data.address || "";

// Photo

if(data.photoURL){

profilePhoto.src =
data.photoURL;

}

}catch(error){

console.error(error);

alert("Failed to load profile.");

}

}

console.log("Profile Loaded Successfully");


