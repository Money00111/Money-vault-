// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 1 — ADMIN AUTH + NAVIGATION
// CURRENCY: RWF / FRW
// ==========================================

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
    set,
    push,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

/* =========================================================
   GLOBAL TOAST NOTIFICATION
========================================================= */

function showToast(message, type = "info") {

    const container =
        document.getElementById("toastContainer");

    /* -----------------------------------------
       FALLBACK
    ----------------------------------------- */

    if (!container) {
        console.log(`[${type}] ${message}`);
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${String(type).toLowerCase()}`;

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${
                type === "success"
                    ? "fa-solid fa-circle-check"
                    : type === "error"
                        ? "fa-solid fa-circle-xmark"
                        : type === "warning"
                            ? "fa-solid fa-triangle-exclamation"
                            : "fa-solid fa-circle-info"
            }"></i>
        </div>

        <div class="toast-message">
            ${escapeHTML(message)}
        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Close"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const closeToast = () => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    };

    toast
        .querySelector(".toast-close")
        ?.addEventListener(
            "click",
            closeToast
        );

    setTimeout(
        closeToast,
        4000
    );
}


/* -----------------------------------------
   GLOBAL EXPORT
----------------------------------------- */

window.showToast = showToast;

// ==========================================
// GLOBAL ADMIN STATE
// ==========================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise = new Promise((resolve) => {
    resolveAdminReady = resolve;
});


// ==========================================
// LISTENER STORAGE
// Prevent duplicate Firebase listeners
// ==========================================

const listeners = {};


// Make available to other parts
window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    readyPromise: adminReadyPromise

};


window.waitForAdmin = function () {
    return adminReadyPromise;
};


// ==========================================
// DOM ELEMENTS
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
// OPEN PAGE
// ==========================================

function openPage(pageName) {

    if (!pageName) return;


    // Hide every section
    sections.forEach((section) => {

        section.style.display = "none";

        section.classList.remove("active");

    });


    // Remove active menu
    menuLinks.forEach((link) => {

        link.classList.remove("active");

    });


    // Find requested section
    const selectedSection =
        document.getElementById(
            `${pageName}Section`
        );


    if (selectedSection) {

        selectedSection.style.display = "block";

        selectedSection.classList.add("active");

    } else {

        console.warn(
            "ADMIN SECTION NOT FOUND:",
            `${pageName}Section`
        );

    }


    // Find menu link
    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    // Page title
    if (pageTitle) {

        let title =
            activeLink?.getAttribute("data-title");


        if (!title) {

            const titleMap = {

                dashboard: "Dashboard",

                deposits: "Deposits",

                withdraws: "Withdraws",

                vipRequests: "VIP Requests",

                vipBuyers: "VIP Buyers",

                bonusRequests: "Bonus Requests",

                users: "Users",

                transactions: "Transactions",

                quickActions: "Quick Actions",

                settings: "Settings"

            };


            title =
                titleMap[pageName] ||
                pageName;

        }


        pageTitle.textContent = title;

    }


    // Close mobile sidebar
    if (sidebar) {

        sidebar.classList.remove("active");

    }


    console.log(
        "ADMIN PAGE:",
        pageName
    );
}


// Make globally available
window.openPage = openPage;


// ==========================================
// MENU LINKS
// ==========================================

menuLinks.forEach((link) => {

    link.addEventListener("click", (event) => {

        event.preventDefault();

        const page =
            link.getAttribute("data-page");

        if (page) {

            openPage(page);

        }

    });

});


// ==========================================
// MOBILE MENU
// ==========================================

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        if (!sidebar) return;

        sidebar.classList.toggle("active");

    });

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) return;


                await signOut(auth);


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                alert(
                    "Logout failed:\n" +
                    (error.message ||
                        "Unknown error")
                );

            }

        }
    );

}


// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        try {

            showLoadingScreen();


            // ----------------------------------
            // USER NOT LOGGED IN
            // ----------------------------------

            if (!user) {

                console.warn(
                    "No authenticated user."
                );


                window.location.href =
                    "login.html";

                return;

            }


            console.log(
                "Checking administrator:",
                user.uid
            );


            // ----------------------------------
            // CHECK ADMIN RECORD
            // ----------------------------------

            const adminRef =
                ref(
                    db,
                    `admins/${user.uid}`
                );


            const adminSnapshot =
                await get(adminRef);


            // ----------------------------------
            // NOT ADMIN
            // ----------------------------------

            if (!adminSnapshot.exists()) {

                console.warn(
                    "ACCESS DENIED:",
                    user.uid
                );


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

                email:
                    user.email || "",

                ...adminData

            };


            adminReady = true;


            resolveAdminReady(
                currentAdmin
            );


            // ----------------------------------
            // ADMIN NAME
            // ----------------------------------

            if (adminName) {

                adminName.textContent =

                    currentAdmin.name ||

                    currentAdmin.displayName ||

                    currentAdmin.username ||

                    "Administrator";

            }


            // ----------------------------------
            // ADMIN EMAIL
            // ----------------------------------

            if (adminEmail) {

                adminEmail.textContent =
                    user.email || "";

            }


            // ----------------------------------
            // SHOW ADMIN PANEL
            // ----------------------------------

            hideLoadingScreen();


            console.log(
                "ADMIN AUTHENTICATED:",
                currentAdmin
            );


            // ----------------------------------
            // INITIALIZE AVAILABLE MODULES
            // ----------------------------------

            if (
                typeof window.loadDashboard ===
                "function"
            ) {

                window.loadDashboard();

            }


            if (
                typeof window.loadDeposits ===
                "function"
            ) {

                window.loadDeposits();

            }


            if (
                typeof window.loadWithdraws ===
                "function"
            ) {

                window.loadWithdraws();

            }


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
                typeof window.loadBonusRequests ===
                "function"
            ) {

                window.loadBonusRequests();

            }


            if (
                typeof window.loadUsers ===
                "function"
            ) {

                window.loadUsers();

            }


            if (
                typeof window.loadTransactions ===
                "function"
            ) {

                window.loadTransactions();

            }


        } catch (error) {

            console.error(
                "ADMIN AUTH ERROR:",
                error
            );


            hideLoadingScreen();


            alert(
                "Erreur de connexion administrateur:\n" +
                (error.message ||
                    "Unknown error")
            );

        }

    }
);


// ==========================================
// DEFAULT PAGE
// ==========================================

openPage("dashboard");


console.log(
    "MONEY VAULT ADMIN.JS — PART 1 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 2 — DASHBOARD
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// COMMON HELPERS
// ==========================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "";

}


// ==========================================
// NUMBER HELPER
// ==========================================

function numberValue(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


// ==========================================
// STATUS HELPER
// ==========================================

function normalizeStatus(status) {

    return String(
        status ?? "pending"
    )
        .trim()
        .toLowerCase();

}


// ==========================================
// MONEY FORMAT
// FRW / RWF
// ==========================================

function formatMoney(amount) {

    const value =
        numberValue(amount);

    return value.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ) + " RWF";

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(timestamp) {

    const value =
        numberValue(timestamp);

    if (!value) {

        return "N/A";

    }

    try {

        return new Date(value)
            .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

    } catch (error) {

        return "N/A";

    }

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ==========================================
// DASHBOARD CACHE
// ==========================================

let dashboardUsers = {};
let dashboardDeposits = {};
let dashboardWithdraws = {};
let dashboardTransactions = {};


// ==========================================
// DASHBOARD INITIALIZATION
// ==========================================

async function loadDashboard() {

    try {

        await window.waitForAdmin();


        console.log(
            "Loading Money Vault dashboard..."
        );


        // --------------------------------------
        // USERS LISTENER
        // --------------------------------------

        if (!listeners.dashboardUsers) {

            listeners.dashboardUsers =
                onValue(
                    ref(db, "users"),
                    (snapshot) => {

                        dashboardUsers =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard users error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // DEPOSITS LISTENER
        // --------------------------------------

        if (!listeners.dashboardDeposits) {

            listeners.dashboardDeposits =
                onValue(
                    ref(
                        db,
                        "depositRequests"
                    ),
                    (snapshot) => {

                        dashboardDeposits =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard deposits error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // WITHDRAWS LISTENER
        // --------------------------------------

        if (!listeners.dashboardWithdraws) {

            listeners.dashboardWithdraws =
                onValue(
                    ref(
                        db,
                        "withdrawRequests"
                    ),
                    (snapshot) => {

                        dashboardWithdraws =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard withdraws error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // TRANSACTIONS LISTENER
        // --------------------------------------

        if (!listeners.dashboardTransactions) {

            listeners.dashboardTransactions =
                onValue(
                    ref(
                        db,
                        "transactions"
                    ),
                    (snapshot) => {

                        dashboardTransactions =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard transactions error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // FIRST RENDER
        // --------------------------------------

        renderDashboard();


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

    }

}


// ==========================================
// RENDER DASHBOARD
// ==========================================

function renderDashboard() {


    // ======================================
    // USERS
    // ======================================

    const users =
        dashboardUsers || {};

    const totalUsers =
        Object.keys(users).length;


    let systemBalance = 0;


    Object.values(users)
        .forEach((user) => {

            if (!user) return;

            systemBalance +=
                numberValue(
                    user.balance
                );

        });


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


    // ======================================
    // DEPOSITS
    // ======================================

    const deposits =
        dashboardDeposits || {};


    let pendingDeposits = 0;

    let approvedDeposits = 0;

    let rejectedDeposits = 0;

    let totalApprovedDeposits = 0;


    Object.values(deposits)
        .forEach((deposit) => {

            if (!deposit) return;


            const status =
                normalizeStatus(
                    deposit.status
                );


            const amount =
                numberValue(
                    deposit.amount
                );


            if (
                status ===
                "pending"
            ) {

                pendingDeposits++;

            }


            else if (
                status ===
                "approved"
            ) {

                approvedDeposits++;

                totalApprovedDeposits +=
                    amount;

            }


            else if (
                status ===
                "rejected"
            ) {

                rejectedDeposits++;

            }

        });


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


    // ======================================
    // WITHDRAWS
    // ======================================

    const withdraws =
        dashboardWithdraws || {};


    let pendingWithdraws = 0;

    let approvedWithdraws = 0;

    let rejectedWithdraws = 0;

    let totalApprovedWithdraws = 0;


    Object.values(withdraws)
        .forEach((withdraw) => {

            if (!withdraw) return;


            const status =
                normalizeStatus(
                    withdraw.status
                );


            const amount =
                numberValue(
                    withdraw.amount
                );


            if (
                status ===
                "pending"
            ) {

                pendingWithdraws++;

            }


            else if (
                status ===
                "approved"
            ) {

                approvedWithdraws++;

                totalApprovedWithdraws +=
                    amount;

            }


            else if (
                status ===
                "rejected"
            ) {

                rejectedWithdraws++;

            }

        });


    updateText(
        "dashboardTotalWithdraws",
        formatMoney(
            totalApprovedWithdraws
        )
    );


    // ======================================
    // RECENT TRANSACTIONS
    // ======================================

    const transactions =
        Object.entries(
            dashboardTransactions || {}
        )
        .map(
            ([id, transaction]) => ({
                id,
                ...(transaction || {})
            })
        );


    transactions.sort(
        (a, b) => {

            const dateA =
                numberValue(
                    a.createdAt ??
                    a.approvedAt ??
                    a.timestamp
                );

            const dateB =
                numberValue(
                    b.createdAt ??
                    b.approvedAt ??
                    b.timestamp
                );

            return dateB - dateA;

        }
    );


    renderRecentTransactions(
        transactions.slice(0, 10)
    );


    console.log(
        "Dashboard rendered:",
        {
            totalUsers,
            totalApprovedDeposits,
            totalApprovedWithdraws
        }
    );

}


// ==========================================
// RECENT ACTIVITY
// ==========================================

function renderRecentTransactions(
    transactions = []
) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!container) return;


    // --------------------------------------
    // EMPTY
    // --------------------------------------

    if (
        !transactions ||
        transactions.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>

                <p>No Recent Activity</p>

            </div>

        `;

        return;

    }


    // --------------------------------------
    // RENDER
    // --------------------------------------

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


                const date =
                    transaction.createdAt ??
                    transaction.approvedAt ??
                    transaction.timestamp;


                // ------------------------------
                // TITLE
                // ------------------------------

                let title =
                    "Transaction";


                let icon =
                    "fa-exchange-alt";


                if (
                    type ===
                    "deposit"
                ) {

                    title =
                        "Deposit";

                    icon =
                        "fa-arrow-down";

                }


                else if (
                    type ===
                    "withdraw"
                ) {

                    title =
                        "Withdraw";

                    icon =
                        "fa-arrow-up";

                }


                else if (
                    type ===
                    "vip"
                ) {

                    title =
                        "VIP Purchase";

                    icon =
                        "fa-crown";

                }


                else if (
                    type ===
                    "profit"
                ) {

                    title =
                        "VIP Profit";

                    icon =
                        "fa-chart-line";

                }


                else if (
                    type ===
                    "bonus"
                ) {

                    title =
                        "Bonus";

                    icon =
                        "fa-gift";

                }


                else if (
                    type ===
                    "referral"
                ) {

                    title =
                        "Referral Bonus";

                    icon =
                        "fa-users";

                }


                // ------------------------------
                // STATUS
                // ------------------------------

                let statusText =
                    "Pending";


                if (
                    status ===
                    "approved"
                ) {

                    statusText =
                        "Approved";

                }


                else if (
                    status ===
                    "rejected"
                ) {

                    statusText =
                        "Rejected";

                }


                else if (
                    status ===
                    "processing"
                ) {

                    statusText =
                        "Processing";

                }


                else if (
                    status ===
                    "processing_error"
                ) {

                    statusText =
                        "Processing Error";

                }


                // ------------------------------
                // AMOUNT SIGN
                // ------------------------------

                let amountClass =
                    "";


                let amountPrefix =
                    "";


                if (
                    type ===
                    "deposit" ||
                    type ===
                    "profit" ||
                    type ===
                    "bonus" ||
                    type ===
                    "referral"
                ) {

                    amountPrefix =
                        "+";

                    amountClass =
                        "positive";

                }


                else if (
                    type ===
                    "withdraw" ||
                    type ===
                    "vip"
                ) {

                    amountPrefix =
                        "-";

                    amountClass =
                        "negative";

                }


                return `

                    <div
                        class="activity-item"
                        data-transaction-id="${escapeHTML(transaction.id)}"
                    >

                        <div class="activity-icon">

                            <i
                                class="fas ${icon}"
                            ></i>

                        </div>


                        <div class="activity-info">

                            <strong>
                                ${escapeHTML(title)}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    formatDate(date)
                                )}
                            </small>

                            <small>
                                Status:
                                ${escapeHTML(
                                    statusText
                                )}
                            </small>

                        </div>


                        <div
                            class="activity-amount ${amountClass}"
                        >

                            ${amountPrefix}
                            ${formatMoney(amount)}

                        </div>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// REFRESH DASHBOARD
// ==========================================

const refreshDashboard =
    document.getElementById(
        "refreshDashboard"
    );


if (refreshDashboard) {

    refreshDashboard.addEventListener(
        "click",
        async () => {

            try {

                refreshDashboard.disabled =
                    true;


                refreshDashboard.classList
                    .add("loading");


                // Read fresh data once.
                // Existing listeners remain untouched.

                const [
                    usersSnapshot,
                    depositsSnapshot,
                    withdrawsSnapshot,
                    transactionsSnapshot
                ] = await Promise.all([

                    get(
                        ref(
                            db,
                            "users"
                        )
                    ),

                    get(
                        ref(
                            db,
                            "depositRequests"
                        )
                    ),

                    get(
                        ref(
                            db,
                            "withdrawRequests"
                        )
                    ),

                    get(
                        ref(
                            db,
                            "transactions"
                        )
                    )

                ]);


                dashboardUsers =
                    usersSnapshot.exists()
                        ? usersSnapshot.val() || {}
                        : {};


                dashboardDeposits =
                    depositsSnapshot.exists()
                        ? depositsSnapshot.val() || {}
                        : {};


                dashboardWithdraws =
                    withdrawSnapshotSafe(
                        withdrawsSnapshot
                    );


                dashboardTransactions =
                    transactionsSnapshot.exists()
                        ? transactionsSnapshot.val() || {}
                        : {};


                renderDashboard();


            } catch (error) {

                console.error(
                    "REFRESH DASHBOARD ERROR:",
                    error
                );


                alert(
                    "Dashboard refresh failed:\n" +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );

            } finally {

                refreshDashboard.disabled =
                    false;

                refreshDashboard.classList
                    .remove("loading");

            }

        }
    );

}


// ==========================================
// SAFE WITHDRAW SNAPSHOT
// ==========================================

function withdrawSnapshotSafe(
    snapshot
) {

    if (!snapshot) {

        return {};

    }


    return snapshot.exists()
        ? snapshot.val() || {}
        : {};

}


// ==========================================
// OPTIONAL QUICK REFRESH BUTTON
// ==========================================

const refreshDashboardQuick =
    document.getElementById(
        "refreshDashboardQuick"
    );


if (refreshDashboardQuick) {

    refreshDashboardQuick.addEventListener(
        "click",
        async () => {

            if (
                typeof refreshDashboard
                !== "undefined" &&
                refreshDashboard
            ) {

                refreshDashboard.click();

            }

        }
    );

}


// ==========================================
// DASHBOARD QUICK NAVIGATION
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
// GLOBAL EXPORTS
// ==========================================

window.loadDashboard =
    loadDashboard;


window.renderDashboard =
    renderDashboard;


window.renderRecentTransactions =
    renderRecentTransactions;


window.updateText =
    updateText;


window.numberValue =
    numberValue;


window.normalizeStatus =
    normalizeStatus;


window.formatMoney =
    formatMoney;


window.formatDate =
    formatDate;


window.escapeHTML =
    escapeHTML;


console.log(
    "MONEY VAULT ADMIN.JS — PART 2 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 3 — DEPOSIT REQUESTS
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// DEPOSIT DATA
// ==========================================

let allDepositRequests = [];
let depositUsers = {};


// ==========================================
// LOAD DEPOSITS
// ==========================================

async function loadDeposits() {

    try {

        await window.waitForAdmin();

        console.log(
            "Loading deposit requests..."
        );


        // --------------------------------------
        // USERS LISTENER
        // --------------------------------------

        if (!listeners.depositUsers) {

            listeners.depositUsers =
                onValue(
                    ref(db, "users"),
                    (snapshot) => {

                        depositUsers =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDepositRequests();

                    },
                    (error) => {

                        console.error(
                            "Deposit users listener error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // DEPOSIT LISTENER
        // --------------------------------------

        if (!listeners.depositRequests) {

            listeners.depositRequests =
                onValue(
                    ref(
                        db,
                        "depositRequests"
                    ),
                    (snapshot) => {

                        const data =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        allDepositRequests =
                            Object.entries(data)
                                .map(
                                    ([id, request]) => ({

                                        id,

                                        ...(request || {})

                                    })
                                );


                        // Newest first
                        allDepositRequests.sort(
                            (a, b) => {

                                const dateA =
                                    numberValue(
                                        a.createdAt ??
                                        a.timestamp
                                    );

                                const dateB =
                                    numberValue(
                                        b.createdAt ??
                                        b.timestamp
                                    );

                                return dateB - dateA;

                            }
                        );


                        renderDepositRequests();

                    },
                    (error) => {

                        console.error(
                            "Deposit requests listener error:",
                            error
                        );


                        const container =
                            document.getElementById(
                                "depositList"
                            );


                        if (container) {

                            container.innerHTML = `

                                <div class="error-message">

                                    <i class="fas fa-triangle-exclamation"></i>

                                    <p>
                                        Failed to load deposit requests.
                                    </p>

                                </div>

                            `;

                        }

                    }
                );

        }


        // --------------------------------------
        // INITIAL RENDER
        // --------------------------------------

        renderDepositRequests();


    } catch (error) {

        console.error(
            "loadDeposits error:",
            error
        );

    }

}


// ==========================================
// RENDER DEPOSIT REQUESTS
// ==========================================

function renderDepositRequests() {

    const container =
        document.getElementById(
            "depositList"
        );


    const emptyState =
        document.getElementById(
            "emptyDeposit"
        );


    if (!container) {

        console.warn(
            "depositList element not found."
        );

        return;

    }


    const searchInput =
        document.getElementById(
            "depositSearch"
        );


    const filterSelect =
        document.getElementById(
            "depositFilter"
        );


    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const selectedFilter =
        normalizeStatus(
            filterSelect?.value || "all"
        );


    // ======================================
    // COUNTERS
    // ======================================

    let pendingCount = 0;

    let approvedCount = 0;

    let rejectedCount = 0;


    allDepositRequests.forEach(
        (request) => {

            const status =
                normalizeStatus(
                    request.status
                );


            if (
                status ===
                "pending"
            ) {

                pendingCount++;

            }


            else if (
                status ===
                "approved"
            ) {

                approvedCount++;

            }


            else if (
                status ===
                "rejected"
            ) {

                rejectedCount++;

            }

        }
    );


    updateText(
        "depositTotalCount",
        allDepositRequests.length
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


    // ======================================
    // SEARCH + FILTER
    // ======================================

    const filteredRequests =
        allDepositRequests.filter(
            (request) => {

                const status =
                    normalizeStatus(
                        request.status
                    );


                // Status filter
                if (
                    selectedFilter !==
                    "all" &&
                    status !==
                    selectedFilter
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                const uid =
                    String(
                        request.uid || ""
                    )
                    .toLowerCase();


                const user =
                    depositUsers[
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
                        ""
                    )
                    .toLowerCase();


                const transactionId =
                    String(
                        request.transactionId ||
                        request.txId ||
                        request.transactionID ||
                        ""
                    )
                    .toLowerCase();


                const paymentMethod =
                    String(
                        request.paymentMethod ||
                        request.method ||
                        ""
                    )
                    .toLowerCase();


                const requestId =
                    String(
                        request.id || ""
                    )
                    .toLowerCase();


                return (

                    uid.includes(search) ||

                    name.includes(search) ||

                    email.includes(search) ||

                    phone.includes(search) ||

                    transactionId.includes(search) ||

                    paymentMethod.includes(search) ||

                    requestId.includes(search)

                );

            }
        );


    // ======================================
    // EMPTY RESULT
    // ======================================

    container.innerHTML = "";


    if (
        filteredRequests.length ===
        0
    ) {

        if (emptyState) {

            emptyState.style.display =
                "block";


            emptyState.innerHTML = `

                <i class="fas fa-inbox"></i>

                <p>
                    ${
                        allDepositRequests.length === 0
                            ? "No deposit requests found."
                            : "No deposits match your search."
                    }
                </p>

            `;

        }


        return;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    // ======================================
    // RENDER CARDS
    // ======================================

    container.innerHTML =
        filteredRequests
            .map(
                (request) => {

                    const user =
                        depositUsers[
                            request.uid
                        ] || {};


                    return renderDepositCard(
                        request,
                        user
                    );

                }
            )
            .join("");


    activateDepositButtons();

}


// ==========================================
// RENDER ONE DEPOSIT CARD
// ==========================================

function renderDepositCard(
    request,
    user = {}
) {

    const id =
        request.id || "";


    const uid =
        request.uid || "";


    const status =
        normalizeStatus(
            request.status
        );


    const amount =
        numberValue(
            request.amount
        );


    const userName =
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
        "N/A";


    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        "N/A";


    const transactionId =
        request.transactionId ||
        request.txId ||
        request.transactionID ||
        "N/A";


    const createdAt =
        request.createdAt ??
        request.timestamp ??
        0;


    const approvedAt =
        request.approvedAt ||
        0;


    const rejectedAt =
        request.rejectedAt ||
        0;


    const proofUrl =
        request.proofUrl ||
        request.proof ||
        request.receiptUrl ||
        request.screenshotUrl ||
        "";


    // ======================================
    // STATUS LABEL
    // ======================================

    let statusText =
        "Pending";


    if (
        status ===
        "approved"
    ) {

        statusText =
            "Approved";

    }


    else if (
        status ===
        "rejected"
    ) {

        statusText =
            "Rejected";

    }


    else if (
        status ===
        "processing"
    ) {

        statusText =
            "Processing";

    }


    else if (
        status ===
        "processing_error"
    ) {

        statusText =
            "Processing Error";

    }


    // ======================================
    // ACTIONS
    // ======================================

    let actions = "";


    if (
        status ===
        "pending"
    ) {

        actions = `

            <div class="request-actions">

                <button
                    type="button"
                    class="approve-deposit-btn"
                    data-id="${escapeHTML(id)}"
                >

                    <i class="fas fa-check"></i>

                    Approve

                </button>


                <button
                    type="button"
                    class="reject-deposit-btn"
                    data-id="${escapeHTML(id)}"
                >

                    <i class="fas fa-times"></i>

                    Reject

                </button>

            </div>

        `;

    }


    // ======================================
    // PROOF
    // ======================================

    let proofHTML = "";


    if (proofUrl) {

        proofHTML = `

            <div class="deposit-proof">

                <span>
                    <i class="fas fa-image"></i>
                    Payment Proof
                </span>

                <a
                    href="${escapeHTML(proofUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    View Proof

                </a>

            </div>

        `;

    }


    // ======================================
    // CARD
    // ======================================

    return `

        <div
            class="deposit-card"
            data-id="${escapeHTML(id)}"
            data-uid="${escapeHTML(uid)}"
            data-status="${escapeHTML(status)}"
        >


            <!-- ==========================
                 HEADER
            =========================== -->

            <div class="deposit-card-header">

                <div class="deposit-user">

                    <div class="user-avatar">

                        <i class="fas fa-user"></i>

                    </div>


                    <div>

                        <strong>
                            ${escapeHTML(userName)}
                        </strong>

                        <small>
                            ${escapeHTML(email)}
                        </small>

                    </div>

                </div>


                <span
                    class="status-badge ${escapeHTML(status)}"
                >

                    ${escapeHTML(statusText)}

                </span>

            </div>


            <!-- ==========================
                 AMOUNT
            =========================== -->

            <div class="deposit-amount">

                <span>
                    Deposit Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <!-- ==========================
                 DETAILS
            =========================== -->

            <div class="deposit-details">


                <div class="detail-item">

                    <span>
                        <i class="fas fa-fingerprint"></i>
                        User UID
                    </span>

                    <strong>
                        ${escapeHTML(uid || "N/A")}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-mobile-screen"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-credit-card"></i>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(paymentMethod)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-receipt"></i>
                        Transaction ID
                    </span>

                    <strong>
                        ${escapeHTML(transactionId)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-calendar"></i>
                        Request Date
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(createdAt)
                        )}
                    </strong>

                </div>


                ${
                    approvedAt
                        ? `

                        <div class="detail-item">

                            <span>
                                <i class="fas fa-check-circle"></i>
                                Approved Date
                            </span>

                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        approvedAt
                                    )
                                )}
                            </strong>

                        </div>

                        `
                        : ""
                }


                ${
                    rejectedAt
                        ? `

                        <div class="detail-item">

                            <span>
                                <i class="fas fa-times-circle"></i>
                                Rejected Date
                            </span>

                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        rejectedAt
                                    )
                                )}
                            </strong>

                        </div>

                        `
                        : ""
                }

            </div>


            ${proofHTML}


            <!-- ==========================
                 REQUEST ID
            =========================== -->

            <div class="request-id">

                <span>
                    Request ID:
                </span>

                <code>
                    ${escapeHTML(id)}
                </code>

            </div>


            ${actions}

        </div>

    `;

}


// ==========================================
// ACTIVATE DEPOSIT BUTTONS
// ==========================================

function activateDepositButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approve-deposit-btn"
        );


    approveButtons.forEach(
        (button) => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        alert(
                            "Deposit request ID is missing."
                        );

                        return;

                    }


                    if (
                        typeof window
                            .approveDeposit ===
                        "function"
                    ) {

                        await window
                            .approveDeposit(id);

                    }

                }
            );

        }
    );


    const rejectButtons =
        document.querySelectorAll(
            ".reject-deposit-btn"
        );


    rejectButtons.forEach(
        (button) => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        alert(
                            "Deposit request ID is missing."
                        );

                        return;

                    }


                    if (
                        typeof window
                            .rejectDeposit ===
                        "function"
                    ) {

                        await window
                            .rejectDeposit(id);

                    }

                }
            );

        }
    );

}


// ==========================================
// SEARCH
// ==========================================

const depositSearch =
    document.getElementById(
        "depositSearch"
    );


if (depositSearch) {

    depositSearch.addEventListener(
        "input",
        () => {

            renderDepositRequests();

        }
    );

}


// ==========================================
// FILTER
// ==========================================

const depositFilter =
    document.getElementById(
        "depositFilter"
    );


if (depositFilter) {

    depositFilter.addEventListener(
        "change",
        () => {

            renderDepositRequests();

        }
    );

}


// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.loadDeposits =
    loadDeposits;


window.renderDepositRequests =
    renderDepositRequests;


window.renderDepositCard =
    renderDepositCard;


window.activateDepositButtons =
    activateDepositButtons;


window.allDepositRequests =
    allDepositRequests;


console.log(
    "MONEY VAULT ADMIN.JS — PART 3 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 4 — APPROVE / REJECT DEPOSIT
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// APPROVE DEPOSIT
// ==========================================

async function approveDeposit(id) {

    try {

        await window.waitForAdmin();


        if (!id) {

            alert(
                "Deposit request ID is missing."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to approve this deposit?"
            );


        if (!confirmed) return;


        // ======================================
        // REQUEST REFERENCE
        // ======================================

        const depositRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        // ======================================
        // READ REQUEST
        // ======================================

        const snapshot =
            await get(depositRef);


        if (!snapshot.exists()) {

            alert(
                "Deposit request not found."
            );

            return;

        }


        const deposit =
            snapshot.val() || {};


        const currentStatus =
            normalizeStatus(
                deposit.status
            );


        // ======================================
        // ONLY PENDING CAN BE APPROVED
        // ======================================

        if (
            currentStatus !==
            "pending"
        ) {

            alert(
                `This deposit is already ${currentStatus}.`
            );

            return;

        }


        // ======================================
        // USER UID
        // ======================================

        const uid =
            deposit.uid;


        if (!uid) {

            alert(
                "This deposit has no user UID."
            );

            return;

        }


        // ======================================
        // AMOUNT
        // ======================================

        const amount =
            numberValue(
                deposit.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Invalid deposit amount."
            );

            return;

        }


        // ======================================
        // LOCK REQUEST
        // Prevent double approval
        // ======================================

        const lockResult =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {

                        return;

                    }


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    if (
                        status !==
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
                            auth.currentUser?.uid ||
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


        // ======================================
        // USER REFERENCE
        // ======================================

        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            await update(
                depositRef,
                {

                    status:
                        "rejected",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null,

                    rejectionReason:
                        "User account not found.",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Deposit rejected: user account not found."
            );

            return;

        }


        const user =
            userSnapshot.val() || {};


        // ======================================
        // CURRENT USER BALANCE
        // ======================================

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


        const now =
            Date.now();


        // ======================================
        // UPDATE BALANCE
        // ======================================

        const balanceResult =
            await runTransaction(
                userRef,
                (currentUser) => {

                    if (!currentUser) {

                        return;

                    }


                    const balance =
                        numberValue(
                            currentUser.balance
                        );


                    return {

                        ...currentUser,

                        balance:
                            balance + amount,

                        totalDeposits:
                            numberValue(
                                currentUser.totalDeposits
                            ) + amount,

                        totalTransactions:
                            numberValue(
                                currentUser.totalTransactions
                            ) + 1

                    };

                }
            );


        if (!balanceResult.committed) {

            await update(
                depositRef,
                {

                    status:
                        "processing_error",

                    processingError:
                        "Could not update user balance.",

                    errorAt:
                        Date.now(),

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Deposit approval failed: balance could not be updated."
            );

            return;

        }


        // ======================================
        // CREATE TRANSACTION
        // ======================================

        let transactionKey =
            null;


        try {

            const transactionRef =
                push(
                    ref(
                        db,
                        "transactions"
                    )
                );


            transactionKey =
                transactionRef.key;


            if (!transactionKey) {

                throw new Error(
                    "Could not generate transaction ID."
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

                    currency:
                        "RWF",

                    paymentMethod:
                        deposit.paymentMethod ||
                        deposit.method ||
                        "",

                    phone:
                        deposit.phone ||
                        deposit.phoneNumber ||
                        "",

                    transactionId:
                        deposit.transactionId ||
                        deposit.txId ||
                        deposit.transactionID ||
                        "",

                    depositRequestId:
                        id,

                    createdAt:
                        now,

                    approvedAt:
                        now,

                    approvedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        ""

                }
            );

        } catch (transactionError) {

            console.error(
                "DEPOSIT TRANSACTION ERROR:",
                transactionError
            );


            /*
             * Balance has already been updated.
             * We mark the request as processing_error
             * instead of pretending everything succeeded.
             */

            await update(
                depositRef,
                {

                    status:
                        "processing_error",

                    processingError:
                        transactionError.message ||
                        "Transaction creation failed.",

                    errorAt:
                        Date.now(),

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Deposit balance was updated, but transaction recording failed. Check the transaction manually."
            );

            return;

        }


        // ======================================
        // FINALIZE DEPOSIT REQUEST
        // ======================================

        await update(
            depositRef,
            {

                status:
                    "approved",

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    "",

                transactionKey:
                    transactionKey,

                processedAt:
                    now,

                processingAt:
                    null,

                processingBy:
                    null

            }
        );


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            `Deposit approved successfully.\n\nAmount: ${formatMoney(amount)}`
        );


        // Refresh dashboard data
        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        if (
            typeof window.renderDepositRequests ===
            "function"
        ) {

            window.renderDepositRequests();

        }


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        // --------------------------------------
        // MARK ERROR
        // --------------------------------------

        try {

            if (id) {

                const errorRef =
                    ref(
                        db,
                        `depositRequests/${id}`
                    );


                const errorSnapshot =
                    await get(errorRef);


                if (
                    errorSnapshot.exists()
                ) {

                    const currentData =
                        errorSnapshot.val() || {};


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    /*
                     * Do not overwrite an already
                     * approved/rejected request.
                     */

                    if (
                        status !==
                            "approved" &&
                        status !==
                            "rejected"
                    ) {

                        await update(
                            errorRef,
                            {

                                status:
                                    "processing_error",

                                processingError:
                                    error.message ||
                                    "Unknown error",

                                errorAt:
                                    Date.now(),

                                processingAt:
                                    null,

                                processingBy:
                                    null

                            }
                        );

                    }

                }

            }

        } catch (markError) {

            console.error(
                "Could not mark deposit error:",
                markError
            );

        }


        alert(
            "Deposit approval failed:\n" +
            (
                error.message ||
                "Unknown error"
            )
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

            alert(
                "Deposit request ID is missing."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to reject this deposit?"
            );


        if (!confirmed) return;


        const depositRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        // ======================================
        // ATOMIC REJECTION
        // ======================================

        const result =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {

                        return;

                    }


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    if (
                        status !==
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
                            auth.currentUser?.uid ||
                            null,

                        processingAt:
                            null,

                        processingBy:
                            null

                    };

                }
            );


        if (!result.committed) {

            alert(
                "This deposit is no longer pending."
            );

            return;

        }


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            "Deposit rejected successfully."
        );


        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        if (
            typeof window.renderDepositRequests ===
            "function"
        ) {

            window.renderDepositRequests();

        }


    } catch (error) {

        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        alert(
            "Deposit rejection failed:\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}


// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


console.log(
    "MONEY VAULT ADMIN.JS — PART 4 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 5 — WITHDRAW REQUESTS
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// WITHDRAW DATA
// ==========================================

let allWithdrawRequests = [];

let withdrawUsers = {};


// ==========================================
// LOAD WITHDRAW REQUESTS
// ==========================================

function loadWithdraws() {

    if (
        !window.adminState ||
        !window.adminState.isAdmin
    ) {
        return;
    }


    // ======================================
    // USERS LISTENER
    // ======================================

    if (!listeners.withdrawUsers) {

        listeners.withdrawUsers =
            onValue(
                ref(db, "users"),
                (snapshot) => {

                    withdrawUsers =
                        snapshot.val() || {};

                    renderWithdrawRequests();

                },
                (error) => {

                    console.error(
                        "WITHDRAW USERS LISTENER ERROR:",
                        error
                    );

                }
            );

    }


    // ======================================
    // WITHDRAW REQUESTS LISTENER
    // ======================================

    if (!listeners.withdrawRequests) {

        listeners.withdrawRequests =
            onValue(
                ref(db, "withdrawRequests"),
                (snapshot) => {

                    const data =
                        snapshot.val() || {};


                    allWithdrawRequests =
                        Object.entries(data)
                            .map(
                                ([id, request]) => ({

                                    id,

                                    ...(request || {})

                                })
                            );


                    // Newest first
                    allWithdrawRequests.sort(
                        (a, b) => {

                            const dateA =
                                numberValue(
                                    a.createdAt ||
                                    a.requestedAt ||
                                    a.timestamp
                                );


                            const dateB =
                                numberValue(
                                    b.createdAt ||
                                    b.requestedAt ||
                                    b.timestamp
                                );


                            return dateB - dateA;

                        }
                    );


                    renderWithdrawRequests();

                },
                (error) => {

                    console.error(
                        "WITHDRAW REQUESTS LISTENER ERROR:",
                        error
                    );

                }
            );

    }


    // ======================================
    // SEARCH
    // ======================================

    const searchInput =
        document.getElementById(
            "withdrawSearch"
        );


    if (
        searchInput &&
        !searchInput.dataset.bound
    ) {

        searchInput.dataset.bound =
            "true";


        searchInput.addEventListener(
            "input",
            () => {

                renderWithdrawRequests();

            }
        );

    }


    // ======================================
    // FILTER
    // ======================================

    const filter =
        document.getElementById(
            "withdrawFilter"
        );


    if (
        filter &&
        !filter.dataset.bound
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            () => {

                renderWithdrawRequests();

            }
        );

    }

}


// ==========================================
// RENDER WITHDRAW REQUESTS
// ==========================================

function renderWithdrawRequests() {

    const list =
        document.getElementById(
            "withdrawList"
        );


    const empty =
        document.getElementById(
            "emptyWithdraw"
        );


    if (!list) {

        return;

    }


    const searchInput =
        document.getElementById(
            "withdrawSearch"
        );


    const filter =
        document.getElementById(
            "withdrawFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        normalizeStatus(
            filter?.value || "all"
        );


    // ======================================
    // COUNTERS
    // ======================================

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


    // ======================================
    // FILTER REQUESTS
    // ======================================

    const filtered =
        allWithdrawRequests.filter(
            request => {

                const status =
                    normalizeStatus(
                        request.status
                    );


                // Status filter
                if (
                    selectedStatus !== "all" &&
                    status !== selectedStatus
                ) {

                    return false;

                }


                // User information
                const user =
                    withdrawUsers[
                        request.uid
                    ] || {};


                const searchableText = [

                    request.id,

                    request.uid,

                    request.phone,

                    request.phoneNumber,

                    request.receiverPhone,

                    request.withdrawPhone,

                    request.accountName,

                    request.name,

                    request.paymentMethod,

                    request.method,

                    request.status,

                    user.name,

                    user.fullName,

                    user.username,

                    user.email,

                    user.phone,

                    user.phoneNumber

                ]
                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null
                    )
                    .join(" ")
                    .toLowerCase();


                if (
                    search &&
                    !searchableText.includes(
                        search
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    // ======================================
    // EMPTY STATE
    // ======================================

    if (
        filtered.length === 0
    ) {

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


    // ======================================
    // RENDER
    // ======================================

    list.innerHTML =
        filtered
            .map(
                request =>
                    renderWithdrawCard(
                        request,
                        withdrawUsers[
                            request.uid
                        ] || {}
                    )
            )
            .join("");


    activateWithdrawButtons();

}


// ==========================================
// RENDER SINGLE WITHDRAW CARD
// ==========================================

function renderWithdrawCard(
    request,
    user
) {

    const status =
        normalizeStatus(
            request.status
        );


    const statusLabel =
        getWithdrawStatusLabel(
            status
        );


    const amount =
        numberValue(
            request.amount
        );


    const uid =
        request.uid ||
        "";


    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        request.name ||
        "Unknown User";


    const userEmail =
        user.email ||
        "No email";


    const phone =
        request.phone ||
        request.receiverPhone ||
        request.withdrawPhone ||
        request.phoneNumber ||
        user.phone ||
        user.phoneNumber ||
        "Not provided";


    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        "Not specified";


    const accountName =
        request.accountName ||
        request.receiverName ||
        request.accountHolder ||
        "Not provided";


    const createdAt =
        request.createdAt ||
        request.requestedAt ||
        request.timestamp;


    const approvedAt =
        request.approvedAt;


    const rejectedAt =
        request.rejectedAt;


    const processingAt =
        request.processingAt;


    const rejectionReason =
        request.rejectionReason ||
        request.reason ||
        "";


    // ======================================
    // STATUS CLASS
    // ======================================

    const statusClass =
        status
            .replace(
                /[^a-z0-9_-]/gi,
                "-"
            );


    // ======================================
    // ACTION BUTTONS
    // ======================================

    let actions = "";


    if (
        status === "pending"
    ) {

        actions = `

            <div class="withdraw-actions">

                <button
                    type="button"
                    class="approve-withdraw-btn"
                    data-id="${escapeHTML(uidSafe(request.id))}"
                >
                    <i class="fa-solid fa-check"></i>
                    Approve
                </button>


                <button
                    type="button"
                    class="reject-withdraw-btn"
                    data-id="${escapeHTML(uidSafe(request.id))}"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Reject
                </button>

            </div>

        `;

    }


    // ======================================
    // EXTRA PROCESSING MESSAGE
    // ======================================

    let processingInfo = "";


    if (
        status === "processing"
    ) {

        processingInfo = `

            <div class="withdraw-processing">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Withdrawal is being processed...

            </div>

        `;

    }


    if (
        status === "processing_error"
    ) {

        processingInfo = `

            <div class="withdraw-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                Processing error:
                ${escapeHTML(
                    request.processingError ||
                    "Unknown error"
                )}

            </div>

        `;

    }


    // ======================================
    // REJECTION REASON
    // ======================================

    let rejectionInfo = "";


    if (
        status === "rejected" &&
        rejectionReason
    ) {

        rejectionInfo = `

            <div class="withdraw-rejection">

                <strong>
                    Rejection reason:
                </strong>

                <span>
                    ${escapeHTML(
                        rejectionReason
                    )}
                </span>

            </div>

        `;

    }


    // ======================================
    // CARD
    // ======================================

    return `

        <article
            class="withdraw-card ${statusClass}"
            data-id="${escapeHTML(
                uidSafe(request.id)
            )}"
            data-status="${escapeHTML(
                status
            )}"
            data-search="${escapeHTML(
                [
                    request.id,
                    uid,
                    userName,
                    userEmail,
                    phone,
                    paymentMethod,
                    accountName,
                    status
                ]
                    .filter(Boolean)
                    .join(" ")
            )}"
        >


            <!-- ============================
                 HEADER
            ============================= -->

            <div class="withdraw-card-header">

                <div class="withdraw-user">

                    <div class="withdraw-avatar">

                        ${
                            user.photoURL ||
                            user.photo ||
                            user.profileImage
                        ?

                        `
                            <img
                                src="${escapeHTML(
                                    user.photoURL ||
                                    user.photo ||
                                    user.profileImage
                                )}"
                                alt="User"
                            >
                        `

                        :

                        `
                            <i class="fa-solid fa-user"></i>
                        `

                        }

                    </div>


                    <div class="withdraw-user-info">

                        <h3>
                            ${escapeHTML(
                                userName
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                userEmail
                            )}
                        </p>

                    </div>

                </div>


                <span
                    class="withdraw-status ${statusClass}"
                >
                    ${escapeHTML(
                        statusLabel
                    )}
                </span>

            </div>


            <!-- ============================
                 AMOUNT
            ============================= -->

            <div class="withdraw-amount">

                <span>
                    Withdrawal Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <!-- ============================
                 DETAILS
            ============================= -->

            <div class="withdraw-details">


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-wallet"></i>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(
                            paymentMethod
                        )}
                    </strong>

                </div>


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Receiver Phone
                    </span>

                    <strong>
                        ${escapeHTML(
                            phone
                        )}
                    </strong>

                </div>


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-user"></i>
                        Account Name
                    </span>

                    <strong>
                        ${escapeHTML(
                            accountName
                        )}
                    </strong>

                </div>


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-calendar"></i>
                        Request Date
                    </span>

                    <strong>
                        ${formatDate(
                            createdAt
                        )}
                    </strong>

                </div>


                ${
                    approvedAt
                    ?

                    `

                    <div class="withdraw-detail">

                        <span>
                            <i class="fa-solid fa-check"></i>
                            Approved Date
                        </span>

                        <strong>
                            ${formatDate(
                                approvedAt
                            )}
                        </strong>

                    </div>

                    `

                    :

                    ""
                }


                ${
                    rejectedAt
                    ?

                    `

                    <div class="withdraw-detail">

                        <span>
                            <i class="fa-solid fa-xmark"></i>
                            Rejected Date
                        </span>

                        <strong>
                            ${formatDate(
                                rejectedAt
                            )}
                        </strong>

                    </div>

                    `

                    :

                    ""
                }


                ${
                    processingAt
                    ?

                    `

                    <div class="withdraw-detail">

                        <span>
                            <i class="fa-solid fa-spinner"></i>
                            Processing Date
                        </span>

                        <strong>
                            ${formatDate(
                                processingAt
                            )}
                        </strong>

                    </div>

                    `

                    :

                    ""
                }

            </div>


            ${processingInfo}

            ${rejectionInfo}


            <!-- ============================
                 UID
            ============================= -->

            <div class="withdraw-uid">

                <span>
                    User UID
                </span>

                <code>
                    ${escapeHTML(
                        uid || "N/A"
                    )}
                </code>

            </div>


            <!-- ============================
                 REQUEST ID
            ============================= -->

            <div class="withdraw-request-id">

                <span>
                    Request ID
                </span>

                <code>
                    ${escapeHTML(
                        uidSafe(request.id)
                    )}
                </code>

            </div>


            ${actions}

        </article>

    `;

}


// ==========================================
// SAFE REQUEST ID
// ==========================================

function uidSafe(id) {

    if (
        id === undefined ||
        id === null
    ) {

        return "";

    }


    return String(id);

}


// ==========================================
// WITHDRAW STATUS LABEL
// ==========================================

function getWithdrawStatusLabel(
    status
) {

    switch (status) {

        case "pending":

            return "Pending";


        case "processing":

            return "Processing";


        case "approved":

            return "Approved";


        case "rejected":

            return "Rejected";


        case "processing_error":

            return "Processing Error";


        default:

            return (
                status
                    ? status
                        .replace(
                            /_/g,
                            " "
                        )
                        .replace(
                            /\b\w/g,
                            char =>
                                char.toUpperCase()
                        )
                    : "Unknown"
            );

    }

}


// ==========================================
// ACTIVATE WITHDRAW BUTTONS
// ==========================================

function activateWithdrawButtons() {

    // ======================================
    // APPROVE BUTTONS
    // ======================================

    const approveButtons =
        document.querySelectorAll(
            ".approve-withdraw-btn"
        );


    approveButtons.forEach(
        button => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (
                        typeof window.approveWithdraw ===
                        "function"
                    ) {

                        await window.approveWithdraw(
                            id
                        );

                    }

                }
            );

        }
    );


    // ======================================
    // REJECT BUTTONS
    // ======================================

    const rejectButtons =
        document.querySelectorAll(
            ".reject-withdraw-btn"
        );


    rejectButtons.forEach(
        button => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (
                        typeof window.rejectWithdraw ===
                        "function"
                    ) {

                        await window.rejectWithdraw(
                            id
                        );

                    }

                }
            );

        }
    );

}


// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.loadWithdraws =
    loadWithdraws;


window.renderWithdrawRequests =
    renderWithdrawRequests;


window.renderWithdrawCard =
    renderWithdrawCard;


window.activateWithdrawButtons =
    activateWithdrawButtons;


window.getWithdrawStatusLabel =
    getWithdrawStatusLabel;


console.log(
    "MONEY VAULT ADMIN.JS — PART 5 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 6 — APPROVE / REJECT WITHDRAW
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// APPROVE WITHDRAW
// ==========================================

async function approveWithdraw(id) {

    try {

        await window.waitForAdmin();


        // ======================================
        // VALIDATE ID
        // ======================================

        if (!id) {

            alert(
                "Withdraw request ID is missing."
            );

            return;

        }


        // ======================================
        // CONFIRM
        // ======================================

        const confirmed =
            confirm(
                "Are you sure you want to approve this withdrawal?"
            );


        if (!confirmed) {

            return;

        }


        // ======================================
        // REQUEST REFERENCE
        // ======================================

        const requestRef =
            ref(
                db,
                `withdrawRequests/${id}`
            );


        // ======================================
        // READ REQUEST
        // ======================================

        const requestSnapshot =
            await get(requestRef);


        if (!requestSnapshot.exists()) {

            alert(
                "Withdraw request not found."
            );

            return;

        }


        const request =
            requestSnapshot.val() || {};


        const status =
            normalizeStatus(
                request.status
            );


        // ======================================
        // ONLY PENDING CAN BE APPROVED
        // ======================================

        if (
            status !== "pending"
        ) {

            alert(
                `This withdrawal is already ${status}.`
            );

            return;

        }


        // ======================================
        // USER UID
        // ======================================

        const uid =
            request.uid;


        if (!uid) {

            alert(
                "This withdrawal has no user UID."
            );

            return;

        }


        // ======================================
        // AMOUNT
        // ======================================

        const amount =
            numberValue(
                request.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Invalid withdrawal amount."
            );

            return;

        }


        // ======================================
        // ADMIN UID
        // ======================================

        const adminUid =
            currentAdmin?.uid ||
            auth.currentUser?.uid ||
            null;


        const now =
            Date.now();


        // ======================================
        // LOCK REQUEST
        //
        // pending -> processing
        //
        // Prevents two admins from approving
        // the same withdrawal simultaneously.
        // ======================================

        const lockResult =
            await runTransaction(
                requestRef,
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
                            adminUid

                    };

                }
            );


        if (
            !lockResult.committed
        ) {

            alert(
                "This withdrawal is already being processed or has already been processed."
            );

            return;

        }


        // ======================================
        // USER REFERENCE
        // ======================================

        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        // ======================================
        // READ USER
        // ======================================

        const userSnapshot =
            await get(userRef);


        if (
            !userSnapshot.exists()
        ) {

            await update(
                requestRef,
                {

                    status:
                        "rejected",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        adminUid,

                    rejectionReason:
                        "User account not found.",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Withdrawal rejected: user account not found."
            );

            return;

        }


        const user =
            userSnapshot.val() || {};


        // ======================================
        // CURRENT BALANCE
        // ======================================

        const currentBalance =
            numberValue(
                user.balance
            );


        // ======================================
        // CHECK BALANCE
        // ======================================

        if (
            currentBalance < amount
        ) {

            await update(
                requestRef,
                {

                    status:
                        "rejected",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        adminUid,

                    rejectionReason:
                        "Insufficient balance.",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Withdrawal rejected: insufficient balance."
            );

            return;

        }


        // ======================================
        // NEW BALANCE
        // ======================================

        const newBalance =
            currentBalance -
            amount;


        const newTotalWithdrawals =
            numberValue(
                user.totalWithdrawals
            ) + amount;


        const newTotalTransactions =
            numberValue(
                user.totalTransactions
            ) + 1;


        // ======================================
        // DEDUCT BALANCE ATOMICALLY
        // ======================================

        const balanceResult =
            await runTransaction(
                ref(
                    db,
                    `users/${uid}/balance`
                ),
                (currentValue) => {

                    const balance =
                        numberValue(
                            currentValue
                        );


                    /*
                     * Re-check the balance here.
                     *
                     * This protects against the user
                     * balance changing after the first
                     * balance check.
                     */

                    if (
                        balance < amount
                    ) {

                        return;

                    }


                    return (
                        balance -
                        amount
                    );

                }
            );


        if (
            !balanceResult.committed
        ) {

            await update(
                requestRef,
                {

                    status:
                        "rejected",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        adminUid,

                    rejectionReason:
                        "Insufficient balance or balance changed during processing.",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Withdrawal rejected: balance changed or is insufficient."
            );

            return;

        }


        // ======================================
        // UPDATE WITHDRAWAL TOTALS
        // ======================================

        await update(
            userRef,
            {

                totalWithdrawals:
                    newTotalWithdrawals,

                totalTransactions:
                    newTotalTransactions

            }
        );


        // ======================================
        // CREATE TRANSACTION
        // ======================================

        let transactionKey =
            null;


        try {

            const transactionRef =
                push(
                    ref(
                        db,
                        "transactions"
                    )
                );


            transactionKey =
                transactionRef.key;


            if (!transactionKey) {

                throw new Error(
                    "Could not generate transaction ID."
                );

            }


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

                    currency:
                        "RWF",

                    paymentMethod:
                        request.paymentMethod ||
                        request.method ||
                        "",

                    phone:
                        request.phone ||
                        request.receiverPhone ||
                        request.withdrawPhone ||
                        request.phoneNumber ||
                        "",

                    accountName:
                        request.accountName ||
                        request.receiverName ||
                        request.accountHolder ||
                        "",

                    withdrawRequestId:
                        id,

                    createdAt:
                        now,

                    approvedAt:
                        now,

                    approvedBy:
                        adminUid

                }
            );


        } catch (transactionError) {

            console.error(
                "WITHDRAW TRANSACTION ERROR:",
                transactionError
            );


            /*
             * The balance has already been deducted.
             *
             * We therefore DO NOT pretend that the
             * whole operation succeeded.
             */

            await update(
                requestRef,
                {

                    status:
                        "processing_error",

                    processingError:
                        transactionError.message ||
                        "Transaction creation failed.",

                    errorAt:
                        Date.now(),

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Balance was deducted, but the transaction record could not be created. Check the transaction manually."
            );

            return;

        }


        // ======================================
        // FINALIZE REQUEST
        // ======================================

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    now,

                approvedBy:
                    adminUid,

                transactionKey:
                    transactionKey,

                processedAt:
                    now,

                processingAt:
                    null,

                processingBy:
                    null

            }
        );


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            `Withdrawal approved successfully.\n\nAmount: ${formatMoney(amount)}\nRemaining Balance: ${formatMoney(newBalance)}`
        );


        // ======================================
        // REFRESH DASHBOARD
        // ======================================

        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        // ======================================
        // REFRESH WITHDRAW LIST
        // ======================================

        if (
            typeof window.renderWithdrawRequests ===
            "function"
        ) {

            window.renderWithdrawRequests();

        }


        // ======================================
        // REFRESH USERS
        // ======================================

        if (
            typeof window.renderUsers ===
            "function"
        ) {

            window.renderUsers();

        }


    } catch (error) {

        console.error(
            "APPROVE WITHDRAW ERROR:",
            error
        );


        // ======================================
        // MARK PROCESSING ERROR
        // ======================================

        try {

            if (id) {

                const errorRef =
                    ref(
                        db,
                        `withdrawRequests/${id}`
                    );


                const errorSnapshot =
                    await get(errorRef);


                if (
                    errorSnapshot.exists()
                ) {

                    const currentData =
                        errorSnapshot.val() ||
                        {};


                    const currentStatus =
                        normalizeStatus(
                            currentData.status
                        );


                    /*
                     * Never overwrite a final status.
                     */

                    if (
                        currentStatus !==
                            "approved" &&
                        currentStatus !==
                            "rejected"
                    ) {

                        await update(
                            errorRef,
                            {

                                status:
                                    "processing_error",

                                processingError:
                                    error.message ||
                                    "Unknown error",

                                errorAt:
                                    Date.now(),

                                processingAt:
                                    null,

                                processingBy:
                                    null

                            }
                        );

                    }

                }

            }

        } catch (markError) {

            console.error(
                "COULD NOT MARK WITHDRAW ERROR:",
                markError
            );

        }


        alert(
            "Withdrawal approval failed:\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}


// ==========================================
// REJECT WITHDRAW
// ==========================================

async function rejectWithdraw(id) {

    try {

        await window.waitForAdmin();


        // ======================================
        // VALIDATE ID
        // ======================================

        if (!id) {

            alert(
                "Withdraw request ID is missing."
            );

            return;

        }


        // ======================================
        // CONFIRM
        // ======================================

        const confirmed =
            confirm(
                "Are you sure you want to reject this withdrawal?"
            );


        if (!confirmed) {

            return;

        }


        // ======================================
        // REQUEST REFERENCE
        // ======================================

        const requestRef =
            ref(
                db,
                `withdrawRequests/${id}`
            );


        // ======================================
        // ATOMIC REJECTION
        // ======================================

        const result =
            await runTransaction(
                requestRef,
                (currentData) => {

                    if (!currentData) {

                        return;

                    }


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    /*
                     * Only pending requests
                     * can be rejected.
                     */

                    if (
                        status !== "pending"
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
                            auth.currentUser?.uid ||
                            null,

                        processingAt:
                            null,

                        processingBy:
                            null

                    };

                }
            );


        if (
            !result.committed
        ) {

            alert(
                "This withdrawal is no longer pending."
            );

            return;

        }


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            "Withdrawal rejected successfully."
        );


        // ======================================
        // REFRESH DASHBOARD
        // ======================================

        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        // ======================================
        // REFRESH WITHDRAW LIST
        // ======================================

        if (
            typeof window.renderWithdrawRequests ===
            "function"
        ) {

            window.renderWithdrawRequests();

        }


    } catch (error) {

        console.error(
            "REJECT WITHDRAW ERROR:",
            error
        );


        alert(
            "Withdrawal rejection failed:\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}


// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.approveWithdraw =
    approveWithdraw;


window.rejectWithdraw =
    rejectWithdraw;


console.log(
    "MONEY VAULT ADMIN.JS — PART 6 READY"
);

    /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 7
   VIP PURCHASE REQUESTS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   VIP REQUEST CACHE
========================================================= */

let allVipRequests = [];
let vipRequestUsers = {};


/* =========================================================
   VIP REQUEST LOADER
========================================================= */

function loadVipRequests() {

    if (!window.waitForAdmin) {
        console.warn("waitForAdmin is not available yet.");
        return;
    }

    window.waitForAdmin().then(() => {

        /* -----------------------------------------
           VIP REQUESTS LISTENER
        ----------------------------------------- */

        if (!listeners.vipPurchaseRequests) {

            listeners.vipPurchaseRequests = onValue(
                ref(db, "vipPurchaseRequests"),

                snapshot => {

                    const data = snapshot.val() || {};

                    allVipRequests = Object.entries(data)
                        .map(([id, request]) => ({
                            id,
                            ...(request || {})
                        }))
                        .sort((a, b) => {

                            const dateA =
                                Number(
                                    a.createdAt ||
                                    a.requestedAt ||
                                    a.timestamp ||
                                    0
                                );

                            const dateB =
                                Number(
                                    b.createdAt ||
                                    b.requestedAt ||
                                    b.timestamp ||
                                    0
                                );

                            return dateB - dateA;
                        });

                    renderVipRequests();
                },

                error => {

                    console.error(
                        "VIP requests listener error:",
                        error
                    );

                    allVipRequests = [];

                    renderVipRequests();
                }
            );
        }


        /* -----------------------------------------
           USERS LISTENER
        ----------------------------------------- */

        if (!listeners.vipRequestUsers) {

            listeners.vipRequestUsers = onValue(
                ref(db, "users"),

                snapshot => {

                    vipRequestUsers =
                        snapshot.val() || {};

                    renderVipRequests();
                },

                error => {

                    console.error(
                        "VIP users listener error:",
                        error
                    );

                    vipRequestUsers = {};

                    renderVipRequests();
                }
            );
        }

    }).catch(error => {

        console.error(
            "VIP request loader initialization error:",
            error
        );

    });
}


/* =========================================================
   RENDER VIP REQUESTS
========================================================= */

function renderVipRequests() {

    const list =
        document.getElementById("vipRequestList");

    const empty =
        document.getElementById("emptyVipRequest");

    if (!list) {
        return;
    }


    /* -----------------------------------------
       STATUS COUNTERS
    ----------------------------------------- */

    const total =
        allVipRequests.length;

    const pending =
        allVipRequests.filter(
            request =>
                normalizeStatus(request.status) === "pending"
        ).length;

    const approved =
        allVipRequests.filter(
            request =>
                normalizeStatus(request.status) === "approved"
        ).length;

    const rejected =
        allVipRequests.filter(
            request =>
                normalizeStatus(request.status) === "rejected"
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


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    const searchInput =
        document.getElementById("vipSearch");

    const filterSelect =
        document.getElementById("vipFilter");


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const filter =
        filterSelect
            ? normalizeStatus(
                filterSelect.value
            )
            : "all";


    /* -----------------------------------------
       FILTER REQUESTS
    ----------------------------------------- */

    const filtered =
        allVipRequests.filter(request => {

            const status =
                normalizeStatus(
                    request.status
                );

            if (
                filter &&
                filter !== "all" &&
                status !== filter
            ) {
                return false;
            }


            if (!search) {
                return true;
            }


            const uid =
                String(
                    request.uid ||
                    request.userId ||
                    ""
                ).toLowerCase();


            const requestId =
                String(
                    request.id ||
                    ""
                ).toLowerCase();


            const vipName =
                String(
                    request.vipName ||
                    request.name ||
                    request.planName ||
                    ""
                ).toLowerCase();


            const email =
                String(
                    request.email ||
                    ""
                ).toLowerCase();


            const user =
                vipRequestUsers[
                    request.uid ||
                    request.userId
                ] || {};


            const userName =
                String(
                    user.name ||
                    user.fullName ||
                    user.username ||
                    ""
                ).toLowerCase();


            const userEmail =
                String(
                    user.email ||
                    ""
                ).toLowerCase();


            return (
                uid.includes(search) ||
                requestId.includes(search) ||
                vipName.includes(search) ||
                email.includes(search) ||
                userName.includes(search) ||
                userEmail.includes(search)
            );
        });


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

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


    /* -----------------------------------------
       RENDER
    ----------------------------------------- */

    list.innerHTML =
        filtered
            .map(request =>
                renderVipRequestCard(
                    request,
                    vipRequestUsers[
                        request.uid ||
                        request.userId
                    ] || {}
                )
            )
            .join("");


    activateVipRequestButtons();
}


/* =========================================================
   VIP REQUEST CARD
========================================================= */

function renderVipRequestCard(
    request,
    user = {}
) {

    const requestId =
        request.id || "";


    const uid =
        request.uid ||
        request.userId ||
        "";


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
            request.daily ??
            request.dailyProfit
        );


    const totalProfit =
        numberValue(
            request.totalProfit ??
            request.profit ??
            request.totalEarning
        );


    const duration =
        numberValue(
            request.duration ??
            request.days ??
            request.durationDays
        );


    const status =
        normalizeStatus(
            request.status
        );


    const statusLabel =
        getVipRequestStatusLabel(
            status
        );


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
        "";


    const photo =
        user.photoURL ||
        user.photoUrl ||
        user.profileImage ||
        user.photo ||
        "";


    const createdAt =
        request.createdAt ||
        request.requestedAt ||
        request.timestamp;


    const approvedAt =
        request.approvedAt ||
        request.processedAt;


    const rejectedAt =
        request.rejectedAt;


    const rejectionReason =
        request.rejectionReason ||
        request.reason ||
        "";


    const processingError =
        request.processingError ||
        "";


    const safePhoto =
        escapeHTML(photo);


    const photoHTML =
        safePhoto
            ? `
                <img
                    src="${safePhoto}"
                    alt="User"
                    class="vip-user-photo"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >
                <div
                    class="vip-user-photo-fallback"
                    style="display:none;"
                >
                    <i class="fa-solid fa-user"></i>
                </div>
              `
            : `
                <div class="vip-user-photo-fallback">
                    <i class="fa-solid fa-user"></i>
                </div>
              `;


    let actions = "";


    if (status === "pending") {

        actions = `
            <div class="vip-request-actions">

                <button
                    type="button"
                    class="vipApproveBtn"
                    data-id="${escapeHTML(requestId)}"
                >
                    <i class="fa-solid fa-check"></i>
                    Approve
                </button>

                <button
                    type="button"
                    class="vipRejectBtn"
                    data-id="${escapeHTML(requestId)}"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Reject
                </button>

            </div>
        `;
    }


    const extraInfo =
        status === "rejected" && rejectionReason
            ? `
                <div class="vip-request-note rejected-note">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>
                        ${escapeHTML(rejectionReason)}
                    </span>
                </div>
              `
            : status === "processing_error" && processingError
                ? `
                    <div class="vip-request-note error-note">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>
                            ${escapeHTML(processingError)}
                        </span>
                    </div>
                  `
                : "";


    return `
        <div
            class="vip-request-card"
            data-id="${escapeHTML(requestId)}"
            data-status="${escapeHTML(status)}"
        >

            <!-- =====================================
                 HEADER
            ====================================== -->

            <div class="vip-request-header">

                <div class="vip-user-info">

                    <div class="vip-user-avatar">
                        ${photoHTML}
                    </div>

                    <div class="vip-user-details">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        ${
                            phone
                                ? `
                                    <small>
                                        <i class="fa-solid fa-phone"></i>
                                        ${escapeHTML(phone)}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <span
                    class="vip-request-status status-${escapeHTML(status)}"
                >
                    ${escapeHTML(statusLabel)}
                </span>

            </div>


            <!-- =====================================
                 VIP PLAN
            ====================================== -->

            <div class="vip-plan-box">

                <div class="vip-plan-title">

                    <i class="fa-solid fa-crown"></i>

                    <strong>
                        ${escapeHTML(vipName)}
                    </strong>

                </div>

            </div>


            <!-- =====================================
                 FINANCIAL INFORMATION
            ====================================== -->

            <div class="vip-request-grid">

                <div class="vip-info-item">

                    <span>
                        <i class="fa-solid fa-money-bill-wave"></i>
                        Price
                    </span>

                    <strong>
                        ${formatMoney(price)}
                    </strong>

                </div>


                <div class="vip-info-item">

                    <span>
                        <i class="fa-solid fa-coins"></i>
                        Daily Income
                    </span>

                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>

                </div>


                <div class="vip-info-item">

                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profit
                    </span>

                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>

                </div>


                <div class="vip-info-item">

                    <span>
                        <i class="fa-solid fa-calendar-days"></i>
                        Duration
                    </span>

                    <strong>
                        ${
                            duration > 0
                                ? `${duration} Days`
                                : "—"
                        }
                    </strong>

                </div>

            </div>


            <!-- =====================================
                 USER INFORMATION
            ====================================== -->

            <div class="vip-request-user-data">

                <div class="vip-data-row">

                    <span>
                        <i class="fa-solid fa-fingerprint"></i>
                        User UID
                    </span>

                    <strong class="uid-value">
                        ${escapeHTML(uid || "—")}
                    </strong>

                </div>


                <div class="vip-data-row">

                    <span>
                        <i class="fa-solid fa-clock"></i>
                        Requested
                    </span>

                    <strong>
                        ${formatDate(createdAt)}
                    </strong>

                </div>


                ${
                    approvedAt
                        ? `
                            <div class="vip-data-row">

                                <span>
                                    <i class="fa-solid fa-check-circle"></i>
                                    Approved
                                </span>

                                <strong>
                                    ${formatDate(approvedAt)}
                                </strong>

                            </div>
                          `
                        : ""
                }


                ${
                    rejectedAt
                        ? `
                            <div class="vip-data-row">

                                <span>
                                    <i class="fa-solid fa-xmark-circle"></i>
                                    Rejected
                                </span>

                                <strong>
                                    ${formatDate(rejectedAt)}
                                </strong>

                            </div>
                          `
                        : ""
                }


                <div class="vip-data-row">

                    <span>
                        <i class="fa-solid fa-hashtag"></i>
                        Request ID
                    </span>

                    <strong class="request-id-value">
                        ${escapeHTML(requestId)}
                    </strong>

                </div>

            </div>


            ${extraInfo}


            <!-- =====================================
                 ACTIONS
            ====================================== -->

            ${actions}

        </div>
    `;
}


