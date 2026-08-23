// ======================================
// DEPOSIT.JS - COMPLETE FIXED VERSION
// ======================================

// ======================================
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
    get,
    query,
    orderByChild,
    equalTo
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

    await loadDepositHistory();

});


// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar?.classList.toggle("active");

});


// ======================================
// COPY PAYMENT NUMBERS
// ======================================

const mtnNumber = document.getElementById("mtnNumber");

const airtelNumber = document.getElementById("airtelNumber");

const copyMTN = document.getElementById("copyMTN");

const copyAirtel = document.getElementById("copyAirtel");


copyMTN?.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            mtnNumber.textContent.trim()
        );

        alert("MTN number copied successfully.");

    } catch (error) {

        console.error(error);

        alert("Failed to copy MTN number.");

    }

});


copyAirtel?.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            airtelNumber.textContent.trim()
        );

        alert("Airtel number copied successfully.");

    } catch (error) {

        console.error(error);

        alert("Failed to copy Airtel number.");

    }

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm(
        "Are you sure you want to logout?"
    );

    if (!ok) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});


// ======================================
// DEFAULT PAYMENT DATE
// ======================================

const now = new Date();

const offset = now.getTimezoneOffset();

const local = new Date(
    now.getTime() - (offset * 60000)
);

if (paymentDate) {

    paymentDate.value =
        local.toISOString().slice(0, 16);

}


// ======================================
// SUBMIT DEPOSIT
// ======================================

depositForm?.addEventListener("submit", async (e) => {

    e.preventDefault();


    // ======================================
    // CHECK USER
    // ======================================

    if (!currentUser) {

        alert("Please login first.");

        return;

    }


    // ======================================
    // DISABLE BUTTON
    // ======================================

    submitBtn.disabled = true;

    submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';


    try {


        // ======================================
        // GET TRANSACTION ID
        // ======================================

        const enteredTransactionId =
            transactionId.value.trim();


        if (!enteredTransactionId) {

            alert(
                "Please enter the Transaction ID."
            );

            return;

        }


        // ======================================
        // GET USER'S OWN DEPOSITS ONLY
        // ======================================
        //
        // IMPORTANT:
        // We DO NOT read all depositRequests.
        //
        // This query only requests deposits
        // belonging to currentUser.uid.
        //
        // ======================================

        const userDepositsQuery = query(

            ref(db, "depositRequests"),

            orderByChild("uid"),

            equalTo(currentUser.uid)

        );


        const depositsSnapshot =
            await get(userDepositsQuery);


        // ======================================
        // CHECK DUPLICATE TRANSACTION ID
        // ======================================

        let transactionIdExists = false;


        if (depositsSnapshot.exists()) {

            depositsSnapshot.forEach((child) => {

                const deposit = child.val();


                const existingId =
                    String(
                        deposit.transactionId || ""
                    )
                    .trim()
                    .toLowerCase();


                const newId =
                    enteredTransactionId
                        .trim()
                        .toLowerCase();


                if (
                    existingId &&
                    existingId === newId
                ) {

                    transactionIdExists = true;

                }

            });

        }


        // ======================================
        // DUPLICATE FOUND
        // ======================================

        if (transactionIdExists) {

            alert(
                "This Transaction ID has already been used. Please enter a new Transaction ID."
            );

            return;

        }


        // ======================================
        // CREATE DEPOSIT DATA
        // ======================================

        const depositData = {

            uid: currentUser.uid,

            email: currentUser.email || "",

            amount: Number(amount.value),

            paymentMethod:
                paymentMethod.value,

            senderPhone:
                senderPhone.value.trim(),

            transactionId:
                enteredTransactionId,

            paymentDate:
                paymentDate.value,

            note:
                note.value.trim(),

            status: "pending",

            createdAt: Date.now()

        };


        // ======================================
        // CREATE NEW DEPOSIT
        // ======================================

        const depositRef =
            push(
                ref(db, "depositRequests")
            );


        await set(
            depositRef,
            depositData
        );


        // ======================================
        // REFRESH PAGE
        // ======================================

        await refreshDepositPage();


        // ======================================
        // SUCCESS STATUS
        // ======================================

        if (depositStatus) {

            depositStatus.textContent =
                "Pending Approval";

            depositStatus.style.color =
                "#f59e0b";

        }


        alert(
            "Deposit request submitted successfully."
        );


        // ======================================
        // RESET FORM
        // ======================================

        depositForm.reset();


        // Restore payment date
        if (paymentDate) {

            const resetNow = new Date();

            const resetOffset =
                resetNow.getTimezoneOffset();

            const resetLocal =
                new Date(
                    resetNow.getTime() -
                    (resetOffset * 60000)
                );

            paymentDate.value =
                resetLocal
                    .toISOString()
                    .slice(0, 16);

        }


    } catch (error) {

        console.error(
            "DEPOSIT SUBMIT ERROR:",
            error
        );


        if (
            error?.code ===
            "PERMISSION_DENIED"
        ) {

            alert(
                "Permission denied. Please check your Firebase Database Rules."
            );

        } else {

            alert(
                error.message ||
                "Failed to submit deposit request."
            );

        }

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> Submit Deposit Request';

    }

});


