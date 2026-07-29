// ======================================
// VIP.JS - PART 1A-1
// Money Vault Pro VIP System
// Firebase + UI Setup
// ======================================


// ======================================
// FIREBASE IMPORTS
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
    set,
    update,
    push

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
 generateDailyProfit
} from "./vip-profit-engine.js";

// ======================================
// DOM ELEMENTS
// ======================================


// Loading

const loadingScreen =
document.getElementById("loadingScreen");


// Sidebar

const menuBtn =
document.getElementById("menuBtn");


const sidebar =
document.getElementById("sidebar");


const logoutBtn =
document.getElementById("logoutBtn");



// User Balance

const balance =
document.getElementById("balance");



// VIP Statistics

const currentVip =
document.getElementById("currentVip");


const dailyIncome =
document.getElementById("dailyIncome");


const totalProfit =
document.getElementById("totalProfit");



// VIP Display

const vipGrid =
document.querySelector(".vip-grid");


const ownedVipList =
document.getElementById("ownedVipList");



// Claim System

const claimBtn =
document.getElementById("claimIncomeBtn");


const claimTimer =
document.getElementById("claimTimer");




// ======================================
// GLOBAL VARIABLES
// ======================================


let currentUser = null;


let userData = {};


let userVipPlans = {};


// Firebase VIP Packages

let vipPackages = {};



// Timer

let timerInterval = null;



console.log("VIP PART 1A-1 Loaded");

// ======================================
// VIP.JS - PART 1A-2
// Sidebar + Authentication + Load User
// ======================================



// ======================================
// SIDEBAR TOGGLE
// ======================================

menuBtn?.addEventListener("click",()=>{

    sidebar.classList.toggle("active");

});




// ======================================
// LOGOUT SYSTEM
// ======================================

logoutBtn?.addEventListener("click", async()=>{


    const confirmLogout =
    confirm("Are you sure you want to logout?");


    if(!confirmLogout) return;



    try{

        await signOut(auth);


        window.location.href =
        "login.html";


    }
    catch(error){

        console.error(
            "Logout Error:",
            error
        );

    }


});




// ======================================
// AUTH STATE CHECK
// ======================================

onAuthStateChanged(auth,(user)=>{


    if(!user){


        window.location.href =
        "login.html";


        return;

    }



    currentUser = user;

generateDailyProfit(
currentUser.uid
);

    console.log(
        "Logged User:",
        currentUser.uid
    );



    loadUserData();



});




// ======================================
// LOAD USER DATA
// ======================================

