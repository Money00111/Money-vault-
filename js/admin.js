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
    update,
     push,
     set
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

// ======================================
// ADMIN.JS PART 3A.1
// LOAD DEPOSIT REQUESTS
// ======================================

const depositList = document.getElementById("depositList");

const emptyDeposit = document.getElementById("emptyDeposit");

let depositsData = {};

function loadDeposits() {

    onValue(ref(db, "depositRequests"), (snapshot) => {

        depositsData = {};

        depositList.innerHTML = "";

        if (!snapshot.exists()) {

            emptyDeposit.style.display = "block";

            return;

        }

        emptyDeposit.style.display = "none";

        snapshot.forEach((child) => {

            const id = child.key;

            const deposit = child.val();

            depositsData[id] = deposit;

        });

        renderDeposits(depositsData);

        updateDepositSummary();

    });

}


// ======================================
// UPDATE SUMMARY
// ======================================

function updateDepositSummary() {

    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    Object.values(depositsData).forEach(dep => {

        total++;

        if (dep.status === "pending") pending++;

        else if (dep.status === "approved") approved++;

        else if (dep.status === "rejected") rejected++;

    });

    document.getElementById("depositTotalCount").textContent = total;

    document.getElementById("depositPendingCount").textContent = pending;

    document.getElementById("depositApprovedCount").textContent = approved;

    document.getElementById("depositRejectedCount").textContent = rejected;

}


// ======================================
// START
// ======================================

loadDeposits();

// ======================================
// ADMIN.JS PART 3A.2
// RENDER DEPOSIT CARDS
// ======================================

function renderDeposits(data) {

    depositList.innerHTML = "";

    const deposits = Object.entries(data);

    if (deposits.length === 0) {

        emptyDeposit.style.display = "block";
        return;

    }

    emptyDeposit.style.display = "none";

    deposits.sort((a, b) => {

        return (b[1].createdAt || 0) - (a[1].createdAt || 0);

    });

    deposits.forEach(([id, deposit]) => {

        const status = deposit.status || "pending";

        const card = document.createElement("div");

        card.className = "request-card";

        card.innerHTML = `

        <div class="request-top">

            <h3>${deposit.email || "Unknown User"}</h3>

            <span class="status ${status}">

                ${status.toUpperCase()}

            </span>

        </div>

        <p><strong>Amount:</strong>
        ${Number(deposit.amount || 0).toLocaleString()} RWF</p>

        <p><strong>Method:</strong>
        ${deposit.paymentMethod || "-"}</p>

        <p><strong>Phone:</strong>
        ${deposit.senderPhone || "-"}</p>

        <p><strong>Transaction ID:</strong>
        ${deposit.transactionId || "-"}</p>

        <p><strong>Payment Date:</strong>
        ${deposit.paymentDate || "-"}</p>

        <p><strong>Note:</strong>
        ${deposit.note || "No Note"}</p>

        <div class="action-buttons">

            ${
                status === "pending"
                ? `
                <button
                    class="approveBtn"
                    data-id="${id}">

                    <i class="fa-solid fa-circle-check"></i>

                    Approve

                </button>

                <button
                    class="rejectBtn"
                    data-id="${id}">

                    <i class="fa-solid fa-circle-xmark"></i>

                    Reject

                </button>
                `
                : `
                <button disabled>

                    ${status.toUpperCase()}

                </button>
                `
            }

        </div>

        `;

        depositList.appendChild(card);

    });

}

// ======================================
// ADMIN.JS PART 3A.2
// RENDER DEPOSIT CARDS
// ======================================

function renderDeposits(data) {

    depositList.innerHTML = "";

    const deposits = Object.entries(data);

    if (deposits.length === 0) {

        emptyDeposit.style.display = "block";
        return;

    }

    emptyDeposit.style.display = "none";

    deposits.sort((a, b) => {

        return (b[1].createdAt || 0) - (a[1].createdAt || 0);

    });

    deposits.forEach(([id, deposit]) => {

        const status = deposit.status || "pending";

        const card = document.createElement("div");

        card.className = "request-card";

        card.innerHTML = `

        <div class="request-top">

            <h3>${deposit.email || "Unknown User"}</h3>

            <span class="status ${status}">

                ${status.toUpperCase()}

            </span>

        </div>

        <p><strong>Amount:</strong>
        ${Number(deposit.amount || 0).toLocaleString()} RWF</p>

        <p><strong>Method:</strong>
        ${deposit.paymentMethod || "-"}</p>

        <p><strong>Phone:</strong>
        ${deposit.senderPhone || "-"}</p>

        <p><strong>Transaction ID:</strong>
        ${deposit.transactionId || "-"}</p>

        <p><strong>Payment Date:</strong>
        ${deposit.paymentDate || "-"}</p>

        <p><strong>Note:</strong>
        ${deposit.note || "No Note"}</p>

        <div class="action-buttons">

            ${
                status === "pending"
                ? `
                <button
                    class="approveBtn"
                    data-id="${id}">

                    <i class="fa-solid fa-circle-check"></i>

                    Approve

                </button>

                <button
                    class="rejectBtn"
                    data-id="${id}">

                    <i class="fa-solid fa-circle-xmark"></i>

                    Reject

                </button>
                `
                : `
                <button disabled>

                    ${status.toUpperCase()}

                </button>
                `
            }

        </div>

        `;

        depositList.appendChild(card);

    });

}

