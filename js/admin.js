// ==========================================
// ADMIN.JS — PART 1
// Money Vault Admin Panel
// Firebase Auth + Realtime Database
// ==========================================


// ==========================================
// 1. FIREBASE IMPORTS
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
// 2. ADMIN STATE
// ==========================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise = new Promise((resolve) => {
    resolveAdminReady = resolve;
});


// ==========================================
// 3. GLOBAL ADMIN STATE
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
// 4. WAIT FOR ADMIN
// ==========================================

window.waitForAdmin = function () {
    return adminReadyPromise;
};


// ==========================================
// 5. DOM ELEMENTS
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
    document.querySelectorAll(".admin-section");


// ==========================================
// 6. HIDE LOADING SCREEN
// ==========================================

function hideLoadingScreen() {

    if (!loadingScreen) return;

    loadingScreen.style.display = "none";
}


// ==========================================
// 7. SHOW LOADING SCREEN
// ==========================================

function showLoadingScreen() {

    if (!loadingScreen) return;

    loadingScreen.style.display = "flex";
}


// ==========================================
// 8. ADMIN AUTH CHECK
// ==========================================

onAuthStateChanged(auth, async (user) => {

    try {

        // ----------------------------------
        // USER NOT LOGGED IN
        // ----------------------------------

        if (!user) {

            window.location.href = "login.html";

            return;
        }


        // ----------------------------------
        // CHECK ADMIN ACCOUNT
        // ----------------------------------

        const adminRef =
            ref(db, `admins/${user.uid}`);

        const adminSnapshot =
            await get(adminRef);


        // ----------------------------------
        // NOT ADMIN
        // ----------------------------------

        if (!adminSnapshot.exists()) {

            alert("Accès refusé. Vous n'êtes pas administrateur.");

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }


        // ----------------------------------
        // ADMIN VERIFIED
        // ----------------------------------

        currentAdmin = {
            uid: user.uid,
            email: user.email || "",
            ...adminSnapshot.val()
        };


        adminReady = true;


        // Resolve all functions waiting
        resolveAdminReady(currentAdmin);


        // ----------------------------------
        // DISPLAY ADMIN INFORMATION
        // ----------------------------------

        if (adminName) {

            adminName.textContent =
                currentAdmin.name ||
                currentAdmin.displayName ||
                "Administrator";
        }


        if (adminEmail) {

            adminEmail.textContent =
                user.email || "";
        }


        // ----------------------------------
        // HIDE LOADING
        // ----------------------------------

        hideLoadingScreen();


        // ----------------------------------
        // LOAD ADMIN DATA
        // ----------------------------------

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
// 9. LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {

            console.error(
                "LOGOUT ERROR:",
                error
            );

            alert(
                "Erreur lors de la déconnexion."
            );
        }

    });

}


// ==========================================
// 10. MOBILE MENU
// ==========================================

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        if (!sidebar) return;

        sidebar.classList.toggle("active");

    });

}


// ==========================================
// 11. OPEN ADMIN PAGE
// ==========================================

function openPage(pageName) {

    if (!pageName) return;


    // ----------------------------------
    // HIDE ALL SECTIONS
    // ----------------------------------

    sections.forEach((section) => {

        section.style.display = "none";

    });


    // ----------------------------------
    // REMOVE ACTIVE MENU
    // ----------------------------------

    menuLinks.forEach((link) => {

        link.classList.remove("active");

    });


    // ----------------------------------
    // SHOW SELECTED SECTION
    // ----------------------------------

    const selectedSection =
        document.getElementById(pageName);


    if (selectedSection) {

        selectedSection.style.display = "block";
    }


    // ----------------------------------
    // ACTIVE MENU LINK
    // ----------------------------------

    const activeLink =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");
    }


    // ----------------------------------
    // PAGE TITLE
    // ----------------------------------

    if (pageTitle) {

        const title =
            activeLink?.getAttribute("data-title");

        pageTitle.textContent =
            title || pageName;
    }


    // ----------------------------------
    // CLOSE MOBILE SIDEBAR
    // ----------------------------------

    if (sidebar) {

        sidebar.classList.remove("active");

    }

}


// ==========================================
// 12. MAKE OPENPAGE GLOBAL
// ==========================================

window.openPage = openPage;


// ==========================================
// 13. MENU EVENTS
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
// 14. INITIAL LOG
// ==========================================

console.log(
    "ADMIN.JS PART 1 READY"
);
// ==========================================
// ADMIN.JS — PART 2
// Dashboard
// ==========================================


// ==========================================
// 1. DASHBOARD LOADER
// ==========================================

