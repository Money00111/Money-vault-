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

import {
    ref,
    get,
    set,
    update,
    push,
    onValue,
    query,
    orderByChild,
    equalTo
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
   PART 2 — DASHBOARD + USERS MANAGEMENT

   CURRENCY: RWF / FRW

   FEATURES:
   - Dashboard statistics
   - Total users
   - Deposit statistics
   - Withdraw statistics
   - User list
   - User search
   - User status counters
   - Safe HTML escaping
   - Live Realtime Database listeners
   - No duplicate functions
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let allUsersData = {};
let allDepositsData = {};
let allWithdrawsData = {};
let allTransactionsData = {};


/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

const totalUsersEl =
    document.getElementById("totalUsers");

const totalDepositsEl =
    document.getElementById("totalDeposits");

const totalPendingEl =
    document.getElementById("totalPending");

const totalApprovedEl =
    document.getElementById("totalApproved");

const totalRejectedEl =
    document.getElementById("totalRejected");

const totalAmountEl =
    document.getElementById("totalAmount");


/* =========================================================
   USERS ELEMENTS
========================================================= */

const usersContainer =
    document.getElementById("usersContainer");

const allUsersEl =
    document.getElementById("allUsers");

const activeUsersEl =
    document.getElementById("activeUsers");

const blockedUsersEl =
    document.getElementById("blockedUsers");

const userSearchEl =
    document.getElementById("userSearch");


/* =========================================================
   HELPER — SAFE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
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
   HELPER — NUMBER
========================================================= */

function moneyRWF(value) {

    const amount = Number(value || 0);

    return amount.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(
        status || "pending"
    ).trim().toLowerCase();

}


/* =========================================================
   HELPER — USER STATUS
========================================================= */

function isBlockedUser(user) {

    const status =
        String(user?.status || "")
            .trim()
            .toLowerCase();

    return (
        status === "blocked" ||
        status === "suspended" ||
        user?.blocked === true
    );

}


/* =========================================================
   DASHBOARD — UPDATE USER COUNT
========================================================= */

function updateUserDashboardStats() {

    const users =
        Object.values(allUsersData || {});

    const total =
        users.length;

    let active = 0;
    let blocked = 0;

    users.forEach(user => {

        if (isBlockedUser(user)) {

            blocked++;

        } else {

            active++;

        }

    });


    if (totalUsersEl) {

        totalUsersEl.textContent =
            total.toLocaleString();

    }


    if (allUsersEl) {

        allUsersEl.textContent =
            total.toLocaleString();

    }


    if (activeUsersEl) {

        activeUsersEl.textContent =
            active.toLocaleString();

    }


    if (blockedUsersEl) {

        blockedUsersEl.textContent =
            blocked.toLocaleString();

    }

}


/* =========================================================
   DASHBOARD — DEPOSIT STATISTICS
========================================================= */

function updateDepositDashboardStats() {

    const deposits =
        Object.values(allDepositsData || {});

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let totalAmount = 0;

    deposits.forEach(deposit => {

        const status =
            normalizeStatus(
                deposit?.status
            );

        const amount =
            Number(
                deposit?.amount || 0
            );

        if (
            Number.isFinite(amount) &&
            amount > 0
        ) {

            totalAmount += amount;

        }


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


    if (totalDepositsEl) {

        totalDepositsEl.textContent =
            deposits.length.toLocaleString();

    }


    if (totalPendingEl) {

        totalPendingEl.textContent =
            pending.toLocaleString();

    }


    if (totalApprovedEl) {

        totalApprovedEl.textContent =
            approved.toLocaleString();

    }


    if (totalRejectedEl) {

        totalRejectedEl.textContent =
            rejected.toLocaleString();

    }


    if (totalAmountEl) {

        totalAmountEl.textContent =
            moneyRWF(totalAmount);

    }

}


/* =========================================================
   DASHBOARD — LOAD USERS
========================================================= */

function initializeUsersListener() {

    onValue(
        ref(db, "users"),
        snapshot => {

            if (!snapshot.exists()) {

                allUsersData = {};

                updateUserDashboardStats();

                renderUsers();

                return;

            }


            allUsersData =
                snapshot.val() || {};


            updateUserDashboardStats();

            renderUsers();

        },
        error => {

            console.error(
                "Users listener error:",
                error
            );

        }
    );

}


/* =========================================================
   DASHBOARD — LOAD DEPOSITS
========================================================= */

function initializeDepositsDashboardListener() {

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            if (!snapshot.exists()) {

                allDepositsData = {};

            } else {

                allDepositsData =
                    snapshot.val() || {};

            }


            updateDepositDashboardStats();

        },
        error => {

            console.error(
                "Deposit dashboard listener error:",
                error
            );

        }
    );

}


/* =========================================================
   DASHBOARD — LOAD WITHDRAWS
========================================================= */

function initializeWithdrawDashboardListener() {

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            if (!snapshot.exists()) {

                allWithdrawsData = {};

            } else {

                allWithdrawsData =
                    snapshot.val() || {};

            }

            updateWithdrawDashboardStats();

        },
        error => {

            console.error(
                "Withdraw dashboard listener error:",
                error
            );

        }
    );

}


/* =========================================================
   WITHDRAW DASHBOARD STATISTICS
========================================================= */

