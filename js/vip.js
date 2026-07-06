// ======================================
// VIP.JS - PART 1
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const loadingScreen = document.getElementById("loadingScreen");
const userBalance = document.getElementById("userBalance");

const vipButtons = document.querySelectorAll(".buyVipBtn");

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadUser(user);

});

// ======================================
// LOAD USER DATA
// ======================================

function loadUser(user){

const userRef = ref(db,"users/"+user.uid);

onValue(userRef,(snapshot)=>{

if(!snapshot.exists()) return;

const data = snapshot.val();

const balance = Number(data.balance || 0);

userBalance.textContent =
balance.toLocaleString()+" RWF";

const currentVip = data.vip || "";

vipButtons.forEach(btn=>{

if(btn.dataset.vip === currentVip){

btn.innerHTML="✅ ACTIVE";

btn.disabled=true;

btn.classList.add("activeVip");

}

});

loadingScreen.style.display="none";

});

}

console.log("VIP Part 1 Loaded");
