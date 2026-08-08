// ======================================
// ADMIN.JS - PART 1
// FIREBASE + ADMIN AUTH + STARTUP
// ======================================

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


// ======================================
// GLOBAL STATE
// ======================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise =
    new Promise(resolve => {
        resolveAdminReady = resolve;
    });


// ======================================
// GLOBAL HELPERS
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
// DOM
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
// ======================================

window.waitForAdmin = function () {

    return adminReadyPromise;

};


// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, async user => {

    try {

        if (!user) {

            window.location.href = "login.html";

            return;
        }


        const adminSnap =
            await get(
                ref(db, "admins/" + user.uid)
            );


        if (!adminSnap.exists()) {

            alert("Access denied. Admin only.");

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }


        currentAdmin = user;

        adminReady = true;


        const adminData =
            adminSnap.val() || {};


        if (adminName) {

            adminName.textContent =
                adminData.name ||
                user.displayName ||
                "Administrator";

        }


        if (adminEmail) {

            adminEmail.textContent =
                user.email || "";

        }


        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }


        console.log(
            "ADMIN AUTH READY:",
            user.email
        );


        resolveAdminReady();


        // ==================================
        // START ALL SYSTEMS ONLY NOW
        // ==================================

        if (window.loadDashboard) {
            window.loadDashboard();
        }

        if (window.loadDeposits) {
            window.loadDeposits();
        }

        if (window.loadWithdraws) {
            window.loadWithdraws();
        }

        if (window.loadVipRequests) {
            window.loadVipRequests();
        }

        if (window.loadVipBuyers) {
            window.loadVipBuyers();
        }

        if (window.loadUsers) {
            window.loadUsers();
        }

        if (window.loadTransactions) {
            window.loadTransactions();
        }


    }
    catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "Admin authentication failed: " +
            error.message
        );

    }

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        }
        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// ======================================
// MOBILE SIDEBAR
// ======================================

menuBtn?.addEventListener(
    "click",
    () => {

        sidebar?.classList.toggle("active");

    }
);


// ======================================
// NAVIGATION
// ======================================

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const page =
                link.dataset.page;

            openPage(page);

        }
    );

});


