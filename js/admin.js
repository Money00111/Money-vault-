// ======================================
// ADMIN.JS - PART 1
// Money Vault Admin Panel
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

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";



// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");


// ======================================
// ADMIN AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "admin-login.html";
        return;

    }

    try {

        const adminRef = ref(db, "admins/" + user.uid);

        const snap = await get(adminRef);

        if (!snap.exists()) {

            alert("Access Denied!");

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

        const admin = snap.val();

        adminName.textContent =
            admin.name || "Administrator";

        adminEmail.textContent =
            user.email;

        loadingScreen.style.display = "none";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});


// ======================================
// SIDEBAR NAVIGATION
// ======================================

const menuLinks =
document.querySelectorAll(".menu-link");

const sections =
document.querySelectorAll(".page-section");

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        menuLinks.forEach(item =>
            item.classList.remove("active"));

        link.classList.add("active");

        const page =
            link.dataset.page;

        sections.forEach(section =>
            section.classList.remove("active"));

        document
            .getElementById(page + "Section")
            .classList.add("active");

        document
            .getElementById("pageTitle")
            .textContent =
            link.innerText.trim();

    });

});


// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener("click", async () => {

    if (!confirm("Logout Admin?"))
        return;

    await signOut(auth);

    window.location.href =
        "admin-login.html";

});

            
// ======================================
// ADMIN.JS - PART 2
// Dashboard Statistics + Quick Actions
// ======================================


// ======================================
// DASHBOARD ELEMENTS
// ======================================

const totalUsers = document.getElementById("totalUsers");
const dashboardTotalDeposits = document.getElementById("dashboardTotalDeposits");
const dashboardPendingDeposits = document.getElementById("dashboardPendingDeposits");
const dashboardApprovedDeposits = document.getElementById("dashboardApprovedDeposits");
const dashboardTotalWithdraws = document.getElementById("dashboardTotalWithdraws");
const systemBalance = document.getElementById("systemBalance");


// ======================================
// LOAD DASHBOARD
// ======================================

function loadDashboard() {

    // USERS

    onValue(ref(db, "users"), (snapshot) => {

        let users = snapshot.val() || {};

        totalUsers.textContent =
            Object.keys(users).length;

        let balance = 0;

        Object.values(users).forEach(user => {

            balance += Number(user.balance || 0);

        });

        systemBalance.textContent =
            balance.toLocaleString() + " RWF";

    });


    // DEPOSITS

    onValue(ref(db, "depositRequests"), (snapshot) => {

        let deposits = snapshot.val() || {};

        let total = 0;
        let pending = 0;
        let approved = 0;

        Object.values(deposits).forEach(dep => {

            total++;

            if (dep.status === "pending")
                pending++;

            if (dep.status === "approved")
                approved++;

        });

        dashboardTotalDeposits.textContent = total;
        dashboardPendingDeposits.textContent = pending;
        dashboardApprovedDeposits.textContent = approved;

    });


    // WITHDRAWS

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        let withdraws = snapshot.val() || {};

        dashboardTotalWithdraws.textContent =
            Object.keys(withdraws).length;

    });

}

loadDashboard();


// ======================================
// QUICK ACTIONS
// ======================================

const refreshDashboard =
document.getElementById("refreshDashboard");

const openDeposits =
document.getElementById("openDeposits");

const openWithdraws =
document.getElementById("openWithdraws");

const openUsers =
document.getElementById("openUsers");

const openTransactions =
document.getElementById("openTransactions");

const openSettings =
document.getElementById("openSettings");


// REFRESH

refreshDashboard?.addEventListener("click", () => {

    loadDashboard();

    alert("Dashboard Refreshed Successfully.");

});


// OPEN DEPOSITS

openDeposits?.addEventListener("click", () => {

    document
        .querySelector('[data-page="deposits"]')
        .click();

});


// OPEN WITHDRAWS

openWithdraws?.addEventListener("click", () => {

    document
        .querySelector('[data-page="withdraws"]')
        .click();

});


// OPEN USERS

openUsers?.addEventListener("click", () => {

    document
        .querySelector('[data-page="users"]')
        .click();

});


// OPEN TRANSACTIONS

openTransactions?.addEventListener("click", () => {

    document
        .querySelector('[data-page="transactions"]')
        .click();

});


// OPEN SETTINGS

openSettings?.addEventListener("click", () => {

    document
        .querySelector('[data-page="settings"]')
        .click();

});

            