async function loadDashboard() {

    try {

        await window.waitForAdmin();

        console.log("Loading admin dashboard...");


        // ----------------------------------
        // DATABASE REFERENCES
        // ----------------------------------

        const usersRef =
            ref(db, "users");

        const depositsRef =
            ref(db, "depositRequests");

        const withdrawsRef =
            ref(db, "withdrawRequests");

        const transactionsRef =
            ref(db, "transactions");


        // ----------------------------------
        // LOAD USERS
        // ----------------------------------

        onValue(usersRef, (snapshot) => {

            let totalUsers = 0;

            if (snapshot.exists()) {

                snapshot.forEach(() => {
                    totalUsers++;
                });

            }


            updateText(
                "totalUsers",
                totalUsers
            );

        });


        // ----------------------------------
        // LOAD DEPOSIT REQUESTS
        // ----------------------------------

        onValue(depositsRef, (snapshot) => {

            let pendingDeposits = 0;
            let totalDeposits = 0;

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    const amount =
                        numberValue(data.amount);

                    if (
                        normalizeStatus(data.status)
                        === "pending"
                    ) {

                        pendingDeposits++;

                    }

                    if (
                        normalizeStatus(data.status)
                        === "approved"
                    ) {

                        totalDeposits += amount;

                    }

                });

            }


            updateText(
                "pendingDeposits",
                pendingDeposits
            );

            updateText(
                "totalDeposits",
                formatMoney(totalDeposits)
            );

        });


        // ----------------------------------
        // LOAD WITHDRAW REQUESTS
        // ----------------------------------

        onValue(withdrawsRef, (snapshot) => {

            let pendingWithdraws = 0;
            let totalWithdraws = 0;

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    const amount =
                        numberValue(data.amount);

                    if (
                        normalizeStatus(data.status)
                        === "pending"
                    ) {

                        pendingWithdraws++;

                    }

                    if (
                        normalizeStatus(data.status)
                        === "approved"
                    ) {

                        totalWithdraws += amount;

                    }

                });

            }


            updateText(
                "pendingWithdraws",
                pendingWithdraws
            );

            updateText(
                "totalWithdraws",
                formatMoney(totalWithdraws)
            );

        });


        // ----------------------------------
        // LOAD TRANSACTIONS
        // ----------------------------------

        onValue(transactionsRef, (snapshot) => {

            let transactionCount = 0;

            const transactions = [];


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    transactionCount++;


                    transactions.push({
                        id: child.key,
                        ...data
                    });

                });

            }


            updateText(
                "totalTransactions",
                transactionCount
            );


            // ----------------------------------
            // RECENT TRANSACTIONS
            // ----------------------------------

            transactions.sort((a, b) => {

                return (
                    numberValue(b.createdAt) -
                    numberValue(a.createdAt)
                );

            });


            renderRecentTransactions(
                transactions.slice(0, 10)
            );

        });


        // ----------------------------------
        // CALCULATE SYSTEM BALANCE
        // ----------------------------------

        onValue(usersRef, (snapshot) => {

            let systemBalance = 0;

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const user =
                        child.val() || {};

                    systemBalance +=
                        numberValue(user.balance);

                });

            }


            updateText(
                "systemBalance",
                formatMoney(systemBalance)
            );

        });


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
// 2. RENDER RECENT TRANSACTIONS
// ==========================================

function renderRecentTransactions(
    transactions = []
) {

    const container =
        document.getElementById(
            "recentTransactions"
        );


    if (!container) return;


    // ----------------------------------
    // EMPTY STATE
    // ----------------------------------

    if (!transactions.length) {

        container.innerHTML = `
            <div class="empty-state">
                Aucun transaction récente.
            </div>
        `;

        return;
    }


    // ----------------------------------
    // RENDER
    // ----------------------------------

    container.innerHTML =
        transactions.map((transaction) => {

            const type =
                String(
                    transaction.type || ""
                ).toLowerCase();


            const status =
                normalizeStatus(
                    transaction.status
                );


            const amount =
                numberValue(
                    transaction.amount
                );


            let typeLabel =
                transaction.type || "Transaction";


            if (type === "deposit") {
                typeLabel = "Dépôt";
            }

            else if (type === "withdraw") {
                typeLabel = "Retrait";
            }

            else if (type === "vip") {
                typeLabel = "VIP";
            }

            else if (type === "bonus") {
                typeLabel = "Bonus";
            }

            else if (type === "profit") {
                typeLabel = "Profit";
            }


            const statusLabel =
                status === "approved"
                    ? "Approuvé"
                    : status === "pending"
                    ? "En attente"
                    : status === "rejected"
                    ? "Rejeté"
                    : status;


            const date =
                transaction.createdAt
                    ? new Date(
                        numberValue(
                            transaction.createdAt
                        )
                    ).toLocaleString("fr-FR")
                    : "-";


            return `
                <div class="transaction-row">

                    <div class="transaction-info">

                        <strong>
                            ${escapeHTML(typeLabel)}
                        </strong>

                        <small>
                            ${escapeHTML(
                                transaction.uid || ""
                            )}
                        </small>

                        <small>
                            ${escapeHTML(date)}
                        </small>

                    </div>


                    <div class="transaction-amount">

                        ${formatMoney(amount)}

                    </div>


                    <div class="transaction-status status-${escapeHTML(status)}">

                        ${escapeHTML(statusLabel)}

                    </div>

                </div>
            `;

        }).join("");

}


