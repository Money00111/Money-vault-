// ======================================
// ADMIN.JS - PART 1
// FIREBASE + ADMIN AUTHENTICATION
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


// ======================================
// ADMIN STATE
// ======================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise = new Promise(resolve => {
    resolveAdminReady = resolve;
});


// ======================================
// GLOBAL ADMIN STATE
// Parts zindi zishobora kuyikoresha
// ======================================

window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    readyPromise: adminReadyPromise
};


// ======================================
// DOM ELEMENTS
// ======================================

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


// ======================================
// WAIT FOR ADMIN
// Parts zindi zishobora gukoresha:
// await window.waitForAdmin();
// ======================================

window.waitForAdmin = function () {
    return adminReadyPromise;
};


// ======================================
// SHOW / HIDE LOADING SCREEN
// ======================================

function hideLoadingScreen() {

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }
}

function showLoadingScreen() {

    if (loadingScreen) {
        loadingScreen.style.display = "flex";
    }
}


// ======================================
// ADMIN AUTHENTICATION
// ======================================

onAuthStateChanged(auth, async user => {

    try {

        // ----------------------------------
        // Nta muntu winjiye
        // ----------------------------------

        if (!user) {

            console.log(
                "No authenticated user."
            );

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Authenticated user:",
            user.email
        );


        // ----------------------------------
        // Reba niba ari Admin
        // ----------------------------------

        const adminRef =
            ref(
                db,
                "admins/" + user.uid
            );

        const adminSnap =
            await get(adminRef);


        // ----------------------------------
        // Si Admin
        // ----------------------------------

        if (!adminSnap.exists()) {

            console.warn(
                "Access denied. User is not an admin."
            );

            alert(
                "Access denied. Admin only."
            );

            try {
                await signOut(auth);
            }
            catch (logoutError) {

                console.error(
                    "Sign out error:",
                    logoutError
                );
            }

            window.location.href =
                "login.html";

            return;
        }


        // ==================================
        // ADMIN YEMEJWE
        // ==================================

        currentAdmin = user;
        adminReady = true;


        // ----------------------------------
        // Admin data
        // ----------------------------------

        const adminData =
            adminSnap.val() || {};


        // ----------------------------------
        // Admin name
        // ----------------------------------

        if (adminName) {

            adminName.textContent =
                adminData.name ||
                user.displayName ||
                "Administrator";
        }


        // ----------------------------------
        // Admin email
        // ----------------------------------

        if (adminEmail) {

            adminEmail.textContent =
                user.email || "";
        }


        // ----------------------------------
        // Hide loading
        // ----------------------------------

        hideLoadingScreen();


        // ----------------------------------
        // Resolve admin ready
        // ----------------------------------

        resolveAdminReady();


        console.log(
            "================================"
        );

        console.log(
            "ADMIN AUTH READY"
        );

        console.log(
            "Admin:",
            user.email
        );

        console.log(
            "UID:",
            user.uid
        );

        console.log(
            "================================"
        );


        // ==================================
        // START OTHER ADMIN PARTS
        // ==================================
        //
        // Aha niho Parts zikurikira
        // zizatangirira.
        //
        // Ntituzashyiramo code ya Deposit
        // cyangwa Withdraw hano.
        //
        // Buri function izajya yiyandikisha
        // kuri window muri Part yayo.
        // ==================================


        if (typeof window.loadDashboard === "function") {
            window.loadDashboard();
        }

        if (typeof window.loadDeposits === "function") {
            window.loadDeposits();
        }

        if (typeof window.loadWithdraws === "function") {
            window.loadWithdraws();
        }

        if (typeof window.loadVipRequests === "function") {
            window.loadVipRequests();
        }

        if (typeof window.loadVipBuyers === "function") {
            window.loadVipBuyers();
        }

        if (typeof window.loadUsers === "function") {
            window.loadUsers();
        }

        if (typeof window.loadTransactions === "function") {
            window.loadTransactions();
        }

    }
    catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );


        // Admin ntashoboye kwemezwa
        adminReady = false;


        alert(
            "Admin authentication failed: " +
            error.message
        );
    }

});


// ======================================
// LOGOUT
// ======================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                logoutBtn.disabled = true;

                await signOut(auth);

                window.location.href =
                    "login.html";

            }
            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                logoutBtn.disabled = false;

                alert(
                    "Logout failed: " +
                    error.message
                );
            }
        }
    );
}


// ======================================
// MOBILE SIDEBAR
// ======================================

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            if (sidebar) {
                sidebar.classList.toggle(
                    "active"
                );
            }

        }
    );
}


// ======================================
// SIDEBAR MENU
// ======================================

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const page =
                link.dataset.page;

            if (!page) {
                return;
            }

            openPage(page);

        }
    );

});


// ======================================
// OPEN ADMIN PAGE
// ======================================

function openPage(page) {

    if (!page) {
        return;
    }


    // ----------------------------------
    // Hide all sections
    // ----------------------------------

    sections.forEach(section => {

        section.classList.remove(
            "active"
        );

    });


    // ----------------------------------
    // Remove active menu
    // ----------------------------------

    menuLinks.forEach(link => {

        link.classList.remove(
            "active"
        );

    });


    // ----------------------------------
    // Find requested section
    // ----------------------------------

    const target =
        document.getElementById(
            page + "Section"
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }
    else {

        console.warn(
            "Admin section not found:",
            page + "Section"
        );

    }


    // ----------------------------------
    // Active menu link
    // ----------------------------------

    const activeLink =
        document.querySelector(
            `[data-page="${page}"]`
        );


    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    // ----------------------------------
    // Page title
    // ----------------------------------

    if (pageTitle) {

        const formattedTitle =
            page.charAt(0).toUpperCase() +
            page.slice(1);

        pageTitle.textContent =
            formattedTitle;

    }


    // ----------------------------------
    // Close mobile sidebar
    // ----------------------------------

    if (sidebar) {

        sidebar.classList.remove(
            "active"
        );

    }

}


