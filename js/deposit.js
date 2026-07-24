// ======================================
// DEPOSIT.JS PART 1
// IMPORTS
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    push,
    set,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const depositForm = document.getElementById("depositForm");

const amount = document.getElementById("amount");

const paymentMethod = document.getElementById("paymentMethod");

const senderPhone = document.getElementById("senderPhone");

const transactionId = document.getElementById("transactionId");

const paymentDate = document.getElementById("paymentDate");

const note = document.getElementById("note");

const submitBtn = document.getElementById("submitBtn");

const depositStatus = document.getElementById("depositStatus");

const historyList = document.getElementById("historyList");

const loadingScreen = document.getElementById("loadingScreen");

const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");

const sidebar = document.getElementById("sidebar");

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

});

       // ======================================
// DEPOSIT.JS PART 2
// SIDEBAR + COPY + LOGOUT
// ======================================

// Mobile Menu

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// COPY PAYMENT NUMBERS
// ======================================

const mtnNumber = document.getElementById("mtnNumber");
const airtelNumber = document.getElementById("airtelNumber");

const copyMTN = document.getElementById("copyMTN");
const copyAirtel = document.getElementById("copyAirtel");

copyMTN?.addEventListener("click", async () => {

    try{

        await navigator.clipboard.writeText(mtnNumber.textContent.trim());

        alert("MTN number copied successfully.");

    }catch(error){

        alert("Failed to copy MTN number.");

    }

});

copyAirtel?.addEventListener("click", async () => {

    try{

        await navigator.clipboard.writeText(airtelNumber.textContent.trim());

        alert("Airtel number copied successfully.");

    }catch(error){

        alert("Failed to copy Airtel number.");

    }

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Are you sure you want to logout?");

    if(!ok) return;

    try{

        await signOut(auth);

        window.location.href = "login.html";

    }catch(error){

        alert(error.message);

    }

});

// ======================================
// DEFAULT PAYMENT DATE
// ======================================

const now = new Date();

const offset = now.getTimezoneOffset();

const local = new Date(now.getTime() - (offset * 60000));

paymentDate.value = local.toISOString().slice(0,16);          

// ======================================
// DEPOSIT.JS PART 3
// SUBMIT DEPOSIT
// ======================================

depositForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {

        alert("Please login first.");

        return;

    }

    submitBtn.disabled = true;

    submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    try {

        const depositData = {

            uid: currentUser.uid,

            email: currentUser.email || "",

            amount: Number(amount.value),

            paymentMethod: paymentMethod.value,

            senderPhone: senderPhone.value.trim(),

            transactionId: transactionId.value.trim(),

            paymentDate: paymentDate.value,

            note: note.value.trim(),

            status: "pending",

            createdAt: Date.now()

        };

        // Create new deposit record

        const depositRef = push(ref(db, "depositRequests"));

        await set(depositRef, depositData);

        await refreshDepositPage();

        depositStatus.textContent = "Pending Approval";

        depositStatus.style.color = "#f59e0b";

        alert("Deposit request submitted successfully.");

        depositForm.reset();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> Submit Deposit Request';

    }

});

// ======================================
// DEPOSIT.JS PART 4
// LOAD DEPOSIT HISTORY
// ======================================

async function loadDepositHistory() {

    if (!currentUser) return;

    try {

        const depositsRef = ref(db, "depositRequests");

        const snapshot = await get(depositsRef);

        historyList.innerHTML = "";

        if (!snapshot.exists()) {

            historyList.innerHTML = `
                <div class="empty-history">

                    <i class="fa-solid fa-wallet"></i>

                    <h3>No Deposit History</h3>

                    <p>Your deposits will appear here.</p>

                </div>
            `;

            return;

        }

        let found = false;

        snapshot.forEach((child) => {

            const deposit = child.val();

            if (deposit.uid !== currentUser.uid) return;

            found = true;

            historyList.innerHTML += `

            <div class="history-card">

                <div class="history-info">

                    <h3>${deposit.amount.toLocaleString()} RWF</h3>

                    <p><strong>Method:</strong> ${deposit.paymentMethod}</p>

                    <p><strong>Phone:</strong> ${deposit.senderPhone}</p>

                    <p><strong>Transaction ID:</strong> ${deposit.transactionId}</p>

                    <p><strong>Date:</strong> ${deposit.paymentDate}</p>

                </div>

                <span class="status ${deposit.status}">

                    ${deposit.status}

                </span>

            </div>

            `;

        });

        if (!found) {

            historyList.innerHTML = `
                <div class="empty-history">

                    <i class="fa-solid fa-wallet"></i>

                    <h3>No Deposit History</h3>

                    <p>You haven't submitted any deposit yet.</p>

                </div>
            `;

        }

    } catch (error) {

        console.error(error);

    }

}

// ======================================
// DEPOSIT.JS PART 5
// REFRESH HISTORY + STATUS
// ======================================

// Hamagara history nyuma yo kwinjira

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    loadingScreen.style.display = "none";

    await loadDepositHistory();

});

// ======================================
// REFRESH AFTER SUBMIT
// ======================================

async function refreshDepositPage() {

    depositStatus.textContent = "Pending Approval";
    depositStatus.style.color = "#f59e0b";

    await loadDepositHistory();

}

// ======================================
// SUBMIT SUCCESS
// Ongeraho iyi line nyuma ya:
// await set(depositRef, depositData);
// ======================================

// await refreshDepositPage();

// ======================================
// FORMAT STATUS
// ======================================

function formatStatus(status) {

    if (!status) return "Pending";

    switch (status.toLowerCase()) {

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        default:
            return "Pending";

    }

}

// ======================================
// FORMAT DATE
// ======================================

function formatDate(timestamp) {

    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleString();

}