// ==========================================
// 3. EXPOSE DASHBOARD FUNCTION
// ==========================================

window.loadDashboard =
    loadDashboard;


// ==========================================
// 4. EXPOSE DASHBOARD RENDERER
// ==========================================

window.renderRecentTransactions =
    renderRecentTransactions;


// ==========================================
// 5. PART 2 READY
// ==========================================

console.log(
    "ADMIN.JS PART 2 READY"
);

    // ==========================================
// ADMIN.JS — PART 3
// Deposit Requests
// ==========================================


// ==========================================
// 1. LOAD DEPOSIT REQUESTS
// ==========================================

async function loadDeposits() {

    try {

        await window.waitForAdmin();

        console.log("Loading deposit requests...");


        const depositsRef =
            ref(db, "depositRequests");


        onValue(depositsRef, async (snapshot) => {

            const container =
                document.getElementById("depositRequests");

            if (!container) {
                console.warn(
                    "depositRequests container not found"
                );
                return;
            }


            // ----------------------------------
            // EMPTY STATE
            // ----------------------------------

            if (!snapshot.exists()) {

                container.innerHTML = `
                    <div class="empty-state">
                        Aucun dépôt trouvé.
                    </div>
                `;

                return;
            }


            const requests = [];


            // ----------------------------------
            // GET ALL REQUESTS
            // ----------------------------------

            snapshot.forEach((child) => {

                const data =
                    child.val() || {};

                requests.push({
                    id: child.key,
                    ...data
                });

            });


            // ----------------------------------
            // SORT — NEWEST FIRST
            // ----------------------------------

            requests.sort((a, b) => {

                return (
                    numberValue(b.createdAt) -
                    numberValue(a.createdAt)
                );

            });


            // ----------------------------------
            // LOAD USERS
            // ----------------------------------

            const userCache = {};


            await Promise.all(
                requests.map(async (request) => {

                    if (!request.uid) return;

                    try {

                        const userSnapshot =
                            await get(
                                ref(
                                    db,
                                    `users/${request.uid}`
                                )
                            );


                        if (userSnapshot.exists()) {

                            userCache[request.uid] =
                                userSnapshot.val();

                        }

                    } catch (error) {

                        console.error(
                            "USER LOAD ERROR:",
                            request.uid,
                            error
                        );

                    }

                })
            );


            // ----------------------------------
            // RENDER REQUESTS
            // ----------------------------------

            container.innerHTML =
                requests.map((request) => {

                    const status =
                        normalizeStatus(
                            request.status
                        );


                    const amount =
                        numberValue(
                            request.amount
                        );


                    const user =
                        userCache[request.uid] || {};


                    const name =
                        user.name ||
                        user.fullName ||
                        user.username ||
                        "Utilisateur";


                    const email =
                        user.email ||
                        request.email ||
                        "";


                    const phone =
                        request.senderPhone ||
                        request.phone ||
                        user.phone ||
                        "-";


                    const paymentMethod =
                        request.paymentMethod ||
                        "-";


                    const transactionId =
                        request.transactionId ||
                        "-";


                    const paymentDate =
                        request.paymentDate ||
                        "-";


                    const createdAt =
                        request.createdAt
                            ? new Date(
                                numberValue(
                                    request.createdAt
                                )
                            ).toLocaleString("fr-FR")
                            : "-";


                    // ----------------------------------
                    // STATUS LABEL
                    // ----------------------------------

                    let statusLabel =
                        "En attente";


                    if (status === "approved") {
                        statusLabel = "Approuvé";
                    }

                    else if (status === "rejected") {
                        statusLabel = "Rejeté";
                    }

                    else if (status === "processing") {
                        statusLabel = "Traitement...";
                    }

                    else if (
                        status === "processing_error"
                    ) {
                        statusLabel =
                            "Erreur de traitement";
                    }


                    // ----------------------------------
                    // PAYMENT PROOF
                    // ----------------------------------

                    let proofHTML = "";


                    if (request.proofUrl) {

                        proofHTML = `
                            <div class="payment-proof">
                                <a
                                    href="${escapeHTML(
                                        request.proofUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Voir la preuve
                                </a>
                            </div>
                        `;

                    }


                    // ----------------------------------
                    // ACTION BUTTONS
                    // ----------------------------------

                    let actionsHTML = "";


                    if (status === "pending") {

                        actionsHTML = `
                            <div class="request-actions">

                                <button
                                    type="button"
                                    class="approveBtn"
                                    data-id="${escapeHTML(
                                        request.id
                                    )}"
                                >
                                    ✓ Approuver
                                </button>

                                <button
                                    type="button"
                                    class="rejectBtn"
                                    data-id="${escapeHTML(
                                        request.id
                                    )}"
                                >
                                    ✕ Rejeter
                                </button>

                            </div>
                        `;

                    }

                    else if (
                        status === "processing"
                    ) {

                        actionsHTML = `
                            <div class="request-processing">
                                Traitement en cours...
                            </div>
                        `;

                    }


                    // ----------------------------------
                    // REQUEST CARD
                    // ----------------------------------

                    return `
                        <div
                            class="deposit-request-card"
                            data-id="${escapeHTML(
                                request.id
                            )}"
                        >

                            <div class="request-header">

                                <div>
                                    <h3>
                                        Dépôt
                                    </h3>

                                    <small>
                                        ID:
                                        ${escapeHTML(
                                            request.id
                                        )}
                                    </small>
                                </div>

                                <span
                                    class="request-status status-${escapeHTML(
                                        status
                                    )}"
                                >
                                    ${escapeHTML(
                                        statusLabel
                                    )}
                                </span>

                            </div>


                            <div class="request-user">

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <span>
                                    ${escapeHTML(email)}
                                </span>

                            </div>


                            <div class="request-details">

                                <div class="detail-item">

                                    <span>
                                        Montant
                                    </span>

                                    <strong>
                                        ${formatMoney(amount)}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Méthode
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            paymentMethod
                                        )}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Téléphone
                                    </span>

                                    <strong>
                                        ${escapeHTML(phone)}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Transaction ID
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            transactionId
                                        )}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Date du paiement
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            paymentDate
                                        )}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Date de demande
                                    </span>

                                    <strong>
                                        ${escapeHTML(createdAt)}
                                    </strong>

                                </div>

                            </div>


                            ${proofHTML}

                            ${actionsHTML}

                        </div>
                    `;

                }).join("");


            // ----------------------------------
            // ACTIVATE BUTTONS
            // ----------------------------------

            activateDepositButtons();

        });


    } catch (error) {

        console.error(
            "LOAD DEPOSITS ERROR:",
            error
        );

    }

}


