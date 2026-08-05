// ======================================
// ADMIN.JS - PART 1
// Money Vault Admin Panel
// FIREBASE + GLOBAL SETUP CLEAN
// ======================================


// ================================
// FIREBASE IMPORTS
// ================================

import { auth, db } from "./firebase.js";


// ================================
// FIREBASE AUTH
// ================================

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// ================================
// FIREBASE DATABASE
// ================================

import {
    ref,
    get,
    onValue,
    update,
    push,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ================================
// GLOBAL VARIABLES
// ================================

let currentAdmin = null;

let usersData = {};

let depositsData = {};

let withdrawsData = {};

let vipRequestsData = {};

let transactionsData = {};


// ================================
// DOM SHORTCUT
// ================================

const $ = (id) => document.getElementById(id);


// ================================
// ADMIN STATE
// ================================

let adminReady = false;


// ================================
// ERROR HANDLER
// ================================

function showError(error){

    console.error(
        "Admin Error:",
        error
    );

    alert(
        error.message || "Unknown error"
    );

}

    // ======================================
// PART 2
// ADMIN AUTHENTICATION SYSTEM
// ======================================


// ================================
// CHECK ADMIN LOGIN
// ================================

onAuthStateChanged(auth, async (user) => {


    try {


        // Nta user winjiye

        if(!user){

            window.location.href = "login.html";

            return;

        }



        // Shaka admin data

        const adminRef = ref(
            db,
            "admins/" + user.uid
        );


        const adminSnap = await get(adminRef);



        // Ntabwo ari admin

        if(!adminSnap.exists()){


            alert(
                "Access denied. Admin only."
            );


            await signOut(auth);


            window.location.href = "login.html";


            return;

        }



        // Admin yemerewe

        currentAdmin = user;

        adminReady = true;



        console.log(
            "Admin logged in:",
            user.email
        );



        // Tangiza system nyuma ya auth gusa

        loadDashboardFinal();

        loadDeposits();

        loadWithdraws();

        loadVipRequests();

        loadVipBuyers();

        loadBonusRequests();

        loadUsers();

        loadTransactions();



    }


    catch(error){


        console.error(
            "Admin Error:",
            error
        );


        alert(
            error.message || "Admin authentication failed"
        );


    }


});




// ================================
// ADMIN LOGOUT
// ================================

async function logoutAdmin(){


    try{


        await signOut(auth);


        window.location.href =
        "login.html";


    }


    catch(error){


        showError(error);


    }


}


// Global export

window.logoutAdmin = logoutAdmin;


    // ======================================
// PART 3
// ADMIN DASHBOARD STATISTICS
// ======================================


// ================================
// LOAD DASHBOARD DATA
// ================================

async function loadDashboardFinal(){


    try{


        if(!adminReady){

            console.log(
                "Admin not ready yet"
            );

            return;

        }



        // ============================
        // USERS
        // ============================

        const usersRef = ref(
            db,
            "users"
        );


        const usersSnap = await get(usersRef);


        let totalUsers = 0;


        if(usersSnap.exists()){


            usersData = usersSnap.val();


            totalUsers =
            Object.keys(usersData).length;


        }




        // ============================
        // DEPOSITS
        // ============================

        const depositRef = ref(
            db,
            "depositRequests"
        );


        const depositSnap = await get(depositRef);


        let totalDeposits = 0;


        if(depositSnap.exists()){


            const deposits =
            depositSnap.val();


            Object.values(deposits)
            .forEach(item=>{


                if(item.status === "approved"){

                    totalDeposits +=
                    Number(item.amount || 0);

                }


            });


        }




        // ============================
        // WITHDRAWS
        // ============================

        const withdrawRef = ref(
            db,
            "withdrawRequests"
        );


        const withdrawSnap = await get(withdrawRef);


        let totalWithdraws = 0;


        if(withdrawSnap.exists()){


            const withdraws =
            withdrawSnap.val();


            Object.values(withdraws)
            .forEach(item=>{


                if(item.status === "approved"){

                    totalWithdraws +=
                    Number(item.amount || 0);

                }


            });


        }




        // ============================
        // UPDATE UI
        // ============================


        if($("totalUsers")){

            $("totalUsers").innerText =
            totalUsers;

        }



        if($("totalDeposits")){

            $("totalDeposits").innerText =
            totalDeposits.toLocaleString()
            + " RWF";

        }



        if($("totalWithdraws")){

            $("totalWithdraws").innerText =
            totalWithdraws.toLocaleString()
            + " RWF";

        }



        // System balance

        let systemBalance =
        totalDeposits - totalWithdraws;



        if($("systemBalance")){

            $("systemBalance").innerText =
            systemBalance.toLocaleString()
            + " RWF";

        }



        console.log(
            "Dashboard loaded successfully"
        );


    }


    catch(error){


        console.error(
            "Dashboard Error:",
            error
        );


        alert(
            error.message
        );


    }


}



// ================================
// EXPORT
// ================================

window.loadDashboardFinal =
loadDashboardFinal;

// ======================================
// PART 4
// DEPOSIT REQUEST MANAGEMENT
// ======================================


// ================================
// LOAD DEPOSIT REQUESTS
// ================================

function loadDeposits(){


    if(!adminReady){

        return;

    }


    const depositRef = ref(
        db,
        "depositRequests"
    );


    onValue(depositRef, (snapshot)=>{


        depositsData =
        snapshot.exists()
        ? snapshot.val()
        : {};



        renderDeposits();


    });


}




// ================================
// RENDER DEPOSITS
// ================================

function renderDeposits(){


    const container =
    $("depositList");



    if(!container){

        return;

    }



    container.innerHTML = "";



    Object.entries(depositsData)
    .forEach(([id,deposit])=>{


        const status =
        deposit.status || "pending";



        const div =
        document.createElement("div");



        div.className =
        "request-card";



        div.innerHTML = `

        <p>
        User: ${deposit.userEmail || deposit.uid}
        </p>


        <p>
        Amount:
        ${Number(deposit.amount || 0).toLocaleString()}
        RWF
        </p>


        <p>
        Status:
        ${status}
        </p>


        ${
        status === "pending"
        ?

        `

        <button 
        class="approveDeposit"
        data-id="${id}">
        Approve
        </button>


        <button
        class="rejectDeposit"
        data-id="${id}">
        Reject
        </button>

        `

        :

        ""

        }

        `;



        container.appendChild(div);



    });



    attachDepositButtons();


}




// ================================
// BUTTON EVENTS
// ================================

function attachDepositButtons(){



    document
    .querySelectorAll(".approveDeposit")
    .forEach(button=>{


        button.onclick = async ()=>{


            const id =
            button.dataset.id;



            button.style.display =
            "none";



            await approveDeposit(id,button);



        };


    });





    document
    .querySelectorAll(".rejectDeposit")
    .forEach(button=>{


        button.onclick = async ()=>{


            const id =
            button.dataset.id;



            button.style.display =
            "none";



            await rejectDeposit(id,button);



        };


    });


}




// ================================
// APPROVE DEPOSIT
// ================================

async function approveDeposit(id,button){


    try{


        const deposit =
        depositsData[id];



        if(!deposit ||
        deposit.status !== "pending"){

            return;

        }



        const userRef =
        ref(
            db,
            "users/" + deposit.uid
        );



        const userSnap =
        await get(userRef);



        let oldBalance = 0;



        if(userSnap.exists()){


            oldBalance =
            Number(
            userSnap.val().balance || 0
            );


        }



        const newBalance =
        oldBalance +
        Number(deposit.amount || 0);




        await update(userRef,{

            balance:newBalance

        });




        await update(
            ref(
            db,
            "depositRequests/" + id
            ),

            {

            status:"approved",
            approvedAt:Date.now()

            }

        );



        await push(
            ref(db,"transactions"),
            {

            uid:deposit.uid,
            type:"deposit",
            amount:Number(deposit.amount),
            status:"approved",
            date:Date.now()

            }

        );



        button.style.display =
        "none";



        loadDashboardFinal();



    }


    catch(error){


        console.error(
            "Approve Deposit Error:",
            error
        );


        alert(error.message);


    }


}




// ================================
// REJECT DEPOSIT
// ================================

async function rejectDeposit(id,button){


    try{


        const deposit =
        depositsData[id];



        if(!deposit ||
        deposit.status !== "pending"){

            return;

        }




        await update(

            ref(
            db,
            "depositRequests/" + id
            ),

            {

            status:"rejected",
            rejectedAt:Date.now()

            }

        );



        button.style.display =
        "none";



    }


    catch(error){


        console.error(
            "Reject Deposit Error:",
            error
        );


        alert(error.message);


    }


}



// ================================
// EXPORT
// ================================

window.loadDeposits =
loadDeposits;

      // ======================================
// PART 5
// WITHDRAW REQUEST MANAGEMENT
// ======================================


// ================================
// LOAD WITHDRAW REQUESTS
// ================================

function loadWithdraws(){


    if(!adminReady){

        return;

    }


    const withdrawRef = ref(
        db,
        "withdrawRequests"
    );



    onValue(withdrawRef, (snapshot)=>{


        withdrawsData =
        snapshot.exists()
        ? snapshot.val()
        : {};



        renderWithdraws();


    });


}




// ================================
// RENDER WITHDRAWS
// ================================

function renderWithdraws(){


    const container =
    $("withdrawList");



    if(!container){

        return;

    }



    container.innerHTML = "";



    Object.entries(withdrawsData)
    .forEach(([id,withdraw])=>{


        const status =
        withdraw.status || "pending";



        const div =
        document.createElement("div");



        div.className =
        "request-card";



        div.innerHTML = `

        <p>
        User:
        ${withdraw.userEmail || withdraw.uid}
        </p>


        <p>
        Amount:
        ${Number(withdraw.amount || 0)
        .toLocaleString()}
        RWF
        </p>


        <p>
        Status:
        ${status}
        </p>


        ${
        status === "pending"

        ?

        `

        <button
        class="approveWithdraw"
        data-id="${id}">
        Approve
        </button>


        <button
        class="rejectWithdraw"
        data-id="${id}">
        Reject
        </button>

        `

        :

        ""

        }

        `;



        container.appendChild(div);



    });



    attachWithdrawButtons();


}




// ================================
// BUTTON EVENTS
// ================================

function attachWithdrawButtons(){



    document
    .querySelectorAll(".approveWithdraw")
    .forEach(button=>{


        button.onclick = async ()=>{


            const id =
            button.dataset.id;



            button.style.display =
            "none";



            await approveWithdraw(id,button);



        };


    });





    document
    .querySelectorAll(".rejectWithdraw")
    .forEach(button=>{


        button.onclick = async ()=>{


            const id =
            button.dataset.id;



            button.style.display =
            "none";



            await rejectWithdraw(id,button);



        };


    });


}




// ================================
// APPROVE WITHDRAW
// ================================

async function approveWithdraw(id,button){


    try{


        const withdraw =
        withdrawsData[id];



        if(!withdraw ||
        withdraw.status !== "pending"){


            return;


        }





        const userRef =
        ref(
        db,
        "users/" + withdraw.uid
        );



        const userSnap =
        await get(userRef);



        if(!userSnap.exists()){


            throw new Error(
            "User not found"
            );


        }



        let balance =
        Number(
        userSnap.val().balance || 0
        );



        let amount =
        Number(
        withdraw.amount || 0
        );



        if(balance < amount){


            throw new Error(
            "Insufficient user balance"
            );


        }




        await update(
        userRef,
        {

            balance:
            balance - amount

        });





        await update(

        ref(
        db,
        "withdrawRequests/" + id
        ),

        {

            status:"approved",
            approvedAt:Date.now()

           
        }

        );



        button.style.display =
        "none";



    }



    catch(error){


        console.error(
        "Reject Withdraw Error:",
        error
        );


        alert(error.message);


    }


}




// ================================
// EXPORT
// ================================

window.loadWithdraws =
loadWithdraws;




            