/* =========================================================
   VIP REQUEST STATUS LABEL
========================================================= */

function getVipRequestStatusLabel(status) {

    switch (
        normalizeStatus(status)
    ) {

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        case "processing":
            return "Processing";

        case "processing_error":
            return "Processing Error";

        case "pending":
            return "Pending";

        default:
            return status
                ? String(status)
                : "Unknown";
    }
}


/* =========================================================
   VIP REQUEST BUTTONS
========================================================= */

function activateVipRequestButtons() {

    /* -----------------------------------------
       APPROVE BUTTONS
    ----------------------------------------- */

    document
        .querySelectorAll(".vipApproveBtn")
        .forEach(button => {

            if (
                button.dataset.bound === "true"
            ) {
                return;
            }


            button.dataset.bound = "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {
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
                            "approveVipRequest() is not available."
                        );

                    }
                }
            );
        });


    /* -----------------------------------------
       REJECT BUTTONS
    ----------------------------------------- */

    document
        .querySelectorAll(".vipRejectBtn")
        .forEach(button => {

            if (
                button.dataset.bound === "true"
            ) {
                return;
            }


            button.dataset.bound = "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {
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
                            "rejectVipRequest() is not available."
                        );

                    }
                }
            );
        });
}


/* =========================================================
   VIP SEARCH
========================================================= */

