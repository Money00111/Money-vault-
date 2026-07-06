// ======================================
// VIP.JS - PART 1
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const loadingScreen = document.getElementById("loadingScreen");
const userBalance = document.getElementById("userBalance");

const vipButtons = document.querySelectorAll(".buyVipBtn");

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadUser(user);

});

// ======================================
// LOAD USER DATA
// ======================================

function loadUser(user){

const userRef = ref(db,"users/"+user.uid);

onValue(userRef,(snapshot)=>{

if(!snapshot.exists()) return;

const data = snapshot.val();

const balance = Number(data.balance || 0);

userBalance.textContent =
balance.toLocaleString()+" RWF";

const currentVip = data.vip || "";

vipButtons.forEach(btn=>{

if(btn.dataset.vip === currentVip){

btn.innerHTML="✅ ACTIVE";

btn.disabled=true;

btn.classList.add("activeVip");

}

});

loadingScreen.style.display="none";

});

}

console.log("VIP Part 1 Loaded");

    // ======================================
// VIP.JS - PART 2
// BUY VIP PLAN
// ======================================

import {
    ref,
    get,
    update,
    push,
    set
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// BUY VIP
// ======================================

vipButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const user = auth.currentUser;

        if (!user) {

            alert("Please login first.");

            return;

        }

        const vipName = button.dataset.vip;
        const vipPrice = Number(button.dataset.price);

        try {

            const userRef = ref(db, "users/" + user.uid);

            const snapshot = await get(userRef);

            if (!snapshot.exists()) {

                alert("User not found.");

                return;

            }

            const data = snapshot.val();

            const balance = Number(data.balance || 0);

            const currentVip = data.vip || "";

            // Already Active

            if (currentVip === vipName) {

                alert("This VIP Plan is already active.");

                return;

            }

            // Balance Check

            if (balance < vipPrice) {

                alert("Insufficient Balance.");

                return;

            }

            // Update User

            await update(userRef, {

                balance: balance - vipPrice,

                vip: vipName,

                vipPurchaseDate: Date.now()

            });

            // Save Transaction

            const transactionRef = push(
                ref(db, "transactions/" + user.uid)
            );

            await set(transactionRef, {

                type: "VIP Purchase",

                vip: vipName,

                amount: vipPrice,

                status: "Success",

                date: new Date().toLocaleString(),

                timestamp: Date.now()

            });

            alert(vipName + " Activated Successfully!");

            // Update Button

            button.innerHTML = "✅ ACTIVE";

            button.disabled = true;

            button.classList.add("activeVip");

        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    });

});

console.log("VIP Part 2 Loaded");
