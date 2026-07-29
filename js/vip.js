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

        

            