// ======================================
// MAKE openPage GLOBAL
// ======================================

window.openPage = openPage;


// ======================================
// INITIAL LOG
// ======================================

console.log(
    "ADMIN.JS PART 1 READY"
);

// ======================================
// ADMIN.JS - PART 2
// HELPERS + DASHBOARD
// ======================================


// ======================================
// FORMAT MONEY
// Money Vault ikoresha RWF
// ======================================

function formatMoney(amount) {

    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return "0 RWF";
    }

    return value.toLocaleString("en-US") + " RWF";
}


// ======================================
// UPDATE TEXT
// ======================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "";
}


// ======================================
// ESCAPE HTML
// Birinda HTML injection muri Admin Panel
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================
// SAFE NUMBER
// ======================================

function numberValue(...values) {

    for (const value of values) {

        const number =
            Number(value);

        if (
            Number.isFinite(number) &&
            number > 0
        ) {
            return number;
        }
    }

    return 0;
}


// ======================================
// GET STATUS
// ======================================

function normalizeStatus(status) {

    return String(
        status || "pending"
    )
        .trim()
        .toLowerCase();
}


// ======================================
// DASHBOARD
// ======================================

function loadDashboard() {

    // ----------------------------------
    // Admin agomba kuba yemejwe
    // ----------------------------------

    if (!window.adminState?.ready) {

        console.log(
            "Dashboard waiting for Admin Auth..."
        );

        return;
    }


    console.log(
        "Loading Admin Dashboard..."
    );


    // ==================================
    // USERS + SYSTEM BALANCE
    // ==================================

    onValue(
        ref(db, "users"),
        snapshot => {

            let totalUsers = 0;
            let systemBalance = 0;


            if (snapshot.exists()) {

                const users =
                    snapshot.val() || {};


                Object.entries(users)
                    .forEach(
                        ([uid, user]) => {

                            if (!user) {
                                return;
                            }

                            totalUsers++;


                            systemBalance +=
                                Number(
                                    user.balance || 0
                                );
                        }
                    );
            }


            // ----------------------------------
            // Dashboard statistics
            // ----------------------------------

            updateText(
                "totalUsers",
                totalUsers
            );

            updateText(
                "systemBalance",
                formatMoney(systemBalance)
            );

        },
        error => {

            console.error(
                "Users dashboard error:",
                error
            );

        }
    );


    // ==================================
    // DEPOSIT STATISTICS
    // ==================================

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (snapshot.exists()) {

                Object.values(
                    snapshot.val() || {}
                )
                .forEach(item => {

                    if (!item) {
                        return;
                    }


                    total++;


                    const status =
                        normalizeStatus(
                            item.status
                        );


                    if (status === "pending") {

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

                });
            }


            // ----------------------------------
            // Dashboard
            // ----------------------------------

            updateText(
                "dashboardTotalDeposits",
                total
            );

            updateText(
                "dashboardPendingDeposits",
                pending
            );

            updateText(
                "dashboardApprovedDeposits",
                approved
            );


            // ----------------------------------
            // Deposit page counters
            // ----------------------------------

            updateText(
                "depositTotalCount",
                total
            );

            updateText(
                "depositPendingCount",
                pending
            );

            updateText(
                "depositApprovedCount",
                approved
            );

            updateText(
                "depositRejectedCount",
                rejected
            );

        },
        error => {

            console.error(
                "Deposit dashboard error:",
                error
            );

        }
    );


    // ==================================
    // WITHDRAW STATISTICS
    // ==================================

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (snapshot.exists()) {

                Object.values(
                    snapshot.val() || {}
                )
                .forEach(item => {

                    if (!item) {
                        return;
                    }


                    total++;


                    const status =
                        normalizeStatus(
                            item.status
                        );


                    if (status === "pending") {

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

                });
            }


            // ----------------------------------
            // Dashboard
            // ----------------------------------

            updateText(
                "dashboardTotalWithdraws",
                total
            );


            // ----------------------------------
            // Withdraw page counters
            // ----------------------------------

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

        },
        error => {

            console.error(
                "Withdraw dashboard error:",
                error
            );

        }
    );


    // ==================================
    // RECENT TRANSACTIONS
    // ==================================

    const activity =
        document.getElementById(
            "recentActivity"
        );


    if (!activity) {

        console.warn(
            "recentActivity element not found."
        );

        return;
    }


    onValue(
        ref(db, "transactions"),
        snapshot => {

            activity.innerHTML = "";


            // ----------------------------------
            // No transactions
            // ----------------------------------

            if (!snapshot.exists()) {

                activity.innerHTML = `
                    <div class="empty-state">
                        <h3>No Recent Activity</h3>
                        <p>No transactions available.</p>
                    </div>
                `;

                return;
            }


            // ----------------------------------
            // Get transactions
            // ----------------------------------

            const transactions =
                Object.entries(
                    snapshot.val() || {}
                );


            // ----------------------------------
            // Sort newest first
            // ----------------------------------

            transactions.sort(
                ([, a], [, b]) => {

                    return Number(
                        b?.createdAt || 0
                    ) -
                    Number(
                        a?.createdAt || 0
                    );
                }
            );


            // ----------------------------------
            // Show last 10
            // ----------------------------------

            transactions
                .slice(0, 10)
                .forEach(
                    ([id, item]) => {

                        const transaction =
                            item || {};


                        const type =
                            String(
                                transaction.type ||
                                "transaction"
                            )
                            .trim()
                            .toUpperCase();


                        const status =
                            String(
                                transaction.status ||
                                "-"
                            );


                        const amount =
                            numberValue(
                                transaction.amount
                            );


                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            "activity-item";


                        div.innerHTML = `
                            <p>
                                <strong>
                                    ${escapeHTML(type)}
                                </strong>
                                -
                                ${formatMoney(amount)}
                            </p>

                            <span>
                                ${escapeHTML(status)}
                            </span>
                        `;


                        activity.appendChild(
                            div
                        );

                    }
                );

        },
        error => {

            console.error(
                "Transactions dashboard error:",
                error
            );

            activity.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load activity</h3>
                </div>
            `;

        }
    );

}


// ======================================
// MAKE DASHBOARD GLOBAL
// Part 1 izayibona nyuma ya Admin Auth
// ======================================

window.loadDashboard =
    loadDashboard;


// ======================================
// MAKE HELPERS GLOBAL
// Parts zikurikira zishobora kuzifashisha
// ======================================

window.formatMoney =
    formatMoney;

window.updateText =
    updateText;

window.escapeHTML =
    escapeHTML;

window.numberValue =
    numberValue;

window.normalizeStatus =
    normalizeStatus;


// ======================================
// READY
// ======================================

console.log(
    "ADMIN.JS PART 2 READY"
);

// ======================================
// ADMIN.JS - PART 3
// DEPOSIT MANAGEMENT
// LOAD + DISPLAY DEPOSIT REQUESTS
// ======================================


// ======================================
// LOAD DEPOSITS
// ======================================

function loadDeposits() {

    // ----------------------------------
    // Admin agomba kuba yemejwe
    // ----------------------------------

    if (!window.adminState?.ready) {

        console.log(
            "Deposits waiting for Admin Auth..."
        );

        return;
    }


    // ----------------------------------
    // Deposit list
    // ----------------------------------

    const list =
        document.getElementById(
            "depositList"
        );


    const empty =
        document.getElementById(
            "emptyDeposit"
        );


    if (!list) {

        console.warn(
            "depositList element not found."
        );

        return;
    }


    // ==================================
    // READ DEPOSIT REQUESTS
    // ==================================

    onValue(
        ref(db, "depositRequests"),
        async snapshot => {

            list.innerHTML = "";


            // ----------------------------------
            // No deposits
            // ----------------------------------

            if (!snapshot.exists()) {

                if (empty) {
                    empty.style.display = "block";
                }

                list.innerHTML = `
                    <div class="empty-state">
                        <h3>No Deposit Requests</h3>
                        <p>There are no deposit requests yet.</p>
                    </div>
                `;

                return;
            }


            // ----------------------------------
            // Hide empty message
            // ----------------------------------

            if (empty) {
                empty.style.display = "none";
            }


            // ==================================
            // GET ENTRIES
            // ==================================

            const entries =
                Object.entries(
                    snapshot.val() || {}
                );


            // ==================================
            // NEWEST FIRST
            // ==================================

            entries.sort(
                ([, a], [, b]) => {

                    return Number(
                        b?.createdAt || 0
                    )
                    -
                    Number(
                        a?.createdAt || 0
                    );

                }
            );


            // ==================================
            // LOAD EACH DEPOSIT
            // ==================================

            for (const [id, deposit] of entries) {

                const item =
                    deposit || {};


                // ----------------------------------
                // USER INFORMATION
                // ----------------------------------

                let user = {};


                if (item.uid) {

                    try {

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" +
                                    item.uid
                                )
                            );


                        if (userSnap.exists()) {

                            user =
                                userSnap.val() || {};

                        }

                    }
                    catch (error) {

                        console.error(
                            "Error loading deposit user:",
                            error
                        );

                    }

                }


                // ==================================
                // NORMALIZE DATA
                // ==================================

                const status =
                    normalizeStatus(
                        item.status
                    );


                const name =
                    item.fullName ||
                    item.name ||
                    user.fullName ||
                    user.name ||
                    user.username ||
                    "-";


                const email =
                    item.email ||
                    user.email ||
                    "-";


                const phone =
                    item.senderPhone ||
                    item.phone ||
                    item.phoneNumber ||
                    user.phone ||
                    user.phoneNumber ||
                    "-";


                const amount =
                    Number(
                        item.amount || 0
                    );


                const paymentMethod =
                    item.paymentMethod ||
                    item.method ||
                    "-";


                const transactionId =
                    item.transactionId ||
                    item.transactionID ||
                    item.reference ||
                    "-";


                const paymentDate =
                    item.paymentDate ||
                    item.date ||
                    "-";


                const createdAt =
                    item.createdAt ||
                    item.requestDate ||
                    item.timestamp ||
                    "-";


                const note =
                    item.note ||
                    "-";


                // ==================================
                // CREATE CARD
                // ==================================

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.dataset.requestId =
                    id;


                // ==================================
                // CARD HTML
                // ==================================

                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            <i class="fa-solid fa-money-bill-transfer"></i>
                            Deposit Request
                        </h3>

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <!-- USER INFORMATION -->

                    <div class="user-profile-box">

                        <h4>
                            <i class="fa-solid fa-user"></i>
                            User Information
                        </h4>

                        <p>
                            <strong>Name:</strong>
                            ${escapeHTML(name)}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(phone)}
                        </p>

                        <p>
                            <strong>User ID:</strong>
                            ${escapeHTML(
                                item.uid || "-"
                            )}
                        </p>

                    </div>


                    <!-- DEPOSIT INFORMATION -->

                    <div class="deposit-info">

                        <p>
                            <strong>
                                <i class="fa-solid fa-money-bill"></i>
                                Amount:
                            </strong>

                            <span class="deposit-amount">
                                ${formatMoney(amount)}
                            </span>
                        </p>


                        <p>
                            <strong>
                                <i class="fa-solid fa-mobile-screen"></i>
                                Payment Method:
                            </strong>

                            ${escapeHTML(
                                paymentMethod
                            )}
                        </p>


                        <p>
                            <strong>
                                <i class="fa-solid fa-phone"></i>
                                Sender Phone:
                            </strong>

                            ${escapeHTML(phone)}
                        </p>


                        <p>
                            <strong>
                                <i class="fa-solid fa-hashtag"></i>
                                Transaction ID:
                            </strong>

                            <span class="transaction-id">
                                ${escapeHTML(
                                    transactionId
                                )}
                            </span>

                        </p>


                        <p>
                            <strong>
                                <i class="fa-solid fa-calendar"></i>
                                Payment Date:
                            </strong>

                            ${escapeHTML(
                                paymentDate
                            )}
                        </p>


                        <p>
                            <strong>
                                <i class="fa-solid fa-clock"></i>
                                Request Date:
                            </strong>

                            ${escapeHTML(
                                createdAt
                            )}
                        </p>


                        <p>
                            <strong>
                                <i class="fa-solid fa-note-sticky"></i>
                                Note:
                            </strong>

                            ${escapeHTML(note)}
                        </p>

                    </div>


                    <!-- PROOF -->

                    ${
                        item.proofImage
                        ?
                        `
                        <div class="proof-section">

                            <h4>
                                <i class="fa-solid fa-image"></i>
                                Payment Proof
                            </h4>

                            <img
                                src="${escapeHTML(
                                    item.proofImage
                                )}"
                                alt="Payment Proof"
                                class="payment-proof"
                                loading="lazy"
                            >

                        </div>
                        `
                        :
                        `
                        <div class="proof-section">

                            <p>
                                <i class="fa-solid fa-image"></i>
                                No payment proof provided.
                            </p>

                        </div>
                        `
                    }


                    <!-- ACTIONS -->

                    <div class="request-actions">

                        ${
                            status === "pending"
                            ?
                            `
                            <button
                                type="button"
                                class="approveBtn"
                                data-id="${escapeHTML(id)}"
                            >
                                <i class="fa-solid fa-check"></i>
                                Approve
                            </button>

                            <button
                                type="button"
                                class="rejectBtn"
                                data-id="${escapeHTML(id)}"
                            >
                                <i class="fa-solid fa-xmark"></i>
                                Reject
                            </button>
                            `
                            :
                            `
                            <div class="processed-message">

                                <i class="fa-solid fa-circle-check"></i>

                                Request already processed:
                                <strong>
                                    ${escapeHTML(status)}
                                </strong>

                            </div>
                            `
                        }

                    </div>

                `;


                // ==================================
                // ADD CARD TO LIST
                // ==================================

                list.appendChild(card);

            }


            // ==================================
            // ACTIVATE BUTTONS
            // ==================================
            //
            // Approve / Reject functions ziri
            // muri PART 4.
            //
            // Hano dukoresha functions niba
            // Part 4 yamaze kuba loaded.
            // ==================================

            if (
                typeof window.activateDepositButtons ===
                "function"
            ) {

                window.activateDepositButtons();

            }

        },
        error => {

            console.error(
                "Deposit requests loading error:",
                error
            );


            list.innerHTML = `
                <div class="empty-state">

                    <h3>
                        Unable to Load Deposits
                    </h3>

                    <p>
                        ${escapeHTML(
                            error?.message ||
                            "Unknown error"
                        )}
                    </p>

                </div>
            `;

        }
    );

}


