// ======================================
// TRANSACTIONS.JS
// Money Vault
// Firebase Realtime Database
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");
const transactionList = document.getElementById("transactionList");
const totalTransactions = document.getElementById("totalTransactions");

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadTransactions(user.uid);

});

// ======================================
// LOAD TRANSACTIONS
// ======================================

function loadTransactions(uid) {

    const txRef = query(
    ref(db, "transactions"),
    orderByChild("uid"),
    equalTo(uid)
);

    onValue(
        txRef,
        (snapshot) => {

            // Remove loading immediately when Firebase responds
            loadingScreen.style.display = "none";

            transactionList.innerHTML = "";

            if (!snapshot.exists()) {

                transactionList.innerHTML = `
                    <div class="empty">
                        <h3>No Transactions Found</h3>
                    </div>
                `;

                totalTransactions.textContent = "0";

                return;
            }

            const transactions = [];

            snapshot.forEach((item) => {

                const tx = item.val();

                // Show only current user's transactions
                if (tx.uid === uid) {

                    transactions.push(tx);

                }

            });

            // Newest first
            transactions.sort((a, b) => {

                return (b.createdAt || 0) - (a.createdAt || 0);

            });

            totalTransactions.textContent =
                transactions.length;

            if (transactions.length === 0) {

                transactionList.innerHTML = `
                    <div class="empty">
                        <h3>No Transactions Found</h3>
                        <p>You don't have any transactions yet.</p>
                    </div>
                `;

                return;

            }

            transactions.forEach((tx) => {

                const status =
                    String(tx.status || "pending").toLowerCase();

                const type =
                    tx.type || "Transaction";

                const method =
                    tx.paymentMethod ||
                    tx.method ||
                    "-";

                const amount =
                    Number(tx.amount || 0);

                const date =
                    tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString()
                        : "-";

                transactionList.innerHTML += `

                    <div class="transaction-card">

                        <div class="left">

                            <h3>${type}</h3>

                            <p>${method}</p>

                            <small>${date}</small>

                        </div>

                        <div class="right">

                            <h2>
                                ${amount.toLocaleString()} RWF
                            </h2>

                            <span class="${status}">
                                ${status}
                            </span>

                        </div>

                    </div>

                `;

            });

        },

        (error) => {

            // IMPORTANT:
            // Stop loading even when Firebase returns an error

            loadingScreen.style.display = "none";

            console.error(
                "TRANSACTIONS ERROR:",
                error
            );

            transactionList.innerHTML = `
                <div class="empty">

                    <h3>Failed to Load Transactions</h3>

                    <p>
                        ${error.message || "Database error"}
                    </p>

                </div>
            `;

            totalTransactions.textContent = "0";

        }

    );

}
