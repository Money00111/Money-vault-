// ======================================
// PROFILE.JS - PART 1A
// Firebase + Authentication
// ======================================

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ======================================
// HTML ELEMENTS
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

const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const countryInput = document.getElementById("country");
const addressInput = document.getElementById("address");

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

sidebar.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e)=>{

e.preventDefault();

const ok = confirm("Logout from your account?");

if(!ok) return;

try{

await signOut(auth);

window.location.href="login.html";

}catch(error){

alert(error.message);

}

});

// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location.href="login.html";

return;

}

await loadProfile(user);

hideLoading();

});

// ======================================
// HIDE LOADING
// ======================================

function hideLoading(){

setTimeout(()=>{

loadingScreen.style.display="none";

},800);

    }

// ======================================
// LOAD USER PROFILE
// ======================================

async function loadProfile(user){

try{

const userRef = doc(db,"users",user.uid);

const snap = await getDoc(userRef);

if(!snap.exists()) return;

const data = snap.data();

// Header

fullName.textContent =
data.fullName || "Money Vault User";

userEmail.textContent =
user.email;

// Wallet

balance.textContent =
Number(data.balance || 0).toLocaleString()+" RWF";

bonus.textContent =
Number(data.bonus || 0).toLocaleString()+" RWF";

referralBonus.textContent =
Number(data.referralBonus || 0).toLocaleString()+" RWF";

// VIP

vipLevel.textContent =
data.vip || "VIP 0";

vipCard.textContent =
data.vip || "VIP 0";

// Statistics

totalDeposit.textContent =
Number(data.totalDeposit || 0).toLocaleString()+" RWF";

totalWithdraw.textContent =
Number(data.totalWithdraw || 0).toLocaleString()+" RWF";

totalTransactions.textContent =
data.totalTransactions || 0;

// Account

accountId.textContent =
user.uid.substring(0,12);

if(user.metadata.creationTime){

joinDate.textContent =
new Date(
user.metadata.creationTime
).toLocaleDateString();

}

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

console.log("Profile Part 1 Loaded");