// ======================================
// MAKE FUNCTION GLOBAL
// Part 1 izayihamagara
// ======================================

window.loadDeposits =
    loadDeposits;


// ======================================
// READY
// ======================================

console.log(
    "ADMIN.JS PART 3 READY"
);

// ======================================
// ADMIN.JS - PART 4
// DEPOSIT APPROVE + REJECT
// SAFE AGAINST DOUBLE APPROVAL
// ======================================


// ======================================
// APPROVE DEPOSIT
// ======================================

async function approveDeposit(id) {

    if (!window.adminState?.ready) {
        alert("Admin is not ready.");
        return;
    }

    if (!id) {
        alert("Invalid deposit request.");
        return;
    }


    try {

        const depositRef =
            ref(
                db,
                "depositRequests/" + id
            );


        // ==================================
        // STEP 1
        // CLAIM REQUEST ATOMICALLY
        // pending -> processing
        // ==================================

        const claimResult =
            await runTransaction(
                depositRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }

                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    // Already processed
                    if (
                        status !== "pending"
                    ) {
                        return;
                    }


                    return {
                        ...currentData,
                        status: "processing",
                        processingAt: Date.now(),
                        processingBy:
                            window.adminState
                                ?.currentAdmin
                                ?.uid || ""
                    };

                }
            );


        // ==================================
        // REQUEST NOT CLAIMED
        // ==================================

        if (!claimResult.committed) {

            const current =
                claimResult.snapshot.exists()
                    ? claimResult.snapshot.val()
                    : null;


            if (!current) {
                alert("Deposit request not found.");
                return;
            }


            const currentStatus =
                normalizeStatus(
                    current.status
                );


            if (
                currentStatus === "approved"
            ) {
                alert(
                    "This deposit has already been approved."
                );
            }
            else if (
                currentStatus === "processing"
            ) {
                alert(
                    "This deposit is already being processed."
                );
            }
            else if (
                currentStatus === "rejected"
            ) {
                alert(
                    "This deposit has already been rejected."
                );
            }
            else {
                alert(
                    "This deposit cannot be approved."
                );
            }

            return;
        }


        // ==================================
        // GET CLAIMED REQUEST
        // ==================================

        const deposit =
            claimResult.snapshot.val() || {};


        const uid =
            String(
                deposit.uid || ""
            ).trim();


        const amount =
            Number(
                deposit.amount || 0
            );


        // ==================================
        // VALIDATE UID
        // ==================================

        if (!uid) {

            await update(
                depositRef,
                {
                    status: "processing_error",
                    error: "Missing user UID",
                    errorAt: Date.now()
                }
            );

            alert(
                "Deposit has no user ID."
            );

            return;
        }


        // ==================================
        // VALIDATE AMOUNT
        // ==================================

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            await update(
                depositRef,
                {
                    status: "processing_error",
                    error: "Invalid deposit amount",
                    errorAt: Date.now()
                }
            );

            alert(
                "Invalid deposit amount."
            );

            return;
        }


        // ==================================
        // STEP 2
        // ATOMICALLY ADD MONEY TO BALANCE
        // ==================================

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const balanceResult =
            await runTransaction(
                userRef,
                currentUser => {

                    if (!currentUser) {
                        return;
                    }


                    const oldBalance =
                        Number(
                            currentUser.balance || 0
                        );


                    const oldDeposits =
                        Number(
                            currentUser.totalDeposits || 0
                        );


                    const oldTransactions =
                        Number(
                            currentUser.totalTransactions || 0
                        );


                    return {
                        ...currentUser,

                        balance:
                            oldBalance + amount,

                        totalDeposits:
                            oldDeposits + amount,

                        totalTransactions:
                            oldTransactions + 1
                    };

                }
            );


        // ==================================
        // USER NOT FOUND
        // ==================================

        if (!balanceResult.committed) {

            await update(
                depositRef,
                {
                    status: "processing_error",
                    error: "User account not found",
                    errorAt: Date.now()
                }
            );

            alert(
                "User account was not found."
            );

            return;
        }


        // ==================================
        // STEP 3
        // CREATE TRANSACTION RECORD
        // ==================================

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        await set(
            transactionRef,
            {
                uid: uid,

                type: "deposit",

                amount: amount,

                status: "approved",

                requestId: id,

                paymentMethod:
                    deposit.paymentMethod ||
                    "",

                transactionId:
                    deposit.transactionId ||
                    "",

                createdAt: Date.now(),

                approvedAt: Date.now(),

                approvedBy:
                    window.adminState
                        ?.currentAdmin
                        ?.uid || ""
            }
        );


        // ==================================
        // STEP 4
        // FINALIZE REQUEST
        // processing -> approved
        // ==================================

        await update(
            depositRef,
            {
                status: "approved",

                approvedAt: Date.now(),

                approvedBy:
                    window.adminState
                        ?.currentAdmin
                        ?.uid || "",

                transactionKey:
                    transactionRef.key
            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Deposit approved successfully.\n\n" +
            "Amount: " +
            formatMoney(amount)
        );


        console.log(
            "Deposit approved:",
            id,
            amount
        );

    }
    catch (error) {

        console.error(
            "Approve deposit error:",
            error
        );


        // ----------------------------------
        // IMPORTANT:
        // Ntidusubiza processing -> pending.
        // Kuko bishobora gutera double credit.
        // ----------------------------------

        try {

            await update(
                ref(
                    db,
                    "depositRequests/" + id
                ),
                {
                    status: "processing_error",

                    error:
                        error?.message ||
                        "Unknown processing error",

                    errorAt: Date.now(),

                    errorBy:
                        window.adminState
                            ?.currentAdmin
                            ?.uid || ""
                }
            );

        }
        catch (updateError) {

            console.error(
                "Could not save deposit error:",
                updateError
            );

        }


        alert(
            "Deposit approval failed:\n" +
            (error?.message || "Unknown error")
        );
    }
}