function activateVipRequestSearch() {

    const search =
        document.getElementById(
            "vipSearch"
        );

    const filter =
        document.getElementById(
            "vipFilter"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound = "true";

        search.addEventListener(
            "input",
            renderVipRequests
        );
    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound = "true";

        filter.addEventListener(
            "change",
            renderVipRequests
        );
    }
}


/* =========================================================
   INITIALIZE VIP REQUEST PAGE
========================================================= */

function initializeVipRequestPage() {

    activateVipRequestSearch();

    renderVipRequests();
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadVipRequests =
    loadVipRequests;

window.renderVipRequests =
    renderVipRequests;

window.renderVipRequestCard =
    renderVipRequestCard;

window.activateVipRequestButtons =
    activateVipRequestButtons;

window.activateVipRequestSearch =
    activateVipRequestSearch;

window.initializeVipRequestPage =
    initializeVipRequestPage;

window.getVipRequestStatusLabel =
    getVipRequestStatusLabel;


/* =========================================================
   AUTO INITIALIZATION
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeVipRequestPage();

        }
    );

} else {

    initializeVipRequestPage();
}

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 8
   VIP APPROVE / REJECT
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   VIP SETTINGS
========================================================= */

const REFERRAL_BONUS_AMOUNT = 1000;


/* =========================================================
   SAFE VIP VALUE HELPERS
========================================================= */

function getVipRequestValue(request, fields) {

    if (!request || !Array.isArray(fields)) {
        return 0;
    }

    for (const field of fields) {

        if (
            request[field] !== undefined &&
            request[field] !== null &&
            request[field] !== ""
        ) {
            return request[field];
        }
    }

    return 0;
}


/* =========================================================
   GET VIP DURATION
========================================================= */

function getVipDuration(request) {

    let duration = numberValue(
        getVipRequestValue(
            request,
            [
                "duration",
                "days",
                "durationDays"
            ]
        )
    );


    /* -----------------------------------------
       IF DURATION EXISTS
    ----------------------------------------- */

    if (duration > 0) {
        return Math.floor(duration);
    }


    /* -----------------------------------------
       CALCULATE FROM TOTAL PROFIT / DAILY
    ----------------------------------------- */

    const dailyIncome =
        numberValue(
            getVipRequestValue(
                request,
                [
                    "dailyIncome",
                    "daily",
                    "dailyProfit"
                ]
            )
        );


    const totalProfit =
        numberValue(
            getVipRequestValue(
                request,
                [
                    "totalProfit",
                    "profit",
                    "totalEarning"
                ]
            )
        );


    if (
        dailyIncome > 0 &&
        totalProfit > 0
    ) {

        const calculated =
            totalProfit / dailyIncome;

        if (calculated > 0) {
            return Math.ceil(calculated);
        }
    }


    return 0;
}


/* =========================================================
   CHECK FIRST VIP
========================================================= */

async function hasExistingVip(uid) {

    if (!uid) {
        return false;
    }


    try {

        const snapshot =
            await get(
                ref(db, "vipBuyers")
            );


        if (!snapshot.exists()) {
            return false;
        }


        const data =
            snapshot.val() || {};


        return Object.values(data)
            .some(vip => {

                if (!vip) {
                    return false;
                }

                return (
                    String(
                        vip.uid ||
                        vip.userId ||
                        ""
                    ) === String(uid)
                );
            });

    } catch (error) {

        console.error(
            "Could not check existing VIP:",
            error
        );

        /*
         * FAIL SAFE:
         * If we cannot determine whether the user
         * already has a VIP, do not award referral bonus.
         */
        throw new Error(
            "Unable to verify existing VIP records."
        );
    }
}


/* =========================================================
   APPROVE VIP REQUEST
========================================================= */

async function approveVipRequest(id) {

    try {

        /* -----------------------------------------
           ADMIN CHECK
        ----------------------------------------- */

        await window.waitForAdmin();


        if (!id) {

            showToast(
                "Invalid VIP request.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           CONFIRM
        ----------------------------------------- */

        const confirmed =
            window.confirm(
                "Are you sure you want to approve this VIP request?"
            );


        if (!confirmed) {
            return;
        }


        /* -----------------------------------------
           REQUEST REFERENCE
        ----------------------------------------- */

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        const requestSnapshot =
            await get(requestRef);


        if (!requestSnapshot.exists()) {

            showToast(
                "VIP request was not found.",
                "error"
            );

            return;
        }


        const request =
            requestSnapshot.val() || {};


        /* -----------------------------------------
           STATUS CHECK
        ----------------------------------------- */

        const currentStatus =
            normalizeStatus(
                request.status
            );


        if (currentStatus !== "pending") {

            showToast(
                `This VIP request is already ${currentStatus || "processed"}.`,
                "warning"
            );

            return;
        }


        /* -----------------------------------------
           BASIC VALUES
        ----------------------------------------- */

        const uid =
            request.uid ||
            request.userId;


        const price =
            numberValue(
                getVipRequestValue(
                    request,
                    [
                        "price",
                        "vipPrice",
                        "amount"
                    ]
                )
            );


        const dailyIncome =
            numberValue(
                getVipRequestValue(
                    request,
                    [
                        "dailyIncome",
                        "daily",
                        "dailyProfit"
                    ]
                )
            );


        const totalProfit =
            numberValue(
                getVipRequestValue(
                    request,
                    [
                        "totalProfit",
                        "profit",
                        "totalEarning"
                    ]
                )
            );


        const vipName =
            getVipRequestValue(
                request,
                [
                    "vipName",
                    "name",
                    "planName"
                ]
            ) || "VIP Plan";


        const duration =
            getVipDuration(request);


        /* -----------------------------------------
           VALIDATION
        ----------------------------------------- */

        if (!uid) {

            showToast(
                "VIP request has no user UID.",
                "error"
            );

            return;
        }


        if (price <= 0) {

            showToast(
                "Invalid VIP price.",
                "error"
            );

            return;
        }


        if (dailyIncome <= 0) {

            showToast(
                "Invalid VIP daily income.",
                "error"
            );

            return;
        }


        if (totalProfit <= 0) {

            showToast(
                "Invalid VIP total profit.",
                "error"
            );

            return;
        }


        if (duration <= 0) {

            showToast(
                "Invalid VIP duration.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           LOCK REQUEST
           pending -> processing
        ----------------------------------------- */

        const lockResult =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const status =
                        normalizeStatus(
                            current.status
                        );


                    if (status !== "pending") {
                        return;
                    }


                    return {
                        ...current,

                        status: "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin.uid
                    };
                }
            );


        if (!lockResult.committed) {

            showToast(
                "This VIP request is already being processed.",
                "warning"
            );

            return;
        }


        /* -----------------------------------------
           READ USER
        ----------------------------------------- */

        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            await update(
                requestRef,
                {
                    status: "rejected",
                    rejectedAt: Date.now(),
                    rejectedBy: currentAdmin.uid,
                    rejectionReason:
                        "User account was not found."
                }
            );


            showToast(
                "User account was not found.",
                "error"
            );

            return;
        }


        const user =
            userSnapshot.val() || {};


        /* -----------------------------------------
           BALANCE CHECK
        ----------------------------------------- */

        const balance =
            numberValue(
                user.balance
            );


        if (balance < price) {

            await update(
                requestRef,
                {
                    status: "rejected",
                    rejectedAt: Date.now(),
                    rejectedBy: currentAdmin.uid,
                    rejectionReason:
                        "Insufficient balance."
                }
            );


            showToast(
                "User does not have enough balance for this VIP.",
                "error"
            );

            return;
        }


        /* =================================================
           APPROVAL TIME
        ================================================= */

        const approvedAt =
            Date.now();


        const startDate =
            approvedAt;


        const endDate =
            startDate +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );


        /* =================================================
           DEDUCT VIP PRICE
           IMPORTANT:
           DAILY INCOME IS NOT ADDED HERE.
        ================================================= */

        let updatedUser = null;


        const userTransaction =
            await runTransaction(
                userRef,
                currentUser => {

                    if (!currentUser) {
                        return;
                    }


                    const currentBalance =
                        numberValue(
                            currentUser.balance
                        );


                    if (
                        currentBalance < price
                    ) {
                        return;
                    }


                    const newBalance =
                        currentBalance -
                        price;


                    const currentTotalTransactions =
                        numberValue(
                            currentUser.totalTransactions
                        );


                    const currentTotalVipPurchases =
                        numberValue(
                            currentUser.totalVipPurchases
                        );


                    return {
                        ...currentUser,

                        balance:
                            newBalance,

                        totalTransactions:
                            currentTotalTransactions + 1,

                        totalVipPurchases:
                            currentTotalVipPurchases + 1,

                        updatedAt:
                            approvedAt
                    };
                }
            );


        if (!userTransaction.committed) {

            await update(
                requestRef,
                {
                    status: "rejected",
                    rejectedAt: Date.now(),
                    rejectedBy: currentAdmin.uid,
                    rejectionReason:
                        "Insufficient balance during approval."
                }
            );


            showToast(
                "VIP approval failed because the balance changed.",
                "error"
            );

            return;
        }


        updatedUser =
            userTransaction.snapshot.val();


        /* =================================================
           CREATE VIP BUYER
        ================================================= */

        const vipBuyerRef =
            push(
                ref(db, "vipBuyers")
            );


        const vipBuyerId =
            vipBuyerRef.key;


        if (!vipBuyerId) {

            /*
             * Balance has already been deducted.
             * Mark request as processing error instead
             * of pretending the approval completed.
             */
            await update(
                requestRef,
                {
                    status: "processing_error",
                    processingError:
                        "Could not generate VIP buyer ID.",
                    processingErrorAt:
                        Date.now()
                }
            );


            showToast(
                "VIP buyer ID could not be generated.",
                "error"
            );

            return;
        }


        const vipBuyerData = {

            uid: uid,

            userId: uid,

            vipName: String(vipName),

            name: String(vipName),

            price: price,

            vipPrice: price,

            dailyIncome: dailyIncome,

            daily: dailyIncome,

            totalProfit: totalProfit,

            profit: totalProfit,

            duration: duration,

            days: duration,

            startDate: startDate,

            approvedAt: approvedAt,

            lastClaim: startDate,

            endDate: endDate,

            claimedAmount: 0,

            totalEarned: 0,

            claimCount: 0,

            status: "active",

            currency: "RWF",

            purchaseRequestId: id,

            createdAt: approvedAt,

            approvedBy: currentAdmin.uid
        };


        await set(
            vipBuyerRef,
            vipBuyerData
        );


        /* =================================================
           USER VIP COPY
        ================================================= */

        const userVipRef =
            ref(
                db,
                `users/${uid}/vipPlans/${vipBuyerId}`
            );


        await set(
            userVipRef,
            vipBuyerData
        );


        /* =================================================
           VIP TRANSACTION
        ================================================= */

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionKey =
            transactionRef.key;


        if (!transactionKey) {

            await update(
                requestRef,
                {
                    status: "processing_error",
                    processingError:
                        "Could not generate VIP transaction ID.",
                    processingErrorAt:
                        Date.now(),
                    vipBuyerId:
                        vipBuyerId
                }
            );


            showToast(
                "VIP transaction could not be created.",
                "error"
            );

            return;
        }


        const vipTransaction = {

            uid: uid,

            type: "vip",

            status: "approved",

            amount: price,

            currency: "RWF",

            vipName: String(vipName),

            vipBuyerId:
                vipBuyerId,

            vipPurchaseRequestId:
                id,

            paymentMethod:
                "Balance",

            createdAt:
                approvedAt,

            approvedAt:
                approvedAt,

            approvedBy:
                currentAdmin.uid
        };


        await set(
            transactionRef,
            vipTransaction
        );


        /* =================================================
           REFERRAL BONUS
           ONLY FOR FIRST VIP
        ================================================= */

        const referredBy =
            user.referredBy ||
            request.referredBy ||
            null;


        let referralBonusGiven =
            false;


        let referralTransactionKey =
            null;


        if (
            referredBy &&
            String(referredBy) !== String(uid)
        ) {

            try {

                const alreadyHadVip =
                    await hasExistingVipBeforeCurrent(
                        uid,
                        vipBuyerId
                    );


                if (!alreadyHadVip) {

                    const referralUserRef =
                        ref(
                            db,
                            `users/${referredBy}`
                        );


                    const referralResult =
                        await runTransaction(
                            referralUserRef,
                            referrer => {

                                if (!referrer) {
                                    return;
                                }


                                const currentEarnings =
                                    numberValue(
                                        referrer.referralEarnings
                                    );


                                return {
                                    ...referrer,

                                    referralEarnings:
                                        currentEarnings +
                                        REFERRAL_BONUS_AMOUNT,

                                    updatedAt:
                                        Date.now()
                                };
                            }
                        );


                    if (
                        referralResult.committed
                    ) {

                        referralBonusGiven =
                            true;


                        const referralTransactionRef =
                            push(
                                ref(db, "transactions")
                            );


                        referralTransactionKey =
                            referralTransactionRef.key;


                        if (
                            referralTransactionKey
                        ) {

                            await set(
                                referralTransactionRef,
                                {
                                    uid:
                                        referredBy,

                                    type:
                                        "referral",

                                    status:
                                        "approved",

                                    amount:
                                        REFERRAL_BONUS_AMOUNT,

                                    currency:
                                        "RWF",

                                    referredUserId:
                                        uid,

                                    vipBuyerId:
                                        vipBuyerId,

                                    vipPurchaseRequestId:
                                        id,

                                    createdAt:
                                        approvedAt,

                                    approvedAt:
                                        approvedAt,

                                    approvedBy:
                                        currentAdmin.uid
                                }
                            );
                        }
                    }
                }

            } catch (referralError) {

                /*
                 * VIP itself remains approved.
                 * Referral is not allowed to break
                 * the main VIP approval.
                 */
                console.error(
                    "Referral bonus error:",
                    referralError
                );
            }
        }


        /* =================================================
           FINALIZE REQUEST
        ================================================= */

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    approvedAt,

                approvedBy:
                    currentAdmin.uid,

                vipBuyerId:
                    vipBuyerId,

                transactionKey:
                    transactionKey,

                referralBonusGiven:
                    referralBonusGiven,

                referralTransactionKey:
                    referralTransactionKey,

                startDate:
                    startDate,

                endDate:
                    endDate,

                lastClaim:
                    startDate,

                claimedAmount:
                    0,

                totalEarned:
                    0,

                claimCount:
                    0,

                currency:
                    "RWF",

                updatedAt:
                    Date.now()
            }
        );


        /* =================================================
           SUCCESS
        ================================================= */

        showToast(
            "VIP approved successfully.",
            "success"
        );


        /* -----------------------------------------
           REFRESH
        ----------------------------------------- */

        if (
            typeof renderVipRequests ===
            "function"
        ) {
            renderVipRequests();
        }


        if (
            typeof loadDashboard ===
            "function"
        ) {
            loadDashboard();
        }


        if (
            typeof renderUsers ===
            "function"
        ) {
            renderUsers();
        }


        if (
            typeof loadVipBuyers ===
            "function"
        ) {
            loadVipBuyers();
        }


    } catch (error) {

        console.error(
            "Approve VIP error:",
            error
        );


        /* -----------------------------------------
           TRY TO MARK PROCESSING ERROR
        ----------------------------------------- */

        try {

            if (id) {

                await update(
                    ref(
                        db,
                        `vipPurchaseRequests/${id}`
                    ),
                    {
                        status:
                            "processing_error",

                        processingError:
                            error.message ||
                            "Unknown approval error.",

                        processingErrorAt:
                            Date.now(),

                        processingErrorBy:
                            currentAdmin?.uid ||
                            null
                    }
                );
            }

        } catch (updateError) {

            console.error(
                "Could not update VIP processing error:",
                updateError
            );
        }


        showToast(
            error.message ||
            "VIP approval failed.",
            "error"
        );
    }
}