// ==========================================
// 2. ACTIVATE DEPOSIT BUTTONS
// ==========================================

function activateDepositButtons() {

    // ----------------------------------
    // APPROVE BUTTONS
    // ----------------------------------

    const approveButtons =
        document.querySelectorAll(
            ".approveBtn"
        );


    approveButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;

                if (!id) return;

                await approveDeposit(id);

            }
        );

    });


    // ----------------------------------
    // REJECT BUTTONS
    // ----------------------------------

    const rejectButtons =
        document.querySelectorAll(
            ".rejectBtn"
        );


    rejectButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;

                if (!id) return;

                await rejectDeposit(id);

            }
        );

    });

}


// ==========================================
// 3. EXPOSE FUNCTIONS
// ==========================================

window.loadDeposits =
    loadDeposits;

window.activateDepositButtons =
    activateDepositButtons;


// ==========================================
// 4. PART 3 READY
// ==========================================

console.log(
    "ADMIN.JS PART 3 READY"
);
// ==========================================
// ADMIN.JS — PART 4
// Deposit Approve / Reject
// ==========================================


// ==========================================
// 1. APPROVE DEPOSIT
// ==========================================

async function approveDeposit(id) {

    if (!id) {
        console.error("Deposit ID is missing.");
        return;
    }

    try {

        await window.waitForAdmin();

        // ----------------------------------
        // CONFIRMATION
        // ----------------------------------

        const confirmed = confirm(
            "Voulez-vous vraiment approuver ce dépôt ?"
        );

        if (!confirmed) return;


        // ----------------------------------
        // DATABASE REFERENCES
        // ----------------------------------

        const depositRef =
            ref(db, `depositRequests/${id}`);


        // ----------------------------------
        // LOCK REQUEST
        // pending → processing
        // ----------------------------------

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


                    // Already processed
                    if (status !== "pending") {
                        return;
                    }


                    return {
                        ...currentData,
                        status: "processing",
                        processingAt: Date.now()
                    };

                }
            );


        // ----------------------------------
        // LOCK FAILED
        // ----------------------------------

        if (!lockResult.committed) {

            alert(
                "Ce dépôt a déjà été traité ou n'existe plus."
            );

            return;
        }


        const deposit =
            lockResult.snapshot.val() || {};


        // ----------------------------------
        // VALIDATE DATA
        // ----------------------------------

        const uid =
            deposit.uid;

        const amount =
            numberValue(deposit.amount);


        if (!uid) {

            throw new Error(
                "UID utilisateur manquant."
            );
        }


        if (!Number.isFinite(amount) || amount <= 0) {

            throw new Error(
                "Montant du dépôt invalide."
            );
        }


        // ----------------------------------
        // USER REFERENCE
        // ----------------------------------

        const userRef =
            ref(db, `users/${uid}`);


        // ----------------------------------
        // CREDIT USER BALANCE
        // ----------------------------------

        const userResult =
            await runTransaction(
                userRef,
                (currentUser) => {

                    if (!currentUser) {
                        return;
                    }


                    const user =
                        currentUser || {};


                    const balance =
                        numberValue(
                            user.balance
                        );


                    const totalDeposits =
                        numberValue(
                            user.totalDeposits
                        );


                    const totalTransactions =
                        numberValue(
                            user.totalTransactions
                        );


                    return {
                        ...user,

                        balance:
                            balance + amount,

                        totalDeposits:
                            totalDeposits + amount,

                        totalTransactions:
                            totalTransactions + 1,

                        updatedAt:
                            Date.now()
                    };

                }
            );


        // ----------------------------------
        // USER UPDATE FAILED
        // ----------------------------------

        if (!userResult.committed) {

            throw new Error(
                "Impossible de mettre à jour le compte utilisateur."
            );
        }


        // ----------------------------------
        // CREATE TRANSACTION
        // ----------------------------------

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionData = {

            uid: uid,

            type: "deposit",

            amount: amount,

            status: "approved",

            depositId: id,

            paymentMethod:
                deposit.paymentMethod || "",

            transactionId:
                deposit.transactionId || "",

            createdAt:
                Date.now(),

            approvedAt:
                Date.now(),

            approvedBy:
                window.adminState.currentAdmin?.uid || ""

        };


        await set(
            transactionRef,
            transactionData
        );


        // ----------------------------------
        // FINALIZE DEPOSIT
        // processing → approved
        // ----------------------------------

        await update(
            depositRef,
            {
                status: "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    window.adminState.currentAdmin?.uid || "",

                transactionKey:
                    transactionRef.key
            }
        );


        // ----------------------------------
        // SUCCESS
        // ----------------------------------

        alert(
            "Dépôt approuvé avec succès."
        );


        console.log(
            "DEPOSIT APPROVED:",
            id,
            amount,
            uid
        );


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        // ----------------------------------
        // MARK PROCESSING ERROR
        // ----------------------------------

        try {

            await update(
                ref(db, `depositRequests/${id}`),
                {
                    status: "processing_error",

                    errorMessage:
                        error.message || "Erreur inconnue",

                    errorAt:
                        Date.now(),

                    errorBy:
                        window.adminState.currentAdmin?.uid || ""
                }
            );

        } catch (updateError) {

            console.error(
                "ERROR UPDATING DEPOSIT STATUS:",
                updateError
            );

        }


        alert(
            "Erreur lors de l'approbation du dépôt :\n" +
            (error.message || "Erreur inconnue")
        );

    }

}


