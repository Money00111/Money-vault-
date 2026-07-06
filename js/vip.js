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

// ======================================
// VIP.JS - PART 3
// REALTIME + TOAST
// ======================================

// Daily income for each VIP
const vipIncome = {
    "VIP 1": 600,
    "VIP 2": 1700,
    "VIP 3": 3600,
    "VIP 4": 7500,
    "VIP 5": 20000
};

// ======================================
// SHOW ACTIVE VIP
// ======================================

function updateVipUI(currentVip){

    vipButtons.forEach(btn=>{

        btn.disabled = false;
        btn.classList.remove("activeVip");
        btn.innerHTML = "Buy " + btn.dataset.vip;

        if(btn.dataset.vip === currentVip){

            btn.disabled = true;
            btn.classList.add("activeVip");
            btn.innerHTML = "✅ ACTIVE";

        }

    });

}

// ======================================
// TOAST MESSAGE
// ======================================

function showToast(message,color="#10b981"){

    let toast=document.getElementById("toast");

    if(!toast){

        toast=document.createElement("div");

        toast.id="toast";

        document.body.appendChild(toast);

    }

    toast.innerHTML=message;

    toast.style.background=color;

    toast.style.position="fixed";

    toast.style.top="20px";

    toast.style.right="20px";

    toast.style.padding="15px 20px";

    toast.style.color="#fff";

    toast.style.borderRadius="12px";

    toast.style.fontWeight="600";

    toast.style.zIndex="99999";

    toast.style.boxShadow="0 10px 25px rgba(0,0,0,.25)";

    toast.style.opacity="1";

    setTimeout(()=>{

        toast.style.opacity="0";

    },3000);

}

// ======================================
// LISTEN USER DATA
// ======================================

onAuthStateChanged(auth,(user)=>{

    if(!user) return;

    const userRef=ref(db,"users/"+user.uid);

    onValue(userRef,(snapshot)=>{

        if(!snapshot.exists()) return;

        const data=snapshot.val();

        userBalance.textContent =
        Number(data.balance||0).toLocaleString()+" RWF";

        updateVipUI(data.vip||"");

        const income = vipIncome[data.vip] || 0;

        console.log("Daily Income:",income,"RWF");

    });

});

console.log("VIP Part 3 Loaded");


// ======================================
// VIP.JS - PART 4
// COMPLETE VIP SYSTEM
// ======================================

// VIP Levels
const vipLevels = {

    "VIP 1":1,
    "VIP 2":2,
    "VIP 3":3,
    "VIP 4":4,
    "VIP 5":5

};

// Daily Income
const vipReward = {

    "VIP 1":600,
    "VIP 2":1700,
    "VIP 3":3600,
    "VIP 4":7500,
    "VIP 5":20000

};

// ======================================
// CHECK VIP LEVEL
// ======================================

function canBuyVip(currentVip,newVip){

    const currentLevel = vipLevels[currentVip] || 0;

    const newLevel = vipLevels[newVip] || 0;

    return newLevel > currentLevel;

}

// ======================================
// AFTER BUY SUCCESS
// ======================================

async function activateVip(user,vipName,price,balance){

    const userRef = ref(db,"users/"+user.uid);

    await update(userRef,{

        vip:vipName,

        balance:balance-price,

        vipLevel:vipLevels[vipName],

        vipIncome:vipReward[vipName],

        vipPurchaseDate:Date.now(),

        lastDailyReward:0

    });

    showToast(

        vipName+" Activated Successfully 👑"

    );

}

// ======================================
// DAILY REWARD
// ======================================

async function claimDailyReward(user){

    const userRef = ref(db,"users/"+user.uid);

    const snap = await get(userRef);

    if(!snap.exists()) return;

    const data = snap.val();

    if(!data.vip) return;

    const reward = vipReward[data.vip] || 0;

    const last = data.lastDailyReward || 0;

    const now = Date.now();

    const oneDay = 86400000;

    if(now-last >= oneDay){

        await update(userRef,{

            balance:Number(data.balance||0)+reward,

            lastDailyReward:now

        });

        showToast(

            reward.toLocaleString()+" RWF Daily Income Added"

        );

    }

}

// ======================================
// AUTO CLAIM
// ======================================

onAuthStateChanged(auth,(user)=>{

    if(user){

        claimDailyReward(user);

    }

});

console.log("VIP System Ready");
