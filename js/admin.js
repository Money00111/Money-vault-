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

let adminInitializationStarted = false;

let adminInitializationCompleted = false;

let authStateResolved = false;


/* =========================================================
   ADMIN READY PROMISE
========================================================= */

let resolveAdminReady;

let rejectAdminReady;

const adminReadyPromise =
    new Promise((resolve, reject) => {

        resolveAdminReady = resolve;

        rejectAdminReady = reject;

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

    get authResolved() {

        return authStateResolved;

    },

    get initialized() {

        return adminInitializationCompleted;

    },

    get readyPromise() {

        return adminReadyPromise;

    }

};


/* =========================================================
   CURRENT ADMIN GLOBAL ACCESS
   IMPORTANT:
   Use a getter instead of assigning a snapshot.
========================================================= */

Object.defineProperty(
    window,
    "currentAdmin",
    {

        configurable: true,

        enumerable: true,

        get() {

            return currentAdmin;

        }

    }
);


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

window.waitForAdmin =
    function () {

        if (
            adminReady &&
            currentAdmin
        ) {

            return Promise.resolve(
                currentAdmin
            );

        }

        return adminReadyPromise;

    };


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const adminNameElement =
    document.getElementById(
        "adminName"
    );

const adminEmailElement =
    document.getElementById(
        "adminEmail"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const pageTitle =
    document.getElementById(
        "pageTitle"
    );


/* =========================================================
   MENU LINKS + PAGE SECTIONS
========================================================= */

const menuLinks =
    document.querySelectorAll(
        ".menu-link"
    );

const pageSections =
    document.querySelectorAll(
        ".page-section"
    );


/* =========================================================
   LOADING SCREEN
========================================================= */

function hideLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.classList.add(
        "hidden"
    );

    setTimeout(() => {

        if (!loadingScreen) {
            return;
        }

        loadingScreen.style.display =
            "none";

    }, 300);

}


function showLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.style.display =
        "flex";

    requestAnimationFrame(() => {

        if (!loadingScreen) {
            return;
        }

        loadingScreen.classList.remove(
            "hidden"
        );

    });

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setAdminText(
    element,
    value
) {

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
   HTML ESCAPE
========================================================= */

function adminEscapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST SYSTEM
========================================================= */

function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


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
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${String(
            type
        ).toLowerCase()}`;


    let icon =
        "fa-circle-info";


    if (
        type === "success"
    ) {

        icon =
            "fa-circle-check";

    } else if (
        type === "error"
    ) {

        icon =
            "fa-circle-xmark";

    } else if (
        type === "warning"
    ) {

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


    container.appendChild(
        toast
    );


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    const closeToast =
        () => {

            toast.classList.remove(
                "show"
            );

            setTimeout(() => {

                if (
                    toast.parentNode
                ) {

                    toast.remove();

                }

            }, 300);

        };


    toast
        .querySelector(
            ".toast-close"
        )
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
   VALID PAGE NAMES
========================================================= */

const validPages =
    new Set(
        Object.keys(
            pageTitles
        )
    );


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(
    pageName
) {

    if (!pageName) {
        return false;
    }


    /* -----------------------------------------
       VALIDATE PAGE
    ----------------------------------------- */

    if (
        !validPages.has(
            pageName
        )
    ) {

        console.warn(
            `Unknown admin page: ${pageName}`
        );

        return false;

    }


    /* -----------------------------------------
       HIDE ALL SECTIONS
    ----------------------------------------- */

    pageSections.forEach(
        section => {

            section.classList.remove(
                "active"
            );

            section.style.display =
                "none";

        }
    );


    /* -----------------------------------------
       REMOVE ACTIVE MENU
    ----------------------------------------- */

    menuLinks.forEach(
        link => {

            link.classList.remove(
                "active"
            );

            link.setAttribute(
                "aria-current",
                "false"
            );

        }
    );


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

        return false;

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

        activeLink.setAttribute(
            "aria-current",
            "page"
        );

    }


    /* -----------------------------------------
       PAGE TITLE
    ----------------------------------------- */

    if (pageTitle) {

        pageTitle.textContent =
            pageTitles[pageName] ||
            pageName;

    }


    /* -----------------------------------------
       CLOSE MOBILE SIDEBAR
    ----------------------------------------- */

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    /* -----------------------------------------
       REMEMBER CURRENT PAGE
    ----------------------------------------- */

    window.adminState.currentPage =
        pageName;


    console.log(
        `Admin page opened: ${pageName}`
    );


    return true;

}


/* =========================================================
   GLOBAL NAVIGATION
========================================================= */

window.openPage =
    openPage;


/* =========================================================
   REFRESH CURRENT PAGE
   Used by Quick Actions / other modules.
========================================================= */

window.refreshCurrentPage =
    function () {

        const page =
            window.adminState.currentPage ||
            "dashboard";


        switch (page) {

            case "dashboard":

                if (
                    typeof window.loadDashboard ===
                    "function"
                ) {

                    window.loadDashboard();

                }

                break;


            case "deposits":

                if (
                    typeof window.loadDeposits ===
                    "function"
                ) {

                    window.loadDeposits();

                }

                break;


            case "withdraws":

                if (
                    typeof window.loadWithdraws ===
                    "function"
                ) {

                    window.loadWithdraws();

                }

                break;


            case "vipRequests":

                if (
                    typeof window.loadVipRequests ===
                    "function"
                ) {

                    window.loadVipRequests();

                }

                break;


            case "vipBuyers":

                if (
                    typeof window.loadVipBuyers ===
                    "function"
                ) {

                    window.loadVipBuyers();

                }

                break;


            case "bonusRequests":

                if (
                    typeof window.loadBonusRequests ===
                    "function"
                ) {

                    window.loadBonusRequests();

                }

                break;


            case "users":

                if (
                    typeof window.loadUsers ===
                    "function"
                ) {

                    window.loadUsers();

                }

                break;


            case "transactions":

                if (
                    typeof window.loadTransactions ===
                    "function"
                ) {

                    window.loadTransactions();

                }

                break;


            case "settings":

                if (
                    typeof window.loadSettings ===
                    "function"
                ) {

                    window.loadSettings();

                }

                break;

        }

    };


/* =========================================================
   MENU CLICK EVENTS
========================================================= */

menuLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const page =
                    link.dataset.page;


                if (page) {

                    openPage(
                        page
                    );

                }

            }
        );

    }
);


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
   LOGOUT FUNCTION
========================================================= */

async function adminLogout() {

    try {

        showLoadingScreen();

        await signOut(
            auth
        );


        currentAdmin =
            null;

        adminReady =
            false;

        adminInitializationCompleted =
            false;


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


/* =========================================================
   GLOBAL LOGOUT
========================================================= */

window.adminLogout =
    adminLogout;


/* =========================================================
   LOGOUT BUTTON
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        adminLogout
    );

}


/* =========================================================
   CLEAN FIREBASE LISTENERS
   IMPORTANT:
   All Parts should store unsubscribe functions
   inside the global listeners object.
========================================================= */

function cleanupAdminListeners() {

    Object.keys(
        listeners
    ).forEach(
        key => {

            const unsubscribe =
                listeners[key];


            if (
                typeof unsubscribe ===
                "function"
            ) {

                try {

                    unsubscribe();

                } catch (error) {

                    console.warn(
                        `Failed to remove listener: ${key}`,
                        error
                    );

                }

            }


            delete listeners[key];

        }
    );

}


/* =========================================================
   GLOBAL LISTENER CLEANUP
========================================================= */

window.cleanupAdminListeners =
    cleanupAdminListeners;


/* =========================================================
   ADMIN PAGE INITIALIZATION
========================================================= */

async function initializeAdminPages() {

    if (
        adminInitializationStarted
    ) {

        console.warn(
            "Admin initialization already started."
        );

        return;

    }


    adminInitializationStarted =
        true;


    try {

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


        adminInitializationCompleted =
            true;


        console.log(
            "All available admin modules initialized."
        );


    } catch (error) {

        adminInitializationCompleted =
            false;

        console.error(
            "Admin page initialization error:",
            error
        );

        showToast(
            "Some administrator modules could not be initialized.",
            "warning"
        );

    }

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

                authStateResolved =
                    true;

                adminReady =
                    false;

                currentAdmin =
                    null;


                console.warn(
                    "No authenticated user."
                );


                cleanupAdminListeners();


                window.location.href =
                    "login.html";


                return;

            }


            /* -----------------------------------------
               LOGGED-IN USER
            ----------------------------------------- */

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
                await get(
                    adminRef
                );


            /* -----------------------------------------
               NOT ADMIN
            ----------------------------------------- */

            if (
                !adminSnapshot.exists()
            ) {

                authStateResolved =
                    true;

                adminReady =
                    false;

                currentAdmin =
                    null;


                console.warn(
                    "User is not an administrator."
                );


                showToast(
                    "Access denied. Administrator account required.",
                    "error"
                );


                cleanupAdminListeners();


                try {

                    await signOut(
                        auth
                    );

                } catch (
                    signOutError
                ) {

                    console.error(
                        "Sign out error:",
                        signOutError
                    );

                }


                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    800
                );


                return;

            }


            /* -----------------------------------------
               ADMIN DATA
            ----------------------------------------- */

            const adminData =
                adminSnapshot.val() ||
                {};


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

                ...adminData,

                uid:
                    user.uid

            };


            /* -----------------------------------------
               AUTH STATE READY
            ----------------------------------------- */

            authStateResolved =
                true;

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
               ADMIN BODY STATE
            ----------------------------------------- */

            document.body.classList.add(
                "admin-authenticated"
            );


            document.body.dataset.adminUid =
                currentAdmin.uid;


            /* -----------------------------------------
               SHOW DEFAULT PAGE
            ----------------------------------------- */

            openPage(
                "dashboard"
            );


            /* -----------------------------------------
               HIDE LOADING
            ----------------------------------------- */

            hideLoadingScreen();


            console.log(
                "Money Vault Admin authenticated:",
                currentAdmin
            );


            /* -----------------------------------------
               INITIALIZE ALL ADMIN MODULES
            ----------------------------------------- */

            await initializeAdminPages();


        } catch (error) {

            console.error(
                "Admin authentication error:",
                error
            );


            adminReady =
                false;

            authStateResolved =
                true;


            hideLoadingScreen();


            showToast(
                error?.message ||
                "Unable to initialize administrator panel.",
                "error"
            );


            /* -----------------------------------------
               CLEANUP
            ----------------------------------------- */

            cleanupAdminListeners();


            /* -----------------------------------------
               SECURITY:
               If admin verification failed,
               return to login.
            ----------------------------------------- */

            currentAdmin =
                null;


            document.body.classList.remove(
                "admin-authenticated"
            );


            try {

                await signOut(
                    auth
                );

            } catch (
                signOutError
            ) {

                console.error(
                    "Sign out error:",
                    signOutError
                );

            }


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1200
            );

        }

    }
);


/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * If authentication is still loading,
         * dashboard is shown visually but data waits
         * for admin authentication.
         */

        openPage(
            "dashboard"
        );

    }
);


/* =========================================================
   PAGE VISIBILITY HANDLER
   Helps mobile/browser tab restoration.
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (
                adminReady &&
                currentAdmin
            ) {

                /*
                 * Do not recreate Firebase listeners.
                 * Existing Parts control their own listeners.
                 */

                console.log(
                    "Money Vault Admin page active."
                );

            }

        }

    }
);


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
         * Firebase onValue listeners are normally
         * destroyed with the page, but this also cleans
         * our registered unsubscribe functions.
         */

        cleanupAdminListeners();

    }
);


/* =========================================================
   GLOBAL ADMIN HELPERS
========================================================= */

window.getCurrentAdmin =
    function () {

        return currentAdmin;

    };


window.isAdminReady =
    function () {

        return (
            adminReady &&
            !!currentAdmin
        );

    };


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
    "Admin authentication: Firebase Auth + admins/{uid}"
);

console.log(
    "Firebase Database imports: ref, get, onValue, update, set, push, runTransaction"
);

console.log(
    "Part 1: ADMIN AUTH + NAVIGATION + INITIALIZATION READY"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2
   DASHBOARD + DATA LISTENERS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   COMMON DASHBOARD HELPERS
   IMPORTANT:
   These helpers are exported for Parts 3-11.
========================================================= */

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value === undefined ||
            value === null
                ? ""
                : String(value);

    }

}


/* =========================================================
   SAFE NUMBER
========================================================= */

function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(
        status ?? "pending"
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

}


/* =========================================================
   NORMALIZE TYPE
========================================================= */

function normalizeTransactionType(type) {

    return String(
        type ?? "transaction"
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");

}


/* =========================================================
   FORMAT MONEY
   MONEY VAULT = RWF / FRW
========================================================= */

function formatMoney(amount) {

    return (
        numberValue(amount)
            .toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )
        + " RWF"
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    let value =
        numberValue(timestamp);


    if (!value) {

        return "N/A";

    }


    /*
     * Firebase timestamps are normally
     * milliseconds.
     *
     * If a timestamp is accidentally stored
     * in seconds, convert it.
     */

    if (
        value > 0 &&
        value < 100000000000
    ) {

        value *= 1000;

    }


    try {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "N/A";

        }


        return date.toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch (error) {

        console.error(
            "formatDate error:",
            error
        );

        return "N/A";

    }

}


/* =========================================================
   SAFE HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   GET TIMESTAMP
   Supports multiple existing DB field names.
========================================================= */

function getDataTimestamp(data) {

    if (!data) {

        return 0;

    }


    const timestamp =
        data.createdAt ??
        data.timestamp ??
        data.date ??
        data.requestDate ??
        data.approvedAt ??
        data.updatedAt ??
        data.time ??
        0;


    return numberValue(
        timestamp
    );

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

let dashboardListenersStarted =
    false;


/* =========================================================
   DASHBOARD ERROR CONTROL
========================================================= */

let dashboardErrorShown = {

    users: false,

    deposits: false,

    withdraws: false,

    transactions: false

};


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        await window.waitForAdmin();


        /*
         * Prevent duplicate Firebase listeners.
         */

        if (
            dashboardListenersStarted
        ) {

            renderDashboard();

            return;

        }


        dashboardListenersStarted =
            true;
/* =========================================================
   QUICK ACTION — WITHDRAWS
========================================================= */

const openWithdrawsBtn = document.getElementById("openWithdraws");

if (openWithdrawsBtn && !openWithdrawsBtn.dataset.bound) {

    openWithdrawsBtn.dataset.bound = "true";

    openWithdrawsBtn.addEventListener("click", async () => {

        /* -----------------------------------------
           OPEN WITHDRAW PAGE
        ----------------------------------------- */

        openPage("withdraws");

        /* -----------------------------------------
           LOAD WITHDRAW LIST
        ----------------------------------------- */

        try {

            await loadWithdraws();

            /* Ensure list is rendered immediately */
            if (typeof renderWithdrawRequests === "function") {
                renderWithdrawRequests();
            }

            /* Ensure search/filter are active */
            if (typeof setupWithdrawSearch === "function") {
                setupWithdrawSearch();
            }

        } catch (error) {

            console.error(
                "Quick Action Withdraw error:",
                error
            );

            showToast(
                "Unable to load withdraw requests.",
                "error"
            );

        }

    });

}

        /* =================================================
           USERS LISTENER
        ================================================= */

        if (
            !listeners.dashboardUsers
        ) {

            listeners.dashboardUsers =
                onValue(

                    ref(
                        db,
                        "users"
                    ),

                    snapshot => {

                        dashboardUsers =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.users =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard users listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.users
                        ) {

                            dashboardErrorShown.users =
                                true;


                            showToast(
                                "Failed to load users data.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           DEPOSIT REQUESTS LISTENER
        ================================================= */

        if (
            !listeners.dashboardDeposits
        ) {

            listeners.dashboardDeposits =
                onValue(

                    ref(
                        db,
                        "depositRequests"
                    ),

                    snapshot => {

                        dashboardDeposits =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.deposits =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard deposits listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.deposits
                        ) {

                            dashboardErrorShown.deposits =
                                true;


                            showToast(
                                "Failed to load deposit data.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           WITHDRAW REQUESTS LISTENER
        ================================================= */

        if (
            !listeners.dashboardWithdraws
        ) {

            listeners.dashboardWithdraws =
                onValue(

                    ref(
                        db,
                        "withdrawRequests"
                    ),

                    snapshot => {

                        dashboardWithdraws =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.withdraws =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard withdraws listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.withdraws
                        ) {

                            dashboardErrorShown.withdraws =
                                true;


                            showToast(
                                "Failed to load withdraw data.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           TRANSACTIONS LISTENER
        ================================================= */

        if (
            !listeners.dashboardTransactions
        ) {

            listeners.dashboardTransactions =
                onValue(

                    ref(
                        db,
                        "transactions"
                    ),

                    snapshot => {

                        dashboardTransactions =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.transactions =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard transactions listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.transactions
                        ) {

                            dashboardErrorShown.transactions =
                                true;


                            showToast(
                                "Failed to load transactions.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           INITIAL RENDER
        ================================================= */

        renderDashboard();


        console.log(
            "Dashboard listeners initialized."
        );


    } catch (error) {

        console.error(
            "loadDashboard error:",
            error
        );


        dashboardListenersStarted =
            false;


        showToast(
            error?.message ||
            "Unable to load dashboard.",
            "error"
        );

    }

}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {


    /* =====================================================
       USERS
    ===================================================== */

    const users =
        Object.values(
            dashboardUsers || {}
        );


    const totalUsers =
        users.length;


    /* =====================================================
       SYSTEM BALANCE
       READ ONLY
    ===================================================== */

    let systemBalance =
        0;


    users.forEach(
        user => {

            if (!user) {
                return;
            }


            systemBalance +=
                numberValue(
                    user.balance
                );

        }
    );


    /* =====================================================
       DEPOSITS
    ===================================================== */

    const deposits =
        Object.values(
            dashboardDeposits || {}
        );


    let totalDeposits =
        0;


    let pendingDeposits =
        0;


    let approvedDeposits =
        0;


    deposits.forEach(
        deposit => {

            if (!deposit) {
                return;
            }


            const status =
                normalizeStatus(
                    deposit.status
                );


            const amount =
                numberValue(
                    deposit.amount
                );


            if (
                status === "approved"
            ) {

                approvedDeposits++;

                totalDeposits +=
                    amount;

            }


            if (
                status === "pending" ||
                status === "processing"
            ) {

                pendingDeposits++;

            }

        }
    );


    /* =====================================================
       WITHDRAWS
    ===================================================== */

    const withdraws =
        Object.values(
            dashboardWithdraws || {}
        );


    let totalWithdraws =
        0;


    withdraws.forEach(
        withdraw => {

            if (!withdraw) {
                return;
            }


            const status =
                normalizeStatus(
                    withdraw.status
                );


            const amount =
                numberValue(
                    withdraw.amount
                );


            if (
                status === "approved"
            ) {

                totalWithdraws +=
                    amount;

            }

        }
    );


    /* =====================================================
       UPDATE DASHBOARD
===================================================== */

    updateText(
        "totalUsers",
        totalUsers.toLocaleString(
            "en-US"
        )
    );


    updateText(
        "dashboardTotalDeposits",
        formatMoney(
            totalDeposits
        )
    );


    updateText(
        "dashboardPendingDeposits",
        pendingDeposits.toLocaleString(
            "en-US"
        )
    );


    /*
     * Existing HTML ID:
     * dashboardApprovedDeposits
     *
     * We keep it as approved deposit amount
     * to remain compatible with the current
     * Money Vault dashboard.
     */

    updateText(
        "dashboardApprovedDeposits",
        formatMoney(
            totalDeposits
        )
    );


    updateText(
        "dashboardTotalWithdraws",
        formatMoney(
            totalWithdraws
        )
    );


    updateText(
        "systemBalance",
        formatMoney(
            systemBalance
        )
    );


    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    renderRecentActivity();

}


/* =========================================================
   GET TRANSACTION USER
========================================================= */

function getDashboardTransactionUser(
    transaction
) {

    if (!transaction) {

        return null;

    }


    const uid =
        transaction.uid ||
        transaction.userId;


    if (!uid) {

        return null;

    }


    return (
        dashboardUsers?.[uid] ||
        null
    );

}


/* =========================================================
   GET TRANSACTION USER NAME
========================================================= */

function getDashboardUserName(
    transaction
) {

    const user =
        getDashboardTransactionUser(
            transaction
        );


    return (
        transaction?.userName ||
        transaction?.name ||
        transaction?.displayName ||
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        user?.email ||
        "User"
    );

}


/* =========================================================
   GET TRANSACTION USER EMAIL
========================================================= */

function getDashboardUserEmail(
    transaction
) {

    const user =
        getDashboardTransactionUser(
            transaction
        );


    return (
        transaction?.userEmail ||
        transaction?.email ||
        user?.email ||
        ""
    );

}


/* =========================================================
   GET TRANSACTION USER PHONE
========================================================= */

function getDashboardUserPhone(
    transaction
) {

    const user =
        getDashboardTransactionUser(
            transaction
        );


    return (
        transaction?.phone ||
        transaction?.phoneNumber ||
        user?.phone ||
        user?.phoneNumber ||
        ""
    );

}


/* =========================================================
   GET TRANSACTION TYPE DISPLAY
========================================================= */

function getDashboardTransactionType(
    transaction
) {

    const type =
        normalizeTransactionType(
            transaction?.type ??
            transaction?.transactionType ??
            "transaction"
        );


    if (
        type === "deposit" ||
        type === "deposit_approved" ||
        type === "depositapproved"
    ) {

        return {

            key: "deposit",

            title: "Deposit",

            icon:
                "fa-circle-arrow-down",

            direction:
                "+",

            className:
                "deposit"

        };

    }


    if (
        type === "withdraw" ||
        type === "withdrawal" ||
        type === "withdraw_request"
    ) {

        return {

            key: "withdraw",

            title: "Withdraw",

            icon:
                "fa-circle-arrow-up",

            direction:
                "-",

            className:
                "withdraw"

        };

    }


    if (
        type === "vip" ||
        type === "vip_purchase" ||
        type === "vippurchase"
    ) {

        return {

            key: "vip",

            title:
                "VIP Purchase",

            icon:
                "fa-crown",

            direction:
                "-",

            className:
                "vip"

        };

    }


    if (
        type === "profit" ||
        type === "daily_profit" ||
        type === "dailyprofit"
    ) {

        return {

            key: "profit",

            title:
                "Profit",

            icon:
                "fa-chart-line",

            direction:
                "+",

            className:
                "profit"

        };

    }


    if (
        type === "bonus" ||
        type === "registration_bonus" ||
        type === "signup_bonus"
    ) {

        return {

            key: "bonus",

            title:
                "Bonus",

            icon:
                "fa-gift",

            direction:
                "+",

            className:
                "bonus"

        };

    }


    if (
        type === "referral" ||
        type === "referral_bonus" ||
        type === "referralbonus"
    ) {

        return {

            key: "referral",

            title:
                "Referral Bonus",

            icon:
                "fa-user-group",

            direction:
                "+",

            className:
                "referral"

        };

    }


    return {

        key:
            "transaction",

        title:
            "Transaction",

        icon:
            "fa-money-bill-transfer",

        direction:
            "",

        className:
            "transaction"

    };

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
        )
        .map(
            ([id, transaction]) => {

                return {

                    id,

                    ...(transaction || {})

                };

            }
        );


    /* =====================================================
       SORT NEWEST FIRST
    ===================================================== */

    transactions.sort(
        (a, b) => {

            return (
                getDataTimestamp(b) -
                getDataTimestamp(a)
            );

        }
    );


    /* =====================================================
       ONLY LAST 10
    ===================================================== */

    const recent =
        transactions.slice(
            0,
            10
        );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!recent.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="
                    fa-solid
                    fa-clock-rotate-left
                "></i>

                <p>
                    No recent activity.
                </p>

            </div>

        `;

        return;

    }


    /* =====================================================
       RENDER
    ===================================================== */

    container.innerHTML =
        recent
            .map(
                transaction => {

                    const transactionInfo =
                        getDashboardTransactionType(
                            transaction
                        );


                    const status =
                        normalizeStatus(
                            transaction.status
                        );


                    const amount =
                        numberValue(
                            transaction.amount
                        );


                    const userName =
                        getDashboardUserName(
                            transaction
                        );


                    const userEmail =
                        getDashboardUserEmail(
                            transaction
                        );


                    const userPhone =
                        getDashboardUserPhone(
                            transaction
                        );


                    const date =
                        formatDate(
                            getDataTimestamp(
                                transaction
                            )
                        );


                    const amountDisplay =
                        `${transactionInfo.direction}${formatMoney(amount)}`;


                    const userExtra =
                        userEmail ||
                        userPhone ||
                        "";


                    return `

                        <div
                            class="
                                activity-item
                                activity-${escapeHTML(
                                    transactionInfo.className
                                )}
                            "
                            data-transaction-id="${escapeHTML(
                                transaction.id
                            )}"
                        >

                            <!-- ACTIVITY ICON -->

                            <div class="
                                activity-icon
                                activity-icon-${escapeHTML(
                                    transactionInfo.className
                                )}
                            ">

                                <i class="
                                    fa-solid
                                    ${escapeHTML(
                                        transactionInfo.icon
                                    )}
                                "></i>

                            </div>


                            <!-- ACTIVITY CONTENT -->

                            <div class="
                                activity-content
                            ">

                                <div class="
                                    activity-title
                                ">

                                    ${escapeHTML(
                                        transactionInfo.title
                                    )}

                                </div>


                                <div class="
                                    activity-user
                                ">

                                    ${escapeHTML(
                                        userName
                                    )}

                                </div>


                                ${
                                    userExtra
                                        ? `
                                            <div class="
                                                activity-user-extra
                                            ">

                                                ${escapeHTML(
                                                    userExtra
                                                )}

                                            </div>
                                        `
                                        : ""
                                }


                                <div class="
                                    activity-date
                                ">

                                    ${escapeHTML(
                                        date
                                    )}

                                </div>

                            </div>


                            <!-- ACTIVITY RIGHT -->

                            <div class="
                                activity-right
                            ">

                                <div class="
                                    activity-amount
                                    activity-amount-${escapeHTML(
                                        transactionInfo.className
                                    )}
                                ">

                                    ${escapeHTML(
                                        amountDisplay
                                    )}

                                </div>


                                <div class="
                                    activity-status
                                    status-${escapeHTML(
                                        status
                                    )}
                                ">

                                    ${escapeHTML(
                                        status
                                    )}

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
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

        openDeposits:
            "deposits",

        openWithdraws:
            "withdraws",

        openUsers:
            "users",

        openTransactions:
            "transactions",

        openSettings:
            "settings",

        openVipRequests:
            "vipRequests"

    };


    Object.entries(
        actions
    ).forEach(
        ([id, page]) => {

            const button =
                document.getElementById(
                    id
                );


            if (!button) {

                return;

            }


            /*
             * Prevent duplicate
             * click listeners.
             */

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

                        window.openPage(
                            page
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   GET DASHBOARD CACHE
   Useful for future Parts / debugging.
========================================================= */

window.getDashboardCache =
    function () {

        return {

            users:
                dashboardUsers,

            deposits:
                dashboardDeposits,

            withdraws:
                dashboardWithdraws,

            transactions:
                dashboardTransactions

        };

    };


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


window.normalizeTransactionType =
    normalizeTransactionType;


window.formatMoney =
    formatMoney;


window.formatDate =
    formatDate;


window.escapeHTML =
    escapeHTML;


window.getDataTimestamp =
    getDataTimestamp;


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

console.log(
    "Dashboard data paths:"
);

console.log(
    " - users"
);

console.log(
    " - depositRequests"
);

console.log(
    " - withdrawRequests"
);

console.log(
    " - transactions"
);

console.log(
    "Recent activity: user lookup by UID enabled."
);

console.log(
    "Dashboard listeners: protected against duplicates."
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
   - User avatar
   - Approve / Reject buttons
   - One-time button protection
   - Processing state support
   - Approved / Rejected history
   - Compatible with PART 1, PART 2 and PART 4
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
        .toLowerCase()
        .replace(/\s+/g, "_");
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
        user?.telephone ||
        "N/A"
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
   PAYMENT METHOD
========================================================= */

function depositPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        request?.provider ||
        request?.network ||
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
        request?.referenceId ||
        "N/A"
    );
}


/* =========================================================
   REQUEST DATE
========================================================= */

function depositRequestDate(request) {

    if (!request) {
        return 0;
    }

    return (
        request.createdAt ??
        request.timestamp ??
        request.date ??
        request.requestedAt ??
        request.created_at ??
        0
    );
}


/* =========================================================
   NORMALIZE TIMESTAMP
========================================================= */

function normalizeDepositTimestamp(value) {

    let timestamp = depositValue(value);

    if (!timestamp) {
        return 0;
    }

    /*
       Firebase data can sometimes contain seconds
       instead of milliseconds.
    */

    if (timestamp < 100000000000) {
        timestamp *= 1000;
    }

    return timestamp;
}


/* =========================================================
   REQUEST STATUS LABEL
========================================================= */

function depositStatusLabel(status) {

    const normalized =
        depositStatus(status);

    switch (normalized) {

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
            return normalized
                .replace(/_/g, " ")
                .replace(/\b\w/g, char =>
                    char.toUpperCase()
                );
    }
}


/* =========================================================
   STATUS ICON
========================================================= */

function depositStatusIcon(status) {

    switch (
        depositStatus(status)
    ) {

        case "approved":
            return "fa-circle-check";

        case "rejected":
            return "fa-circle-xmark";

        case "processing":
            return "fa-spinner fa-spin";

        case "processing_error":
            return "fa-triangle-exclamation";

        case "pending":
        default:
            return "fa-clock";
    }
}


/* =========================================================
   STATUS CLASS
========================================================= */

function depositStatusClass(status) {

    const normalized =
        depositStatus(status);

    return [
        "pending",
        "processing",
        "approved",
        "rejected",
        "processing_error"
    ].includes(normalized)
        ? normalized
        : "pending";
}


/* =========================================================
   LOAD DEPOSITS
========================================================= */

async function loadDeposits() {

    try {

        await window.waitForAdmin();


        /* =================================================
           PREVENT DUPLICATE LISTENERS
        ================================================= */

        if (depositListenersStarted) {

            renderDepositRequests();

            setupDepositSearch();

            return;
        }


        depositListenersStarted = true;


        /* =================================================
           USERS LISTENER
        ================================================= */

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


        /* =================================================
           DEPOSIT REQUESTS LISTENER
        ================================================= */

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


                    /* =====================================
                       NEWEST FIRST
                    ===================================== */

                    allDepositRequests.sort(
                        (a, b) => {

                            return (
                                normalizeDepositTimestamp(
                                    depositRequestDate(b)
                                ) -
                                normalizeDepositTimestamp(
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


        setupDepositSearch();

        renderDepositRequests();


    } catch (error) {

        console.error(
            "loadDeposits error:",
            error
        );

        depositListenersStarted = false;

        showToast(
            "Unable to load deposits.",
            "error"
        );

    }

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

            }


            else if (
                status === "approved"
            ) {

                approvedCount++;

            }


            else if (
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


                /* =========================================
                   STATUS FILTER
                ========================================= */

                if (
                    filter !== "all" &&
                    status !== filter
                ) {

                    return false;

                }


                /* =========================================
                   USER
                ========================================= */

                const uid =
                    String(
                        request.uid ||
                        request.userId ||
                        ""
                    )
                    .toLowerCase();


                const requestUid =
                    request.uid ||
                    request.userId ||
                    "";


                const user =
                    depositUsers[
                        requestUid
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


                /* =========================================
                   REQUEST DATA
                ========================================= */

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


                const amount =
                    String(
                        request.amount ?? ""
                    )
                    .toLowerCase();


                const requestStatus =
                    depositStatusLabel(
                        status
                    )
                    .toLowerCase();


                /* =========================================
                   SEARCH
                ========================================= */

                if (search) {

                    const searchableText = [

                        uid,

                        name,

                        email,

                        phone,

                        transactionId,

                        method,

                        requestId,

                        amount,

                        requestStatus

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

            empty.style.display =
                "block";


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

        empty.style.display =
            "none";

    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    list.innerHTML =
        filtered
            .map(
                request => {

                    const requestUid =
                        request.uid ||
                        request.userId ||
                        "";

                    return renderDepositCard(
                        request,
                        depositUsers[
                            requestUid
                        ] || {}
                    );

                }
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


    const statusClass =
        depositStatusClass(
            status
        );


    const statusLabel =
        depositStatusLabel(
            status
        );


    const statusIcon =
        depositStatusIcon(
            status
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
        request.userId ||
        "N/A";


    const photo =
        depositUserPhoto(
            user
        );


    /* =====================================================
       AVATAR
    ===================================================== */

    const avatar =
        photo
            ? `

                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    class="deposit-avatar"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        if(this.nextElementSibling){
                            this.nextElementSibling.style.display='flex';
                        }
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

                <div
                    class="deposit-avatar-fallback"
                >
                    <i class="fa-solid fa-user"></i>
                </div>

              `;


    /* =====================================================
       ACTIONS
    ===================================================== */

    let actions = "";


    if (status === "pending") {

        actions = `

            <div class="deposit-actions">

                <button
                    type="button"
                    class="
                        deposit-action-btn
                        approve-deposit-btn
                    "
                    data-id="${escapeHTML(request.id)}"
                >

                    <i class="fa-solid fa-check"></i>

                    Approve

                </button>


                <button
                    type="button"
                    class="
                        deposit-action-btn
                        reject-deposit-btn
                    "
                    data-id="${escapeHTML(request.id)}"
                >

                    <i class="fa-solid fa-xmark"></i>

                    Reject

                </button>

            </div>

        `;

    }


    else {

        actions = `

            <div
                class="
                    deposit-processed-message
                    status-${escapeHTML(statusClass)}
                "
            >

                <i class="
                    fa-solid
                    ${escapeHTML(statusIcon)}
                "></i>

                ${escapeHTML(statusLabel)}

            </div>

        `;

    }


    /* =====================================================
       OPTIONAL ERROR / REJECTION MESSAGE
    ===================================================== */

    let statusMessage = "";


    if (
        request.rejectionReason ||
        request.reason ||
        request.error
    ) {

        const message =
            request.rejectionReason ||
            request.reason ||
            request.error;


        statusMessage = `

            <div class="deposit-status-message">

                <i class="
                    fa-solid
                    fa-circle-info
                "></i>

                <span>
                    ${escapeHTML(
                        String(message)
                    )}
                </span>

            </div>

        `;

    }


    /* =====================================================
       CARD
    ===================================================== */

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


                <div
                    class="
                        deposit-status
                        status-${escapeHTML(statusClass)}
                    "
                >

                    <i class="
                        fa-solid
                        ${escapeHTML(statusIcon)}
                    "></i>

                    ${escapeHTML(statusLabel)}

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

                        <i class="
                            fa-solid
                            fa-mobile-screen-button
                        "></i>

                        Phone

                    </span>


                    <strong>

                        ${escapeHTML(phone)}

                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>

                        <i class="
                            fa-solid
                            fa-wallet
                        "></i>

                        Payment Method

                    </span>


                    <strong>

                        ${escapeHTML(method)}

                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>

                        <i class="
                            fa-solid
                            fa-receipt
                        "></i>

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

                        <i class="
                            fa-solid
                            fa-calendar
                        "></i>

                        Requested

                    </span>


                    <strong>

                        ${escapeHTML(date)}

                    </strong>

                </div>

            </div>


            <!-- =========================================
                 TECHNICAL INFORMATION
            ========================================== -->

            <div class="deposit-meta">

                <span>

                    UID:
                    ${escapeHTML(String(uid))}

                </span>


                <span>

                    Request:
                    ${escapeHTML(String(request.id))}

                </span>

            </div>


            <!-- =========================================
                 STATUS MESSAGE
            ========================================== -->

            ${statusMessage}


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


    /* =====================================================
       APPROVE BUTTONS
    ===================================================== */

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


                    /*
                       ONE-TIME UI PROTECTION

                       Prevent double-click while
                       Firebase approval is running.
                    */

                    if (
                        button.dataset.processing ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset.processing =
                        "true";


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

                        await approveDeposit(
                            id
                        );


                    } catch (error) {

                        console.error(
                            "Approve deposit button error:",
                            error
                        );


                        /*
                           Restore button only if
                           the card still exists.
                        */

                        button.disabled =
                            false;


                        button.dataset.processing =
                            "false";


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


    /* =====================================================
       REJECT BUTTONS
    ===================================================== */

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


                    /*
                       ONE-TIME UI PROTECTION
                    */

                    if (
                        button.dataset.processing ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset.processing =
                        "true";


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
                            "Reject deposit button error:",
                            error
                        );


                        button.disabled =
                            false;


                        button.dataset.processing =
                            "false";


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
   SEARCH + FILTER
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


    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound =
            "true";


        search.addEventListener(
            "input",
            () => {

                renderDepositRequests();

            }
        );

    }


    /* =====================================================
       FILTER
    ===================================================== */

    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            () => {

                renderDepositRequests();

            }
        );

    }

}


/* =========================================================
   REFRESH DEPOSIT LIST
========================================================= */

function refreshDeposits() {

    renderDepositRequests();

}


/* =========================================================
   GET DEPOSIT CACHE
========================================================= */

function getDepositCache() {

    return {

        requests: allDepositRequests,

        users: depositUsers

    };

}


/* =========================================================
   INITIALIZE SEARCH / FILTER SAFELY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setupDepositSearch();

        },
        {
            once: true
        }
    );

}

else {

    setupDepositSearch();

}


/* =========================================================
   EXPORT
========================================================= */

window.loadDeposits =
    loadDeposits;


window.renderDepositRequests =
    renderDepositRequests;


window.setupDepositSearch =
    setupDepositSearch;


window.refreshDeposits =
    refreshDeposits;


window.getDepositCache =
    getDepositCache;


/*
   approveDeposit() and rejectDeposit()
   are implemented in PART 4.

   We intentionally do NOT redefine them here.
*/


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 3 loaded successfully."
);

console.log(
    "Deposit currency: RWF / FRW"
);

console.log(
    "Deposit approval logic: PART 4"
);

console.log(
    "Deposit listeners ready:",
    {
        users: !!listeners.depositUsers,
        requests: !!listeners.depositRequests
    }
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 4
   APPROVE / REJECT DEPOSIT REQUESTS
   CURRENCY: RWF / FRW

   FEATURES:
   - Admin-only approval
   - One-time approval protection
   - Atomic request locking
   - Automatic balance update
   - Automatic totalDeposits update
   - Automatic totalTransactions update
   - Transaction history creation
   - Reject deposit
   - Processing / processing_error protection
   - Compatible with PART 1, PART 2 and PART 3

   IMPORTANT:
   - PART 3 handles the UI/list.
   - PART 4 handles the actual approval/rejection.
   - Do NOT redeclare listeners/currentAdmin here.
========================================================= */


/* =========================================================
   APPROVE DEPOSIT
========================================================= */

async function approveDeposit(id) {

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    await window.waitForAdmin();


    if (!currentAdmin?.uid) {

        showToast(
            "Administrator authentication required.",
            "error"
        );

        throw new Error(
            "Administrator is not authenticated."
        );

    }


    /* =====================================================
       VALIDATE REQUEST ID
    ===================================================== */

    if (!id) {

        showToast(
            "Invalid deposit request.",
            "error"
        );

        throw new Error(
            "Deposit request ID is missing."
        );

    }


    const requestRef =
        ref(
            db,
            `depositRequests/${id}`
        );


    /* =====================================================
       READ REQUEST
    ===================================================== */

    const requestSnapshot =
        await get(
            requestRef
        );


    if (!requestSnapshot.exists()) {

        showToast(
            "Deposit request was not found.",
            "error"
        );

        throw new Error(
            "Deposit request does not exist."
        );

    }


    const request =
        requestSnapshot.val() || {};


    const status =
        String(
            request.status ??
            "pending"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       ONE-TIME PROTECTION
    ===================================================== */

    if (status !== "pending") {

        showToast(
            `This deposit is already ${status.replace("_", " ")}.`,
            "warning"
        );

        return false;

    }


    /* =====================================================
       USER ID
    ===================================================== */

    const uid =
        request.uid ||
        request.userId ||
        null;


    if (!uid) {

        showToast(
            "Deposit request has no user ID.",
            "error"
        );

        throw new Error(
            "Deposit request UID is missing."
        );

    }


    /* =====================================================
       AMOUNT
    ===================================================== */

    const amount =
        Number(
            request.amount
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showToast(
            "Invalid deposit amount.",
            "error"
        );

        throw new Error(
            "Invalid deposit amount."
        );

    }


    /* =====================================================
       CONFIRM
    ===================================================== */

    const confirmed =
        window.confirm(
            `Approve deposit of ${formatMoney(amount)}?`
        );


    if (!confirmed) {

        return false;

    }


    /* =====================================================
       STEP 1
       LOCK REQUEST
    ===================================================== */

    let lockResult;


    try {

        lockResult =
            await runTransaction(
                requestRef,

                currentRequest => {

                    if (
                        currentRequest === null
                    ) {

                        return;

                    }


                    const currentStatus =
                        String(
                            currentRequest.status ??
                            "pending"
                        )
                        .trim()
                        .toLowerCase();


                    /*
                       Only PENDING can enter PROCESSING.

                       This is the database-level
                       one-time approval protection.
                    */

                    if (
                        currentStatus !== "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status: "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin.uid

                    };

                }
            );


    } catch (error) {

        console.error(
            "Deposit lock error:",
            error
        );

        showToast(
            "Unable to lock deposit request.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       CHECK LOCK
    ===================================================== */

    if (
        !lockResult.committed
    ) {

        showToast(
            "This deposit has already been processed.",
            "warning"
        );

        return false;

    }


    /* =====================================================
       STEP 2
       READ USER
    ===================================================== */

    const userRef =
        ref(
            db,
            `users/${uid}`
        );


    let userSnapshot;


    try {

        userSnapshot =
            await get(
                userRef
            );


    } catch (error) {

        console.error(
            "Deposit user read error:",
            error
        );


        await markDepositProcessingError(
            id,
            "Unable to read user account."
        );


        showToast(
            "Unable to read user account.",
            "error"
        );

        throw error;

    }


    if (
        !userSnapshot.exists()
    ) {

        await markDepositProcessingError(
            id,
            "User account not found."
        );


        showToast(
            "User account was not found.",
            "error"
        );

        throw new Error(
            "User account does not exist."
        );

    }


    const user =
        userSnapshot.val() || {};


    /* =====================================================
       CURRENT USER VALUES
    ===================================================== */

    const currentBalance =
        Number(
            user.balance
        ) || 0;


    const currentTotalDeposits =
        Number(
            user.totalDeposits
        ) || 0;


    const currentTotalTransactions =
        Number(
            user.totalTransactions
        ) || 0;


    const newBalance =
        currentBalance +
        amount;


    const newTotalDeposits =
        currentTotalDeposits +
        amount;


    const newTotalTransactions =
        currentTotalTransactions +
        1;


    const now =
        Date.now();


    /* =====================================================
       STEP 3
       UPDATE USER FINANCIAL DATA ATOMICALLY
    ===================================================== */

    let userTransactionResult;


    try {

        userTransactionResult =
            await runTransaction(
                userRef,

                currentUser => {

                    if (
                        currentUser === null
                    ) {

                        return;

                    }


                    const balance =
                        Number(
                            currentUser.balance
                        ) || 0;


                    const totalDeposits =
                        Number(
                            currentUser.totalDeposits
                        ) || 0;


                    const totalTransactions =
                        Number(
                            currentUser.totalTransactions
                        ) || 0;


                    return {

                        ...currentUser,

                        balance:
                            balance + amount,

                        totalDeposits:
                            totalDeposits + amount,

                        totalTransactions:
                            totalTransactions + 1

                    };

                }
            );


    } catch (error) {

        console.error(
            "Deposit user transaction error:",
            error
        );


        await markDepositProcessingError(
            id,
            "Unable to update user balance."
        );


        showToast(
            "Unable to update user balance.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       CHECK USER UPDATE
    ===================================================== */

    if (
        !userTransactionResult.committed
    ) {

        await markDepositProcessingError(
            id,
            "User account could not be updated."
        );


        showToast(
            "User account could not be updated.",
            "error"
        );

        throw new Error(
            "User transaction was not committed."
        );

    }


    /* =====================================================
       STEP 4
       CREATE TRANSACTION RECORD
    ===================================================== */

    const transactionRef =
        push(
            ref(
                db,
                "transactions"
            )
        );


    const transactionId =
        transactionRef.key;


    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        request.provider ||
        "N/A";


    const userTransactionId =
        request.transactionId ||
        request.transactionID ||
        request.txId ||
        request.reference ||
        "";


    const transactionData = {

        uid: uid,

        type: "Deposit",

        transactionType:
            "deposit",

        amount: amount,

        status:
            "approved",

        currency:
            "RWF",

        paymentMethod:
            paymentMethod,

        transactionId:
            userTransactionId,

        requestId:
            id,

        createdAt:
            now,

        timestamp:
            now,

        approvedAt:
            now,

        approvedBy:
            currentAdmin.uid

    };


    try {

        await set(
            transactionRef,
            transactionData
        );


    } catch (error) {

        console.error(
            "Deposit transaction creation error:",
            error
        );


        /*
           Balance has already been updated.

           We DO NOT try to blindly subtract it again
           because that could damage a later balance.

           Instead, mark the request as
           processing_error so the admin knows
           manual reconciliation is required.
        */

        await markDepositProcessingError(
            id,
            "Balance updated, but transaction record could not be created."
        );


        showToast(
            "Balance updated, but transaction history failed.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       STEP 5
       FINALIZE DEPOSIT REQUEST
    ===================================================== */

    try {

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin.uid,

                transactionRecordId:
                    transactionId,

                currency:
                    "RWF"

            }
        );


    } catch (error) {

        console.error(
            "Deposit request finalization error:",
            error
        );


        await markDepositProcessingError(
            id,
            "Balance and transaction updated, but request finalization failed."
        );


        showToast(
            "Deposit processed but final status update failed.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    showToast(
        `Deposit of ${formatMoney(amount)} approved successfully.`,
        "success"
    );


    /* =====================================================
       REFRESH UI
    ===================================================== */

    try {

        renderDepositRequests();

    } catch (error) {

        console.warn(
            "Deposit list refresh failed:",
            error
        );

    }


    try {

        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }

    } catch (error) {

        console.warn(
            "Dashboard refresh failed:",
            error
        );

    }


    try {

        if (
            typeof refreshTransactions ===
            "function"
        ) {

            refreshTransactions();

        }

    } catch (error) {

        console.warn(
            "Transaction refresh failed:",
            error
        );

    }


    return true;

}


/* =========================================================
   MARK PROCESSING ERROR
========================================================= */

async function markDepositProcessingError(
    id,
    message
) {

    if (!id) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        const snapshot =
            await get(
                requestRef
            );


        if (!snapshot.exists()) {
            return;
        }


        const request =
            snapshot.val() || {};


        const currentStatus =
            String(
                request.status ??
                ""
            )
            .trim()
            .toLowerCase();


        /*
           IMPORTANT:

           Do not overwrite an already approved
           or rejected request.
        */

        if (
            currentStatus !== "processing"
        ) {

            return;

        }


        await update(
            requestRef,
            {

                status:
                    "processing_error",

                error:
                    message ||
                    "Unknown processing error.",

                processingErrorAt:
                    Date.now(),

                processingErrorBy:
                    currentAdmin?.uid ||
                    null

            }
        );


    } catch (error) {

        console.error(
            "Unable to mark deposit processing error:",
            error
        );

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    await window.waitForAdmin();


    if (!currentAdmin?.uid) {

        showToast(
            "Administrator authentication required.",
            "error"
        );

        throw new Error(
            "Administrator is not authenticated."
        );

    }


    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (!id) {

        showToast(
            "Invalid deposit request.",
            "error"
        );

        throw new Error(
            "Deposit request ID is missing."
        );

    }


    const requestRef =
        ref(
            db,
            `depositRequests/${id}`
        );


    /* =====================================================
       READ REQUEST
    ===================================================== */

    const snapshot =
        await get(
            requestRef
        );


    if (!snapshot.exists()) {

        showToast(
            "Deposit request was not found.",
            "error"
        );

        throw new Error(
            "Deposit request does not exist."
        );

    }


    const request =
        snapshot.val() || {};


    const status =
        String(
            request.status ??
            "pending"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       ONLY PENDING CAN BE REJECTED
    ===================================================== */

    if (
        status !== "pending"
    ) {

        showToast(
            `This deposit is already ${status.replace("_", " ")}.`,
            "warning"
        );

        return false;

    }


    /* =====================================================
       CONFIRM
    ===================================================== */

    const confirmed =
        window.confirm(
            "Are you sure you want to reject this deposit?"
        );


    if (!confirmed) {

        return false;

    }


    /* =====================================================
       OPTIONAL REASON
    ===================================================== */

    let rejectionReason = "";


    try {

        const enteredReason =
            window.prompt(
                "Reason for rejection (optional):"
            );


        if (
            enteredReason !== null
        ) {

            rejectionReason =
                String(
                    enteredReason
                )
                .trim()
                .slice(0, 500);

        }

    } catch (error) {

        console.warn(
            "Rejection reason prompt unavailable:",
            error
        );

    }


    /* =====================================================
       ATOMIC REJECTION
    ===================================================== */

    let result;


    try {

        result =
            await runTransaction(
                requestRef,

                currentRequest => {

                    if (
                        currentRequest === null
                    ) {

                        return;

                    }


                    const currentStatus =
                        String(
                            currentRequest.status ??
                            "pending"
                        )
                        .trim()
                        .toLowerCase();


                    /*
                       Only pending can become rejected.
                    */

                    if (
                        currentStatus !== "pending"
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
                            currentAdmin.uid,

                        rejectionReason:
                            rejectionReason ||
                            "Rejected by administrator.",

                        currency:
                            "RWF"

                    };

                }
            );


    } catch (error) {

        console.error(
            "Reject deposit transaction error:",
            error
        );

        showToast(
            "Unable to reject deposit.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       CHECK COMMIT
    ===================================================== */

    if (
        !result.committed
    ) {

        showToast(
            "This deposit has already been processed.",
            "warning"
        );

        return false;

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    showToast(
        "Deposit request rejected successfully.",
        "success"
    );


    /* =====================================================
       REFRESH UI
    ===================================================== */

    try {

        renderDepositRequests();

    } catch (error) {

        console.warn(
            "Deposit list refresh failed:",
            error
        );

    }


    return true;

}


/* =========================================================
   REFRESH DEPOSIT DATA
========================================================= */

async function refreshDepositData() {

    try {

        renderDepositRequests();

    } catch (error) {

        console.warn(
            "Deposit render refresh error:",
            error
        );

    }


    try {

        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }

    } catch (error) {

        console.warn(
            "Dashboard refresh error:",
            error
        );

    }


    try {

        if (
            typeof refreshTransactions ===
            "function"
        ) {

            refreshTransactions();

        }

    } catch (error) {

        console.warn(
            "Transactions refresh error:",
            error
        );

    }

}


/* =========================================================
   EXPORT
========================================================= */

window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


window.markDepositProcessingError =
    markDepositProcessingError;


window.refreshDepositData =
    refreshDepositData;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 4 loaded successfully."
);

console.log(
    "Deposit approval currency: RWF / FRW"
);

console.log(
    "Deposit approval protection: ENABLED"
);

console.log(
    "Deposit balance update: ENABLED"
);

console.log(
    "Deposit transaction history: ENABLED"
);

   
