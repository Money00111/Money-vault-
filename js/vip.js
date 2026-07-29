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

            