// ======================================
// REJECT DEPOSIT
// ======================================

async function rejectDeposit(id) {

    if (!window.adminState?.ready) {
        alert("Admin is not ready.");
        return;
    }


    if (!id) {
        alert("Invalid deposit request.");
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to reject this deposit?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const depositRef =
            ref(
                db,
                "depositRequests/" + id
            );


        // ==================================
        // ATOMIC REJECTION
        // pending -> rejected
        // ==================================

        const result =
            await runTransaction(
                depositRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    // Only pending can be rejected
                    if (
                        status !== "pending"
                    ) {
                        return;
                    }


                    return {
                        ...currentData,

                        status: "rejected",

                        rejectedAt: Date.now(),

                        rejectedBy:
                            window.adminState
                                ?.currentAdmin
                                ?.uid || ""
                    };

                }
            );


        // ==================================
        // NOT COMMITTED
        // ==================================

        if (!result.committed) {

            if (
                !result.snapshot.exists()
            ) {

                alert(
                    "Deposit request not found."
                );

                return;
            }


            const current =
                result.snapshot.val() || {};


            const status =
                normalizeStatus(
                    current.status
                );


            if (
                status === "approved"
            ) {

                alert(
                    "This deposit has already been approved."
                );

            }
            else if (
                status === "rejected"
            ) {

                alert(
                    "This deposit has already been rejected."
                );

            }
            else if (
                status === "processing"
            ) {

                alert(
                    "This deposit is currently being processed."
                );

            }
            else {

                alert(
                    "This deposit cannot be rejected."
                );
            }


            return;
        }


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Deposit rejected successfully."
        );


        console.log(
            "Deposit rejected:",
            id
        );

    }
    catch (error) {

        console.error(
            "Reject deposit error:",
            error
        );


        alert(
            "Reject failed:\n" +
            (error?.message || "Unknown error")
        );
    }
}


