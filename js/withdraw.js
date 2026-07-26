// ======================================
// WITHDRAW.JS - PART 1A
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    push,
    set,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// HTML ELEMENTS
// ======================================

const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

const logoutBtn =
document.getElementById("logoutBtn");

const loadingScreen =
document.getElementById("loadingScreen");

const withdrawForm =
document.getElementById("withdrawForm");

const availableBalance =
document.getElementById("availableBalance");

const vipStatus =
document.getElementById("vipStatus");

const withdrawAmount =
document.getElementById("withdrawAmount");

const paymentMethod =
document.getElementById("paymentMethod");

const receiverPhone =
document.getElementById("receiverPhone");

const accountName =
document.getElementById("accountName");

const withdrawReason =
document.getElementById("withdrawReason");

const confirmWithdraw =
document.getElementById("confirmWithdraw");

const submitBtn =
document.querySelector(".submit-btn");


// ======================================
// CURRENT USER
// ======================================

let currentUser = null;


// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    loadingScreen.style.display = "none";

    loadUserData();

});


// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Logout?");

    if (!ok) return;

    await signOut(auth);

    window.location.href = "login.html";

});

// ======================================
// WITHDRAW.JS - PART 1B.1
// LOAD USER DATA (Realtime Database)
// ======================================

async function loadUserData() {

    if (!currentUser) return;

    try {

        const userRef = ref(db, "users/" + currentUser.uid);

        const snapshot = await get(userRef);

        if (!snapshot.exists()) {

            availableBalance.textContent = "0 RWF";

            vipStatus.textContent = "VIP 0";

            return;

        }

        const user = snapshot.val();

        const balance = Number(user.balance || 0);

        availableBalance.textContent =
            balance.toLocaleString() + " RWF";

        vipStatus.textContent =
            user.vipPlan || "VIP 0";

        // Bika balance kugira ngo ikoreshwe muri validation
        window.userBalance = balance;

    } catch (error) {

        console.error(error);

        alert("Failed to load account information.");

    }

}


// ======================================
// LIVE BALANCE REFRESH
// ======================================

function startBalanceListener() {

    if (!currentUser) return;

    const userRef = ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {

        if (!snapshot.exists()) return;

        const user = snapshot.val();

        const balance = Number(user.balance || 0);

        availableBalance.textContent =
            balance.toLocaleString() + " RWF";

        vipStatus.textContent =
            user.vipPlan || "VIP 0";

        window.userBalance = balance;

    });

}


// ======================================
// START LIVE LISTENER
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    currentUser = user;

    startBalanceListener();

});


// ======================================
// WITHDRAW.JS - PART 1B.2
// WITHDRAW CALCULATOR
// ======================================

// Summary Elements

const enteredAmount =
document.getElementById("enteredAmount");

const withdrawFee =
document.getElementById("withdrawFee");

const receiveAmount =
document.getElementById("receiveAmount");

const summaryAmount =
document.getElementById("summaryAmount");

const summaryFee =
document.getElementById("summaryFee");

const summaryReceive =
document.getElementById("summaryReceive");


// ======================================
// UPDATE CALCULATOR
// ======================================

function updateWithdrawCalculator() {

    const amount = Number(withdrawAmount.value) || 0;

    const balance = Number(window.userBalance || 0);

    const fee = Math.round(amount * 0.05);

    const receive = amount - fee;

    enteredAmount.textContent =
        amount.toLocaleString() + " RWF";

    withdrawFee.textContent =
        fee.toLocaleString() + " RWF";

    receiveAmount.textContent =
        receive.toLocaleString() + " RWF";

    summaryAmount.textContent =
        amount.toLocaleString() + " RWF";

    summaryFee.textContent =
        fee.toLocaleString() + " RWF";

    summaryReceive.textContent =
        receive.toLocaleString() + " RWF";

    // Validation

    if (amount === 0) {

        submitBtn.disabled = true;

        return;

    }

    if (amount < 2000) {

        submitBtn.disabled = true;

        return;

    }

    if (amount > 500000) {

        submitBtn.disabled = true;

        return;

    }

    if (amount > balance) {

        submitBtn.disabled = true;

        return;

    }

    submitBtn.disabled = false;

}


