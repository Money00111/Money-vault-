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


// ==========================================
// ADMIN.JS — PART 3
// DEPOSIT REQUESTS
// ==========================================


// ==========================================
// LOAD DEPOSITS
// ==========================================

async function loadDeposits() {

    try {

        await window.waitForAdmin();

        console.log(
            "Loading deposit requests..."
        );


        const depositsRef =
            ref(db, "depositRequests");


        onValue(
            depositsRef,
            async (snapshot) => {

                const container =
                    document.getElementById(
                        "depositList"
                    );

                if (!container) {

                    console.warn(
                        "depositList element not found."
                    );

                    return;

                }


                const deposits = [];


                // ==================================
                // READ DEPOSITS
                // ==================================

                if (snapshot.exists()) {

                    snapshot.forEach((child) => {

                        const data =
                            child.val() || {};

                        deposits.push({

                            id:
                                child.key,

                            ...data

                        });

                    });

                }


                // ==================================
                // SORT NEWEST FIRST
                // ==================================

                deposits.sort(
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


                // ==================================
                // UPDATE COUNTERS
                // ==================================

                let pendingCount = 0;
                let approvedCount = 0;
                let rejectedCount = 0;


                deposits.forEach((deposit) => {

                    const status =
                        normalizeStatus(
                            deposit.status
                        );


                    if (
                        status === "pending"
                    ) {

                        pendingCount++;

                    } else if (
                        status === "approved"
                    ) {

                        approvedCount++;

                    } else if (
                        status === "rejected"
                    ) {

                        rejectedCount++;

                    }

                });


                updateText(
                    "depositTotalCount",
                    deposits.length
                );

                updateText(
                    "depositPendingCount",
                    pendingCount
                );

                updateText(
                    "depositApprovedCount",
                    approvedCount
                );

                updateText(
                    "depositRejectedCount",
                    rejectedCount
                );


                // ==================================
                // EMPTY STATE
                // ==================================

                const emptyElement =
                    document.getElementById(
                        "emptyDeposit"
                    );


                if (
                    deposits.length === 0
                ) {

                    container.innerHTML = "";


                    if (emptyElement) {

                        emptyElement.style.display =
                            "block";

                    }

                    return;

                }


                if (emptyElement) {

                    emptyElement.style.display =
                        "none";

                }


                // ==================================
                // RENDER DEPOSITS
                // ==================================

                container.innerHTML =
                    deposits
                        .map(
                            renderDepositCard
                        )
                        .join("");


                // ==================================
                // ACTIVATE BUTTONS
                // ==================================

                activateDepositButtons();

            }
        );


    } catch (error) {

        console.error(
            "LOAD DEPOSITS ERROR:",
            error
        );

    }

}


// ==========================================
// RENDER ONE DEPOSIT
// ==========================================

function renderDepositCard(
    deposit
) {

    const status =
        normalizeStatus(
            deposit.status
        );


    const amount =
        numberValue(
            deposit.amount
        );


    const paymentMethod =
        deposit.paymentMethod ||
        deposit.method ||
        "N/A";


    const senderPhone =
        deposit.senderPhone ||
        deposit.phone ||
        "N/A";


    const transactionId =
        deposit.transactionId ||
        "N/A";


    const paymentDate =
        deposit.paymentDate ||
        "N/A";


    const uid =
        deposit.uid ||
        "N/A";


    const createdAt =
        numberValue(
            deposit.createdAt
        );


    let createdDate =
        "N/A";


    if (createdAt > 0) {

        createdDate =
            new Date(
                createdAt
            ).toLocaleString(
                "en-GB"
            );

    }


    let statusClass =
        "pending";


    let statusText =
        "Pending";


    if (
        status === "approved"
    ) {

        statusClass =
            "approved";

        statusText =
            "Approved";

    } else if (
        status === "rejected"
    ) {

        statusClass =
            "rejected";

        statusText =
            "Rejected";

    } else if (
        status === "processing"
    ) {

        statusClass =
            "processing";

        statusText =
            "Processing";

    } else if (
        status === "processing_error"
    ) {

        statusClass =
            "rejected";

        statusText =
            "Processing Error";

    }


    // ==================================
    // ACTION BUTTONS
    // ==================================

    let actionButtons = "";


    if (
        status === "pending"
    ) {

        actionButtons = `

            <div class="request-actions">

                <button
                    type="button"
                    class="approveBtn"
                    data-id="${escapeHTML(
                        deposit.id
                    )}"
                >
                    <i class="fas fa-check"></i>
                    Approve
                </button>

                <button
                    type="button"
                    class="rejectBtn"
                    data-id="${escapeHTML(
                        deposit.id
                    )}"
                >
                    <i class="fas fa-times"></i>
                    Reject
                </button>

            </div>

        `;

    }


    return `

        <div
            class="request-card deposit-card"
            data-id="${escapeHTML(
                deposit.id
            )}"
        >

            <div class="request-card-header">

                <div>

                    <h3>
                        Deposit Request
                    </h3>

                    <small>
                        ID:
                        ${escapeHTML(
                            deposit.id
                        )}
                    </small>

                </div>


                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHTML(
                        statusText
                    )}
                </span>

            </div>


            <div class="request-card-body">

                <div class="request-info">

                    <span>
                        <strong>Amount</strong>
                        ${formatMoney(amount)}
                    </span>


                    <span>
                        <strong>Payment Method</strong>
                        ${escapeHTML(
                            paymentMethod
                        )}
                    </span>


                    <span>
                        <strong>Sender Phone</strong>
                        ${escapeHTML(
                            senderPhone
                        )}
                    </span>


                    <span>
                        <strong>Transaction ID</strong>
                        ${escapeHTML(
                            transactionId
                        )}
                    </span>


                    <span>
                        <strong>Payment Date</strong>
                        ${escapeHTML(
                            paymentDate
                        )}
                    </span>


                    <span>
                        <strong>User UID</strong>
                        ${escapeHTML(
                            uid
                        )}
                    </span>


                    <span>
                        <strong>Created At</strong>
                        ${escapeHTML(
                            createdDate
                        )}
                    </span>

                </div>


                ${
                    deposit.proofUrl
                        ? `
                            <div class="proof-section">

                                <a
                                    href="${escapeHTML(
                                        deposit.proofUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="proof-link"
                                >
                                    <i class="fas fa-image"></i>
                                    View Payment Proof
                                </a>

                            </div>
                        `
                        : ""
                }


                ${actionButtons}

            </div>

        </div>

    `;

}


// ==========================================
// ACTIVATE DEPOSIT BUTTONS
// ==========================================

function activateDepositButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approveBtn"
        );


    const rejectButtons =
        document.querySelectorAll(
            ".rejectBtn"
        );


    // ==================================
    // APPROVE
    // ==================================

    approveButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        console.error(
                            "Deposit ID missing."
                        );

                        return;

                    }


                    // Prevent double click
                    button.disabled = true;


                    try {

                        if (
                            typeof window.approveDeposit ===
                            "function"
                        ) {

                            await window.approveDeposit(
                                id
                            );

                        }

                    } catch (error) {

                        console.error(
                            "APPROVE DEPOSIT ERROR:",
                            error
                        );

                    } finally {

                        button.disabled = false;

                    }

                }
            );

        }
    );


    // ==================================
    // REJECT
    // ==================================

    rejectButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        console.error(
                            "Deposit ID missing."
                        );

                        return;

                    }


                    button.disabled = true;


                    try {

                        if (
                            typeof window.rejectDeposit ===
                            "function"
                        ) {

                            await window.rejectDeposit(
                                id
                            );

                        }

                    } catch (error) {

                        console.error(
                            "REJECT DEPOSIT ERROR:",
                            error
                        );

                    } finally {

                        button.disabled = false;

                    }

                }
            );

        }
    );

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.loadDeposits =
    loadDeposits;

