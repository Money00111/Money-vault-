// ======================================
// VIP.JS - PART 1
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const balance = document.getElementById("balance");

const currentVip = document.getElementById("currentVip");
const dailyIncome = document.getElementById("dailyIncome");
const totalProfit = document.getElementById("totalProfit");

// ======================================
// CURRENT USER
// ======================================

let currentUser = null;
let userData = {};

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    if (!confirm("Logout from Money Vault?")) return;

    try {

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    currentUser = user;

    loadUserData();

});

// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    const userRef = ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {

        loadingScreen.style.display = "none";

        if (!snapshot.exists()) return;

        userData = snapshot.val();

        balance.textContent =
            Number(userData.balance || 0).toLocaleString() + " RWF";

        currentVip.textContent =
            userData.vip || "VIP 0";

        dailyIncome.textContent =
            Number(userData.dailyIncome || 0).toLocaleString() + " RWF";

        totalProfit.textContent =
            Number(userData.totalProfit || 0).toLocaleString() + " RWF";

    });

}

console.log("VIP Part 1 Loaded");

