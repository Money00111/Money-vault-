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
    get
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
// AUTHENTICATION
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    // Admin Email Check
    if (user.email !== ADMIN_EMAIL) {

        alert("Access Denied!");

        await signOut(auth);

        window.location.href = "dashboard.html";

        return;

    }

    currentAdmin = user;

    try {

        const snapshot = await get(
            ref(db, "users/" + user.uid)
        );

        if (snapshot.exists()) {

            const data = snapshot.val();

            if (adminName) {

                adminName.textContent =
                    data.fullName || "Administrator";

            }

        } else {

            if (adminName) {

                adminName.textContent = "Administrator";

            }

        }

    } catch (error) {

        console.error(error);

    }

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

    console.log("✅ Admin Logged In");

});

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar?.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Logout from Admin Panel?");

    if (!ok) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// PAGE ANIMATION
// ======================================

window.addEventListener("load", () => {

    document.body.style.opacity = "0";

    setTimeout(() => {

        document.body.style.transition = "opacity .4s";

        document.body.style.opacity = "1";

    }, 100);

});

// ======================================
// HIDE LOADING
// ======================================

window.addEventListener("load", () => {

    setTimeout(() => {

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

    }, 800);

});

// ======================================
// READY
// ======================================

console.log("=================================");
console.log(" Money Vault Admin Ready ");
console.log(" Authentication Connected ");
console.log(" Admin Email Verified ");
console.log(" Realtime Database Connected ");
console.log("=================================");

// ======================================
// ADMIN.JS - PART 2
// LOAD DEPOSITS + APPROVE + REJECT
// ======================================

import {
    ref,
    onValue,
    update,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const depositRequests =
document.getElementById("depositRequests");

// ======================================
// LOAD DEPOSITS
// ======================================

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

                <h3>
                ${Number(data.amount).toLocaleString()} RWF
                </h3>

                <p>
                Email:
                ${data.email}
                </p>

                <p>
                Phone:
                ${data.senderPhone}
                </p>

                <p>
                Transaction:
                ${data.transactionId}
                </p>

                <p>
                Status:
                <strong>${data.status}</strong>
                </p>

                <div class="action-buttons">

                    <button
                    class="approveBtn"
                    data-id="${data.key}">
                    Approve
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
// APPROVE
// ======================================

async function approveDeposit(id) {

    try {

        const depositRef =
        ref(db, "depositRequests/" + id);

        const snap =
        await get(depositRef);

        if (!snap.exists()) return;

        const deposit =
        snap.val();

        if (deposit.status === "Approved") {

            alert("Already Approved");

            return;

        }

        // USER BALANCE

        const userRef =
        ref(db, "users/" + deposit.uid);

        const userSnap =
        await get(userRef);

        if (!userSnap.exists()) return;

        const user =
        userSnap.val();

        const currentBalance =
        Number(user.balance || 0);

        const newBalance =
        currentBalance +
        Number(deposit.amount);

        // UPDATE USER

        await update(userRef, {

            balance: newBalance

        });

        // UPDATE DEPOSIT

        await update(depositRef, {

            status: "Approved",

            approvedAt: Date.now()

        });

        alert("Deposit Approved");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// REJECT
// ======================================

async function rejectDeposit(id) {

    try {

        await update(

            ref(db, "depositRequests/" + id),

            {

                status: "Rejected",

                rejectedAt: Date.now()

            }

        );

        alert("Deposit Rejected");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// BUTTONS
// ======================================

function activateButtons() {

    document
    .querySelectorAll(".approveBtn")
    .forEach((btn) => {

        btn.onclick = () => {

            const id =
            btn.dataset.id;

            approveDeposit(id);

        };

    });

    document
    .querySelectorAll(".rejectBtn")
    .forEach((btn) => {

        btn.onclick = () => {

            const id =
            btn.dataset.id;

            rejectDeposit(id);

        };

    });

}

// ======================================
// START
// ======================================

loadDeposits();

console.log("✅ Admin Part 2 Loaded");

