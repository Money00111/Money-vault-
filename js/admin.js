// ==========================================
// ADMIN.JS — PART 1
// Money Vault Admin Panel
// Firebase Auth + Realtime Database
// ==========================================

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
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ==========================================
// ADMIN STATE
// ==========================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise = new Promise((resolve) => {
    resolveAdminReady = resolve;
});


// ==========================================
// GLOBAL ADMIN STATE
// ==========================================

window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    readyPromise: adminReadyPromise

};


// ==========================================
// WAIT FOR ADMIN
// ==========================================

window.waitForAdmin = function () {

    return adminReadyPromise;

};


// ==========================================
// HTML ELEMENTS
// ==========================================

const loadingScreen =
    document.getElementById("loadingScreen");

const adminName =
    document.getElementById("adminName");

const adminEmail =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const pageTitle =
    document.getElementById("pageTitle");

const menuLinks =
    document.querySelectorAll(".menu-link");


// IMPORTANT:
// HTML ikoresha .page-section
// ntabwo ikoresha .admin-section

const sections =
    document.querySelectorAll(".page-section");


// ==========================================
// LOADING SCREEN
// ==========================================

function hideLoadingScreen() {

    if (!loadingScreen) return;

    loadingScreen.style.display = "none";

}


function showLoadingScreen() {

    if (!loadingScreen) return;

    loadingScreen.style.display = "flex";

}


// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    try {

        // ----------------------------------
        // USER ATARI LOGGED IN
        // ----------------------------------

        if (!user) {

            window.location.href = "login.html";

            return;

        }


        console.log(
            "Checking administrator:",
            user.uid
        );


        // ----------------------------------
        // CHECK ADMIN
        // ----------------------------------

        const adminRef =
            ref(db, `admins/${user.uid}`);

        const adminSnapshot =
            await get(adminRef);


        // ----------------------------------
        // NOT ADMIN
        // ----------------------------------

        if (!adminSnapshot.exists()) {

            alert(
                "Accès refusé. Vous n'êtes pas administrateur."
            );

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }


        // ----------------------------------
        // ADMIN DATA
        // ----------------------------------

        const adminData =
            adminSnapshot.val() || {};


        currentAdmin = {

            uid: user.uid,

            email: user.email || "",

            ...adminData

        };


        adminReady = true;


        resolveAdminReady(
            currentAdmin
        );


        // ----------------------------------
        // DISPLAY ADMIN NAME
        // ----------------------------------

        if (adminName) {

            adminName.textContent =
                currentAdmin.name ||
                currentAdmin.displayName ||
                "Administrator";

        }


        // ----------------------------------
        // DISPLAY ADMIN EMAIL
        // ----------------------------------

        if (adminEmail) {

            adminEmail.textContent =
                user.email || "";

        }


        // ----------------------------------
        // HIDE LOADING
        // ----------------------------------

        hideLoadingScreen();


        // ==================================
        // LOAD DASHBOARD
        // ==================================

        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        // ==================================
        // LOAD DEPOSITS
        // ==================================

        if (
            typeof window.loadDeposits ===
            "function"
        ) {

            window.loadDeposits();

        }


        // ==================================
        // LOAD WITHDRAWS
        // ==================================

        if (
            typeof window.loadWithdraws ===
            "function"
        ) {

            window.loadWithdraws();

        }


        // ==================================
        // LOAD VIP REQUESTS
        // ==================================

        if (
            typeof window.loadVipRequests ===
            "function"
        ) {

            window.loadVipRequests();

        }


        // ==================================
        // LOAD VIP BUYERS
        // ==================================

        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {

            window.loadVipBuyers();

        }


        // ==================================
        // LOAD BONUS REQUESTS
        // ==================================

        if (
            typeof window.loadBonusRequests ===
            "function"
        ) {

            window.loadBonusRequests();

        }


        // ==================================
        // LOAD USERS
        // ==================================

        if (
            typeof window.loadUsers ===
            "function"
        ) {

            window.loadUsers();

        }


        // ==================================
        // LOAD TRANSACTIONS
        // ==================================

        if (
            typeof window.loadTransactions ===
            "function"
        ) {

            window.loadTransactions();

        }


        console.log(
            "ADMIN AUTHENTICATED:",
            currentAdmin
        );


    } catch (error) {

        console.error(
            "ADMIN AUTH ERROR:",
            error
        );


        alert(
            "Erreur de connexion administrateur : " +
            error.message
        );


        hideLoadingScreen();

    }

});


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                alert(
                    "Erreur lors de la déconnexion."
                );

            }

        }
    );

}


// ==========================================
// MOBILE MENU
// ==========================================

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            if (!sidebar) return;

            sidebar.classList.toggle(
                "active"
            );

        }
    );

}


// ==========================================
// OPEN ADMIN PAGE
// ==========================================

function openPage(pageName) {

    if (!pageName) return;


    // --------------------------------------
    // HIDE ALL SECTIONS
    // --------------------------------------

    sections.forEach((section) => {

        section.style.display = "none";

        section.classList.remove("active");

    });


    // --------------------------------------
    // REMOVE ACTIVE MENU
    // --------------------------------------

    menuLinks.forEach((link) => {

        link.classList.remove("active");

    });


    // --------------------------------------
    // IMPORTANT:
    // HTML IDs are:
    //
    // dashboardSection
    // depositsSection
    // withdrawsSection
    // vipRequestsSection
    // vipBuyersSection
    // bonusRequestsSection
    // usersSection
    // transactionsSection
    // quickActionsSection
    // settingsSection
    // --------------------------------------

    const selectedSection =
        document.getElementById(
            `${pageName}Section`
        );


    if (selectedSection) {

        selectedSection.style.display =
            "block";

        selectedSection.classList.add(
            "active"
        );

    } else {

        console.warn(
            "SECTION NOT FOUND:",
            `${pageName}Section`
        );

    }


    // --------------------------------------
    // ACTIVE MENU
    // --------------------------------------

    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    // --------------------------------------
    // PAGE TITLE
    // --------------------------------------

    if (pageTitle) {

        let title =
            activeLink?.getAttribute(
                "data-title"
            );


        if (!title) {

            const titleMap = {

                dashboard:
                    "Dashboard",

                deposits:
                    "Deposits",

                withdraws:
                    "Withdraws",

                vipRequests:
                    "VIP Requests",

                vipBuyers:
                    "VIP Buyers",

                bonusRequests:
                    "Bonus Requests",

                users:
                    "Users",

                transactions:
                    "Transactions",

                quickActions:
                    "Quick Actions",

                settings:
                    "Settings"

            };


            title =
                titleMap[pageName] ||
                pageName;

        }


        pageTitle.textContent =
            title;

    }


    // --------------------------------------
    // CLOSE MOBILE SIDEBAR
    // --------------------------------------

    if (sidebar) {

        sidebar.classList.remove(
            "active"
        );

    }

}


// ==========================================
// MAKE OPENPAGE GLOBAL
// ==========================================

window.openPage =
    openPage;


// ==========================================
// SIDEBAR MENU EVENTS
// ==========================================

menuLinks.forEach((link) => {

    link.addEventListener(
        "click",
        (event) => {

            event.preventDefault();


            const page =
                link.getAttribute(
                    "data-page"
                );


            if (page) {

                openPage(page);

            }

        }
    );

});


// ==========================================
// INITIAL PAGE
// ==========================================

openPage("dashboard");


// ==========================================
// READY
// ==========================================

console.log(
    "ADMIN.JS PART 1 READY"
);

// ==========================================
// ADMIN.JS — PART 2
// DASHBOARD
// ==========================================


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "";

}


function numberValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


function normalizeStatus(status) {

    return String(
        status ?? "pending"
    )
    .trim()
    .toLowerCase();

}


function formatMoney(amount) {

    const value =
        numberValue(amount);

    return (
        value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }) + " RWF"
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        await window.waitForAdmin();

        console.log(
            "Loading admin dashboard..."
        );


        // ==================================
        // DATABASE REFERENCES
        // ==================================

        const usersRef =
            ref(db, "users");

        const depositsRef =
            ref(db, "depositRequests");

        const withdrawsRef =
            ref(db, "withdrawRequests");

        const transactionsRef =
            ref(db, "transactions");


        // ==================================
        // USERS
        // ==================================

        onValue(usersRef, (snapshot) => {

            let totalUsers = 0;
            let systemBalance = 0;


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const user =
                        child.val() || {};

                    totalUsers++;

                    systemBalance +=
                        numberValue(
                            user.balance
                        );

                });

            }


            updateText(
                "totalUsers",
                totalUsers
            );


            updateText(
                "systemBalance",
                formatMoney(
                    systemBalance
                )
            );

        });


        // ==================================
        // DEPOSITS
        // ==================================

        onValue(depositsRef, (snapshot) => {

            let pendingDeposits = 0;

            let approvedDeposits = 0;

            let rejectedDeposits = 0;

            let totalApprovedDeposits = 0;


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    const status =
                        normalizeStatus(
                            data.status
                        );

                    const amount =
                        numberValue(
                            data.amount
                        );


                    if (
                        status === "pending"
                    ) {

                        pendingDeposits++;

                    }


                    if (
                        status === "approved"
                    ) {

                        approvedDeposits++;

                        totalApprovedDeposits +=
                            amount;

                    }


                    if (
                        status === "rejected"
                    ) {

                        rejectedDeposits++;

                    }

                });

            }


            // --------------------------------
            // DASHBOARD
            // --------------------------------

            updateText(
                "dashboardTotalDeposits",
                formatMoney(
                    totalApprovedDeposits
                )
            );


            updateText(
                "dashboardPendingDeposits",
                pendingDeposits
            );


            updateText(
                "dashboardApprovedDeposits",
                approvedDeposits
            );


            console.log(
                "Deposits:",
                {
                    pending:
                        pendingDeposits,

                    approved:
                        approvedDeposits,

                    rejected:
                        rejectedDeposits,

                    total:
                        totalApprovedDeposits
                }
            );

        });


        // ==================================
        // WITHDRAWS
        // ==================================

        onValue(withdrawsRef, (snapshot) => {

            let pendingWithdraws = 0;

            let approvedWithdraws = 0;

            let rejectedWithdraws = 0;

            let totalApprovedWithdraws = 0;


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    const status =
                        normalizeStatus(
                            data.status
                        );

                    const amount =
                        numberValue(
                            data.amount
                        );


                    if (
                        status === "pending"
                    ) {

                        pendingWithdraws++;

                    }


                    if (
                        status === "approved"
                    ) {

                        approvedWithdraws++;

                        totalApprovedWithdraws +=
                            amount;

                    }


                    if (
                        status === "rejected"
                    ) {

                        rejectedWithdraws++;

                    }

                });

            }


            // --------------------------------
            // DASHBOARD
            // --------------------------------

            updateText(
                "dashboardTotalWithdraws",
                formatMoney(
                    totalApprovedWithdraws
                )
            );


            console.log(
                "Withdraws:",
                {
                    pending:
                        pendingWithdraws,

                    approved:
                        approvedWithdraws,

                    rejected:
                        rejectedWithdraws,

                    total:
                        totalApprovedWithdraws
                }
            );

        });


        // ==================================
        // TRANSACTIONS
        // ==================================

        onValue(
            transactionsRef,
            (snapshot) => {

                let transactionCount = 0;

                const transactions = [];


                if (snapshot.exists()) {

                    snapshot.forEach(
                        (child) => {

                            const data =
                                child.val() || {};


                            transactionCount++;


                            transactions.push({

                                id:
                                    child.key,

                                ...data

                            });

                        }
                    );

                }


                // --------------------------------
                // SORT NEWEST FIRST
                // --------------------------------

                transactions.sort(
                    (a, b) => {

                        return (
                            numberValue(
                                b.createdAt
                            ) -
                            numberValue(
                                a.createdAt
                            )
                        );

                    }
                );


                // --------------------------------
                // RECENT ACTIVITY
                // --------------------------------

                renderRecentTransactions(
                    transactions.slice(
                        0,
                        10
                    )
                );


                console.log(
                    "Transactions:",
                    transactionCount
                );

            }
        );


        console.log(
            "ADMIN DASHBOARD LOADED"
        );


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

    }

}


// ==========================================
// RENDER RECENT TRANSACTIONS
// ==========================================