/* =========================================================
   CHECK EXISTING VIP BEFORE CURRENT BUYER
========================================================= */

async function hasExistingVipBeforeCurrent(
    uid,
    currentVipBuyerId
) {

    if (!uid) {
        return false;
    }


    const snapshot =
        await get(
            ref(db, "vipBuyers")
        );


    if (!snapshot.exists()) {
        return false;
    }


    const data =
        snapshot.val() || {};


    return Object.entries(data)
        .some(([id, vip]) => {

            if (!vip) {
                return false;
            }


            if (
                String(id) ===
                String(currentVipBuyerId)
            ) {
                return false;
            }


            const vipUid =
                vip.uid ||
                vip.userId;


            return (
                String(vipUid) ===
                String(uid)
            );
        });
}


/* =========================================================
   REJECT VIP REQUEST
========================================================= */

async function rejectVipRequest(id) {

    try {

        await window.waitForAdmin();


        if (!id) {

            showToast(
                "Invalid VIP request.",
                "error"
            );

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to reject this VIP request?"
            );


        if (!confirmed) {
            return;
        }


        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "VIP request was not found.",
                "error"
            );

            return;
        }


        const request =
            snapshot.val() || {};


        const status =
            normalizeStatus(
                request.status
            );


        if (status !== "pending") {

            showToast(
                `This VIP request is already ${status || "processed"}.`,
                "warning"
            );

            return;
        }


        const reason =
            window.prompt(
                "Enter rejection reason (optional):",
                "VIP request rejected by administrator."
            );


        if (reason === null) {
            return;
        }


        /* -----------------------------------------
           ATOMIC REJECTION
        ----------------------------------------- */

        const result =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const currentStatus =
                        normalizeStatus(
                            current.status
                        );


                    if (
                        currentStatus !==
                        "pending"
                    ) {
                        return;
                    }


                    return {

                        ...current,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin.uid,

                        rejectionReason:
                            reason.trim() ||
                            "VIP request rejected by administrator.",

                        updatedAt:
                            Date.now()
                    };
                }
            );


        if (!result.committed) {

            showToast(
                "This VIP request was already processed.",
                "warning"
            );

            return;
        }


        showToast(
            "VIP request rejected successfully.",
            "success"
        );


        /* -----------------------------------------
           REFRESH
        ----------------------------------------- */

        if (
            typeof renderVipRequests ===
            "function"
        ) {
            renderVipRequests();
        }


        if (
            typeof loadDashboard ===
            "function"
        ) {
            loadDashboard();
        }


    } catch (error) {

        console.error(
            "Reject VIP error:",
            error
        );


        showToast(
            error.message ||
            "VIP rejection failed.",
            "error"
        );
    }
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;