function openPage(page) {

    sections.forEach(section => {

        section.classList.remove("active");

    });


    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    const target =
        document.getElementById(
            page + "Section"
        );


    if (target) {

        target.classList.add("active");

    }


    const activeLink =
        document.querySelector(
            `[data-page="${page}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    if (pageTitle) {

        pageTitle.textContent =
            page.charAt(0).toUpperCase() +
            page.slice(1);

    }

}


// ======================================
// GLOBAL PAGE FUNCTION
// ======================================

window.openPage = openPage;


// ======================================
// PART 1 READY
// ======================================

console.log(
    "ADMIN PART 1 READY"
);

// ======================================
// ADMIN.JS - PART 2
// HELPERS + DASHBOARD
// ======================================


// ======================================
// MONEY
// ======================================

function formatMoney(amount) {

    return Number(amount || 0)
        .toLocaleString() + " RWF";

}


// ======================================
// TEXT UPDATE
// ======================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


// ======================================
// ESCAPE HTML
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
// NUMBER
// ======================================

function numberValue(...values) {

    for (const value of values) {

        const n = Number(value);

        if (
            Number.isFinite(n) &&
            n > 0
        ) {

            return n;

        }

    }

    return 0;

}


// ======================================
// DASHBOARD
// ======================================

function loadDashboard() {

    if (!window.adminState?.ready) {

        console.log(
            "Dashboard waiting for Admin Auth..."
        );

        return;

    }


    // ==================================
    // USERS
    // ==================================

    onValue(
        ref(db, "users"),
        snapshot => {

            let total = 0;
            let balance = 0;

            if (snapshot.exists()) {

                const users =
                    snapshot.val();

                total =
                    Object.keys(users).length;

                Object.values(users)
                    .forEach(user => {

                        balance +=
                            Number(
                                user?.balance || 0
                            );

                    });

            }


            updateText(
                "totalUsers",
                total
            );

            updateText(
                "systemBalance",
                formatMoney(balance)
            );

        }
    );


    // ==================================
    // DEPOSITS
    // ==================================

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (snapshot.exists()) {

                Object.values(snapshot.val())
                    .forEach(item => {

                        total++;

                        const status =
                            String(
                                item?.status ||
                                "pending"
                            ).toLowerCase();


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

            }


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

        }
    );


    // ==================================
    // WITHDRAWS
    // ==================================

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (snapshot.exists()) {

                Object.values(snapshot.val())
                    .forEach(item => {

                        total++;

                        const status =
                            String(
                                item?.status ||
                                "pending"
                            ).toLowerCase();


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

            }


            updateText(
                "dashboardTotalWithdraws",
                total
            );

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

        }
    );


    // ==================================
    // RECENT TRANSACTIONS
    // ==================================

    const activity =
        document.getElementById(
            "recentActivity"
        );


    if (activity) {

        onValue(
            ref(db, "transactions"),
            snapshot => {

                activity.innerHTML = "";


                if (!snapshot.exists()) {

                    activity.innerHTML = `
                        <div class="empty-state">
                            <h3>No Recent Activity</h3>
                        </div>
                    `;

                    return;
                }


                Object.entries(snapshot.val())
                    .reverse()
                    .slice(0, 10)
                    .forEach(
                        ([id, item]) => {

                            const div =
                                document.createElement(
                                    "div"
                                );

                            div.className =
                                "activity-item";


                            div.innerHTML = `
                                <p>
                                    <strong>
                                        ${escapeHTML(
                                            String(
                                                item?.type ||
                                                "transaction"
                                            ).toUpperCase()
                                        )}
                                    </strong>
                                    -
                                    ${formatMoney(
                                        item?.amount || 0
                                    )}
                                </p>

                                <span>
                                    ${escapeHTML(
                                        item?.status || "-"
                                    )}
                                </span>
                            `;


                            activity.appendChild(div);

                        }
                    );

            }
        );

    }

}


window.loadDashboard =
    loadDashboard;


console.log(
    "ADMIN PART 2 READY"
);

// ======================================
// ADMIN.JS - PART 3
// DEPOSITS
// ======================================


// ======================================
// LOAD DEPOSITS
// ======================================

function loadDeposits() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById(
            "depositList"
        );

    const empty =
        document.getElementById(
            "emptyDeposit"
        );


    if (!list) return;


    onValue(
        ref(db, "depositRequests"),
        async snapshot => {

            list.innerHTML = "";


            if (!snapshot.exists()) {

                empty &&
                    (empty.style.display = "block");

                return;

            }


            empty &&
                (empty.style.display = "none");


            const entries =
                Object.entries(
                    snapshot.val()
                ).reverse();


            for (const [id, deposit] of entries) {

                let user = {};


                if (deposit?.uid) {

                    const userSnap =
                        await get(
                            ref(
                                db,
                                "users/" +
                                deposit.uid
                            )
                        );

                    if (userSnap.exists()) {
                        user = userSnap.val();
                    }

                }


                const status =
                    String(
                        deposit?.status ||
                        "pending"
                    ).toLowerCase();


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            Deposit Request
                        </h3>

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>

                    <p>
                        <strong>Name:</strong>
                        ${escapeHTML(
                            deposit?.fullName ||
                            user?.fullName ||
                            user?.name ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(
                            deposit?.email ||
                            user?.email ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${escapeHTML(
                            deposit?.senderPhone ||
                            user?.phone ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        ${Number(
                            deposit?.amount || 0
                        ).toLocaleString()} RWF
                    </p>

                    <p>
                        <strong>Payment Method:</strong>
                        ${escapeHTML(
                            deposit?.paymentMethod ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Transaction ID:</strong>
                        ${escapeHTML(
                            deposit?.transactionId ||
                            "-"
                        )}
                    </p>

                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            data-action="approveDeposit"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-check"></i>
                            ${status === "approved"
                                ? "Approved"
                                : "Approve"}
                        </button>

                        <button
                            class="rejectBtn"
                            data-action="rejectDeposit"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-xmark"></i>
                            ${status === "rejected"
                                ? "Rejected"
                                : "Reject"}
                        </button>

                    </div>
                `;


                list.appendChild(card);

            }


            // ==================================
            // BUTTONS
            // ==================================

            list.querySelectorAll(
                "[data-action]"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (button.disabled) {
                            return;
                        }


                        const id =
                            button.dataset.id;

                        button.disabled = true;


                        if (
                            button.dataset.action ===
                            "approveDeposit"
                        ) {

                            approveDeposit(id);

                        }

                        else {

                            rejectDeposit(id);

                        }

                    }
                );

            });

        }
    );

}