function updateWithdrawDashboardStats() {

    const withdraws =
        Object.values(
            allWithdrawsData || {}
        );

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    withdraws.forEach(withdraw => {

        const status =
            normalizeStatus(
                withdraw?.status
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


    const withdrawCount =
        document.getElementById(
            "withdrawCount"
        );

    const withdrawPending =
        document.getElementById(
            "withdrawPending"
        );

    const withdrawApproved =
        document.getElementById(
            "withdrawApproved"
        );

    const withdrawRejected =
        document.getElementById(
            "withdrawRejected"
        );


    if (withdrawCount) {

        withdrawCount.textContent =
            withdraws.length.toLocaleString();

    }

    if (withdrawPending) {

        withdrawPending.textContent =
            pending.toLocaleString();

    }

    if (withdrawApproved) {

        withdrawApproved.textContent =
            approved.toLocaleString();

    }

    if (withdrawRejected) {

        withdrawRejected.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    if (!usersContainer) {
        return;
    }


    const keyword =
        String(
            userSearchEl?.value || ""
        )
        .trim()
        .toLowerCase();


    usersContainer.innerHTML = "";


    const entries =
        Object.entries(
            allUsersData || {}
        );


    if (entries.length === 0) {

        usersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                <h3>No Users Found</h3>
                <p>Registered users will appear here.</p>
            </div>
        `;

        return;

    }


    let visibleCount = 0;


    entries.forEach(
        ([uid, user]) => {

            user = user || {};


            const name =
                String(
                    user.fullName ||
                    user.name ||
                    "Unknown User"
                );

            const email =
                String(
                    user.email || "-"
                );

            const phone =
                String(
                    user.phone || "-"
                );

            const vip =
                String(
                    user.vip ||
                    user.vipPlan ||
                    "VIP 0"
                );

            const balance =
                Number(
                    user.balance || 0
                );


            const searchableText =
                (
                    name +
                    " " +
                    email +
                    " " +
                    phone +
                    " " +
                    uid +
                    " " +
                    vip
                )
                .toLowerCase();


            if (
                keyword &&
                !searchableText.includes(keyword)
            ) {

                return;

            }


            visibleCount++;


            const blocked =
                isBlockedUser(user);


            const statusText =
                blocked
                    ? "Blocked"
                    : "Active";


            const statusClass =
                blocked
                    ? "blocked"
                    : "active";


            usersContainer.innerHTML += `

                <div
                    class="user-card"
                    data-user-id="${escapeHTML(uid)}"
                >

                    <div class="user-card-header">

                        <div class="user-avatar">

                            <i class="fa-solid fa-user"></i>

                        </div>

                        <div class="user-main-info">

                            <h3>
                                ${escapeHTML(name)}
                            </h3>

                            <span
                                class="user-status ${statusClass}"
                            >
                                ${statusText}
                            </span>

                        </div>

                    </div>


                    <div class="user-card-body">

                        <p>
                            <strong>Email:</strong>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(phone)}
                        </p>

                        <p>
                            <strong>Balance:</strong>
                            ${moneyRWF(balance)}
                        </p>

                        <p>
                            <strong>VIP:</strong>
                            ${escapeHTML(vip)}
                        </p>

                        <p>
                            <strong>UID:</strong>
                            <small>
                                ${escapeHTML(uid)}
                            </small>
                        </p>

                    </div>


                    <div class="action-buttons">

                        <button
                            type="button"
                            class="viewUserBtn"
                            data-id="${escapeHTML(uid)}"
                        >
                            <i class="fa-solid fa-eye"></i>
                            View
                        </button>

                    </div>

                </div>

            `;

        }
    );


    if (visibleCount === 0) {

        usersContainer.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                <h3>No Matching Users</h3>

                <p>
                    Try another name, email, phone or UID.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   USER SEARCH
========================================================= */

userSearchEl?.addEventListener(
    "input",
    () => {

        renderUsers();

    }
);


/* =========================================================
   VIEW USER
========================================================= */

function viewUser(uid) {

    if (!uid) return;


    const user =
        allUsersData?.[uid];


    if (!user) {

        alert(
            "User information not found."
        );

        return;

    }


    const name =
        user.fullName ||
        user.name ||
        "Unknown User";

    const email =
        user.email ||
        "-";

    const phone =
        user.phone ||
        "-";

    const balance =
        Number(
            user.balance || 0
        );

    const vip =
        user.vip ||
        user.vipPlan ||
        "VIP 0";


    const message =

        "USER DETAILS\n\n" +

        "Name: " +
        name +

        "\nEmail: " +
        email +

        "\nPhone: " +
        phone +

        "\nBalance: " +
        moneyRWF(balance) +

        "\nVIP: " +
        vip +

        "\nUID: " +
        uid;


    alert(message);

}


/* =========================================================
   USER BUTTON EVENT DELEGATION
========================================================= */

usersContainer?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".viewUserBtn"
            );

        if (!button) return;


        const uid =
            button.dataset.id;


        viewUser(uid);

    }
);


/* =========================================================
   GLOBAL INITIALIZATION
========================================================= */

function initializeAdminPart2() {

    console.log(
        "Starting Admin Part 2 listeners..."
    );


    initializeUsersListener();

    initializeDepositsDashboardListener();

    initializeWithdrawDashboardListener();


    console.log(
        "✅ Admin Part 2 listeners started"
    );

}


/* =========================================================
   START PART 2 ONLY AFTER ADMIN AUTH
========================================================= */

let part2Started = false;


function startAdminPart2() {

    if (part2Started) {
        return;
    }


    if (!currentAdmin) {

        console.warn(
            "Part 2 waiting for admin authentication..."
        );

        return;

    }


    part2Started = true;

    initializeAdminPart2();

}


/* =========================================================
   WAIT FOR PART 1 AUTH
========================================================= */

const part2AuthInterval =
    setInterval(
        () => {

            if (currentAdmin) {

                clearInterval(
                    part2AuthInterval
                );

                startAdminPart2();

            }

        },
        100
    );


/* =========================================================
   ADMIN PART 2 READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 2 Loaded"
);

console.log(
    "Dashboard + Users ready"
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

   FEATURES:
   - Live withdraw requests
   - Search
   - Status filter
   - Counters
   - View details
   - Approve
   - Reject
   - Atomic balance update
   - Atomic status update
   - Transaction record
   - ONE-TIME APPROVAL PROTECTION
   - Insufficient balance protection
   - Canonical status:
       pending
       approved
       rejected
========================================================= */


/* =========================================================
   WITHDRAW STATE
========================================================= */

let withdrawData = {};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const withdrawList =
    document.getElementById("withdrawRequests");


const withdrawSearch =
    document.getElementById("withdrawSearch");


const withdrawFilter =
    document.getElementById("withdrawFilter");


const withdrawCount =
    document.getElementById("withdrawCount");


const withdrawPending =
    document.getElementById("withdrawPending");


const withdrawApproved =
    document.getElementById("withdrawApproved");


const withdrawRejected =
    document.getElementById("withdrawRejected");


const emptyWithdraw =
    document.getElementById("emptyWithdraw");


/* =========================================================
   WITHDRAW MODAL
========================================================= */

const withdrawModal =
    document.getElementById("withdrawModal");


const closeWithdrawModal =
    document.getElementById("closeWithdrawModal");


const modalUser =
    document.getElementById("modalUser");


const modalEmail =
    document.getElementById("modalEmail");


const modalPhone =
    document.getElementById("modalPhone");


const modalAmount =
    document.getElementById("modalAmount");


const modalMethod =
    document.getElementById("modalMethod");


const modalStatus =
    document.getElementById("modalStatus");


/* =========================================================
   HELPER — STATUS
========================================================= */

function normalizeWithdrawStatus(status) {

    return String(
        status || "pending"
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   HELPER — RWF
========================================================= */

function formatWithdrawRWF(amount) {

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

function safeWithdrawHTML(value) {

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

function formatWithdrawDate(value) {

    if (!value) {

        return "-";

    }


    const numberValue =
        Number(value);


    if (
        Number.isFinite(
            numberValue
        ) &&
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
   LOAD WITHDRAW REQUESTS
========================================================= */

function initializeWithdrawListener() {

    if (!withdrawList) {

        console.warn(
            "Withdraw list element not found."
        );

        return;

    }


    onValue(
        ref(db, "withdrawRequests"),

        snapshot => {

            withdrawData = {};


            if (
                snapshot.exists()
            ) {

                snapshot.forEach(
                    child => {

                        withdrawData[
                            child.key
                        ] = {

                            id: child.key,

                            ...(child.val() || {})

                        };

                    }
                );

            }


            updateWithdrawSummary();

            renderWithdrawRequests();

        },

        error => {

            console.error(
                "Withdraw listener error:",
                error
            );


            withdrawList.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Failed to Load Withdraw Requests
                    </h3>

                    <p>
                        ${safeWithdrawHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }
    );

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateWithdrawSummary() {

    const requests =
        Object.values(
            withdrawData || {}
        );


    let pending = 0;

    let approved = 0;

    let rejected = 0;


    requests.forEach(
        request => {

            const status =
                normalizeWithdrawStatus(
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


    if (withdrawCount) {

        withdrawCount.textContent =
            requests.length.toLocaleString();

    }


    if (withdrawPending) {

        withdrawPending.textContent =
            pending.toLocaleString();

    }


    if (withdrawApproved) {

        withdrawApproved.textContent =
            approved.toLocaleString();

    }


    if (withdrawRejected) {

        withdrawRejected.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   SEARCH VALUE
========================================================= */

function getWithdrawSearch() {

    if (!withdrawSearch) {

        return "";

    }


    return String(
        withdrawSearch.value || ""
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   FILTER VALUE
========================================================= */

function getWithdrawFilter() {

    if (!withdrawFilter) {

        return "all";

    }


    return String(
        withdrawFilter.value || "all"
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   SEARCH MATCH
========================================================= */

function withdrawMatchesSearch(
    request
) {

    const keyword =
        getWithdrawSearch();


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

function withdrawMatchesFilter(
    request
) {

    const filter =
        getWithdrawFilter();


    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }


    return (
        normalizeWithdrawStatus(
            request.status
        ) === filter
    );

}


/* =========================================================
   RENDER WITHDRAW REQUESTS
========================================================= */

function renderWithdrawRequests() {

    if (!withdrawList) {

        return;

    }


    withdrawList.innerHTML = "";


    const requests =
        Object.values(
            withdrawData || {}
        );


    const filteredRequests =
        requests
            .filter(
                request =>
                    withdrawMatchesSearch(
                        request
                    )
            )
            .filter(
                request =>
                    withdrawMatchesFilter(
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


    if (emptyWithdraw) {

        emptyWithdraw.style.display =
            filteredRequests.length === 0
                ? "block"
                : "none";

    }


    if (
        filteredRequests.length === 0
    ) {

        withdrawList.innerHTML = `

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
                normalizeWithdrawStatus(
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


            const phone =
                request.phone ||
                request.senderPhone ||
                request.withdrawPhone ||
                "-";


            const method =
                request.paymentMethod ||
                request.method ||
                "-";


            withdrawList.innerHTML += `

                <div
                    class="request-card withdraw-card"
                    data-id="${safeWithdrawHTML(id)}"
                >

                    <div class="request-header">

                        <div>

                            <h3>
                                ${formatWithdrawRWF(
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

                            ${safeWithdrawHTML(
                                request.email || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Phone:
                            </strong>

                            ${safeWithdrawHTML(
                                phone
                            )}

                        </p>


                        <p>

                            <strong>
                                Method:
                            </strong>

                            ${safeWithdrawHTML(
                                method
                            )}

                        </p>


                        ${
                            request.transactionId
                            ? `

                                <p>

                                    <strong>
                                        Transaction ID:
                                    </strong>

                                    ${safeWithdrawHTML(
                                        request.transactionId
                                    )}

                                </p>

                            `
                            : ""
                        }


                        ${
                            request.createdAt
                            ? `

                                <p>

                                    <strong>
                                        Submitted:
                                    </strong>

                                    ${safeWithdrawHTML(
                                        formatWithdrawDate(
                                            request.createdAt
                                        )
                                    )}

                                </p>

                            `
                            : ""
                        }


                        ${
                            request.note
                            ? `

                                <p>

                                    <strong>
                                        Note:
                                    </strong>

                                    ${safeWithdrawHTML(
                                        request.note
                                    )}

                                </p>

                            `
                            : ""
                        }


                        ${
                            request.approvedAt
                            ? `

                                <p>

                                    <strong>
                                        Approved:
                                    </strong>

                                    ${safeWithdrawHTML(
                                        formatWithdrawDate(
                                            request.approvedAt
                                        )
                                    )}

                                </p>

                            `
                            : ""
                        }


                        ${
                            request.rejectedAt
                            ? `

                                <p>

                                    <strong>
                                        Rejected:
                                    </strong>

                                    ${safeWithdrawHTML(
                                        formatWithdrawDate(
                                            request.rejectedAt
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
                                    class="approveWithdrawBtn"
                                    data-id="${safeWithdrawHTML(
                                        id
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-check"
                                    ></i>

                                    Approve

                                </button>


                                <button
                                    type="button"
                                    class="viewWithdrawBtn"
                                    data-id="${safeWithdrawHTML(
                                        id
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-eye"
                                    ></i>

                                    View

                                </button>


                                <button
                                    type="button"
                                    class="rejectWithdrawBtn"
                                    data-id="${safeWithdrawHTML(
                                        id
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-xmark"
                                    ></i>

                                    Reject

                                </button>

                            `
                            : `

                                <button
                                    type="button"
                                    class="viewWithdrawBtn"
                                    data-id="${safeWithdrawHTML(
                                        id
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-eye"
                                    ></i>

                                    View

                                </button>

                            `
                        }

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   OPEN WITHDRAW MODAL
========================================================= */

function openWithdrawDetails(id) {

    const request =
        withdrawData[id];


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


    if (modalUser) {

        modalUser.textContent =
            request.uid || "-";

    }


    if (modalEmail) {

        modalEmail.textContent =
            request.email || "-";

    }


    if (modalPhone) {

        modalPhone.textContent =
            phone;

    }


    if (modalAmount) {

        modalAmount.textContent =
            formatWithdrawRWF(
                amount
            );

    }


    if (modalMethod) {

        modalMethod.textContent =
            method;

    }


    if (modalStatus) {

        modalStatus.textContent =
            String(
                request.status ||
                "Pending"
            );

    }


    if (withdrawModal) {

        withdrawModal.style.display =
            "flex";

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeWithdrawDetails() {

    if (withdrawModal) {

        withdrawModal.style.display =
            "none";

    }

}


/* =========================================================
   MODAL EVENTS
========================================================= */

closeWithdrawModal?.addEventListener(
    "click",
    closeWithdrawDetails
);


withdrawModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            withdrawModal
        ) {

            closeWithdrawDetails();

        }

    }
);


/* =========================================================
   APPROVE WITHDRAW — ATOMIC
========================================================= */

async function approveWithdraw(id) {

    if (!id) {

        alert(
            "Withdraw request ID is missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Approve this withdraw request?"
        );


    if (!confirmed) {

        return;

    }


    try {

        /* ---------------------------------------------
           ADMIN CHECK
        --------------------------------------------- */

        if (!currentAdmin) {

            alert(
                "Admin session is not ready."
            );

            return;

        }


        /* ---------------------------------------------
           GET REQUEST
        --------------------------------------------- */

        const withdrawRef =
            ref(
                db,
                "withdrawRequests/" + id
            );


        const withdrawSnap =
            await get(
                withdrawRef
            );


        if (!withdrawSnap.exists()) {

            alert(
                "Withdraw request not found."
            );

            return;

        }


        const withdraw =
            withdrawSnap.val() || {};


        /* ---------------------------------------------
           ONE-TIME PROTECTION
        --------------------------------------------- */

        const currentStatus =
            normalizeWithdrawStatus(
                withdraw.status
            );


        if (
            currentStatus === "approved"
        ) {

            alert(
                "This withdraw has already been approved."
            );

            return;

        }


        if (
            currentStatus !== "pending"
        ) {

            alert(
                "This withdraw request is no longer pending."
            );

            return;

        }


        /* ---------------------------------------------
           UID
        --------------------------------------------- */

        const uid =
            String(
                withdraw.uid || ""
            ).trim();


        if (!uid) {

            alert(
                "Withdraw request has no user UID."
            );

            return;

        }


        /* ---------------------------------------------
           AMOUNT
        --------------------------------------------- */

        const amount =
            Number(
                withdraw.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount < 4000 ||
            amount > 500000
        ) {

            alert(
                "Invalid withdraw amount.\n\n" +
                "Minimum: 4,000 RWF\n" +
                "Maximum: 500,000 RWF"
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
           BALANCE
        --------------------------------------------- */

        const balance =
            Number(
                user.balance || 0
            );


        if (
            !Number.isFinite(balance)
        ) {

            alert(
                "User balance is invalid."
            );

            return;

        }


        /* ---------------------------------------------
           INSUFFICIENT BALANCE
        --------------------------------------------- */

        if (
            balance < amount
        ) {

            alert(
                "Insufficient User Balance.\n\n" +
                "Available: " +
                formatWithdrawRWF(
                    balance
                ) +
                "\nRequested: " +
                formatWithdrawRWF(
                    amount
                )
            );

            return;

        }


        /* ---------------------------------------------
           NEW BALANCE
        --------------------------------------------- */

        const newBalance =
            balance - amount;


        /* ---------------------------------------------
           TOTAL WITHDRAW
        --------------------------------------------- */

        const oldTotalWithdraws =
            Number(
                user.totalWithdraws ||
                0
            );


        const oldTotalWithdraw =
            Number(
                user.totalWithdraw ||
                0
            );


        const newTotalWithdraws =
            oldTotalWithdraws +
            amount;


        const newTotalWithdraw =
            oldTotalWithdraw +
            amount;


        /* ---------------------------------------------
           TRANSACTION KEY
        --------------------------------------------- */

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        const transactionKey =
            transactionRef.key;


        if (!transactionKey) {

            alert(
                "Could not create transaction ID."
            );

            return;

        }


        const now =
            Date.now();


        /* =================================================
           ATOMIC MULTI-LOCATION UPDATE

           USER BALANCE
           USER WITHDRAW TOTALS
           USER TRANSACTION COUNT
           WITHDRAW STATUS
           TRANSACTION RECORD

           ALL WRITTEN TOGETHER
        ================================================= */

        const updates = {};


        /* ---------------------------------------------
           USER BALANCE
        --------------------------------------------- */

        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            newBalance;


        /* ---------------------------------------------
           USER WITHDRAW TOTAL
        --------------------------------------------- */

        updates[
            "users/" +
            uid +
            "/totalWithdraws"
        ] =
            newTotalWithdraws;


        updates[
            "users/" +
            uid +
            "/totalWithdraw"
        ] =
            newTotalWithdraw;


        /* ---------------------------------------------
           USER TRANSACTION COUNT
        --------------------------------------------- */

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
           WITHDRAW REQUEST
        --------------------------------------------- */

        updates[
            "withdrawRequests/" +
            id +
            "/status"
        ] =
            "approved";


        updates[
            "withdrawRequests/" +
            id +
            "/approvedAt"
        ] =
            now;


        updates[
            "withdrawRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin.uid;


        /* ---------------------------------------------
           TRANSACTION RECORD
        --------------------------------------------- */

        updates[
            "transactions/" +
            transactionKey
        ] = {

            uid: uid,

            type: "withdraw",

            transactionType: "withdraw",

            amount: amount,

            currency: "RWF",

            status: "approved",

            referenceId: id,

            transactionId:
                withdraw.transactionId ||
                id,

            paymentMethod:
                withdraw.paymentMethod ||
                withdraw.method ||
                "",

            description:
                "Withdraw approved",

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
            "Withdraw approved successfully."
        );


        console.log(
            "✅ Withdraw approved:",
            id
        );

    }

    catch (error) {

        console.error(
            "Withdraw approval failed:",
            error
        );


        alert(
            "Withdraw approval failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    if (!id) {

        alert(
            "Withdraw request ID is missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Reject this withdraw request?"
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


        const withdrawRef =
            ref(
                db,
                "withdrawRequests/" + id
            );


        const snap =
            await get(
                withdrawRef
            );


        if (!snap.exists()) {

            alert(
                "Withdraw request not found."
            );

            return;

        }


        const withdraw =
            snap.val() || {};


        const status =
            normalizeWithdrawStatus(
                withdraw.status
            );


        if (
            status === "approved"
        ) {

            alert(
                "An approved withdraw cannot be rejected."
            );

            return;

        }


        if (
            status === "rejected"
        ) {

            alert(
                "This withdraw is already rejected."
            );

            return;

        }


        if (
            status !== "pending"
        ) {

            alert(
                "This withdraw request is not pending."
            );

            return;

        }


        const now =
            Date.now();


        await update(
            withdrawRef,
            {

                status: "rejected",

                rejectedAt: now,

                rejectedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "Withdraw rejected successfully."
        );


        console.log(
            "✅ Withdraw rejected:",
            id
        );

    }

    catch (error) {

        console.error(
            "Withdraw rejection failed:",
            error
        );


        alert(
            "Withdraw rejection failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   EVENT DELEGATION
========================================================= */

withdrawList?.addEventListener(
    "click",
    event => {


        /* ---------------------------------------------
           APPROVE
        --------------------------------------------- */

        const approveButton =
            event.target.closest(
                ".approveWithdrawBtn"
            );


        if (approveButton) {

            const id =
                approveButton.dataset.id;


            approveButton.disabled =
                true;


            approveWithdraw(id)
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
                ".rejectWithdrawBtn"
            );


        if (rejectButton) {

            const id =
                rejectButton.dataset.id;


            rejectButton.disabled =
                true;


            rejectWithdraw(id)
                .finally(() => {

                    rejectButton.disabled =
                        false;

                });


            return;

        }


        /* ---------------------------------------------
           VIEW
        --------------------------------------------- */

        const viewButton =
            event.target.closest(
                ".viewWithdrawBtn"
            );


        if (viewButton) {

            const id =
                viewButton.dataset.id;


            openWithdrawDetails(
                id
            );


            return;

        }

    }
);


/* =========================================================
   SEARCH
========================================================= */

withdrawSearch?.addEventListener(
    "input",
    () => {

        renderWithdrawRequests();

    }
);


/* =========================================================
   FILTER
========================================================= */

withdrawFilter?.addEventListener(
    "change",
    () => {

        renderWithdrawRequests();

    }
);


/* =========================================================
   START PART 4
========================================================= */

let withdrawPartStarted =
    false;


function startWithdrawPart() {

    if (
        withdrawPartStarted
    ) {

        return;

    }


    if (!currentAdmin) {

        console.warn(
            "Withdraw Part waiting for admin authentication..."
        );

        return;

    }


    withdrawPartStarted =
        true;


    initializeWithdrawListener();


    console.log(
        "✅ Withdraw Part started"
    );

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

const withdrawAuthInterval =
    setInterval(
        () => {

            if (currentAdmin) {

                clearInterval(
                    withdrawAuthInterval
                );

                startWithdrawPart();

            }

        },
        100
    );


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.approveWithdraw =
    approveWithdraw;


window.rejectWithdraw =
    rejectWithdraw;


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
    "Withdraw Requests ready"
);

console.log(
    "Atomic withdraw approval enabled"
);

console.log(
    "======================================"
);

   /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 5
   TRANSACTIONS MANAGEMENT
   CURRENCY: RWF / FRW

   FEATURES:
   - Live transactions
   - Deposit + Withdraw transactions
   - Search
   - Type filter
   - Status filter
   - Counters
   - Sort newest first
   - User information
   - Transaction ID
   - Reference ID
   - Amount
   - Date
   - Safe HTML rendering
   - No duplicate listeners
========================================================= */


/* =========================================================
   PART 5 STATE
========================================================= */

let allTransactionData = [];
let transactionsListenerStarted = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const transactionsContainer =
    document.getElementById("transactionsContainer");

const transactionSearch =
    document.getElementById("transactionSearch");

const transactionFilter =
    document.getElementById("transactionFilter");

const transactionTotal =
    document.getElementById("transactionTotal");

const transactionApproved =
    document.getElementById("transactionApproved");

const transactionPending =
    document.getElementById("transactionPending");

const transactionRejected =
    document.getElementById("transactionRejected");


/* =========================================================
   STATUS NORMALIZER
========================================================= */

function normalizeTransactionStatus(status) {

    return String(status || "")
        .trim()
        .toLowerCase();

}


/* =========================================================
   TRANSACTION TYPE NORMALIZER
========================================================= */

function normalizeTransactionType(transaction) {

    const type =
        transaction.type ||
        transaction.transactionType ||
        transaction.kind ||
        "";

    const value =
        String(type)
            .trim()
            .toLowerCase();

    if (
        value === "deposit" ||
        value === "deposits"
    ) {
        return "Deposit";
    }

    if (
        value === "withdraw" ||
        value === "withdrawal" ||
        value === "withdraws"
    ) {
        return "Withdraw";
    }

    return "Transaction";
}


/* =========================================================
   FORMAT RWF
========================================================= */

function formatTransactionMoney(amount) {

    const value = Number(amount || 0);

    return value.toLocaleString("en-RW") + " RWF";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatTransactionDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(Number(value));

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString();

}


/* =========================================================
   STATUS LABEL
========================================================= */

function transactionStatusLabel(status) {

    const normalized =
        normalizeTransactionStatus(status);

    if (normalized === "approved") {
        return "Approved";
    }

    if (normalized === "pending") {
        return "Pending";
    }

    if (normalized === "rejected") {
        return "Rejected";
    }

    if (!normalized) {
        return "Unknown";
    }

    return String(status);

}


/* =========================================================
   STATUS CLASS
========================================================= */

function transactionStatusClass(status) {

    const normalized =
        normalizeTransactionStatus(status);

    if (normalized === "approved") {
        return "approved";
    }

    if (normalized === "pending") {
        return "pending";
    }

    if (normalized === "rejected") {
        return "rejected";
    }

    return "pending";

}


/* =========================================================
   TRANSACTION ICON
========================================================= */

function transactionIcon(type) {

    if (type === "Deposit") {

        return `
            <i class="fa-solid fa-arrow-down"></i>
        `;

    }

    if (type === "Withdraw") {

        return `
            <i class="fa-solid fa-arrow-up"></i>
        `;

    }

    return `
        <i class="fa-solid fa-clock-rotate-left"></i>
    `;

}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

function initializeTransactionsListener() {

    if (transactionsListenerStarted) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    if (!transactionsContainer) {
        console.warn(
            "Transactions container not found."
        );
        return;
    }

    transactionsListenerStarted = true;

    onValue(
        ref(db, "transactions"),
        (snapshot) => {

            allTransactionData = [];

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    allTransactionData.push({

                        id: child.key,

                        ...data

                    });

                });

            }

            /*
             * Newest transaction first
             */
            allTransactionData.sort(
                (a, b) => {

                    const dateA =
                        Number(
                            a.createdAt ||
                            a.timestamp ||
                            a.approvedAt ||
                            0
                        );

                    const dateB =
                        Number(
                            b.createdAt ||
                            b.timestamp ||
                            b.approvedAt ||
                            0
                        );

                    return dateB - dateA;

                }
            );

            renderFilteredTransactions();

        },
        (error) => {

            console.error(
                "Transactions listener error:",
                error
            );

            if (transactionsContainer) {

                transactionsContainer.innerHTML = `

                    <div class="request-card">

                        <h3>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Unable to load transactions
                        </h3>

                        <p>
                            ${escapeHTML(
                                error.message ||
                                "Permission denied."
                            )}
                        </p>

                    </div>

                `;

            }

        }
    );

}


/* =========================================================
   FILTER TRANSACTIONS
========================================================= */

function getFilteredTransactions() {

    const search =
        String(
            transactionSearch?.value || ""
        )
        .trim()
        .toLowerCase();

    const filter =
        String(
            transactionFilter?.value || "All"
        )
        .trim()
        .toLowerCase();


    return allTransactionData.filter(
        (transaction) => {

            const type =
                normalizeTransactionType(
                    transaction
                );

            const status =
                normalizeTransactionStatus(
                    transaction.status
                );

            /*
             * TYPE / STATUS FILTER
             */

            let filterMatches = true;

            if (filter !== "all") {

                const typeMatches =
                    filter === type.toLowerCase();

                const statusMatches =
                    filter === status;

                filterMatches =
                    typeMatches ||
                    statusMatches;

            }

            if (!filterMatches) {
                return false;
            }


            /*
             * SEARCH
             */

            if (!search) {
                return true;
            }

            const searchableText = [

                transaction.uid,

                transaction.email,

                transaction.phone,

                transaction.senderPhone,

                transaction.transactionId,

                transaction.referenceId,

                transaction.paymentMethod,

                transaction.description,

                transaction.type,

                transaction.transactionType,

                transaction.status,

                transaction.id

            ]
            .map(value =>
                String(value || "")
                    .toLowerCase()
            )
            .join(" ");


            return searchableText.includes(search);

        }
    );

}


/* =========================================================
   RENDER FILTERED TRANSACTIONS
========================================================= */

function renderFilteredTransactions() {

    const filtered =
        getFilteredTransactions();

    renderTransactions(
        filtered
    );

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions(list) {

    if (!transactionsContainer) {
        return;
    }


    /*
     * CLEAR
     */

    transactionsContainer.innerHTML = "";


    /*
     * COUNTERS
     */

    let approved = 0;
    let pending = 0;
    let rejected = 0;


    allTransactionData.forEach(
        (transaction) => {

            const status =
                normalizeTransactionStatus(
                    transaction.status
                );

            if (status === "approved") {
                approved++;
            }

            if (status === "pending") {
                pending++;
            }

            if (status === "rejected") {
                rejected++;
            }

        }
    );


    /*
     * UPDATE SUMMARY
     */

    if (transactionTotal) {

        transactionTotal.textContent =
            allTransactionData.length;

    }

    if (transactionApproved) {

        transactionApproved.textContent =
            approved;

    }

    if (transactionPending) {

        transactionPending.textContent =
            pending;

    }

    if (transactionRejected) {

        transactionRejected.textContent =
            rejected;

    }


    /*
     * EMPTY RESULT
     */

    if (!list.length) {

        transactionsContainer.innerHTML = `

            <div class="request-card">

                <h3>
                    <i class="fa-solid fa-receipt"></i>
                    No Transactions Found
                </h3>

                <p>
                    There are no transactions matching your search or filter.
                </p>

            </div>

        `;

        return;
    }


    /*
     * TRANSACTION CARDS
     */

    list.forEach(
        (transaction) => {

            const type =
                normalizeTransactionType(
                    transaction
                );

            const status =
                transactionStatusLabel(
                    transaction.status
                );

            const statusClass =
                transactionStatusClass(
                    transaction.status
                );

            const amount =
                Number(
                    transaction.amount || 0
                );

            const email =
                transaction.email ||
                "-";

            const uid =
                transaction.uid ||
                "-";

            const transactionId =
                transaction.transactionId ||
                transaction.id ||
                "-";

            const referenceId =
                transaction.referenceId ||
                "-";

            const paymentMethod =
                transaction.paymentMethod ||
                "-";

            const description =
                transaction.description ||
                `${type} transaction`;

            const createdAt =
                transaction.createdAt ||
                transaction.timestamp ||
                transaction.approvedAt ||
                transaction.rejectedAt ||
                0;


            /*
             * SAFE VALUES
             */

            const safeType =
                escapeHTML(type);

            const safeEmail =
                escapeHTML(email);

            const safeUid =
                escapeHTML(uid);

            const safeTransactionId =
                escapeHTML(transactionId);

            const safeReferenceId =
                escapeHTML(referenceId);

            const safePaymentMethod =
                escapeHTML(paymentMethod);

            const safeDescription =
                escapeHTML(description);

            const safeStatus =
                escapeHTML(status);


            /*
             * CARD
             */

            transactionsContainer.innerHTML += `

                <div
                    class="request-card transaction-card"
                    data-transaction-id="${escapeHTML(transaction.id || "")}"
                >

                    <div class="request-card-header">

                        <div class="request-title">

                            <span class="transaction-icon">

                                ${transactionIcon(type)}

                            </span>

                            <h3>
                                ${safeType}
                            </h3>

                        </div>

                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${safeStatus}
                        </span>

                    </div>


                    <div class="request-card-body">

                        <div class="request-info">

                            <p>
                                <strong>
                                    Amount:
                                </strong>

                                ${formatTransactionMoney(amount)}

                            </p>


                            <p>
                                <strong>
                                    Email:
                                </strong>

                                ${safeEmail}

                            </p>


                            <p>
                                <strong>
                                    User UID:
                                </strong>

                                <span
                                    class="transaction-uid"
                                >
                                    ${safeUid}
                                </span>

                            </p>


                            <p>
                                <strong>
                                    Transaction ID:
                                </strong>

                                <span
                                    class="transaction-id"
                                >
                                    ${safeTransactionId}
                                </span>

                            </p>


                            <p>
                                <strong>
                                    Reference:
                                </strong>

                                ${safeReferenceId}

                            </p>


                            <p>
                                <strong>
                                    Payment Method:
                                </strong>

                                ${safePaymentMethod}

                            </p>


                            <p>
                                <strong>
                                    Description:
                                </strong>

                                ${safeDescription}

                            </p>


                            <p>
                                <strong>
                                    Date:
                                </strong>

                                ${formatTransactionDate(
                                    createdAt
                                )}

                            </p>

                        </div>

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   SEARCH EVENT
========================================================= */

if (transactionSearch) {

    transactionSearch.addEventListener(
        "input",
        () => {

            renderFilteredTransactions();

        }
    );

}


/* =========================================================
   FILTER EVENT
========================================================= */

if (transactionFilter) {

    transactionFilter.addEventListener(
        "change",
        () => {

            renderFilteredTransactions();

        }
    );

}


/* =========================================================
   REFRESH TRANSACTIONS
========================================================= */

function refreshTransactions() {

    renderFilteredTransactions();

}


/* =========================================================
   START PART 5
========================================================= */

let part5Started = false;

function startAdminPart5() {

    if (part5Started) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    part5Started = true;

    initializeTransactionsListener();

    console.log(
        "✅ Money Vault Admin Part 5 Loaded"
    );

}


/* =========================================================
   WAIT FOR ADMIN AUTH
========================================================= */

if (currentAdmin) {

    startAdminPart5();

} else {

    const part5Interval =
        setInterval(
            () => {

                if (currentAdmin) {

                    clearInterval(
                        part5Interval
                    );

                    startAdminPart5();

                }

            },
            300
        );

}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.refreshTransactions =
    refreshTransactions;

window.renderFilteredTransactions =
    renderFilteredTransactions;

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 6
   SETTINGS MANAGEMENT
   CURRENCY: RWF / FRW

   FEATURES:
   - Admin information
   - System controls
   - Registration ON/OFF
   - Deposit ON/OFF
   - Withdraw ON/OFF
   - Change admin password
   - Database backup
   - Refresh data
   - Safe local settings
   - Does NOT change admins/{uid} = true
========================================================= */


/* =========================================================
   PART 6 STATE
========================================================= */

let part6Started = false;


/* =========================================================
   SETTINGS ELEMENTS
========================================================= */

const adminFullName =
    document.getElementById("adminFullName");

const adminEmail =
    document.getElementById("adminEmail");

const saveAdminBtn =
    document.getElementById("saveAdminBtn");

const allowRegistration =
    document.getElementById("allowRegistration");

const allowDeposit =
    document.getElementById("allowDeposit");

const allowWithdraw =
    document.getElementById("allowWithdraw");

const saveSystemBtn =
    document.getElementById("saveSystemBtn");

const newAdminPassword =
    document.getElementById("newAdminPassword");

const confirmAdminPassword =
    document.getElementById("confirmAdminPassword");

const changePasswordBtn =
    document.getElementById("changePasswordBtn");

const backupDatabaseBtn =
    document.getElementById("backupDatabaseBtn");

const refreshDatabaseBtn =
    document.getElementById("refreshDatabaseBtn");

const appVersion =
    document.getElementById("appVersion");

const firebaseStatus =
    document.getElementById("firebaseStatus");

const databaseStatus =
    document.getElementById("databaseStatus");

const storageStatus =
    document.getElementById("storageStatus");


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SYSTEM_SETTINGS = {

    allowRegistration: true,

    allowDeposit: true,

    allowWithdraw: true

};


/* =========================================================
   SETTINGS STORAGE KEY
========================================================= */

const SYSTEM_SETTINGS_KEY =
    "moneyVaultSystemSettings";


const ADMIN_SETTINGS_KEY =
    "moneyVaultAdminSettings";


/* =========================================================
   SAFE JSON PARSER
========================================================= */

function safeParseJSON(value, fallback) {

    try {

        if (!value) {
            return fallback;
        }

        const parsed =
            JSON.parse(value);

        return parsed || fallback;

    } catch (error) {

        console.warn(
            "Settings JSON parse error:",
            error
        );

        return fallback;

    }

}


/* =========================================================
   LOAD SYSTEM SETTINGS
========================================================= */

function loadSystemSettings() {

    const saved =
        safeParseJSON(
            localStorage.getItem(
                SYSTEM_SETTINGS_KEY
            ),
            DEFAULT_SYSTEM_SETTINGS
        );


    if (allowRegistration) {

        allowRegistration.checked =
            saved.allowRegistration !== false;

    }


    if (allowDeposit) {

        allowDeposit.checked =
            saved.allowDeposit !== false;

    }


    if (allowWithdraw) {

        allowWithdraw.checked =
            saved.allowWithdraw !== false;

    }

}


/* =========================================================
   LOAD ADMIN SETTINGS
========================================================= */

function loadAdminSettings() {

    const saved =
        safeParseJSON(
            localStorage.getItem(
                ADMIN_SETTINGS_KEY
            ),
            {}
        );


    /*
     * Admin name
     */

    if (adminFullName) {

        adminFullName.value =
            saved.name ||
            currentAdmin?.displayName ||
            "Administrator";

    }


    /*
     * Admin email
     */

    if (adminEmail) {

        adminEmail.value =
            saved.email ||
            currentAdmin?.email ||
            "";

    }

}


/* =========================================================
   SAVE ADMIN INFORMATION
========================================================= */

function saveAdminInformation() {

    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const name =
        String(
            adminFullName?.value || ""
        ).trim();

    const email =
        String(
            adminEmail?.value || ""
        ).trim();


    if (!name) {

        alert(
            "Please enter administrator name."
        );

        return;

    }


    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        alert(
            "Please enter a valid email."
        );

        return;

    }


    /*
     * IMPORTANT:
     * We do NOT change admins/{uid}.
     *
     * admins/{uid} must remain:
     *
     * admins
     *   UID
     *     true
     *
     * because Part 1 uses it for admin verification.
     */

    localStorage.setItem(
        ADMIN_SETTINGS_KEY,
        JSON.stringify({

            name: name,

            email: email,

            updatedAt: Date.now()

        })
    );


    /*
     * Update visible admin name immediately
     */

    if (adminName) {

        adminName.textContent =
            name;

    }


    alert(
        "Admin information saved successfully."
    );

}


/* =========================================================
   SAVE SYSTEM SETTINGS
========================================================= */

function saveSystemSettings() {

    const settings = {

        allowRegistration:
            allowRegistration
                ? allowRegistration.checked
                : true,

        allowDeposit:
            allowDeposit
                ? allowDeposit.checked
                : true,

        allowWithdraw:
            allowWithdraw
                ? allowWithdraw.checked
                : true,

        updatedAt:
            Date.now()

    };


    localStorage.setItem(
        SYSTEM_SETTINGS_KEY,
        JSON.stringify(settings)
    );


    alert(
        "System settings saved successfully."
    );


    console.log(
        "System settings:",
        settings
    );

}


/* =========================================================
   CHANGE ADMIN PASSWORD
========================================================= */

async function changeAdminPassword() {

    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const password =
        String(
            newAdminPassword?.value || ""
        );

    const confirmPassword =
        String(
            confirmAdminPassword?.value || ""
        );


    if (!password) {

        alert(
            "Please enter a new password."
        );

        return;

    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;

    }


    if (password !== confirmPassword) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to change the administrator password?"
        );


    if (!confirmed) {
        return;
    }


    try {

        if (changePasswordBtn) {

            changePasswordBtn.disabled = true;

            changePasswordBtn.textContent =
                "Changing...";

        }


        /*
         * updatePassword must be imported in Part 1.
         *
         * If your Part 1 currently has:
         *
         * import {
         *   onAuthStateChanged,
         *   signOut
         * } ...
         *
         * change it to:
         *
         * import {
         *   onAuthStateChanged,
         *   signOut,
         *   updatePassword
         * } ...
         */


        if (
            typeof updatePassword !== "function"
        ) {

            throw new Error(
                "updatePassword is not imported in Part 1."
            );

        }


        await updatePassword(
            currentAdmin,
            password
        );


        if (newAdminPassword) {
            newAdminPassword.value = "";
        }

        if (confirmAdminPassword) {
            confirmAdminPassword.value = "";
        }


        alert(
            "Administrator password changed successfully."
        );


    } catch (error) {

        console.error(
            "Password change error:",
            error
        );


        if (
            error.code ===
            "auth/requires-recent-login"
        ) {

            alert(
                "For security, please logout and login again, then change the password."
            );

        } else {

            alert(
                error.message ||
                "Unable to change password."
            );

        }

    } finally {

        if (changePasswordBtn) {

            changePasswordBtn.disabled =
                false;

            changePasswordBtn.textContent =
                "Change Password";

        }

    }

}


/* =========================================================
   GET DATABASE BACKUP
========================================================= */

async function createDatabaseBackup() {

    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const confirmed =
        confirm(
            "Create a backup of the Money Vault database data?"
        );


    if (!confirmed) {
        return;
    }


    try {

        if (backupDatabaseBtn) {

            backupDatabaseBtn.disabled = true;

            backupDatabaseBtn.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i> Creating Backup...`;

        }


        /*
         * We read the main database sections separately.
         *
         * This is intentional because root-level ".read"
         * is disabled in the Firebase Rules.
         */

        const backupPaths = [

            "users",

            "depositRequests",

            "withdrawRequests",

            "vipPlans",

            "vipPurchaseRequests",

            "vipBuyers",

            "transactions",

            "referralCodes",

            "notifications",

            "announcements",

            "transactionIds",

            "bonusRequests",

            "vipReferralBonuses",

            "adminLogs"

        ];


        const backup = {

            application:
                "Money Vault",

            currency:
                "RWF / FRW",

            exportedAt:
                new Date().toISOString(),

            exportedBy:
                currentAdmin.uid,

            data: {}

        };


        for (
            const path of backupPaths
        ) {

            try {

                const snapshot =
                    await get(
                        ref(db, path)
                    );


                backup.data[path] =
                    snapshot.exists()
                        ? snapshot.val()
                        : {};

            } catch (pathError) {

                console.warn(
                    "Backup skipped:",
                    path,
                    pathError
                );


                backup.data[path] = {

                    _backupError:
                        pathError.message ||
                        "Unable to read this path."

                };

            }

        }


        /*
         * Convert backup to JSON
         */

        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement("a");


        const date =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );


        link.href = url;

        link.download =
            `money-vault-backup-${date}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            "Database backup created successfully."
        );


    } catch (error) {

        console.error(
            "Backup error:",
            error
        );


        alert(
            error.message ||
            "Unable to create database backup."
        );

    } finally {

        if (backupDatabaseBtn) {

            backupDatabaseBtn.disabled =
                false;

            backupDatabaseBtn.innerHTML =
                `<i class="fa-solid fa-download"></i> Backup Database`;

        }

    }

}


/* =========================================================
   REFRESH ADMIN DATA
========================================================= */

function refreshAdminData() {

    try {

        /*
         * Refresh current page renderers
         */

        if (
            typeof renderFilteredTransactions ===
            "function"
        ) {

            renderFilteredTransactions();

        }


        if (
            typeof renderUsers ===
            "function" &&
            typeof allUsersData !==
            "undefined"
        ) {

            renderUsers(
                allUsersData
            );

        }


        if (
            typeof renderDeposits ===
            "function"
        ) {

            try {
                renderDeposits();
            } catch (error) {
                console.warn(
                    "Deposit refresh skipped:",
                    error
                );
            }

        }


        if (
            typeof renderWithdraws ===
            "function"
        ) {

            try {
                renderWithdraws();
            } catch (error) {
                console.warn(
                    "Withdraw refresh skipped:",
                    error
                );
            }

        }


        /*
         * Reload settings from local storage
         */

        loadSystemSettings();

        loadAdminSettings();


        alert(
            "Admin data refreshed."
        );


    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );

        alert(
            "Refresh completed with some warnings."
        );

    }

}


/* =========================================================
   SYSTEM STATUS
========================================================= */

function updateSystemStatus() {

    /*
     * APP VERSION
     */

    if (appVersion) {

        appVersion.textContent =
            "v1.0.0";

    }


    /*
     * FIREBASE
     */

    if (firebaseStatus) {

        firebaseStatus.textContent =
            auth && db
                ? "Connected"
                : "Unavailable";

    }


    /*
     * DATABASE
     */

    if (databaseStatus) {

        databaseStatus.textContent =
            db
                ? "Realtime Database"
                : "Unavailable";

    }


    /*
     * STORAGE
     *
     * We do not use Storage for deposits in the
     * current Money Vault architecture.
     */

    if (storageStatus) {

        storageStatus.textContent =
            "Available";

    }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (saveAdminBtn) {

    saveAdminBtn.addEventListener(
        "click",
        saveAdminInformation
    );

}


if (saveSystemBtn) {

    saveSystemBtn.addEventListener(
        "click",
        saveSystemSettings
    );

}


if (changePasswordBtn) {

    changePasswordBtn.addEventListener(
        "click",
        changeAdminPassword
    );

}


if (backupDatabaseBtn) {

    backupDatabaseBtn.addEventListener(
        "click",
        createDatabaseBackup
    );

}


if (refreshDatabaseBtn) {

    refreshDatabaseBtn.addEventListener(
        "click",
        refreshAdminData
    );

}


/* =========================================================
   START PART 6
========================================================= */

function startAdminPart6() {

    if (part6Started) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    part6Started = true;


    loadSystemSettings();

    loadAdminSettings();

    updateSystemStatus();


    /*
     * Update visible admin name
     */

    const savedAdmin =
        safeParseJSON(
            localStorage.getItem(
                ADMIN_SETTINGS_KEY
            ),
            {}
        );


    if (
        adminName &&
        savedAdmin.name
    ) {

        adminName.textContent =
            savedAdmin.name;

    }


    console.log(
        "✅ Money Vault Admin Part 6 Loaded"
    );

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

if (currentAdmin) {

    startAdminPart6();

} else {

    const part6Interval =
        setInterval(
            () => {

                if (currentAdmin) {

                    clearInterval(
                        part6Interval
                    );

                    startAdminPart6();

                }

            },
            300
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.saveAdminInformation =
    saveAdminInformation;

window.saveSystemSettings =
    saveSystemSettings;

window.changeAdminPassword =
    changeAdminPassword;

window.createDatabaseBackup =
    createDatabaseBackup;

window.refreshAdminData =
    refreshAdminData;

   