window.getVipDuration =
    getVipDuration;

window.hasExistingVip =
    hasExistingVip;

window.REFERRAL_BONUS_AMOUNT =
    REFERRAL_BONUS_AMOUNT;

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 9
   VIP BUYERS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   VIP BUYERS CACHE
========================================================= */

let allVipBuyers = [];
let vipBuyerUsers = {};


/* =========================================================
   VIP BUYERS LISTENER
========================================================= */

function loadVipBuyers() {

    if (!window.waitForAdmin) {
        console.warn("waitForAdmin is not available.");
        return;
    }

    window.waitForAdmin()
        .then(() => {

            /* -----------------------------------------
               VIP BUYERS
            ----------------------------------------- */

            if (!listeners.vipBuyers) {

                listeners.vipBuyers = onValue(
                    ref(db, "vipBuyers"),

                    snapshot => {

                        const data =
                            snapshot.val() || {};

                        allVipBuyers =
                            Object.entries(data)
                                .map(([id, vip]) => ({
                                    id,
                                    ...(vip || {})
                                }))
                                .sort((a, b) => {

                                    const dateA =
                                        numberValue(
                                            a.approvedAt ||
                                            a.startDate ||
                                            a.createdAt
                                        );

                                    const dateB =
                                        numberValue(
                                            b.approvedAt ||
                                            b.startDate ||
                                            b.createdAt
                                        );

                                    return dateB - dateA;
                                });

                        renderVipBuyers();
                    },

                    error => {

                        console.error(
                            "VIP buyers listener error:",
                            error
                        );

                        allVipBuyers = [];

                        renderVipBuyers();
                    }
                );
            }


            /* -----------------------------------------
               USERS
            ----------------------------------------- */

            if (!listeners.vipBuyerUsers) {

                listeners.vipBuyerUsers = onValue(
                    ref(db, "users"),

                    snapshot => {

                        vipBuyerUsers =
                            snapshot.val() || {};

                        renderVipBuyers();
                    },

                    error => {

                        console.error(
                            "VIP buyer users listener error:",
                            error
                        );

                        vipBuyerUsers = {};

                        renderVipBuyers();
                    }
                );
            }

        })
        .catch(error => {

            console.error(
                "VIP buyers initialization error:",
                error
            );

        });
}