// ==========================================
// 2. REJECT DEPOSIT
// ==========================================

async function rejectDeposit(id) {

    if (!id) {
        console.error("Deposit ID is missing.");
        return;
    }


    try {

        await window.waitForAdmin();


        // ----------------------------------
        // CONFIRMATION
        // ----------------------------------

        const confirmed = confirm(
            "Voulez-vous vraiment rejeter ce dépôt ?"
        );

        if (!confirmed) return;


        const depositRef =
            ref(db, `depositRequests/${id}`);


        // ----------------------------------
        // ATOMIC REJECT
        // pending → rejected
        // ----------------------------------

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


                    if (status !== "pending") {
                        return;
                    }


                    return {
                        ...currentData,

                        status: "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            window.adminState.currentAdmin?.uid || ""
                    };

                }
            );


        // ----------------------------------
        // REJECT FAILED
        // ----------------------------------

        if (!result.committed) {

            alert(
                "Ce dépôt a déjà été traité ou n'existe plus."
            );

            return;
        }


        // ----------------------------------
        // SUCCESS
        // ----------------------------------

        alert(
            "Dépôt rejeté."
        );


        console.log(
            "DEPOSIT REJECTED:",
            id
        );


    } catch (error) {

        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        alert(
            "Erreur lors du rejet du dépôt :\n" +
            (error.message || "Erreur inconnue")
        );

    }

}


