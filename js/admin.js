/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 1
   ADMIN AUTH + NAVIGATION + INITIALIZATION
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import { auth, db } from "./firebase.js";


/* =========================================================
   FIREBASE AUTH
========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


/* =========================================================
   FIREBASE REALTIME DATABASE
   IMPORTANT:
   These imports are required by Parts 4, 6 and 8.
========================================================= */

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
   ADMIN STATE
========================================================= */

let currentAdmin = null;

let adminReady = false;


/* =========================================================
   ADMIN READY PROMISE
========================================================= */

let resolveAdminReady;

const adminReadyPromise =
    new Promise(resolve => {

        resolveAdminReady = resolve;

    });


/* =========================================================
   GLOBAL LISTENER STORAGE
   IMPORTANT:
   Declare this ONLY ONCE in the whole admin.js.
========================================================= */

const listeners = {};


/* =========================================================
   GLOBAL ADMIN STATE
========================================================= */

window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    get readyPromise() {
        return adminReadyPromise;
    }

};


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

window.waitForAdmin = function () {

    if (adminReady && currentAdmin) {
        return Promise.resolve(currentAdmin);
    }

    return adminReadyPromise;

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const adminNameElement =
    document.getElementById("adminName");

const adminEmailElement =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const pageTitle =
    document.getElementById("pageTitle");


/* =========================================================
   MENU LINKS + PAGE SECTIONS
========================================================= */

const menuLinks =
    document.querySelectorAll(".menu-link");

const pageSections =
    document.querySelectorAll(".page-section");


/* =========================================================
   LOADING SCREEN
========================================================= */

function hideLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.classList.add("hidden");

    setTimeout(() => {

        loadingScreen.style.display = "none";

    }, 300);

}


function showLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.style.display = "flex";

    requestAnimationFrame(() => {

        loadingScreen.classList.remove("hidden");

    });

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setAdminText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        value === undefined ||
        value === null ||
        value === ""
            ? "-"
            : String(value);

}


/* =========================================================
   TOAST SYSTEM
========================================================= */

function adminEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById("toastContainer");


    /* -----------------------------------------
       FALLBACK
    ----------------------------------------- */

    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }


    const toast =
        document.createElement("div");


    toast.className =
        `toast toast-${String(type).toLowerCase()}`;


    let icon =
        "fa-circle-info";


    if (type === "success") {

        icon =
            "fa-circle-check";

    } else if (type === "error") {

        icon =
            "fa-circle-xmark";

    } else if (type === "warning") {

        icon =
            "fa-triangle-exclamation";

    }


    toast.innerHTML = `

        <div class="toast-icon">

            <i class="fa-solid ${icon}"></i>

        </div>

        <div class="toast-message">

            ${adminEscapeHTML(message)}

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

            if (toast.parentNode) {
                toast.remove();
            }

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


/* =========================================================
   GLOBAL TOAST
========================================================= */

window.showToast =
    showToast;


/* =========================================================
   NAVIGATION PAGE TITLES
========================================================= */

const pageTitles = {

    dashboard:
        "Dashboard",

    deposits:
        "Deposit Requests",

    withdraws:
        "Withdraw Requests",

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


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(pageName) {

    if (!pageName) {
        return;
    }


    /* -----------------------------------------
       HIDE ALL SECTIONS
    ----------------------------------------- */

    pageSections.forEach(section => {

        section.classList.remove("active");

        section.style.display = "none";

    });


    /* -----------------------------------------
       REMOVE ACTIVE MENU
    ----------------------------------------- */

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    /* -----------------------------------------
       FIND TARGET SECTION
    ----------------------------------------- */

    const targetSection =
        document.getElementById(
            `${pageName}Section`
        );


    if (!targetSection) {

        console.warn(
            `Page section not found: ${pageName}Section`
        );

        return;
    }


    /* -----------------------------------------
       SHOW TARGET SECTION
    ----------------------------------------- */

    targetSection.style.display =
        "block";

    targetSection.classList.add(
        "active"
    );


    /* -----------------------------------------
       ACTIVE MENU LINK
    ----------------------------------------- */

    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    /* -----------------------------------------
       PAGE TITLE
    ----------------------------------------- */

    const title =
        pageTitles[pageName] ||
        pageName;


    if (pageTitle) {

        pageTitle.textContent =
            title;

    }


    /* -----------------------------------------
       CLOSE MOBILE SIDEBAR
    ----------------------------------------- */

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    console.log(
        `Admin page opened: ${pageName}`
    );

}


/* =========================================================
   GLOBAL NAVIGATION
========================================================= */

window.openPage =
    openPage;


/* =========================================================
   MENU CLICK EVENTS
========================================================= */

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();


            const page =
                link.dataset.page;


            if (page) {

                openPage(page);

            }

        }
    );

});


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            if (!sidebar) {
                return;
            }

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                showLoadingScreen();

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                hideLoadingScreen();

                showToast(
                    "Failed to logout.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

            showLoadingScreen();


            /* -----------------------------------------
               USER NOT LOGGED IN
            ----------------------------------------- */

            if (!user) {

                console.warn(
                    "No authenticated user."
                );


                window.location.href =
                    "login.html";


                return;
            }


            console.log(
                "Authenticated UID:",
                user.uid
            );


            /* -----------------------------------------
               CHECK ADMIN RECORD
            ----------------------------------------- */

            const adminRef =
                ref(
                    db,
                    `admins/${user.uid}`
                );


            const adminSnapshot =
                await get(adminRef);


            /* -----------------------------------------
               NOT ADMIN
            ----------------------------------------- */

            if (!adminSnapshot.exists()) {

                console.warn(
                    "User is not an administrator."
                );


                showToast(
                    "Access denied. Administrator account required.",
                    "error"
                );


                await signOut(auth);


                window.location.href =
                    "login.html";


                return;
            }


            /* -----------------------------------------
               ADMIN DATA
            ----------------------------------------- */

            const adminData =
                adminSnapshot.val() || {};


            currentAdmin = {

                uid:
                    user.uid,

                email:
                    user.email ||
                    adminData.email ||
                    "",

                name:
                    adminData.name ||
                    adminData.fullName ||
                    adminData.displayName ||
                    user.displayName ||
                    user.email ||
                    "Administrator",

                ...adminData

            };


            adminReady =
                true;


            /* -----------------------------------------
               RESOLVE ADMIN PROMISE
            ----------------------------------------- */

            resolveAdminReady(
                currentAdmin
            );


            /* -----------------------------------------
               DISPLAY ADMIN INFO
            ----------------------------------------- */

            setAdminText(
                adminNameElement,
                currentAdmin.name
            );


            setAdminText(
                adminEmailElement,
                currentAdmin.email
            );


            /* -----------------------------------------
               HIDE LOADING
            ----------------------------------------- */

            hideLoadingScreen();


            console.log(
                "Money Vault Admin authenticated:",
                currentAdmin
            );


            /* =================================================
               INITIALIZE ADMIN PAGES
            ================================================= */


            /* -----------------------------------------
               DASHBOARD
            ----------------------------------------- */

            if (
                typeof window.loadDashboard ===
                "function"
            ) {

                window.loadDashboard();

            }


            /* -----------------------------------------
               DEPOSITS
            ----------------------------------------- */

            if (
                typeof window.loadDeposits ===
                "function"
            ) {

                window.loadDeposits();

            }


            /* -----------------------------------------
               WITHDRAWS
            ----------------------------------------- */

            if (
                typeof window.loadWithdraws ===
                "function"
            ) {

                window.loadWithdraws();

            }


            /* -----------------------------------------
               VIP REQUESTS
            ----------------------------------------- */

            if (
                typeof window.loadVipRequests ===
                "function"
            ) {

                window.loadVipRequests();

            }


            /* -----------------------------------------
               VIP BUYERS
            ----------------------------------------- */

            if (
                typeof window.loadVipBuyers ===
                "function"
            ) {

                window.loadVipBuyers();

            }


            /* -----------------------------------------
               BONUS REQUESTS
            ----------------------------------------- */

            if (
                typeof window.loadBonusRequests ===
                "function"
            ) {

                window.loadBonusRequests();

            }


            /* -----------------------------------------
               USERS
            ----------------------------------------- */

            if (
                typeof window.loadUsers ===
                "function"
            ) {

                window.loadUsers();

            }


            /* -----------------------------------------
               TRANSACTIONS
            ----------------------------------------- */

            if (
                typeof window.loadTransactions ===
                "function"
            ) {

                window.loadTransactions();

            }


            /* -----------------------------------------
               QUICK ACTIONS
            ----------------------------------------- */

            if (
                typeof window.initializeQuickActions ===
                "function"
            ) {

                window.initializeQuickActions();

            }


            /* -----------------------------------------
               SETTINGS
            ----------------------------------------- */

            if (
                typeof window.loadSettings ===
                "function"
            ) {

                window.loadSettings();

            }


        } catch (error) {

            console.error(
                "Admin authentication error:",
                error
            );


            adminReady =
                false;


            hideLoadingScreen();


            showToast(
                error.message ||
                "Unable to initialize administrator panel.",
                "error"
            );


            /* -----------------------------------------
               SECURITY:
               If admin verification failed,
               return to login.
            ----------------------------------------- */

            if (
                !currentAdmin
            ) {

                try {

                    await signOut(auth);

                } catch (signOutError) {

                    console.error(
                        "Sign out error:",
                        signOutError
                    );

                }


                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1500);

            }

        }

    }
);


/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        openPage(
            "dashboard"
        );

    }
);


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.currentAdmin =
    currentAdmin;


/* =========================================================
   ADMIN.JS PART 1 READY
========================================================= */

console.log(
    "Money Vault Admin.js Part 1 loaded successfully."
);

console.log(
    "Currency: RWF / FRW"
);

console.log(
    "Firebase Database imports: ref, get, onValue, update, set, push, runTransaction"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2
   DASHBOARD + DATA LISTENERS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   COMMON DASHBOARD HELPERS
========================================================= */

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   SAFE NUMBER
========================================================= */

function numberValue(value) {

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


/* =========================================================
   FORMAT MONEY
   MONEY VAULT = RWF / FRW
========================================================= */

function formatMoney(amount) {

    return (
        numberValue(amount).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }) + " RWF"
    );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    const value = numberValue(timestamp);

    if (!value) {
        return "N/A";
    }

    try {

        return new Date(value).toLocaleString("en-GB", {
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


/* =========================================================
   SAFE HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DASHBOARD DATA CACHE
========================================================= */

let dashboardUsers = {};

let dashboardDeposits = {};

let dashboardWithdraws = {};

let dashboardTransactions = {};


/* =========================================================
   DASHBOARD LISTENER STATE
========================================================= */

let dashboardListenersStarted = false;


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    await window.waitForAdmin();

    if (dashboardListenersStarted) {

        renderDashboard();

        return;
    }

    dashboardListenersStarted = true;


    /* =====================================================
       USERS LISTENER
    ===================================================== */

    if (!listeners.dashboardUsers) {

        listeners.dashboardUsers = onValue(
            ref(db, "users"),

            snapshot => {

                dashboardUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard users listener error:",
                    error
                );

                showToast(
                    "Failed to load users data.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       DEPOSIT REQUESTS LISTENER
    ===================================================== */

    if (!listeners.dashboardDeposits) {

        listeners.dashboardDeposits = onValue(
            ref(db, "depositRequests"),

            snapshot => {

                dashboardDeposits =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard deposits listener error:",
                    error
                );

                showToast(
                    "Failed to load deposit data.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       WITHDRAW REQUESTS LISTENER
    ===================================================== */

    if (!listeners.dashboardWithdraws) {

        listeners.dashboardWithdraws = onValue(
            ref(db, "withdrawRequests"),

            snapshot => {

                dashboardWithdraws =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard withdraws listener error:",
                    error
                );

                showToast(
                    "Failed to load withdraw data.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       TRANSACTIONS LISTENER
    ===================================================== */

    if (!listeners.dashboardTransactions) {

        listeners.dashboardTransactions = onValue(
            ref(db, "transactions"),

            snapshot => {

                dashboardTransactions =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard transactions listener error:",
                    error
                );

                showToast(
                    "Failed to load transactions.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       INITIAL RENDER
    ===================================================== */

    renderDashboard();
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    /* =====================================================
       USERS
    ===================================================== */

    const users = Object.values(
        dashboardUsers || {}
    );

    const totalUsers = users.length;


    /* =====================================================
       SYSTEM BALANCE
       READ ONLY
    ===================================================== */

    let systemBalance = 0;

    users.forEach(user => {

        systemBalance += numberValue(
            user?.balance
        );

    });


    /* =====================================================
       DEPOSITS
    ===================================================== */

    const deposits = Object.values(
        dashboardDeposits || {}
    );

    let totalDeposits = 0;

    let pendingDeposits = 0;

    let approvedDeposits = 0;

    deposits.forEach(deposit => {

        const status = normalizeStatus(
            deposit?.status
        );

        const amount = numberValue(
            deposit?.amount
        );

        if (status === "approved") {

            approvedDeposits++;

            totalDeposits += amount;

        }

        if (
            status === "pending" ||
            status === "processing"
        ) {

            pendingDeposits++;

        }

    });


    /* =====================================================
       WITHDRAWS
    ===================================================== */

    const withdraws = Object.values(
        dashboardWithdraws || {}
    );

    let totalWithdraws = 0;

    withdraws.forEach(withdraw => {

        const status = normalizeStatus(
            withdraw?.status
        );

        const amount = numberValue(
            withdraw?.amount
        );

        if (status === "approved") {

            totalWithdraws += amount;

        }

    });


    /* =====================================================
       UPDATE DASHBOARD COUNTERS
    ===================================================== */

    updateText(
        "totalUsers",
        totalUsers.toLocaleString("en-US")
    );


    updateText(
        "dashboardTotalDeposits",
        formatMoney(totalDeposits)
    );


    updateText(
        "dashboardPendingDeposits",
        pendingDeposits.toLocaleString("en-US")
    );


    updateText(
        "dashboardApprovedDeposits",
        formatMoney(totalDeposits)
    );


    updateText(
        "dashboardTotalWithdraws",
        formatMoney(totalWithdraws)
    );


    updateText(
        "systemBalance",
        formatMoney(systemBalance)
    );


    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    renderRecentActivity();

}


/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );

    if (!container) {
        return;
    }


    const transactions =
        Object.entries(
            dashboardTransactions || {}
        ).map(([id, transaction]) => {

            return {
                id,
                ...(transaction || {})
            };

        });


    /* =====================================================
       SORT NEWEST FIRST
    ===================================================== */

    transactions.sort((a, b) => {

        const dateA = numberValue(
            a.createdAt ??
            a.timestamp ??
            a.date ??
            0
        );

        const dateB = numberValue(
            b.createdAt ??
            b.timestamp ??
            b.date ??
            0
        );

        return dateB - dateA;

    });


    /* =====================================================
       ONLY LAST 10
    ===================================================== */

    const recent =
        transactions.slice(0, 10);


    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>No recent activity.</p>
            </div>
        `;

        return;
    }


    /* =====================================================
       RENDER TRANSACTIONS
    ===================================================== */

    container.innerHTML =
        recent.map(transaction => {

            const type =
                String(
                    transaction.type ??
                    transaction.transactionType ??
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


            const userName =
                transaction.userName ??
                transaction.name ??
                transaction.displayName ??
                "User";


            const date =
                formatDate(
                    transaction.createdAt ??
                    transaction.timestamp ??
                    transaction.date
                );


            let icon =
                "fa-money-bill-transfer";


            let title =
                "Transaction";


            if (
                type === "deposit" ||
                type === "depositapproved"
            ) {

                icon =
                    "fa-circle-arrow-down";

                title =
                    "Deposit";

            } else if (
                type === "withdraw" ||
                type === "withdrawal"
            ) {

                icon =
                    "fa-circle-arrow-up";

                title =
                    "Withdraw";

            } else if (
                type === "vip" ||
                type === "vip_purchase" ||
                type === "vippurchase"
            ) {

                icon =
                    "fa-crown";

                title =
                    "VIP Purchase";

            } else if (
                type === "profit" ||
                type === "dailyprofit"
            ) {

                icon =
                    "fa-chart-line";

                title =
                    "Profit";

            } else if (
                type === "bonus" ||
                type === "registration_bonus"
            ) {

                icon =
                    "fa-gift";

                title =
                    "Bonus";

            } else if (
                type === "referral" ||
                type === "referral_bonus"
            ) {

                icon =
                    "fa-user-group";

                title =
                    "Referral Bonus";

            }


            return `
                <div class="activity-item">

                    <div class="activity-icon">

                        <i class="fa-solid ${icon}"></i>

                    </div>


                    <div class="activity-content">

                        <div class="activity-title">

                            ${escapeHTML(title)}

                        </div>

                        <div class="activity-user">

                            ${escapeHTML(userName)}

                        </div>

                        <div class="activity-date">

                            ${escapeHTML(date)}

                        </div>

                    </div>


                    <div class="activity-right">

                        <div class="activity-amount">

                            ${escapeHTML(
                                formatMoney(amount)
                            )}

                        </div>

                        <div class="
                            activity-status
                            status-${escapeHTML(status)}
                        ">

                            ${escapeHTML(
                                status
                            )}

                        </div>

                    </div>

                </div>
            `;

        })
        .join("");

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

function refreshDashboard() {

    renderDashboard();

    renderRecentActivity();

    showToast(
        "Dashboard refreshed.",
        "success"
    );

}


/* =========================================================
   DASHBOARD QUICK ACTIONS
========================================================= */

function setupDashboardQuickActions() {

    const actions = {

        openDeposits: "deposits",

        openWithdraws: "withdraws",

        openUsers: "users",

        openTransactions: "transactions",

        openSettings: "settings",

        openVipRequests: "vipRequests"

    };


    Object.entries(actions).forEach(
        ([id, page]) => {

            const button =
                document.getElementById(id);

            if (!button) {
                return;
            }


            if (
                button.dataset.dashboardBound ===
                "true"
            ) {

                return;

            }


            button.dataset.dashboardBound =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (
                        typeof window.openPage ===
                        "function"
                    ) {

                        window.openPage(page);

                    }

                }
            );

        }
    );

}