/* =========================================================
   CALCULATE VIP END DATE
========================================================= */

function getVipEndDate(vip) {

    if (!vip) {
        return 0;
    }


    /* -----------------------------------------
       USE STORED END DATE FIRST
    ----------------------------------------- */

    const storedEnd =
        numberValue(
            vip.endDate
        );


    if (storedEnd > 0) {
        return storedEnd;
    }


    /* -----------------------------------------
       CALCULATE IF MISSING
    ----------------------------------------- */

    const startDate =
        numberValue(
            vip.startDate ||
            vip.approvedAt ||
            vip.createdAt
        );


    const duration =
        numberValue(
            vip.duration ||
            vip.days ||
            vip.durationDays
        );


    if (
        startDate > 0 &&
        duration > 0
    ) {

        return (
            startDate +
            duration *
            24 *
            60 *
            60 *
            1000
        );
    }


    return 0;
}


/* =========================================================
   CHECK VIP ACTIVE / EXPIRED
========================================================= */

function isVipExpired(vip) {

    const endDate =
        getVipEndDate(vip);


    if (!endDate) {
        return false;
    }


    return Date.now() >= endDate;
}


function getVipDisplayStatus(vip) {

    const status =
        normalizeStatus(
            vip?.status
        );


    if (
        status === "rejected" ||
        status === "cancelled"
    ) {
        return status;
    }


    if (isVipExpired(vip)) {
        return "expired";
    }


    if (
        status === "active" ||
        status === "approved" ||
        !status
    ) {
        return "active";
    }


    return status;
}


/* =========================================================
   RENDER VIP BUYERS
========================================================= */