// ======================================
// APPROVE DEPOSIT
// ======================================

async function approveDeposit(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "depositRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) {
                    return;
                }


                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


                if (status !== "pending") {
                    return;
                }


                return {
                    ...current,
                    status: "processing",
                    processingAt: Date.now(),
                    processingBy: currentAdmin.uid
                };

            }
        );


    if (!claim.committed) {

        alert(
            "Deposit already processed."
        );

        return;

    }


    const deposit =
        claim.snapshot.val();


    try {

        const uid =
            deposit.uid;


        if (!uid) {
            throw new Error(
                "Deposit has no user ID."
            );
        }


        const amount =
            Number(deposit.amount || 0);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error(
                "Invalid deposit amount."
            );
        }


        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(userRef);


        if (!userSnap.exists()) {
            throw new Error(
                "User not found."
            );
        }


        const user =
            userSnap.val() || {};


        await update(
            userRef,
            {

                balance:
                    Number(user.balance || 0) +
                    amount,

                totalDeposit:
                    Number(user.totalDeposit || 0) +
                    amount

            }
        );


        await update(
            requestRef,
            {

                status: "approved",

                approvedAt: Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid,

                type: "deposit",

                amount,

                status: "approved",

                reference: id,

                approvedBy:
                    currentAdmin.uid,

                date: Date.now()

            }
        );


        alert(
            "Deposit Approved Successfully"
        );


    }
    catch (error) {

        console.error(
            "Deposit approval error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "Deposit approval failed: " +
            error.message
        );

    }

}


// ======================================
// REJECT DEPOSIT
// ======================================

async function rejectDeposit(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "depositRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) {
                    return;
                }


                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


                if (status !== "pending") {
                    return;
                }


                return {
                    ...current,
                    status: "processing",
                    processingAt: Date.now(),
                    processingBy: currentAdmin.uid
                };

            }
        );


    if (!claim.committed) {

        alert(
            "Deposit already processed."
        );

        return;

    }


    try {

        const deposit =
            claim.snapshot.val();


        await update(
            requestRef,
            {

                status: "rejected",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid:
                    deposit.uid || "",

                type: "deposit",

                amount:
                    Number(
                        deposit.amount || 0
                    ),

                status: "rejected",

                reference: id,

                rejectedBy:
                    currentAdmin.uid,

                date: Date.now()

            }
        );


        alert(
            "Deposit Rejected Successfully"
        );

    }
    catch (error) {

        console.error(
            "Reject deposit error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "Reject deposit failed: " +
            error.message
        );

    }

}


window.loadDeposits =
    loadDeposits;

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;


console.log(
    "ADMIN
    
    PART 3 READY"
);
// ======================================
// ADMIN.JS - PART 4
// QUICK ACTIONS
// ======================================

function goToPage(page) {

    if (window.openPage) {
        window.openPage(page);
    }

}


document
    .getElementById("refreshDashboard")
    ?.addEventListener(
        "click",
        () => {

            window.loadDashboard?.();

        }
    );


document
    .getElementById("refreshDashboardQuick")
    ?.addEventListener(
        "click",
        () => {

            window.loadDashboard?.();

        }
    );


const pageButtons = {

    openDeposits: "deposits",

    openDepositsBtn: "deposits",

    openWithdraws: "withdraws",

    openWithdrawsBtn: "withdraws",

    openUsers: "users",

    openUsersBtn: "users",

    openTransactions: "transactions",

    openTransactionsBtn: "transactions",

    openSettings: "settings",

    openSettingsBtn: "settings",

    openVipRequests: "vipRequests",

    openVipRequestsBtn: "vipRequests"

};


Object.entries(pageButtons)
    .forEach(([id, page]) => {

        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                () => goToPage(page)
            );

    });


console.log(
    "ADMIN PART 4 READY"
);

