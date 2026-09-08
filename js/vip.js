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
    update,
    runTransaction,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen =
    document.getElementById("loadingScreen");

const sidebar =
    document.getElementById("sidebar");

const menuBtn =
    document.getElementById("menuBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const balance =
    document.getElementById("balance");

const currentVip =
    document.getElementById("currentVip");

const dailyIncome =
    document.getElementById("dailyIncome");

const totalProfit =
    document.getElementById("totalProfit");

const ownedVipList =
    document.getElementById("ownedVipList");

const vipGrid =
    document.getElementById("vipGrid");


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

    if (sidebar) {
        sidebar.classList.toggle("active");
    }

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

    if (!confirm("Logout?")) return;

    try {

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    }

});


// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";

        return;
    }


    currentUser = user;


    // ==================================
    // LOAD USER DATA
    // ==================================

    loadUserData();


    // ==================================
    // LOAD AVAILABLE VIP PLANS
    // ==================================

    loadVipPackages();


    // ==================================
    // LOAD USER PURCHASED VIP PLANS
    // ==================================

    loadUserVipPlans();

});


// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    if (!currentUser) return;


    const userRef =
        ref(
            db,
            "users/" + currentUser.uid
        );


    onValue(
        userRef,
        (snapshot) => {

            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }


            if (!snapshot.exists()) {

                console.log(
                    "User data not found"
                );

                userData = {};

                vipPlans = {};

                if (balance) {

                    balance.textContent =
                        "0 RWF";

                }

                return;
            }


            userData =
                snapshot.val() || {};


            // ==================================
            // USER VIP PLANS
            // ==================================

            vipPlans =
                userData.vipPlans || {};


            // ==================================
            // BALANCE
            // ==================================

            const userBalance =
                Number(
                    userData.balance || 0
                );


            if (balance) {

                balance.textContent =
                    userBalance.toLocaleString() +
                    " RWF";

            }

        },
        (error) => {

            console.error(
                "User Data Error:",
                error
            );

        }
    );

}


console.log(
    "VIP PART 1 READY"
);
// ======================================
// VIP.JS - PART 2
// LOAD VIP PLANS
// VIP COLORS + SORT
// ======================================


// ======================================
// GET VIP COLOR CLASS
// ======================================

function getVipColorClass(name, index) {

    const value =
        String(name || "")
            .toLowerCase()
            .trim();


    if (value.includes("bronze"))
        return "bronze";

    if (value.includes("starter"))
        return "starter";

    if (value.includes("silver"))
        return "silver";

    if (value.includes("gold"))
        return "gold";

    if (value.includes("platinum"))
        return "platinum";

    if (value.includes("diamond"))
        return "diamond";

    if (value.includes("premium"))
        return "premium";

    if (value.includes("elite"))
        return "elite";

    if (value.includes("royal"))
        return "royal";

    if (value.includes("ultimate"))
        return "ultimate";


    const colors = [
        "bronze",
        "starter",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "premium",
        "elite",
        "royal",
        "ultimate"
    ];


    return colors[index] || "bronze";

}


// ======================================
// GET VIP NUMBER
// ======================================

