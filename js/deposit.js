// ======================================
// DEPOSIT.JS PART 1
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    push,
    set,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const depositForm = document.getElementById("depositForm");

const amount = document.getElementById("amount");

const paymentMethod = document.getElementById("paymentMethod");

const senderPhone = document.getElementById("senderPhone");

const transactionId = document.getElementById("transactionId");

const paymentDate = document.getElementById("paymentDate");

const note = document.getElementById("note");

const submitBtn = document.getElementById("submitBtn");

const depositStatus = document.getElementById("depositStatus");

const historyList = document.getElementById("historyList");

const loadingScreen = document.getElementById("loadingScreen");

const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");

const sidebar = document.getElementById("sidebar");

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

});

       // ======================================
// DEPOSIT.JS PART 2
// SIDEBAR + COPY + LOGOUT
// ======================================

// Mobile Menu

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// COPY PAYMENT NUMBERS
// ======================================

const mtnNumber = document.getElementById("mtnNumber");
const airtelNumber = document.getElementById("airtelNumber");

const copyMTN = document.getElementById("copyMTN");
const copyAirtel = document.getElementById("copyAirtel");

copyMTN?.addEventListener("click", async () => {

    try{

        await navigator.clipboard.writeText(mtnNumber.textContent.trim());

        alert("MTN number copied successfully.");

    }catch(error){

        alert("Failed to copy MTN number.");

    }

});

copyAirtel?.addEventListener("click", async () => {

    try{

        await navigator.clipboard.writeText(airtelNumber.textContent.trim());

        alert("Airtel number copied successfully.");

    }catch(error){

        alert("Failed to copy Airtel number.");

    }

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Are you sure you want to logout?");

    if(!ok) return;

    try{

        await signOut(auth);

        window.location.href = "login.html";

    }catch(error){

        alert(error.message);

    }

});

// ======================================
// DEFAULT PAYMENT DATE
// ======================================

const now = new Date();

const offset = now.getTimezoneOffset();

const local = new Date(now.getTime() - (offset * 60000));

paymentDate.value = local.toISOString().slice(0,16);          