/* =========================================================
   EXPORT COMMON HELPERS
   OTHER PARTS CAN USE THEM
========================================================= */

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


window.loadDashboard =
    loadDashboard;


window.renderDashboard =
    renderDashboard;


window.renderRecentActivity =
    renderRecentActivity;


window.refreshDashboard =
    refreshDashboard;


window.setupDashboardQuickActions =
    setupDashboardQuickActions;


/* =========================================================
   INITIALIZE DASHBOARD BUTTONS
========================================================= */

setupDashboardQuickActions();


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 2 loaded successfully."
);

console.log(
    "Dashboard currency: RWF / FRW"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 3
   DEPOSIT REQUESTS
   CURRENCY: RWF / FRW

   FEATURES:
   - Beautiful deposit request list
   - Search
   - Status filter
   - Counters
   - User information
   - Approve / Reject
   - ONE-TIME APPROVAL PROTECTION
   - Automatic balance update
   - Automatic totalDeposits update
   - Automatic totalTransactions update
========================================================= */


/* =========================================================
   DEPOSIT DATA
========================================================= */

let allDepositRequests = [];

let depositUsers = {};

let depositListenersStarted = false;


/* =========================================================
   SAFE DEPOSIT VALUE
========================================================= */

function depositValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   DEPOSIT STATUS
========================================================= */

function depositStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


/* =========================================================
   DEPOSIT DATE
========================================================= */

function depositDate(value) {

    const timestamp = depositValue(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}


/* =========================================================
   DEPOSIT MONEY
========================================================= */

function depositMoney(value) {

    return formatMoney(
        depositValue(value)
    );
}


/* =========================================================
   USER NAME
========================================================= */

function depositUserName(user) {

    if (!user) {
        return "Unknown User";
    }

    return (
        user.name ||
        user.fullName ||
        user.displayName ||
        user.username ||
        user.email ||
        "Unknown User"
    );
}


/* =========================================================
   USER EMAIL
========================================================= */

function depositUserEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}


/* =========================================================
   USER PHONE
========================================================= */

function depositUserPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        user?.mobile ||
        "N/A"
    );
}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function depositPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        request?.provider ||
        "N/A"
    );
}


/* =========================================================
   TRANSACTION ID
========================================================= */

function depositTransactionId(request) {

    return (
        request?.transactionId ||
        request?.transactionID ||
        request?.txId ||
        request?.reference ||
        "N/A"
    );
}


/* =========================================================
   REQUEST DATE
========================================================= */

function depositRequestDate(request) {

    return (
        request?.createdAt ??
        request?.timestamp ??
        request?.date ??
        request?.requestedAt ??
        0
    );
}


/* =========================================================
   USER PHOTO
========================================================= */

function depositUserPhoto(user) {

    return (
        user?.photoURL ||
        user?.photo ||
        user?.profilePhoto ||
        user?.avatar ||
        ""
    );
}


/* =========================================================
   LOAD DEPOSITS
========================================================= */

async function loadDeposits() {

    await window.waitForAdmin();


    if (depositListenersStarted) {

        renderDepositRequests();

        return;
    }


    depositListenersStarted = true;


    /* =====================================================
       USERS LISTENER
    ===================================================== */

    if (!listeners.depositUsers) {

        listeners.depositUsers = onValue(
            ref(db, "users"),

            snapshot => {

                depositUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDepositRequests();
            },

            error => {

                console.error(
                    "Deposit users listener error:",
                    error
                );

                showToast(
                    "Failed to load deposit users.",
                    "error"
                );
            }
        );

    }


    /* =====================================================
       DEPOSIT REQUESTS LISTENER
    ===================================================== */

    if (!listeners.depositRequests) {

        listeners.depositRequests = onValue(
            ref(db, "depositRequests"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allDepositRequests =
                    Object.entries(data)
                        .map(
                            ([id, request]) => {

                                return {
                                    id,
                                    ...(request || {})
                                };

                            }
                        );


                allDepositRequests.sort(
                    (a, b) => {

                        return (
                            depositValue(
                                depositRequestDate(b)
                            ) -
                            depositValue(
                                depositRequestDate(a)
                            )
                        );

                    }
                );


                renderDepositRequests();

            },

            error => {

                console.error(
                    "Deposit requests listener error:",
                    error
                );

                showToast(
                    "Failed to load deposit requests.",
                    "error"
                );
            }
        );

    }


    renderDepositRequests();

}


/* =========================================================
   RENDER DEPOSIT REQUESTS
========================================================= */