function renderVipBuyers() {

    const list =
        document.getElementById(
            "vipBuyerList"
        );

    const empty =
        document.getElementById(
            "emptyVipBuyer"
        );


    if (!list) {
        return;
    }


    /* -----------------------------------------
       COUNTERS
    ----------------------------------------- */

    const total =
        allVipBuyers.length;


    const active =
        allVipBuyers.filter(
            vip =>
                getVipDisplayStatus(vip) ===
                "active"
        ).length;


    const expired =
        allVipBuyers.filter(
            vip =>
                getVipDisplayStatus(vip) ===
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


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    const searchInput =
        document.getElementById(
            "vipBuyerSearch"
        );


    const filterSelect =
        document.getElementById(
            "vipBuyerFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const filter =
        filterSelect
            ? normalizeStatus(
                filterSelect.value
            )
            : "all";


    /* -----------------------------------------
       FILTER
    ----------------------------------------- */

    const filtered =
        allVipBuyers.filter(vip => {

            const status =
                getVipDisplayStatus(vip);


            if (
                filter &&
                filter !== "all" &&
                status !== filter
            ) {
                return false;
            }


            if (!search) {
                return true;
            }


            const uid =
                String(
                    vip.uid ||
                    vip.userId ||
                    ""
                ).toLowerCase();


            const vipId =
                String(
                    vip.id ||
                    ""
                ).toLowerCase();


            const vipName =
                String(
                    vip.vipName ||
                    vip.name ||
                    vip.planName ||
                    ""
                ).toLowerCase();


            const user =
                vipBuyerUsers[
                    vip.uid ||
                    vip.userId
                ] || {};


            const userName =
                String(
                    user.name ||
                    user.fullName ||
                    user.username ||
                    ""
                ).toLowerCase();


            const email =
                String(
                    user.email ||
                    ""
                ).toLowerCase();


            const phone =
                String(
                    user.phone ||
                    user.phoneNumber ||
                    ""
                ).toLowerCase();


            return (
                uid.includes(search) ||
                vipId.includes(search) ||
                vipName.includes(search) ||
                userName.includes(search) ||
                email.includes(search) ||
                phone.includes(search)
            );
        });


    /* -----------------------------------------
       EMPTY
    ----------------------------------------- */

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


    /* -----------------------------------------
       HTML
    ----------------------------------------- */

    list.innerHTML =
        filtered
            .map(vip =>
                renderVipBuyerCard(
                    vip,
                    vipBuyerUsers[
                        vip.uid ||
                        vip.userId
                    ] || {}
                )
            )
            .join("");
}


/* =========================================================
   RENDER VIP BUYER CARD
========================================================= */

function renderVipBuyerCard(
    vip,
    user = {}
) {

    const id =
        vip.id || "";


    const uid =
        vip.uid ||
        vip.userId ||
        "";


    const vipName =
        vip.vipName ||
        vip.name ||
        vip.planName ||
        "VIP Plan";


    const price =
        numberValue(
            vip.price ??
            vip.vipPrice ??
            vip.amount
        );


    const dailyIncome =
        numberValue(
            vip.dailyIncome ??
            vip.daily ??
            vip.dailyProfit
        );


    const totalProfit =
        numberValue(
            vip.totalProfit ??
            vip.profit ??
            vip.totalEarning
        );


    const duration =
        numberValue(
            vip.duration ??
            vip.days ??
            vip.durationDays
        );


    const claimedAmount =
        numberValue(
            vip.claimedAmount ??
            vip.claimed ??
            vip.totalClaimed
        );


    const totalEarned =
        numberValue(
            vip.totalEarned ??
            vip.earned ??
            vip.profitEarned
        );


    const claimCount =
        numberValue(
            vip.claimCount ??
            vip.claims
        );


    const startDate =
        numberValue(
            vip.startDate ||
            vip.approvedAt ||
            vip.createdAt
        );


    const lastClaim =
        numberValue(
            vip.lastClaim ||
            vip.lastClaimAt
        );


    const endDate =
        getVipEndDate(vip);


    const approvedAt =
        numberValue(
            vip.approvedAt
        );


    const status =
        getVipDisplayStatus(vip);


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
        "";


    const photo =
        user.photoURL ||
        user.photoUrl ||
        user.profileImage ||
        user.photo ||
        "";


    const safePhoto =
        escapeHTML(photo);


    const photoHTML =
        safePhoto
            ? `
                <img
                    src="${safePhoto}"
                    alt="User"
                    class="vip-buyer-photo"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="vip-buyer-photo-fallback"
                    style="display:none;"
                >
                    <i class="fa-solid fa-user"></i>
                </div>
              `
            : `
                <div class="vip-buyer-photo-fallback">
                    <i class="fa-solid fa-user"></i>
                </div>
              `;


    const statusLabel =
        status === "expired"
            ? "Expired"
            : status === "active"
                ? "Active"
                : status;


    /* -----------------------------------------
       CLAIM PROGRESS
    ----------------------------------------- */

    let progressPercent = 0;


    if (
        totalProfit > 0 &&
        claimedAmount > 0
    ) {

        progressPercent =
            Math.min(
                100,
                (
                    claimedAmount /
                    totalProfit
                ) * 100
            );
    }


    /* -----------------------------------------
       EXPIRATION
    ----------------------------------------- */

    const expirationText =
        endDate
            ? formatDate(endDate)
            : "—";


    /* -----------------------------------------
       LAST CLAIM
    ----------------------------------------- */

    const lastClaimText =
        lastClaim
            ? formatDate(lastClaim)
            : "Not claimed yet";


    return `
        <div
            class="vip-buyer-card"
            data-id="${escapeHTML(id)}"
            data-status="${escapeHTML(status)}"
        >

            <!-- =====================================
                 HEADER
            ====================================== -->

            <div class="vip-buyer-header">

                <div class="vip-buyer-user">

                    <div class="vip-buyer-avatar">
                        ${photoHTML}
                    </div>


                    <div class="vip-buyer-user-details">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        ${
                            phone
                                ? `
                                    <small>
                                        <i class="fa-solid fa-phone"></i>
                                        ${escapeHTML(phone)}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <span
                    class="vip-buyer-status status-${escapeHTML(status)}"
                >
                    ${escapeHTML(statusLabel)}
                </span>

            </div>


            <!-- =====================================
                 VIP NAME
            ====================================== -->

            <div class="vip-buyer-plan">

                <i class="fa-solid fa-crown"></i>

                <strong>
                    ${escapeHTML(vipName)}
                </strong>

            </div>


            <!-- =====================================
                 FINANCIAL DATA
            ====================================== -->

            <div class="vip-buyer-grid">

                <div class="vip-buyer-info">

                    <span>
                        <i class="fa-solid fa-money-bill-wave"></i>
                        Price
                    </span>

                    <strong>
                        ${formatMoney(price)}
                    </strong>

                </div>


                <div class="vip-buyer-info">

                    <span>
                        <i class="fa-solid fa-coins"></i>
                        Daily Income
                    </span>

                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>

                </div>


                <div class="vip-buyer-info">

                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profit
                    </span>

                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>

                </div>


                <div class="vip-buyer-info">

                    <span>
                        <i class="fa-solid fa-calendar-days"></i>
                        Duration
                    </span>

                    <strong>
                        ${
                            duration > 0
                                ? `${duration} Days`
                                : "—"
                        }
                    </strong>

                </div>

            </div>


            <!-- =====================================
                 CLAIM INFORMATION
            ====================================== -->

            <div class="vip-buyer-earnings">

                <div class="vip-earning-row">

                    <span>
                        Claimed Amount
                    </span>

                    <strong>
                        ${formatMoney(claimedAmount)}
                    </strong>

                </div>


                <div class="vip-earning-row">

                    <span>
                        Total Earned
                    </span>

                    <strong>
                        ${formatMoney(totalEarned)}
                    </strong>

                </div>


                <div class="vip-earning-row">

                    <span>
                        Claim Count
                    </span>

                    <strong>
                        ${claimCount}
                    </strong>

                </div>


                <div class="vip-progress">

                    <div
                        class="vip-progress-bar"
                        style="width:${progressPercent.toFixed(2)}%;"
                    ></div>

                </div>

            </div>


            <!-- =====================================
                 DATES
            ====================================== -->

            <div class="vip-buyer-dates">

                <div class="vip-date-row">

                    <span>
                        <i class="fa-solid fa-play"></i>
                        Started
                    </span>

                    <strong>
                        ${
                            startDate
                                ? formatDate(startDate)
                                : "—"
                        }
                    </strong>

                </div>


                <div class="vip-date-row">

                    <span>
                        <i class="fa-solid fa-clock"></i>
                        Last Claim
                    </span>

                    <strong>
                        ${escapeHTML(lastClaimText)}
                    </strong>

                </div>


                <div class="vip-date-row">

                    <span>
                        <i class="fa-solid fa-hourglass-end"></i>
                        Expires
                    </span>

                    <strong>
                        ${escapeHTML(expirationText)}
                    </strong>

                </div>


                <div class="vip-date-row">

                    <span>
                        <i class="fa-solid fa-check-circle"></i>
                        Approved
                    </span>

                    <strong>
                        ${
                            approvedAt
                                ? formatDate(approvedAt)
                                : "—"
                        }
                    </strong>

                </div>

            </div>


            <!-- =====================================
                 IDENTIFIERS
            ====================================== -->

            <div class="vip-buyer-identifiers">

                <div class="vip-identifier-row">

                    <span>
                        <i class="fa-solid fa-fingerprint"></i>
                        User UID
                    </span>

                    <strong>
                        ${escapeHTML(uid || "—")}
                    </strong>

                </div>


                <div class="vip-identifier-row">

                    <span>
                        <i class="fa-solid fa-hashtag"></i>
                        VIP Buyer ID
                    </span>

                    <strong>
                        ${escapeHTML(id || "—")}
                    </strong>

                </div>


                ${
                    vip.purchaseRequestId
                        ? `
                            <div class="vip-identifier-row">

                                <span>
                                    <i class="fa-solid fa-file-invoice"></i>
                                    Request ID
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        vip.purchaseRequestId
                                    )}
                                </strong>

                            </div>
                          `
                        : ""
                }

            </div>

        </div>
    `;
}


/* =========================================================
   VIP BUYER SEARCH / FILTER
========================================================= */

function activateVipBuyerSearch() {

    const search =
        document.getElementById(
            "vipBuyerSearch"
        );


    const filter =
        document.getElementById(
            "vipBuyerFilter"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound = "true";

        search.addEventListener(
            "input",
            renderVipBuyers
        );
    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound = "true";

        filter.addEventListener(
            "change",
            renderVipBuyers
        );
    }
}


/* =========================================================
   INITIALIZE VIP BUYERS PAGE
========================================================= */

function initializeVipBuyerPage() {

    activateVipBuyerSearch();

    renderVipBuyers();
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadVipBuyers =
    loadVipBuyers;

window.renderVipBuyers =
    renderVipBuyers;

window.renderVipBuyerCard =
    renderVipBuyerCard;

window.activateVipBuyerSearch =
    activateVipBuyerSearch;

window.initializeVipBuyerPage =
    initializeVipBuyerPage;

window.getVipEndDate =
    getVipEndDate;

window.isVipExpired =
    isVipExpired;

window.getVipDisplayStatus =
    getVipDisplayStatus;


/* =========================================================
   AUTO INITIALIZATION
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeVipBuyerPage();

        }
    );

} else {

    initializeVipBuyerPage();
}

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 10
   USERS MANAGEMENT
   CURRENCY: RWF
========================================================= */


/* =========================================================
   USERS DATA
========================================================= */

let allUsers = {};


/* =========================================================
   LOAD USERS
========================================================= */

function loadUsers() {

    if (!window.adminState || !window.adminState.ready) {
        return;
    }

    /* -----------------------------------------
       PREVENT DUPLICATE LISTENER
    ----------------------------------------- */

    if (!listeners.usersPage) {

        listeners.usersPage = onValue(
            ref(db, "users"),
            snapshot => {

                allUsers = snapshot.val() || {};

                renderUsers();

            },
            error => {

                console.error(
                    "Users listener error:",
                    error
                );

                allUsers = {};

                renderUsers();

                showToast(
                    "Failed to load users.",
                    "error"
                );

            }
        );

    } else {

        renderUsers();

    }
}


/* =========================================================
   GET USER DISPLAY NAME
========================================================= */

function getUserDisplayName(user) {

    if (!user || typeof user !== "object") {
        return "Unknown User";
    }

    return (
        user.fullName ||
        user.name ||
        user.username ||
        user.displayName ||
        "Unknown User"
    );

}


/* =========================================================
   GET USER EMAIL
========================================================= */

function getUserEmail(user) {

    if (!user || typeof user !== "object") {
        return "No email";
    }

    return (
        user.email ||
        user.emailAddress ||
        "No email"
    );

}


/* =========================================================
   GET USER PHONE
========================================================= */

function getUserPhone(user) {

    if (!user || typeof user !== "object") {
        return "No phone";
    }

    return (
        user.phone ||
        user.phoneNumber ||
        user.mobile ||
        user.mobileNumber ||
        "No phone"
    );

}


/* =========================================================
   GET USER PHOTO
========================================================= */

function getUserPhoto(user) {

    if (!user || typeof user !== "object") {
        return "";
    }

    return (
        user.photoURL ||
        user.photoUrl ||
        user.profilePhoto ||
        user.photo ||
        user.avatar ||
        ""
    );

}


/* =========================================================
   GET USER CREATED DATE
========================================================= */

function getUserCreatedAt(user) {

    if (!user || typeof user !== "object") {
        return null;
    }

    return (
        user.createdAt ||
        user.registeredAt ||
        user.dateCreated ||
        user.timestamp ||
        null
    );

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    const list = document.getElementById("usersList");
    const empty = document.getElementById("emptyUsers");
    const searchInput = document.getElementById("userSearch");

    if (!list) {
        return;
    }

    const searchValue = (
        searchInput?.value || ""
    )
        .trim()
        .toLowerCase();


    /* -----------------------------------------
       CONVERT OBJECT TO ARRAY
    ----------------------------------------- */

    let users = Object.entries(allUsers || {})
        .map(([uid, user]) => {

            return {
                uid,
                ...(user || {})
            };

        });


    /* -----------------------------------------
       SORT NEWEST FIRST
    ----------------------------------------- */

    users.sort((a, b) => {

        const dateA =
            Number(
                a.createdAt ||
                a.registeredAt ||
                a.dateCreated ||
                0
            );

        const dateB =
            Number(
                b.createdAt ||
                b.registeredAt ||
                b.dateCreated ||
                0
            );

        return dateB - dateA;

    });


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    if (searchValue) {

        users = users.filter(user => {

            const searchableText = [

                user.uid,

                user.fullName,
                user.name,
                user.username,
                user.displayName,

                user.email,
                user.emailAddress,

                user.phone,
                user.phoneNumber,
                user.mobile,
                user.mobileNumber,

                user.referralCode,
                user.referredBy,

                user.status

            ]
                .filter(value =>
                    value !== undefined &&
                    value !== null
                )
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                searchValue
            );

        });

    }


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    if (!users.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
            empty.textContent = searchValue
                ? "No users found."
                : "No users available.";
        }

        return;

    }


    if (empty) {
        empty.style.display = "none";
    }


    /* -----------------------------------------
       RENDER
    ----------------------------------------- */

    list.innerHTML = users
        .map(user =>
            renderUserCard(user)
        )
        .join("");


    activateUserCopyButtons();

}


/* =========================================================
   RENDER SINGLE USER CARD
========================================================= */

function renderUserCard(user) {

    const uid = String(
        user.uid || ""
    );

    const name = escapeHTML(
        getUserDisplayName(user)
    );

    const email = escapeHTML(
        getUserEmail(user)
    );

    const phone = escapeHTML(
        getUserPhone(user)
    );

    const photo = getUserPhoto(user);

    const balance = numberValue(
        user.balance
    );

    const totalDeposits = numberValue(
        user.totalDeposits
    );

    const totalWithdrawals = numberValue(
        user.totalWithdrawals
    );

    const referralEarnings = numberValue(
        user.referralEarnings
    );

    const totalProfits = numberValue(
        user.totalProfits ||
        user.totalProfit
    );

    const totalTransactions = numberValue(
        user.totalTransactions
    );

    const totalVipPurchases = numberValue(
        user.totalVipPurchases
    );

    const referralCode = escapeHTML(
        user.referralCode ||
        "N/A"
    );

    const referredBy = escapeHTML(
        user.referredBy ||
        "None"
    );

    const createdAt = formatDate(
        getUserCreatedAt(user)
    );

    const status = String(
        user.status ||
        "active"
    ).toLowerCase();


    /* -----------------------------------------
       PHOTO
    ----------------------------------------- */

    let photoHTML = "";

    if (photo) {

        photoHTML = `
            <img
                src="${escapeHTML(photo)}"
                alt="User"
                class="user-avatar"
                loading="lazy"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="user-avatar-fallback"
                style="display:none;"
            >
                <i class="fa-solid fa-user"></i>
            </div>
        `;

    } else {

        photoHTML = `
            <div class="user-avatar-fallback">
                <i class="fa-solid fa-user"></i>
            </div>
        `;

    }


    /* -----------------------------------------
       USER CARD
    ----------------------------------------- */

    return `

        <div
            class="user-card"
            data-uid="${escapeHTML(uid)}"
            data-search="${escapeHTML(
                [
                    uid,
                    getUserDisplayName(user),
                    getUserEmail(user),
                    getUserPhone(user),
                    referralCode,
                    referredBy
                ]
                    .filter(Boolean)
                    .join(" ")
            )}"
        >

            <!-- ==============================
                 USER HEADER
            =============================== -->

            <div class="user-card-header">

                <div class="user-profile">

                    ${photoHTML}

                    <div class="user-main-info">

                        <h3>
                            ${name}
                        </h3>

                        <p>
                            <i class="fa-solid fa-envelope"></i>
                            ${email}
                        </p>

                        <p>
                            <i class="fa-solid fa-phone"></i>
                            ${phone}
                        </p>

                    </div>

                </div>


                <span
                    class="user-status ${escapeHTML(status)}"
                >
                    ${escapeHTML(
                        status.charAt(0).toUpperCase() +
                        status.slice(1)
                    )}
                </span>

            </div>


            <!-- ==============================
                 BALANCE
            =============================== -->

            <div class="user-balance-box">

                <span>
                    Available Balance
                </span>

                <strong>
                    ${formatMoney(balance)}
                </strong>

            </div>


            <!-- ==============================
                 USER STATISTICS
            =============================== -->

            <div class="user-stats-grid">

                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-arrow-down"></i>
                        Deposits
                    </span>

                    <strong>
                        ${formatMoney(totalDeposits)}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-arrow-up"></i>
                        Withdrawals
                    </span>

                    <strong>
                        ${formatMoney(totalWithdrawals)}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-gift"></i>
                        Referral Earnings
                    </span>

                    <strong>
                        ${formatMoney(referralEarnings)}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profits
                    </span>

                    <strong>
                        ${formatMoney(totalProfits)}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-receipt"></i>
                        Transactions
                    </span>

                    <strong>
                        ${totalTransactions.toLocaleString("en-US")}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-crown"></i>
                        VIP Purchases
                    </span>

                    <strong>
                        ${totalVipPurchases.toLocaleString("en-US")}
                    </strong>

                </div>

            </div>


            <!-- ==============================
                 REFERRAL INFORMATION
            =============================== -->

            <div class="user-referral-box">

                <div>

                    <span>
                        Referral Code
                    </span>

                    <strong>
                        ${referralCode}
                    </strong>

                </div>


                <div>

                    <span>
                        Referred By
                    </span>

                    <strong>
                        ${referredBy}
                    </strong>

                </div>

            </div>


            <!-- ==============================
                 ACCOUNT INFORMATION
            =============================== -->

            <div class="user-account-info">

                <div>

                    <span>
                        <i class="fa-solid fa-calendar"></i>
                        Registered
                    </span>

                    <strong>
                        ${escapeHTML(createdAt)}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-fingerprint"></i>
                        UID
                    </span>

                    <div class="uid-row">

                        <code>
                            ${escapeHTML(uid)}
                        </code>

                        <button
                            type="button"
                            class="copy-uid-btn"
                            data-uid="${escapeHTML(uid)}"
                            title="Copy UID"
                        >

                            <i class="fa-solid fa-copy"></i>

                        </button>

                    </div>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   COPY UID
========================================================= */

function activateUserCopyButtons() {

    const buttons = document.querySelectorAll(
        ".copy-uid-btn"
    );


    buttons.forEach(button => {

        if (button.dataset.bound === "true") {
            return;
        }

        button.dataset.bound = "true";


        button.addEventListener(
            "click",
            async () => {

                const uid =
                    button.dataset.uid || "";

                if (!uid) {
                    return;
                }


                try {

                    await navigator.clipboard.writeText(
                        uid
                    );


                    if (typeof showToast === "function") {

                        showToast(
                            "UID copied successfully.",
                            "success"
                        );

                    }


                    const originalHTML =
                        button.innerHTML;


                    button.innerHTML =
                        `<i class="fa-solid fa-check"></i>`;


                    setTimeout(() => {

                        button.innerHTML =
                            originalHTML;

                    }, 1200);


                } catch (error) {

                    console.error(
                        "Copy UID error:",
                        error
                    );


                    /* --------------------------------
                       FALLBACK COPY
                    -------------------------------- */

                    try {

                        const textarea =
                            document.createElement(
                                "textarea"
                            );

                        textarea.value = uid;

                        textarea.style.position =
                            "fixed";

                        textarea.style.opacity = "0";

                        document.body.appendChild(
                            textarea
                        );

                        textarea.select();

                        document.execCommand(
                            "copy"
                        );

                        textarea.remove();


                        if (
                            typeof showToast ===
                            "function"
                        ) {

                            showToast(
                                "UID copied successfully.",
                                "success"
                            );

                        }

                    } catch (fallbackError) {

                        console.error(
                            "Fallback copy failed:",
                            fallbackError
                        );

                        if (
                            typeof showToast ===
                            "function"
                        ) {

                            showToast(
                                "Failed to copy UID.",
                                "error"
                            );

                        }

                    }

                }

            }
        );

    });

}


/* =========================================================
   USER SEARCH
========================================================= */

function activateUserSearch() {

    const searchInput =
        document.getElementById(
            "userSearch"
        );

    if (!searchInput) {
        return;
    }


    if (
        searchInput.dataset.bound ===
        "true"
    ) {
        return;
    }


    searchInput.dataset.bound = "true";


    searchInput.addEventListener(
        "input",
        () => {

            renderUsers();

        }
    );

}


/* =========================================================
   INITIALIZE USERS PAGE
========================================================= */

function initializeUsersPage() {

    activateUserSearch();

    loadUsers();

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.allUsers = allUsers;

window.loadUsers =
    loadUsers;

window.renderUsers =
    renderUsers;

window.renderUserCard =
    renderUserCard;

window.getUserDisplayName =
    getUserDisplayName;

window.getUserEmail =
    getUserEmail;

window.getUserPhone =
    getUserPhone;

window.getUserPhoto =
    getUserPhoto;

window.activateUserSearch =
    activateUserSearch;

window.initializeUsersPage =
    initializeUsersPage;


/* =========================================================
   AUTO INITIALIZE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeUsersPage();

        },
        {
            once: true
        }
    );

} else {

    initializeUsersPage();

}


/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 11
   TRANSACTIONS MANAGEMENT
   CURRENCY: RWF
========================================================= */


/* =========================================================
   TRANSACTIONS DATA
========================================================= */

let allTransactions = {};


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

function loadTransactions() {

    if (!window.adminState || !window.adminState.ready) {
        return;
    }


    /* -----------------------------------------
       PREVENT DUPLICATE LISTENER
    ----------------------------------------- */

    if (!listeners.transactionsPage) {

        listeners.transactionsPage = onValue(
            ref(db, "transactions"),
            snapshot => {

                allTransactions =
                    snapshot.val() || {};

                renderTransactions();

            },
            error => {

                console.error(
                    "Transactions listener error:",
                    error
                );

                allTransactions = {};

                renderTransactions();

                if (
                    typeof showToast ===
                    "function"
                ) {

                    showToast(
                        "Failed to load transactions.",
                        "error"
                    );

                }

            }
        );

    } else {

        renderTransactions();

    }

}


/* =========================================================
   TRANSACTION TYPE LABEL
========================================================= */

function getTransactionTypeLabel(type) {

    const value = String(
        type || ""
    ).toLowerCase();


    const labels = {

        deposit: "Deposit",

        withdraw: "Withdrawal",

        withdrawal: "Withdrawal",

        vip: "VIP Purchase",

        profit: "Profit",

        bonus: "Bonus",

        referral: "Referral Bonus",

        registration_bonus:
            "Registration Bonus",

        vip_profit:
            "VIP Profit"

    };


    return labels[value] ||
        (
            value
                ? value
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, letter =>
                        letter.toUpperCase()
                    )
                : "Transaction"
        );

}


/* =========================================================
   TRANSACTION STATUS LABEL
========================================================= */

function getTransactionStatusLabel(status) {

    const value = String(
        status || "pending"
    ).toLowerCase();


    const labels = {

        pending: "Pending",

        processing: "Processing",

        approved: "Approved",

        completed: "Completed",

        rejected: "Rejected",

        cancelled: "Cancelled",

        failed: "Failed",

        processing_error:
            "Processing Error"

    };


    return labels[value] ||
        (
            value
                .replace(/_/g, " ")
                .replace(/\b\w/g, letter =>
                    letter.toUpperCase()
                )
        );

}


/* =========================================================
   TRANSACTION STATUS CLASS
========================================================= */

function getTransactionStatusClass(status) {

    const value = String(
        status || "pending"
    ).toLowerCase();


    switch (value) {

        case "approved":
        case "completed":
            return "approved";

        case "rejected":
        case "cancelled":
        case "failed":
            return "rejected";

        case "processing":
            return "processing";

        case "processing_error":
            return "error";

        case "pending":
        default:
            return "pending";

    }

}


/* =========================================================
   TRANSACTION TYPE CLASS
========================================================= */

function getTransactionTypeClass(type) {

    const value = String(
        type || ""
    ).toLowerCase();


    switch (value) {

        case "deposit":
            return "deposit";

        case "withdraw":
        case "withdrawal":
            return "withdraw";

        case "vip":
            return "vip";

        case "profit":
        case "vip_profit":
            return "profit";

        case "bonus":
        case "referral":
        case "registration_bonus":
            return "bonus";

        default:
            return "default";

    }

}


/* =========================================================
   TRANSACTION DATE
========================================================= */

function getTransactionDate(transaction) {

    if (
        !transaction ||
        typeof transaction !== "object"
    ) {

        return null;

    }


    return (
        transaction.createdAt ||
        transaction.approvedAt ||
        transaction.completedAt ||
        transaction.timestamp ||
        transaction.date ||
        null
    );

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

    const list =
        document.getElementById(
            "transactionList"
        );

    const empty =
        document.getElementById(
            "emptyTransaction"
        );

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );

    const filter =
        document.getElementById(
            "transactionFilter"
        );


    if (!list) {
        return;
    }


    const searchValue = (
        searchInput?.value || ""
    )
        .trim()
        .toLowerCase();


    const filterValue = String(
        filter?.value || "all"
    ).toLowerCase();


    /* -----------------------------------------
       OBJECT → ARRAY
    ----------------------------------------- */

    let transactions =
        Object.entries(
            allTransactions || {}
        )
        .map(([id, transaction]) => {

            return {

                id,

                ...(transaction || {})

            };

        });


    /* -----------------------------------------
       NEWEST FIRST
    ----------------------------------------- */

    transactions.sort((a, b) => {

        const dateA =
            Number(
                getTransactionDate(a) || 0
            );

        const dateB =
            Number(
                getTransactionDate(b) || 0
            );

        return dateB - dateA;

    });


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    if (searchValue) {

        transactions =
            transactions.filter(
                transaction => {

                    const searchableText = [

                        transaction.id,

                        transaction.uid,
                        transaction.userId,

                        transaction.type,
                        transaction.status,

                        transaction.paymentMethod,
                        transaction.method,

                        transaction.phone,
                        transaction.receiverPhone,

                        transaction.transactionId,

                        transaction.depositRequestId,

                        transaction.withdrawRequestId,

                        transaction.vipBuyerId,

                        transaction.purchaseRequestId,

                        transaction.vipName,

                        transaction.adminEmail,

                        transaction.approvedBy

                    ]
                        .filter(value =>
                            value !== undefined &&
                            value !== null
                        )
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        searchValue
                    );

                }
            );

    }


    /* -----------------------------------------
       FILTER
    ----------------------------------------- */

    if (
        filterValue &&
        filterValue !== "all"
    ) {

        transactions =
            transactions.filter(
                transaction => {

                    const status =
                        String(
                            transaction.status ||
                            ""
                        ).toLowerCase();


                    const type =
                        String(
                            transaction.type ||
                            ""
                        ).toLowerCase();


                    /*
                     * Support both:
                     * status filters
                     * type filters
                     */

                    return (
                        status === filterValue ||
                        type === filterValue ||
                        (
                            filterValue ===
                            "withdrawal" &&
                            type === "withdraw"
                        ) ||
                        (
                            filterValue ===
                            "withdraw" &&
                            type === "withdrawal"
                        )
                    );

                }
            );

    }


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    if (!transactions.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.textContent =
                searchValue ||
                (
                    filterValue &&
                    filterValue !== "all"
                )
                    ? "No transactions found."
                    : "No transactions available.";

        }

        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    /* -----------------------------------------
       RENDER
    ----------------------------------------- */

    list.innerHTML =
        transactions
            .map(transaction =>
                renderTransactionCard(
                    transaction
                )
            )
            .join("");

}