function loadUserData(){


    if(!currentUser) return;



    const userRef =

    ref(
        db,
        "users/" + currentUser.uid
    );



    onValue(userRef,(snapshot)=>{


        if(!snapshot.exists()){


            console.log(
                "User data not found"
            );


            return;

        }



        userData =
        snapshot.val();



        // Balance Update

        const userBalance =

        Number(
            userData.balance || 0
        );



        if(balance){

            balance.textContent =

            userBalance.toLocaleString()

            + " RWF";

        }




        // Load Purchased VIP

        userVipPlans =

        userData.vipPlans || {};

        updateVipDashboard();
updateVipButtons();



        console.log(
            "User Data Loaded",
            userData
        );



        // Hide Loading Screen

        if(loadingScreen){

            loadingScreen.style.display =
            "none";

        }


// ======================================
// VIP.JS - PART 1A-3
// User Data Sync + VIP State Preparation
// ======================================



// ======================================
// REFRESH USER DATA
// ======================================

function refreshUserData(){


    if(!currentUser) return;



    const userRef =

    ref(
        db,
        "users/" + currentUser.uid
    );



    get(userRef)

    .then((snapshot)=>{


        if(!snapshot.exists()) return;



        userData =
        snapshot.val();



        userVipPlans =
        userData.vipPlans || {};



        updateBalanceUI();



    })

    .catch(error=>{


        console.error(
            "Refresh User Error:",
            error
        );


    });


}





// ======================================
// UPDATE BALANCE UI
// ======================================

function updateBalanceUI(){


    const amount =

    Number(
        userData.balance || 0
    );



    if(balance){


        balance.textContent =

        amount.toLocaleString()

        + " RWF";


    }


}





// ======================================
// GET USER VIP COUNT
// ======================================

function getActiveVipCount(){


    let count = 0;



    Object.values(userVipPlans)

    .forEach((vip)=>{


        if(vip.status === "active"){


            count++;


        }


    });



    return count;


}





// ======================================
// INITIAL VIP STATUS
// ======================================

function prepareVipStatus(){


    if(!currentUser) return;



    const activeVip =

    getActiveVipCount();



    if(currentVip){


        currentVip.textContent =

        activeVip +

        " Active VIP";


    }



}





// ======================================
// AUTO SYNC EVERY 10 SECONDS
// ======================================

setInterval(()=>{


    if(currentUser){


        refreshUserData();


    }


},10000);





console.log("VIP PART 1A-3 COMPLETE");

     // ======================================
// VIP.JS - PART 1B
// LOAD VIP PACKAGES FROM FIREBASE
// RENDER VIP CARDS
// ======================================



// ======================================
// LOAD VIP PLANS
// ======================================

function loadVipPackages(){


    if(!vipGrid) return;



    const vipRef =
    ref(db,"vipPlans");



    onValue(vipRef,(snapshot)=>{


        if(!snapshot.exists()){


            vipGrid.innerHTML = `

                <div class="emptyVip">

                    No VIP Plans Available

                </div>

            `;


            return;

        }



        vipGrid.innerHTML = "";



        vipPackages = {};



        snapshot.forEach((child)=>{


            const vip = child.val();


            const vipId = child.key;



            // Save locally

            vipPackages[vipId] = vip;



            // Ignore inactive plans

            if(vip.status !== true)
            return;




            const card = document.createElement("div");

            card.className =
            "vip-card";



            card.innerHTML = `

            <div class="vip-badge">

                ${vip.name}

            </div>


            <h2>

                ${Number(vip.price)
                .toLocaleString()} RWF

            </h2>



            <ul>

                <li>

                <i class="fas fa-check"></i>

                Daily Income:

                <b>

                ${Number(vip.dailyIncome)
                .toLocaleString()} RWF

                </b>

                </li>


                <li>

                <i class="fas fa-check"></i>

                Duration:

                <b>

                ${vip.duration} Days

                </b>

                </li>


                <li>

                <i class="fas fa-check"></i>

                Total Profit:

                <b>

                ${Number(vip.totalProfit)
                .toLocaleString()} RWF

                </b>

                </li>


            </ul>



            <button

            class="buyVipBtn"

            data-id="${vipId}"

            data-vip="${vip.name}"

            data-price="${vip.price}"

            data-daily="${vip.dailyIncome}"

            data-profit="${vip.totalProfit}"

            data-days="${vip.duration}">


            <i class="fas fa-crown"></i>

            Buy Now


            </button>


            `;



            vipGrid.appendChild(card);



        });



        registerVipButtons();



        updateVipButtons();



    });



}






// ======================================
// REGISTER BUY BUTTONS
// ======================================

function registerVipButtons(){



    const buttons =

    document.querySelectorAll(
        ".buyVipBtn"
    );



    buttons.forEach(button=>{


        button.onclick = ()=>{


            buyVip(button);


        };


    });


}




// ======================================
// UPDATE PURCHASED BUTTONS
// ======================================

function updateVipButtons(){



    const buttons =

    document.querySelectorAll(
        ".buyVipBtn"
    );



    buttons.forEach(button=>{


        const vipName =
        button.dataset.vip;



        const purchased =

        Object.values(userVipPlans)

        .find(plan=>


            plan.vipName === vipName &&

            plan.status === "active"


        );



        if(purchased){


            button.innerHTML = `

            <i class="fas fa-check-circle"></i>

            Purchased

            `;


            button.disabled = true;


            button.classList.add(
                "activeVip"
            );


        }



    });


}





// ======================================
// START LOAD VIP
// ======================================

loadVipPackages();



console.log(
"VIP PART 1B COMPLETE"
);   

        // ======================================
// VIP.JS - PART 1C
// BUY VIP SYSTEM
// ======================================



// ======================================
// BUY VIP
// ======================================

async function buyVip(button){


    if(!currentUser){

        alert("Please login first");

        return;

    }



    const vipId =
    button.dataset.id;



    const vipName =
    button.dataset.vip;



    const price =
    Number(button.dataset.price);



    const daily =
    Number(button.dataset.daily);



    const profit =
    Number(button.dataset.profit);



    const days =
    Number(button.dataset.days);




    const currentBalance =

    Number(
        userData.balance || 0
    );



    // CHECK BALANCE

    if(currentBalance < price){


        alert(
            "Insufficient Balance"
        );


        return;

    }




    const confirmBuy = confirm(

        `Buy ${vipName} for ${price.toLocaleString()} RWF ?`

    );



    if(!confirmBuy) return;



    try{


        const userRef =

        ref(
            db,
            "users/" + currentUser.uid
        );



        const newBalance =

        currentBalance - price;




        // ======================================
        // UPDATE BALANCE
        // ======================================

        await update(userRef,{

            balance:newBalance

        });






        // ======================================
        // SAVE USER VIP PLAN
        // ======================================


        const vipRef =

        push(

            ref(

                db,

                "users/" +

                currentUser.uid +

                "/vipPlans"

            )

        );




        await set(vipRef,{


            vipId:vipId,


            vipName:vipName,


            dailyIncome:daily,


            totalProfit:profit,


            totalDays:days,


            remainingDays:days,


            purchasedAt:Date.now(),


            lastClaim:0,


            status:"active"


        });







        // ======================================
        // SAVE TRANSACTION
        // ======================================


        const transactionRef =

        push(

            ref(

                db,

                "transactions/" +

                currentUser.uid

            )

        );




        await set(transactionRef,{


            type:"VIP Purchase",


            vipName:vipName,


            amount:price,


            status:"completed",


            createdAt:Date.now()


        });







        // UPDATE LOCAL DATA


        userData.balance =
        newBalance;



        userVipPlans[vipRef.key]={


            vipId:vipId,


            vipName:vipName,


            dailyIncome:daily,


            totalProfit:profit,


            totalDays:days,


            remainingDays:days,


            purchasedAt:Date.now(),


            status:"active"


        };




        updateBalanceUI();


        updateVipButtons();




        alert(

            vipName +

            " Purchased Successfully"

        );



    }


    catch(error){


        console.error(
            "BUY VIP ERROR:",
            error
        );


        alert(
            error.message
        );


    }


}



console.log(
"VIP PART 1C COMPLETE"
);

      // ======================================
// VIP.JS - PART 2
// OWNED VIP DISPLAY + STATISTICS
// ======================================



// ======================================
// RENDER USER VIP PLANS
// ======================================

function renderOwnedVipPlans(){


    if(!ownedVipList) return;



    ownedVipList.innerHTML = "";



    const plans =

    Object.values(userVipPlans);



    if(plans.length === 0){


        ownedVipList.innerHTML = `

            <div class="emptyVip">

                No VIP Purchased

            </div>

        `;


        return;

    }




    plans.forEach(plan=>{


        const purchasedDate =

        Number(plan.purchasedAt || 0);




        const daysPassed =

        Math.floor(

            (Date.now() - purchasedDate)

            /

            (1000 * 60 * 60 * 24)

        );




        const remainingDays =

        Math.max(

            0,

            Number(plan.totalDays) -

            daysPassed

        );




        const status =

        remainingDays > 0

        ? "active"

        : "expired";




        const progress =

        Math.min(

            100,

            (

            daysPassed /

            Number(plan.totalDays)

            ) * 100

        );





        const card =

        document.createElement("div");



        card.className =
        "owned-vip-card";




        card.innerHTML = `


        <h3>

        ${plan.vipName}

        </h3>



        <p>

        Daily Income:

        <b>

        ${Number(plan.dailyIncome)
        .toLocaleString()} RWF

        </b>

        </p>




        <p>

        Remaining Days:

        <b>

        ${remainingDays}

        Days

        </b>

        </p>





        <div class="vip-progress">


            <div

            class="vip-progress-bar"

            style="width:${progress}%">

            </div>


        </div>




        <span class="vip-status ${status}">

        ${status.toUpperCase()}

        </span>



        `;



        ownedVipList.appendChild(card);



    });



}





// ======================================
// CALCULATE VIP TOTALS
// ======================================

function calculateVipTotals(){



    let activeCount = 0;


    let totalDaily = 0;


    let totalProfitAmount = 0;





    Object.values(userVipPlans)

    .forEach(plan=>{



        if(plan.status !== "active")

        return;




        const daysPassed =

        Math.floor(

            (Date.now() -

            Number(plan.purchasedAt))

            /

            (1000*60*60*24)

        );




        const remaining =

        Number(plan.totalDays)

        -

        daysPassed;





        if(remaining <= 0)

        return;





        activeCount++;





        totalDaily +=

        Number(plan.dailyIncome || 0);





        totalProfitAmount +=

        Number(plan.dailyIncome || 0)

        *

        remaining;




    });






    if(currentVip){


        currentVip.textContent =

        activeCount +

        " Active VIP";


    }





    if(dailyIncome){


        dailyIncome.textContent =

        totalDaily.toLocaleString()

        +

        " RWF";


    }





    if(totalProfit){


        totalProfit.textContent =

        totalProfitAmount

        .toLocaleString()

        +

        " RWF";


    }



}





// ======================================
// RUN WHEN USER DATA CHANGES
// ======================================


function updateVipDashboard(){


    renderOwnedVipPlans();


    calculateVipTotals();


}



console.log(
"VIP PART 2 COMPLETE"
);      

        // ======================================
// VIP.JS - PART 3
// DAILY INCOME CLAIM SYSTEM
// 24 HOURS LOCK + COUNTDOWN TIMER
// ======================================



// ======================================
// CLAIM BUTTON EVENT
// ======================================

claimBtn?.addEventListener("click",()=>{

    claimDailyIncome();

});




// ======================================
// CLAIM DAILY INCOME
// ======================================

async function claimDailyIncome(){


    if(!currentUser) return;



    try{


        const userRef =

        ref(
            db,
            "users/" + currentUser.uid
        );



        const snapshot =

        await get(userRef);



        if(!snapshot.exists())
        return;




        const user = snapshot.val();



        const lastClaim =

        Number(
            user.lastClaim || 0
        );



        const now =
        Date.now();



        const oneDay =

        24 *

        60 *

        60 *

        1000;




        // CHECK 24 HOURS


        if(

            lastClaim !== 0 &&

            (now - lastClaim) < oneDay

        ){


            alert(
                "Daily income already claimed. Wait until timer finishes."
            );


            return;

        }





        const plans =

        user.vipPlans || {};



        let totalIncome = 0;



        const updates = {};





        Object.entries(plans)

        .forEach(([id,plan])=>{



            if(plan.status !== "active")
            return;




            const remaining =

            Number(plan.remainingDays || 0);




            if(remaining <= 0){


                updates[

                "vipPlans/" + id + "/status"

                ] = "expired";



                return;

            }





            totalIncome +=

            Number(plan.dailyIncome || 0);





        });





        if(totalIncome <= 0){


            alert(
                "No active VIP plan."
            );


            return;

        }





        const newBalance =

        Number(user.balance || 0)

        +

        totalIncome;






        // UPDATE USER


        await update(userRef,{

            balance:newBalance,

            lastClaim:now,

            ...updates

        });






        // SAVE TRANSACTION


        const txRef =

        push(

            ref(

            db,

            "transactions/" +

            currentUser.uid

            )

        );




        await set(txRef,{


            type:"Daily Income",


            amount:totalIncome,


            status:"completed",


            createdAt:now


        });







        alert(

            "Daily Income Claimed +"

            +

            totalIncome.toLocaleString()

            +

            " RWF"

        );



    }


    catch(error){


        console.error(
            "CLAIM ERROR:",
            error
        );


        alert(
            error.message
        );


    }


}







// ======================================
// COUNTDOWN TIMER
// ======================================


function updateClaimTimer(){



    if(!currentUser)
    return;



    get(

        ref(
            db,
            "users/" + currentUser.uid
        )

    )

    .then(snapshot=>{


        if(!snapshot.exists())
        return;



        const user = snapshot.val();



        const lastClaim =

        Number(
            user.lastClaim || 0
        );



        const oneDay =

        24 *

        60 *

        60 *

        1000;



        const remaining =

        oneDay -

        (Date.now() - lastClaim);





        if(remaining <= 0 || lastClaim === 0){



            if(claimTimer)

            claimTimer.textContent =
            "Ready to Claim";



            if(claimBtn)

            claimBtn.disabled = false;



            return;


        }





        if(claimBtn)

        claimBtn.disabled = true;





        const hours =

        Math.floor(

        remaining / 3600000

        );




        const minutes =

        Math.floor(

        (remaining % 3600000)

        / 60000

        );





        const seconds =

        Math.floor(

        (remaining % 60000)

        / 1000

        );





        if(claimTimer){


            claimTimer.textContent =

            hours + "h "

            +

            minutes + "m "

            +

            seconds + "s";


        }




    });



}






// UPDATE TIMER EVERY SECOND


setInterval(()=>{


    updateClaimTimer();


},1000);




console.log(
"VIP PART 3 COMPLETE"
);

        
// ======================================
// VIP.JS - PART 4
// VIP EXPIRATION SYSTEM
// AUTO UPDATE + FINAL CLEANUP
// ======================================



// ======================================
// CHECK VIP EXPIRATION
// ======================================

async function checkVipExpiration(){


    if(!currentUser)
    return;



    const userRef =

    ref(
        db,
        "users/" + currentUser.uid
    );



    const snapshot =

    await get(userRef);



    if(!snapshot.exists())
    return;



    const user = snapshot.val();



    const plans =

    user.vipPlans || {};



    const updates = {};



    let changed = false;





    Object.entries(plans)

    .forEach(([id,plan])=>{



        if(plan.status !== "active")

        return;





        const purchasedAt =

        Number(plan.purchasedAt || 0);





        const totalDays =

        Number(plan.totalDays || 0);





        const daysPassed =

        Math.floor(

        (Date.now() - purchasedAt)

        /

        (1000*60*60*24)

        );





        const remainingDays =

        Math.max(

        0,

        totalDays - daysPassed

        );





        updates[

        "vipPlans/" + id + "/remainingDays"

        ]

        = remainingDays;





        if(remainingDays <= 0){



            updates[

            "vipPlans/" + id + "/status"

            ]

            = "expired";



        }





        changed = true;



    });






    if(changed){



        await update(

            userRef,

            updates

        );



    }



}






// ======================================
// AUTO REFRESH VIP STATUS
// ======================================


setInterval(()=>{


    if(currentUser){


        checkVipExpiration();


    }


},60000);






// ======================================
// UPDATE ALL VIP INFORMATION
// ======================================

function refreshVipSystem(){



    checkVipExpiration();



    calculateVipTotals();



    renderOwnedVipPlans();



    updateVipButtons();



}





// ======================================
// RUN WHEN USER LOADS
// ======================================

if(currentUser){


    refreshVipSystem();


}





// ======================================
// FINAL READY MESSAGE
// ======================================


console.log(
"Money Vault Pro VIP SYSTEM COMPLETE"
);

            // ======================================
// VIP.JS - PART 5
// VIP SYSTEM TESTING + FINAL FIXES
// ======================================



// ======================================
// CHECK FIREBASE CONNECTION
// ======================================

function checkVipConnection(){


    if(!currentUser){


        console.log(
            "No user logged in"
        );


        return false;

    }


    console.log(
        "VIP System Connected:",
        currentUser.uid
    );


    return true;


}





// ======================================
// SAFE NUMBER FORMAT
// ======================================

function formatMoney(amount){


    return Number(amount || 0)

    .toLocaleString()

    + " RWF";


}





// ======================================
// VERIFY USER BALANCE
// ======================================

async function verifyUserBalance(){


    if(!currentUser) return;



    const snapshot =

    await get(

        ref(
            db,
            "users/" + currentUser.uid
        )

    );



    if(!snapshot.exists())
    return;



    const user = snapshot.val();



    console.log(

        "Current Balance:",

        formatMoney(user.balance)

    );


}






// ======================================
// VERIFY VIP PLANS
// ======================================

async function verifyVipPlans(){


    const snapshot =

    await get(

        ref(
            db,
            "vipPlans"
        )

    );



    if(!snapshot.exists()){


        console.log(
            "No VIP packages found"
        );


        return;

    }



    console.log(
        "VIP Packages:",
        snapshot.val()
    );


}






// ======================================
// VERIFY PURCHASED VIP
// ======================================

async function verifyUserVip(){


    if(!currentUser)
    return;



    const snapshot =

    await get(

        ref(
            db,
            "users/" +

            currentUser.uid +

            "/vipPlans"

        )

    );



    if(!snapshot.exists()){


        console.log(
            "No purchased VIP"
        );


        return;

    }



    console.log(

        "User VIP Plans:",

        snapshot.val()

    );


}





// ======================================
// RUN FULL VIP TEST
// ======================================

async function testVipSystem(){



    console.log(
        "====== VIP SYSTEM TEST ======"
    );



    checkVipConnection();



    await verifyUserBalance();



    await verifyVipPlans();



    await verifyUserVip();



    console.log(
        "====== TEST COMPLETE ======"
    );


}




console.log(
"VIP PART 5 READY"
);

            
