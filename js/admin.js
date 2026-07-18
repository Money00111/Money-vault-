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