function renderRecentTransactions(
    transactions = []
) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!container) {

        console.warn(
            "recentActivity element not found."
        );

        return;

    }


    // ==================================
    // EMPTY STATE
    // ==================================

    if (
        !transactions ||
        transactions.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No Recent Activity</p>
            </div>
        `;

        return;

    }


    // ==================================
    // RENDER
    // ==================================

    container.innerHTML =
        transactions
            .map((transaction) => {

                const type =
                    String(
                        transaction.type ??
                        "transaction"
                    )
                    .trim()
                    .toLowerCase();


                const status =
                    normalizeStatus(
                        transaction.status
                    );


                const amount =
                    numberValue(
                        transaction.amount
                    );


                const createdAt =
                    numberValue(
                        transaction.createdAt
                    );


                let dateText =
                    "Unknown date";


                if (createdAt > 0) {

                    try {

                        dateText =
                            new Date(
                                createdAt
                            ).toLocaleString(
                                "en-GB"
                            );

                    } catch (error) {

                        dateText =
                            "Unknown date";

                    }

                }


                // --------------------------------
                // TRANSACTION TITLE
                // --------------------------------

                let title =
                    "Transaction";


                if (
                    type === "deposit"
                ) {

                    title =
                        "Deposit";

                } else if (
                    type === "withdraw"
                ) {

                    title =
                        "Withdraw";

                } else if (
                    type === "vip"
                ) {

                    title =
                        "VIP Purchase";

                } else if (
                    type === "bonus"
                ) {

                    title =
                        "Bonus";

                } else if (
                    type === "profit"
                ) {

                    title =
                        "VIP Profit";

                } else if (
                    type === "referral"
                ) {

                    title =
                        "Referral Bonus";

                }


                // --------------------------------
                // STATUS
                // --------------------------------

                let statusText =
                    "Pending";


                if (
                    status === "approved"
                ) {

                    statusText =
                        "Approved";

                } else if (
                    status === "rejected"
                ) {

                    statusText =
                        "Rejected";

                } else if (
                    status === "processing"
                ) {

                    statusText =
                        "Processing";

                }


                // --------------------------------
                // RETURN HTML
                // --------------------------------

                return `
                    <div class="activity-item">

                        <div class="activity-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>

                        <div class="activity-info">

                            <strong>
                                ${escapeHTML(title)}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    dateText
                                )}
                            </small>

                            <small>
                                Status:
                                ${escapeHTML(
                                    statusText
                                )}
                            </small>

                        </div>

                        <div class="activity-amount">

                            ${formatMoney(amount)}

                        </div>

                    </div>
                `;

            })
            .join("");

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.loadDashboard =
    loadDashboard;

window.renderRecentTransactions =
    renderRecentTransactions;


// ==========================================
// DASHBOARD REFRESH BUTTON
// ==========================================

const refreshDashboard =
    document.getElementById(
        "refreshDashboard"
    );


if (refreshDashboard) {

    refreshDashboard.addEventListener(
        "click",
        async () => {

            console.log(
                "Refreshing dashboard..."
            );

            await loadDashboard();

        }
    );

}


// ==========================================
// QUICK ACTION — REFRESH DASHBOARD
// ==========================================

const refreshDashboardQuick =
    document.getElementById(
        "refreshDashboardQuick"
    );


if (refreshDashboardQuick) {

    refreshDashboardQuick.addEventListener(
        "click",
        async () => {

            await loadDashboard();

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN DEPOSITS
// ==========================================

const openDeposits =
    document.getElementById(
        "openDeposits"
    );


if (openDeposits) {

    openDeposits.addEventListener(
        "click",
        () => {

            window.openPage(
                "deposits"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN WITHDRAWS
// ==========================================

const openWithdraws =
    document.getElementById(
        "openWithdraws"
    );


if (openWithdraws) {

    openWithdraws.addEventListener(
        "click",
        () => {

            window.openPage(
                "withdraws"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN USERS
// ==========================================

const openUsers =
    document.getElementById(
        "openUsers"
    );


if (openUsers) {

    openUsers.addEventListener(
        "click",
        () => {

            window.openPage(
                "users"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN TRANSACTIONS
// ==========================================

const openTransactions =
    document.getElementById(
        "openTransactions"
    );


if (openTransactions) {

    openTransactions.addEventListener(
        "click",
        () => {

            window.openPage(
                "transactions"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN SETTINGS
// ==========================================

const openSettings =
    document.getElementById(
        "openSettings"
    );


if (openSettings) {

    openSettings.addEventListener(
        "click",
        () => {

            window.openPage(
                "settings"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN VIP REQUESTS
// ==========================================

const openVipRequests =
    document.getElementById(
        "openVipRequests"
    );


if (openVipRequests) {

    openVipRequests.addEventListener(
        "click",
        () => {

            window.openPage(
                "vipRequests"
            );

        }
    );

}


// ==========================================
// PART 2 READY
// ==========================================

console.log(
    "ADMIN.JS PART 2 READY"
);

  // ======================================
// PART 3 - DEPOSITS
// Money Vault Admin
// ======================================

let allDepositRequests = [];
let depositUsers = {};

/* ======================================
   LOAD DEPOSITS
====================================== */

async function loadDeposits() {
    try {
        await waitForAdmin();

        const depositsRef = ref(db, "depositRequests");

        onValue(depositsRef, async (snapshot) => {

            const data = snapshot.val() || {};

            // ----------------------------------
            // GET ALL USERS
            // ----------------------------------
            try {
                const usersSnapshot = await get(ref(db, "users"));
                depositUsers = usersSnapshot.val() || {};
            } catch (userError) {
                console.error("Error loading users:", userError);
                depositUsers = {};
            }

            allDepositRequests = Object.entries(data)
                .map(([id, request]) => ({
                    id,
                    ...(request || {})
                }))
                .sort((a, b) => {
                    const dateA = Number(a.createdAt || 0);
                    const dateB = Number(b.createdAt || 0);
                    return dateB - dateA;
                });

            renderDepositRequests();

        }, (error) => {

            console.error("Deposits listener error:", error);

            const list = document.getElementById("depositList");

            if (list) {
                list.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load deposits</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error("loadDeposits error:", error);
    }
}


/* ======================================
   RENDER ALL DEPOSITS
====================================== */

function renderDepositRequests() {

    const list = document.getElementById("depositList");
    const empty = document.getElementById("emptyDeposit");

    if (!list) return;

    const searchInput = document.getElementById("depositSearch");
    const filterInput = document.getElementById("depositFilter");

    const search = String(searchInput?.value || "")
        .trim()
        .toLowerCase();

    const filter = String(filterInput?.value || "all")
        .trim()
        .toLowerCase();

    const filtered = allDepositRequests.filter(request => {

        const uid = String(request.uid || "").toLowerCase();

        const user = depositUsers[request.uid] || {};

        const name = String(
            user.name ||
            user.fullName ||
            user.username ||
            request.name ||
            ""
        ).toLowerCase();

        const email = String(
            user.email ||
            request.email ||
            ""
        ).toLowerCase();

        const phone = String(
            user.phone ||
            user.phoneNumber ||
            request.senderPhone ||
            request.phone ||
            ""
        ).toLowerCase();

        const txId = String(
            request.transactionId ||
            request.txId ||
            ""
        ).toLowerCase();

        const status = normalizeStatus(request.status);

        const matchesSearch =
            !search ||
            uid.includes(search) ||
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search) ||
            txId.includes(search);

        const matchesFilter =
            filter === "all" ||
            status === filter;

        return matchesSearch && matchesFilter;
    });


    // ----------------------------------
    // COUNTERS
    // ----------------------------------

    const total = allDepositRequests.length;

    const pending = allDepositRequests.filter(
        x => normalizeStatus(x.status) === "pending"
    ).length;

    const approved = allDepositRequests.filter(
        x => normalizeStatus(x.status) === "approved"
    ).length;

    const rejected = allDepositRequests.filter(
        x => normalizeStatus(x.status) === "rejected"
    ).length;

    updateText("depositTotalCount", total);
    updateText("depositPendingCount", pending);
    updateText("depositApprovedCount", approved);
    updateText("depositRejectedCount", rejected);


    // ----------------------------------
    // EMPTY
    // ----------------------------------

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }


    // ----------------------------------
    // RENDER CARDS
    // ----------------------------------

    list.innerHTML = filtered
        .map(request => renderDepositCard(request))
        .join("");

    activateDepositButtons();
}


/* ======================================
   DEPOSIT CARD
====================================== */

function renderDepositCard(request) {

    const uid = request.uid || "";

    const user = depositUsers[uid] || {};

    // ----------------------------------
    // USER PROFILE
    // ----------------------------------

    const name =
        user.name ||
        user.fullName ||
        user.username ||
        request.name ||
        "Unknown User";

    const email =
        user.email ||
        request.email ||
        "No email";

    const phone =
        user.phone ||
        user.phoneNumber ||
        request.senderPhone ||
        request.phone ||
        "No phone";

    // ----------------------------------
    // DEPOSIT DATA
    // ----------------------------------

    const amount = numberValue(
        request.amount
    );

    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        "Unknown";

    const transactionId =
        request.transactionId ||
        request.txId ||
        "N/A";

    const paymentDate =
        request.paymentDate ||
        request.date ||
        "N/A";

    const createdAt =
        request.createdAt
            ? formatDate(request.createdAt)
            : "N/A";

    const status =
        normalizeStatus(request.status);

    const proofUrl =
        request.proofUrl ||
        request.proof ||
        request.screenshotUrl ||
        "";

    // ----------------------------------
    // STATUS
    // ----------------------------------

    let statusClass = "pending";
    let statusIcon = "fa-clock";
    let statusText = "Pending";

    if (status === "approved") {
        statusClass = "approved";
        statusIcon = "fa-check-circle";
        statusText = "Approved";
    }

    if (status === "rejected") {
        statusClass = "rejected";
        statusIcon = "fa-times-circle";
        statusText = "Rejected";
    }

    if (status === "processing") {
        statusClass = "processing";
        statusIcon = "fa-spinner";
        statusText = "Processing";
    }

    if (status === "processing_error") {
        statusClass = "error";
        statusIcon = "fa-exclamation-circle";
        statusText = "Processing Error";
    }


    // ----------------------------------
    // ACTION BUTTONS
    // ----------------------------------

    let actionButtons = "";

    if (status === "pending") {

        actionButtons = `
            <div class="request-actions">

                <button
                    type="button"
                    class="deposit-action-btn reject-btn rejectDepositBtn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fas fa-times"></i>
                    Reject
                </button>

                <button
                    type="button"
                    class="deposit-action-btn approve-btn approveDepositBtn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fas fa-check"></i>
                    Approve
                </button>

            </div>
        `;
    }


    // ----------------------------------
    // PROOF
    // ----------------------------------

    let proofHTML = "";

    if (proofUrl) {

        proofHTML = `
            <div class="deposit-proof">
                <a
                    href="${escapeHTML(proofUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="proof-btn"
                >
                    <i class="fas fa-image"></i>
                    View Payment Proof
                </a>
            </div>
        `;
    }


    // ----------------------------------
    // CARD
    // ----------------------------------

    return `
        <div
            class="deposit-card request-card"
            data-id="${escapeHTML(request.id)}"
            data-status="${escapeHTML(status)}"
        >

            <!-- ==========================
                 HEADER
            =========================== -->

            <div class="request-card-header">

                <div class="user-profile">

                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>

                    <div class="user-profile-info">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <span>
                            <i class="fas fa-envelope"></i>
                            ${escapeHTML(email)}
                        </span>

                    </div>

                </div>


                <div class="request-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    ${escapeHTML(statusText)}
                </div>

            </div>


            <!-- ==========================
                 USER INFORMATION
            =========================== -->

            <div class="profile-section">

                <div class="section-title">
                    <i class="fas fa-user-circle"></i>
                    User Information
                </div>

                <div class="profile-grid">

                    <div class="profile-item">
                        <span class="label">
                            <i class="fas fa-user"></i>
                            Name
                        </span>

                        <strong>
                            ${escapeHTML(name)}
                        </strong>
                    </div>


                    <div class="profile-item">
                        <span class="label">
                            <i class="fas fa-envelope"></i>
                            Email
                        </span>

                        <strong>
                            ${escapeHTML(email)}
                        </strong>
                    </div>


                    <div class="profile-item">
                        <span class="label">
                            <i class="fas fa-phone"></i>
                            Phone
                        </span>

                        <strong>
                            ${escapeHTML(phone)}
                        </strong>
                    </div>


                    <div class="profile-item uid-item">
                        <span class="label">
                            <i class="fas fa-id-card"></i>
                            UID
                        </span>

                        <strong title="${escapeHTML(uid)}">
                            ${escapeHTML(uid)}
                        </strong>
                    </div>

                </div>

            </div>


            <!-- ==========================
                 DEPOSIT INFORMATION
            =========================== -->

            <div class="deposit-info-section">

                <div class="section-title">
                    <i class="fas fa-money-bill-wave"></i>
                    Deposit Information
                </div>

                <div class="deposit-info-grid">

                    <div class="deposit-info-item amount-item">

                        <span class="label">
                            <i class="fas fa-coins"></i>
                            Amount
                        </span>

                        <strong class="amount-value">
                            ${formatMoney(amount)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-credit-card"></i>
                            Payment Method
                        </span>

                        <strong>
                            ${escapeHTML(paymentMethod)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-mobile-alt"></i>
                            Sender Phone
                        </span>

                        <strong>
                            ${escapeHTML(
                                request.senderPhone ||
                                request.phone ||
                                phone
                            )}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-receipt"></i>
                            Transaction ID
                        </span>

                        <strong class="transaction-id">
                            ${escapeHTML(transactionId)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-calendar-alt"></i>
                            Payment Date
                        </span>

                        <strong>
                            ${escapeHTML(paymentDate)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-clock"></i>
                            Request Created
                        </span>

                        <strong>
                            ${escapeHTML(createdAt)}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 PROOF
            =========================== -->

            ${proofHTML}


            <!-- ==========================
                 REQUEST ID
            =========================== -->

            <div class="request-id">

                <span>
                    Request ID
                </span>

                <code>
                    ${escapeHTML(request.id)}
                </code>

            </div>


            <!-- ==========================
                 ACTIONS
            =========================== -->

            ${actionButtons}

        </div>
    `;
}


/* ======================================
   ACTIVATE DEPOSIT BUTTONS
====================================== */

function activateDepositButtons() {

    // ----------------------------------
    // APPROVE
    // ----------------------------------

    document
        .querySelectorAll(".approveDepositBtn")
        .forEach(button => {

            if (button.dataset.active === "true") {
                return;
            }

            button.dataset.active = "true";

            button.addEventListener("click", async () => {

                const id = button.dataset.id;

                if (!id) return;

                if (
                    typeof window.approveDeposit === "function"
                ) {
                    await window.approveDeposit(id);
                } else {
                    console.error(
                        "approveDeposit function not found"
                    );
                }

            });

        });


    // ----------------------------------
    // REJECT
    // ----------------------------------

    document
        .querySelectorAll(".rejectDepositBtn")
        .forEach(button => {

            if (button.dataset.active === "true") {
                return;
            }

            button.dataset.active = "true";

            button.addEventListener("click", async () => {

                const id = button.dataset.id;

                if (!id) return;

                if (
                    typeof window.rejectDeposit === "function"
                ) {
                    await window.rejectDeposit(id);
                } else {
                    console.error(
                        "rejectDeposit function not found"
                    );
                }

            });

        });
}


/* ======================================
   FORMAT DATE
====================================== */

function formatDate(value) {

    if (!value) return "N/A";

    try {

        const date = new Date(Number(value));

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    } catch (error) {

        return String(value);
    }
}


/* ======================================
   SEARCH
====================================== */

const depositSearchInput =
    document.getElementById("depositSearch");

if (depositSearchInput) {

    depositSearchInput.addEventListener(
        "input",
        () => {
            renderDepositRequests();
        }
    );
}


/* ======================================
   FILTER
====================================== */

const depositFilterInput =
    document.getElementById("depositFilter");

if (depositFilterInput) {

    depositFilterInput.addEventListener(
        "change",
        () => {
            renderDepositRequests();
        }
    );
}


/* ======================================
   GLOBAL FUNCTIONS
====================================== */

window.loadDeposits =
    loadDeposits;

window.renderDepositCard =
    renderDepositCard;

window.renderDepositRequests =
    renderDepositRequests;

window.activateDepositButtons =
    activateDepositButtons;

      // ==========================================
// ADMIN.JS — PART 4
// APPROVE / REJECT DEPOSITS
// ==========================================


// ==========================================
// APPROVE DEPOSIT
// ==========================================

async function approveDeposit(id) {

    try {

        await window.waitForAdmin();

        if (!id) {
            throw new Error("Deposit ID is missing.");
        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed = confirm(
            "Are you sure you want to approve this deposit?"
        );

        if (!confirmed) {
            return;
        }


        // ==================================
        // DEPOSIT REQUEST
        // ==================================

        const depositRef =
            ref(db, `depositRequests/${id}`);

        const depositSnapshot =
            await get(depositRef);


        if (!depositSnapshot.exists()) {

            throw new Error(
                "Deposit request not found."
            );

        }


        const deposit =
            depositSnapshot.val() || {};


        // ==================================
        // ONLY PENDING CAN BE APPROVED
        // ==================================

        if (
            normalizeStatus(deposit.status) !==
            "pending"
        ) {

            alert(
                "This deposit has already been processed."
            );

            return;

        }


        const uid =
            deposit.uid;

        const amount =
            numberValue(
                deposit.amount
            );


        if (!uid) {

            throw new Error(
                "User UID is missing."
            );

        }


        if (amount <= 0) {

            throw new Error(
                "Invalid deposit amount."
            );

        }


        // ==================================
        // LOCK REQUEST
        // ==================================

        const lockResult =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {
                        return;
                    }


                    const currentStatus =
                        normalizeStatus(
                            currentData.status
                        );


                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentData,

                        status:
                            "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin?.uid ||
                            null

                    };

                }
            );


        if (!lockResult.committed) {

            alert(
                "This deposit is already being processed."
            );

            return;

        }


        // ==================================
        // USER REFERENCE
        // ==================================

        const userRef =
            ref(db, `users/${uid}`);


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            throw new Error(
                "User account not found."
            );

        }


        const user =
            userSnapshot.val() || {};


        const oldBalance =
            numberValue(
                user.balance
            );


        const oldTotalDeposits =
            numberValue(
                user.totalDeposits
            );


        const oldTotalTransactions =
            numberValue(
                user.totalTransactions
            );


        // ==================================
        // CREDIT USER BALANCE
        // ==================================

        const newBalance =
            oldBalance + amount;


        const newTotalDeposits =
            oldTotalDeposits + amount;


        const newTotalTransactions =
            oldTotalTransactions + 1;


        // ==================================
        // UPDATE USER
        // ==================================

        await update(
            userRef,
            {

                balance:
                    newBalance,

                totalDeposits:
                    newTotalDeposits,

                totalTransactions:
                    newTotalTransactions

            }
        );


        // ==================================
        // CREATE TRANSACTION
        // ==================================

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionKey =
            transactionRef.key;


        if (!transactionKey) {

            throw new Error(
                "Could not create transaction ID."
            );

        }


        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "deposit",

                amount:
                    amount,

                status:
                    "approved",

                paymentMethod:
                    deposit.paymentMethod ||
                    deposit.method ||
                    "",

                transactionId:
                    deposit.transactionId ||
                    "",

                depositRequestId:
                    id,

                createdAt:
                    Date.now(),

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin?.uid ||
                    ""

            }
        );


        // ==================================
        // FINALIZE DEPOSIT REQUEST
        // ==================================

        await update(
            depositRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin?.uid ||
                    "",

                transactionKey:
                    transactionKey,

                processedAt:
                    Date.now()

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        console.log(
            "DEPOSIT APPROVED:",
            id
        );


        alert(
            "Deposit approved successfully."
        );


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        // ==================================
        // MARK ERROR
        // ==================================

        try {

            if (id) {

                await update(
                    ref(
                        db,
                        `depositRequests/${id}`
                    ),
                    {

                        status:
                            "processing_error",

                        error:
                            error.message ||
                            "Unknown error",

                        errorAt:
                            Date.now(),

                        errorBy:
                            currentAdmin?.uid ||
                            ""

                    }
                );

            }

        } catch (updateError) {

            console.error(
                "COULD NOT MARK DEPOSIT ERROR:",
                updateError
            );

        }


        alert(
            "Deposit approval failed:\n" +
            (error.message || "Unknown error")
        );

    }

}


// ==========================================
// REJECT DEPOSIT
// ==========================================

async function rejectDeposit(id) {

    try {

        await window.waitForAdmin();

        if (!id) {

            throw new Error(
                "Deposit ID is missing."
            );

        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed = confirm(
            "Are you sure you want to reject this deposit?"
        );

        if (!confirmed) {
            return;
        }


        // ==================================
        // REFERENCE
        // ==================================

        const depositRef =
            ref(db, `depositRequests/${id}`);


        // ==================================
        // ATOMIC STATUS CHANGE
        // ==================================

        const result =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {
                        return;
                    }


                    const currentStatus =
                        normalizeStatus(
                            currentData.status
                        );


                    // Only pending
                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentData,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            ""

                    };

                }
            );


        if (!result.committed) {

            alert(
                "This deposit has already been processed."
            );

            return;

        }


        console.log(
            "DEPOSIT REJECTED:",
            id
        );


        alert(
            "Deposit rejected successfully."
        );


    } catch (error) {

        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        alert(
            "Deposit rejection failed:\n" +
            (error.message || "Unknown error")
        );

    }

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;


// ==========================================
// PART 4 READY
// ==========================================

console.log(
    "ADMIN.JS PART 4 READY"
);

// ======================================
// PART 5 - WITHDRAWS
// Money Vault Admin
// ======================================

let allWithdrawRequests = [];
let withdrawUsers = {};


/* ======================================
   LOAD WITHDRAWS
====================================== */

async function loadWithdraws() {

    try {

        await waitForAdmin();

        const withdrawsRef =
            ref(db, "withdrawRequests");

        onValue(
            withdrawsRef,
            async (snapshot) => {

                const data =
                    snapshot.val() || {};

                // ==============================
                // LOAD ALL USERS
                // ==============================

                try {

                    const usersSnapshot =
                        await get(ref(db, "users"));

                    withdrawUsers =
                        usersSnapshot.val() || {};

                } catch (error) {

                    console.error(
                        "Error loading users:",
                        error
                    );

                    withdrawUsers = {};
                }


                // ==============================
                // CREATE REQUEST ARRAY
                // ==============================

                allWithdrawRequests =
                    Object.entries(data)
                        .map(([id, request]) => ({
                            id,
                            ...(request || {})
                        }))
                        .sort((a, b) => {

                            const dateA =
                                Number(a.createdAt || 0);

                            const dateB =
                                Number(b.createdAt || 0);

                            return dateB - dateA;
                        });


                renderWithdrawRequests();

            },
            (error) => {

                console.error(
                    "Withdraw listener error:",
                    error
                );

                const list =
                    document.getElementById(
                        "withdrawList"
                    );

                if (list) {

                    list.innerHTML = `
                        <div class="error-state">

                            <i class="fas fa-exclamation-triangle"></i>

                            <h3>
                                Failed to load withdrawals
                            </h3>

                            <p>
                                ${escapeHTML(
                                    error.message
                                )}
                            </p>

                        </div>
                    `;
                }
            }
        );

    } catch (error) {

        console.error(
            "loadWithdraws error:",
            error
        );
    }
}


/* ======================================
   RENDER ALL WITHDRAWS
====================================== */

function renderWithdrawRequests() {

    const list =
        document.getElementById(
            "withdrawList"
        );

    const empty =
        document.getElementById(
            "emptyWithdraw"
        );

    if (!list) return;


    // ==============================
    // SEARCH + FILTER
    // ==============================

    const searchInput =
        document.getElementById(
            "withdrawSearch"
        );

    const filterInput =
        document.getElementById(
            "withdrawFilter"
        );


    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const filter =
        String(
            filterInput?.value || "all"
        )
        .trim()
        .toLowerCase();


    // ==============================
    // FILTER REQUESTS
    // ==============================

    const filtered =
        allWithdrawRequests.filter(
            request => {

                const uid =
                    String(
                        request.uid || ""
                    )
                    .toLowerCase();


                const user =
                    withdrawUsers[
                        request.uid
                    ] || {};


                const name =
                    String(
                        user.name ||
                        user.fullName ||
                        user.username ||
                        request.name ||
                        ""
                    )
                    .toLowerCase();


                const email =
                    String(
                        user.email ||
                        request.email ||
                        ""
                    )
                    .toLowerCase();


                const phone =
                    String(
                        user.phone ||
                        user.phoneNumber ||
                        request.phone ||
                        request.receiverPhone ||
                        request.withdrawPhone ||
                        ""
                    )
                    .toLowerCase();


                const status =
                    normalizeStatus(
                        request.status
                    );


                const matchesSearch =
                    !search ||
                    uid.includes(search) ||
                    name.includes(search) ||
                    email.includes(search) ||
                    phone.includes(search);


                const matchesFilter =
                    filter === "all" ||
                    status === filter;


                return (
                    matchesSearch &&
                    matchesFilter
                );
            }
        );


    // ==============================
    // COUNTERS
    // ==============================

    const total =
        allWithdrawRequests.length;


    const pending =
        allWithdrawRequests.filter(
            request =>
                normalizeStatus(
                    request.status
                ) === "pending"
        ).length;


    const approved =
        allWithdrawRequests.filter(
            request =>
                normalizeStatus(
                    request.status
                ) === "approved"
        ).length;


    const rejected =
        allWithdrawRequests.filter(
            request =>
                normalizeStatus(
                    request.status
                ) === "rejected"
        ).length;


    updateText(
        "withdrawTotalCount",
        total
    );

    updateText(
        "withdrawPendingCount",
        pending
    );

    updateText(
        "withdrawApprovedCount",
        approved
    );

    updateText(
        "withdrawRejectedCount",
        rejected
    );


    // ==============================
    // EMPTY
    // ==============================

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    // ==============================
    // RENDER
    // ==============================

    list.innerHTML =
        filtered
            .map(request =>
                renderWithdrawCard(
                    request
                )
            )
            .join("");


    activateWithdrawButtons();
}


/* ======================================
   WITHDRAW CARD
====================================== */

function renderWithdrawCard(request) {

    const uid =
        request.uid || "";


    const user =
        withdrawUsers[uid] || {};


    // ==============================
    // USER PROFILE
    // ==============================

    const name =
        user.name ||
        user.fullName ||
        user.username ||
        request.name ||
        "Unknown User";


    const email =
        user.email ||
        request.email ||
        "No email";


    const phone =
        user.phone ||
        user.phoneNumber ||
        request.phone ||
        request.receiverPhone ||
        request.withdrawPhone ||
        "No phone";


    // ==============================
    // WITHDRAW DATA
    // ==============================

    const amount =
        numberValue(
            request.amount
        );


    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        "Unknown";


    const accountName =
        request.accountName ||
        request.receiverName ||
        request.name ||
        name ||
        "N/A";


    const withdrawPhone =
        request.phone ||
        request.receiverPhone ||
        request.withdrawPhone ||
        phone;


    const createdAt =
        request.createdAt
            ? formatDate(
                request.createdAt
            )
            : "N/A";


    const approvedAt =
        request.approvedAt
            ? formatDate(
                request.approvedAt
            )
            : "";


    const rejectedAt =
        request.rejectedAt
            ? formatDate(
                request.rejectedAt
            )
            : "";


    const status =
        normalizeStatus(
            request.status
        );


    // ==============================
    // STATUS
    // ==============================

    let statusClass = "pending";

    let statusIcon = "fa-clock";

    let statusText = "Pending";


    if (status === "approved") {

        statusClass =
            "approved";

        statusIcon =
            "fa-check-circle";

        statusText =
            "Approved";
    }


    if (status === "rejected") {

        statusClass =
            "rejected";

        statusIcon =
            "fa-times-circle";

        statusText =
            "Rejected";
    }


    if (status === "processing") {

        statusClass =
            "processing";

        statusIcon =
            "fa-spinner";

        statusText =
            "Processing";
    }


    if (
        status ===
        "processing_error"
    ) {

        statusClass =
            "error";

        statusIcon =
            "fa-exclamation-circle";

        statusText =
            "Processing Error";
    }


    // ==============================
    // ACTION BUTTONS
    // ==============================

    let actionButtons = "";


    if (status === "pending") {

        actionButtons = `

            <div class="request-actions">

                <button
                    type="button"
                    class="withdraw-action-btn reject-btn rejectWithdrawBtn"
                    data-id="${escapeHTML(
                        request.id
                    )}"
                >

                    <i class="fas fa-times"></i>

                    Reject

                </button>


                <button
                    type="button"
                    class="withdraw-action-btn approve-btn approveWithdrawBtn"
                    data-id="${escapeHTML(
                        request.id
                    )}"
                >

                    <i class="fas fa-check"></i>

                    Approve

                </button>

            </div>

        `;
    }


    // ==============================
    // CARD
    // ==============================

    return `

        <div
            class="withdraw-card request-card"
            data-id="${escapeHTML(
                request.id
            )}"
            data-status="${escapeHTML(
                status
            )}"
        >


            <!-- ==========================
                 HEADER
            =========================== -->

            <div class="request-card-header">


                <div class="user-profile">

                    <div class="user-avatar">

                        <i class="fas fa-user"></i>

                    </div>


                    <div class="user-profile-info">

                        <h3>
                            ${escapeHTML(
                                name
                            )}
                        </h3>


                        <span>

                            <i class="fas fa-envelope"></i>

                            ${escapeHTML(
                                email
                            )}

                        </span>

                    </div>

                </div>


                <div
                    class="request-status ${statusClass}"
                >

                    <i
                        class="fas ${statusIcon}"
                    ></i>

                    ${escapeHTML(
                        statusText
                    )}

                </div>

            </div>


            <!-- ==========================
                 USER INFORMATION
            =========================== -->

            <div class="profile-section">


                <div class="section-title">

                    <i
                        class="fas fa-user-circle"
                    ></i>

                    User Information

                </div>


                <div class="profile-grid">


                    <div class="profile-item">

                        <span class="label">

                            <i class="fas fa-user"></i>

                            Name

                        </span>


                        <strong>
                            ${escapeHTML(
                                name
                            )}
                        </strong>

                    </div>


                    <div class="profile-item">

                        <span class="label">

                            <i
                                class="fas fa-envelope"
                            ></i>

                            Email

                        </span>


                        <strong>
                            ${escapeHTML(
                                email
                            )}
                        </strong>

                    </div>


                    <div class="profile-item">

                        <span class="label">

                            <i
                                class="fas fa-phone"
                            ></i>

                            Phone

                        </span>


                        <strong>
                            ${escapeHTML(
                                phone
                            )}
                        </strong>

                    </div>


                    <div
                        class="profile-item uid-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-id-card"
                            ></i>

                            UID

                        </span>


                        <strong
                            title="${escapeHTML(
                                uid
                            )}"
                        >
                            ${escapeHTML(
                                uid
                            )}
                        </strong>

                    </div>


                </div>

            </div>


            <!-- ==========================
                 WITHDRAW INFORMATION
            =========================== -->

            <div class="withdraw-info-section">


                <div class="section-title">

                    <i
                        class="fas fa-money-bill-wave"
                    ></i>

                    Withdrawal Information

                </div>


                <div class="withdraw-info-grid">


                    <div
                        class="withdraw-info-item amount-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-coins"
                            ></i>

                            Amount

                        </span>


                        <strong
                            class="amount-value"
                        >
                            ${formatMoney(
                                amount
                            )}
                        </strong>

                    </div>


                    <div
                        class="withdraw-info-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-credit-card"
                            ></i>

                            Payment Method

                        </span>


                        <strong>
                            ${escapeHTML(
                                paymentMethod
                            )}
                        </strong>

                    </div>


                    <div
                        class="withdraw-info-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-mobile-alt"
                            ></i>

                            Receiver Phone

                        </span>


                        <strong>
                            ${escapeHTML(
                                withdrawPhone
                            )}
                        </strong>

                    </div>


                    <div
                        class="withdraw-info-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-user-tag"
                            ></i>

                            Account Name

                        </span>


                        <strong>
                            ${escapeHTML(
                                accountName
                            )}
                        </strong>

                    </div>


                    <div
                        class="withdraw-info-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-calendar-alt"
                            ></i>

                            Request Date

                        </span>


                        <strong>
                            ${escapeHTML(
                                createdAt
                            )}
                        </strong>

                    </div>


                    ${
                        approvedAt
                            ? `
                                <div
                                    class="withdraw-info-item"
                                >

                                    <span
                                        class="label"
                                    >

                                        <i
                                            class="fas fa-check"
                                        ></i>

                                        Approved Date

                                    </span>


                                    <strong>
                                        ${escapeHTML(
                                            approvedAt
                                        )}
                                    </strong>

                                </div>
                            `
                            : ""
                    }


                    ${
                        rejectedAt
                            ? `
                                <div
                                    class="withdraw-info-item"
                                >

                                    <span
                                        class="label"
                                    >

                                        <i
                                            class="fas fa-times"
                                        ></i>

                                        Rejected Date

                                    </span>


                                    <strong>
                                        ${escapeHTML(
                                            rejectedAt
                                        )}
                                    </strong>

                                </div>
                            `
                            : ""
                    }


                </div>

            </div>


            <!-- ==========================
                 REQUEST ID
            =========================== -->

            <div class="request-id">

                <span>
                    Request ID
                </span>


                <code>
                    ${escapeHTML(
                        request.id
                    )}
                </code>

            </div>


            <!-- ==========================
                 ACTION BUTTONS
            =========================== -->

            ${actionButtons}


        </div>

    `;
}


/* ======================================
   ACTIVATE WITHDRAW BUTTONS
====================================== */

function activateWithdrawButtons() {


    // ==============================
    // APPROVE BUTTON
    // ==============================

    document
        .querySelectorAll(
            ".approveWithdrawBtn"
        )
        .forEach(button => {


            if (
                button.dataset.active ===
                "true"
            ) {
                return;
            }


            button.dataset.active =
                "true";


            button.addEventListener(
                "click",
                async () => {


                    const id =
                        button.dataset.id;


                    if (!id) {
                        return;
                    }


                    if (
                        typeof
                        window.approveWithdraw ===
                        "function"
                    ) {

                        await
                            window.approveWithdraw(
                                id
                            );

                    } else {

                        console.error(
                            "approveWithdraw function not found"
                        );

                    }

                }
            );

        });


    // ==============================
    // REJECT BUTTON
    // ==============================

    document
        .querySelectorAll(
            ".rejectWithdrawBtn"
        )
        .forEach(button => {


            if (
                button.dataset.active ===
                "true"
            ) {
                return;
            }


            button.dataset.active =
                "true";


            button.addEventListener(
                "click",
                async () => {


                    const id =
                        button.dataset.id;


                    if (!id) {
                        return;
                    }


                    if (
                        typeof
                        window.rejectWithdraw ===
                        "function"
                    ) {

                        await
                            window.rejectWithdraw(
                                id
                            );

                    } else {

                        console.error(
                            "rejectWithdraw function not found"
                        );

                    }

                }
            );

        });
}


/* ======================================
   SEARCH
====================================== */

const withdrawSearchInput =
    document.getElementById(
        "withdrawSearch"
    );


if (withdrawSearchInput) {

    withdrawSearchInput.addEventListener(
        "input",
        () => {

            renderWithdrawRequests();

        }
    );
}


/* ======================================
   FILTER
====================================== */

const withdrawFilterInput =
    document.getElementById(
        "withdrawFilter"
    );


if (withdrawFilterInput) {

    withdrawFilterInput.addEventListener(
        "change",
        () => {

            renderWithdrawRequests();

        }
    );
}


/* ======================================
   GLOBAL FUNCTIONS
====================================== */

window.loadWithdraws =
    loadWithdraws;

window.renderWithdrawCard =
    renderWithdrawCard;

window.renderWithdrawRequests =
    renderWithdrawRequests;

window.activateWithdrawButtons =
    activateWithdrawButtons;

// ======================================
// PART 6 — APPROVE / REJECT WITHDRAW
// Money Vault Admin Panel
// ======================================

async function approveWithdraw(id) {
    try {
        await window.waitForAdmin();

        if (!id) {
            alert("Withdraw request ID is missing.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to approve this withdrawal?"
        );

        if (!confirmed) return;

        // ==============================
        // GET REQUEST
        // ==============================

        const requestRef = ref(
            db,
            `withdrawRequests/${id}`
        );

        const requestSnapshot = await get(requestRef);

        if (!requestSnapshot.exists()) {
            alert("Withdraw request not found.");
            return;
        }

        const request = requestSnapshot.val();

        const status = normalizeStatus(request.status);

        if (status !== "pending") {
            alert(`This request is already ${status}.`);
            return;
        }

        // ==============================
        // VALIDATE UID
        // ==============================

        const uid = request.uid;

        if (!uid) {
            alert("This withdraw request has no user UID.");
            return;
        }

        // ==============================
        // VALIDATE AMOUNT
        // ==============================

        const amount = numberValue(request.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Invalid withdrawal amount.");
            return;
        }

        // ==============================
        // LOCK REQUEST
        // pending → processing
        // ==============================

        const lockResult = await runTransaction(
            requestRef,
            currentData => {

                if (!currentData) {
                    return;
                }

                if (
                    normalizeStatus(currentData.status) !==
                    "pending"
                ) {
                    return;
                }

                return {
                    ...currentData,

                    status: "processing",

                    processingAt: Date.now(),

                    processingBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null
                };
            }
        );

        if (!lockResult.committed) {
            alert(
                "This withdrawal is already being processed."
            );
            return;
        }

        // ==============================
        // GET USER
        // ==============================

        const userRef = ref(
            db,
            `users/${uid}`
        );

        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {

            await update(requestRef, {
                status: "rejected",
                rejectedAt: Date.now(),
                rejectedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null,
                rejectionReason: "User account not found.",
                processingAt: null,
                processingBy: null
            });

            alert("User account not found.");
            return;
        }

        const user = userSnapshot.val();

        // ==============================
        // CHECK BALANCE
        // ==============================

        const currentBalance =
            numberValue(user.balance);

        if (currentBalance < amount) {

            await update(requestRef, {

                status: "rejected",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null,

                rejectionReason:
                    "Insufficient balance.",

                processingAt: null,

                processingBy: null

            });

            alert(
                "Withdrawal rejected: insufficient balance."
            );

            return;
        }

        // ==============================
        // CALCULATE NEW BALANCE
        // ==============================

        const newBalance =
            currentBalance - amount;

        const totalWithdrawals =
            numberValue(user.totalWithdrawals);

        const newTotalWithdrawals =
            totalWithdrawals + amount;

        const totalTransactions =
            numberValue(user.totalTransactions);

        const newTotalTransactions =
            totalTransactions + 1;

        const now = Date.now();

        // ==============================
        // UPDATE USER
        // ==============================

        await update(userRef, {

            balance: newBalance,

            totalWithdrawals:
                newTotalWithdrawals,

            totalTransactions:
                newTotalTransactions

        });

        // ==============================
        // CREATE TRANSACTION
        // ==============================

        const transactionRef =
            push(ref(db, "transactions"));

        const transactionKey =
            transactionRef.key;

        await set(
            transactionRef,
            {

                uid: uid,

                type: "withdraw",

                amount: amount,

                status: "approved",

                paymentMethod:
                    request.paymentMethod ||
                    request.method ||
                    null,

                phone:
                    request.phone ||
                    request.receiverPhone ||
                    request.withdrawPhone ||
                    null,

                withdrawRequestId: id,

                createdAt: now,

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null

            }
        );

        // ==============================
        // FINALIZE REQUEST
        // ==============================

        await update(requestRef, {

            status: "approved",

            approvedAt: now,

            approvedBy:
                currentAdmin?.uid ||
                auth.currentUser?.uid ||
                null,

            transactionKey:
                transactionKey,

            processingAt: null,

            processingBy: null

        });

        // ==============================
        // SUCCESS
        // ==============================

        alert(
            "Withdrawal approved successfully."
        );

        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }

    } catch (error) {

        console.error(
            "approveWithdraw error:",
            error
        );

        try {

            await update(
                ref(db, `withdrawRequests/${id}`),
                {
                    status: "processing_error",
                    processingError:
                        error?.message ||
                        String(error),
                    errorAt: Date.now()
                }
            );

        } catch (updateError) {

            console.error(
                "Could not update withdrawal error:",
                updateError
            );
        }

        alert(
            "Failed to approve withdrawal: " +
            (error?.message || "Unknown error")
        );
    }
}


// ======================================
// REJECT WITHDRAW
// ======================================

async function rejectWithdraw(id) {

    try {

        await window.waitForAdmin();

        if (!id) {
            alert("Withdraw request ID is missing.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to reject this withdrawal?"
        );

        if (!confirmed) return;

        const requestRef =
            ref(db, `withdrawRequests/${id}`);

        // ==============================
        // ATOMIC REJECT
        // ==============================

        const result = await runTransaction(
            requestRef,
            currentData => {

                if (!currentData) {
                    return;
                }

                if (
                    normalizeStatus(
                        currentData.status
                    ) !== "pending"
                ) {
                    return;
                }

                return {
                    ...currentData,

                    status: "rejected",

                    rejectedAt: Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null
                };
            }
        );

        if (!result.committed) {

            alert(
                "This request is no longer pending."
            );

            return;
        }

        alert(
            "Withdrawal rejected successfully."
        );

        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }

    } catch (error) {

        console.error(
            "rejectWithdraw error:",
            error
        );

        alert(
            "Failed to reject withdrawal: " +
            (error?.message || "Unknown error")
        );
    }
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;

// ======================================
// PART 7 — VIP PURCHASE REQUESTS
// Money Vault Admin Panel
// ======================================

async function loadVipRequests() {
    try {

        await window.waitForAdmin();

        const vipRef =
            ref(db, "vipPurchaseRequests");

        onValue(vipRef, async (snapshot) => {

            const data =
                snapshot.val() || {};

            const requests =
                Object.entries(data).map(
                    ([id, item]) => ({
                        id,
                        ...item
                    })
                );

            // ==============================
            // SORT NEWEST FIRST
            // ==============================

            requests.sort((a, b) => {

                const dateA =
                    Number(a.createdAt) || 0;

                const dateB =
                    Number(b.createdAt) || 0;

                return dateB - dateA;
            });


            // ==============================
            // COUNTERS
            // ==============================

            const total =
                requests.length;

            const pending =
                requests.filter(
                    item =>
                        normalizeStatus(item.status) ===
                        "pending"
                ).length;

            const approved =
                requests.filter(
                    item =>
                        normalizeStatus(item.status) ===
                        "approved"
                ).length;

            const rejected =
                requests.filter(
                    item =>
                        normalizeStatus(item.status) ===
                        "rejected"
                ).length;


            updateText(
                "vipTotalCount",
                total
            );

            updateText(
                "vipPendingCount",
                pending
            );

            updateText(
                "vipApprovedCount",
                approved
            );

            updateText(
                "vipRejectedCount",
                rejected
            );


            // ==============================
            // CONTAINER
            // ==============================

            const container =
                document.getElementById(
                    "vipRequestList"
                );

            const emptyState =
                document.getElementById(
                    "emptyVipRequest"
                );


            if (!container) {

                console.error(
                    "vipRequestList element not found."
                );

                return;
            }


            container.innerHTML = "";


            // ==============================
            // EMPTY STATE
            // ==============================

            if (requests.length === 0) {

                if (emptyState) {
                    emptyState.style.display =
                        "block";
                }

                return;
            }


            if (emptyState) {
                emptyState.style.display =
                    "none";
            }


            // ==============================
            // LOAD USERS
            // ==============================

            const usersSnapshot =
                await get(
                    ref(db, "users")
                );

            const users =
                usersSnapshot.exists()
                    ? usersSnapshot.val()
                    : {};


            // ==============================
            // RENDER
            // ==============================

            requests.forEach(request => {

                const user =
                    users[request.uid] || {};

                container.insertAdjacentHTML(
                    "beforeend",
                    renderVipRequestCard(
                        request,
                        user
                    )
                );

            });


            // ==============================
            // ACTIVATE BUTTONS
            // ==============================

            activateVipRequestButtons();

        }, error => {

            console.error(
                "Error loading VIP requests:",
                error
            );

            const container =
                document.getElementById(
                    "vipRequestList"
                );

            if (container) {

                container.innerHTML = `
                    <div class="error-message">
                        Failed to load VIP requests.
                    </div>
                `;
            }

        });

    } catch (error) {

        console.error(
            "loadVipRequests error:",
            error
        );
    }
}


// ======================================
// RENDER VIP REQUEST CARD
// ======================================

function renderVipRequestCard(
    request,
    user = {}
) {

    const id =
        escapeHTML(request.id);

    const uid =
        escapeHTML(request.uid || "N/A");


    // ==============================
    // SUPPORT MULTIPLE FIELD NAMES
    // ==============================

    const vipName =
        request.vipName ||
        request.name ||
        request.planName ||
        "VIP Plan";


    const price =
        numberValue(
            request.price ??
            request.vipPrice ??
            request.amount
        );


    const dailyIncome =
        numberValue(
            request.dailyIncome ??
            request.daily
        );


    const totalProfit =
        numberValue(
            request.totalProfit ??
            request.profit
        );


    const duration =
        request.duration ??
        request.days ??
        "";


    const status =
        normalizeStatus(
            request.status
        );


    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const userEmail =
        user.email ||
        "N/A";


    const createdAt =
        request.createdAt
            ? new Date(
                Number(request.createdAt)
            ).toLocaleString()
            : "N/A";


    const approvedAt =
        request.approvedAt
            ? new Date(
                Number(request.approvedAt)
            ).toLocaleString()
            : "";


    const rejectedAt =
        request.rejectedAt
            ? new Date(
                Number(request.rejectedAt)
            ).toLocaleString()
            : "";


    // ==============================
    // STATUS TEXT
    // ==============================

    let statusText = "Pending";

    if (status === "approved") {
        statusText = "Approved";
    }

    if (status === "rejected") {
        statusText = "Rejected";
    }

    if (status === "processing") {
        statusText = "Processing";
    }

    if (status === "processing_error") {
        statusText = "Processing Error";
    }


    // ==============================
    // ACTIONS
    // ==============================

    let actions = "";

    if (status === "pending") {

        actions = `
            <div class="vip-request-actions">

                <button
                    type="button"
                    class="vipApproveBtn"
                    data-id="${id}">
                    Approve
                </button>

                <button
                    type="button"
                    class="vipRejectBtn"
                    data-id="${id}">
                    Reject
                </button>

            </div>
        `;
    }


    return `
        <div
            class="vip-request-card"
            data-id="${id}"
            data-status="${status}">

            <div class="vip-request-header">

                <div>

                    <h3>
                        ${escapeHTML(vipName)}
                    </h3>

                    <small>
                        Request ID:
                        ${id}
                    </small>

                </div>

                <span
                    class="status-badge status-${status}">
                    ${statusText}
                </span>

            </div>


            <div class="vip-request-user">

                <div class="info-row">

                    <span>User</span>

                    <strong>
                        ${escapeHTML(userName)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Email</span>

                    <strong>
                        ${escapeHTML(userEmail)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>UID</span>

                    <strong>
                        ${uid}
                    </strong>

                </div>

            </div>


            <div class="vip-request-details">

                <div class="info-row">

                    <span>VIP Price</span>

                    <strong>
                        ${formatMoney(price)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Daily Income</span>

                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Total Profit</span>

                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Duration</span>

                    <strong>
                        ${escapeHTML(duration)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Created At</span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>


                ${
                    approvedAt
                        ? `
                            <div class="info-row">

                                <span>
                                    Approved At
                                </span>

                                <strong>
                                    ${approvedAt}
                                </strong>

                            </div>
                          `
                        : ""
                }


                ${
                    rejectedAt
                        ? `
                            <div class="info-row">

                                <span>
                                    Rejected At
                                </span>

                                <strong>
                                    ${rejectedAt}
                                </strong>

                            </div>
                          `
                        : ""
                }

            </div>


            ${actions}

        </div>
    `;
}


// ======================================
// ACTIVATE VIP REQUEST BUTTONS
// ======================================

function activateVipRequestButtons() {

    // ==============================
    // APPROVE
    // ==============================

    document
        .querySelectorAll(".vipApproveBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {

                        alert(
                            "VIP request ID is missing."
                        );

                        return;
                    }


                    if (
                        typeof window.approveVipRequest ===
                        "function"
                    ) {

                        await window.approveVipRequest(
                            id
                        );

                    } else {

                        console.error(
                            "approveVipRequest() is not available yet."
                        );
                    }

                }
            );

        });


    // ==============================
    // REJECT
    // ==============================

    document
        .querySelectorAll(".vipRejectBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {

                        alert(
                            "VIP request ID is missing."
                        );

                        return;
                    }


                    if (
                        typeof window.rejectVipRequest ===
                        "function"
                    ) {

                        await window.rejectVipRequest(
                            id
                        );

                    } else {

                        console.error(
                            "rejectVipRequest() is not available yet."
                        );
                    }

                }
            );

        });
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadVipRequests =
    loadVipRequests;

window.renderVipRequestCard =
    renderVipRequestCard;

window.activateVipRequestButtons =
    activateVipRequestButtons;

// ======================================
// ADMIN.JS - PART 8
// VIP APPROVE / REJECT
// VIP PRICE DEDUCTION + FIRST REFERRAL BONUS
// ======================================

const REFERRAL_BONUS_AMOUNT = 1000;


// ======================================
// GET VIP DURATION
// ======================================

function getVipDuration(request) {

    let duration = Number(
        request.duration ??
        request.days ??
        request.vipDuration ??
        0
    );

    if (Number.isFinite(duration) && duration > 0) {
        return duration;
    }

    const totalProfit = numberValue(
        request.totalProfit ??
        request.profit ??
        0
    );

    const dailyIncome = numberValue(
        request.dailyIncome ??
        request.daily ??
        0
    );

    if (dailyIncome > 0 && totalProfit > 0) {
        return Math.ceil(totalProfit / dailyIncome);
    }

    return 0;
}


// ======================================
// APPROVE VIP REQUEST
// ======================================

async function approveVipRequest(id) {

    try {

        await window.waitForAdmin();

        const requestRef = ref(
            db,
            `vipPurchaseRequests/${id}`
        );

        const requestSnap = await get(requestRef);

        if (!requestSnap.exists()) {
            alert("VIP request not found.");
            return;
        }

        const request = requestSnap.val();

        const currentStatus = normalizeStatus(
            request.status
        );

        if (currentStatus !== "pending") {
            alert(
                `This VIP request is already ${currentStatus}.`
            );
            return;
        }


        // ==================================
        // BASIC DATA
        // ==================================

        const uid = request.uid;

        if (!uid) {
            throw new Error(
                "VIP request has no user UID."
            );
        }


        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            "VIP Plan";


        const price = numberValue(
            request.price ??
            request.vipPrice ??
            request.amount ??
            0
        );


        const dailyIncome = numberValue(
            request.dailyIncome ??
            request.daily ??
            0
        );


        const totalProfit = numberValue(
            request.totalProfit ??
            request.profit ??
            0
        );


        const duration = getVipDuration(request);


        if (price <= 0) {
            throw new Error(
                "Invalid VIP price."
            );
        }

        if (dailyIncome <= 0) {
            throw new Error(
                "Invalid VIP daily income."
            );
        }

        if (duration <= 0) {
            throw new Error(
                "Invalid VIP duration."
            );
        }


        // ==================================
        // CONFIRM ADMIN
        // ==================================

        const shouldApprove = confirm(
            `Approve ${vipName} for ${price.toLocaleString()} RWF?`
        );

        if (!shouldApprove) {
            return;
        }


        // ==================================
        // LOCK REQUEST
        // pending -> processing
        // ==================================

        const lockResult = await runTransaction(
            requestRef,
            currentData => {

                if (!currentData) {
                    return;
                }

                const status = normalizeStatus(
                    currentData.status
                );

                if (status !== "pending") {
                    return;
                }

                return {
                    ...currentData,

                    status: "processing",

                    processingAt: Date.now(),

                    processingBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null
                };
            }
        );


        if (!lockResult.committed) {

            alert(
                "This VIP request is already being processed."
            );

            return;
        }


        // ==================================
        // GET USER
        // ==================================

        const userRef = ref(
            db,
            `users/${uid}`
        );

        const userSnap = await get(userRef);

        if (!userSnap.exists()) {

            await update(requestRef, {

                status: "rejected",

                rejectedReason:
                    "User account not found.",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            });

            alert(
                "User account not found."
            );

            return;
        }


        const user = userSnap.val();


        // ==================================
        // CHECK BALANCE
        // ==================================

        const currentBalance = numberValue(
            user.balance
        );


        if (currentBalance < price) {

            await update(requestRef, {

                status: "rejected",

                rejectedReason:
                    "Insufficient balance.",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            });

            alert(
                `Insufficient balance.\n\n` +
                `VIP Price: ${price.toLocaleString()} RWF\n` +
                `Balance: ${currentBalance.toLocaleString()} RWF`
            );

            return;
        }


        // ==================================
        // DEDUCT VIP PRICE
        // ==================================

        const balanceResult = await runTransaction(
            userRef,
            currentData => {

                if (!currentData) {
                    return;
                }

                const balance = numberValue(
                    currentData.balance
                );

                if (balance < price) {
                    return;
                }

                return {
                    ...currentData,

                    balance: balance - price
                };
            }
        );


        if (!balanceResult.committed) {

            await update(requestRef, {

                status: "rejected",

                rejectedReason:
                    "Insufficient balance.",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            });

            alert(
                "VIP purchase failed: insufficient balance."
            );

            return;
        }


        // ==================================
        // TIME
        // ==================================

        const now = Date.now();


        // ==================================
        // CREATE VIP BUYER
        // ==================================

        const vipBuyerRef = push(
            ref(db, "vipBuyers")
        );

        const vipBuyerId = vipBuyerRef.key;


        const vipBuyerData = {

            uid: uid,

            vipName: vipName,

            price: price,

            dailyIncome: dailyIncome,

            totalProfit: totalProfit,

            duration: duration,

            startDate: now,

            lastClaim: now,

            claimedAmount: 0,

            status: "active",

            purchaseRequestId: id,

            createdAt: now,

            approvedAt: now,

            approvedBy:
                currentAdmin?.uid ||
                auth.currentUser?.uid ||
                null
        };


        await set(
            vipBuyerRef,
            vipBuyerData
        );


        // ==================================
        // VIP TRANSACTION
        // ==================================

        const vipTransactionRef = push(
            ref(db, "transactions")
        );

        await set(
            vipTransactionRef,
            {

                uid: uid,

                type: "vip",

                amount: price,

                status: "approved",

                vipName: vipName,

                vipBuyerId: vipBuyerId,

                vipPurchaseRequestId: id,

                description:
                    `VIP purchase - ${vipName}`,

                createdAt: now,

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            }
        );


        // ==================================
        // FIRST VIP REFERRAL BONUS
        // ==================================

        const referredBy = user.referredBy;

        let referralBonusGiven = false;


        if (
            referredBy &&
            referredBy !== uid
        ) {

            try {

                // --------------------------------
                // CHECK IF THIS USER ALREADY
                // HAD A VIP BEFORE
                // --------------------------------

                const vipBuyersSnap = await get(
                    ref(db, "vipBuyers")
                );

                const allVipBuyers =
                    vipBuyersSnap.exists()
                        ? vipBuyersSnap.val()
                        : {};


                const hasPreviousVip =
                    Object.values(
                        allVipBuyers
                    ).some(
                        buyer =>
                            buyer &&
                            buyer.uid === uid &&
                            buyer.purchaseRequestId !== id
                    );


                // --------------------------------
                // ONLY FIRST VIP
                // --------------------------------

                if (!hasPreviousVip) {

                    const referrerRef = ref(
                        db,
                        `users/${referredBy}`
                    );


                    const referralResult =
                        await runTransaction(
                            referrerRef,
                            currentData => {

                                if (!currentData) {
                                    return;
                                }


                                // ----------------------------
                                // PREVENT DUPLICATE BONUS
                                // ----------------------------

                                const bonusGiven =
                                    currentData.referralBonusGiven || {};


                                if (
                                    bonusGiven[uid] === true
                                ) {
                                    return;
                                }


                                const oldBalance =
                                    numberValue(
                                        currentData.balance
                                    );


                                const oldReferralEarnings =
                                    numberValue(
                                        currentData.referralEarnings
                                    );


                                return {

                                    ...currentData,

                                    balance:
                                        oldBalance +
                                        REFERRAL_BONUS_AMOUNT,

                                    referralEarnings:
                                        oldReferralEarnings +
                                        REFERRAL_BONUS_AMOUNT,

                                    referralBonusGiven: {

                                        ...bonusGiven,

                                        [uid]: true
                                    }
                                };
                            }
                        );


                    // --------------------------------
                    // CREATE REFERRAL TRANSACTION
                    // ONLY IF BONUS WAS ACTUALLY GIVEN
                    // --------------------------------

                    if (referralResult.committed) {

                        referralBonusGiven = true;


                        const referralTransactionRef =
                            push(
                                ref(
                                    db,
                                    "transactions"
                                )
                            );


                        await set(
                            referralTransactionRef,
                            {

                                uid: referredBy,

                                type: "referral",

                                amount:
                                    REFERRAL_BONUS_AMOUNT,

                                status: "approved",

                                referredUserUid: uid,

                                vipPurchaseRequestId: id,

                                description:
                                    "First VIP referral bonus",

                                createdAt: now,

                                approvedAt: now,

                                approvedBy:
                                    currentAdmin?.uid ||
                                    auth.currentUser?.uid ||
                                    null
                            }
                        );
                    }
                }

            } catch (referralError) {

                console.error(
                    "Referral bonus error:",
                    referralError
                );

                // IMPORTANT:
                // VIP itself remains approved.
                // Referral failure should not cancel
                // the user's VIP purchase.
            }
        }


        // ==================================
        // FINALIZE VIP REQUEST
        // ==================================

        await update(
            requestRef,
            {

                status: "approved",

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null,

                vipBuyerId: vipBuyerId,

                pricePaid: price,

                balanceDeducted: price,

                referralBonusGiven:
                    referralBonusGiven
            }
        );


        // ==================================
        // REFRESH ADMIN UI
        // ==================================

        if (
            typeof window.loadVipRequests ===
            "function"
        ) {
            window.loadVipRequests();
        }


        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {
            window.loadVipBuyers();
        }


        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


        alert(
            `VIP approved successfully!\n\n` +
            `VIP: ${vipName}\n` +
            `Price: ${price.toLocaleString()} RWF\n` +
            `Amount deducted: ${price.toLocaleString()} RWF` +
            (
                referralBonusGiven
                    ? `\n\nReferral bonus: +${REFERRAL_BONUS_AMOUNT.toLocaleString()} RWF`
                    : ""
            )
        );


    } catch (error) {

        console.error(
            "approveVipRequest error:",
            error
        );


        // ==================================
        // MARK PROCESSING ERROR
        // ==================================

        try {

            await update(
                ref(
                    db,
                    `vipPurchaseRequests/${id}`
                ),
                {

                    status: "processing_error",

                    error:
                        error?.message ||
                        "Unknown error",

                    errorAt: Date.now(),

                    errorBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null
                }
            );

        } catch (updateError) {

            console.error(
                "Could not update VIP error status:",
                updateError
            );
        }


        alert(
            "VIP approval failed: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}


// ======================================
// REJECT VIP REQUEST
// ======================================

async function rejectVipRequest(id) {

    try {

        await window.waitForAdmin();


        const requestRef = ref(
            db,
            `vipPurchaseRequests/${id}`
        );


        const snap = await get(
            requestRef
        );


        if (!snap.exists()) {

            alert(
                "VIP request not found."
            );

            return;
        }


        const request = snap.val();


        if (
            normalizeStatus(request.status) !==
            "pending"
        ) {

            alert(
                "This VIP request is no longer pending."
            );

            return;
        }


        const reason = prompt(
            "Reason for rejecting this VIP request:",
            "Rejected by administrator"
        );


        if (reason === null) {
            return;
        }


        const result = await runTransaction(
            requestRef,
            currentData => {

                if (!currentData) {
                    return;
                }


                if (
                    normalizeStatus(
                        currentData.status
                    ) !== "pending"
                ) {
                    return;
                }


                return {

                    ...currentData,

                    status: "rejected",

                    rejectedReason:
                        reason ||
                        "Rejected by administrator",

                    rejectedAt: Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null
                };
            }
        );


        if (!result.committed) {

            alert(
                "This VIP request has already been processed."
            );

            return;
        }


        if (
            typeof window.loadVipRequests ===
            "function"
        ) {
            window.loadVipRequests();
        }


        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


        alert(
            "VIP request rejected successfully."
        );


    } catch (error) {

        console.error(
            "rejectVipRequest error:",
            error
        );


        alert(
            "Reject failed: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}


// ======================================
// GLOBAL FUNCTIONS
// ======================================

window.REFERRAL_BONUS_AMOUNT =
    REFERRAL_BONUS_AMOUNT;

window.getVipDuration =
    getVipDuration;

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;

  // ======================================
// ADMIN.JS - PART 9
// VIP BUYERS
// ======================================

async function loadVipBuyers() {

    try {

        await window.waitForAdmin();

        const vipBuyersRef =
            ref(db, "vipBuyers");


        onValue(
            vipBuyersRef,
            async (snapshot) => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT OBJECT TO ARRAY
                // --------------------------------------

                const buyers =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST FIRST
                // --------------------------------------

                buyers.sort(
                    (a, b) =>
                        (Number(b.approvedAt) || Number(b.createdAt) || 0) -
                        (Number(a.approvedAt) || Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // CHECK ACTIVE / EXPIRED
                // --------------------------------------

                const now = Date.now();


                const processedBuyers =
                    buyers.map(buyer => {

                        const startDate =
                            Number(
                                buyer.startDate ??
                                buyer.approvedAt ??
                                buyer.createdAt ??
                                0
                            );


                        const duration =
                            numberValue(
                                buyer.duration ??
                                buyer.days
                            );


                        const durationMs =
                            duration *
                            24 *
                            60 *
                            60 *
                            1000;


                        let calculatedStatus =
                            normalizeStatus(
                                buyer.status
                            );


                        // If duration exists, calculate expiration
                        if (
                            startDate > 0 &&
                            duration > 0
                        ) {

                            const expirationDate =
                                startDate + durationMs;


                            if (now >= expirationDate) {

                                calculatedStatus =
                                    "expired";

                            } else {

                                calculatedStatus =
                                    "active";
                            }
                        }


                        return {
                            ...buyer,
                            calculatedStatus
                        };

                    });


                // --------------------------------------
                // COUNTERS
                // --------------------------------------

                const total =
                    processedBuyers.length;


                const active =
                    processedBuyers.filter(
                        buyer =>
                            buyer.calculatedStatus ===
                            "active"
                    ).length;


                const expired =
                    processedBuyers.filter(
                        buyer =>
                            buyer.calculatedStatus ===
                            "expired"
                    ).length;


                updateText(
                    "vipBuyerTotalCount",
                    total
                );


                updateText(
                    "vipBuyerActiveCount",
                    active
                );


                updateText(
                    "vipBuyerExpiredCount",
                    expired
                );


                // --------------------------------------
                // HTML CONTAINER
                // --------------------------------------

                const container =
                    document.getElementById(
                        "vipBuyerList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyVipBuyer"
                    );


                if (!container) {

                    console.error(
                        "vipBuyerList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY STATE
                // --------------------------------------

                if (processedBuyers.length === 0) {

                    if (emptyState) {
                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // LOAD USERS
                // --------------------------------------

                let users = {};

                try {

                    const usersSnapshot =
                        await get(
                            ref(db, "users")
                        );


                    if (usersSnapshot.exists()) {

                        users =
                            usersSnapshot.val() || {};
                    }

                } catch (userError) {

                    console.error(
                        "Failed to load users:",
                        userError
                    );
                }


                // --------------------------------------
                // RENDER VIP BUYERS
                // --------------------------------------

                processedBuyers.forEach(
                    buyer => {

                        const user =
                            users[buyer.uid] || {};


                        container.insertAdjacentHTML(
                            "beforeend",
                            renderVipBuyerCard(
                                buyer,
                                user
                            )
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Error loading VIP buyers:",
                    error
                );


                const container =
                    document.getElementById(
                        "vipBuyerList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load VIP buyers.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadVipBuyers error:",
            error
        );
    }
}



// ======================================
// RENDER VIP BUYER CARD
// ======================================

function renderVipBuyerCard(
    buyer,
    user = {}
) {

    const id =
        escapeHTML(
            buyer.id
        );


    const uid =
        escapeHTML(
            buyer.uid || "N/A"
        );


    const vipName =
        escapeHTML(
            buyer.vipName ||
            buyer.name ||
            buyer.planName ||
            "VIP Plan"
        );


    const price =
        numberValue(
            buyer.price ??
            buyer.vipPrice ??
            buyer.amount
        );


    const dailyIncome =
        numberValue(
            buyer.dailyIncome ??
            buyer.daily
        );


    const totalProfit =
        numberValue(
            buyer.totalProfit ??
            buyer.profit
        );


    const duration =
        numberValue(
            buyer.duration ??
            buyer.days
        );


    const claimedAmount =
        numberValue(
            buyer.claimedAmount
        );


    const startDate =
        Number(
            buyer.startDate ??
            buyer.approvedAt ??
            buyer.createdAt ??
            0
        );


    const lastClaim =
        Number(
            buyer.lastClaim || 0
        );


    const approvedAt =
        Number(
            buyer.approvedAt ||
            buyer.createdAt ||
            0
        );


    // --------------------------------------
    // EXPIRATION DATE
    // --------------------------------------

    let expirationDate = 0;

    if (
        startDate > 0 &&
        duration > 0
    ) {

        expirationDate =
            startDate +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );
    }


    // --------------------------------------
    // STATUS
    // --------------------------------------

    let status =
        buyer.calculatedStatus ||
        normalizeStatus(
            buyer.status
        );


    if (
        expirationDate > 0 &&
        Date.now() >= expirationDate
    ) {

        status = "expired";

    } else if (
        expirationDate > 0 &&
        Date.now() < expirationDate
    ) {

        status = "active";
    }


    let statusText = "Active";


    if (status === "expired") {

        statusText = "Expired";

    } else if (status === "active") {

        statusText = "Active";

    } else if (status === "pending") {

        statusText = "Pending";

    } else if (status === "processing") {

        statusText = "Processing";

    } else {

        statusText =
            escapeHTML(status);
    }


    // --------------------------------------
    // USER INFORMATION
    // --------------------------------------

    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const userEmail =
        user.email ||
        "N/A";


    // --------------------------------------
    // DATE FORMATTER
    // --------------------------------------

    const formatDate =
        timestamp => {

            if (
                !timestamp ||
                !Number.isFinite(
                    Number(timestamp)
                )
            ) {

                return "N/A";
            }


            return new Date(
                Number(timestamp)
            ).toLocaleString();
        };


    // --------------------------------------
    // EXPIRATION DISPLAY
    // --------------------------------------

    const expirationText =
        expirationDate > 0
            ? formatDate(expirationDate)
            : "N/A";


    // --------------------------------------
    // RETURN CARD
    // --------------------------------------

    return `
        <div
            class="vip-buyer-card"
            data-id="${id}"
            data-status="${escapeHTML(status)}"
        >

            <div class="vip-buyer-header">

                <div>

                    <h3>
                        ${vipName}
                    </h3>

                    <small>
                        Buyer ID: ${id}
                    </small>

                </div>


                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="vip-buyer-user">

                <div class="info-row">
                    <span>User</span>
                    <strong>
                        ${escapeHTML(userName)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(userEmail)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>UID</span>
                    <strong>
                        ${uid}
                    </strong>
                </div>

            </div>


            <div class="vip-buyer-details">

                <div class="info-row">
                    <span>VIP Price</span>
                    <strong>
                        ${formatMoney(price)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Daily Income</span>
                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Total Profit</span>
                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Duration</span>
                    <strong>
                        ${escapeHTML(duration)} Days
                    </strong>
                </div>


                <div class="info-row">
                    <span>Claimed Amount</span>
                    <strong>
                        ${formatMoney(claimedAmount)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Start Date</span>
                    <strong>
                        ${formatDate(startDate)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Last Claim</span>
                    <strong>
                        ${formatDate(lastClaim)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Expiration Date</span>
                    <strong>
                        ${expirationText}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Approved At</span>
                    <strong>
                        ${formatDate(approvedAt)}
                    </strong>
                </div>

            </div>

        </div>
    `;
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadVipBuyers =
    loadVipBuyers;

window.renderVipBuyerCard =
    renderVipBuyerCard;

// ======================================
// PART 10 - USERS
// Money Vault Admin
// ======================================

let allUsers = {};


/* ======================================
   LOAD USERS
====================================== */

async function loadUsers() {

    try {

        await waitForAdmin();

        const usersRef =
            ref(db, "users");

        onValue(
            usersRef,
            (snapshot) => {

                allUsers =
                    snapshot.val() || {};

                renderUsers();

            },
            (error) => {

                console.error(
                    "Users listener error:",
                    error
                );

                const list =
                    document.getElementById(
                        "usersList"
                    );

                if (list) {

                    list.innerHTML = `
                        <div class="error-state">

                            <i class="fas fa-exclamation-triangle"></i>

                            <h3>
                                Failed to load users
                            </h3>

                            <p>
                                ${escapeHTML(
                                    error.message
                                )}
                            </p>

                        </div>
                    `;
                }
            }
        );

    } catch (error) {

        console.error(
            "loadUsers error:",
            error
        );
    }
}


/* ======================================
   RENDER USERS
====================================== */

function renderUsers() {

    const list =
        document.getElementById(
            "usersList"
        );

    const empty =
        document.getElementById(
            "emptyUsers"
        );

    if (!list) return;


    // ==============================
    // SEARCH
    // ==============================

    const searchInput =
        document.getElementById(
            "userSearch"
        );

    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    // ==============================
    // USER ARRAY
    // ==============================

    const users =
        Object.entries(allUsers)
            .map(([uid, user]) => ({
                uid,
                ...(user || {})
            }))
            .sort((a, b) => {

                const dateA =
                    Number(
                        a.createdAt || 0
                    );

                const dateB =
                    Number(
                        b.createdAt || 0
                    );

                return dateB - dateA;
            });


    // ==============================
    // SEARCH FILTER
    // ==============================

    const filtered =
        users.filter(user => {

            const name =
                String(
                    user.name ||
                    user.fullName ||
                    user.username ||
                    ""
                )
                .toLowerCase();


            const email =
                String(
                    user.email || ""
                )
                .toLowerCase();


            const phone =
                String(
                    user.phone ||
                    user.phoneNumber ||
                    ""
                )
                .toLowerCase();


            const uid =
                String(
                    user.uid || ""
                )
                .toLowerCase();


            const referralCode =
                String(
                    user.referralCode || ""
                )
                .toLowerCase();


            const referredBy =
                String(
                    user.referredBy || ""
                )
                .toLowerCase();


            return (
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                phone.includes(search) ||
                uid.includes(search) ||
                referralCode.includes(search) ||
                referredBy.includes(search)
            );

        });


    // ==============================
    // EMPTY
    // ==============================

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {

        empty.style.display =
            "none";
    }


    // ==============================
    // RENDER
    // ==============================

    list.innerHTML =
        filtered
            .map(user =>
                renderUserCard(user)
            )
            .join("");
}


/* ======================================
   USER CARD
====================================== */

function renderUserCard(user) {

    const uid =
        user.uid || "";


    // ==============================
    // BASIC PROFILE
    // ==============================

    const name =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const email =
        user.email ||
        "No email";


    const phone =
        user.phone ||
        user.phoneNumber ||
        "No phone";


    // ==============================
    // FINANCIAL DATA
    // ==============================

    const balance =
        numberValue(
            user.balance
        );


    const totalDeposits =
        numberValue(
            user.totalDeposits
        );


    const totalWithdrawals =
        numberValue(
            user.totalWithdrawals
        );


    const referralEarnings =
        numberValue(
            user.referralEarnings
        );


    const totalProfits =
        numberValue(
            user.totalProfits
        );


    const totalTransactions =
        numberValue(
            user.totalTransactions
        );


    // ==============================
    // REFERRAL DATA
    // ==============================

    const referralCode =
        user.referralCode ||
        "N/A";


    const referredBy =
        user.referredBy ||
        "None";


    // ==============================
    // CREATED DATE
    // ==============================

    const createdAt =
        user.createdAt
            ? formatDate(
                user.createdAt
            )
            : "N/A";


    // ==============================
    // PROFILE PHOTO
    // ==============================

    const photo =
        user.photoURL ||
        user.photo ||
        user.profileImage ||
        "";


    const avatarHTML =
        photo
            ? `
                <img
                    src="${escapeHTML(
                        photo
                    )}"
                    alt="User"
                    class="user-profile-image"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="user-avatar-fallback"
                    style="display:none;"
                >
                    <i class="fas fa-user"></i>
                </div>
              `
            : `
                <div class="user-avatar-fallback">
                    <i class="fas fa-user"></i>
                </div>
              `;


    // ==============================
    // CARD
    // ==============================

    return `

        <div
            class="user-card"
            data-uid="${escapeHTML(
                uid
            )}"
        >


            <!-- ==========================
                 PROFILE HEADER
            =========================== -->

            <div class="user-card-header">


                <div class="user-main-profile">


                    <div class="user-avatar">

                        ${avatarHTML}

                    </div>


                    <div
                        class="user-main-info"
                    >

                        <h3>
                            ${escapeHTML(
                                name
                            )}
                        </h3>


                        <p>

                            <i
                                class="fas fa-envelope"
                            ></i>

                            ${escapeHTML(
                                email
                            )}

                        </p>


                        <p>

                            <i
                                class="fas fa-phone"
                            ></i>

                            ${escapeHTML(
                                phone
                            )}

                        </p>

                    </div>

                </div>


                <div
                    class="user-account-status"
                >

                    <span class="active-badge">

                        <i
                            class="fas fa-circle"
                        ></i>

                        Active

                    </span>

                </div>

            </div>


            <!-- ==========================
                 USER INFORMATION
            =========================== -->

            <div class="user-section">


                <div class="section-title">

                    <i
                        class="fas fa-id-card"
                    ></i>

                    User Information

                </div>


                <div class="user-info-grid">


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-user"
                            ></i>

                            Full Name

                        </span>


                        <strong>
                            ${escapeHTML(
                                name
                            )}
                        </strong>

                    </div>


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-envelope"
                            ></i>

                            Email

                        </span>


                        <strong>
                            ${escapeHTML(
                                email
                            )}
                        </strong>

                    </div>


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-mobile-alt"
                            ></i>

                            Phone

                        </span>


                        <strong>
                            ${escapeHTML(
                                phone
                            )}
                        </strong>

                    </div>


                    <div
                        class="user-info-item uid-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-fingerprint"
                            ></i>

                            UID

                        </span>


                        <strong
                            title="${escapeHTML(
                                uid
                            )}"
                        >
                            ${escapeHTML(
                                uid
                            )}
                        </strong>

                    </div>


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-calendar-alt"
                            ></i>

                            Created

                        </span>


                        <strong>
                            ${escapeHTML(
                                createdAt
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 BALANCE
            =========================== -->

            <div class="user-balance-box">


                <div class="balance-icon">

                    <i
                        class="fas fa-wallet"
                    ></i>

                </div>


                <div>

                    <span>
                        Current Balance
                    </span>


                    <strong>
                        ${formatMoney(
                            balance
                        )}
                    </strong>

                </div>

            </div>


            <!-- ==========================
                 FINANCIAL STATISTICS
            =========================== -->

            <div class="user-section">


                <div class="section-title">

                    <i
                        class="fas fa-chart-line"
                    ></i>

                    Financial Statistics

                </div>


                <div class="user-stats-grid">


                    <div class="user-stat deposit-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-arrow-down"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Total Deposits
                            </span>

                            <strong>
                                ${formatMoney(
                                    totalDeposits
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat withdraw-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-arrow-up"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Total Withdrawals
                            </span>

                            <strong>
                                ${formatMoney(
                                    totalWithdrawals
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat profit-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-chart-line"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Total Profits
                            </span>

                            <strong>
                                ${formatMoney(
                                    totalProfits
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat referral-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-users"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Referral Earnings
                            </span>

                            <strong>
                                ${formatMoney(
                                    referralEarnings
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat transaction-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-receipt"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Transactions
                            </span>

                            <strong>
                                ${totalTransactions}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 REFERRAL INFORMATION
            =========================== -->

            <div class="user-section">


                <div class="section-title">

                    <i
                        class="fas fa-share-alt"
                    ></i>

                    Referral Information

                </div>


                <div class="referral-grid">


                    <div class="referral-item">

                        <span class="label">

                            <i
                                class="fas fa-link"
                            ></i>

                            Referral Code

                        </span>


                        <strong>
                            ${escapeHTML(
                                referralCode
                            )}
                        </strong>

                    </div>


                    <div class="referral-item">

                        <span class="label">

                            <i
                                class="fas fa-user-plus"
                            ></i>

                            Referred By

                        </span>


                        <strong>
                            ${escapeHTML(
                                referredBy
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 UID FOOTER
            =========================== -->

            <div class="user-card-footer">


                <div class="user-uid">

                    <span>
                        User UID
                    </span>


                    <code>
                        ${escapeHTML(
                            uid
                        )}
                    </code>

                </div>


                <button
                    type="button"
                    class="copy-uid-btn"
                    data-uid="${escapeHTML(
                        uid
                    )}"
                    title="Copy UID"
                >

                    <i
                        class="fas fa-copy"
                    ></i>

                </button>

            </div>


        </div>

    `;
}


/* ======================================
   USER SEARCH
====================================== */

const userSearchInput =
    document.getElementById(
        "userSearch"
    );


if (userSearchInput) {

    userSearchInput.addEventListener(
        "input",
        () => {

            renderUsers();

        }
    );
}


/* ======================================
   COPY USER UID
====================================== */

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".copy-uid-btn"
            );

        if (!button) return;


        const uid =
            button.dataset.uid;


        if (!uid) return;


        try {

            await navigator.clipboard.writeText(
                uid
            );


            const oldHTML =
                button.innerHTML;


            button.innerHTML = `
                <i class="fas fa-check"></i>
            `;


            setTimeout(() => {

                button.innerHTML =
                    oldHTML;

            }, 1500);


        } catch (error) {

            console.error(
                "Copy UID failed:",
                error
            );

        }

    }
);


/* ======================================
   GLOBAL FUNCTIONS
====================================== */

window.loadUsers =
    loadUsers;

window.renderUsers =
    renderUsers;

window.renderUserCard =
    renderUserCard;

// ======================================
// ADMIN.JS - PART 11
// TRANSACTIONS
// ======================================

async function loadTransactions() {

    try {

        await window.waitForAdmin();

        const transactionsRef =
            ref(db, "transactions");


        onValue(
            transactionsRef,
            snapshot => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT OBJECT TO ARRAY
                // --------------------------------------

                const transactions =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST FIRST
                // --------------------------------------

                transactions.sort(
                    (a, b) =>
                        (Number(b.createdAt) || 0) -
                        (Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // HTML ELEMENTS
                // --------------------------------------

                const container =
                    document.getElementById(
                        "transactionList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyTransaction"
                    );


                if (!container) {

                    console.error(
                        "transactionList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY STATE
                // --------------------------------------

                if (transactions.length === 0) {

                    if (emptyState) {

                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // RENDER TRANSACTIONS
                // --------------------------------------

                transactions.forEach(
                    transaction => {

                        container.insertAdjacentHTML(
                            "beforeend",
                            renderTransactionCard(
                                transaction
                            )
                        );

                    }
                );


                // --------------------------------------
                // ACTIVATE SEARCH / FILTER
                // --------------------------------------

                activateTransactionSearch();

            },

            error => {

                console.error(
                    "Error loading transactions:",
                    error
                );


                const container =
                    document.getElementById(
                        "transactionList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load transactions.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadTransactions error:",
            error
        );
    }
}



// ======================================
// RENDER TRANSACTION CARD
// ======================================

function renderTransactionCard(
    transaction
) {

    const id =
        escapeHTML(
            transaction.id || "N/A"
        );


    const uid =
        escapeHTML(
            transaction.uid || "N/A"
        );


    const type =
        normalizeStatus(
            transaction.type ||
            "unknown"
        );


    const status =
        normalizeStatus(
            transaction.status ||
            "pending"
        );


    const amount =
        numberValue(
            transaction.amount
        );


    const paymentMethod =
        escapeHTML(
            transaction.paymentMethod ||
            transaction.method ||
            "N/A"
        );


    const phone =
        escapeHTML(
            transaction.phone ||
            transaction.senderPhone ||
            transaction.receiverPhone ||
            transaction.withdrawPhone ||
            "N/A"
        );


    const transactionId =
        escapeHTML(
            transaction.transactionId ||
            "N/A"
        );


    const createdAt =
        transaction.createdAt
            ? new Date(
                Number(transaction.createdAt)
              ).toLocaleString()
            : "N/A";


    const approvedAt =
        transaction.approvedAt
            ? new Date(
                Number(transaction.approvedAt)
              ).toLocaleString()
            : "";


    const rejectedAt =
        transaction.rejectedAt
            ? new Date(
                Number(transaction.rejectedAt)
              ).toLocaleString()
            : "";


    // --------------------------------------
    // TRANSACTION TYPE TEXT
    // --------------------------------------

    let typeText = "Transaction";


    if (type === "deposit") {

        typeText = "Deposit";

    } else if (type === "withdraw") {

        typeText = "Withdraw";

    } else if (type === "vip") {

        typeText = "VIP Purchase";

    } else if (type === "profit") {

        typeText = "Profit";

    } else if (type === "bonus") {

        typeText = "Bonus";

    } else if (type === "referral") {

        typeText = "Referral Bonus";

    } else {

        typeText =
            escapeHTML(
                transaction.type ||
                "Transaction"
            );
    }


    // --------------------------------------
    // STATUS TEXT
    // --------------------------------------

    let statusText = "Pending";


    if (status === "approved") {

        statusText = "Approved";

    } else if (status === "rejected") {

        statusText = "Rejected";

    } else if (status === "pending") {

        statusText = "Pending";

    } else if (status === "processing") {

        statusText = "Processing";

    } else if (
        status === "processing_error"
    ) {

        statusText = "Processing Error";

    } else {

        statusText =
            escapeHTML(
                transaction.status ||
                "Pending"
            );
    }


    // --------------------------------------
    // EXTRA DATA
    // --------------------------------------

    const vipName =
        escapeHTML(
            transaction.vipName ||
            ""
        );


    const withdrawRequestId =
        escapeHTML(
            transaction.withdrawRequestId ||
            ""
        );


    const depositRequestId =
        escapeHTML(
            transaction.depositRequestId ||
            ""
        );


    // --------------------------------------
    // RETURN CARD
    // --------------------------------------

    return `
        <div
            class="transaction-card"
            data-id="${id}"
            data-uid="${uid.toLowerCase()}"
            data-type="${escapeHTML(type)}"
            data-status="${escapeHTML(status)}"
            data-search="${escapeHTML(
                (
                    (
                        transaction.uid || ""
                    ) +
                    " " +
                    (
                        transaction.transactionId || ""
                    ) +
                    " " +
                    (
                        transaction.type || ""
                    ) +
                    " " +
                    (
                        transaction.vipName || ""
                    )
                ).toLowerCase()
            )}"
        >

            <div class="transaction-card-header">

                <div>

                    <h3>
                        ${escapeHTML(typeText)}
                    </h3>

                    <small>
                        ID: ${id}
                    </small>

                </div>


                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="transaction-amount">

                <span>
                    Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <div class="transaction-info">

                <div class="info-row">

                    <span>
                        User UID
                    </span>

                    <strong>
                        ${uid}
                    </strong>

                </div>


                <div class="info-row">

                    <span>
                        Type
                    </span>

                    <strong>
                        ${escapeHTML(typeText)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${statusText}
                    </strong>

                </div>


                ${
                    transaction.transactionId
                    ? `
                    <div class="info-row">

                        <span>
                            Transaction ID
                        </span>

                        <strong>
                            ${transactionId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    transaction.paymentMethod ||
                    transaction.method
                    ? `
                    <div class="info-row">

                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${paymentMethod}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    transaction.phone ||
                    transaction.senderPhone ||
                    transaction.receiverPhone ||
                    transaction.withdrawPhone
                    ? `
                    <div class="info-row">

                        <span>
                            Phone
                        </span>

                        <strong>
                            ${phone}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    vipName
                    ? `
                    <div class="info-row">

                        <span>
                            VIP Plan
                        </span>

                        <strong>
                            ${vipName}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    withdrawRequestId
                    ? `
                    <div class="info-row">

                        <span>
                            Withdraw Request
                        </span>

                        <strong>
                            ${withdrawRequestId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    depositRequestId
                    ? `
                    <div class="info-row">

                        <span>
                            Deposit Request
                        </span>

                        <strong>
                            ${depositRequestId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                <div class="info-row">

                    <span>
                        Created At
                    </span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>


                ${
                    approvedAt
                    ? `
                    <div class="info-row">

                        <span>
                            Approved At
                        </span>

                        <strong>
                            ${approvedAt}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    rejectedAt
                    ? `
                    <div class="info-row">

                        <span>
                            Rejected At
                        </span>

                        <strong>
                            ${rejectedAt}
                        </strong>

                    </div>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}



// ======================================
// TRANSACTION SEARCH + FILTER
// ======================================

function activateTransactionSearch() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    if (
        !searchInput &&
        !filterSelect
    ) {
        return;
    }


    // --------------------------------------
    // PREVENT DUPLICATE LISTENERS
    // --------------------------------------

    if (
        searchInput &&
        searchInput.dataset.searchActive !== "true"
    ) {

        searchInput.dataset.searchActive =
            "true";


        searchInput.addEventListener(
            "input",
            applyTransactionFilters
        );
    }


    if (
        filterSelect &&
        filterSelect.dataset.filterActive !== "true"
    ) {

        filterSelect.dataset.filterActive =
            "true";


        filterSelect.addEventListener(
            "change",
            applyTransactionFilters
        );
    }
}



// ======================================
// APPLY TRANSACTION FILTERS
// ======================================

function applyTransactionFilters() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedFilter =
        normalizeStatus(
            filterSelect?.value ||
            "all"
        );


    const cards =
        document.querySelectorAll(
            "#transactionList .transaction-card"
        );


    cards.forEach(card => {

        const cardSearch =
            (
                card.dataset.search ||
                ""
            ).toLowerCase();


        const cardType =
            normalizeStatus(
                card.dataset.type ||
                ""
            );


        const cardStatus =
            normalizeStatus(
                card.dataset.status ||
                ""
            );


        // --------------------------------------
        // SEARCH MATCH
        // --------------------------------------

        const searchMatch =
            !search ||
            cardSearch.includes(search);


        // --------------------------------------
        // FILTER MATCH
        // --------------------------------------

        let filterMatch = true;


        if (
            selectedFilter &&
            selectedFilter !== "all"
        ) {

            if (
                selectedFilter === "approved" ||
                selectedFilter === "rejected" ||
                selectedFilter === "pending" ||
                selectedFilter === "processing"
            ) {

                filterMatch =
                    cardStatus ===
                    selectedFilter;

            } else {

                filterMatch =
                    cardType ===
                    selectedFilter;
            }
        }


        // --------------------------------------
        // DISPLAY
        // --------------------------------------

        card.style.display =
            searchMatch &&
            filterMatch
                ? ""
                : "none";

    });
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadTransactions =
    loadTransactions;

window.renderTransactionCard =
    renderTransactionCard;

window.activateTransactionSearch =
    activateTransactionSearch;

window.applyTransactionFilters =
    applyTransactionFilters;
