// ======================================
// VIP.JS - PART 1
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const balance = document.getElementById("balance");

const currentVip = document.getElementById("currentVip");
const dailyIncome = document.getElementById("dailyIncome");
const totalProfit = document.getElementById("totalProfit");

// ======================================
// CURRENT USER
// ======================================

let currentUser = null;
let userData = {};

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

    if (!confirm("Logout from Money Vault?")) return;

    try {

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    currentUser = user;

    loadUserData();

});

// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    const userRef = ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {

        loadingScreen.style.display = "none";

        if (!snapshot.exists()) return;

        userData = snapshot.val();

        balance.textContent =
            Number(userData.balance || 0).toLocaleString() + " RWF";

        currentVip.textContent =
            userData.vip || "VIP 0";

        dailyIncome.textContent =
            Number(userData.dailyIncome || 0).toLocaleString() + " RWF";

        totalProfit.textContent =
            Number(userData.totalProfit || 0).toLocaleString() + " RWF";

    });

}

console.log("VIP Part 1 Loaded");

// ======================================
// VIP.JS - PART 2
// BUY VIP PLAN
// ======================================

import {
    update,
    push
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// VIP BUTTONS
// ======================================

const buyButtons = document.querySelectorAll(".buyVipBtn");

// ======================================
// BUY VIP
// ======================================

buyButtons.forEach(button => {

    button.addEventListener("click", () => {

        buyVip(button);

    });

});

// ======================================
// BUY FUNCTION
// ======================================

async function buyVip(button){

    if(!currentUser) return;

    const vipName = button.dataset.vip;

    const price = Number(button.dataset.price);

    const daily = Number(button.dataset.daily);

    const profit = Number(button.dataset.profit);

    const balanceNow = Number(userData.balance || 0);

    // CHECK BALANCE

    if(balanceNow < price){

        alert("Insufficient Balance.");

        return;

    }

    // CHECK CURRENT VIP

    if(userData.vip === vipName){

        alert("You already own this VIP Plan.");

        return;

    }

    // CONFIRM

    const ok = confirm(

        `Buy ${vipName} for ${price.toLocaleString()} RWF ?`

    );

    if(!ok) return;

    try{

        const newBalance = balanceNow - price;

        // UPDATE USER

        await update(

            ref(db,"users/" + currentUser.uid),

            {

                balance:newBalance,

                vip:vipName,

                dailyIncome:daily,

                totalProfit:profit,

                vipPurchaseDate:Date.now()

            }

        );

        // SAVE TRANSACTION

        await push(

            ref(db,"transactions/" + currentUser.uid),

            {

                type:"VIP Purchase",

                amount:price,

                date:new Date().toLocaleString(),

                status:"Completed"

            }

        );

        alert(vipName + " Activated Successfully.");

    }

    catch(error){

        alert(error.message);

    }

}

console.log("VIP Part 2 Loaded");