// ==========================================
// 3. EXPOSE FUNCTIONS
// ==========================================

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;


// ==========================================
// 4. PART 4 READY
// ==========================================

console.log(
    "ADMIN.JS PART 4 READY"
);

// ==========================================
// ADMIN.JS — PART 5
// Withdraw Requests
// ==========================================


// ==========================================
// 1. LOAD WITHDRAW REQUESTS
// ==========================================

async function loadWithdraws() {

    try {

        await window.waitForAdmin();

        console.log("Loading withdraw requests...");


        const withdrawsRef =
            ref(db, "withdrawRequests");


        onValue(withdrawsRef, async (snapshot) => {

            const container =
                document.getElementById("withdrawRequests");


            if (!container) {

                console.warn(
                    "withdrawRequests container not found"
                );

                return;
            }


            // ----------------------------------
            // EMPTY STATE
            // ----------------------------------

            if (!snapshot.exists()) {

                container.innerHTML = `
                    <div class="empty-state">
                        Aucun retrait trouvé.
                    </div>
                `;

                return;
            }


            const requests = [];


            // ----------------------------------
            // GET WITHDRAW REQUESTS
            // ----------------------------------

            snapshot.forEach((child) => {

                const data =
                    child.val() || {};

                requests.push({
                    id: child.key,
                    ...data
                });

            });


            // ----------------------------------
            // SORT — NEWEST FIRST
            // ----------------------------------

            requests.sort((a, b) => {

                return (
                    numberValue(b.createdAt) -
                    numberValue(a.createdAt)
                );

            });


            // ----------------------------------
            // LOAD USERS
            // ----------------------------------

            const userCache = {};


            await Promise.all(

                requests.map(async (request) => {

                    if (!request.uid) return;


                    try {

                        const userSnapshot =
                            await get(
                                ref(
                                    db,
                                    `users/${request.uid}`
                                )
                            );


                        if (userSnapshot.exists()) {

                            userCache[request.uid] =
                                userSnapshot.val();

                        }

                    } catch (error) {

                        console.error(
                            "WITHDRAW USER LOAD ERROR:",
                            request.uid,
                            error
                        );

                    }

                })

            );


            // ----------------------------------
            // RENDER WITHDRAW REQUESTS
            // ----------------------------------

            container.innerHTML =
                requests.map((request) => {

                    const status =
                        normalizeStatus(
                            request.status
                        );


                    const amount =
                        numberValue(
                            request.amount
                        );


                    const user =
                        userCache[request.uid] || {};


                    const name =
                        user.name ||
                        user.fullName ||
                        user.username ||
                        "Utilisateur";


                    const email =
                        user.email ||
                        request.email ||
                        "";


                    const phone =
                        request.phone ||
                        request.withdrawPhone ||
                        user.phone ||
                        "-";


                    const paymentMethod =
                        request.paymentMethod ||
                        request.method ||
                        "-";


                    const createdAt =
                        request.createdAt
                            ? new Date(
                                numberValue(
                                    request.createdAt
                                )
                            ).toLocaleString("fr-FR")
                            : "-";


                    // ----------------------------------
                    // STATUS LABEL
                    // ----------------------------------

                    let statusLabel =
                        "En attente";


                    if (status === "approved") {

                        statusLabel =
                            "Approuvé";

                    }

                    else if (status === "rejected") {

                        statusLabel =
                            "Rejeté";

                    }

                    else if (status === "processing") {

                        statusLabel =
                            "Traitement...";

                    }

                    else if (
                        status === "processing_error"
                    ) {

                        statusLabel =
                            "Erreur de traitement";

                    }


                    // ----------------------------------
                    // ACTION BUTTONS
                    // ----------------------------------

                    let actionsHTML = "";


                    if (status === "pending") {

                        actionsHTML = `
                            <div class="request-actions">

                                <button
                                    type="button"
                                    class="withdrawApproveBtn"
                                    data-id="${escapeHTML(
                                        request.id
                                    )}"
                                >
                                    ✓ Approuver
                                </button>


                                <button
                                    type="button"
                                    class="withdrawRejectBtn"
                                    data-id="${escapeHTML(
                                        request.id
                                    )}"
                                >
                                    ✕ Rejeter
                                </button>

                            </div>
                        `;

                    }

                    else if (
                        status === "processing"
                    ) {

                        actionsHTML = `
                            <div class="request-processing">
                                Traitement en cours...
                            </div>
                        `;

                    }


                    // ----------------------------------
                    // REQUEST CARD
                    // ----------------------------------

                    return `
                        <div
                            class="withdraw-request-card"
                            data-id="${escapeHTML(
                                request.id
                            )}"
                        >

                            <div class="request-header">

                                <div>

                                    <h3>
                                        Retrait
                                    </h3>

                                    <small>
                                        ID:
                                        ${escapeHTML(
                                            request.id
                                        )}
                                    </small>

                                </div>


                                <span
                                    class="request-status status-${escapeHTML(
                                        status
                                    )}"
                                >
                                    ${escapeHTML(
                                        statusLabel
                                    )}
                                </span>

                            </div>


                            <div class="request-user">

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <span>
                                    ${escapeHTML(email)}
                                </span>

                            </div>


                            <div class="request-details">

                                <div class="detail-item">

                                    <span>
                                        Montant
                                    </span>

                                    <strong>
                                        ${formatMoney(amount)}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Méthode
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            paymentMethod
                                        )}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Numéro
                                    </span>

                                    <strong>
                                        ${escapeHTML(phone)}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        UID
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            request.uid || "-"
                                        )}
                                    </strong>

                                </div>


                                <div class="detail-item">

                                    <span>
                                        Date de demande
                                    </span>

                                    <strong>
                                        ${escapeHTML(createdAt)}
                                    </strong>

                                </div>

                            </div>


                            ${actionsHTML}

                        </div>
                    `;

                }).join("");


            // ----------------------------------
            // ACTIVATE BUTTONS
            // ----------------------------------

            activateWithdrawButtons();

        });


    } catch (error) {

        console.error(
            "LOAD WITHDRAWS ERROR:",
            error
        );

    }

}