// ======================================
// ADMIN.JS PART 3C
// REJECT + SEARCH + FILTER
// ======================================

// REJECT DEPOSIT

depositList.addEventListener("click", async (e) => {

    const btn = e.target.closest(".rejectBtn");

    if (!btn) return;

    const depositId = btn.dataset.id;

    const deposit = depositsData[depositId];

    if (!deposit) return;

    if (deposit.status !== "pending") {

        alert("This deposit has already been processed.");

        return;

    }

    const ok = confirm("Reject this deposit?");

    if (!ok) return;

    try {

        await update(

            ref(db, "depositRequests/" + depositId),

            {

                status: "rejected",

                rejectedAt: Date.now()

            }

        );

        // onValue() izahita ivugurura page

        alert("Deposit Rejected Successfully.");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});


// ======================================
// SEARCH
// ======================================

const depositSearch =
document.getElementById("depositSearch");

depositSearch?.addEventListener("input", () => {

    applyDepositFilter();

});


// ======================================
// FILTER
// ======================================

const depositFilter =
document.getElementById("depositFilter");

depositFilter?.addEventListener("change", () => {

    applyDepositFilter();

});


// ======================================
// APPLY SEARCH + FILTER
// ======================================

function applyDepositFilter() {

    const keyword =
        (depositSearch.value || "")
        .toLowerCase()
        .trim();

    const filter =
        depositFilter.value;

    const filtered = {};

    Object.entries(depositsData).forEach(([id, dep]) => {

        const email =
            (dep.email || "")
            .toLowerCase();

        const phone =
            (dep.senderPhone || "")
            .toLowerCase();

        const tx =
            (dep.transactionId || "")
            .toLowerCase();

        const matchesSearch =

            email.includes(keyword) ||

            phone.includes(keyword) ||

            tx.includes(keyword);

        const matchesFilter =

            filter === "all" ||

            dep.status === filter;

        if (matchesSearch && matchesFilter) {

            filtered[id] = dep;

        }

    });

    renderDeposits(filtered);

}

    // ======================================
// ADMIN.JS PART 4A
// LOAD WITHDRAW REQUESTS
// ======================================

const withdrawList = document.getElementById("withdrawList");
const emptyWithdraw = document.getElementById("emptyWithdraw");

let withdrawsData = {};

function loadWithdraws() {

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        withdrawsData = {};

        withdrawList.innerHTML = "";

        if (!snapshot.exists()) {

            emptyWithdraw.style.display = "block";

            updateWithdrawSummary();

            return;

        }

        emptyWithdraw.style.display = "none";

        snapshot.forEach((child) => {

            withdrawsData[child.key] = child.val();

        });

        renderWithdraws(withdrawsData);

        updateWithdrawSummary();

    });

}


// ======================================
// RENDER WITHDRAW CARDS
// ======================================

function renderWithdraws(data) {

    withdrawList.innerHTML = "";

    const requests = Object.entries(data);

    if (requests.length === 0) {

        emptyWithdraw.style.display = "block";

        return;

    }

    emptyWithdraw.style.display = "none";

    requests.sort((a, b) => {

        return (b[1].createdAt || 0) - (a[1].createdAt || 0);

    });

    requests.forEach(([id, withdraw]) => {

        const status = withdraw.status || "pending";

        const card = document.createElement("div");

        card.className = "request-card";

        card.innerHTML = `

        <div class="request-top">

            <h3>${withdraw.email || "Unknown User"}</h3>

            <span class="status ${status}">

                ${status.toUpperCase()}

            </span>

        </div>

        <p><strong>Amount:</strong>
        ${Number(withdraw.amount || 0).toLocaleString()} RWF</p>

        <p><strong>Method:</strong>
        ${withdraw.paymentMethod || "-"}</p>

        <p><strong>Phone:</strong>
        ${withdraw.phone || "-"}</p>

        <p><strong>Account:</strong>
        ${withdraw.accountNumber || "-"}</p>

        <p><strong>Date:</strong>
        ${withdraw.requestDate || "-"}</p>

        <div class="action-buttons">

        ${
        status === "pending"

        ?

        `

        <button
        class="approveWithdrawBtn"
        data-id="${id}">

        <i class="fa-solid fa-circle-check"></i>

        Approve

        </button>

        <button
        class="rejectWithdrawBtn"
        data-id="${id}">

        <i class="fa-solid fa-circle-xmark"></i>

        Reject

        </button>

        `

        :

        `

        <button disabled>

        ${status.toUpperCase()}

        </button>

        `

        }

        </div>

        `;

        withdrawList.appendChild(card);

    });

}


// ======================================
// UPDATE SUMMARY
// ======================================

function updateWithdrawSummary() {

    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    Object.values(withdrawsData).forEach(w => {

        total++;

        if (w.status === "pending") pending++;

        else if (w.status === "approved") approved++;

        else if (w.status === "rejected") rejected++;

    });

    document.getElementById("withdrawTotalCount").textContent = total;

    document.getElementById("withdrawPendingCount").textContent = pending;

    document.getElementById("withdrawApprovedCount").textContent = approved;

    document.getElementById("withdrawRejectedCount").textContent = rejected;

}


// ======================================
// START
// ======================================

loadWithdraws();