// ======================================
// ACTIVATE DEPOSIT BUTTONS
// Part 3 irayikoresha
// ======================================

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
    // APPROVE BUTTONS
    // ==================================

    approveButtons.forEach(button => {

        // Irinde event gusubirwamo
        if (
            button.dataset.listenerAttached ===
            "true"
        ) {
            return;
        }


        button.dataset.listenerAttached =
            "true";


        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;


                if (!id) {
                    alert(
                        "Deposit ID missing."
                    );
                    return;
                }


                // Prevent double click
                button.disabled = true;


                const originalHTML =
                    button.innerHTML;


                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Processing...
                `;


                try {

                    await approveDeposit(id);

                }
                finally {

                    // Part 3 will rebuild the card
                    // after Firebase update.
                    //
                    // Niba card ikiriho, turayisubiza.

                    if (
                        document.body.contains(
                            button
                        )
                    ) {

                        button.disabled =
                            false;

                        button.innerHTML =
                            originalHTML;
                    }

                }

            }
        );

    });


    // ==================================
    // REJECT BUTTONS
    // ==================================

    rejectButtons.forEach(button => {

        if (
            button.dataset.listenerAttached ===
            "true"
        ) {
            return;
        }


        button.dataset.listenerAttached =
            "true";


        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;


                if (!id) {
                    alert(
                        "Deposit ID missing."
                    );
                    return;
                }


                button.disabled = true;


                const originalHTML =
                    button.innerHTML;


                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Processing...
                `;


                try {

                    await rejectDeposit(id);

                }
                finally {

                    if (
                        document.body.contains(
                            button
                        )
                    ) {

                        button.disabled =
                            false;

                        button.innerHTML =
                            originalHTML;
                    }

                }

            }
        );

    });

}