function renderDepositRequests() {

    const list =
        document.getElementById(
            "depositList"
        );

    const empty =
        document.getElementById(
            "emptyDeposit"
        );


    if (!list) {
        return;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "depositSearch"
        );


    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       FILTER
    ===================================================== */

    const filterInput =
        document.getElementById(
            "depositFilter"
        );


    const filter =
        String(
            filterInput?.value || "all"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       COUNTERS
    ===================================================== */

    let totalCount = 0;

    let pendingCount = 0;

    let approvedCount = 0;

    let rejectedCount = 0;


    allDepositRequests.forEach(
        request => {

            totalCount++;

            const status =
                depositStatus(
                    request.status
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

        }
    );


    updateText(
        "depositTotalCount",
        totalCount.toLocaleString("en-US")
    );


    updateText(
        "depositPendingCount",
        pendingCount.toLocaleString("en-US")
    );


    updateText(
        "depositApprovedCount",
        approvedCount.toLocaleString("en-US")
    );


    updateText(
        "depositRejectedCount",
        rejectedCount.toLocaleString("en-US")
    );


    /* =====================================================
       FILTER REQUESTS
    ===================================================== */

    const filtered =
        allDepositRequests.filter(
            request => {

                const status =
                    depositStatus(
                        request.status
                    );


                /* FILTER */

                if (
                    filter !== "all" &&
                    status !== filter
                ) {

                    return false;

                }


                /* USER */

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
                    depositUserName(
                        user
                    )
                    .toLowerCase();


                const email =
                    depositUserEmail(
                        user
                    )
                    .toLowerCase();


                const phone =
                    depositUserPhone(
                        user
                    )
                    .toLowerCase();


                const transactionId =
                    depositTransactionId(
                        request
                    )
                    .toLowerCase();


                const method =
                    depositPaymentMethod(
                        request
                    )
                    .toLowerCase();


                const requestId =
                    String(
                        request.id || ""
                    )
                    .toLowerCase();


                /* SEARCH */

                if (search) {

                    const searchableText = [

                        uid,

                        name,

                        email,

                        phone,

                        transactionId,

                        method,

                        requestId,

                        String(
                            request.amount || ""
                        )

                    ]
                    .join(" ");


                    if (
                        !searchableText.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display = "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-inbox"></i>

                    <h3>
                        No Deposit Requests
                    </h3>

                    <p>
                        There are no deposit
                        requests matching your search.
                    </p>

                </div>
            `;

        }

        return;

    }


    if (empty) {
        empty.style.display = "none";
    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    list.innerHTML =
        filtered
            .map(
                request =>
                    renderDepositCard(
                        request,
                        depositUsers[
                            request.uid
                        ] || {}
                    )
            )
            .join("");


    activateDepositButtons();

}


/* =========================================================
   DEPOSIT CARD
========================================================= */

function renderDepositCard(
    request,
    user
) {

    const status =
        depositStatus(
            request.status
        );


    const amount =
        depositMoney(
            request.amount
        );


    const name =
        depositUserName(
            user
        );


    const email =
        depositUserEmail(
            user
        );


    const phone =
        depositUserPhone(
            user
        );


    const method =
        depositPaymentMethod(
            request
        );


    const transactionId =
        depositTransactionId(
            request
        );


    const date =
        depositDate(
            depositRequestDate(
                request
            )
        );


    const uid =
        request.uid ||
        "N/A";


    const photo =
        depositUserPhoto(
            user
        );


    const avatar =
        photo
            ? `
                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    class="deposit-avatar"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="deposit-avatar-fallback"
                    style="display:none;"
                >
                    <i class="fa-solid fa-user"></i>
                </div>
              `
            : `
                <div class="deposit-avatar-fallback">
                    <i class="fa-solid fa-user"></i>
                </div>
              `;


    /* =====================================================
       STATUS CLASS
    ===================================================== */

    const statusClass =
        [
            "pending",
            "processing",
            "approved",
            "rejected",
            "processing_error"
        ].includes(status)
            ? status
            : "pending";


    /* =====================================================
       ACTION BUTTONS
    ===================================================== */

    let actions = "";


    if (status === "pending") {

        actions = `

            <div class="deposit-actions">

                <button
                    type="button"
                    class="deposit-action-btn approve-deposit-btn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fa-solid fa-check"></i>
                    Approve
                </button>


                <button
                    type="button"
                    class="deposit-action-btn reject-deposit-btn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Reject
                </button>

            </div>

        `;

    } else {

        actions = `

            <div class="
                deposit-processed-message
                status-${escapeHTML(statusClass)}
            ">

                <i class="fa-solid
                    ${
                        status === "approved"
                            ? "fa-circle-check"
                            : status === "rejected"
                                ? "fa-circle-xmark"
                                : "fa-clock"
                    }
                "></i>

                ${escapeHTML(
                    status.replace(
                        "_",
                        " "
                    )
                )}

            </div>

        `;

    }


    return `

        <article
            class="deposit-card"
            data-id="${escapeHTML(request.id)}"
        >

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="deposit-card-header">

                <div class="deposit-user">

                    <div class="deposit-avatar-wrap">

                        ${avatar}

                    </div>


                    <div class="deposit-user-info">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                    </div>

                </div>


                <div class="
                    deposit-status
                    status-${escapeHTML(statusClass)}
                ">

                    ${escapeHTML(
                        status.replace(
                            "_",
                            " "
                        )
                    )}

                </div>

            </div>


            <!-- =========================================
                 AMOUNT
            ========================================== -->

            <div class="deposit-amount-box">

                <span class="deposit-amount-label">
                    Deposit Amount
                </span>

                <strong class="deposit-amount">
                    ${escapeHTML(amount)}
                </strong>

            </div>


            <!-- =========================================
                 DETAILS
            ========================================== -->

            <div class="deposit-details">

                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-mobile-screen-button"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-wallet"></i>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(method)}
                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-receipt"></i>
                        Transaction ID
                    </span>

                    <strong
                        class="deposit-transaction-id"
                        title="${escapeHTML(transactionId)}"
                    >
                        ${escapeHTML(transactionId)}
                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-calendar"></i>
                        Requested
                    </span>

                    <strong>
                        ${escapeHTML(date)}
                    </strong>

                </div>

            </div>


            <!-- =========================================
                 TECHNICAL INFO
            ========================================== -->

            <div class="deposit-meta">

                <span>
                    UID:
                    ${escapeHTML(uid)}
                </span>

                <span>
                    Request:
                    ${escapeHTML(request.id)}
                </span>

            </div>


            <!-- =========================================
                 ACTIONS
            ========================================== -->

            ${actions}

        </article>

    `;

}


/* =========================================================
   ACTIVATE DEPOSIT BUTTONS
========================================================= */

function activateDepositButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approve-deposit-btn"
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


                    if (!id) {
                        return;
                    }


                    /* =================================
                       DISABLE IMMEDIATELY
                    ================================= */

                    button.disabled = true;

                    button.classList.add(
                        "is-processing"
                    );


                    button.innerHTML = `
                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>
                        Processing...
                    `;


                    try {

                        await approveDeposit(
                            id
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        button.disabled =
                            false;

                        button.classList.remove(
                            "is-processing"
                        );

                        button.innerHTML = `
                            <i class="
                                fa-solid
                                fa-check
                            "></i>
                            Approve
                        `;

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


                    if (!id) {
                        return;
                    }


                    button.disabled =
                        true;


                    button.classList.add(
                        "is-processing"
                    );


                    button.innerHTML = `
                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>
                        Processing...
                    `;


                    try {

                        await rejectDeposit(
                            id
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        button.disabled =
                            false;

                        button.classList.remove(
                            "is-processing"
                        );

                        button.innerHTML = `
                            <i class="
                                fa-solid
                                fa-xmark
                            "></i>
                            Reject
                        `;

                    }

                }
            );

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

function setupDepositSearch() {

    const search =
        document.getElementById(
            "depositSearch"
        );


    const filter =
        document.getElementById(
            "depositFilter"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound =
            "true";


        search.addEventListener(
            "input",
            renderDepositRequests
        );

    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            renderDepositRequests
        );

    }

}


/* =========================================================
   INITIALIZE SEARCH / FILTER
========================================================= */

setupDepositSearch();


/* =========================================================
   EXPORT
========================================================= */

window.loadDeposits =
    loadDeposits;


window.renderDepositRequests =
    renderDepositRequests;


window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 3 loaded successfully."
);

console.log(
    "Deposit currency: RWF / FRW"
);
/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 4
   APPROVE / REJECT DEPOSIT
   CURRENCY: RWF / FRW

   FEATURES:
   - Admin verification
   - One-time approval protection
   - One-time rejection protection
   - Prevent double balance credit
   - Automatic balance update
   - Automatic totalDeposits update
   - Automatic totalTransactions update
   - Transaction history
   - Processing state protection
========================================================= */


/* =========================================================
   APPROVE DEPOSIT
========================================================= */

async function approveDeposit(id) {

    try {

        /* =====================================================
           ADMIN CHECK
        ===================================================== */

        await window.waitForAdmin();


        if (!currentAdmin) {

            showToast(
                "Administrator access required.",
                "error"
            );

            return;

        }


        if (!id) {

            showToast(
                "Invalid deposit request.",
                "error"
            );

            return;

        }


        /* =====================================================
           GET DEPOSIT REQUEST
        ===================================================== */

        const depositRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        const snapshot =
            await get(
                depositRef
            );


        if (!snapshot.exists()) {

            showToast(
                "Deposit request not found.",
                "error"
            );

            return;

        }


        const request =
            snapshot.val() || {};


        /* =====================================================
           ONE-TIME STATUS CHECK
        ===================================================== */

        const currentStatus =
            depositStatus(
                request.status
            );


        if (
            currentStatus !== "pending"
        ) {

            showToast(
                `This deposit has already been ${currentStatus}.`,
                "warning"
            );

            renderDepositRequests();

            return;

        }


        /* =====================================================
           REQUEST DATA
        ===================================================== */

        const uid =
            String(
                request.uid || ""
            ).trim();


        const amount =
            depositValue(
                request.amount
            );


        const transactionId =
            depositTransactionId(
                request
            );


        const paymentMethod =
            depositPaymentMethod(
                request
            );


        if (!uid) {

            showToast(
                "Deposit request has no user UID.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showToast(
                "Invalid deposit amount.",
                "error"
            );

            return;

        }


        /* =====================================================
           CONFIRM
        ===================================================== */

        const confirmed =
            confirm(
                `Approve deposit of ${depositMoney(amount)}?`
            );


        if (!confirmed) {

            return;

        }


        /* =====================================================
           LOCK REQUEST
           
           pending -> processing

           This prevents two admin tabs/buttons
           from approving the same request.
        ===================================================== */

        const lockResult =
            await runTransaction(
                depositRef,
                currentRequest => {

                    if (
                        !currentRequest
                    ) {

                        return;

                    }


                    const status =
                        depositStatus(
                            currentRequest.status
                        );


                    if (
                        status !== "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status: "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin?.uid ||
                            null

                    };

                }
            );


        /* =====================================================
           CHECK LOCK
        ===================================================== */

        if (
            !lockResult.committed
        ) {

            showToast(
                "This deposit is already being processed.",
                "warning"
            );

            renderDepositRequests();

            return;

        }


        /* =====================================================
           GET USER
        ===================================================== */

        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        const userSnapshot =
            await get(
                userRef
            );


        if (
            !userSnapshot.exists()
        ) {

            await update(
                depositRef,
                {

                    status: "processing_error",

                    error:
                        "User account not found.",

                    errorAt:
                        Date.now(),

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "User account not found.",
                "error"
            );

            return;

        }


        const user =
            userSnapshot.val() || {};


        /* =====================================================
           UPDATE USER BALANCE ATOMICALLY
        ===================================================== */

        const balanceResult =
            await runTransaction(
                userRef,
                currentUser => {

                    if (
                        !currentUser
                    ) {

                        return;

                    }


                    const oldBalance =
                        depositValue(
                            currentUser.balance
                        );


                    const oldDeposits =
                        depositValue(
                            currentUser.totalDeposits
                        );


                    const oldTransactions =
                        depositValue(
                            currentUser.totalTransactions
                        );


                    return {

                        ...currentUser,

                        balance:
                            oldBalance +
                            amount,

                        totalDeposits:
                            oldDeposits +
                            amount,

                        totalTransactions:
                            oldTransactions +
                            1

                    };

                }
            );


        /* =====================================================
           CHECK USER UPDATE
        ===================================================== */

        if (
            !balanceResult.committed
        ) {

            await update(
                depositRef,
                {

                    status: "processing_error",

                    error:
                        "Unable to update user balance.",

                    errorAt:
                        Date.now(),

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Unable to update user balance.",
                "error"
            );

            return;

        }


        /* =====================================================
           CREATE TRANSACTION RECORD
        ===================================================== */

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        const transactionIdKey =
            transactionRef.key;


        const now =
            Date.now();


        const transactionData = {

            uid: uid,

            type: "Deposit",

            transactionType:
                "deposit",

            amount: amount,

            status:
                "approved",

            paymentMethod:
                paymentMethod,

            transactionId:
                transactionId,

            requestId:
                id,

            currency:
                "RWF",

            createdAt:
                now,

            timestamp:
                now,

            approvedAt:
                now,

            approvedBy:
                currentAdmin?.uid ||
                null

        };


        await set(
            transactionRef,
            transactionData
        );


        /* =====================================================
           FINALIZE DEPOSIT REQUEST
        ===================================================== */

        await update(
            depositRef,
            {

                status:
                    "approved",

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin?.uid ||
                    null,

                transactionKey:
                    transactionIdKey,

                currency:
                    "RWF",

                updatedAt:
                    now

            }
        );


        /* =====================================================
           REFRESH UI
        ===================================================== */

        renderDepositRequests();


        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }


        if (
            typeof renderTransactions ===
            "function"
        ) {

            renderTransactions();

        }


        /* =====================================================
           SUCCESS
        ===================================================== */

        showToast(
            `Deposit ${depositMoney(amount)} approved successfully.`,
            "success"
        );


        console.log(
            "Deposit approved:",
            {
                requestId: id,
                uid: uid,
                amount: amount,
                transactionId:
                    transactionIdKey
            }
        );

    } catch (error) {

        console.error(
            "Approve deposit error:",
            error
        );


        /* =====================================================
           SAFE ERROR HANDLING
        ===================================================== */

        try {

            const latestSnapshot =
                await get(
                    ref(
                        db,
                        `depositRequests/${id}`
                    )
                );


            if (
                latestSnapshot.exists()
            ) {

                const latestRequest =
                    latestSnapshot.val() ||
                    {};


                const latestStatus =
                    depositStatus(
                        latestRequest.status
                    );


                /*
                 * Only mark processing request
                 * as processing_error.
                 *
                 * Never overwrite approved/rejected.
                 */

                if (
                    latestStatus ===
                    "processing"
                ) {

                    await update(
                        ref(
                            db,
                            `depositRequests/${id}`
                        ),
                        {

                            status:
                                "processing_error",

                            error:
                                error?.message ||
                                "Deposit processing failed.",

                            errorAt:
                                Date.now(),

                            updatedAt:
                                Date.now()

                        }
                    );

                }

            }

        } catch (
            recoveryError
        ) {

            console.error(
                "Deposit recovery error:",
                recoveryError
            );

        }


        showToast(
            error?.message ||
            "Failed to approve deposit.",
            "error"
        );


        renderDepositRequests();

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    try {

        /* =====================================================
           ADMIN CHECK
        ===================================================== */

        await window.waitForAdmin();


        if (!currentAdmin) {

            showToast(
                "Administrator access required.",
                "error"
            );

            return;

        }


        if (!id) {

            showToast(
                "Invalid deposit request.",
                "error"
            );

            return;

        }


        /* =====================================================
           GET REQUEST
        ===================================================== */

        const depositRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        const snapshot =
            await get(
                depositRef
            );


        if (!snapshot.exists()) {

            showToast(
                "Deposit request not found.",
                "error"
            );

            return;

        }


        const request =
            snapshot.val() || {};


        /* =====================================================
           ONE-TIME CHECK
        ===================================================== */

        const status =
            depositStatus(
                request.status
            );


        if (
            status !== "pending"
        ) {

            showToast(
                `This deposit has already been ${status}.`,
                "warning"
            );

            renderDepositRequests();

            return;

        }


        /* =====================================================
           CONFIRM REJECTION
        ===================================================== */

        const confirmed =
            confirm(
                "Are you sure you want to reject this deposit?"
            );


        if (!confirmed) {

            return;

        }


        /* =====================================================
           ATOMIC REJECTION
           
           Only pending requests can become rejected.
        ===================================================== */

        const result =
            await runTransaction(
                depositRef,
                currentRequest => {

                    if (
                        !currentRequest
                    ) {

                        return;

                    }


                    const currentStatus =
                        depositStatus(
                            currentRequest.status
                        );


                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            null,

                        rejectionReason:
                            "Rejected by administrator.",

                        updatedAt:
                            Date.now(),

                        currency:
                            "RWF"

                    };

                }
            );


        /* =====================================================
           CHECK RESULT
        ===================================================== */

        if (
            !result.committed
        ) {

            showToast(
                "This deposit was already processed.",
                "warning"
            );

            renderDepositRequests();

            return;

        }


        /* =====================================================
           REFRESH
        ===================================================== */

        renderDepositRequests();


        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }


        /* =====================================================
           SUCCESS
        ===================================================== */

        showToast(
            "Deposit rejected successfully.",
            "success"
        );


        console.log(
            "Deposit rejected:",
            id
        );

    } catch (error) {

        console.error(
            "Reject deposit error:",
            error
        );


        showToast(
            error?.message ||
            "Failed to reject deposit.",
            "error"
        );


        renderDepositRequests();

    }

}


/* =========================================================
   EXPORT FUNCTIONS
========================================================= */

window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


/* =========================================================
   PART 4 READY
========================================================= */

console.log(
    "Money Vault Admin Part 4 loaded."
);


/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 5
   WITHDRAW REQUESTS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   WITHDRAW STATE
========================================================= */

let allWithdrawRequests = [];
let withdrawUsers = {};

let withdrawListenersStarted = false;


/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

function withdrawValue(value, fallback = "") {
    return value === undefined || value === null || value === ""
        ? fallback
        : value;
}


function withdrawNumber(value) {
    const n = Number(value);

    return Number.isFinite(n) ? n : 0;
}


function withdrawStatus(status) {
    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


function withdrawDate(value) {

    const timestamp = withdrawNumber(value);

    if (!timestamp) {
        return "N/A";
    }

    return new Date(timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function withdrawMoney(value) {

    return withdrawNumber(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + " RWF";
}


function withdrawUserName(user) {

    if (!user) {
        return "Unknown User";
    }

    return (
        user.fullName ||
        user.name ||
        user.displayName ||
        user.username ||
        user.email ||
        "Unknown User"
    );
}


function withdrawUserEmail(user, request) {

    return (
        user?.email ||
        request?.email ||
        "N/A"
    );
}


function withdrawUserPhone(user, request) {

    return (
        request?.phone ||
        request?.phoneNumber ||
        request?.mobile ||
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}


function withdrawPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        request?.provider ||
        "N/A"
    );
}


function withdrawAccountName(request) {

    return (
        request?.accountName ||
        request?.accountHolder ||
        request?.receiverName ||
        request?.name ||
        "N/A"
    );
}


function withdrawRequestDate(request) {

    return (
        request?.createdAt ||
        request?.requestedAt ||
        request?.timestamp ||
        request?.date ||
        0
    );
}


/* =========================================================
   LOAD WITHDRAW REQUESTS
========================================================= */

async function loadWithdraws() {

    try {

        await waitForAdmin();

        if (withdrawListenersStarted) {
            renderWithdrawRequests();
            return;
        }

        withdrawListenersStarted = true;


        /* -----------------------------------------
           WITHDRAW REQUESTS LISTENER
        ----------------------------------------- */

        if (!listeners.withdrawRequests) {

            listeners.withdrawRequests = onValue(
                ref(db, "withdrawRequests"),

                snapshot => {

                    const data = snapshot.val() || {};

                    allWithdrawRequests = Object.entries(data)
                        .map(([id, request]) => ({
                            id,
                            ...(request || {})
                        }))
                        .sort((a, b) => {

                            return (
                                withdrawNumber(withdrawRequestDate(b)) -
                                withdrawNumber(withdrawRequestDate(a))
                            );

                        });


                    renderWithdrawRequests();

                },

                error => {

                    console.error(
                        "Withdraw requests listener error:",
                        error
                    );

                    allWithdrawRequests = [];

                    renderWithdrawRequests();

                   /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 6
   APPROVE / REJECT WITHDRAW
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   APPROVE WITHDRAW
========================================================= */

async function approveWithdraw(id) {

    try {

        await waitForAdmin();


        /* -----------------------------------------
           VALIDATE ID
        ----------------------------------------- */

        if (!id) {

            showToast(
                "Invalid withdraw request.",
                "error"
            );

            return;
        }


        const requestRef =
            ref(db, `withdrawRequests/${id}`);


        /* -----------------------------------------
           GET REQUEST
        ----------------------------------------- */

        const requestSnapshot =
            await get(requestRef);


        if (!requestSnapshot.exists()) {

            showToast(
                "Withdraw request not found.",
                "error"
            );

            return;
        }


        const request =
            requestSnapshot.val() || {};


        const currentStatus =
            normalizeStatus(request.status);


        if (currentStatus !== "pending") {

            showToast(
                `This request is already ${currentStatus}.`,
                "warning"
            );

            return;
        }


        const uid =
            request.uid ||
            request.userId;


        const amount =
            numberValue(request.amount);


        if (!uid) {

            showToast(
                "Withdraw request has no user ID.",
                "error"
            );

            return;
        }


        if (amount <= 0) {

            showToast(
                "Invalid withdraw amount.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           CONFIRM
        ----------------------------------------- */

        const confirmed =
            confirm(
                `Approve withdraw of ${formatMoney(amount)}?`
            );


        if (!confirmed) {
            return;
        }


        const adminUid =
            currentAdmin?.uid;


        if (!adminUid) {

            showToast(
                "Admin session is not ready.",
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
                currentRequest => {

                    if (!currentRequest) {
                        return;
                    }

                    if (
                        normalizeStatus(
                            currentRequest.status
                        ) !== "pending"
                    ) {
                        return;
                    }

                    return {
                        ...currentRequest,

                        status: "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            adminUid

                    };

                }
            );


        if (!lockResult.committed) {

            showToast(
                "This request is already being processed.",
                "warning"
            );

            return;
        }


        /* -----------------------------------------
           USER REFERENCE
        ----------------------------------------- */

        const userRef =
            ref(db, `users/${uid}`);


        /* -----------------------------------------
           DEDUCT USER BALANCE
        ----------------------------------------- */

        const userTransaction =
            await runTransaction(
                userRef,
                currentUser => {

                    if (!currentUser) {
                        return;
                    }


                    const balance =
                        numberValue(
                            currentUser.balance
                        );


                    if (balance < amount) {
                        return;
                    }


                    const totalWithdrawals =
                        numberValue(
                            currentUser.totalWithdrawals
                        );


                    const totalTransactions =
                        numberValue(
                            currentUser.totalTransactions
                        );


                    return {

                        ...currentUser,

                        balance:
                            balance - amount,

                        totalWithdrawals:
                            totalWithdrawals + amount,

                        totalTransactions:
                            totalTransactions + 1,

                        updatedAt:
                            Date.now()

                    };

                }
            );


        /* -----------------------------------------
           CHECK BALANCE TRANSACTION
        ----------------------------------------- */

        if (!userTransaction.committed) {

            await update(
                requestRef,
                {

                    status: "rejected",

                    rejectionReason:
                        "Insufficient balance or user not found.",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        adminUid

                }
            );


            showToast(
                "Withdraw rejected: insufficient balance.",
                "warning"
            );

            return;
        }


        /* -----------------------------------------
           CREATE TRANSACTION
        ----------------------------------------- */

        let transactionKey = null;


        try {

            const transactionRef =
                push(
                    ref(db, "transactions")
                );


            transactionKey =
                transactionRef.key;


            await set(
                transactionRef,
                {

                    uid: uid,

                    type: "withdraw",

                    amount: amount,

                    status: "approved",

                    currency: "RWF",

                    paymentMethod:
                        request.paymentMethod ||
                        request.method ||
                        request.provider ||
                        "",

                    phone:
                        request.phone ||
                        request.phoneNumber ||
                        request.mobile ||
                        "",

                    accountName:
                        request.accountName ||
                        request.accountHolder ||
                        request.receiverName ||
                        "",

                    withdrawRequestId:
                        id,

                    createdAt:
                        Date.now(),

                    approvedAt:
                        Date.now(),

                    approvedBy:
                        adminUid

                }
            );

        } catch (transactionError) {

            console.error(
                "Withdraw transaction creation error:",
                transactionError
            );


            /* -----------------------------------------
               IMPORTANT:
               BALANCE HAS ALREADY BEEN DEDUCTED.
               DO NOT MARK AS PENDING AGAIN.
            ----------------------------------------- */

            await update(
                requestRef,
                {

                    status:
                        "processing_error",

                    processingError:
                        "Balance was deducted, but transaction record could not be created.",

                    processingErrorAt:
                        Date.now(),

                    processingErrorBy:
                        adminUid

                }
            );


            showToast(
                "Balance was deducted, but transaction recording failed. Do not approve this request again.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           FINALIZE REQUEST
        ----------------------------------------- */

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    adminUid,

                transactionKey:
                    transactionKey,

                currency:
                    "RWF"

            }
        );


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        showToast(
            `Withdraw of ${formatMoney(amount)} approved successfully.`,
            "success"
        );


        /* -----------------------------------------
           REFRESH DATA
        ----------------------------------------- */

        if (
            typeof renderWithdrawRequests ===
            "function"
        ) {
            renderWithdrawRequests();
        }


        if (
            typeof renderDashboard ===
            "function"
        ) {
            renderDashboard();
        }


        if (
            typeof renderUsers ===
            "function"
        ) {
            renderUsers();
        }


    } catch (error) {

        console.error(
            "approveWithdraw error:",
            error
        );


        /* -----------------------------------------
           DO NOT RESET APPROVED REQUEST
        ----------------------------------------- */

        try {

            const latestSnapshot =
                await get(
                    ref(db, `withdrawRequests/${id}`)
                );


            if (latestSnapshot.exists()) {

                const latest =
                    latestSnapshot.val() || {};

                const latestStatus =
                    normalizeStatus(
                        latest.status
                    );


                if (
                    latestStatus === "processing"
                ) {

                    await update(
                        ref(
                            db,
                            `withdrawRequests/${id}`
                        ),
                        {

                            status:
                                "processing_error",

                            processingError:
                                error.message ||
                                "Unknown processing error.",

                            processingErrorAt:
                                Date.now(),

                            processingErrorBy:
                                currentAdmin?.uid ||
                                null

                        }
                    );

                }

            }

        } catch (cleanupError) {

            console.error(
                "Withdraw cleanup error:",
                cleanupError
            );

        }


        showToast(
            error.message ||
            "Failed to approve withdraw.",
            "error"
        );
    }
}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    try {

        await waitForAdmin();


        if (!id) {

            showToast(
                "Invalid withdraw request.",
                "error"
            );

            return;
        }


        const requestRef =
            ref(db, `withdrawRequests/${id}`);


        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "Withdraw request not found.",
                "error"
            );

            return;
        }


        const request =
            snapshot.val() || {};


        if (
            normalizeStatus(request.status) !==
            "pending"
        ) {

            showToast(
                "Only pending withdraw requests can be rejected.",
                "warning"
            );

            return;
        }


        const amount =
            numberValue(request.amount);


        const confirmed =
            confirm(
                `Reject withdraw of ${formatMoney(amount)}?`
            );


        if (!confirmed) {
            return;
        }


        let reason =
            prompt(
                "Reason for rejection (optional):",
                ""
            );


        reason =
            String(reason || "").trim();


        const adminUid =
            currentAdmin?.uid;


        if (!adminUid) {

            showToast(
                "Admin session is not ready.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           ATOMIC PENDING -> REJECTED
        ----------------------------------------- */

        const result =
            await runTransaction(
                requestRef,
                currentRequest => {

                    if (!currentRequest) {
                        return;
                    }


                    if (
                        normalizeStatus(
                            currentRequest.status
                        ) !== "pending"
                    ) {
                        return;
                    }


                    return {

                        ...currentRequest,

                        status:
                            "rejected",

                        rejectionReason:
                            reason ||
                            "Rejected by administrator.",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            adminUid

                    };

                }
            );


        if (!result.committed) {

            showToast(
                "This request was already processed.",
                "warning"
            );

            return;
        }


        showToast(
            "Withdraw request rejected successfully.",
            "success"
        );


        /* -----------------------------------------
           REFRESH
        ----------------------------------------- */

        if (
            typeof renderWithdrawRequests ===
            "function"
        ) {
            renderWithdrawRequests();
        }


        if (
            typeof renderDashboard ===
            "function"
        ) {
            renderDashboard();
        }


    } catch (error) {

        console.error(
            "rejectWithdraw error:",
            error
        );


        showToast(
            error.message ||
            "Failed to reject withdraw.",
            "error"
        );
    }
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;


         /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 7
   VIP PURCHASE REQUESTS
   CURRENCY: RWF / FRW
========================================================= */

let allVipRequests = [];

let vipRequestUsers = {};

let vipRequestListenersStarted = false;


/* =========================================================
   VIP HELPERS
========================================================= */

function vipRequestValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function vipRequestStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


function vipRequestMoney(value) {

    return formatMoney(
        vipRequestValue(value)
    );
}


function vipRequestDate(value) {

    return formatDate(
        vipRequestValue(value)
    );
}


function getVipRequestName(request) {

    return (
        request?.vipName ||
        request?.name ||
        request?.planName ||
        request?.vipPlan ||
        "VIP Plan"
    );
}


function getVipRequestPrice(request) {

    return vipRequestValue(
        request?.price ??
        request?.vipPrice ??
        request?.amount
    );
}


function getVipRequestDaily(request) {

    return vipRequestValue(
        request?.dailyIncome ??
        request?.daily ??
        request?.dailyProfit
    );
}


function getVipRequestTotal(request) {

    return vipRequestValue(
        request?.totalProfit ??
        request?.profit ??
        request?.totalEarning
    );
}


function getVipRequestDuration(request) {

    const direct =
        vipRequestValue(
            request?.duration ??
            request?.days ??
            request?.durationDays
        );

    if (direct > 0) {
        return Math.ceil(direct);
    }

    const daily =
        getVipRequestDaily(request);

    const total =
        getVipRequestTotal(request);

    if (
        daily > 0 &&
        total > 0
    ) {

        return Math.ceil(
            total / daily
        );

    }

    return 0;
}


/* =========================================================
   LOAD VIP REQUESTS
========================================================= */

async function loadVipRequests() {

    await window.waitForAdmin();

    if (vipRequestListenersStarted) {

        renderVipRequests();

        return;
    }

    vipRequestListenersStarted = true;


    /* =====================================================
       USERS
    ===================================================== */

    if (!listeners.vipRequestUsers) {

        listeners.vipRequestUsers = onValue(
            ref(db, "users"),

            snapshot => {

                vipRequestUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderVipRequests();

            },

            error => {

                console.error(
                    "VIP users listener error:",
                    error
                );

                showToast(
                    "Failed to load VIP users.",
                    "error"
                );

            }
        );

    }


    /* =====================================================
       VIP REQUESTS
    ===================================================== */

    if (!listeners.vipPurchaseRequests) {

        listeners.vipPurchaseRequests = onValue(
            ref(db, "vipPurchaseRequests"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allVipRequests =
                    Object.entries(data)
                        .map(
                            ([id, request]) => ({
                                id,
                                ...(request || {})
                            })
                        );


                allVipRequests.sort(
                    (a, b) =>
                        vipRequestValue(
                            b.createdAt ??
                            b.timestamp ??
                            b.requestedAt
                        ) -
                        vipRequestValue(
                            a.createdAt ??
                            a.timestamp ??
                            a.requestedAt
                        )
                );


                renderVipRequests();

            },

            error => {

                console.error(
                    "VIP request listener error:",
                    error
                );

                showToast(
                    "Failed to load VIP requests.",
                    "error"
                );

            }
        );

    }


    setupVipRequestSearch();

    renderVipRequests();
}


/* =========================================================
   RENDER VIP REQUESTS
========================================================= */

function renderVipRequests() {

    const list =
        document.getElementById(
            "vipRequestList"
        );

    const empty =
        document.getElementById(
            "emptyVipRequest"
        );

    if (!list) {
        return;
    }


    const search =
        String(
            document.getElementById(
                "vipSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const filter =
        String(
            document.getElementById(
                "vipFilter"
            )?.value || "all"
        )
        .trim()
        .toLowerCase();


    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;


    allVipRequests.forEach(request => {

        total++;

        const status =
            vipRequestStatus(
                request.status
            );


        if (status === "pending") {
            pending++;
        }

        if (status === "approved") {
            approved++;
        }

        if (status === "rejected") {
            rejected++;
        }

    });


    updateText(
        "vipTotalCount",
        total.toLocaleString("en-US")
    );

    updateText(
        "vipPendingCount",
        pending.toLocaleString("en-US")
    );

    updateText(
        "vipApprovedCount",
        approved.toLocaleString("en-US")
    );

    updateText(
        "vipRejectedCount",
        rejected.toLocaleString("en-US")
    );


    const filtered =
        allVipRequests.filter(request => {

            const status =
                vipRequestStatus(
                    request.status
                );


            if (
                filter !== "all" &&
                status !== filter
            ) {
                return false;
            }


            const user =
                vipRequestUsers[
                    request.uid
                ] || {};


            const searchable = [

                request.id,

                request.uid,

                getVipRequestName(request),

                user.name,

                user.fullName,

                user.displayName,

                user.username,

                user.email,

                user.phone,

                request.paymentMethod

            ]
            .join(" ")
            .toLowerCase();


            return (
                !search ||
                searchable.includes(search)
            );

        });


    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-crown"></i>

                    <h3>
                        No VIP Purchase Requests
                    </h3>

                    <p>
                        No VIP requests match
                        your search or filter.
                    </p>

                </div>
            `;

        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML =
        filtered
            .map(request =>
                renderVipRequestCard(
                    request,
                    vipRequestUsers[
                        request.uid
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
    user
) {

    const status =
        vipRequestStatus(
            request.status
        );


    const vipName =
        getVipRequestName(request);


    const price =
        getVipRequestPrice(request);


    const daily =
        getVipRequestDaily(request);


    const totalProfit =
        getVipRequestTotal(request);


    const duration =
        getVipRequestDuration(request);


    const userName =
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User";


    const email =
        user?.email ||
        "No email";


    const phone =
        user?.phone ||
        user?.phoneNumber ||
        "N/A";


    const requestedAt =
        vipRequestDate(
            request.createdAt ??
            request.timestamp ??
            request.requestedAt
        );


    const statusClass =
        [
            "pending",
            "processing",
            "approved",
            "rejected",
            "processing_error"
        ].includes(status)
            ? status
            : "pending";


    let actions = "";


    if (status === "pending") {

        actions = `

            <div class="vip-request-actions">

                <button
                    type="button"
                    class="vip-action-btn vip-approve-btn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fa-solid fa-check"></i>
                    Approve
                </button>

                <button
                    type="button"
                    class="vip-action-btn vip-reject-btn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Reject
                </button>

            </div>

        `;

    } else {

        actions = `

            <div class="
                vip-request-processed
                status-${escapeHTML(statusClass)}
            ">

                <i class="fa-solid
                    ${
                        status === "approved"
                            ? "fa-circle-check"
                            : status === "rejected"
                                ? "fa-circle-xmark"
                                : "fa-clock"
                    }
                "></i>

                ${escapeHTML(
                    status.replace(
                        "_",
                        " "
                    )
                )}

            </div>

        `;

    }


    return `

        <article
            class="vip-request-card"
            data-id="${escapeHTML(request.id)}"
        >

            <div class="vip-request-header">

                <div class="vip-user">

                    <div class="vip-user-avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(userName)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                    </div>

                </div>


                <div class="
                    vip-request-status
                    status-${escapeHTML(statusClass)}
                ">

                    ${escapeHTML(
                        status.replace(
                            "_",
                            " "
                        )
                    )}

                </div>

            </div>


            <div class="vip-plan-title">

                <i class="fa-solid fa-crown"></i>

                <strong>
                    ${escapeHTML(vipName)}
                </strong>

            </div>


            <div class="vip-request-amount">

                <span>
                    VIP Price
                </span>

                <strong>
                    ${escapeHTML(
                        vipRequestMoney(price)
                    )}
                </strong>

            </div>


            <div class="vip-request-details">

                <div>
                    <span>
                        <i class="fa-solid fa-coins"></i>
                        Daily Income
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipRequestMoney(daily)
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profit
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipRequestMoney(totalProfit)
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        <i class="fa-solid fa-calendar-days"></i>
                        Duration
                    </span>

                    <strong>
                        ${duration > 0
                            ? `${duration} Days`
                            : "N/A"
                        }
                    </strong>
                </div>


                <div>
                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>
                </div>

            </div>


            <div class="vip-request-meta">

                <span>
                    Requested:
                    ${escapeHTML(requestedAt)}
                </span>

                <span>
                    Request ID:
                    ${escapeHTML(request.id)}
                </span>

            </div>


            ${actions}

        </article>

    `;

}


/* =========================================================
   BUTTONS
========================================================= */

function activateVipRequestButtons() {

    document
        .querySelectorAll(
            ".vip-approve-btn"
        )
        .forEach(button => {

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
                        return;
                    }


                    button.disabled =
                        true;


                    button.innerHTML = `
                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>
                        Processing...
                    `;


                    try {

                        await approveVipRequest(
                            id
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        button.disabled =
                            false;

                        button.innerHTML = `
                            <i class="
                                fa-solid
                                fa-check
                            "></i>
                            Approve
                        `;

                    }

                }
            );

        });


    document
        .querySelectorAll(
            ".vip-reject-btn"
        )
        .forEach(button => {

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
                        return;
                    }


                    button.disabled =
                        true;


                    button.innerHTML = `
                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>
                        Processing...
                    `;


                    try {

                        await rejectVipRequest(
                            id
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        button.disabled =
                            false;

                        button.innerHTML = `
                            <i class="
                                fa-solid
                                fa-xmark
                            "></i>
                            Reject
                        `;

                    }

                }
            );

        });

}


/* =========================================================
   SEARCH / FILTER
========================================================= */

function setupVipRequestSearch() {

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

        search.dataset.bound =
            "true";

        search.addEventListener(
            "input",
            renderVipRequests
        );

    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";

        filter.addEventListener(
            "change",
            renderVipRequests
        );

    }

}


/* =========================================================
   EXPORT
========================================================= */

window.loadVipRequests =
    loadVipRequests;

window.renderVipRequests =
    renderVipRequests;

window.setupVipRequestSearch =
    setupVipRequestSearch;

console.log(
    "Money Vault Admin Part 7 loaded."
);      
/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 8
   VIP APPROVE / REJECT
   CURRENCY: RWF / FRW
========================================================= */

const REFERRAL_BONUS_AMOUNT = 1000;


/* =========================================================
   APPROVE VIP REQUEST
========================================================= */

async function approveVipRequest(id) {

    await window.waitForAdmin();

    if (!id) {
        showToast(
            "Invalid VIP request.",
            "error"
        );
        return false;
    }

    try {

        const requestRef = ref(
            db,
            `vipPurchaseRequests/${id}`
        );

        /* -------------------------------------------------
           GET REQUEST
        ------------------------------------------------- */

        const requestSnapshot =
            await get(requestRef);

        if (!requestSnapshot.exists()) {

            showToast(
                "VIP request not found.",
                "error"
            );

            return false;
        }

        const request =
            requestSnapshot.val() || {};

        const status =
            String(
                request.status || "pending"
            )
            .trim()
            .toLowerCase();


        /* -------------------------------------------------
           PREVENT DOUBLE APPROVAL
        ------------------------------------------------- */

        if (status !== "pending") {

            showToast(
                `This request is already ${status}.`,
                "warning"
            );

            return false;
        }


        /* -------------------------------------------------
           REQUEST DATA
        ------------------------------------------------- */

        const uid =
            request.uid;

        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            "VIP Plan";

        const price =
            Number(
                request.price ??
                request.vipPrice ??
                request.amount
            ) || 0;

        const dailyIncome =
            Number(
                request.dailyIncome ??
                request.daily ??
                request.dailyProfit
            ) || 0;

        const totalProfit =
            Number(
                request.totalProfit ??
                request.profit ??
                request.totalEarning
            ) || 0;

        let duration =
            Number(
                request.duration ??
                request.days ??
                request.durationDays
            ) || 0;


        /* -------------------------------------------------
           CALCULATE DURATION IF MISSING
        ------------------------------------------------- */

        if (
            duration <= 0 &&
            dailyIncome > 0 &&
            totalProfit > 0
        ) {

            duration =
                Math.ceil(
                    totalProfit /
                    dailyIncome
                );

        }


        /* -------------------------------------------------
           VALIDATION
        ------------------------------------------------- */

        if (!uid) {

            showToast(
                "VIP request has no UID.",
                "error"
            );

            return false;
        }

        if (price <= 0) {

            showToast(
                "Invalid VIP price.",
                "error"
            );

            return false;
        }

        if (dailyIncome <= 0) {

            showToast(
                "Invalid daily income.",
                "error"
            );

            return false;
        }

        if (totalProfit <= 0) {

            showToast(
                "Invalid total profit.",
                "error"
            );

            return false;
        }

        if (duration <= 0) {

            showToast(
                "Invalid VIP duration.",
                "error"
            );

            return false;
        }


        /* -------------------------------------------------
           CONFIRM
        ------------------------------------------------- */

        const confirmed = confirm(
            `Approve ${vipName} for ${formatMoney(price)}?`
        );

        if (!confirmed) {
            return false;
        }


        /* -------------------------------------------------
           LOCK REQUEST
           pending -> processing
        ------------------------------------------------- */

        const lockResult =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }

                    const currentStatus =
                        String(
                            current.status ||
                            "pending"
                        )
                        .trim()
                        .toLowerCase();

                    if (
                        currentStatus !==
                        "pending"
                    ) {
                        return;
                    }

                    return {
                        ...current,

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

            showToast(
                "This VIP request is already being processed.",
                "warning"
            );

            return false;
        }


        /* -------------------------------------------------
           USER
        ------------------------------------------------- */

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
                    status:
                        "rejected",

                    rejectionReason:
                        "User account not found.",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        null
                }
            );

            showToast(
                "User account not found.",
                "error"
            );

            return false;
        }


        const user =
            userSnapshot.val() || {};

        const balance =
            Number(user.balance) || 0;


        /* -------------------------------------------------
           BALANCE CHECK
        ------------------------------------------------- */

        if (balance < price) {

            await update(
                requestRef,
                {
                    status:
                        "rejected",

                    rejectionReason:
                        "Insufficient balance.",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        null
                }
            );

            showToast(
                "Insufficient user balance.",
                "error"
            );

            return false;
        }


        /* -------------------------------------------------
           VIP DATES
        ------------------------------------------------- */

        const startDate =
            Date.now();

        const endDate =
            startDate +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );


        /* -------------------------------------------------
           DEDUCT VIP PRICE
           
           IMPORTANT:
           DAILY INCOME IS NOT ADDED HERE.
        ------------------------------------------------- */

        const balanceResult =
            await runTransaction(
                userRef,
                currentUser => {

                    if (!currentUser) {
                        return;
                    }

                    const currentBalance =
                        Number(
                            currentUser.balance
                        ) || 0;

                    if (
                        currentBalance <
                        price
                    ) {
                        return;
                    }

                    return {

                        ...currentUser,

                        balance:
                            currentBalance -
                            price,

                        totalTransactions:
                            (
                                Number(
                                    currentUser
                                        .totalTransactions
                                ) || 0
                            ) + 1
                    };
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

                    rejectionReason:
                        "Insufficient balance.",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        null
                }
            );

            showToast(
                "VIP purchase failed.",
                "error"
            );

            return false;
        }


        /* -------------------------------------------------
           CREATE VIP BUYER
           
           lastClaim = approval time.
           First daily claim becomes available
           after 24 hours.
        ------------------------------------------------- */

        const vipBuyer = {

            uid: uid,

            vipName: vipName,

            price: price,

            dailyIncome: dailyIncome,

            totalProfit: totalProfit,

            duration: duration,

            startDate: startDate,

            endDate: endDate,

            lastClaim: startDate,

            claimedAmount: 0,

            totalEarned: 0,

            claimCount: 0,

            active: true,

            status: "active",

            currency: "RWF",

            purchaseRequestId: id,

            approvedAt: startDate,

            approvedBy:
                currentAdmin?.uid ||
                null
        };


        await set(
            ref(
                db,
                `vipBuyers/${id}`
            ),
            vipBuyer
        );


        /* -------------------------------------------------
           COPY VIP PLAN TO USER
        ------------------------------------------------- */

        await set(
            ref(
                db,
                `users/${uid}/vipPlans/${id}`
            ),
            vipBuyer
        );


        /* -------------------------------------------------
           VIP PURCHASE TRANSACTION
        ------------------------------------------------- */

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );

        const transactionId =
            transactionRef.key;

        await set(
            transactionRef,
            {

                uid: uid,

                type: "VIP Purchase",

                transactionType:
                    "vip_purchase",

                amount: price,

                vipName: vipName,

                dailyIncome:
                    dailyIncome,

                totalProfit:
                    totalProfit,

                duration:
                    duration,

                status:
                    "approved",

                currency:
                    "RWF",

                requestId:
                    id,

                createdAt:
                    Date.now(),

                timestamp:
                    Date.now(),

                adminId:
                    currentAdmin?.uid ||
                    null
            }
        );


        /* -------------------------------------------------
           REFERRAL BONUS
           1,000 RWF — ONLY ONCE
        ------------------------------------------------- */

        const referredBy =
            user.referredBy;


        if (referredBy) {

            try {

                const bonusRef =
                    ref(
                        db,
                        `vipReferralBonuses/${id}`
                    );

                const bonusSnapshot =
                    await get(
                        bonusRef
                    );


                if (
                    !bonusSnapshot.exists()
                ) {

                    const referrerRef =
                        ref(
                            db,
                            `users/${referredBy}`
                        );

                    const bonusResult =
                        await runTransaction(
                            referrerRef,
                            referrer => {

                                if (!referrer) {
                                    return;
                                }

                                return {

                                    ...referrer,

                                    referralEarnings:
                                        (
                                            Number(
                                                referrer
                                                    .referralEarnings
                                            ) || 0
                                        ) +
                                        REFERRAL_BONUS_AMOUNT
                                };
                            }
                        );


                    if (
                        bonusResult.committed
                    ) {

                        await set(
                            bonusRef,
                            {

                                referrerUid:
                                    referredBy,

                                referredUserUid:
                                    uid,

                                requestId:
                                    id,

                                amount:
                                    REFERRAL_BONUS_AMOUNT,

                                currency:
                                    "RWF",

                                status:
                                    "approved",

                                createdAt:
                                    Date.now(),

                                adminId:
                                    currentAdmin?.uid ||
                                    null
                            }
                        );


                        const referralTransaction =
                            push(
                                ref(
                                    db,
                                    "transactions"
                                )
                            );


                        await set(
                            referralTransaction,
                            {

                                uid:
                                    referredBy,

                                type:
                                    "Referral Bonus",

                                transactionType:
                                    "referral_bonus",

                                amount:
                                    REFERRAL_BONUS_AMOUNT,

                                currency:
                                    "RWF",

                                relatedUser:
                                    uid,

                                requestId:
                                    id,

                                status:
                                    "approved",

                                createdAt:
                                    Date.now(),

                                timestamp:
                                    Date.now(),

                                adminId:
                                    currentAdmin?.uid ||
                                    null
                            }
                        );

                    }

                }

            } catch (referralError) {

                /*
                 * Referral error should not cancel
                 * the main VIP approval.
                 */

                console.error(
                    "Referral bonus error:",
                    referralError
                );

            }
        }


        /* -------------------------------------------------
           FINALIZE REQUEST
        ------------------------------------------------- */

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin?.uid ||
                    null,

                vipBuyerId:
                    id,

                transactionId:
                    transactionId,

                currency:
                    "RWF"
            }
        );


        /* -------------------------------------------------
           REFRESH UI
        ------------------------------------------------- */

        if (
            typeof renderVipRequests ===
            "function"
        ) {
            renderVipRequests();
        }

        if (
            typeof window.renderDashboard ===
            "function"
        ) {
            window.renderDashboard();
        }

        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {
            window.loadVipBuyers();
        }

        if (
            typeof window.loadUsers ===
            "function"
        ) {
            window.loadUsers();
        }


        showToast(
            `${vipName} approved successfully.`,
            "success"
        );

        return true;


    } catch (error) {

        console.error(
            "approveVipRequest error:",
            error
        );


        /*
         * Only mark processing_error if
         * the request is still processing.
         */

        try {

            const latestSnapshot =
                await get(
                    ref(
                        db,
                        `vipPurchaseRequests/${id}`
                    )
                );


            if (
                latestSnapshot.exists()
            ) {

                const latest =
                    latestSnapshot.val() || {};

                const latestStatus =
                    String(
                        latest.status || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    latestStatus ===
                    "processing"
                ) {

                    await update(
                        ref(
                            db,
                            `vipPurchaseRequests/${id}`
                        ),
                        {

                            status:
                                "processing_error",

                            processingError:
                                error?.message ||
                                "Unknown error.",

                            errorAt:
                                Date.now(),

                            errorBy:
                                currentAdmin?.uid ||
                                null
                        }
                    );

                }
            }

        } catch (recoveryError) {

            console.error(
                "VIP recovery error:",
                recoveryError
            );
        }


        showToast(
            error?.message ||
            "VIP approval failed.",
            "error"
        );

        return false;
    }
}


