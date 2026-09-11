/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 1 — AUTH + ADMIN SECURITY + NAVIGATION

   CURRENCY: RWF / FRW

   RULES:
   - Admin is verified by Firebase RTDB admins/{uid}
   - No hard-coded admin email required
   - Users cannot access admin panel
   - Mobile sidebar supported
   - Quick Actions supported
   - No duplicate declarations
========================================================= */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   GLOBAL ADMIN STATE
========================================================= */

let currentAdmin = null;
let adminData = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const sidebar =
    document.getElementById("sidebar");

const menuBtn =
    document.getElementById("menuBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const adminName =
    document.getElementById("adminName");


/* =========================================================
   NAVIGATION ELEMENTS
========================================================= */

const menuLinks =
    document.querySelectorAll(".menu-link");

const pageSections =
    document.querySelectorAll(".page-section");


/* =========================================================
   HELPER — HIDE LOADING
========================================================= */

function hideLoading() {

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

}


/* =========================================================
   HELPER — SHOW LOADING
========================================================= */

function showLoading() {

    if (loadingScreen) {
        loadingScreen.style.display = "flex";
    }

}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    try {

        showLoading();


        /* ---------------------------------------------
           USER NOT LOGGED IN
        --------------------------------------------- */

        if (!user) {

            window.location.href = "login.html";
            return;

        }


        /* ---------------------------------------------
           CHECK ADMIN IN REALTIME DATABASE
           
           Required:
           admins/{REAL_UID}: true
        --------------------------------------------- */

        const adminRef =
            ref(db, "admins/" + user.uid);

        const adminSnap =
            await get(adminRef);


        /* ---------------------------------------------
           NOT ADMIN
        --------------------------------------------- */

        if (
            !adminSnap.exists() ||
            adminSnap.val() !== true
        ) {

            console.warn(
                "Access denied. User is not an admin."
            );

            alert("Access Denied");

            await signOut(auth);

            window.location.href =
                "dashboard.html";

            return;
        }


        /* ---------------------------------------------
           ADMIN VERIFIED
        --------------------------------------------- */

        currentAdmin = user;
        adminData = adminSnap.val();


        /* ---------------------------------------------
           ADMIN NAME
        --------------------------------------------- */

        if (adminName) {

            adminName.textContent =
                user.displayName ||
                "Administrator";

        }


        /* ---------------------------------------------
           HIDE LOADING
        --------------------------------------------- */

        hideLoading();


        /* ---------------------------------------------
           OPEN DEFAULT PAGE
        --------------------------------------------- */

        openPage("dashboard");


        console.log(
            "✅ Admin authenticated successfully"
        );

        console.log(
            "Admin UID:",
            user.uid
        );


    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "Admin authentication failed: " +
            error.message
        );

        await signOut(auth);

        window.location.href =
            "login.html";

    }

});


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

menuBtn?.addEventListener(
    "click",
    () => {

        if (!sidebar) return;

        sidebar.classList.toggle("active");
        sidebar.classList.toggle("show");

    }
);


/* =========================================================
   CLOSE SIDEBAR WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    (event) => {

        if (!sidebar || !menuBtn) return;

        const clickedInsideSidebar =
            sidebar.contains(event.target);

        const clickedMenuButton =
            menuBtn.contains(event.target);

        if (
            !clickedInsideSidebar &&
            !clickedMenuButton &&
            window.innerWidth < 900
        ) {

            sidebar.classList.remove("active");
            sidebar.classList.remove("show");

        }

    }
);


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(pageName) {

    if (!pageName) return;


    /* ---------------------------------------------
       HIDE ALL SECTIONS
    --------------------------------------------- */

    pageSections.forEach(section => {

        section.style.display = "none";

    });


    /* ---------------------------------------------
       REMOVE ACTIVE FROM ALL MENU LINKS
    --------------------------------------------- */

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    /* ---------------------------------------------
       MAP PAGE NAMES TO HTML SECTION IDs
    --------------------------------------------- */

    const sectionMap = {

        dashboard:
            "dashboardSection",

        deposits:
            "depositSection",

        deposit:
            "depositSection",

        withdraws:
            "withdrawSection",

        withdraw:
            "withdrawSection",

        users:
            "usersSection",

        transactions:
            "transactionsSection",

        settings:
            "settingsSection",

        vip:
            "vipSection",

        vipRequests:
            "vipRequestsSection",

        vipBuyers:
            "vipBuyersSection"

    };


    const sectionId =
        sectionMap[pageName];


    /* ---------------------------------------------
       SHOW SECTION
    --------------------------------------------- */

    if (sectionId) {

        const section =
            document.getElementById(sectionId);

        if (section) {

            section.style.display = "block";

        } else {

            console.warn(
                "Section not found:",
                sectionId
            );

        }

    }


    /* ---------------------------------------------
       ACTIVE MENU
    --------------------------------------------- */

    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );

    if (activeLink) {

        activeLink.classList.add("active");

    }


    /* ---------------------------------------------
       CLOSE MOBILE SIDEBAR
    --------------------------------------------- */

    if (window.innerWidth < 900) {

        sidebar?.classList.remove("active");
        sidebar?.classList.remove("show");

    }

}


/* =========================================================
   MENU LINKS
========================================================= */

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            const page =
                link.dataset.page;

            if (!page) return;

            openPage(page);

        }
    );

});


/* =========================================================
   QUICK ACTION — DEPOSITS
========================================================= */

document
    .getElementById("openDeposits")
    ?.addEventListener(
        "click",
        () => {

            openPage("deposits");

        }
    );


/* =========================================================
   QUICK ACTION — WITHDRAWS
========================================================= */

document
    .getElementById("openWithdraws")
    ?.addEventListener(
        "click",
        () => {

            openPage("withdraws");

        }
    );


/* =========================================================
   QUICK ACTION — USERS
========================================================= */

document
    .getElementById("openUsers")
    ?.addEventListener(
        "click",
        () => {

            openPage("users");

        }
    );


/* =========================================================
   QUICK ACTION — TRANSACTIONS
========================================================= */

document
    .getElementById("openTransactions")
    ?.addEventListener(
        "click",
        () => {

            openPage("transactions");

        }
    );


/* =========================================================
   QUICK ACTION — SETTINGS
========================================================= */

document
    .getElementById("openSettings")
    ?.addEventListener(
        "click",
        () => {

            openPage("settings");

        }
    );


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Logout from Admin Panel?"
            );

        if (!confirmed) return;

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Logout failed: " +
                error.message
            );

        }

    }
);


/* =========================================================
   EXPORT FOR OTHER PARTS
========================================================= */

window.openPage = openPage;