/* =========================================================
   RENDER TRANSACTION CARD
========================================================= */

function renderTransactionCard(
    transaction
) {

    const id = String(
        transaction.id || ""
    );

    const uid = String(
        transaction.uid ||
        transaction.userId ||
        ""
    );


    const type =
        String(
            transaction.type ||
            "transaction"
        ).toLowerCase();


    const status =
        String(
            transaction.status ||
            "pending"
        ).toLowerCase();


    const amount =
        numberValue(
            transaction.amount
        );


    const typeLabel =
        getTransactionTypeLabel(
            type
        );


    const statusLabel =
        getTransactionStatusLabel(
            status
        );


    const typeClass =
        getTransactionTypeClass(
            type
        );


    const statusClass =
        getTransactionStatusClass(
            status
        );


    const paymentMethod =
        transaction.paymentMethod ||
        transaction.method ||
        "N/A";


    const phone =
        transaction.phone ||
        transaction.receiverPhone ||
        transaction.withdrawPhone ||
        "N/A";


    const transactionId =
        transaction.transactionId ||
        "N/A";


    const date =
        formatDate(
            getTransactionDate(
                transaction
            )
        );


    const approvedAt =
        transaction.approvedAt
            ? formatDate(
                transaction.approvedAt
            )
            : "N/A";


    const vipName =
        transaction.vipName ||
        transaction.name ||
        "";


    const depositRequestId =
        transaction.depositRequestId ||
        "";


    const withdrawRequestId =
        transaction.withdrawRequestId ||
        "";


    const vipBuyerId =
        transaction.vipBuyerId ||
        "";


    const purchaseRequestId =
        transaction.purchaseRequestId ||
        "";


    return `

        <div
            class="transaction-card
                   transaction-${escapeHTML(typeClass)}
                   status-${escapeHTML(statusClass)}"
            data-transaction-id="${escapeHTML(id)}"
            data-search="${escapeHTML(
                [
                    id,
                    uid,
                    type,
                    status,
                    paymentMethod,
                    phone,
                    transactionId,
                    depositRequestId,
                    withdrawRequestId,
                    vipBuyerId,
                    purchaseRequestId,
                    vipName
                ]
                    .filter(Boolean)
                    .join(" ")
            )}"
            data-type="${escapeHTML(type)}"
            data-status="${escapeHTML(status)}"
        >


            <!-- ==============================
                 HEADER
            =============================== -->

            <div class="transaction-card-header">

                <div class="transaction-type">

                    <div class="
                        transaction-icon
                        ${escapeHTML(typeClass)}
                    ">

                        <i class="${

                            type === "deposit"

                                ? "fa-solid fa-arrow-down"

                            : (
                                type === "withdraw" ||
                                type === "withdrawal"
                            )

                                ? "fa-solid fa-arrow-up"

                            : type === "vip"

                                ? "fa-solid fa-crown"

                            : (
                                type === "profit" ||
                                type === "vip_profit"
                            )

                                ? "fa-solid fa-chart-line"

                            : (
                                type === "bonus" ||
                                type === "referral" ||
                                type === "registration_bonus"
                            )

                                ? "fa-solid fa-gift"

                            : "fa-solid fa-receipt"

                        }"></i>

                    </div>


                    <div>

                        <h3>
                            ${escapeHTML(
                                typeLabel
                            )}
                        </h3>

                        <span>
                            ${escapeHTML(
                                date
                            )}
                        </span>

                    </div>

                </div>


                <span
                    class="
                        transaction-status
                        ${escapeHTML(statusClass)}
                    "
                >
                    ${escapeHTML(
                        statusLabel
                    )}
                </span>

            </div>


            <!-- ==============================
                 AMOUNT
            =============================== -->

            <div class="transaction-amount-box">

                <span>
                    Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <!-- ==============================
                 DETAILS
            =============================== -->

            <div class="transaction-details">


                <!-- USER UID -->

                <div class="transaction-detail">

                    <span>
                        <i class="
                            fa-solid
                            fa-fingerprint
                        "></i>

                        User UID
                    </span>

                    <strong>
                        ${escapeHTML(
                            uid || "N/A"
                        )}
                    </strong>

                </div>


                <!-- PAYMENT METHOD -->

                <div class="transaction-detail">

                    <span>
                        <i class="
                            fa-solid
                            fa-wallet
                        "></i>

                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(
                            String(
                                paymentMethod
                            )
                        )}
                    </strong>

                </div>


                <!-- PHONE -->

                <div class="transaction-detail">

                    <span>
                        <i class="
                            fa-solid
                            fa-phone
                        "></i>

                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(
                            String(phone)
                        )}
                    </strong>

                </div>


                <!-- TRANSACTION ID -->

                <div class="transaction-detail">

                    <span>
                        <i class="
                            fa-solid
                            fa-hashtag
                        "></i>

                        Payment Transaction ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            String(
                                transactionId
                            )
                        )}
                    </strong>

                </div>


                <!-- APPROVED DATE -->

                <div class="transaction-detail">

                    <span>
                        <i class="
                            fa-solid
                            fa-calendar-check
                        "></i>

                        Approved
                    </span>

                    <strong>
                        ${escapeHTML(
                            approvedAt
                        )}
                    </strong>

                </div>


            </div>


            <!-- ==============================
                 VIP INFORMATION
            =============================== -->

            ${
                vipName
                    ? `

                    <div class="transaction-extra">

                        <span>
                            VIP Plan
                        </span>

                        <strong>
                            ${escapeHTML(
                                String(vipName)
                            )}
                        </strong>

                    </div>

                    `
                    : ""
            }


            <!-- ==============================
                 REQUEST REFERENCES
            =============================== -->

            <div class="transaction-references">

                ${
                    depositRequestId
                        ? `

                        <div>

                            <span>
                                Deposit Request
                            </span>

                            <code>
                                ${escapeHTML(
                                    depositRequestId
                                )}
                            </code>

                        </div>

                        `
                        : ""
                }


                ${
                    withdrawRequestId
                        ? `

                        <div>

                            <span>
                                Withdraw Request
                            </span>

                            <code>
                                ${escapeHTML(
                                    withdrawRequestId
                                )}
                            </code>

                        </div>

                        `
                        : ""
                }


                ${
                    vipBuyerId
                        ? `

                        <div>

                            <span>
                                VIP Buyer
                            </span>

                            <code>
                                ${escapeHTML(
                                    vipBuyerId
                                )}
                            </code>

                        </div>

                        `
                        : ""
                }


                ${
                    purchaseRequestId
                        ? `

                        <div>

                            <span>
                                VIP Request
                            </span>

                            <code>
                                ${escapeHTML(
                                    purchaseRequestId
                                )}
                            </code>

                        </div>

                        `
                        : ""
                }

            </div>


            <!-- ==============================
                 TRANSACTION KEY
            =============================== -->

            <div class="transaction-footer">

                <span>
                    Transaction Key
                </span>

                <code>
                    ${escapeHTML(id)}
                </code>

            </div>

        </div>

    `;

}


/* =========================================================
   TRANSACTION SEARCH
========================================================= */

function activateTransactionSearch() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    if (!searchInput) {
        return;
    }


    if (
        searchInput.dataset.bound ===
        "true"
    ) {
        return;
    }


    searchInput.dataset.bound =
        "true";


    searchInput.addEventListener(
        "input",
        () => {

            renderTransactions();

        }
    );

}


/* =========================================================
   TRANSACTION FILTER
========================================================= */

function activateTransactionFilter() {

    const filter =
        document.getElementById(
            "transactionFilter"
        );


    if (!filter) {
        return;
    }


    if (
        filter.dataset.bound ===
        "true"
    ) {
        return;
    }


    filter.dataset.bound =
        "true";


    filter.addEventListener(
        "change",
        () => {

            renderTransactions();

        }
    );

}


/* =========================================================
   INITIALIZE TRANSACTIONS PAGE
========================================================= */

function initializeTransactionsPage() {

    activateTransactionSearch();

    activateTransactionFilter();

    loadTransactions();

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.allTransactions =
    allTransactions;

window.loadTransactions =
    loadTransactions;

window.renderTransactions =
    renderTransactions;

window.renderTransactionCard =
    renderTransactionCard;

window.getTransactionTypeLabel =
    getTransactionTypeLabel;

window.getTransactionStatusLabel =
    getTransactionStatusLabel;

window.getTransactionStatusClass =
    getTransactionStatusClass;

window.getTransactionTypeClass =
    getTransactionTypeClass;

window.activateTransactionSearch =
    activateTransactionSearch;

window.activateTransactionFilter =
    activateTransactionFilter;

window.initializeTransactionsPage =
    initializeTransactionsPage;


/* =========================================================
   AUTO INITIALIZE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeTransactionsPage();

        },
        {
            once: true
        }
    );

} else {

    initializeTransactionsPage();

}
