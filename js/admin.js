// ======================================
// ADMIN.JS - PART 1
// AUTHENTICATION + SETUP
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ADMIN EMAIL
// ======================================

const ADMIN_EMAIL = "Niyigenaepizo9@gmail.com";

// ======================================
// CURRENT ADMIN
// ======================================

let currentAdmin = null;

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminName = document.getElementById("adminName");

// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    if (
        !user.email ||
        user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {

        alert("Access Denied!");

        await signOut(auth);

        window.location.replace("login.html");

        return;
    }

    currentAdmin = user;

    try {

        const snap = await get(
            ref(db, "users/" + user.uid)
        );

        if (snap.exists()) {

            const data = snap.val();

            if (adminName) {
                adminName.textContent =
                    data.fullName || "Administrator";
            }

        } else {

            if (adminName) {
                adminName.textContent =
                    "Administrator";
            }

        }

    } catch (error) {

        console.error(error);

    }

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    console.log("Admin Login Success");

});

// ======================================
// MENU
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar?.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

    if (!confirm("Logout?")) return;

    try {

        await signOut(auth);

        window.location.replace("login.html");

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// PAGE LOAD
// ======================================

window.addEventListener("load", () => {

    document.body.style.opacity = "1";

    if (loadingScreen) {

        setTimeout(() => {

            loadingScreen.style.display = "none";

        }, 1000);

    }

});

// ======================================
// GLOBAL ERROR
// ======================================

window.addEventListener("error", (e) => {

    console.error(e.error);

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

});

// ======================================

console.log("✅ Admin Part 1 Loaded Successfully");

// ======================================
// ADMIN.JS - PART 2
// LOAD DEPOSITS + APPROVE + REJECT
// ======================================

const depositRequests =
document.getElementById("depositRequests");

function loadDeposits() {

    const depositsRef =
    ref(db, "depositRequests");

    onValue(depositsRef, (snapshot) => {

        if (!depositRequests) return;

        depositRequests.innerHTML = "";

        if (!snapshot.exists()) {

            depositRequests.innerHTML = `
            <div class="empty-card">
                <h3>No Deposit Requests</h3>
            </div>
            `;

            return;
        }

        const deposits = [];

        snapshot.forEach((child) => {

            deposits.unshift({
                key: child.key,
                ...child.val()
            });

        });

        deposits.forEach((data) => {

            depositRequests.innerHTML += `
            <div class="request-card">

                <h3>${Number(data.amount).toLocaleString()} RWF</h3>

                <p>Email: ${data.email}</p>

                <p>Phone: ${data.senderPhone}</p>

                <p>Transaction: ${data.transactionId}</p>

                <p>Status: <strong>${data.status}</strong></p>

                <div class="action-buttons">

                    <button
                    class="approveBtn"
                    data-id="${data.key}">
                    Approve
                    </button>

                    <button
                    class="viewProof"
                    data-image="${data.proofImage}">
                    View Screenshot
                    </button>

                    <button
                    class="copyTransaction"
                    data-transaction="${data.transactionId}">
                    Copy Transaction ID
                    </button>

                    <button
                    class="rejectBtn"
                    data-id="${data.key}">
                    Reject
                    </button>

                </div>

            </div>
            `;

        });

        activateButtons();

    });

    }

// ======================================
// ADMIN.JS - PART 3
// DASHBOARD STATISTICS
// ======================================

// ======================================
// ELEMENTS
// ======================================

const totalUsers = document.getElementById("totalUsers");
const totalDeposits = document.getElementById("totalDeposits");
const totalPending = document.getElementById("totalPending");
const totalApproved = document.getElementById("totalApproved");
const totalRejected = document.getElementById("totalRejected");
const totalAmount = document.getElementById("totalAmount");

// ======================================
// LOAD STATISTICS
// ======================================

function loadStatistics() {

    // USERS
    onValue(ref(db, "users"), (snapshot) => {

        let users = 0;

        if (snapshot.exists()) {
            snapshot.forEach(() => {
                users++;
            });
        }

        if (totalUsers) {
            totalUsers.textContent = users.toLocaleString();
        }

    });

    // DEPOSITS
    onValue(ref(db, "depositRequests"), (snapshot) => {

        let deposits = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let amount = 0;

        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const data = child.val();

                deposits++;

                amount += Number(data.amount || 0);

                switch (data.status) {

                    case "Pending":
                        pending++;
                        break;

                    case "Approved":
                        approved++;
                        break;

                    case "Rejected":
                        rejected++;
                        break;
                }

            });

        }

        if (totalDeposits) {
            totalDeposits.textContent = deposits.toLocaleString();
        }

        if (totalPending) {
            totalPending.textContent = pending.toLocaleString();
        }

        if (totalApproved) {
            totalApproved.textContent = approved.toLocaleString();
        }

        if (totalRejected) {
            totalRejected.textContent = rejected.toLocaleString();
        }

        if (totalAmount) {
            totalAmount.textContent =
                amount.toLocaleString() + " RWF";
        }

    });

}

// ======================================
// START STATISTICS
// ======================================

loadStatistics();

console.log("✅ Admin Part 3 Loaded Successfully");

// ======================================
// ADMIN.JS - PART 4
// SEARCH + FILTER + VIEW SCREENSHOT
// Money Vault
// ======================================

// ======================================
// ELEMENTS
// ======================================

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

// ======================================
// SEARCH REQUESTS
// ======================================

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const keyword = searchInput.value.toLowerCase();

        document.querySelectorAll(".request-card").forEach((card) => {

            const text = card.textContent.toLowerCase();

            card.style.display =
                text.includes(keyword) ? "block" : "none";

        });

    });

}

// ======================================
// FILTER STATUS
// ======================================

if (filterStatus) {

    filterStatus.addEventListener("change", () => {

        const value = filterStatus.value;

        document.querySelectorAll(".request-card").forEach((card) => {

            const statusElement = card.querySelector(".status-text");

            if (!statusElement) return;

            const status = statusElement.textContent.trim();

            if (value === "All" || value === status) {

                card.style.display = "block";

            } else {

                card.style.display = "none";

            }

        });

    });

}

// ======================================
// GLOBAL BUTTON EVENTS
// ======================================

document.addEventListener("click", async (e) => {

    // ===========================
    // VIEW SCREENSHOT
    // ===========================

    if (e.target.classList.contains("viewProof")) {

        const image = e.target.dataset.image;

        if (!image) {

            alert("Screenshot not found.");

            return;

        }

        window.open(image, "_blank");

    }

    // ===========================
    // COPY TRANSACTION ID
    // ===========================

    if (e.target.classList.contains("copyTransaction")) {

        const id = e.target.dataset.transaction;

        if (!id) {

            alert("Transaction ID not found.");

            return;

        }

        try {

            await navigator.clipboard.writeText(id);

            alert("Transaction ID Copied");

        } catch (error) {

            console.error(error);

            alert("Failed to copy.");

        }

    }

});

// ======================================
// PAGE READY
// ======================================

window.addEventListener("load", () => {

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

    console.log("=================================");
    console.log(" Admin Panel Ready");
    console.log(" Search Ready");
    console.log(" Filter Ready");
    console.log(" View Screenshot Ready");
    console.log(" Copy Transaction Ready");
    console.log("=================================");

});