/* =========================================================
   REJECT VIP REQUEST
========================================================= */

async function rejectVipRequest(id) {

    await window.waitForAdmin();

    if (!id) {

        showToast(
            "Invalid VIP request.",
            "error"
        );

        return false;
    }


    try {

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "VIP request not found.",
                "error"
            );

            return false;
        }


        const request =
            snapshot.val() || {};


        const status =
            String(
                request.status ||
                "pending"
            )
            .trim()
            .toLowerCase();


        if (
            status !== "pending"
        ) {

            showToast(
                `This request is already ${status}.`,
                "warning"
            );

            return false;
        }


        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            "VIP Plan";


        const confirmed =
            confirm(
                `Reject ${vipName} VIP purchase?`
            );


        if (!confirmed) {
            return false;
        }


        /* -------------------------------------------------
           ATOMIC REJECT
           pending -> rejected
        ------------------------------------------------- */

        const result =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }

                    const currentStatus =
                        String(
                            current.status ||
                            "pending"
                        )
                        .trim()
                        .toLowerCase();


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

                        rejectionReason:
                            "Rejected by administrator.",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            null
                    };
                }
            );


        if (
            !result.committed
        ) {

            showToast(
                "This request was already processed.",
                "warning"
            );

            return false;
        }


        renderVipRequests();


        showToast(
            `${vipName} request rejected.`,
            "success"
        );


        return true;


    } catch (error) {

        console.error(
            "rejectVipRequest error:",
            error
        );


        showToast(
            error?.message ||
            "VIP rejection failed.",
            "error"
        );


        return false;
    }
}