// ======================================
// LIVE INPUT
// ======================================

withdrawAmount?.addEventListener("input", () => {

    updateWithdrawCalculator();

});


// ======================================
// RESET SUMMARY
// ======================================

function resetCalculator() {

    enteredAmount.textContent = "0 RWF";

    withdrawFee.textContent = "0 RWF";

    receiveAmount.textContent = "0 RWF";

    summaryAmount.textContent = "0 RWF";

    summaryFee.textContent = "0 RWF";

    summaryReceive.textContent = "0 RWF";

    submitBtn.disabled = true;

}


// ======================================
// START
// ======================================

resetCalculator();

// ======================================
// WITHDRAW.JS - PART 2A
// SUBMIT WITHDRAW REQUEST
// ======================================

withdrawForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {

        alert("Please login first.");

        return;

    }

    if (!confirmWithdraw.checked) {

        alert("Please confirm the information.");

        return;

    }

    const amount = Number(withdrawAmount.value);

    const balance = Number(window.userBalance || 0);

    if (amount < 2000) {

        alert("Minimum withdraw is 2,000 RWF.");

        return;

    }

    if (amount > 500000) {

        alert("Maximum withdraw is 500,000 RWF.");

        return;

    }

    if (amount > balance) {

        alert("Insufficient Balance.");

        return;

    }

    submitBtn.disabled = true;

    submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {

        const fee = Math.round(amount * 0.05);

        const receive = amount - fee;

        const withdrawData = {

            uid: currentUser.uid,

            email: currentUser.email || "",

            amount: amount,

            fee: fee,

            receive: receive,

            paymentMethod: paymentMethod.value,

            phone: receiverPhone.value.trim(),

            accountName: accountName.value.trim(),

            reason: withdrawReason.value.trim(),

            status: "pending",

            createdAt: Date.now()

        };

        const withdrawRef =
            push(ref(db, "withdrawRequests"));

        await set(withdrawRef, withdrawData);

                // ======================================
        // SUCCESS
        // ======================================

        alert("Withdraw request submitted successfully.");

        withdrawForm.reset();

        resetCalculator();

        // Refresh balance display
        await loadUserData();

        // Update current status
        const withdrawStatus =
            document.getElementById("withdrawStatus");

        if (withdrawStatus) {

            withdrawStatus.textContent =
                "Pending Approval";

            withdrawStatus.className =
                "status pending";

        }

    } catch (error) {

        console.error(error);

        alert(error.message || "Failed to submit withdraw request.");

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML = `

            <i class="fa-solid fa-paper-plane"></i>

            Submit Withdraw Request

        `;

    }

});

// ======================================
// WITHDRAW.JS - PART 3A.1
// LOAD WITHDRAW HISTORY
// ======================================

const historyList =
document.getElementById("historyList");

const withdrawStatus =
document.getElementById("withdrawStatus");

let withdrawHistory = {};

function loadWithdrawHistory() {

    if (!currentUser) return;

    const withdrawRef = ref(db, "withdrawRequests");

    onValue(withdrawRef, (snapshot) => {

        withdrawHistory = {};

        historyList.innerHTML = "";

        if (!snapshot.exists()) {

            historyList.innerHTML = `

                <div class="history-card empty">

                    <i class="fa-solid fa-wallet"></i>

                    <h3>No Withdraw History</h3>

                    <p>Your withdraw requests will appear here.</p>

                </div>

            `;

            withdrawStatus.textContent =
                "No Withdraw Request";

            return;

        }

        snapshot.forEach((child) => {

            const id = child.key;

            const data = child.val();

            if (data.uid !== currentUser.uid) return;

            withdrawHistory[id] = data;

        });

        renderWithdrawHistory(withdrawHistory);

        updateWithdrawStatus();

    });

}


// ======================================
// START HISTORY
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    currentUser = user;

    loadWithdrawHistory();

});
// ======================================
// WITHDRAW.JS - PART 3A.2
// RENDER WITHDRAW HISTORY
// ======================================