function getVipNumber(vip, key) {

    const name =
        String(vip?.name || "").trim();


    let match =
        name.match(/vip\s*[-_#:]?\s*(\d+)/i);


    if (match) {

        return Number(match[1]);

    }


    const firebaseKey =
        String(key || "").trim();


    match =
        firebaseKey.match(/vip\s*[-_#:]?\s*(\d+)/i);


    if (match) {

        return Number(match[1]);

    }


    match =
        name.match(/\d+/);


    if (match) {

        return Number(match[0]);

    }


    return 999999;

}


// ======================================
// LOAD AVAILABLE VIP PACKAGES
// ======================================

function loadVipPackages() {

    const vipRef =
        ref(db, "vipPlans");


    onValue(
        vipRef,
        (snapshot) => {

            if (!vipGrid) {

                console.log(
                    "vipGrid not found"
                );

                return;

            }


            vipGrid.innerHTML = "";


            // ==================================
            // NO PLANS
            // ==================================

            if (!snapshot.exists()) {

                vipGrid.innerHTML = `

                    <div class="emptyVip">

                        No VIP Plans Available

                    </div>

                `;

                return;

            }


            // ==================================
            // COLLECT PLANS
            // ==================================

            const plans = [];


            snapshot.forEach((child) => {

                const data =
                    child.val() || {};


                plans.push({

                    key:
                        child.key,

                    data:
                        data

                });

            });


            // ==================================
            // SORT VIP 1 → VIP 10
            // ==================================

            plans.sort((a, b) => {

                return (
                    getVipNumber(
                        a.data,
                        a.key
                    )
                    -
                    getVipNumber(
                        b.data,
                        b.key
                    )
                );

            });


            // ==================================
            // DISPLAY PLANS
            // ==================================

            plans.forEach(
                (item, index) => {

                    const vip =
                        item.data;


                    // ==================================
                    // VIP NAME
                    // ==================================

                    const name =
                        String(
                            vip.name ||
                            "VIP Plan"
                        );


                    // ==================================
                    // PRICE
                    // ==================================

                    const price =
                        Number(
                            vip.price ?? 0
                        );


                    // ==================================
                    // DAILY INCOME
                    // ==================================

                    const daily =
                        Number(
                            vip.dailyIncome ?? 0
                        );


                    // ==================================
                    // DURATION
                    // ==================================

                    const duration =
                        Number(
                            vip.duration ??
                            vip.totalDays ??
                            vip.days ??
                            0
                        );


                    // ==================================
                    // TOTAL PROFIT
                    // ==================================

                    const profit =
                        vip.totalProfit != null

                        ? Number(
                            vip.totalProfit
                        )

                        : daily * duration;


                    // ==================================
                    // COLOR
                    // ==================================

                    const colorClass =
                        getVipColorClass(
                            name,
                            index
                        );


                    // ==================================
                    // CREATE CARD
                    // ==================================

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "vip-card " +
                        colorClass;


                    // ==================================
                    // CARD HTML
                    // ==================================

                    card.innerHTML = `

                        <div class="vip-badge">

                            ${name}

                        </div>


                        <i class="fas fa-gem vip-icon"></i>


                        <h2>

                            ${name}

                        </h2>


                        <h1>

                            ${price.toLocaleString()}
                            RWF

                        </h1>


                        <p>

                            Daily Income:

                            <b>

                                ${daily.toLocaleString()}
                                RWF

                            </b>

                        </p>


                        <p>

                            Duration:

                            <b>

                                ${duration}
                                Days

                            </b>

                        </p>


                        <p>

                            Total Profit:

                            <b>

                                ${profit.toLocaleString()}
                                RWF

                            </b>

                        </p>


                        <button

                            type="button"

                            class="buyVipBtn"

                            data-vip="${name}"

                            data-price="${price}"

                            data-daily="${daily}"

                            data-profit="${profit}"

                            data-days="${duration}"

                        >

                            <i
                                class="fas fa-cart-shopping"
                            ></i>

                            Buy Now

                        </button>

                    `;


                    vipGrid.appendChild(
                        card
                    );

                }
            );


            // ==================================
            // REGISTER BUY BUTTONS
            // ==================================

            registerVipButtons();


            // ==================================
            // CHECK PURCHASED VIPs
            // ==================================

            updateVipButtons();

        },

        (error) => {

            console.error(
                "VIP LOAD ERROR:",
                error
            );

        }
    );

}


console.log(
    "VIP PART 2 READY"
);

// ======================================
// VIP.JS - PART 3
// REGISTER BUY VIP BUTTONS
// ======================================


// ======================================
// REGISTER ALL BUY BUTTONS
// ======================================

function registerVipButtons() {

    const buttons =
        document.querySelectorAll(
            ".buyVipBtn"
        );


    if (!buttons.length) {

        console.log(
            "No Buy VIP buttons found."
        );

        return;

    }


    buttons.forEach((button) => {

        // ==================================
        // PREVENT DUPLICATE LISTENERS
        // ==================================

        if (
            button.dataset.listenerAttached === "true"
        ) {

            return;

        }


        button.dataset.listenerAttached =
            "true";


        // ==================================
        // CLICK EVENT
        // ==================================

        button.addEventListener(
            "click",
            async () => {

                // Prevent double-click
                if (button.disabled) {
                    return;
                }


                await buyVip(button);

            }
        );

    });


    console.log(
        "VIP BUY BUTTONS REGISTERED:",
        buttons.length
    );

}


console.log(
    "VIP PART 3 READY"
);