window.renderDepositCard =
    renderDepositCard;

window.activateDepositButtons =
    activateDepositButtons;


// ==========================================
// PART 3 READY
// ==========================================

console.log(
    "ADMIN.JS PART 3 READY"
);

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
// PART 5 — WITHDRAW REQUESTS
// Money Vault Admin Panel
// ======================================

async function loadWithdraws() {
    try {
        await window.waitForAdmin();

        const withdrawRef = ref(db, "withdrawRequests");

        onValue(withdrawRef, async (snapshot) => {

            const data = snapshot.val() || {};

            const withdraws = Object.entries(data).map(([id, item]) => ({
                id,
                ...item
            }));

            // Sort newest first
            withdraws.sort((a, b) => {
                const dateA = Number(a.createdAt) || 0;
                const dateB = Number(b.createdAt) || 0;
                return dateB - dateA;
            });

            // ==============================
            // COUNTERS
            // ==============================

            const total = withdraws.length;

            const pending = withdraws.filter(
                item => normalizeStatus(item.status) === "pending"
            ).length;

            const approved = withdraws.filter(
                item => normalizeStatus(item.status) === "approved"
            ).length;

            const rejected = withdraws.filter(
                item => normalizeStatus(item.status) === "rejected"
            ).length;

            updateText("withdrawTotalCount", total);
            updateText("withdrawPendingCount", pending);
            updateText("withdrawApprovedCount", approved);
            updateText("withdrawRejectedCount", rejected);

            // ==============================
            // CONTAINER
            // ==============================

            const container = document.getElementById("withdrawList");
            const emptyState = document.getElementById("emptyWithdraw");

            if (!container) {
                console.error("withdrawList element not found.");
                return;
            }

            container.innerHTML = "";

            // ==============================
            // EMPTY STATE
            // ==============================

            if (withdraws.length === 0) {

                if (emptyState) {
                    emptyState.style.display = "block";
                }

                return;
            }

            if (emptyState) {
                emptyState.style.display = "none";
            }

            // ==============================
            // RENDER WITHDRAWS
            // ==============================

            withdraws.forEach(withdraw => {

                container.insertAdjacentHTML(
                    "beforeend",
                    renderWithdrawCard(withdraw)
                );

            });

            // ==============================
            // ACTIVATE BUTTONS
            // ==============================

            activateWithdrawButtons();

        }, error => {

            console.error(
                "Error loading withdraw requests:",
                error
            );

            const container = document.getElementById("withdrawList");

            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        Failed to load withdraw requests.
                    </div>
                `;
            }

        });

    } catch (error) {

        console.error(
            "loadWithdraws error:",
            error
        );

    }
}


// ======================================
// RENDER WITHDRAW CARD
// ======================================

function renderWithdrawCard(withdraw) {

    const id = escapeHTML(withdraw.id);

    const uid = escapeHTML(withdraw.uid || "N/A");

    const amount = numberValue(withdraw.amount);

    const status = normalizeStatus(withdraw.status);

    const paymentMethod =
        escapeHTML(
            withdraw.paymentMethod ||
            withdraw.method ||
            "N/A"
        );

    const phone =
        escapeHTML(
            withdraw.phone ||
            withdraw.receiverPhone ||
            withdraw.withdrawPhone ||
            "N/A"
        );

    const accountName =
        escapeHTML(
            withdraw.accountName ||
            withdraw.name ||
            "N/A"
        );

    const createdAt =
        withdraw.createdAt
            ? new Date(
                Number(withdraw.createdAt)
              ).toLocaleString()
            : "N/A";

    const approvedAt =
        withdraw.approvedAt
            ? new Date(
                Number(withdraw.approvedAt)
              ).toLocaleString()
            : "";

    const rejectedAt =
        withdraw.rejectedAt
            ? new Date(
                Number(withdraw.rejectedAt)
              ).toLocaleString()
            : "";

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
    // ACTION BUTTONS
    // ==============================

    let actions = "";

    if (status === "pending") {

        actions = `
            <div class="withdraw-actions">

                <button
                    type="button"
                    class="approveWithdrawBtn"
                    data-id="${id}">
                    Approve
                </button>

                <button
                    type="button"
                    class="rejectWithdrawBtn"
                    data-id="${id}">
                    Reject
                </button>

            </div>
        `;
    }

    return `
        <div
            class="withdraw-card"
            data-id="${id}"
            data-status="${status}">

            <div class="withdraw-card-header">

                <div>
                    <h3>
                        Withdraw Request
                    </h3>

                    <small>
                        ID: ${id}
                    </small>
                </div>

                <span class="status-badge status-${status}">
                    ${statusText}
                </span>

            </div>


            <div class="withdraw-amount">

                <span>Amount</span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <div class="withdraw-info">

                <div class="info-row">
                    <span>User UID</span>
                    <strong>${uid}</strong>
                </div>

                <div class="info-row">
                    <span>Payment Method</span>
                    <strong>${paymentMethod}</strong>
                </div>

                <div class="info-row">
                    <span>Phone</span>
                    <strong>${phone}</strong>
                </div>

                <div class="info-row">
                    <span>Account Name</span>
                    <strong>${accountName}</strong>
                </div>

                <div class="info-row">
                    <span>Created At</span>
                    <strong>${createdAt}</strong>
                </div>

                ${
                    approvedAt
                        ? `
                            <div class="info-row">
                                <span>Approved At</span>
                                <strong>${approvedAt}</strong>
                            </div>
                          `
                        : ""
                }

                ${
                    rejectedAt
                        ? `
                            <div class="info-row">
                                <span>Rejected At</span>
                                <strong>${rejectedAt}</strong>
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
// ACTIVATE WITHDRAW BUTTONS
// ======================================

function activateWithdrawButtons() {

    // ==============================
    // APPROVE BUTTONS
    // ==============================

    document
        .querySelectorAll(".approveWithdrawBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {
                        alert(
                            "Withdraw request ID is missing."
                        );
                        return;
                    }

                    if (
                        typeof window.approveWithdraw ===
                        "function"
                    ) {

                        await window.approveWithdraw(id);

                    } else {

                        console.error(
                            "approveWithdraw() is not available yet."
                        );

                    }

                }
            );

        });


    // ==============================
    // REJECT BUTTONS
    // ==============================

    document
        .querySelectorAll(".rejectWithdrawBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {
                        alert(
                            "Withdraw request ID is missing."
                        );
                        return;
                    }

                    if (
                        typeof window.rejectWithdraw ===
                        "function"
                    ) {

                        await window.rejectWithdraw(id);

                    } else {

                        console.error(
                            "rejectWithdraw() is not available yet."
                        );

                    }

                }
            );

        });
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadWithdraws =
    loadWithdraws;

window.renderWithdrawCard =
    renderWithdrawCard;

window.activateWithdrawButtons =
    activateWithdrawButtons;

// ======================================
// PART 6 — APPROVE / REJECT WITHDRAW
// Money Vault Admin Panel
// ======================================


// ======================================
// APPROVE WITHDRAW
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

        if (!confirmed) {
            return;
        }


        // ==================================
        // GET WITHDRAW REQUEST
        // ==================================

        const requestRef =
            ref(db, `withdrawRequests/${id}`);

        const requestSnapshot =
            await get(requestRef);

        if (!requestSnapshot.exists()) {
            alert("Withdraw request not found.");
            return;
        }

        const request =
            requestSnapshot.val();


        // ==================================
        // CHECK STATUS
        // ==================================

        const currentStatus =
            normalizeStatus(request.status);

        if (currentStatus !== "pending") {

            alert(
                `This request is already ${currentStatus}.`
            );

            return;
        }


        // ==================================
        // VALIDATE USER
        // ==================================

        const uid =
            request.uid;

        if (!uid) {

            alert(
                "This withdraw request has no user UID."
            );

            return;
        }


        // ==================================
        // VALIDATE AMOUNT
        // ==================================

        const amount =
            numberValue(request.amount);

        if (!Number.isFinite(amount) || amount <= 0) {

            alert(
                "Invalid withdrawal amount."
            );

            return;
        }


        // ==================================
        // LOCK REQUEST
        // pending → processing
        // ==================================

        const lockResult =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }

                    const status =
                        normalizeStatus(
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
                            currentAdmin?.uid || auth.currentUser?.uid || null
                    };
                }
            );


        // ==================================
        // CHECK LOCK RESULT
        // ==================================

        if (!lockResult.committed) {

            alert(
                "This withdrawal is already being processed."
            );

            return;
        }


        // ==================================
        // GET USER
        // ==================================

        const userRef =
            ref(db, `users/${uid}`);

        const userSnapshot =
            await get(userRef);

        if (!userSnapshot.exists()) {

            await update(requestRef, {
                status: "pending",
                processingAt: null,
                processingBy: null
            });

            alert(
                "User account not found."
            );

            return;
        }

        const user =
            userSnapshot.val();


        // ==================================
        // CURRENT BALANCE
        // ==================================

        const currentBalance =
            numberValue(user.balance);


        // ==================================
        // CHECK BALANCE
        // ==================================

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


        // ==================================
        // NEW BALANCE
        // ==================================

        const newBalance =
            currentBalance - amount;


        // ==================================
        // TOTAL WITHDRAWALS
        // ==================================

        const oldTotalWithdrawals =
            numberValue(
                user.totalWithdrawals
            );

        const newTotalWithdrawals =
            oldTotalWithdrawals + amount;


        // ==================================
        // TOTAL TRANSACTIONS
        // ==================================

        const oldTotalTransactions =
            numberValue(
                user.totalTransactions
            );

        const newTotalTransactions =
            oldTotalTransactions + 1;


        // ==================================
        // UPDATE USER BALANCE
        // ==================================

        await update(userRef, {

            balance:
                newBalance,

            totalWithdrawals:
                newTotalWithdrawals,

            totalTransactions:
                newTotalTransactions

        });


        // ==================================
        // CREATE TRANSACTION
        // ==================================

        const transactionRef =
            push(ref(db, "transactions"));

        const transactionKey =
            transactionRef.key;

        const now =
            Date.now();

        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "withdraw",

                amount:
                    amount,

                status:
                    "approved",

                paymentMethod:
                    request.paymentMethod ||
                    request.method ||
                    null,

                phone:
                    request.phone ||
                    request.receiverPhone ||
                    request.withdrawPhone ||
                    null,

                withdrawRequestId:
                    id,

                createdAt:
                    now,

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null

            }
        );


        // ==================================
        // FINALIZE REQUEST
        // ==================================

        await update(requestRef, {

            status:
                "approved",

            approvedAt:
                now,

            approvedBy:
                currentAdmin?.uid ||
                auth.currentUser?.uid ||
                null,

            transactionKey:
                transactionKey,

            processingAt:
                null,

            processingBy:
                null

        });


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Withdrawal approved successfully."
        );


        // Refresh dashboard if available
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


        // Try to mark request as processing error
        try {

            if (id) {

                await update(
                    ref(db, `withdrawRequests/${id}`),
                    {
                        status:
                            "processing_error",

                        processingError:
                            error?.message ||
                            String(error),

                        errorAt:
                            Date.now()
                    }
                );

            }

        } catch (updateError) {

            console.error(
                "Could not update withdraw error status:",
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

            alert(
                "Withdraw request ID is missing."
            );

            return;
        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed =
            confirm(
                "Are you sure you want to reject this withdrawal?"
            );

        if (!confirmed) {
            return;
        }


        // ==================================
        // REQUEST REF
        // ==================================

        const requestRef =
            ref(db, `withdrawRequests/${id}`);


        // ==================================
        // LOCK / REJECT TRANSACTION
        // ==================================

        const result =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }

                    const status =
                        normalizeStatus(
                            currentData.status
                        );

                    if (status !== "pending") {
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
                            auth.currentUser?.uid ||
                            null

                    };

                }
            );


        // ==================================
        // CHECK RESULT
        // ==================================

        if (!result.committed) {

            alert(
                "This request is no longer pending."
            );

            return;
        }


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Withdrawal rejected successfully."
        );


        // Refresh dashboard
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