// ======================================
// MAKE FUNCTIONS GLOBAL
// ======================================

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;

window.activateDepositButtons =
    activateDepositButtons;


// ======================================
// READY
// ======================================

console.log(
    "ADMIN.JS PART 4 READY"
);

// ======================================
// ADMIN.JS - PART 5
// WITHDRAW REQUESTS
// ======================================

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// LOAD WITHDRAW REQUESTS
// ======================================

async function loadWithdraws() {

    try {

        if (window.adminState?.ready) {
            await window.adminState.ready;
        }

        const withdrawList =
            document.getElementById("withdrawList");

        const emptyWithdraw =
            document.getElementById("emptyWithdraw");

        if (!withdrawList) {
            console.warn(
                "withdrawList element not found."
            );
            return;
        }


        onValue(
            ref(db, "withdrawRequests"),
            async (snapshot) => {

                withdrawList.innerHTML = "";

                if (!snapshot.exists()) {

                    if (emptyWithdraw) {
                        emptyWithdraw.style.display = "block";
                    }

                    return;
                }

                if (emptyWithdraw) {
                    emptyWithdraw.style.display = "none";
                }


                const requests = [];

                snapshot.forEach(child => {

                    requests.push({
                        id: child.key,
                        ...child.val()
                    });

                });


                // Newest first
                requests.sort(
                    (a, b) =>
                        (Number(b.createdAt) || 0) -
                        (Number(a.createdAt) || 0)
                );


                // ======================================
                // RENDER REQUESTS
                // ======================================

                for (const request of requests) {

                    const uid =
                        request.uid || "";

                    let user = {};

                    try {

                        if (uid) {

                            const userSnap =
                                await get(
                                    ref(
                                        db,
                                        `users/${uid}`
                                    )
                                );

                            if (userSnap.exists()) {
                                user =
                                    userSnap.val() || {};
                            }

                        }

                    } catch (userError) {

                        console.warn(
                            "Unable to load user:",
                            uid,
                            userError
                        );

                    }


                    const status =
                        normalizeStatus(
                            request.status
                        );


                    const userName =
                        user.fullName ||
                        user.name ||
                        user.username ||
                        request.accountName ||
                        "Unknown User";


                    const email =
                        user.email ||
                        request.email ||
                        "No email";


                    const phone =
                        request.phone ||
                        request.receiverPhone ||
                        user.phone ||
                        user.phoneNumber ||
                        "No phone";


                    const amount =
                        numberValue(
                            request.amount
                        );


                    const fee =
                        numberValue(
                            request.fee
                        );


                    const receive =
                        numberValue(
                            request.receive,
                            amount - fee
                        );


                    const paymentMethod =
                        request.paymentMethod ||
                        "Unknown";


                    const accountName =
                        request.accountName ||
                        "Not provided";


                    const reason =
                        request.reason ||
                        "No reason";


                    const createdAt =
                        request.createdAt
                            ? new Date(
                                Number(
                                    request.createdAt
                                )
                              ).toLocaleString()
                            : "Unknown";


                    const card =
                        document.createElement("div");

                    card.className =
                        "request-card";


                    // ======================================
                    // ACTION BUTTONS
                    // ======================================

                    let actionsHTML = "";


                    if (status === "pending") {

                        actionsHTML = `
                            <div class="request-actions">

                                <button
                                    type="button"
                                    class="withdrawApproveBtn"
                                    data-id="${escapeHTML(request.id)}"
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="withdrawRejectBtn"
                                    data-id="${escapeHTML(request.id)}"
                                >
                                    Reject
                                </button>

                            </div>
                        `;

                    } else {

                        actionsHTML = `
                            <div class="processed-message">
                                Request processed
                            </div>
                        `;

                    }


                    // ======================================
                    // CARD HTML
                    // ======================================

                    card.innerHTML = `

                        <div class="request-top">

                            <div>
                                <strong>
                                    Withdraw Request
                                </strong>

                                <small>
                                    ID:
                                    ${escapeHTML(request.id)}
                                </small>
                            </div>

                            <span
                                class="status ${escapeHTML(status)}"
                            >
                                ${escapeHTML(
                                    request.status || status
                                )}
                            </span>

                        </div>


                        <div class="request-user">

                            <strong>
                                User
                            </strong>

                            <p>
                                ${escapeHTML(userName)}
                            </p>

                            <p>
                                ${escapeHTML(email)}
                            </p>

                            <p>
                                ${escapeHTML(phone)}
                            </p>

                        </div>


                        <div class="request-info">

                            <div>
                                <span>Amount</span>
                                <strong>
                                    ${formatMoney(amount)}
                                </strong>
                            </div>


                            <div>
                                <span>Fee</span>
                                <strong>
                                    ${formatMoney(fee)}
                                </strong>
                            </div>


                            <div>
                                <span>Receive</span>
                                <strong>
                                    ${formatMoney(receive)}
                                </strong>
                            </div>


                            <div>
                                <span>Payment Method</span>
                                <strong>
                                    ${escapeHTML(
                                        paymentMethod
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>Account Name</span>
                                <strong>
                                    ${escapeHTML(
                                        accountName
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>Reason</span>
                                <strong>
                                    ${escapeHTML(reason)}
                                </strong>
                            </div>


                            <div>
                                <span>Created At</span>
                                <strong>
                                    ${escapeHTML(createdAt)}
                                </strong>
                            </div>

                        </div>


                        ${actionsHTML}

                    `;


                    withdrawList.appendChild(card);

                }


                // ======================================
                // ACTIVATE WITHDRAW BUTTONS
                // ======================================

                if (
                    typeof window.activateWithdrawButtons ===
                    "function"
                ) {

                    window.activateWithdrawButtons();

                }

            },
            (error) => {

                console.error(
                    "Withdraw requests error:",
                    error
                );

                withdrawList.innerHTML = `
                    <div class="error-message">
                        Unable to load withdraw requests.
                    </div>
                `;

                if (emptyWithdraw) {
                    emptyWithdraw.style.display = "none";
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


// ======================================
// EXPORT
// ======================================

window.loadWithdraws = loadWithdraws;


// ======================================
// READY
// ======================================

console.log(
    "ADMIN.JS PART 5 READY"
);

// ======================================
// ADMIN.JS - PART 6
// APPROVE / REJECT WITHDRAW
// ======================================

import {
    ref,
    get,
    update,
    push,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// APPROVE WITHDRAW
// ======================================

async function approveWithdraw(id) {

    if (!id) {
        alert("Withdraw request ID is missing.");
        return;
    }

    try {

        // Make sure admin is ready
        if (window.adminState?.ready) {
            await window.adminState.ready;
        }


        // ======================================
        // STEP 1
        // CLAIM REQUEST
        // ======================================

        const requestRef =
            ref(db, `withdrawRequests/${id}`);

        const claimResult =
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

                    // Only pending can be approved
                    if (status !== "pending") {
                        return;
                    }

                    return {
                        ...currentData,

                        status: "processing",

                        processingAt: Date.now(),

                        processingBy:
                            window.adminState
                                ?.currentAdmin
                                ?.uid || "admin"
                    };
                }
            );


        // ======================================
        // REQUEST WAS NOT CLAIMED
        // ======================================

        if (!claimResult.committed) {

            const latestSnap =
                await get(requestRef);

            if (!latestSnap.exists()) {
                alert("Withdraw request not found.");
                return;
            }

            const latest =
                latestSnap.val() || {};

            const latestStatus =
                normalizeStatus(
                    latest.status
                );

            if (latestStatus === "approved") {
                alert("This withdraw is already approved.");
            } else if (
                latestStatus === "processing"
            ) {
                alert("This withdraw is already being processed.");
            } else if (
                latestStatus === "rejected"
            ) {
                alert("This withdraw has already been rejected.");
            } else {
                alert(
                    `Withdraw cannot be approved. Status: ${latest.status}`
                );
            }

            return;
        }


        // ======================================
        // STEP 2
        // READ REQUEST DATA
        // ======================================

        const requestData =
            claimResult.snapshot.val() || {};

        const uid =
            requestData.uid;

        const amount =
            Number(requestData.amount);


        if (
            !uid ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            await update(requestRef, {
                status: "processing_error",
                errorMessage:
                    "Invalid withdraw request data.",
                errorAt: Date.now()
            });

            alert(
                "Withdraw request contains invalid data."
            );

            return;
        }


        // ======================================
        // STEP 3
        // DEDUCT USER BALANCE
        // ======================================

        const userRef =
            ref(db, `users/${uid}`);


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


                    // Prevent negative balance
                    if (currentBalance < amount) {
                        return;
                    }


                    const newBalance =
                        currentBalance - amount;


                    return {
                        ...currentUser,

                        balance: newBalance,

                        totalWithdrawals:
                            (
                                Number(
                                    currentUser.totalWithdrawals
                                ) || 0
                            ) + amount,

                        totalTransactions:
                            (
                                Number(
                                    currentUser.totalTransactions
                                ) || 0
                            ) + 1
                    };
                }
            );


        // ======================================
        // INSUFFICIENT BALANCE
        // ======================================

        if (!balanceResult.committed) {

            await update(requestRef, {

                status: "processing_error",

                errorMessage:
                    "Insufficient balance or user account not found.",

                errorAt: Date.now()

            });

            alert(
                "Withdraw failed: insufficient balance."
            );

            return;
        }


        // ======================================
        // STEP 4
        // CREATE TRANSACTION
        // ======================================

        const transactionRef =
            push(ref(db, "transactions"));


        await update(
            transactionRef,
            {

                uid: uid,

                type: "withdraw",

                amount: amount,

                fee:
                    Number(requestData.fee) || 0,

                receive:
                    Number(requestData.receive) ||
                    (
                        amount -
                        (Number(requestData.fee) || 0)
                    ),

                status: "approved",

                requestId: id,

                paymentMethod:
                    requestData.paymentMethod ||
                    "",

                phone:
                    requestData.phone ||
                    requestData.receiverPhone ||
                    "",

                accountName:
                    requestData.accountName ||
                    "",

                reason:
                    requestData.reason ||
                    "",

                createdAt:
                    Date.now(),

                approvedAt:
                    Date.now(),

                approvedBy:
                    window.adminState
                        ?.currentAdmin
                        ?.uid || "admin"
            }
        );


        // ======================================
        // STEP 5
        // FINALIZE REQUEST
        // ======================================

        await update(
            requestRef,
            {

                status: "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    window.adminState
                        ?.currentAdmin
                        ?.uid || "admin",

                transactionKey:
                    transactionRef.key

            }
        );


        alert(
            "Withdraw approved successfully."
        );


        console.log(
            "Withdraw approved:",
            id
        );

    } catch (error) {

        console.error(
            "approveWithdraw error:",
            error
        );


        // IMPORTANT:
        // Do not return request to pending.
        // Balance may already have been deducted.

        try {

            await update(
                ref(db, `withdrawRequests/${id}`),
                {

                    status:
                        "processing_error",

                    errorMessage:
                        error.message ||
                        "Unknown processing error.",

                    errorAt:
                        Date.now()

                }
            );

        } catch (updateError) {

            console.error(
                "Unable to mark withdraw error:",
                updateError
            );

        }


        alert(
            "Withdraw processing failed. Check Firebase data before trying again."
        );
    }
}



// ======================================
// REJECT WITHDRAW
// ======================================

async function rejectWithdraw(id) {

    if (!id) {
        alert("Withdraw request ID is missing.");
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to reject this withdraw?"
        );


    if (!confirmed) {
        return;
    }


    try {

        if (window.adminState?.ready) {
            await window.adminState.ready;
        }


        const requestRef =
            ref(db, `withdrawRequests/${id}`);


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


                    // Only pending can be rejected
                    if (status !== "pending") {
                        return;
                    }


                    return {

                        ...currentData,

                        status: "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            window.adminState
                                ?.currentAdmin
                                ?.uid || "admin"

                    };
                }
            );


        if (!result.committed) {

            const latestSnap =
                await get(requestRef);


            if (!latestSnap.exists()) {
                alert("Withdraw request not found.");
                return;
            }


            const latest =
                latestSnap.val() || {};


            alert(
                `Withdraw cannot be rejected. Current status: ${latest.status}`
            );

            return;
        }


        alert(
            "Withdraw rejected successfully."
        );


        console.log(
            "Withdraw rejected:",
            id
        );

    } catch (error) {

        console.error(
            "rejectWithdraw error:",
            error
        );


        alert(
            "Unable to reject withdraw."
        );
    }
}