function renderWithdrawHistory(data) {

    historyList.innerHTML = "";

    const requests = Object.entries(data);

    if (requests.length === 0) {

        historyList.innerHTML = `

        <div class="history-card empty">

            <i class="fa-solid fa-money-bill-transfer"></i>

            <h3>No Withdraw History</h3>

            <p>You haven't submitted any withdraw request yet.</p>

        </div>

        `;

        return;

    }

    requests.sort((a, b) => {

        return (b[1].createdAt || 0) - (a[1].createdAt || 0);

    });

    requests.forEach(([id, withdraw]) => {

        const status =
            (withdraw.status || "pending").toLowerCase();

        const card = document.createElement("div");

        card.className = "history-card";

        card.innerHTML = `

        <div class="history-info">

            <h3>

                ${Number(withdraw.amount || 0).toLocaleString()} RWF

            </h3>

            <p>

                <strong>Receive:</strong>

                ${Number(withdraw.receive || 0).toLocaleString()} RWF

            </p>

            <p>

                <strong>Fee:</strong>

                ${Number(withdraw.fee || 0).toLocaleString()} RWF

            </p>

            <p>

                <strong>Method:</strong>

                ${withdraw.paymentMethod || "-"}

            </p>

            <p>

                <strong>Phone:</strong>

                ${withdraw.phone || "-"}

            </p>

            <p>

                <strong>Account Name:</strong>

                ${withdraw.accountName || "-"}

            </p>

            <p>

                <strong>Reason:</strong>

                ${withdraw.reason || "-"}

            </p>

            <p>

                <strong>Date:</strong>

                ${formatWithdrawDate(withdraw.createdAt)}

            </p>

        </div>

        <span class="status ${status}">

            ${formatWithdrawStatus(status)}

        </span>

        `;

        historyList.appendChild(card);

    });

}

// ======================================
// WITHDRAW.JS - PART 3B.1
// UPDATE CURRENT WITHDRAW STATUS
// ======================================

function updateWithdrawStatus() {

    const requests = Object.values(withdrawHistory);

    if (requests.length === 0) {

        withdrawStatus.textContent = "No Withdraw Request";

        withdrawStatus.className = "status";

        return;

    }

    // Shyira izishya mbere

    requests.sort((a, b) => {

        return (b.createdAt || 0) - (a.createdAt || 0);

    });

    const latest = requests[0];

    const status =
        (latest.status || "pending").toLowerCase();

    withdrawStatus.textContent =
        formatWithdrawStatus(status);

    // Hindura class kugirango CSS ikore neza

    withdrawStatus.classList.remove(
        "pending",
        "approved",
        "rejected"
    );

    withdrawStatus.classList.add(status);

    // Optional color (niba CSS itarimo)

    switch (status) {

        case "approved":

            withdrawStatus.style.color = "#16a34a";

            break;

        case "rejected":

            withdrawStatus.style.color = "#dc2626";

            break;

        default:

            withdrawStatus.style.color = "#f59e0b";

            break;

    }

}
// ======================================
// WITHDRAW.JS - PART 3B.2
// HELPER FUNCTIONS
// ======================================

// FORMAT STATUS

function formatWithdrawStatus(status) {

    if (!status) return "Pending";

    switch (status.toLowerCase()) {

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        case "pending":
        default:
            return "Pending";

    }

}


// ======================================
// FORMAT DATE
// ======================================

function formatWithdrawDate(timestamp) {

    if (!timestamp) return "-";

    try {

        return new Date(timestamp).toLocaleString("en-US", {

            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"

        });

    } catch (error) {

        return "-";

    }

}


// ======================================
// REFRESH AFTER SUBMIT
// ======================================

async function refreshWithdrawPage() {

    await loadUserData();

    loadWithdrawHistory();

}


// ======================================
// RESET STATUS
// ======================================

function resetWithdrawStatus() {

    withdrawStatus.textContent = "No Withdraw Request";

    withdrawStatus.classList.remove(

        "pending",
        "approved",
        "rejected"

    );

}


// ======================================
// PAGE START
// ======================================

window.addEventListener("load", () => {

    if (currentUser) {

        loadUserData();

        loadWithdrawHistory();

    }

});

    

            