// ======================================
// LOAD DEPOSIT HISTORY
// ======================================

async function loadDepositHistory() {

    if (!currentUser) return;


    try {


        // ======================================
        // GET CURRENT USER DEPOSITS ONLY
        // ======================================

        const userDepositsQuery = query(

            ref(db, "depositRequests"),

            orderByChild("uid"),

            equalTo(currentUser.uid)

        );


        const snapshot =
            await get(userDepositsQuery);


        historyList.innerHTML = "";


        // ======================================
        // NO DEPOSITS
        // ======================================

        if (!snapshot.exists()) {

            historyList.innerHTML = `

                <div class="empty-history">

                    <i class="fa-solid fa-wallet"></i>

                    <h3>No Deposit History</h3>

                    <p>
                        Your deposits will appear here.
                    </p>

                </div>

            `;

            return;

        }


        let found = false;


        // ======================================
        // DISPLAY USER'S DEPOSITS
        // ======================================

        snapshot.forEach((child) => {

            const deposit = child.val();


            // Extra security check
            if (
                deposit.uid !==
                currentUser.uid
            ) {

                return;

            }


            found = true;


            const safeAmount =
                Number(deposit.amount || 0)
                    .toLocaleString();


            historyList.innerHTML += `

                <div class="history-card">

                    <div class="history-info">

                        <h3>
                            ${safeAmount} RWF
                        </h3>

                        <p>
                            <strong>Method:</strong>
                            ${deposit.paymentMethod || "-"}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${deposit.senderPhone || "-"}
                        </p>

                        <p>
                            <strong>Transaction ID:</strong>
                            ${deposit.transactionId || "-"}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${deposit.paymentDate || "-"}
                        </p>

                    </div>

                    <span class="status ${deposit.status || "pending"}">

                        ${formatStatus(deposit.status)}

                    </span>

                </div>

            `;

        });


        // ======================================
        // NOTHING FOUND
        // ======================================

        if (!found) {

            historyList.innerHTML = `

                <div class="empty-history">

                    <i class="fa-solid fa-wallet"></i>

                    <h3>No Deposit History</h3>

                    <p>
                        You haven't submitted any deposit yet.
                    </p>

                </div>

            `;

        }


    } catch (error) {

        console.error(
            "LOAD DEPOSIT HISTORY ERROR:",
            error
        );


        if (
            error?.code ===
            "PERMISSION_DENIED"
        ) {

            historyList.innerHTML = `

                <div class="empty-history">

                    <i class="fa-solid fa-lock"></i>

                    <h3>Permission Denied</h3>

                    <p>
                        Unable to load deposit history.
                    </p>

                </div>

            `;

        }

    }

}


// ======================================
// REFRESH AFTER SUBMIT
// ======================================

async function refreshDepositPage() {

    if (depositStatus) {

        depositStatus.textContent =
            "Pending Approval";

        depositStatus.style.color =
            "#f59e0b";

    }


    await loadDepositHistory();

}


// ======================================
// FORMAT STATUS
// ======================================

function formatStatus(status) {

    if (!status) {

        return "Pending";

    }


    switch (
        String(status).toLowerCase()
    ) {

        case "approved":

            return "Approved";


        case "rejected":

            return "Rejected";


        case "pending":

            return "Pending";


        default:

            return "Pending";

    }

}


// ======================================
// FORMAT DATE
// ======================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "-";

    }


    return new Date(timestamp)
        .toLocaleString();

}