// ==========================================
// 2. ACTIVATE WITHDRAW BUTTONS
// ==========================================

function activateWithdrawButtons() {


    // ----------------------------------
    // APPROVE BUTTONS
    // ----------------------------------

    const approveButtons =
        document.querySelectorAll(
            ".withdrawApproveBtn"
        );


    approveButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;


                if (!id) {

                    console.error(
                        "Withdraw ID missing."
                    );

                    return;
                }


                await approveWithdraw(id);

            }
        );

    });


    // ----------------------------------
    // REJECT BUTTONS
    // ----------------------------------

    const rejectButtons =
        document.querySelectorAll(
            ".withdrawRejectBtn"
        );


    rejectButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const id =
                    button.dataset.id;


                if (!id) {

                    console.error(
                        "Withdraw ID missing."
                    );

                    return;
                }


                await rejectWithdraw(id);

            }
        );

    });

}


// ==========================================
// 3. EXPOSE FUNCTIONS
// ==========================================

window.loadWithdraws =
    loadWithdraws;


window.activateWithdrawButtons =
    activateWithdrawButtons;


// ==========================================
// 4. PART 5 READY
// ==========================================

console.log(
    "ADMIN.JS PART 5 READY"
);

// ==========================================
// ADMIN.JS — PART 6
// Withdraw Approve / Reject
// ==========================================


// ==========================================
// 1. APPROVE WITHDRAW
// ==========================================