// ======================================
// ACTIVATE WITHDRAW BUTTONS
// ======================================

function activateWithdrawButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".withdrawApproveBtn"
        );


    const rejectButtons =
        document.querySelectorAll(
            ".withdrawRejectBtn"
        );


    // ======================================
    // APPROVE BUTTONS
    // ======================================

    approveButtons.forEach(button => {

        if (
            button.dataset.listenerAttached ===
            "true"
        ) {
            return;
        }


        button.dataset.listenerAttached =
            "true";


        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;


                if (!id) {
                    return;
                }


                button.disabled = true;

                button.textContent =
                    "Processing...";


                try {

                    await approveWithdraw(id);

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "Approve";

                }

            }
        );

    });


    // ======================================
    // REJECT BUTTONS
    // ======================================

    rejectButtons.forEach(button => {

        if (
            button.dataset.listenerAttached ===
            "true"
        ) {
            return;
        }


        button.dataset.listenerAttached =
            "true";


        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;


                if (!id) {
                    return;
                }


                button.disabled = true;

                button.textContent =
                    "Processing...";


                try {

                    await rejectWithdraw(id);

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "Reject";

                }

            }
        );

    });

}



// ======================================
// EXPORT FUNCTIONS
// ======================================

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;

window.activateWithdrawButtons =
    activateWithdrawButtons;


// ======================================
// READY
// ======================================

console.log(
    "ADMIN.JS PART 6 READY"
);