/* =========================================================
   READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 1 Loaded"
);

console.log(
    "Admin authentication + navigation ready"
);

console.log(
    "======================================"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2 — DASHBOARD STATISTICS ONLY

   CURRENCY: RWF / FRW

   PART 2 RESPONSIBILITIES:
   - Total users count
   - Deposit statistics
   - Withdraw statistics
   - Dashboard amounts
   - Live Firebase listeners

   IMPORTANT:
   - USER LIST = PART 10
   - USER SEARCH = PART 10
   - USER MODAL = PART 10
   - BLOCK / ACTIVATE = PART 10
   - WITHDRAW APPROVE / REJECT = PART 11
   - DEPOSIT APPROVE / REJECT = DEPOSIT MANAGEMENT PART

   This Part does NOT render user cards.
========================================================= */


/* =========================================================
   PART 2 STATE
========================================================= */

let part2AllUsersData = {};

let part2AllDepositsData = {};

let part2AllWithdrawsData = {};

let part2UsersListenerStarted = false;

let part2DepositsListenerStarted = false;

let part2WithdrawsListenerStarted = false;

let part2Started = false;


/* =========================================================
   DASHBOARD DOM ELEMENTS
========================================================= */

const part2TotalUsersEl =
    document.getElementById("totalUsers");

const part2TotalDepositsEl =
    document.getElementById("totalDeposits");

const part2TotalPendingEl =
    document.getElementById("totalPending");

const part2TotalApprovedEl =
    document.getElementById("totalApproved");

const part2TotalRejectedEl =
    document.getElementById("totalRejected");

const part2TotalAmountEl =
    document.getElementById("totalAmount");


/* =========================================================
   WITHDRAW DASHBOARD ELEMENTS
========================================================= */

const part2WithdrawCountEl =
    document.getElementById("withdrawCount");

const part2WithdrawPendingEl =
    document.getElementById("withdrawPending");

const part2WithdrawApprovedEl =
    document.getElementById("withdrawApproved");

const part2WithdrawRejectedEl =
    document.getElementById("withdrawRejected");


/* =========================================================
   HELPER — RWF / FRW FORMAT
========================================================= */