/* =========================================================
   EXPORT FUNCTIONS
========================================================= */

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;


/* =========================================================
   PART 8 READY
========================================================= */

console.log(
    "Money Vault Admin Part 8 loaded."
);

console.log(
    "Currency: RWF / FRW"
);

console.log(
    "VIP daily income is NOT added during approval."
);

            /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 9
   VIP BUYERS MANAGEMENT
   CURRENCY: RWF / FRW
========================================================= */

let allVipBuyers = [];
let vipBuyerUsers = {};
let vipBuyerListenersStarted = false;


/* =========================================================
   SAFE HELPERS
========================================================= */

function vipBuyerValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function vipBuyerMoney(value) {
    return formatMoney(vipBuyerValue(value));
}

function vipBuyerDate(value) {
    const timestamp = vipBuyerValue(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}

function vipBuyerStatus(buyer) {

    const storedStatus = String(
        buyer?.status ||
        ""
    ).trim().toLowerCase();

    const activeField = buyer?.active;

    if (
        storedStatus === "expired" ||
        activeField === false
    ) {
        return "expired";
    }

    if (
        storedStatus === "active" ||
        activeField === true
    ) {
        const endDate = vipBuyerValue(
            buyer?.endDate
        );

        if (
            endDate > 0 &&
            Date.now() >= endDate
        ) {
            return "expired";
        }

        return "active";
    }

    const endDate = vipBuyerValue(
        buyer?.endDate
    );

    if (
        endDate > 0 &&
        Date.now() >= endDate
    ) {
        return "expired";
    }

    return "active";
}


/* =========================================================
   VIP FIELD HELPERS
========================================================= */

function getVipBuyerName(buyer) {

    return (
        buyer?.vipName ||
        buyer?.name ||
        buyer?.planName ||
        buyer?.vipPlan ||
        "VIP Plan"
    );
}

function getVipBuyerPrice(buyer) {

    return vipBuyerValue(
        buyer?.price ??
        buyer?.vipPrice ??
        buyer?.amount
    );
}

function getVipBuyerDailyIncome(buyer) {

    return vipBuyerValue(
        buyer?.dailyIncome ??
        buyer?.daily ??
        buyer?.dailyProfit
    );
}

function getVipBuyerTotalProfit(buyer) {

    return vipBuyerValue(
        buyer?.totalProfit ??
        buyer?.profit ??
        buyer?.totalEarning
    );
}

function getVipBuyerDuration(buyer) {

    const directDuration = vipBuyerValue(
        buyer?.duration ??
        buyer?.days ??
        buyer?.durationDays
    );

    if (directDuration > 0) {
        return Math.ceil(directDuration);
    }

    const dailyIncome = getVipBuyerDailyIncome(buyer);
    const totalProfit = getVipBuyerTotalProfit(buyer);

    if (
        dailyIncome > 0 &&
        totalProfit > 0
    ) {
        return Math.ceil(
            totalProfit / dailyIncome
        );
    }

    return 0;
}

function getVipBuyerStartDate(buyer) {

    return vipBuyerValue(
        buyer?.startDate ??
        buyer?.approvedAt ??
        buyer?.createdAt ??
        buyer?.timestamp
    );
}

function getVipBuyerEndDate(buyer) {

    const storedEndDate = vipBuyerValue(
        buyer?.endDate
    );

    if (storedEndDate > 0) {
        return storedEndDate;
    }

    const startDate = getVipBuyerStartDate(buyer);
    const duration = getVipBuyerDuration(buyer);

    if (
        startDate > 0 &&
        duration > 0
    ) {
        return (
            startDate +
            duration * 24 * 60 * 60 * 1000
        );
    }

    return 0;
}


/* =========================================================
   USER HELPERS
========================================================= */

function getVipBuyerUserName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User"
    );
}

function getVipBuyerEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}

function getVipBuyerPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}

function getVipBuyerPhoto(user) {

    return (
        user?.photoURL ||
        user?.photoUrl ||
        user?.profilePhoto ||
        user?.photo ||
        ""
    );
}


/* =========================================================
   LOAD VIP BUYERS
========================================================= */

async function loadVipBuyers() {

    await window.waitForAdmin();

    if (vipBuyerListenersStarted) {

        renderVipBuyers();

        return;
    }

    vipBuyerListenersStarted = true;


    /* -----------------------------------------
       USERS LISTENER
    ----------------------------------------- */

    if (!listeners.vipBuyerUsers) {

        listeners.vipBuyerUsers = onValue(
            ref(db, "users"),

            snapshot => {

                vipBuyerUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderVipBuyers();
            },

            error => {

                console.error(
                    "VIP buyer users listener error:",
                    error
                );

                showToast(
                    "Failed to load VIP users.",
                    "error"
                );
            }
        );
    }


    /* -----------------------------------------
       VIP BUYERS LISTENER
    ----------------------------------------- */

    if (!listeners.vipBuyers) {

        listeners.vipBuyers = onValue(
            ref(db, "vipBuyers"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                allVipBuyers =
                    Object.entries(data).map(
                        ([id, buyer]) => ({
                            id,
                            ...(buyer || {})
                        })
                    );


                /* ---------------------------------
                   SORT NEWEST FIRST
                --------------------------------- */

                allVipBuyers.sort(
                    (a, b) => {

                        const dateA =
                            getVipBuyerStartDate(a);

                        const dateB =
                            getVipBuyerStartDate(b);

                        return dateB - dateA;
                    }
                );

                renderVipBuyers();
            },

            error => {

                console.error(
                    "VIP buyers listener error:",
                    error
                );

                showToast(
                    "Failed to load VIP buyers.",
                    "error"
                );
            }
        );
    }


    setupVipBuyerSearch();

    renderVipBuyers();
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

    let total = 0;
    let active = 0;
    let expired = 0;

    allVipBuyers.forEach(
        buyer => {

            total++;

            const status =
                vipBuyerStatus(buyer);

            if (status === "active") {
                active++;
            }

            if (status === "expired") {
                expired++;
            }
        }
    );


    updateText(
        "vipBuyerTotalCount",
        total.toLocaleString("en-US")
    );

    updateText(
        "vipBuyerActiveCount",
        active.toLocaleString("en-US")
    );

    updateText(
        "vipBuyerExpiredCount",
        expired.toLocaleString("en-US")
    );


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    const searchInput =
        document.getElementById(
            "vipBuyerSearch"
        );

    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    /* -----------------------------------------
       FILTER
    ----------------------------------------- */

    const filterElement =
        document.getElementById(
            "vipBuyerFilter"
        );

    const filter =
        String(
            filterElement?.value || "all"
        )
            .trim()
            .toLowerCase();


    /* -----------------------------------------
       FILTER DATA
    ----------------------------------------- */

    const filtered =
        allVipBuyers.filter(
            buyer => {

                const status =
                    vipBuyerStatus(buyer);

                if (
                    filter !== "all" &&
                    status !== filter
                ) {
                    return false;
                }


                const user =
                    vipBuyerUsers[
                        buyer.uid
                    ] || {};


                const searchable = [

                    buyer.id,

                    buyer.uid,

                    getVipBuyerName(buyer),

                    user.name,

                    user.fullName,

                    user.displayName,

                    user.username,

                    user.email,

                    user.phone,

                    user.phoneNumber,

                    buyer.price,

                    buyer.dailyIncome,

                    buyer.totalProfit,

                    buyer.status

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return (
                    !search ||
                    searchable.includes(search)
                );
            }
        );


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-crown"></i>

                    <h3>
                        No VIP Buyers
                    </h3>

                    <p>
                        No VIP buyers match
                        your search or filter.
                    </p>

                </div>
            `;
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    /* -----------------------------------------
       CARDS
    ----------------------------------------- */

    list.innerHTML =
        filtered
            .map(
                buyer =>
                    renderVipBuyerCard(
                        buyer,
                        vipBuyerUsers[
                            buyer.uid
                        ] || {}
                    )
            )
            .join("");
}


/* =========================================================
   VIP BUYER CARD
========================================================= */

function renderVipBuyerCard(
    buyer,
    user
) {

    const status =
        vipBuyerStatus(buyer);


    const statusClass =
        status === "active"
            ? "active"
            : "expired";


    const vipName =
        getVipBuyerName(buyer);

    const price =
        getVipBuyerPrice(buyer);

    const dailyIncome =
        getVipBuyerDailyIncome(buyer);

    const totalProfit =
        getVipBuyerTotalProfit(buyer);

    const duration =
        getVipBuyerDuration(buyer);

    const startDate =
        getVipBuyerStartDate(buyer);

    const endDate =
        getVipBuyerEndDate(buyer);


    const claimedAmount =
        vipBuyerValue(
            buyer?.claimedAmount
        );

    const totalEarned =
        vipBuyerValue(
            buyer?.totalEarned
        );

    const claimCount =
        vipBuyerValue(
            buyer?.claimCount
        );

    const lastClaim =
        vipBuyerValue(
            buyer?.lastClaim
        );


    const userName =
        getVipBuyerUserName(user);

    const email =
        getVipBuyerEmail(user);

    const phone =
        getVipBuyerPhone(user);

    const photo =
        getVipBuyerPhoto(user);


    /* -----------------------------------------
       AVATAR
    ----------------------------------------- */

    let avatarHTML = `
        <div class="vip-buyer-avatar">
            <i class="fa-solid fa-user"></i>
        </div>
    `;


    if (photo) {

        avatarHTML = `
            <div class="vip-buyer-avatar">
                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    onerror="
                        this.style.display='none';
                        this.parentElement
                            .classList.add('avatar-error');
                    "
                >
            </div>
        `;
    }


    /* -----------------------------------------
       STATUS ICON
    ----------------------------------------- */

    const statusIcon =
        status === "active"
            ? "fa-circle-check"
            : "fa-circle-xmark";


    return `
        <article
            class="vip-buyer-card"
            data-id="${escapeHTML(buyer.id)}"
        >

            <!-- HEADER -->

            <div class="vip-buyer-header">

                <div class="vip-buyer-user">

                    ${avatarHTML}

                    <div>

                        <h3>
                            ${escapeHTML(userName)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                    </div>

                </div>


                <div
                    class="
                        vip-buyer-status
                        status-${escapeHTML(statusClass)}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${statusIcon}
                        "
                    ></i>

                    ${escapeHTML(
                        status
                    )}

                </div>

            </div>


            <!-- VIP NAME -->

            <div class="vip-buyer-plan">

                <i class="fa-solid fa-crown"></i>

                <strong>
                    ${escapeHTML(vipName)}
                </strong>

            </div>


            <!-- PRICE -->

            <div class="vip-buyer-price">

                <span>
                    VIP Price
                </span>

                <strong>
                    ${escapeHTML(
                        vipBuyerMoney(price)
                    )}
                </strong>

            </div>


            <!-- MAIN DETAILS -->

            <div class="vip-buyer-details">

                <div>

                    <span>
                        <i class="fa-solid fa-coins"></i>
                        Daily Income
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                dailyIncome
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profit
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                totalProfit
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-calendar-days"></i>
                        Duration
                    </span>

                    <strong>
                        ${
                            duration > 0
                                ? `${duration} Days`
                                : "N/A"
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>

            </div>


            <!-- EARNINGS -->

            <div class="vip-buyer-earnings">

                <div>

                    <span>
                        Claimed Amount
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                claimedAmount
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Total Earned
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                totalEarned
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Claim Count
                    </span>

                    <strong>
                        ${claimCount.toLocaleString(
                            "en-US"
                        )}
                    </strong>

                </div>

            </div>


            <!-- DATES -->

            <div class="vip-buyer-dates">

                <div>

                    <span>
                        <i class="fa-solid fa-play"></i>
                        Started
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerDate(
                                startDate
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-flag-checkered"></i>
                        Ends
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerDate(
                                endDate
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-clock"></i>
                        Last Claim
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerDate(
                                lastClaim
                            )
                        )}
                    </strong>

                </div>

            </div>


            <!-- META -->

            <div class="vip-buyer-meta">

                <span>
                    UID:
                    ${escapeHTML(
                        buyer.uid || "N/A"
                    )}
                </span>

                <span>
                    Buyer ID:
                    ${escapeHTML(
                        buyer.id
                    )}
                </span>

            </div>

        </article>
    `;
}


/* =========================================================
   SEARCH + FILTER
========================================================= */

function setupVipBuyerSearch() {

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
   AUTO CHECK EXPIRATION
========================================================= */

function refreshVipBuyerStatuses() {

    if (
        !allVipBuyers ||
        !allVipBuyers.length
    ) {
        return;
    }

    renderVipBuyers();
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadVipBuyers =
    loadVipBuyers;

window.renderVipBuyers =
    renderVipBuyers;

window.setupVipBuyerSearch =
    setupVipBuyerSearch;

window.refreshVipBuyerStatuses =
    refreshVipBuyerStatuses;


console.log(
    "Money Vault Admin Part 9 loaded."
);   


         /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 10
   USERS MANAGEMENT
   CURRENCY: RWF / FRW
========================================================= */

let allUsers = [];
let usersListenersStarted = false;


/* =========================================================
   SAFE USER HELPERS
========================================================= */

function userNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}


function userMoney(value) {
    return formatMoney(userNumber(value));
}


function userDate(value) {

    const timestamp = userNumber(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}


function userStatus(user) {

    const status = String(
        user?.status ?? ""
    ).trim().toLowerCase();

    if (
        status === "blocked" ||
        status === "suspended" ||
        status === "disabled"
    ) {
        return "blocked";
    }

    if (
        user?.active === false ||
        user?.disabled === true
    ) {
        return "blocked";
    }

    return "active";
}


/* =========================================================
   USER NAME
========================================================= */

function getUserDisplayName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User"
    );
}


/* =========================================================
   USER EMAIL
========================================================= */

function getUserDisplayEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}


/* =========================================================
   USER PHONE
========================================================= */

function getUserDisplayPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}


/* =========================================================
   USER PHOTO
========================================================= */

function getUserDisplayPhoto(user) {

    return (
        user?.photoURL ||
        user?.photoUrl ||
        user?.profilePhoto ||
        user?.photo ||
        ""
    );
}


/* =========================================================
   USER BALANCE
========================================================= */

function getUserBalance(user) {

    return userNumber(
        user?.balance
    );
}


/* =========================================================
   TOTAL DEPOSITS
========================================================= */

function getUserTotalDeposits(user) {

    return userNumber(
        user?.totalDeposits
    );
}


/* =========================================================
   TOTAL WITHDRAWALS
========================================================= */

function getUserTotalWithdrawals(user) {

    return userNumber(
        user?.totalWithdrawals
    );
}


/* =========================================================
   REFERRAL EARNINGS
========================================================= */

function getUserReferralEarnings(user) {

    return userNumber(
        user?.referralEarnings
    );
}


/* =========================================================
   TOTAL PROFITS
========================================================= */

function getUserTotalProfits(user) {

    return userNumber(
        user?.totalProfits ??
        user?.totalProfit ??
        user?.profits
    );
}


/* =========================================================
   TRANSACTION COUNT
========================================================= */

function getUserTransactionCount(user) {

    return userNumber(
        user?.totalTransactions
    );
}


/* =========================================================
   VIP COUNT
========================================================= */

function getUserVipCount(user) {

    if (
        user?.vipPlans &&
        typeof user.vipPlans === "object"
    ) {
        return Object.keys(
            user.vipPlans
        ).length;
    }

    if (
        user?.vipPurchases &&
        typeof user.vipPurchases === "object"
    ) {
        return Object.keys(
            user.vipPurchases
        ).length;
    }

    return userNumber(
        user?.vipCount
    );
}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    await window.waitForAdmin();

    if (usersListenersStarted) {

        renderUsers();

        return;
    }

    usersListenersStarted = true;


    if (!listeners.usersManagement) {

        listeners.usersManagement = onValue(

            ref(db, "users"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allUsers =
                    Object.entries(data).map(
                        ([uid, user]) => ({

                            uid,

                            ...(user || {})

                        })
                    );


                /* -------------------------------------
                   NEWEST USERS FIRST
                ------------------------------------- */

                allUsers.sort(
                    (a, b) => {

                        const dateA =
                            userNumber(
                                a.createdAt ??
                                a.registeredAt ??
                                a.timestamp
                            );

                        const dateB =
                            userNumber(
                                b.createdAt ??
                                b.registeredAt ??
                                b.timestamp
                            );

                        return dateB - dateA;
                    }
                );


                renderUsers();
            },

            error => {

                console.error(
                    "Users listener error:",
                    error
                );

                showToast(
                    "Failed to load users.",
                    "error"
                );
            }
        );
    }


    setupUserSearch();

    renderUsers();
}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    const list =
        document.getElementById(
            "usersList"
        );

    const empty =
        document.getElementById(
            "emptyUsers"
        );

    if (!list) {
        return;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

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


    /* =====================================================
       FILTER USERS
    ===================================================== */

    const filteredUsers =
        allUsers.filter(user => {

            if (!search) {
                return true;
            }


            const searchable = [

                user.uid,

                getUserDisplayName(user),

                getUserDisplayEmail(user),

                getUserDisplayPhone(user),

                user.username,

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


            return searchable.includes(
                search
            );
        });


    /* =====================================================
       EMPTY
    ===================================================== */

    if (!filteredUsers.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-users"></i>

                    <h3>
                        No Users Found
                    </h3>

                    <p>
                        No users match your search.
                    </p>

                </div>
            `;
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    /* =====================================================
       USER LIST
    ===================================================== */

    list.innerHTML =
        filteredUsers
            .map(
                user =>
                    renderUserCard(user)
            )
            .join("");


    activateUserViewButtons();
}


/* =========================================================
   USER CARD
========================================================= */

function renderUserCard(user) {

    const uid =
        user.uid;


    const name =
        getUserDisplayName(user);

    const email =
        getUserDisplayEmail(user);

    const phone =
        getUserDisplayPhone(user);

    const photo =
        getUserDisplayPhoto(user);


    const balance =
        getUserBalance(user);

    const deposits =
        getUserTotalDeposits(user);

    const withdrawals =
        getUserTotalWithdrawals(user);

    const referral =
        getUserReferralEarnings(user);

    const profits =
        getUserTotalProfits(user);

    const transactions =
        getUserTransactionCount(user);

    const vipCount =
        getUserVipCount(user);


    const status =
        userStatus(user);


    const createdAt =
        userDate(
            user.createdAt ??
            user.registeredAt ??
            user.timestamp
        );


    /* =====================================================
       AVATAR
    ===================================================== */

    let avatar = `
        <div class="user-avatar">
            <i class="fa-solid fa-user"></i>
        </div>
    `;


    if (photo) {

        avatar = `
            <div class="user-avatar">

                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    onerror="
                        this.style.display='none';
                        this.parentElement
                            .classList.add('avatar-error');
                    "
                >

            </div>
        `;
    }


    /* =====================================================
       STATUS
    ===================================================== */

    const statusIcon =
        status === "active"
            ? "fa-circle-check"
            : "fa-circle-xmark";


    return `
        <article
            class="user-card"
            data-uid="${escapeHTML(uid)}"
        >

            <!-- =========================================
                 USER HEADER
            ========================================== -->

            <div class="user-card-header">

                <div class="user-main-info">

                    ${avatar}

                    <div class="user-name-area">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        <small>
                            ${escapeHTML(phone)}
                        </small>

                    </div>

                </div>


                <div
                    class="
                        user-status
                        status-${escapeHTML(status)}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${statusIcon}
                        "
                    ></i>

                    ${escapeHTML(status)}

                </div>

            </div>


            <!-- =========================================
                 BALANCE
            ========================================== -->

            <div class="user-balance-box">

                <span>
                    <i class="fa-solid fa-wallet"></i>
                    Current Balance
                </span>

                <strong>
                    ${escapeHTML(
                        userMoney(balance)
                    )}
                </strong>

            </div>


            <!-- =========================================
                 FINANCIAL INFORMATION
            ========================================== -->

            <div class="user-financial-grid">

                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-arrow-down"></i>
                        Deposits
                    </span>

                    <strong>
                        ${escapeHTML(
                            userMoney(deposits)
                        )}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-arrow-up"></i>
                        Withdrawals
                    </span>

                    <strong>
                        ${escapeHTML(
                            userMoney(withdrawals)
                        )}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-user-group"></i>
                        Referral Earnings
                    </span>

                    <strong>
                        ${escapeHTML(
                            userMoney(referral)
                        )}
                    </strong>

                </div>


                <div class="user-stat">

                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profits
                    </span>

                    <strong>
                        ${escapeHTML(
                            userMoney(profits)
                        )}
                    </strong>

                </div>

            </div>


            <!-- =========================================
                 ACCOUNT INFORMATION
            ========================================== -->

            <div class="user-account-grid">

                <div>

                    <span>
                        Transactions
                    </span>

                    <strong>
                        ${transactions.toLocaleString(
                            "en-US"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        VIP Plans
                    </span>

                    <strong>
                        ${vipCount.toLocaleString(
                            "en-US"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Referral Code
                    </span>

                    <strong>
                        ${escapeHTML(
                            user.referralCode ||
                            "N/A"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Referred By
                    </span>

                    <strong>
                        ${escapeHTML(
                            user.referredBy ||
                            "None"
                        )}
                    </strong>

                </div>

            </div>


            <!-- =========================================
                 ACCOUNT META
            ========================================== -->

            <div class="user-card-meta">

                <span>
                    <i class="fa-solid fa-calendar"></i>
                    Joined:
                    ${escapeHTML(createdAt)}
                </span>

                <span>
                    UID:
                    ${escapeHTML(uid)}
                </span>

            </div>


            <!-- =========================================
                 ACTION
            ========================================== -->

            <div class="user-card-actions">

                <button
                    type="button"
                    class="user-view-btn"
                    data-uid="${escapeHTML(uid)}"
                >

                    <i class="fa-solid fa-eye"></i>

                    View Details

                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   USER SEARCH
========================================================= */

function setupUserSearch() {

    const search =
        document.getElementById(
            "userSearch"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound = "true";

        search.addEventListener(
            "input",
            renderUsers
        );
    }
}


/* =========================================================
   VIEW USER DETAILS
========================================================= */

function activateUserViewButtons() {

    document
        .querySelectorAll(
            ".user-view-btn"
        )
        .forEach(button => {

            if (
                button.dataset.bound === "true"
            ) {
                return;
            }


            button.dataset.bound = "true";


            button.addEventListener(
                "click",
                () => {

                    const uid =
                        button.dataset.uid;


                    if (!uid) {
                        return;
                    }


                    openUserDetails(uid);
                }
            );
        });
}


/* =========================================================
   USER DETAILS
========================================================= */

function openUserDetails(uid) {

    const user =
        allUsers.find(
            item =>
                item.uid === uid
        );


    if (!user) {

        showToast(
            "User information not found.",
            "error"
        );

        return;
    }


    const name =
        getUserDisplayName(user);

    const email =
        getUserDisplayEmail(user);

    const phone =
        getUserDisplayPhone(user);

    const balance =
        getUserBalance(user);

    const deposits =
        getUserTotalDeposits(user);

    const withdrawals =
        getUserTotalWithdrawals(user);

    const referral =
        getUserReferralEarnings(user);

    const profits =
        getUserTotalProfits(user);

    const transactions =
        getUserTransactionCount(user);

    const vipCount =
        getUserVipCount(user);

    const status =
        userStatus(user);


    /* =====================================================
       REMOVE OLD MODAL
    ===================================================== */

    document
        .getElementById(
            "userDetailsModal"
        )
        ?.remove();


    /* =====================================================
       CREATE MODAL
    ===================================================== */

    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "userDetailsModal";

    modal.className =
        "admin-modal-overlay";


    modal.innerHTML = `

        <div class="admin-modal user-details-modal">

            <div class="admin-modal-header">

                <div>

                    <h2>
                        <i class="fa-solid fa-user"></i>
                        User Details
                    </h2>

                    <p>
                        Complete account information
                    </p>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="closeUserDetailsModal"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <div class="admin-modal-body">

                <div class="user-details-profile">

                    <div class="user-details-avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        <span
                            class="
                                user-status
                                status-${escapeHTML(status)}
                            "
                        >
                            ${escapeHTML(status)}
                        </span>

                    </div>

                </div>


                <div class="user-details-section">

                    <h4>
                        <i class="fa-solid fa-address-card"></i>
                        Personal Information
                    </h4>


                    <div class="user-details-grid">

                        <div>
                            <span>Name</span>
                            <strong>
                                ${escapeHTML(name)}
                            </strong>
                        </div>

                        <div>
                            <span>Email</span>
                            <strong>
                                ${escapeHTML(email)}
                            </strong>
                        </div>

                        <div>
                            <span>Phone</span>
                            <strong>
                                ${escapeHTML(phone)}
                            </strong>
                        </div>

                        <div>
                            <span>UID</span>
                            <strong>
                                ${escapeHTML(uid)}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="user-details-section">

                    <h4>
                        <i class="fa-solid fa-wallet"></i>
                        Financial Summary
                    </h4>


                    <div class="user-details-grid">

                        <div>
                            <span>Balance</span>
                            <strong>
                                ${escapeHTML(
                                    userMoney(balance)
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Total Deposits</span>
                            <strong>
                                ${escapeHTML(
                                    userMoney(deposits)
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Total Withdrawals</span>
                            <strong>
                                ${escapeHTML(
                                    userMoney(withdrawals)
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Referral Earnings</span>
                            <strong>
                                ${escapeHTML(
                                    userMoney(referral)
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Total Profits</span>
                            <strong>
                                ${escapeHTML(
                                    userMoney(profits)
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Transactions</span>
                            <strong>
                                ${transactions.toLocaleString(
                                    "en-US"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="user-details-section">

                    <h4>
                        <i class="fa-solid fa-crown"></i>
                        VIP Information
                    </h4>


                    <div class="user-details-grid">

                        <div>
                            <span>VIP Plans</span>
                            <strong>
                                ${vipCount.toLocaleString(
                                    "en-US"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Referral Code</span>
                            <strong>
                                ${escapeHTML(
                                    user.referralCode ||
                                    "N/A"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Referred By</span>
                            <strong>
                                ${escapeHTML(
                                    user.referredBy ||
                                    "None"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="user-details-section">

                    <h4>
                        <i class="fa-solid fa-database"></i>
                        Account Data
                    </h4>


                    <div class="user-details-json">

                        <pre>${escapeHTML(
                            JSON.stringify(
                                user,
                                null,
                                2
                            )
                        )}</pre>

                    </div>

                </div>

            </div>


            <div class="admin-modal-footer">

                <button
                    type="button"
                    class="admin-modal-secondary"
                    id="closeUserDetailsFooter"
                >
                    Close
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    /* =====================================================
       CLOSE BUTTONS
    ===================================================== */

    const closeModal = () => {

        modal.remove();

    };


    document
        .getElementById(
            "closeUserDetailsModal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "closeUserDetailsFooter"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    /* =====================================================
       CLICK OUTSIDE
    ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }
        }
    );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    const escapeHandler =
        event => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );
            }
        };


    document.addEventListener(
        "keydown",
        escapeHandler
    );
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadUsers =
    loadUsers;

window.renderUsers =
    renderUsers;

window.setupUserSearch =
    setupUserSearch;

window.openUserDetails =
    openUserDetails;


console.log(
    "Money Vault Admin Part 10 loaded."
);     

             /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 11
   TRANSACTIONS MANAGEMENT
   CURRENCY: RWF / FRW
========================================================= */

let allTransactions = [];
let transactionUsers = {};
let transactionListenersStarted = false;


/* =========================================================
   SAFE HELPERS
========================================================= */

function transactionValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}


function transactionMoney(value) {
    return formatMoney(transactionValue(value));
}


function transactionDate(value) {

    const timestamp = transactionValue(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}


function transactionStatus(transaction) {

    return String(
        transaction?.status ||
        "unknown"
    )
        .trim()
        .toLowerCase();
}


function transactionType(transaction) {

    return String(
        transaction?.type ||
        transaction?.transactionType ||
        "Transaction"
    )
        .trim();
}


/* =========================================================
   USER HELPERS
========================================================= */

function getTransactionUserName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User"
    );
}


function getTransactionUserEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}


function getTransactionUserPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}


/* =========================================================
   TRANSACTION ICON
========================================================= */

function getTransactionIcon(type) {

    const value =
        String(type || "")
            .toLowerCase();

    if (
        value.includes("deposit")
    ) {
        return "fa-arrow-down";
    }

    if (
        value.includes("withdraw")
    ) {
        return "fa-arrow-up";
    }

    if (
        value.includes("vip")
    ) {
        return "fa-crown";
    }

    if (
        value.includes("profit")
    ) {
        return "fa-chart-line";
    }

    if (
        value.includes("referral")
    ) {
        return "fa-user-group";
    }

    if (
        value.includes("bonus")
    ) {
        return "fa-gift";
    }

    return "fa-money-bill-transfer";
}


/* =========================================================
   TRANSACTION TYPE CLASS
========================================================= */

function getTransactionTypeClass(type) {

    const value =
        String(type || "")
            .toLowerCase();

    if (
        value.includes("deposit")
    ) {
        return "deposit";
    }

    if (
        value.includes("withdraw")
    ) {
        return "withdraw";
    }

    if (
        value.includes("vip")
    ) {
        return "vip";
    }

    if (
        value.includes("profit")
    ) {
        return "profit";
    }

    if (
        value.includes("referral")
    ) {
        return "referral";
    }

    if (
        value.includes("bonus")
    ) {
        return "bonus";
    }

    return "default";
}


/* =========================================================
   STATUS CLASS
========================================================= */

function getTransactionStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();

    if (
        value === "approved" ||
        value === "completed" ||
        value === "success" ||
        value === "successful"
    ) {
        return "approved";
    }

    if (
        value === "pending" ||
        value === "processing"
    ) {
        return "pending";
    }

    if (
        value === "rejected" ||
        value === "failed" ||
        value === "cancelled" ||
        value === "canceled"
    ) {
        return "rejected";
    }

    if (
        value === "processing_error"
    ) {
        return "error";
    }

    return "unknown";
}


/* =========================================================
   TRANSACTION AMOUNT
========================================================= */

function getTransactionAmount(transaction) {

    return transactionValue(
        transaction?.amount ??
        transaction?.value ??
        transaction?.money
    );
}


/* =========================================================
   TRANSACTION DATE
========================================================= */

function getTransactionTimestamp(transaction) {

    return transactionValue(
        transaction?.createdAt ??
        transaction?.timestamp ??
        transaction?.date ??
        transaction?.approvedAt ??
        transaction?.requestedAt
    );
}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactions() {

    await window.waitForAdmin();

    if (transactionListenersStarted) {

        renderTransactions();

        return;
    }

    transactionListenersStarted = true;


    /* =====================================================
       USERS
    ===================================================== */

    if (!listeners.transactionUsers) {

        listeners.transactionUsers = onValue(

            ref(db, "users"),

            snapshot => {

                transactionUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderTransactions();
            },

            error => {

                console.error(
                    "Transaction users listener error:",
                    error
                );

                showToast(
                    "Failed to load transaction users.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       TRANSACTIONS
    ===================================================== */

    if (!listeners.transactionsManagement) {

        listeners.transactionsManagement = onValue(

            ref(db, "transactions"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allTransactions =
                    Object.entries(data).map(
                        ([id, transaction]) => ({

                            id,

                            ...(transaction || {})

                        })
                    );


                /* -----------------------------------------
                   NEWEST FIRST
                ----------------------------------------- */

                allTransactions.sort(
                    (a, b) =>
                        getTransactionTimestamp(b) -
                        getTransactionTimestamp(a)
                );


                renderTransactions();
            },

            error => {

                console.error(
                    "Transactions listener error:",
                    error
                );

                showToast(
                    "Failed to load transactions.",
                    "error"
                );
            }
        );
    }


    setupTransactionSearch();

    renderTransactions();
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

    if (!list) {
        return;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );

    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    /* =====================================================
       FILTER
    ===================================================== */

    const filterElement =
        document.getElementById(
            "transactionFilter"
        );

    const filter =
        String(
            filterElement?.value || "all"
        )
            .trim()
            .toLowerCase();


    /* =====================================================
       FILTER DATA
    ===================================================== */

    const filtered =
        allTransactions.filter(
            transaction => {

                const type =
                    transactionType(
                        transaction
                    ).toLowerCase();

                const status =
                    transactionStatus(
                        transaction
                    );


                /* -----------------------------------------
                   FILTER
                ----------------------------------------- */

                if (
                    filter !== "all" &&
                    type !== filter &&
                    !type.includes(filter) &&
                    status !== filter
                ) {
                    return false;
                }


                /* -----------------------------------------
                   USER
                ----------------------------------------- */

                const user =
                    transactionUsers[
                        transaction.uid
                    ] || {};


                /* -----------------------------------------
                   SEARCHABLE DATA
                ----------------------------------------- */

                const searchable = [

                    transaction.id,

                    transaction.uid,

                    transaction.type,

                    transaction.transactionType,

                    transaction.status,

                    transaction.amount,

                    transaction.vipName,

                    transaction.requestId,

                    transaction.transactionId,

                    transaction.paymentMethod,

                    transaction.phone,

                    getTransactionUserName(user),

                    getTransactionUserEmail(user),

                    getTransactionUserPhone(user)

                ]
                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null
                    )
                    .join(" ")
                    .toLowerCase();


                return (
                    !search ||
                    searchable.includes(search)
                );
            }
        );


    /* =====================================================
       EMPTY
    ===================================================== */

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-receipt"></i>

                    <h3>
                        No Transactions Found
                    </h3>

                    <p>
                        No transactions match
                        your search or filter.
                    </p>

                </div>
            `;
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    /* =====================================================
       RENDER
    ===================================================== */

    list.innerHTML =
        filtered
            .map(
                transaction =>
                    renderTransactionCard(
                        transaction,
                        transactionUsers[
                            transaction.uid
                        ] || {}
                    )
            )
            .join("");
}


/* =========================================================
   TRANSACTION CARD
========================================================= */

function renderTransactionCard(
    transaction,
    user
) {

    const type =
        transactionType(
            transaction
        );

    const status =
        transactionStatus(
            transaction
        );

    const amount =
        getTransactionAmount(
            transaction
        );

    const timestamp =
        getTransactionTimestamp(
            transaction
        );


    const userName =
        getTransactionUserName(
            user
        );

    const email =
        getTransactionUserEmail(
            user
        );

    const phone =
        getTransactionUserPhone(
            user
        );


    const icon =
        getTransactionIcon(
            type
        );

    const typeClass =
        getTransactionTypeClass(
            type
        );

    const statusClass =
        getTransactionStatusClass(
            status
        );


    /* =====================================================
       AMOUNT DIRECTION
    ===================================================== */

    const typeLower =
        type.toLowerCase();


    const isOutgoing =
        typeLower.includes("withdraw");


    const amountPrefix =
        isOutgoing
            ? "-"
            : typeLower.includes("deposit") ||
              typeLower.includes("profit") ||
              typeLower.includes("bonus") ||
              typeLower.includes("referral")
                ? "+"
                : "";


    /* =====================================================
       VIP EXTRA
    ===================================================== */

    let extraInfo = "";


    if (
        transaction.vipName
    ) {

        extraInfo += `
            <span>
                <i class="fa-solid fa-crown"></i>
                ${escapeHTML(
                    transaction.vipName
                )}
            </span>
        `;
    }


    if (
        transaction.paymentMethod
    ) {

        extraInfo += `
            <span>
                <i class="fa-solid fa-credit-card"></i>
                ${escapeHTML(
                    transaction.paymentMethod
                )}
            </span>
        `;
    }


    if (
        transaction.requestId
    ) {

        extraInfo += `
            <span>
                Request:
                ${escapeHTML(
                    transaction.requestId
                )}
            </span>
        `;
    }


    return `
        <article
            class="transaction-card"
            data-id="${escapeHTML(
                transaction.id
            )}"
        >

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="transaction-card-header">

                <div class="transaction-main">

                    <div
                        class="
                            transaction-icon
                            type-${escapeHTML(
                                typeClass
                            )}
                        "
                    >

                        <i
                            class="
                                fa-solid
                                ${escapeHTML(icon)}
                            "
                        ></i>

                    </div>


                    <div>

                        <h3>
                            ${escapeHTML(type)}
                        </h3>

                        <p>
                            ${escapeHTML(userName)}
                        </p>

                    </div>

                </div>


                <div
                    class="
                        transaction-status
                        status-${escapeHTML(
                            statusClass
                        )}
                    "
                >

                    ${escapeHTML(
                        status.replace(
                            "_",
                            " "
                        )
                    )}

                </div>

            </div>


            <!-- =========================================
                 AMOUNT
            ========================================== -->

            <div class="transaction-amount-box">

                <span>
                    Amount
                </span>

                <strong
                    class="
                        transaction-amount
                        ${
                            isOutgoing
                                ? "amount-out"
                                : "amount-in"
                        }
                    "
                >
                    ${amountPrefix}
                    ${escapeHTML(
                        transactionMoney(
                            amount
                        )
                    )}
                </strong>

            </div>


            <!-- =========================================
                 USER INFORMATION
            ========================================== -->

            <div class="transaction-user-info">

                <div>

                    <span>
                        <i class="fa-solid fa-envelope"></i>
                        Email
                    </span>

                    <strong>
                        ${escapeHTML(email)}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>

            </div>


            <!-- =========================================
                 EXTRA INFORMATION
            ========================================== -->

            ${
                extraInfo
                    ? `
                        <div
                            class="
                                transaction-extra
                            "
                        >
                            ${extraInfo}
                        </div>
                    `
                    : ""
            }


            <!-- =========================================
                 DATE + IDS
            ========================================== -->

            <div class="transaction-meta">

                <span>

                    <i
                        class="
                            fa-solid
                            fa-calendar
                        "
                    ></i>

                    ${escapeHTML(
                        transactionDate(
                            timestamp
                        )
                    )}

                </span>


                <span>

                    Transaction ID:
                    ${escapeHTML(
                        transaction.id
                    )}

                </span>

            </div>


            <div class="transaction-uid">

                UID:
                ${escapeHTML(
                    transaction.uid ||
                    "N/A"
                )}

            </div>

        </article>
    `;
}


/* =========================================================
   SEARCH + FILTER
========================================================= */

function setupTransactionSearch() {

    const search =
        document.getElementById(
            "transactionSearch"
        );

    const filter =
        document.getElementById(
            "transactionFilter"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound =
            "true";


        search.addEventListener(
            "input",
            renderTransactions
        );
    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            renderTransactions
        );
    }
}


/* =========================================================
   REFRESH TRANSACTIONS
========================================================= */

function refreshTransactions() {

    renderTransactions();

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadTransactions =
    loadTransactions;

window.renderTransactions =
    renderTransactions;

window.setupTransactionSearch =
    setupTransactionSearch;

window.refreshTransactions =
    refreshTransactions;


console.log(
    "Money Vault Admin Part 11 loaded."
);  
