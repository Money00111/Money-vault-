// ======================================
// ADMIN.JS - PART 1
// FIREBASE + AUTH + GLOBAL SETUP
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
    set,
    update,
    push,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ================================
// GLOBAL VARIABLES
// ================================

let currentAdmin = null;


// ================================
// DOM ELEMENTS
// ================================

const loadingScreen = document.getElementById("loadingScreen");
const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const pageTitle = document.getElementById("pageTitle");

const menuLinks = document.querySelectorAll(".menu-link");
const sections = document.querySelectorAll(".page-section");


// ================================
// AUTH CHECK
// ================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentAdmin = user;

    const adminSnap = await get(ref(db, "admins/" + user.uid));

    if (!adminSnap.exists()) {

        alert("Access denied");

        await signOut(auth);

        window.location.href = "login.html";

        return;
    }

    const admin = adminSnap.val();

    if (adminName) {
        adminName.textContent = admin.name || "Administrator";
    }

    if (adminEmail) {
        adminEmail.textContent = user.email || "";
    }

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    // Start dashboard
    loadDashboardFinal();

});


// ================================
// LOGOUT
// ================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });

}


// ================================
// MOBILE MENU
// ================================

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("active");

    });

}


// ================================
// PAGE NAVIGATION
// ================================

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        openPage(link.dataset.page);

    });

});


function openPage(page) {

    sections.forEach(section =>
        section.classList.remove("active")
    );

    menuLinks.forEach(link =>
        link.classList.remove("active")
    );

    const target = document.getElementById(page + "Section");

    if (target) {
        target.classList.add("active");
    }

    const activeLink = document.querySelector(`[data-page="${page}"]`);

    if (activeLink) {
        activeLink.classList.add("active");
    }

    if (pageTitle) {
        pageTitle.textContent =
            page.charAt(0).toUpperCase() + page.slice(1);
    }

}

// ======================================
// ADMIN.JS - PART 2
// DASHBOARD FUNCTIONS
// ======================================

// ================================
// UPDATE TEXT HELPER
// ================================

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// ================================
// LOAD DASHBOARD
// ================================

function loadDashboardFinal() {

    loadUsersCount();
    loadDepositStatistics();
    loadWithdrawStatistics();
    loadSystemBalance();
    loadRecentActivity();

}


// ================================
// TOTAL USERS
// ================================

function loadUsersCount() {

    onValue(ref(db, "users"), (snapshot) => {

        const total = snapshot.exists()
            ? Object.keys(snapshot.val()).length
            : 0;

        updateText("totalUsers", total);

    });

}


// ================================
// DEPOSIT STATISTICS
// ================================

function loadDepositStatistics() {

    onValue(ref(db, "depositRequests"), (snapshot) => {

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(item => {

                total++;

                if (item.status === "pending") pending++;
                else if (item.status === "approved") approved++;
                else if (item.status === "rejected") rejected++;

            });

        }

        updateText("dashboardTotalDeposits", total);
        updateText("dashboardPendingDeposits", pending);
        updateText("dashboardApprovedDeposits", approved);

        updateText("depositTotalCount", total);
        updateText("depositPendingCount", pending);
        updateText("depositApprovedCount", approved);
        updateText("depositRejectedCount", rejected);

    });

}


// ================================
// WITHDRAW STATISTICS
// ================================

function loadWithdrawStatistics() {

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(item => {

                total++;

                if (item.status === "pending") pending++;
                else if (item.status === "approved") approved++;
                else if (item.status === "rejected") rejected++;

            });

        }

        updateText("dashboardTotalWithdraws", total);

        updateText("withdrawTotalCount", total);
        updateText("withdrawPendingCount", pending);
        updateText("withdrawApprovedCount", approved);
        updateText("withdrawRejectedCount", rejected);

    });

}


// ================================
// SYSTEM BALANCE
// ================================

function loadSystemBalance() {

    onValue(ref(db, "users"), (snapshot) => {

        let totalBalance = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(user => {

                totalBalance += Number(user.balance || 0);

            });

        }

        updateText(
            "systemBalance",
            totalBalance.toLocaleString() + " RWF"
        );

    });

}