// ======================================
// ADMIN.JS - PART 5
// WITHDRAW MANAGEMENT
// ======================================


// ======================================
// LOAD WITHDRAWS
// ======================================

function loadWithdraws() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById(
            "withdrawList"
        );


    const empty =
        document.getElementById(
            "emptyWithdraw"
        );


    if (!list) return;


    onValue(
        ref(db, "withdrawRequests"),
        async snapshot => {

            list.innerHTML = "";


            if (!snapshot.exists()) {

                empty &&
                    (empty.style.display = "block");

                return;

            }


            empty &&
                (empty.style.display = "none");


            const requests =
                Object.entries(
                    snapshot.val()
                ).reverse();


            for (
                const [id, request]
                of requests
            ) {

                const item =
                    request || {};


                const uid =
                    item.uid ||
                    item.userId ||
                    item.userUID ||
                    "";


                let user = {};


                if (uid) {

                    const userSnap =
                        await get(
                            ref(
                                db,
                                "users/" + uid
                            )
                        );


                    if (userSnap.exists()) {
                        user =
                            userSnap.val() || {};
                    }

                }


                const status =
                    String(
                        item.status ||
                        "pending"
                    ).toLowerCase();


                const name =
                    item.fullName ||
                    item.name ||
                    user.fullName ||
                    user.name ||
                    user.username ||
                    "Unknown User";


                const email =
                    item.email ||
                    user.email ||
                    "-";


                const phone =
                    item.phone ||
                    item.phoneNumber ||
                    user.phone ||
                    "-";


                const amount =
                    Number(
                        item.amount || 0
                    );


                const method =
                    item.paymentMethod ||
                    item.method ||
                    "-";


                const account =
                    item.accountNumber ||
                    item.account ||
                    item.destination ||
                    item.phoneNumber ||
                    item.phone ||
                    "-";


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            <i class="fa-solid fa-money-bill-transfer"></i>
                            Withdraw Request
                        </h3>

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>

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
                            ${escapeHTML(uid || "-")}
                        </p>

                    </div>

                    <div class="withdraw-info">

                        <p>
                            <strong>Amount:</strong>
                            ${amount.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Payment Method:</strong>
                            ${escapeHTML(method)}
                        </p>

                        <p>
                            <strong>Account:</strong>
                            ${escapeHTML(account)}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${escapeHTML(
                                item.createdAt ||
                                item.requestDate ||
                                item.date ||
                                "-"
                            )}
                        </p>

                    </div>

                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            data-withdraw-action="approve"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-check"></i>
                            ${status === "approved"
                                ? "Approved"
                                : "Approve"}
                        </button>

                        <button
                            class="rejectBtn"
                            data-withdraw-action="reject"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-xmark"></i>
                            ${status === "rejected"
                                ? "Rejected"
                                : "Reject"}
                        </button>

                    </div>
                `;


                list.appendChild(card);

            }


            list.querySelectorAll(
                "[data-withdraw-action]"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (button.disabled) {
                            return;
                        }


                        button.disabled = true;


                        const id =
                            button.dataset.id;


                        if (
                            button.dataset.withdrawAction ===
                            "approve"
                        ) {

                            approveWithdraw(id);

                        }
                        else {

                            rejectWithdraw(id);

                        }

                    }
                );

            });

        }
    );

}


// ======================================
// APPROVE WITHDRAW
// ======================================

async function approveWithdraw(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "withdrawRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) return;

                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


                if (status !== "pending") {
                    return;
                }


                return {
                    ...current,
                    status: "processing",
                    processingAt: Date.now(),
                    processingBy: currentAdmin.uid
                };

            }
        );


    if (!claim.committed) {

        alert(
            "Withdraw already processed."
        );

        return;

    }


    const request =
        claim.snapshot.val();


    const uid =
        request.uid ||
        request.userId ||
        request.userUID ||
        "";


    try {

        if (!uid) {
            throw new Error(
                "Withdraw has no user ID."
            );
        }


        const amount =
            Number(request.amount || 0);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new Error(
                "Invalid withdraw amount."
            );

        }


        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const balanceResult =
            await runTransaction(
                userRef,
                user => {

                    if (!user) return;

                    const balance =
                        Number(
                            user.balance || 0
                        );


                    if (balance < amount) {
                        return;
                    }


                    return {

                        ...user,

                        balance:
                            balance - amount,

                        totalWithdraw:
                            Number(
                                user.totalWithdraw || 0
                            ) + amount

                    };

                }
            );


        if (!balanceResult.committed) {

            throw new Error(
                "Insufficient user balance."
            );

        }


        await update(
            requestRef,
            {

                status: "approved",

                approvedAt: Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid,

                type: "withdraw",

                amount,

                status: "approved",

                reference: id,

                approvedBy:
                    currentAdmin.uid,

                date: Date.now()

            }
        );


        alert(
            "Withdraw Approved Successfully"
        );

    }
    catch (error) {

        console.error(
            "Withdraw approval error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "Withdraw approval failed: " +
            error.message
        );

    }

}


// ======================================
// REJECT WITHDRAW
// ======================================

async function rejectWithdraw(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "withdrawRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) return;

                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


                if (status !== "pending") {
                    return;
                }


                return {
                    ...current,
                    status: "processing",
                    processingAt: Date.now(),
                    processingBy: currentAdmin.uid
                };

            }
        );


    if (!claim.committed) {

        alert(
            "Withdraw already processed."
        );

        return;

    }


    try {

        const request =
            claim.snapshot.val();


        await update(
            requestRef,
            {

                status: "rejected",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid:
                    request.uid ||
                    request.userId ||
                    request.userUID ||
                    "",

                type: "withdraw",

                amount:
                    Number(
                        request.amount || 0
                    ),

                status: "rejected",

                reference: id,

                rejectedBy:
                    currentAdmin.uid,

                date: Date.now()

            }
        );


        alert(
            "Withdraw Rejected Successfully"
        );

    }
    catch (error) {

        console.error(
            "Reject withdraw error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "Reject withdraw failed: " +
            error.message
        );

    }

}


window.loadWithdraws =
    loadWithdraws;

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;


console.log(
    "ADMIN PART 5 READY"
);

// ======================================
// ADMIN.JS - PART 6
// VIP REQUESTS
// ======================================


// ======================================
// VIP DATE
// ======================================

function formatVipDate(value) {

    if (!value) return "-";


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString();

}


// ======================================
// VIP PHOTO
// ======================================

function getVipPhoto(request, user) {

    return (
        request?.photoURL ||
        request?.photoUrl ||
        request?.photo ||
        request?.profilePhoto ||
        user?.photoURL ||
        user?.photoUrl ||
        user?.photo ||
        user?.profilePhoto ||
        ""
    );

}


// ======================================
// LOAD VIP REQUESTS
// ======================================

function loadVipRequests() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById(
            "vipRequestList"
        );


    const empty =
        document.getElementById(
            "emptyVipRequest"
        );


    if (!list) return;


    onValue(
        ref(
            db,
            "vipPurchaseRequests"
        ),
        async snapshot => {

            list.innerHTML = "";


            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (!snapshot.exists()) {

                empty &&
                    (empty.style.display = "block");

                updateText(
                    "vipTotalCount",
                    0
                );

                updateText(
                    "vipPendingCount",
                    0
                );

                updateText(
                    "vipApprovedCount",
                    0
                );

                updateText(
                    "vipRejectedCount",
                    0
                );

                return;

            }


            empty &&
                (empty.style.display = "none");


            const requests =
                Object.entries(
                    snapshot.val()
                ).reverse();


            for (
                const [id, request]
                of requests
            ) {

                const item =
                    request || {};


                total++;


                const status =
                    String(
                        item.status ||
                        "pending"
                    ).toLowerCase();


                if (status === "pending") {
                    pending++;
                }

                else if (status === "approved") {
                    approved++;
                }

                else if (status === "rejected") {
                    rejected++;
                }


                const uid =
                    item.uid ||
                    item.userId ||
                    item.userUID ||
                    "";


                let user = {};


                if (uid) {

                    const userSnap =
                        await get(
                            ref(
                                db,
                                "users/" + uid
                            )
                        );


                    if (userSnap.exists()) {
                        user =
                            userSnap.val() || {};
                    }

                }


                const name =
                    item.fullName ||
                    item.name ||
                    item.username ||
                    user.fullName ||
                    user.name ||
                    user.username ||
                    "Unknown User";


                const email =
                    item.email ||
                    user.email ||
                    "-";


                const phone =
                    item.phone ||
                    item.phoneNumber ||
                    user.phone ||
                    user.phoneNumber ||
                    "-";


                const vipName =
                    item.vipName ||
                    item.planName ||
                    item.namePlan ||
                    item.plan ||
                    item.vip ||
                    "VIP Plan";


                const price =
                    numberValue(
                        item.price,
                        item.vipPrice,
                        item.amount
                    );


                const daily =
                    numberValue(
                        item.dailyIncome,
                        item.daily,
                        item.dailyProfit
                    );


                const duration =
                    numberValue(
                        item.duration,
                        item.days,
                        item.durationDays
                    );


                const profit =
                    numberValue(
                        item.totalProfit,
                        item.profit,
                        item.total
                    );


                const photo =
                    getVipPhoto(
                        item,
                        user
                    );


                const photoHTML =
                    photo
                    ?

                    `
                    <img
                        src="${escapeHTML(photo)}"
                        class="vip-user-photo"
                        alt="User"
                        onerror="
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                        "
                    >

                    <div
                        class="vip-user-avatar"
                        style="display:none;"
                    >
                        <i class="fa-solid fa-user"></i>
                    </div>
                    `

                    :

                    `
                    <div class="vip-user-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    `;


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card vip-request-card";


                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            <i class="fa-solid fa-crown"></i>
                            VIP Purchase
                        </h3>

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <div class="user-profile-box">

                        <div class="vip-profile-header">

                            <div class="vip-photo-wrapper">
                                ${photoHTML}
                            </div>

                            <div class="vip-profile-name">

                                <h4>
                                    ${escapeHTML(name)}
                                </h4>

                                <span>
                                    VIP Buyer
                                </span>

                            </div>

                        </div>


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
                            ${escapeHTML(uid || "-")}
                        </p>

                    </div>


                    <div class="withdraw-info">

                        <p>
                            <strong>VIP Plan:</strong>
                            ${escapeHTML(vipName)}
                        </p>

                        <p>
                            <strong>Price:</strong>
                            ${price.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Daily Income:</strong>
                            ${daily.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Duration:</strong>
                            ${duration} Days
                        </p>

                        <p>
                            <strong>Total Profit:</strong>
                            ${profit.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Request Date:</strong>
                            ${escapeHTML(
                                formatVipDate(
                                    item.createdAt ||
                                    item.requestDate ||
                                    item.date ||
                                    item.timestamp
                                )
                            )}
                        </p>

                    </div>


                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            data-vip-action="approve"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-check"></i>
                            ${status === "approved"
                                ? "Approved"
                                : "Approve VIP"}
                        </button>


                        <button
                            class="rejectBtn"
                            data-vip-action="reject"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-xmark"></i>
                            ${status === "rejected"
                                ? "Rejected"
                                : "Reject VIP"}
                        </button>

                    </div>
                `;


                list.appendChild(card);

            }


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


            list.querySelectorAll(
                "[data-vip-action]"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (button.disabled) {
                            return;
                        }


                        button.disabled = true;


                        const id =
                            button.dataset.id;


                        if (
                            button.dataset.vipAction ===
                            "approve"
                        ) {

                            approveVipRequest(id);

                        }
                        else {

                            rejectVipRequest(id);

                        }

                    }
                );

            });

        }
    );

}


window.loadVipRequests =
    loadVipRequests;


console.log(
    "ADMIN PART 6 READY"
);

// ======================================
// ADMIN.JS - PART 7
// VIP APPROVE + REJECT
// ======================================


// ======================================
// APPROVE VIP
// ======================================

async function approveVipRequest(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "vipPurchaseRequests/" + id
        );


    // ==================================
    // CLAIM REQUEST ONCE
    // ==================================

    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) return;


                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


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


    if (!claim.committed) {

        alert(
            "VIP request already processed."
        );

        return;

    }


    const request =
        claim.snapshot.val();


    try {

        const uid =
            request.uid ||
            request.userId ||
            request.userUID ||
            "";


        if (!uid) {

            throw new Error(
                "VIP request has no user ID."
            );

        }


        const vipName =
            request.vipName ||
            request.planName ||
            request.namePlan ||
            request.plan ||
            request.vip ||
            "VIP Plan";


        const price =
            numberValue(
                request.price,
                request.vipPrice,
                request.amount
            );


        const dailyIncome =
            numberValue(
                request.dailyIncome,
                request.daily,
                request.dailyProfit
            );


        const duration =
            numberValue(
                request.duration,
                request.days,
                request.durationDays
            );


        const totalProfit =
            numberValue(
                request.totalProfit,
                request.profit,
                request.total
            );


        const userSnap =
            await get(
                ref(
                    db,
                    "users/" + uid
                )
            );


        if (!userSnap.exists()) {

            throw new Error(
                "User not found."
            );

        }


        const user =
            userSnap.val() || {};


        // ==================================
        // CREATE VIP BUYER
        // ==================================

        const buyerRef =
            push(
                ref(
                    db,
                    "vipBuyers"
                )
            );


        await set(
            buyerRef,
            {

                uid,

                name:
                    request.fullName ||
                    request.name ||
                    user.fullName ||
                    user.name ||
                    "",

                email:
                    request.email ||
                    user.email ||
                    "",

                phone:
                    request.phone ||
                    request.phoneNumber ||
                    user.phone ||
                    user.phoneNumber ||
                    "",

                photoURL:
                    request.photoURL ||
                    request.photoUrl ||
                    request.photo ||
                    user.photoURL ||
                    user.photo ||
                    "",

                vipName,

                price,

                dailyIncome,

                duration,

                totalProfit,

                requestId: id,

                status: "active",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        // ==================================
        // REQUEST APPROVED
        // ==================================

        await update(
            requestRef,
            {

                status: "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        // ==================================
        // TRANSACTION
        // ==================================

        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid,

                type:
                    "vip_purchase",

                amount:
                    price,

                status:
                    "approved",

                reference:
                    id,

                approvedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        alert(
            "VIP Approved Successfully"
        );


    }
    catch (error) {

        console.error(
            "VIP approval error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "VIP approval failed: " +
            error.message
        );

    }

}


// ======================================
// REJECT VIP
// ======================================

async function rejectVipRequest(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "vipPurchaseRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) return;


                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


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


    if (!claim.committed) {

        alert(
            "VIP request already processed."
        );

        return;

    }


    try {

        const request =
            claim.snapshot.val();


        await update(
            requestRef,
            {

                status: "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid:
                    request.uid ||
                    request.userId ||
                    request.userUID ||
                    "",

                type:
                    "vip_purchase",

                amount:
                    numberValue(
                        request.price,
                        request.vipPrice,
                        request.amount
                    ),

                status:
                    "rejected",

                reference:
                    id,

                rejectedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        alert(
            "VIP Rejected Successfully"
        );

    }
    catch (error) {

        console.error(
            "VIP rejection error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "VIP rejection failed: " +
            error.message
        );

    }

}


window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;


console.log(
    "ADMIN PART 7 READY"
);
// ======================================
// ADMIN.JS - PART 8
// VIP BUYERS
// APPROVED VIP USERS ONLY
// ======================================


function loadVipBuyers() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById(
            "vipBuyerList"
        );


    const empty =
        document.getElementById(
            "emptyVipBuyer"
        );


    if (!list) return;


    onValue(
        ref(db, "vipBuyers"),
        snapshot => {

            list.innerHTML = "";


            if (!snapshot.exists()) {

                empty &&
                    (empty.style.display = "block");


                updateText(
                    "vipBuyerTotalCount",
                    0
                );

                updateText(
                    "vipBuyerActiveCount",
                    0
                );

                updateText(
                    "vipBuyerExpiredCount",
                    0
                );


                if (!empty) {

                    list.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-crown"></i>
                            <h3>No VIP Buyers</h3>
                            <p>
                                Approved VIP buyers
                                will appear here.
                            </p>
                        </div>
                    `;

                }


                return;

            }


            empty &&
                (empty.style.display = "none");


            const buyers =
                Object.entries(
                    snapshot.val()
                ).reverse();


            let active = 0;
            let expired = 0;


            buyers.forEach(
                ([id, buyer]) => {

                    const item =
                        buyer || {};


                    const duration =
                        Number(
                            item.duration || 0
                        );


                    const start =
                        Number(
                            item.approvedAt ||
                            item.startDate ||
                            item.createdAt ||
                            0
                        );


                    let isExpired =
                        String(
                            item.status ||
                            "active"
                        ).toLowerCase()
                        === "expired";


                    if (
                        !isExpired &&
                        duration > 0 &&
                        start > 0
                    ) {

                        isExpired =
                            Date.now() >
                            start +
                            (
                                duration *
                                24 *
                                60 *
                                60 *
                                1000
                            );

                    }


                    if (isExpired) {
                        expired++;
                    }
                    else {
                        active++;
                    }


                    const photo =
                        item.photoURL ||
                        item.photoUrl ||
                        item.photo ||
                        "";


                    const photoHTML =
                        photo
                        ?

                        `
                        <img
                            src="${escapeHTML(photo)}"
                            class="vip-user-photo"
                            alt="VIP Buyer"
                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >

                        <div
                            class="vip-user-avatar"
                            style="display:none;"
                        >
                            <i class="fa-solid fa-user"></i>
                        </div>
                        `

                        :

                        `
                        <div class="vip-user-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        `;


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "request-card vip-buyer-card";


                    card.innerHTML = `

                        <div class="request-top">

                            <h3>
                                <i class="fa-solid fa-crown"></i>
                                VIP Buyer
                            </h3>

                            <span
                                class="status ${
                                    isExpired
                                    ? "expired"
                                    : "approved"
                                }"
                            >
                                ${
                                    isExpired
                                    ? "Expired"
                                    : "Active"
                                }
                            </span>

                        </div>


                        <div class="vip-profile-header">

                            <div class="vip-photo-wrapper">

                                ${photoHTML}

                            </div>


                            <div class="vip-profile-name">

                                <h4>
                                    ${escapeHTML(
                                        item.name ||
                                        "Unknown User"
                                    )}
                                </h4>

                                <span>
                                    VIP Buyer
                                </span>

                            </div>

                        </div>


                        <div class="user-profile-box">

                            <p>
                                <strong>Name:</strong>
                                ${escapeHTML(
                                    item.name || "-"
                                )}
                            </p>

                            <p>
                                <strong>Email:</strong>
                                ${escapeHTML(
                                    item.email || "-"
                                )}
                            </p>

                            <p>
                                <strong>Phone:</strong>
                                ${escapeHTML(
                                    item.phone || "-"
                                )}
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${escapeHTML(
                                    item.uid || "-"
                                )}
                            </p>

                        </div>


                        <div class="withdraw-info">

                            <p>
                                <strong>VIP Plan:</strong>
                                ${escapeHTML(
                                    item.vipName ||
                                    "VIP Plan"
                                )}
                            </p>

                            <p>
                                <strong>Price:</strong>
                                ${Number(
                                    item.price || 0
                                ).toLocaleString()} RWF
                            </p>

                            <p>
                                <strong>Daily Income:</strong>
                                ${Number(
                                    item.dailyIncome || 0
                                ).toLocaleString()} RWF
                            </p>

                            <p>
                                <strong>Duration:</strong>
                                ${duration} Days
                            </p>

                            <p>
                                <strong>Total Profit:</strong>
                                ${Number(
                                    item.totalProfit || 0
                                ).toLocaleString()} RWF
                            </p>

                            <p>
                                <strong>Approved Date:</strong>
                                ${escapeHTML(
                                    formatVipDate(
                                        item.approvedAt
                                    )
                                )}
                            </p>

                        </div>

                    `;


                    list.appendChild(card);

                }
            );


            updateText(
                "vipBuyerTotalCount",
                buyers.length
            );


            updateText(
                "vipBuyerActiveCount",
                active
            );


            updateText(
                "vipBuyerExpiredCount",
                expired
            );


            console.log(
                "VIP Buyers loaded:",
                buyers.length
            );

        }
    );

}


window.loadVipBuyers =
    loadVipBuyers;


console.log(
    "ADMIN PART 8 READY"
);



