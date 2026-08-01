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
    orderByChild
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
// LOAD TRANSACTIONS - UPDATED
// ======================================

function loadTransactions(uid) {


    const txRef = query(

        ref(db, "transactions"),

        orderByChild("createdAt")

    );


    onValue(txRef, (snapshot) => {


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



        let count = 0;

        const transactions = [];



        snapshot.forEach((item) => {


            const tx = item.val();


            // FATA IZ'UMUKORESHA WENYINE

            if(tx.uid === uid){

                transactions.unshift(tx);

                count++;

            }


        });



        totalTransactions.textContent = count;



        if(count === 0){

            transactionList.innerHTML = `

            <div class="empty">

                <h3>No Transactions Found</h3>

            </div>

            `;

            return;

        }



        transactions.forEach((tx)=>{


            transactionList.innerHTML += `


            <div class="transaction-card">


                <div class="left">


                    <h3>${tx.type}</h3>


                    <p>
                    ${tx.paymentMethod || tx.method || ""}
                    </p>


                    <small>

                    ${new Date(
                    tx.createdAt
                    ).toLocaleString()}

                    </small>


                </div>



                <div class="right">


                    <h2>

                    ${Number(tx.amount || 0)
                    .toLocaleString()} RWF

                    </h2>


                    <span class="${tx.status}">

                    ${tx.status}

                    </span>


                </div>


            </div>


            `;


        });


    });


}