function moneyRWFPart2(value) {

    const amount =
        Number(value || 0);


    if (!Number.isFinite(amount)) {

        return "0 RWF";

    }


    return amount.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — STATUS NORMALIZER
========================================================= */

function normalizeStatusPart2(status) {

    return String(
        status || "pending"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   DASHBOARD — USERS COUNT
========================================================= */

function updateUserCountPart2() {

    const users =
        Object.values(
            part2AllUsersData || {}
        );


    const total =
        users.length;


    if (part2TotalUsersEl) {

        part2TotalUsersEl.textContent =
            total.toLocaleString();

    }

}


/* =========================================================
   DASHBOARD — DEPOSIT STATISTICS
========================================================= */

function updateDepositStatsPart2() {

    const deposits =
        Object.values(
            part2AllDepositsData || {}
        );


    let pending = 0;

    let approved = 0;

    let rejected = 0;

    let totalAmount = 0;


    deposits.forEach(
        deposit => {

            deposit =
                deposit || {};


            const status =
                normalizeStatusPart2(
                    deposit.status
                );


            const amount =
                Number(
                    deposit.amount || 0
                );


            /*
             * Total deposit amount
             */

            if (
                Number.isFinite(amount) &&
                amount > 0
            ) {

                totalAmount += amount;

            }


            /*
             * Status counters
             */

            if (
                status === "pending"
            ) {

                pending++;

            }

            else if (
                status === "approved"
            ) {

                approved++;

            }

            else if (
                status === "rejected"
            ) {

                rejected++;

            }

        }
    );


    /*
     * Total deposit requests
     */

    if (part2TotalDepositsEl) {

        part2TotalDepositsEl.textContent =
            deposits.length.toLocaleString();

    }


    /*
     * Pending deposits
     */

    if (part2TotalPendingEl) {

        part2TotalPendingEl.textContent =
            pending.toLocaleString();

    }


    /*
     * Approved deposits
     */

    if (part2TotalApprovedEl) {

        part2TotalApprovedEl.textContent =
            approved.toLocaleString();

    }


    /*
     * Rejected deposits
     */

    if (part2TotalRejectedEl) {

        part2TotalRejectedEl.textContent =
            rejected.toLocaleString();

    }


    /*
     * Total deposit amount
     */

    if (part2TotalAmountEl) {

        part2TotalAmountEl.textContent =
            moneyRWFPart2(
                totalAmount
            );

    }

}


/* =========================================================
   DASHBOARD — WITHDRAW STATISTICS
========================================================= */

function updateWithdrawStatsPart2() {

    const withdraws =
        Object.values(
            part2AllWithdrawsData || {}
        );


    let pending = 0;

    let approved = 0;

    let rejected = 0;


    withdraws.forEach(
        withdraw => {

            withdraw =
                withdraw || {};


            const status =
                normalizeStatusPart2(
                    withdraw.status
                );


            if (
                status === "pending"
            ) {

                pending++;

            }

            else if (
                status === "approved"
            ) {

                approved++;

            }

            else if (
                status === "rejected"
            ) {

                rejected++;

            }

        }
    );


    /*
     * Total withdraw requests
     */

    if (part2WithdrawCountEl) {

        part2WithdrawCountEl.textContent =
            withdraws.length.toLocaleString();

    }


    /*
     * Pending withdraws
     */

    if (part2WithdrawPendingEl) {

        part2WithdrawPendingEl.textContent =
            pending.toLocaleString();

    }


    /*
     * Approved withdraws
     */

    if (part2WithdrawApprovedEl) {

        part2WithdrawApprovedEl.textContent =
            approved.toLocaleString();

    }


    /*
     * Rejected withdraws
     */

    if (part2WithdrawRejectedEl) {

        part2WithdrawRejectedEl.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   FIREBASE — USERS COUNT LISTENER
========================================================= */

function initializeUsersDashboardListenerPart2() {

    if (
        part2UsersListenerStarted
    ) {

        return;

    }


    part2UsersListenerStarted =
        true;


    onValue(

        ref(
            db,
            "users"
        ),

        snapshot => {

            if (
                snapshot.exists()
            ) {

                part2AllUsersData =
                    snapshot.val() || {};

            }

            else {

                part2AllUsersData =
                    {};

            }


            updateUserCountPart2();

        },

        error => {

            console.error(
                "Part 2 users dashboard listener error:",
                error
            );


            if (part2TotalUsersEl) {

                part2TotalUsersEl.textContent =
                    "0";

            }

        }

    );


    console.log(
        "✅ Part 2 users count listener started"
    );

}


/* =========================================================
   FIREBASE — DEPOSITS LISTENER
========================================================= */

function initializeDepositsDashboardListenerPart2() {

    if (
        part2DepositsListenerStarted
    ) {

        return;

    }


    part2DepositsListenerStarted =
        true;


    onValue(

        ref(
            db,
            "depositRequests"
        ),

        snapshot => {

            if (
                snapshot.exists()
            ) {

                part2AllDepositsData =
                    snapshot.val() || {};

            }

            else {

                part2AllDepositsData =
                    {};

            }


            updateDepositStatsPart2();

        },

        error => {

            console.error(
                "Part 2 deposits dashboard listener error:",
                error
            );

        }

    );


    console.log(
        "✅ Part 2 deposits listener started"
    );

}


/* =========================================================
   FIREBASE — WITHDRAWS LISTENER
========================================================= */

function initializeWithdrawDashboardListenerPart2() {

    if (
        part2WithdrawsListenerStarted
    ) {

        return;

    }


    part2WithdrawsListenerStarted =
        true;


    onValue(

        ref(
            db,
            "withdrawRequests"
        ),

        snapshot => {

            if (
                snapshot.exists()
            ) {

                part2AllWithdrawsData =
                    snapshot.val() || {};

            }

            else {

                part2AllWithdrawsData =
                    {};

            }


            updateWithdrawStatsPart2();

        },

        error => {

            console.error(
                "Part 2 withdraw dashboard listener error:",
                error
            );

        }

    );


    console.log(
        "✅ Part 2 withdraw listener started"
    );

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

function refreshAdminDashboardPart2() {

    updateUserCountPart2();

    updateDepositStatsPart2();

    updateWithdrawStatsPart2();

}


/* =========================================================
   INITIALIZE PART 2
========================================================= */

function initializeAdminPart2() {

    console.log(
        "Starting Money Vault Admin Part 2..."
    );


    /*
     * Users:
     * ONLY count for dashboard.
     *
     * Part 10 owns the actual users list.
     */

    initializeUsersDashboardListenerPart2();


    /*
     * Deposits:
     * Dashboard statistics only.
     */

    initializeDepositsDashboardListenerPart2();


    /*
     * Withdraws:
     * Dashboard statistics only.
     */

    initializeWithdrawDashboardListenerPart2();


    console.log(
        "✅ Money Vault Admin Part 2 initialized"
    );

}


/* =========================================================
   START PART 2 AFTER ADMIN AUTH
========================================================= */

async function startAdminPart2() {

    if (
        part2Started
    ) {

        return;

    }


    try {

        /*
         * Use central admin authentication
         * if Part 1 provides it.
         */

        if (
            typeof window.waitForAdmin ===
            "function"
        ) {

            await window.waitForAdmin();

        }


        /*
         * Check admin authentication safely.
         */

        let adminReady = false;


        if (
            typeof currentAdmin !==
            "undefined" &&
            currentAdmin
        ) {

            adminReady = true;

        }


        if (
            window.currentAdmin
        ) {

            adminReady = true;

        }


        /*
         * If admin is not ready,
         * do not start listeners.
         */

        if (!adminReady) {

            console.warn(
                "Part 2: Admin authentication not ready."
            );

            return;

        }


        part2Started =
            true;


        initializeAdminPart2();

    }

    catch (error) {

        console.error(
            "Part 2 start error:",
            error
        );

    }

}


/* =========================================================
   FALLBACK ADMIN AUTH WAIT
========================================================= */

const part2AuthInterval =
    setInterval(
        () => {

            let adminReady = false;


            if (
                typeof currentAdmin !==
                "undefined" &&
                currentAdmin
            ) {

                adminReady = true;

            }


            if (
                window.currentAdmin
            ) {

                adminReady = true;

            }


            if (adminReady) {

                clearInterval(
                    part2AuthInterval
                );


                startAdminPart2();

            }

        },
        250
    );


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.refreshAdminDashboardPart2 =
    refreshAdminDashboardPart2;


/*
 * These are optional dashboard helpers.
 * They do NOT control user management.
 */

window.updateUserCountPart2 =
    updateUserCountPart2;

window.updateDepositStatsPart2 =
    updateDepositStatsPart2;

window.updateWithdrawStatsPart2 =
    updateWithdrawStatsPart2;


/* =========================================================
   PART 2 READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 2 Loaded"
);

console.log(
    "Dashboard Statistics ONLY"
);

console.log(
    "Users list = Part 10"
);

console.log(
    "Withdraw Approve/Reject = Part 11"
);

console.log(
    "======================================"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 3 — DEPOSIT REQUESTS

   CURRENCY: RWF / FRW

   FEATURES:
   - Live deposit requests
   - Search
   - Status filter
   - Counters
   - Approve
   - Reject
   - Atomic balance update
   - Atomic status update
   - Transaction record
   - ONE-TIME APPROVAL PROTECTION
   - Canonical status: pending / approved / rejected
   - No Cloud Functions
   - No Storage upload required
========================================================= */


/* =========================================================
   IMPORTANT FIREBASE IMPORTS
========================================================= */

import {
    onValue,
    update,
    push
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   DEPOSIT STATE
========================================================= */

let depositData = {};


/* =========================================================
   DEPOSIT DOM ELEMENTS
========================================================= */

const depositList =
    document.getElementById("depositList") ||
    document.getElementById("depositRequests");

const searchDeposit =
    document.getElementById("searchDeposit");

const filterDeposit =
    document.getElementById("filterDeposit");

const emptyDeposit =
    document.getElementById("emptyDeposit");


/* =========================================================
   DEPOSIT SUMMARY ELEMENTS
========================================================= */

const totalDepositRequestsEl =
    document.getElementById("totalDeposits");

const pendingDepositsEl =
    document.getElementById("pendingDeposits");

const approvedDepositsEl =
    document.getElementById("approvedDeposits");

const rejectedDepositsEl =
    document.getElementById("rejectedDeposits");


/* =========================================================
   HELPER — STATUS
========================================================= */

function normalizeDepositStatus(status) {

    return String(
        status || "pending"
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   HELPER — RWF
========================================================= */

function formatDepositRWF(amount) {

    const value =
        Number(amount || 0);

    return value.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — SAFE HTML
========================================================= */

function safeDepositHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   HELPER — DATE
========================================================= */

function formatDepositDate(value) {

    if (!value) {
        return "-";
    }

    const numberValue =
        Number(value);

    if (
        Number.isFinite(numberValue) &&
        numberValue > 0
    ) {

        try {

            return new Date(
                numberValue
            ).toLocaleString();

        } catch {

            return String(value);

        }

    }

    return String(value);

}


/* =========================================================
   LOAD DEPOSITS
========================================================= */

function initializeDepositListener() {

    if (!depositList) {

        console.warn(
            "Deposit list element not found."
        );

    }


    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            depositData = {};


            if (snapshot.exists()) {

                snapshot.forEach(child => {

                    depositData[child.key] = {
                        id: child.key,
                        ...(child.val() || {})
                    };

                });

            }


            updateDepositSummary();

            renderDeposits();

        },
        error => {

            console.error(
                "Deposit listener error:",
                error
            );


            if (depositList) {

                depositList.innerHTML = `

                    <div class="empty-state">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <h3>
                            Failed to Load Deposits
                        </h3>

                        <p>
                            ${safeDepositHTML(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }
    );

}


/* =========================================================
   UPDATE DEPOSIT SUMMARY
========================================================= */

function updateDepositSummary() {

    const deposits =
        Object.values(
            depositData || {}
        );


    let pending = 0;
    let approved = 0;
    let rejected = 0;


    deposits.forEach(deposit => {

        const status =
            normalizeDepositStatus(
                deposit.status
            );


        if (status === "pending") {

            pending++;

        }

        else if (status === "approved") {

            approved++;

        }

        else if (status === "rejected") {

            rejected++;

        }

    });


    if (totalDepositRequestsEl) {

        totalDepositRequestsEl.textContent =
            deposits.length.toLocaleString();

    }


    if (pendingDepositsEl) {

        pendingDepositsEl.textContent =
            pending.toLocaleString();

    }


    if (approvedDepositsEl) {

        approvedDepositsEl.textContent =
            approved.toLocaleString();

    }


    if (rejectedDepositsEl) {

        rejectedDepositsEl.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   GET CURRENT FILTER
========================================================= */

function getDepositFilter() {

    if (!filterDeposit) {

        return "all";

    }

    return String(
        filterDeposit.value || "all"
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   SEARCH VALUE
========================================================= */

function getDepositSearch() {

    if (!searchDeposit) {

        return "";

    }

    return String(
        searchDeposit.value || ""
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   CHECK SEARCH MATCH
========================================================= */

function depositMatchesSearch(deposit) {

    const keyword =
        getDepositSearch();


    if (!keyword) {

        return true;

    }


    const searchable = [

        deposit.id,

        deposit.uid,

        deposit.email,

        deposit.senderPhone,

        deposit.transactionId,

        deposit.paymentMethod,

        deposit.note,

        deposit.status

    ]
    .map(value =>
        String(value || "")
            .toLowerCase()
    )
    .join(" ");


    return searchable.includes(
        keyword
    );

}


/* =========================================================
   CHECK STATUS FILTER
========================================================= */

function depositMatchesFilter(deposit) {

    const filter =
        getDepositFilter();


    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }


    return (
        normalizeDepositStatus(
            deposit.status
        ) === filter
    );

}


/* =========================================================
   RENDER DEPOSITS
========================================================= */

function renderDeposits() {

    if (!depositList) {

        return;

    }


    depositList.innerHTML = "";


    const deposits =
        Object.values(
            depositData || {}
        );


    const filteredDeposits =
        deposits
            .filter(deposit =>
                depositMatchesSearch(
                    deposit
                )
            )
            .filter(deposit =>
                depositMatchesFilter(
                    deposit
                )
            )
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (
        emptyDeposit
    ) {

        emptyDeposit.style.display =
            filteredDeposits.length === 0
                ? "block"
                : "none";

    }


    if (
        filteredDeposits.length === 0
    ) {

        depositList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-wallet"></i>

                <h3>
                    No Deposit Requests
                </h3>

                <p>
                    No deposit requests match your search.
                </p>

            </div>

        `;

        return;

    }


    filteredDeposits.forEach(
        deposit => {

            const id =
                deposit.id;


            const status =
                normalizeDepositStatus(
                    deposit.status
                );


            const amount =
                Number(
                    deposit.amount || 0
                );


            const isPending =
                status === "pending";


            const isApproved =
                status === "approved";


            const isRejected =
                status === "rejected";


            let statusLabel =
                "Pending";


            if (isApproved) {

                statusLabel =
                    "Approved";

            }

            else if (isRejected) {

                statusLabel =
                    "Rejected";

            }


            let statusClass =
                "pending";


            if (isApproved) {

                statusClass =
                    "approved";

            }

            else if (isRejected) {

                statusClass =
                    "rejected";

            }


            depositList.innerHTML += `

                <div
                    class="request-card deposit-card"
                    data-id="${safeDepositHTML(id)}"
                >

                    <div class="request-header">

                        <div>

                            <h3>
                                ${formatDepositRWF(amount)}
                            </h3>

                            <span
                                class="status ${statusClass}"
                            >
                                ${statusLabel}
                            </span>

                        </div>

                    </div>


                    <div class="request-details">

                        <p>

                            <strong>
                                User:
                            </strong>

                            ${safeDepositHTML(
                                deposit.email || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Phone:
                            </strong>

                            ${safeDepositHTML(
                                deposit.senderPhone || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Payment Method:
                            </strong>

                            ${safeDepositHTML(
                                deposit.paymentMethod || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Transaction ID:
                            </strong>

                            <span class="transaction-id">

                                ${safeDepositHTML(
                                    deposit.transactionId || "-"
                                )}

                            </span>

                        </p>


                        <p>

                            <strong>
                                Payment Date:
                            </strong>

                            ${safeDepositHTML(
                                deposit.paymentDate || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Submitted:
                            </strong>

                            ${safeDepositHTML(
                                formatDepositDate(
                                    deposit.createdAt
                                )
                            )}

                        </p>


                        ${
                            deposit.note
                            ? `
                                <p>
                                    <strong>
                                        Note:
                                    </strong>

                                    ${safeDepositHTML(
                                        deposit.note
                                    )}
                                </p>
                            `
                            : ""
                        }


                        ${
                            deposit.approvedAt
                            ? `
                                <p>
                                    <strong>
                                        Approved:
                                    </strong>

                                    ${safeDepositHTML(
                                        formatDepositDate(
                                            deposit.approvedAt
                                        )
                                    )}
                                </p>
                            `
                            : ""
                        }

                    </div>


                    <div class="action-buttons">


                        ${
                            isPending
                            ? `

                                <button
                                    type="button"
                                    class="approveBtn"
                                    data-id="${safeDepositHTML(id)}"
                                >

                                    <i
                                        class="fa-solid fa-check"
                                    ></i>

                                    Approve

                                </button>


                                <button
                                    type="button"
                                    class="rejectBtn"
                                    data-id="${safeDepositHTML(id)}"
                                >

                                    <i
                                        class="fa-solid fa-xmark"
                                    ></i>

                                    Reject

                                </button>

                            `
                            : ""
                        }


                        ${
                            deposit.transactionId
                            ? `

                                <button
                                    type="button"
                                    class="copyTransaction"
                                    data-transaction="${safeDepositHTML(
                                        deposit.transactionId
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-copy"
                                    ></i>

                                    Copy Transaction ID

                                </button>

                            `
                            : ""
                        }


                        ${
                            deposit.proofImage
                            ? `

                                <button
                                    type="button"
                                    class="viewProof"
                                    data-image="${safeDepositHTML(
                                        deposit.proofImage
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-image"
                                    ></i>

                                    View Screenshot

                                </button>

                            `
                            : ""
                        }

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   APPROVE DEPOSIT — ATOMIC
========================================================= */

async function approveDeposit(id) {

    if (!id) {

        alert(
            "Deposit request ID is missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Approve this deposit?"
        );


    if (!confirmed) {

        return;

    }


    try {

        /* ---------------------------------------------
           CHECK ADMIN
        --------------------------------------------- */

        if (!currentAdmin) {

            alert(
                "Admin session is not ready."
            );

            return;

        }


        /* ---------------------------------------------
           GET DEPOSIT
        --------------------------------------------- */

        const depositRef =
            ref(
                db,
                "depositRequests/" + id
            );


        const depositSnap =
            await get(
                depositRef
            );


        if (!depositSnap.exists()) {

            alert(
                "Deposit request not found."
            );

            return;

        }


        const deposit =
            depositSnap.val() || {};


        /* ---------------------------------------------
           ONE-TIME APPROVAL PROTECTION
        --------------------------------------------- */

        const currentStatus =
            normalizeDepositStatus(
                deposit.status
            );


        if (
            currentStatus === "approved"
        ) {

            alert(
                "This deposit has already been approved."
            );

            return;

        }


        if (
            currentStatus !== "pending"
        ) {

            alert(
                "This deposit is no longer pending."
            );

            return;

        }


        /* ---------------------------------------------
           VALIDATE UID
        --------------------------------------------- */

        const uid =
            String(
                deposit.uid || ""
            ).trim();


        if (!uid) {

            alert(
                "Deposit has no user UID."
            );

            return;

        }


        /* ---------------------------------------------
           VALIDATE AMOUNT
        --------------------------------------------- */

        const amount =
            Number(
                deposit.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount < 1000
        ) {

            alert(
                "Invalid deposit amount."
            );

            return;

        }


        /* ---------------------------------------------
           GET USER
        --------------------------------------------- */

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(
                userRef
            );


        if (!userSnap.exists()) {

            alert(
                "User account not found."
            );

            return;

        }


        const user =
            userSnap.val() || {};


        /* ---------------------------------------------
           CURRENT USER BALANCE
        --------------------------------------------- */

        const currentBalance =
            Number(
                user.balance || 0
            );


        if (
            !Number.isFinite(
                currentBalance
            )
        ) {

            alert(
                "User balance is invalid."
            );

            return;

        }


        /* ---------------------------------------------
           NEW BALANCE
        --------------------------------------------- */

        const newBalance =
            currentBalance +
            amount;


        /* ---------------------------------------------
           NEW TOTAL DEPOSIT
        --------------------------------------------- */

        const oldTotalDeposits =
            Number(
                user.totalDeposits ||
                0
            );


        const oldTotalDeposit =
            Number(
                user.totalDeposit ||
                0
            );


        const newTotalDeposits =
            oldTotalDeposits +
            amount;


        const newTotalDeposit =
            oldTotalDeposit +
            amount;


        /* ---------------------------------------------
           TRANSACTION KEY
        --------------------------------------------- */

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionId =
            transactionRef.key;


        if (!transactionId) {

            alert(
                "Could not create transaction ID."
            );

            return;

        }


        const now =
            Date.now();


        /* =================================================
           ATOMIC MULTI-LOCATION UPDATE

           EVERYTHING IS WRITTEN TOGETHER:

           USER BALANCE
           USER TOTAL DEPOSIT
           USER TRANSACTIONS
           DEPOSIT STATUS
           TRANSACTION RECORD

           If Firebase rejects the update,
           none of these changes are applied.
        ================================================= */


        const updates = {};


        /* ---------------------------------------------
           USER
        --------------------------------------------- */

        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            newBalance;


        updates[
            "users/" +
            uid +
            "/totalDeposits"
        ] =
            newTotalDeposits;


        updates[
            "users/" +
            uid +
            "/totalDeposit"
        ] =
            newTotalDeposit;


        updates[
            "users/" +
            uid +
            "/totalTransactions"
        ] =
            Number(
                user.totalTransactions ||
                0
            ) + 1;


        /* ---------------------------------------------
           DEPOSIT REQUEST
        --------------------------------------------- */

        updates[
            "depositRequests/" +
            id +
            "/status"
        ] =
            "approved";


        updates[
            "depositRequests/" +
            id +
            "/approvedAt"
        ] =
            now;


        updates[
            "depositRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin.uid;


        /* ---------------------------------------------
           TRANSACTION RECORD
        --------------------------------------------- */

        updates[
            "transactions/" +
            transactionId
        ] = {

            uid: uid,

            type: "deposit",

            transactionType: "deposit",

            amount: amount,

            currency: "RWF",

            status: "approved",

            referenceId: id,

            transactionId:
                deposit.transactionId ||
                id,

            paymentMethod:
                deposit.paymentMethod ||
                "",

            description:
                "Deposit approved",

            createdAt: now,

            timestamp: now

        };


        /* ---------------------------------------------
           WRITE EVERYTHING AT ONCE
        --------------------------------------------- */

        await update(
            ref(db),
            updates
        );


        /* ---------------------------------------------
           SUCCESS
        --------------------------------------------- */

        alert(
            "Deposit approved successfully."
        );


        console.log(
            "✅ Deposit approved:",
            id
        );


    } catch (error) {

        console.error(
            "Deposit approval failed:",
            error
        );


        alert(
            "Deposit approval failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    if (!id) {

        alert(
            "Deposit request ID is missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Reject this deposit?"
        );


    if (!confirmed) {

        return;

    }


    try {

        if (!currentAdmin) {

            alert(
                "Admin session is not ready."
            );

            return;

        }


        const depositRef =
            ref(
                db,
                "depositRequests/" + id
            );


        const snap =
            await get(
                depositRef
            );


        if (!snap.exists()) {

            alert(
                "Deposit request not found."
            );

            return;

        }


        const deposit =
            snap.val() || {};


        const status =
            normalizeDepositStatus(
                deposit.status
            );


        if (
            status === "approved"
        ) {

            alert(
                "An approved deposit cannot be rejected."
            );

            return;

        }


        if (
            status === "rejected"
        ) {

            alert(
                "This deposit is already rejected."
            );

            return;

        }


        if (
            status !== "pending"
        ) {

            alert(
                "This deposit is not pending."
            );

            return;

        }


        const now =
            Date.now();


        await update(
            depositRef,
            {

                status: "rejected",

                rejectedAt: now,

                rejectedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "Deposit rejected successfully."
        );


        console.log(
            "✅ Deposit rejected:",
            id
        );


    } catch (error) {

        console.error(
            "Deposit rejection failed:",
            error
        );


        alert(
            "Deposit rejection failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   COPY TRANSACTION ID
========================================================= */

async function copyDepositTransaction(
    transactionId
) {

    if (!transactionId) {

        alert(
            "Transaction ID is empty."
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            transactionId
        );


        alert(
            "Transaction ID copied."
        );


    } catch (error) {

        console.error(
            "Copy failed:",
            error
        );


        /* ---------------------------------------------
           FALLBACK
        --------------------------------------------- */

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            transactionId;


        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

            alert(
                "Transaction ID copied."
            );

        } catch {

            alert(
                "Could not copy Transaction ID."
            );

        }


        textarea.remove();

    }

}


/* =========================================================
   VIEW PROOF
========================================================= */

function viewDepositProof(
    imageUrl
) {

    if (!imageUrl) {

        alert(
            "No screenshot is available for this deposit."
        );

        return;

    }


    window.open(
        imageUrl,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   DEPOSIT EVENT DELEGATION
========================================================= */

depositList?.addEventListener(
    "click",
    event => {


        /* ---------------------------------------------
           APPROVE
        --------------------------------------------- */

        const approveButton =
            event.target.closest(
                ".approveBtn"
            );


        if (approveButton) {

            const id =
                approveButton.dataset.id;


            approveButton.disabled =
                true;


            approveDeposit(id)
                .finally(() => {

                    approveButton.disabled =
                        false;

                });


            return;

        }


        /* ---------------------------------------------
           REJECT
        --------------------------------------------- */

        const rejectButton =
            event.target.closest(
                ".rejectBtn"
            );


        if (rejectButton) {

            const id =
                rejectButton.dataset.id;


            rejectButton.disabled =
                true;


            rejectDeposit(id)
                .finally(() => {

                    rejectButton.disabled =
                        false;

                });


            return;

        }


        /* ---------------------------------------------
           COPY
        --------------------------------------------- */

        const copyButton =
            event.target.closest(
                ".copyTransaction"
            );


        if (copyButton) {

            const transactionId =
                copyButton.dataset.transaction;


            copyDepositTransaction(
                transactionId
            );


            return;

        }


        /* ---------------------------------------------
           VIEW PROOF
        --------------------------------------------- */

        const proofButton =
            event.target.closest(
                ".viewProof"
            );


        if (proofButton) {

            const imageUrl =
                proofButton.dataset.image;


            viewDepositProof(
                imageUrl
            );


            return;

        }

    }
);


/* =========================================================
   SEARCH
========================================================= */

searchDeposit?.addEventListener(
    "input",
    () => {

        renderDeposits();

    }
);


/* =========================================================
   FILTER
========================================================= */

filterDeposit?.addEventListener(
    "change",
    () => {

        renderDeposits();

    }
);


/* =========================================================
   START DEPOSIT PART
========================================================= */

let depositPartStarted =
    false;


function startDepositPart() {

    if (
        depositPartStarted
    ) {

        return;

    }


    if (!currentAdmin) {

        console.warn(
            "Deposit Part waiting for admin authentication..."
        );

        return;

    }


    depositPartStarted =
        true;


    initializeDepositListener();


    console.log(
        "✅ Deposit Part started"
    );

}


/* =========================================================
   WAIT FOR ADMIN AUTH
========================================================= */

const depositAuthInterval =
    setInterval(
        () => {

            if (currentAdmin) {

                clearInterval(
                    depositAuthInterval
                );

                startDepositPart();

            }

        },
        100
    );


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;


/* =========================================================
   READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 3 Loaded"
);

console.log(
    "Deposit Requests ready"
);

console.log(
    "Atomic approval enabled"
);

console.log(
    "======================================"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 4 — WITHDRAW REQUESTS

   CURRENCY: RWF / FRW

   PART 4 RESPONSIBILITIES:
   - Live withdraw requests
   - Search
   - Status filter
   - Counters
   - View details
   - Render requests
   - Send Approve/Reject actions to PART 11

   IMPORTANT:
   - NO approveWithdraw() here
   - NO rejectWithdraw() here
   - Approval/Reject logic is ONLY in PART 11
   - Prevents duplicate function conflicts
========================================================= */


/* =========================================================
   PART 4 STATE
========================================================= */

let part4WithdrawData = {};

let part4WithdrawListenerStarted = false;

let part4WithdrawEventsBound = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const part4WithdrawList =
    document.getElementById("withdrawRequests");

const part4WithdrawSearch =
    document.getElementById("withdrawSearch");

const part4WithdrawFilter =
    document.getElementById("withdrawFilter");

const part4WithdrawCount =
    document.getElementById("withdrawCount");

const part4WithdrawPending =
    document.getElementById("withdrawPending");

const part4WithdrawApproved =
    document.getElementById("withdrawApproved");

const part4WithdrawRejected =
    document.getElementById("withdrawRejected");

const part4EmptyWithdraw =
    document.getElementById("emptyWithdraw");


/* =========================================================
   WITHDRAW MODAL
========================================================= */

const part4WithdrawModal =
    document.getElementById("withdrawModal");

const part4CloseWithdrawModal =
    document.getElementById("closeWithdrawModal");

const part4ModalUser =
    document.getElementById("modalUser");

const part4ModalEmail =
    document.getElementById("modalEmail");

const part4ModalPhone =
    document.getElementById("modalPhone");

const part4ModalAmount =
    document.getElementById("modalAmount");

const part4ModalMethod =
    document.getElementById("modalMethod");

const part4ModalStatus =
    document.getElementById("modalStatus");


/* =========================================================
   HELPER — STATUS NORMALIZER
========================================================= */

function normalizeWithdrawStatusPart4(status) {

    return String(
        status || "pending"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   HELPER — RWF FORMAT
========================================================= */

function formatWithdrawRWFPart4(amount) {

    const value =
        Number(amount || 0);

    if (!Number.isFinite(value)) {

        return "0 RWF";

    }

    return value.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — SAFE HTML
========================================================= */

function safeWithdrawHTMLPart4(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   HELPER — DATE
========================================================= */

function formatWithdrawDatePart4(value) {

    if (!value) {

        return "-";

    }

    const numberValue =
        Number(value);

    if (
        Number.isFinite(numberValue) &&
        numberValue > 0
    ) {

        try {

            return new Date(
                numberValue
            ).toLocaleString();

        }

        catch {

            return String(value);

        }

    }

    return String(value);

}


/* =========================================================
   SEARCH VALUE
========================================================= */

function getWithdrawSearchPart4() {

    if (!part4WithdrawSearch) {

        return "";

    }

    return String(
        part4WithdrawSearch.value || ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   FILTER VALUE
========================================================= */

function getWithdrawFilterPart4() {

    if (!part4WithdrawFilter) {

        return "all";

    }

    return String(
        part4WithdrawFilter.value || "all"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   SEARCH MATCH
========================================================= */

function withdrawMatchesSearchPart4(request) {

    const keyword =
        getWithdrawSearchPart4();

    if (!keyword) {

        return true;

    }

    const searchable = [

        request.id,

        request.uid,

        request.email,

        request.phone,

        request.senderPhone,

        request.withdrawPhone,

        request.paymentMethod,

        request.method,

        request.transactionId,

        request.note,

        request.amount,

        request.status

    ]
        .map(
            value =>
                String(
                    value || ""
                ).toLowerCase()
        )
        .join(" ");

    return searchable.includes(
        keyword
    );

}


/* =========================================================
   STATUS FILTER MATCH
========================================================= */

function withdrawMatchesFilterPart4(request) {

    const filter =
        getWithdrawFilterPart4();

    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }

    return (
        normalizeWithdrawStatusPart4(
            request.status
        ) === filter
    );

}


/* =========================================================
   UPDATE COUNTERS
========================================================= */

function updateWithdrawSummaryPart4() {

    const requests =
        Object.values(
            part4WithdrawData || {}
        );

    let pending = 0;

    let approved = 0;

    let rejected = 0;


    requests.forEach(
        request => {

            const status =
                normalizeWithdrawStatusPart4(
                    request.status
                );

            if (
                status === "pending"
            ) {

                pending++;

            }

            else if (
                status === "approved"
            ) {

                approved++;

            }

            else if (
                status === "rejected"
            ) {

                rejected++;

            }

        }
    );


    if (part4WithdrawCount) {

        part4WithdrawCount.textContent =
            requests.length.toLocaleString();

    }


    if (part4WithdrawPending) {

        part4WithdrawPending.textContent =
            pending.toLocaleString();

    }


    if (part4WithdrawApproved) {

        part4WithdrawApproved.textContent =
            approved.toLocaleString();

    }


    if (part4WithdrawRejected) {

        part4WithdrawRejected.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   RENDER WITHDRAW REQUESTS
========================================================= */

function renderWithdrawRequestsPart4() {

    if (!part4WithdrawList) {

        return;

    }


    part4WithdrawList.innerHTML = "";


    const requests =
        Object.values(
            part4WithdrawData || {}
        );


    const filteredRequests =
        requests

            .filter(
                request =>
                    withdrawMatchesSearchPart4(
                        request
                    )
            )

            .filter(
                request =>
                    withdrawMatchesFilterPart4(
                        request
                    )
            )

            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (part4EmptyWithdraw) {

        part4EmptyWithdraw.style.display =
            filteredRequests.length === 0
                ? "block"
                : "none";

    }


    if (
        filteredRequests.length === 0
    ) {

        part4WithdrawList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-money-bill-transfer"></i>

                <h3>
                    No Withdraw Requests
                </h3>

                <p>
                    No withdraw requests match your search.
                </p>

            </div>

        `;

        return;

    }


    filteredRequests.forEach(
        request => {

            const id =
                request.id;


            const status =
                normalizeWithdrawStatusPart4(
                    request.status
                );


            const amount =
                Number(
                    request.amount || 0
                );


            const isPending =
                status === "pending";


            const isApproved =
                status === "approved";


            const isRejected =
                status === "rejected";


            let statusLabel =
                "Pending";


            let statusClass =
                "pending";


            if (isApproved) {

                statusLabel =
                    "Approved";

                statusClass =
                    "approved";

            }

            else if (isRejected) {

                statusLabel =
                    "Rejected";

                statusClass =
                    "rejected";

            }


            const phone =
                request.phone ||
                request.senderPhone ||
                request.withdrawPhone ||
                "-";


            const method =
                request.paymentMethod ||
                request.method ||
                "-";


            const email =
                request.email ||
                "-";


            const createdAt =
                request.createdAt
                    ? formatWithdrawDatePart4(
                        request.createdAt
                    )
                    : "-";


            const approvedAt =
                request.approvedAt
                    ? formatWithdrawDatePart4(
                        request.approvedAt
                    )
                    : "";


            const rejectedAt =
                request.rejectedAt
                    ? formatWithdrawDatePart4(
                        request.rejectedAt
                    )
                    : "";


            const transactionId =
                request.transactionId ||
                "";


            const note =
                request.note ||
                "";


            const card = document.createElement(
                "div"
            );


            card.className =
                "request-card withdraw-card";


            card.dataset.id =
                id;


            card.innerHTML = `

                <div class="request-header">

                    <div>

                        <h3>
                            ${formatWithdrawRWFPart4(
                                amount
                            )}
                        </h3>

                        <span
                            class="status ${statusClass}"
                        >
                            ${statusLabel}
                        </span>

                    </div>

                </div>


                <div class="request-details">

                    <p>

                        <strong>
                            User:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            email
                        )}

                    </p>


                    <p>

                        <strong>
                            Phone:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            phone
                        )}

                    </p>


                    <p>

                        <strong>
                            Method:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            method
                        )}

                    </p>


                    <p>

                        <strong>
                            Submitted:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            createdAt
                        )}

                    </p>


                    ${
                        transactionId
                        ? `

                            <p>

                                <strong>
                                    Transaction ID:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    transactionId
                                )}

                            </p>

                        `
                        : ""
                    }


                    ${
                        note
                        ? `

                            <p>

                                <strong>
                                    Note:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    note
                                )}

                            </p>

                        `
                        : ""
                    }


                    ${
                        approvedAt
                        ? `

                            <p>

                                <strong>
                                    Approved:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    approvedAt
                                )}

                            </p>

                        `
                        : ""
                    }


                    ${
                        rejectedAt
                        ? `

                            <p>

                                <strong>
                                    Rejected:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    rejectedAt
                                )}

                            </p>

                        `
                        : ""
                    }

                </div>


                <div class="action-buttons">

                    ${
                        isPending
                        ? `

                            <button
                                type="button"
                                class="approveWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-check"></i>

                                Approve

                            </button>


                            <button
                                type="button"
                                class="viewWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-eye"></i>

                                View

                            </button>


                            <button
                                type="button"
                                class="rejectWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-xmark"></i>

                                Reject

                            </button>

                        `
                        : `

                            <button
                                type="button"
                                class="viewWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-eye"></i>

                                View

                            </button>

                        `
                    }

                </div>

            `;


            part4WithdrawList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   OPEN WITHDRAW DETAILS
========================================================= */

function openWithdrawDetailsPart4(id) {

    const request =
        part4WithdrawData[id];


    if (!request) {

        alert(
            "Withdraw request not found."
        );

        return;

    }


    const amount =
        Number(
            request.amount || 0
        );


    const phone =
        request.phone ||
        request.senderPhone ||
        request.withdrawPhone ||
        "-";


    const method =
        request.paymentMethod ||
        request.method ||
        "-";


    if (part4ModalUser) {

        part4ModalUser.textContent =
            request.uid || "-";

    }


    if (part4ModalEmail) {

        part4ModalEmail.textContent =
            request.email || "-";

    }


    if (part4ModalPhone) {

        part4ModalPhone.textContent =
            phone;

    }


    if (part4ModalAmount) {

        part4ModalAmount.textContent =
            formatWithdrawRWFPart4(
                amount
            );

    }


    if (part4ModalMethod) {

        part4ModalMethod.textContent =
            method;

    }


    if (part4ModalStatus) {

        part4ModalStatus.textContent =
            String(
                request.status ||
                "pending"
            );

    }


    if (part4WithdrawModal) {

        part4WithdrawModal.style.display =
            "flex";

    }

}


/* =========================================================
   CLOSE WITHDRAW DETAILS
========================================================= */

function closeWithdrawDetailsPart4() {

    if (part4WithdrawModal) {

        part4WithdrawModal.style.display =
            "none";

    }

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function bindWithdrawModalEventsPart4() {

    if (
        part4WithdrawModal &&
        !part4WithdrawModal.dataset.part4Bound
    ) {

        part4WithdrawModal.dataset.part4Bound =
            "true";


        part4WithdrawModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    part4WithdrawModal
                ) {

                    closeWithdrawDetailsPart4();

                }

            }
        );

    }


    if (
        part4CloseWithdrawModal &&
        !part4CloseWithdrawModal.dataset.part4Bound
    ) {

        part4CloseWithdrawModal.dataset.part4Bound =
            "true";


        part4CloseWithdrawModal.addEventListener(
            "click",
            closeWithdrawDetailsPart4
        );

    }

}


/* =========================================================
   EVENT DELEGATION
   IMPORTANT:
   APPROVE / REJECT ARE OWNED BY PART 11
========================================================= */

function bindWithdrawEventsPart4() {

    if (
        part4WithdrawEventsBound ||
        !part4WithdrawList
    ) {

        return;

    }


    part4WithdrawEventsBound =
        true;


    part4WithdrawList.addEventListener(
        "click",
        event => {

            /* -----------------------------------------
               VIEW DETAILS
            ----------------------------------------- */

            const viewButton =
                event.target.closest(
                    ".viewWithdrawBtn"
                );


            if (viewButton) {

                const id =
                    viewButton.dataset.id;


                openWithdrawDetailsPart4(
                    id
                );


                return;

            }


            /* -----------------------------------------
               APPROVE
               
               PART 11 OWNS THE ACTUAL FUNCTION.
            ----------------------------------------- */

            const approveButton =
                event.target.closest(
                    ".approveWithdrawBtn"
                );


            if (approveButton) {

                const id =
                    approveButton.dataset.id;


                if (
                    typeof window.approveWithdraw ===
                    "function"
                ) {

                    approveButton.disabled =
                        true;


                    Promise.resolve(
                        window.approveWithdraw(
                            id
                        )
                    )
                        .finally(
                            () => {

                                /*
                                 * Firebase listener will
                                 * normally re-render the card.
                                 */

                                approveButton.disabled =
                                    false;

                            }
                        );

                }

                else {

                    console.error(
                        "Part 11 approveWithdraw() is not loaded."
                    );


                    alert(
                        "Withdraw approval system is not ready. Please reload the admin page."
                    );

                }


                return;

            }


            /* -----------------------------------------
               REJECT
               
               PART 11 OWNS THE ACTUAL FUNCTION.
            ----------------------------------------- */

            const rejectButton =
                event.target.closest(
                    ".rejectWithdrawBtn"
                );


            if (rejectButton) {

                const id =
                    rejectButton.dataset.id;


                if (
                    typeof window.rejectWithdraw ===
                    "function"
                ) {

                    rejectButton.disabled =
                        true;


                    Promise.resolve(
                        window.rejectWithdraw(
                            id
                        )
                    )
                        .finally(
                            () => {

                                rejectButton.disabled =
                                    false;

                            }
                        );

                }

                else {

                    console.error(
                        "Part 11 rejectWithdraw() is not loaded."
                    );


                    alert(
                        "Withdraw rejection system is not ready. Please reload the admin page."
                    );

                }


                return;

            }

        }
    );

}


/* =========================================================
   SEARCH EVENTS
========================================================= */

function bindWithdrawSearchPart4() {

    if (
        part4WithdrawSearch &&
        !part4WithdrawSearch.dataset.part4Bound
    ) {

        part4WithdrawSearch.dataset.part4Bound =
            "true";


        part4WithdrawSearch.addEventListener(
            "input",
            () => {

                renderWithdrawRequestsPart4();

            }
        );

    }


    if (
        part4WithdrawFilter &&
        !part4WithdrawFilter.dataset.part4Bound
    ) {

        part4WithdrawFilter.dataset.part4Bound =
            "true";


        part4WithdrawFilter.addEventListener(
            "change",
            () => {

                renderWithdrawRequestsPart4();

            }
        );

    }

}


/* =========================================================
   FIREBASE LISTENER
========================================================= */

function initializeWithdrawListenerPart4() {

    if (
        part4WithdrawListenerStarted
    ) {

        return;

    }


    if (!part4WithdrawList) {

        console.warn(
            "Part 4: #withdrawRequests not found."
        );

        return;

    }


    part4WithdrawListenerStarted =
        true;


    onValue(

        ref(
            db,
            "withdrawRequests"
        ),

        snapshot => {

            const newData = {};


            if (
                snapshot.exists()
            ) {

                snapshot.forEach(
                    child => {

                        newData[
                            child.key
                        ] = {

                            id:
                                child.key,

                            ...(child.val() || {})

                        };

                    }
                );

            }


            part4WithdrawData =
                newData;


            updateWithdrawSummaryPart4();

            renderWithdrawRequestsPart4();

        },

        error => {

            console.error(
                "Part 4 withdraw listener error:",
                error
            );


            part4WithdrawList.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Failed to Load Withdraw Requests
                    </h3>

                    <p>
                        ${safeWithdrawHTMLPart4(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    );


    console.log(
        "✅ Part 4 withdraw listener started"
    );

}


/* =========================================================
   REFRESH
========================================================= */

function refreshWithdrawPart4() {

    updateWithdrawSummaryPart4();

    renderWithdrawRequestsPart4();

}


/* =========================================================
   START PART 4
========================================================= */

let part4WithdrawStarted =
    false;


async function startWithdrawPart4() {

    if (
        part4WithdrawStarted
    ) {

        return;

    }


    try {

        /*
         * Prefer the central admin
         * authentication system.
         */

        if (
            typeof window.waitForAdmin ===
            "function"
        ) {

            await window.waitForAdmin();

        }


        /*
         * Check admin safely.
         */

        let adminReady = false;


        if (
            typeof currentAdmin !==
            "undefined" &&
            currentAdmin
        ) {

            adminReady = true;

        }


        if (
            window.currentAdmin
        ) {

            adminReady = true;

        }


        if (!adminReady) {

            console.warn(
                "Part 4: waiting for admin authentication..."
            );

            return;

        }


        part4WithdrawStarted =
            true;


        bindWithdrawModalEventsPart4();

        bindWithdrawEventsPart4();

        bindWithdrawSearchPart4();

        initializeWithdrawListenerPart4();


        console.log(
            "✅ Money Vault Admin Part 4 started"
        );

    }

    catch (error) {

        console.error(
            "Part 4 start error:",
            error
        );

    }

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

const part4WithdrawAuthInterval =
    setInterval(
        () => {

            let adminReady = false;


            if (
                typeof currentAdmin !==
                "undefined" &&
                currentAdmin
            ) {

                adminReady = true;

            }


            if (
                window.currentAdmin
            ) {

                adminReady = true;

            }


            if (adminReady) {

                clearInterval(
                    part4WithdrawAuthInterval
                );


                startWithdrawPart4();

            }

        },
        250
    );


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

/*
 * IMPORTANT:
 * These are Part 4 UI functions only.
 *
 * approveWithdraw() and rejectWithdraw()
 * are NOT defined here.
 *
 * Part 11 owns them.
 */

window.renderWithdrawRequests =
    renderWithdrawRequestsPart4;

window.openWithdrawDetails =
    openWithdrawDetailsPart4;

window.refreshWithdrawPart4 =
    refreshWithdrawPart4;


/* =========================================================
   READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 4 Loaded"
);

console.log(
    "Withdraw Requests UI ready"
);

console.log(
    "Part 4 = Display / Search / Filter / View"
);

console.log(
    "Part 11 = Approve / Reject"
);

console.log(
    "======================================"
);

