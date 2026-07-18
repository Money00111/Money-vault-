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

// ======================================
// ELEMENTS
// ======================================

const depositRequests =
document.getElementById("depositRequests");

// ======================================
// LOAD DEPOSITS
// ======================================
function loadDeposits() {

    const depositsRef = ref(db, "depositRequests");

    onValue(depositsRef, (snapshot) => {

        ...

    });

 }

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
// APPROVE
// ======================================

async function approveDeposit(id) {
if (!confirm("Approve this deposit?")) {
    return;
}
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
    balance: newBalance,
    totalDeposits:
        Number(user.totalDeposits || 0) + Number(deposit.amount),
    totalTransactions:
        Number(user.totalTransactions || 0) + 1
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
        if (!confirm("Reject this deposit?")) {
    return;
}

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

            totalUsers.textContent =
                users.toLocaleString();

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

                if (data.status === "Pending") {

                    pending++;

                }

                if (data.status === "Approved") {

                    approved++;

                }

                if (data.status === "Rejected") {

                    rejected++;

                }

            });

        }

        if (totalDeposits) {

            totalDeposits.textContent =
                deposits.toLocaleString();

        }

        if (totalPending) {

            totalPending.textContent =
                pending.toLocaleString();

        }

        if (totalApproved) {

            totalApproved.textContent =
                approved.toLocaleString();

        }

        if (totalRejected) {

            totalRejected.textContent =
                rejected.toLocaleString();

        }

        if (totalAmount) {

            totalAmount.textContent =
                amount.toLocaleString() + " RWF";

        }

    });

}

// ======================================
// START
// ======================================

loadStatistics();

console.log("✅ Admin Part 3 Loaded");

// ======================================
// ADMIN.JS - PART 4
// SEARCH + FILTER + VIEW PROOF
// ======================================

// ======================================
// ELEMENTS
// ======================================

const searchInput =
document.getElementById("searchInput");

const filterStatus =
document.getElementById("filterStatus");

// ======================================
// SEARCH
// ======================================

searchInput?.addEventListener("keyup", () => {

    const keyword =
    searchInput.value.toLowerCase();

    const cards =
    document.querySelectorAll(".request-card");

    cards.forEach((card) => {

        if (
            card.innerText
            .toLowerCase()
            .includes(keyword)
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});

// ======================================
// FILTER STATUS
// ======================================

filterStatus?.addEventListener("change", () => {

    const value = filterStatus.value;

    const cards =
    document.querySelectorAll(".request-card");

    cards.forEach((card) => {

        const status =
        card.querySelector("strong").innerText;

        if (
            value === "All" ||
            status === value
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});

// ======================================
// VIEW SCREENSHOT
// ======================================

document.addEventListener("click", (e) => {

    if (
        e.target.classList.contains("viewProof")
    ) {

        const image =
        e.target.dataset.image;

        if (!image) {

            alert("Screenshot not found.");

            return;

        }

        window.open(image, "_blank");

    }

});

// ======================================
// COPY TRANSACTION ID
// ======================================

document.addEventListener("click", async (e) => {

    if (
        e.target.classList.contains("copyTransaction")
    ) {

        const id =
        e.target.dataset.transaction;

        await navigator.clipboard.writeText(id);

        alert("Transaction ID Copied");

    }

});

// ======================================
// READY
// ======================================

console.log("✅ Admin Part 4 Loaded");
