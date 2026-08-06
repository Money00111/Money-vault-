// ======================================
// ADMIN.JS - PART 1
// FIREBASE + AUTH + GLOBAL SETUP
// ======================================


// ================================
// FIREBASE IMPORTS
// ================================

import { auth, db } from "./firebase.js";


import {
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


import {
    ref,
    get,
    update,
    push,
    set,
    increment
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";




// ================================
// GLOBAL VARIABLES
// ================================

let currentAdmin = null;

let adminReady = false;


let usersData = {};

let depositsData = {};

let withdrawsData = {};

let vipRequestsData = {};

let transactionsData = {};

let vipBuyersData = [];



// ================================
// DOM SHORTCUT
// ================================

function $(id){

    return document.getElementById(id);

}



// ================================
// ERROR HANDLER
// ================================

function showError(error){

    console.error(
        "ADMIN ERROR:",
        error
    );

}



window.$ = $;

window.showError = showError;
// ======================================
// ADMIN.JS - PART 2
// ADMIN AUTHENTICATION SYSTEM
// ======================================



// ================================
// CHECK ADMIN ACCESS
// ================================

async function checkAdminAccess(user){


    if(!user){

        window.location.href =
        "login.html";

        return false;

    }



    const adminRef =
    ref(
        db,
        "admins/" + user.uid
    );



    const snapshot =
    await get(adminRef);



    if(!snapshot.exists()){


        alert(
        "Access Denied"
        );


        await signOut(auth);


        window.location.href =
        "login.html";


        return false;


    }



    currentAdmin = user;

    adminReady = true;



    return true;


}



// ================================
// AUTH LISTENER
// ================================

onAuthStateChanged(
auth,
async(user)=>{


    const allowed =
    await checkAdminAccess(user);



    if(allowed){


        console.log(
        "Admin authenticated"
        );


    }



});



// ================================
// EXPORT
// ================================

window.checkAdminAccess =
checkAdminAccess;

// ======================================
// ADMIN.JS - PART 3
// DASHBOARD BASIC SYSTEM
// ======================================



// ================================
// DASHBOARD ELEMENT UPDATE
// ================================

function updateDashboardCards(){



    const totalUsers =
    Object.keys(usersData || {})
    .length;



    let totalDeposits = 0;


    Object.values(depositsData || {})
    .forEach(item=>{


        if(item.status === "approved"){


            totalDeposits +=
            Number(item.amount || 0);


        }


    });



    let totalWithdraws = 0;


    Object.values(withdrawsData || {})
    .forEach(item=>{


        if(item.status === "approved"){


            totalWithdraws +=
            Number(item.amount || 0);


        }


    });





    if($("totalUsers")){

        $("totalUsers").innerText =
        totalUsers;

    }



    if($("totalDeposits")){

        $("totalDeposits").innerText =
        totalDeposits + " RWF";

    }



    if($("totalWithdraws")){

        $("totalWithdraws").innerText =
        totalWithdraws + " RWF";

    }



}



// ================================
// GLOBAL EXPORT
// ================================

window.updateDashboardCards =
updateDashboardCards;
