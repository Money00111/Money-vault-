// ======================================
// ADMIN.JS - PART 1A
// FIREBASE IMPORTS + GLOBAL SETUP
// ======================================

// ================================
// FIREBASE IMPORTS
// ================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    onValue,
    update,
    push,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ================================
// DOM HELPER
// ================================

const $ = (id) => document.getElementById(id);


// ================================
// GLOBAL DOM ELEMENTS
// ================================

const loadingScreen = $("loadingScreen");

const adminName = $("adminName");
const adminEmail = $("adminEmail");

const logoutBtn = $("logoutBtn");

const menuBtn = $("menuBtn");

const pageTitle = $("pageTitle");

const menuLinks =
document.querySelectorAll(".menu-link");

const pageSections =
document.querySelectorAll(".page-section");


// ================================
// GLOBAL DATA
// ================================

let currentAdmin = null;

let adminReady = false;

let usersData = {};

let depositsData = {};

let withdrawsData = {};

let vipRequestsData = {};

let bonusRequestsData = {};

let transactionsData = {};


// ================================
// HELPER FUNCTIONS
// ================================

function showLoading() {

    if (loadingScreen) {

        loadingScreen.style.display = "flex";

    }

}

function hideLoading() {

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

}

function showError(error) {

    console.error(error);

    alert(error?.message || error);

}

function formatMoney(amount) {

    return Number(amount || 0).toLocaleString() + " RWF";

}

function formatDate(timestamp) {

    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleString();

}

console.log("ADMIN PART 1A READY");
