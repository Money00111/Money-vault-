// ======================================
// VIP.JS - PART 1
// Money Vault Pro VIP System
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue,
    get,
    push,
    set,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const sidebar = document.getElementById("sidebar");

const menuBtn = document.getElementById("menuBtn");

const logoutBtn = document.getElementById("logoutBtn");

const balance = document.getElementById("balance");

const currentVip = document.getElementById("currentVip");

const dailyIncome = document.getElementById("dailyIncome");

const totalProfit = document.getElementById("totalProfit");

const ownedVipList = document.getElementById("ownedVipList");

const vipGrid = document.querySelector(".vip-grid");


// ======================================
// VARIABLES
// ======================================

let currentUser = null;

let userData = {};

let vipPlans = {};


// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

    if (!confirm("Logout?")) return;

    await signOut(auth);

    location.href = "login.html";

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

    loadVipPackages();

    loadUserVipPlans();

});



// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    const userRef = ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {
    if(loadingScreen){

loadingScreen.style.display="none";

    }

    if (!snapshot.exists()) {

        console.log("User data not found");

        return;

    }

    userData = snapshot.val();

    vipPlans = userData.vipPlans || {};

    balance.textContent =
    Number(userData.balance || 0).toLocaleString() + " RWF";

});

}

console.log("VIP PART 1 READY");


// ======================================
// VIP.JS - PART 2
// LOAD VIP PLANS FROM FIREBASE
// ======================================

function loadVipPackages() {

    const vipRef = ref(db, "vipPlans");

    onValue(vipRef, (snapshot) => {

        console.log(snapshot.val());

        if (!vipGrid) return;

        vipGrid.innerHTML = "";

        if (!snapshot.exists()) {

            vipGrid.innerHTML = `
                <div class="emptyVip">
                    No VIP Plans Available
                </div>
            `;

            return;
        }

        snapshot.forEach((child) => {


    const vip = child.val();

    console.log(vip);
    alert(JSON.stringify(vip));

            const vip = child.val();

            console.log(vip);

            if (!vip || vip.status !== true) return;

            vipGrid.innerHTML += `
                <div class="vip-card">

                    <div class="vip-badge">${vip.name}</div>

                    <h2>${Number(vip.price).toLocaleString()} RWF</h2>

                    <ul>
                        <li>Daily Income: <b>${Number(vip.dailyIncome).toLocaleString()} RWF</b></li>
                        <li>Duration: <b>${vip.duration} Days</b></li>
                        <li>Total Profit: <b>${Number(vip.totalProfit).toLocaleString()} RWF</b></li>
                    </ul>

                    <button
                        class="buyVipBtn"
                        data-vip="${vip.name}"
                        data-price="${vip.price}"
                        data-daily="${vip.dailyIncome}"
                        data-profit="${vip.totalProfit}"
                        data-days="${vip.duration}">
                        Buy Now
                    </button>

                </div>
            `;

        });

        registerVipButtons();
        updateVipButtons();

    }, (error) => {

        console.error(error);

    });

}

console.log("VIP PART 2 READY");

// ======================================
// VIP.JS - PART 3
// REGISTER BUY VIP BUTTONS
// ======================================

function registerVipButtons() {

    const buttons = document.querySelectorAll(".buyVipBtn");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            buyVip(button);

        });

    });

}


    
// ======================================
// VIP.JS - PART 4
// BUY VIP PLAN
// ======================================

async function buyVip(button) {

    if (!currentUser) return;

    const vipName = button.dataset.vip;
    const price = Number(button.dataset.price);
    const daily = Number(button.dataset.daily);
    const profit = Number(button.dataset.profit);
    const days = Number(button.dataset.days);

    const ok = confirm(
        `Buy ${vipName} for ${price.toLocaleString()} RWF?`
    );

    if (!ok) return;

    try {

        const userRef =
            ref(db, "users/" + currentUser.uid);

        const snap =
            await get(userRef);

        if (!snap.exists()) {

            alert("User not found.");

            return;

        }

        const user = snap.val();

        const balanceNow =
            Number(user.balance || 0);

        if (balanceNow < price) {

            alert("Insufficient Balance.");

            return;

        }

        const newBalance =
            balanceNow - price;

        await update(userRef, {
            balance: newBalance
        });

        const vipRef = push(
            ref(db, "users/" + currentUser.uid + "/vipPlans")
        );

        await set(vipRef, {

            vipName: vipName,

            dailyIncome: daily,

            totalProfit: profit,

            totalDays: days,

            remainingDays: days,

            purchasedAt: Date.now(),

            lastClaim: 0,

            status: "active"

        });

        const txRef = push(
            ref(db, "transactions/" + currentUser.uid)
        );

        await set(txRef, {

            type: "VIP Purchase",

            vipName: vipName,

            amount: price,

            status: "Completed",

            createdAt: Date.now()

        });

        alert(vipName + " purchased successfully.");

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}

console.log("VIP PART 4 READY");

// ======================================
// VIP.JS - PART 5
// LOAD USER VIP PLANS
// ======================================

function loadUserVipPlans(){

    if(!currentUser) return;


    const vipRef = ref(
        db,
        "users/" + currentUser.uid + "/vipPlans"
    );


    onValue(vipRef, (snapshot)=>{


        ownedVipList.innerHTML = "";


        let activeCount = 0;

        let totalDaily = 0;

        let totalProfitAmount = 0;



        if(!snapshot.exists()){


            ownedVipList.innerHTML = `

            <div class="emptyVip">

                No VIP Purchased

            </div>

            `;


            currentVip.textContent =
            "VIP 0";


            dailyIncome.textContent =
            "0 RWF";


            totalProfit.textContent =
            "0 RWF";


            return;

        }



        snapshot.forEach((child)=>{


            const vip = child.val();



            if(vip.status === "active"){


                activeCount++;


                totalDaily +=
                Number(vip.dailyIncome || 0);


                totalProfitAmount +=
                Number(vip.totalProfit || 0);


            }



            ownedVipList.innerHTML += `


            <div class="owned-vip-card">


                <h3>

                    ${vip.vipName}

                </h3>


                <p>

                Daily Income:

                <b>
                ${Number(vip.dailyIncome || 0)
                .toLocaleString()} RWF
                </b>

                </p>


                <p>

                Remaining Days:

                <b>
                ${vip.remainingDays || 0}
                </b>


                </p>



                <p>

                Status:

                <span class="vip-status">

                ${vip.status}

                </span>

                </p>


            </div>


            `;


        });



        currentVip.textContent =
        activeCount + " Active VIP";


        dailyIncome.textContent =
        totalDaily.toLocaleString() + " RWF";


        totalProfit.textContent =
        totalProfitAmount.toLocaleString() + " RWF";


        updateVipButtons();

    });


}


console.log("VIP PART 5 READY");

// ======================================
// VIP.JS - PART 9
// UPDATE VIP BUTTONS
// ======================================

function updateVipButtons() {

    const buyButtons =
        document.querySelectorAll(".buyVipBtn");

    buyButtons.forEach((button) => {

        const vipName =
            button.dataset.vip;

        const purchased =
            Object.values(vipPlans).find(plan =>

                plan.vipName === vipName &&
                plan.status === "active"

            );

        if (purchased) {

            button.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Purchased
            `;

            button.disabled = true;

            button.classList.add("purchased");

        } else {

            button.innerHTML = `
                <i class="fas fa-cart-shopping"></i>
                Buy Now
            `;

            button.disabled = false;

            button.classList.remove("purchased");

        }

    });

}

console.log("VIP PART 9 READY");