// ================================
// RECENT ACTIVITY
// ================================

function loadRecentActivity() {

    const activityBox =
        document.getElementById("recentActivity");

    if (!activityBox) return;

    onValue(ref(db, "transactions"), (snapshot) => {

        activityBox.innerHTML = "";

        if (!snapshot.exists()) {

            activityBox.innerHTML =
                "<p>No recent activity</p>";

            return;

        }

        Object.entries(snapshot.val())
            .reverse()
            .slice(0, 10)
            .forEach(([id, item]) => {

                const div = document.createElement("div");

                div.className = "activity-item";

                div.innerHTML = `
                    <strong>${(item.type || "transaction").toUpperCase()}</strong>
                    - ${Number(item.amount || 0).toLocaleString()} RWF
                    <span class="status ${item.status}">
                        ${item.status}
                    </span>
                `;

                activityBox.appendChild(div);

            });

    });

}

// ======================================
// ADMIN.JS - PART 2
// DASHBOARD FUNCTIONS
// ======================================

// ================================
// UPDATE TEXT HELPER
// ================================

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// ================================
// LOAD DASHBOARD
// ================================

function loadDashboardFinal() {

    loadUsersCount();
    loadDepositStatistics();
    loadWithdrawStatistics();
    loadSystemBalance();
    loadRecentActivity();

}


// ================================
// TOTAL USERS
// ================================

function loadUsersCount() {

    onValue(ref(db, "users"), (snapshot) => {

        const total = snapshot.exists()
            ? Object.keys(snapshot.val()).length
            : 0;

        updateText("totalUsers", total);

    });

}


// ================================
// DEPOSIT STATISTICS
// ================================

function loadDepositStatistics() {

    onValue(ref(db, "depositRequests"), (snapshot) => {

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(item => {

                total++;

                if (item.status === "pending") pending++;
                else if (item.status === "approved") approved++;
                else if (item.status === "rejected") rejected++;

            });

        }

        updateText("dashboardTotalDeposits", total);
        updateText("dashboardPendingDeposits", pending);
        updateText("dashboardApprovedDeposits", approved);

        updateText("depositTotalCount", total);
        updateText("depositPendingCount", pending);
        updateText("depositApprovedCount", approved);
        updateText("depositRejectedCount", rejected);

    });

}


// ================================
// WITHDRAW STATISTICS
// ================================

function loadWithdrawStatistics() {

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(item => {

                total++;

                if (item.status === "pending") pending++;
                else if (item.status === "approved") approved++;
                else if (item.status === "rejected") rejected++;

            });

        }

        updateText("dashboardTotalWithdraws", total);

        updateText("withdrawTotalCount", total);
        updateText("withdrawPendingCount", pending);
        updateText("withdrawApprovedCount", approved);
        updateText("withdrawRejectedCount", rejected);

    });

}


// ================================
// SYSTEM BALANCE
// ================================

function loadSystemBalance() {

    onValue(ref(db, "users"), (snapshot) => {

        let totalBalance = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(user => {

                totalBalance += Number(user.balance || 0);

            });

        }

        updateText(
            "systemBalance",
            totalBalance.toLocaleString() + " RWF"
        );

    });

}


// ================================
// RECENT ACTIVITY
// ================================

function loadRecentActivity() {

    const activityBox =
        document.getElementById("recentActivity");

    if (!activityBox) return;

    onValue(ref(db, "transactions"), (snapshot) => {

        activityBox.innerHTML = "";

        if (!snapshot.exists()) {

            activityBox.innerHTML =
                "<p>No recent activity</p>";

            return;

        }

        Object.entries(snapshot.val())
            .reverse()
            .slice(0, 10)
            .forEach(([id, item]) => {

                const div = document.createElement("div");

                div.className = "activity-item";

                div.innerHTML = `
                    <strong>${(item.type || "transaction").toUpperCase()}</strong>
                    - ${Number(item.amount || 0).toLocaleString()} RWF
                    <span class="status ${item.status}">
                        ${item.status}
                    </span>
                `;

                activityBox.appendChild(div);

            });

    });

}

