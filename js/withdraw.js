// ======================================
// WITHDRAW.JS - PART 1A
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    push,
    set,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// HTML ELEMENTS
// ======================================

const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

const logoutBtn =
document.getElementById("logoutBtn");

const loadingScreen =
document.getElementById("loadingScreen");

const withdrawForm =
document.getElementById("withdrawForm");

const availableBalance =
document.getElementById("availableBalance");

const vipStatus =
document.getElementById("vipStatus");

const withdrawAmount =
document.getElementById("withdrawAmount");

const paymentMethod =
document.getElementById("paymentMethod");

const receiverPhone =
document.getElementById("receiverPhone");

const accountName =
document.getElementById("accountName");

const withdrawReason =
document.getElementById("withdrawReason");

const confirmWithdraw =
document.getElementById("confirmWithdraw");

const submitBtn =
document.querySelector(".submit-btn");


// ======================================
// CURRENT USER
// ======================================

let currentUser = null;


// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    loadingScreen.style.display = "none";

    loadUserData();

});


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

    const ok = confirm("Logout?");

    if (!ok) return;

    await signOut(auth);

    window.location.href = "login.html";

});

// ======================================
// WITHDRAW.JS - PART 1A
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    push,
    set,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// HTML ELEMENTS
// ======================================

const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

const logoutBtn =
document.getElementById("logoutBtn");

const loadingScreen =
document.getElementById("loadingScreen");

const withdrawForm =
document.getElementById("withdrawForm");

const availableBalance =
document.getElementById("availableBalance");

const vipStatus =
document.getElementById("vipStatus");

const withdrawAmount =
document.getElementById("withdrawAmount");

const paymentMethod =
document.getElementById("paymentMethod");

const receiverPhone =
document.getElementById("receiverPhone");

const accountName =
document.getElementById("accountName");

const withdrawReason =
document.getElementById("withdrawReason");

const confirmWithdraw =
document.getElementById("confirmWithdraw");

const submitBtn =
document.querySelector(".submit-btn");


// ======================================
// CURRENT USER
// ======================================

let currentUser = null;


// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    loadingScreen.style.display = "none";

    loadUserData();

});


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

    const ok = confirm("Logout?");

    if (!ok) return;

    await signOut(auth);

    window.location.href = "login.html";

});