async function approveWithdraw(id) {

    if (!id) {
        console.error("Withdraw ID is missing.");
        return;
    }

    try {

        await window.waitForAdmin();


        const confirmed = confirm(
            "Voulez-vous vraiment approuver ce retrait ?"
        );

        if (!confirmed) return;


        const withdrawRef =
            ref(db, `withdrawRequests/${id}`);


        // ----------------------------------
        // LOCK REQUEST
        // pending -> processing
        // ----------------------------------

        const lockResult =
            await runTransaction(
                withdrawRef,
                (currentData) => {

                    if (!currentData) return;

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
                            window.adminState
                                .currentAdmin?.uid || ""
                    };
                }
            );


        if (!lockResult.committed) {

            alert(
                "Ce retrait a déjà été traité ou n'existe plus."
            );

            return;
        }


        // ----------------------------------
        // GET WITHDRAW DATA
        // ----------------------------------

        const withdraw =
            lockResult.snapshot.val() || {};


        const uid =
            withdraw.uid;


        const amount =
            numberValue(
                withdraw.amount
            );


        if (!uid) {

            throw new Error(
                "UID utilisateur manquant."
            );
        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new Error(
                "Montant du retrait invalide."
            );
        }


        // ----------------------------------
        // UPDATE USER BALANCE
        // ----------------------------------

        const userRef =
            ref(db, `users/${uid}`);


        const userResult =
            await runTransaction(
                userRef,
                (currentUser) => {

                    if (!currentUser) {
                        return;
                    }


                    const user =
                        currentUser || {};


                    const balance =
                        numberValue(
                            user.balance
                        );


                    // ----------------------------------
                    // PREVENT NEGATIVE BALANCE
                    // ----------------------------------

                    if (balance < amount) {

                        return;
                    }


                    const totalWithdrawals =
                        numberValue(
                            user.totalWithdrawals
                        );


                    const totalTransactions =
                        numberValue(
                            user.totalTransactions
                        );


                    return {

                        ...user,

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


        // ----------------------------------
        // CHECK USER TRANSACTION
        // ----------------------------------

        if (!userResult.committed) {

            throw new Error(
                "Solde insuffisant ou impossible de mettre à jour le compte utilisateur."
            );
        }


        // ----------------------------------
        // CREATE TRANSACTION
        // ----------------------------------

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionData = {

            uid: uid,

            type: "withdraw",

            amount: amount,

            status: "approved",

            withdrawId: id,

            paymentMethod:
                withdraw.paymentMethod ||
                withdraw.method ||
                "",

            phone:
                withdraw.phone ||
                withdraw.withdrawPhone ||
                "",

            createdAt:
                Date.now(),

            approvedAt:
                Date.now(),

            approvedBy:
                window.adminState
                    .currentAdmin?.uid || ""
        };


        await set(
            transactionRef,
            transactionData
        );


        // ----------------------------------
        // FINALIZE WITHDRAW REQUEST
        // ----------------------------------

        await update(
            withdrawRef,
            {

                status: "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    window.adminState
                        .currentAdmin?.uid || "",

                transactionKey:
                    transactionRef.key
            }
        );


        alert(
            "Retrait approuvé avec succès."
        );


        console.log(
            "WITHDRAW APPROVED:",
            id,
            amount,
            uid
        );

    }

    catch (error) {

        console.error(
            "APPROVE WITHDRAW ERROR:",
            error
        );


        // ----------------------------------
        // MARK PROCESSING ERROR
        // ----------------------------------

        try {

            await update(
                ref(
                    db,
                    `withdrawRequests/${id}`
                ),
                {

                    status:
                        "processing_error",

                    errorMessage:
                        error.message ||
                        "Erreur inconnue",

                    errorAt:
                        Date.now(),

                    errorBy:
                        window.adminState
                            .currentAdmin?.uid || ""
                }
            );

        }

        catch (updateError) {

            console.error(
                "ERROR UPDATING WITHDRAW STATUS:",
                updateError
            );

        }


        alert(
            "Erreur lors de l'approbation du retrait :\n" +
            (
                error.message ||
                "Erreur inconnue"
            )
        );

    }

}


// ==========================================
// 2. REJECT WITHDRAW
// ==========================================

async function rejectWithdraw(id) {

    if (!id) {

        console.error(
            "Withdraw ID is missing."
        );

        return;
    }


    try {

        await window.waitForAdmin();


        const confirmed = confirm(
            "Voulez-vous vraiment rejeter ce retrait ?"
        );

        if (!confirmed) return;


        const withdrawRef =
            ref(
                db,
                `withdrawRequests/${id}`
            );


        // ----------------------------------
        // pending -> rejected
        // ----------------------------------

        const result =
            await runTransaction(
                withdrawRef,
                (currentData) => {

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

                        status: "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            window.adminState
                                .currentAdmin?.uid || ""
                    };

                }
            );


        if (!result.committed) {

            alert(
                "Ce retrait a déjà été traité ou n'existe plus."
            );

            return;
        }


        alert(
            "Retrait rejeté."
        );


        console.log(
            "WITHDRAW REJECTED:",
            id
        );

    }

    catch (error) {

        console.error(
            "REJECT WITHDRAW ERROR:",
            error
        );


        alert(
            "Erreur lors du rejet du retrait :\n" +
            (
                error.message ||
                "Erreur inconnue"
            )
        );

    }

}


// ==========================================
// 3. EXPOSE FUNCTIONS
// ==========================================

window.approveWithdraw =
    approveWithdraw;


window.rejectWithdraw =
    rejectWithdraw;


// ==========================================
// 4. PART 6 READY
// ==========================================

console.log(
    "ADMIN.JS PART 6 READY"
);



