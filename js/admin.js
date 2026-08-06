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

alert("ADMIN AUTH OK");

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



        if($("dashboardTotalDeposits")){

    $("dashboardTotalDeposits").innerText =
    totalDeposits.toLocaleString()
    + " RWF";

    }



        if($("dashboardTotalWithdraws")){

    $("dashboardTotalWithdraws").innerText =
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

await notifyDepositApproved(deposit);


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





        await push(

        ref(
        db,
        "transactions"
        ),

        {

            uid:withdraw.uid,
            type:"withdraw",
            amount:amount,
            status:"approved",
            date:Date.now()

        }

        );


await notifyWithdrawApproved(withdraw);



        button.style.display =
        "none";



        loadDashboardFinal();



    }



    catch(error){


        console.error(
        "Approve Withdraw Error:",
        error
        );


        alert(error.message);


    }


}



// ================================
// REJECT WITHDRAW
// ================================

async function rejectWithdraw(id,button){


    try{


        const withdraw =
        withdrawsData[id];



        if(!withdraw ||
        withdraw.status !== "pending"){


            return;


        }




        await update(

        ref(
        db,
        "withdrawRequests/" + id
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
// ======================================
// PART 6
// VIP REQUESTS + VIP BUYERS MANAGEMENT
// ======================================


// ================================
// LOAD VIP REQUESTS
// ================================

function loadVipRequests(){


    if(!adminReady){

        return;

    }



    const vipRef = ref(
        db,
        "vipRequests"
    );



    onValue(vipRef,(snapshot)=>{


        vipRequestsData =
        snapshot.exists()
        ? snapshot.val()
        : {};



        renderVipRequests();


    });


}




// ================================
// RENDER VIP REQUESTS
// ================================

function renderVipRequests(){


    const container =
    $("vipRequestList");



    if(!container){

        return;

    }



    container.innerHTML = "";



    Object.entries(vipRequestsData)
    .forEach(([id,vip])=>{


        const status =
        vip.status || "pending";



        const div =
        document.createElement("div");



        div.className =
        "request-card";



        div.innerHTML = `

        <p>
        User:
        ${vip.userEmail || vip.uid}
        </p>


        <p>
        VIP:
        ${vip.vipName || vip.name}
        </p>


        <p>
        Price:
        ${Number(vip.price || 0)
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
        class="approveVip"
        data-id="${id}">
        Approve
        </button>


        <button
        class="rejectVip"
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



    attachVipButtons();


}




// ================================
// VIP BUTTON EVENTS
// ================================

function attachVipButtons(){


    document
    .querySelectorAll(".approveVip")
    .forEach(button=>{


        button.onclick = async ()=>{


            const id =
            button.dataset.id;



            button.style.display =
            "none";



            await approveVipRequest(
            id,
            button
            );


        };


    });




    document
    .querySelectorAll(".rejectVip")
    .forEach(button=>{


        button.onclick = async ()=>{


            const id =
            button.dataset.id;



            button.style.display =
            "none";



            await rejectVipRequest(
            id,
            button
            );


        };


    });


}





// ================================
// APPROVE VIP REQUEST
// ================================

async function approveVipRequest(id,button){


    try{


        const vip =
        vipRequestsData[id];



        if(!vip ||
        vip.status !== "pending"){

            return;

        }




        await update(

        ref(
        db,
        "vipRequests/" + id
        ),

        {

            status:"approved",
            approvedAt:Date.now()

        }

        );

                




        // save user active VIP

        await push(

        ref(
        db,
        "users/" + vip.uid + "/activeVips"
        ),

        {

            vipName:
            vip.vipName || vip.name,

            price:
            Number(vip.price || 0),

            dailyIncome:
            Number(vip.dailyIncome || 0),

            duration:
            Number(vip.duration || 0),

            startDate:
            Date.now()

        }

        );




        await push(

        ref(
        db,
        "transactions"
        ),

        {

            uid:vip.uid,
            type:"vip_purchase",
            amount:Number(vip.price || 0),
            status:"approved",
            date:Date.now()

        }

        );

await notifyVipApproved(vip);

        button.style.display =
        "none";



    }



    catch(error){


        console.error(
        "Approve VIP Error:",
        error
        );


        alert(error.message);


    }


}





// ================================
// REJECT VIP REQUEST
// ================================

async function rejectVipRequest(id,button){


    try{


        const vip =
        vipRequestsData[id];



        if(!vip ||
        vip.status !== "pending"){

            return;

        }




        await update(

        ref(
        db,
        "vipRequests/" + id
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
        "Reject VIP Error:",
        error
        );


        alert(error.message);


    }


}




// ================================
// LOAD VIP BUYERS
// ================================

function loadVipBuyers(){


    if(!adminReady){

        return;

    }



    const usersRef =
    ref(
    db,
    "users"
    );



    onValue(usersRef,(snapshot)=>{


        const container =
        $("vipBuyerList");



        if(!container){

            return;

        }



        container.innerHTML = "";



        if(!snapshot.exists()){

            return;

        }



        const users =
        snapshot.val();



        Object.entries(users)
        .forEach(([uid,user])=>{


            if(user.activeVips){


                const div =
                document.createElement("div");



                div.className =
                "request-card";



                div.innerHTML = `

                <p>
                User:
                ${user.email || uid}
                </p>


                <p>
                Active VIPs:
                ${Object.keys(user.activeVips).length}
                </p>

                `;



                container.appendChild(div);


            }


        });


    });


}



// ================================
// EXPORT
// ================================

window.loadVipRequests =
loadVipRequests;

window.loadVipBuyers =
loadVipBuyers;

// ======================================
// PART 7
// USERS MANAGEMENT + DELETE USER
// ======================================


// ================================
// LOAD USERS
// ================================

function loadUsers() {

    if (!adminReady) return;

    const usersRef = ref(db, "users");

    onValue(usersRef, (snapshot) => {

        usersData = snapshot.exists() ? snapshot.val() : {};

        renderUsers();

    });

}



// ================================
// RENDER USERS
// ================================

function renderUsers() {

    const container = $("usersList");

    if (!container) return;

    container.innerHTML = "";

    Object.entries(usersData).forEach(([uid, user]) => {

        const div = document.createElement("div");

        div.className = "user-card";

        div.innerHTML = `

            <p><strong>Name:</strong> ${user.fullName || user.name || "Unknown"}</p>

            <p><strong>Email:</strong> ${user.email || "No Email"}</p>

            <p><strong>Phone:</strong> ${user.phone || "-"}</p>

            <p><strong>Balance:</strong>
                ${Number(user.balance || 0).toLocaleString()} RWF
            </p>

            <p><strong>Status:</strong>
                ${user.status || "active"}
            </p>

            <button
                class="deleteUserBtn"
                data-uid="${uid}">
                Delete
            </button>

        `;

        container.appendChild(div);

    });

    attachUserButtons();

}



// ================================
// DELETE BUTTON EVENTS
// ================================

function attachUserButtons() {

    document.querySelectorAll(".deleteUserBtn")
        .forEach(button => {

            button.onclick = async () => {

                const uid = button.dataset.uid;

                const ok = confirm(
                    "Delete this user permanently?"
                );

                if (!ok) return;

                button.disabled = true;

                try {

                    await deleteUser(uid);

                    button.style.display = "none";

                } catch (error) {

                    button.disabled = false;

                    showError(error);

                }

            };

        });

}



// ================================
// DELETE USER
// ================================

async function deleteUser(uid) {

    try {

        await remove(
            ref(db, "users/" + uid)
        );

        // Optional cleanup

        const paths = [
            "depositRequests",
            "withdrawRequests",
            "vipRequests"
        ];

        for (const path of paths) {

            const listRef = ref(db, path);

            const snap = await get(listRef);

            if (!snap.exists()) continue;

            const data = snap.val();

            for (const [key, value] of Object.entries(data)) {

                if (value.uid === uid) {

                    await remove(
                        ref(db, `${path}/${key}`)
                    );

                }

            }

        }

        console.log("User deleted:", uid);

        loadDashboardFinal();

    } catch (error) {

        throw error;

    }

}



// ================================
// EXPORT
// ================================

window.loadUsers = loadUsers;
window.deleteUser = deleteUser;
            
// ======================================
// PART 8
// TRANSACTIONS + NOTIFICATIONS
// ======================================


// ================================
// LOAD TRANSACTIONS
// ================================

function loadTransactions() {

    if (!adminReady) return;

    const transactionsRef = ref(db, "transactions");

    onValue(transactionsRef, (snapshot) => {

        transactionsData = snapshot.exists()
            ? snapshot.val()
            : {};

        renderTransactions();

    });

}


// ================================
// RENDER TRANSACTIONS
// ================================

function renderTransactions() {

    const container = $("transactionList");

    if (!container) return;

    container.innerHTML = "";

    const transactions = Object.entries(transactionsData)
        .sort((a, b) => {

            const timeA = a[1].date || 0;
            const timeB = b[1].date || 0;

            return timeB - timeA;

        });

    transactions.forEach(([id, tx]) => {

        const card = document.createElement("div");

        card.className = "transaction-card";

        card.innerHTML = `

            <p><strong>User:</strong> ${tx.userEmail || tx.uid || "-"}</p>

            <p><strong>Type:</strong> ${tx.type || "-"}</p>

            <p><strong>Amount:</strong> ${Number(tx.amount || 0).toLocaleString()} RWF</p>

            <p><strong>Status:</strong> ${tx.status || "-"}</p>

            <p><strong>Date:</strong> ${tx.date ? new Date(tx.date).toLocaleString() : "-"}</p>

        `;

        container.appendChild(card);

    });

}


// ================================
// SEND USER NOTIFICATION
// ================================

async function sendNotification(uid, title, message) {

    try {

        if (!uid) return;

        await push(
            ref(db, `notifications/${uid}`),
            {
                title,
                message,
                read: false,
                createdAt: Date.now()
            }
        );

    } catch (error) {

        console.error(
            "Notification Error:",
            error
        );

    }

}


// ================================
// HELPER NOTIFICATIONS
// ================================

async function notifyDepositApproved(deposit) {

    await sendNotification(
        deposit.uid,
        "Deposit Approved",
        `Your deposit of ${Number(deposit.amount).toLocaleString()} RWF has been approved.`
    );

}


async function notifyWithdrawApproved(withdraw) {

    await sendNotification(
        withdraw.uid,
        "Withdraw Approved",
        `Your withdrawal of ${Number(withdraw.amount).toLocaleString()} RWF has been approved.`
    );

}


async function notifyVipApproved(vip) {

    await sendNotification(
        vip.uid,
        "VIP Approved",
        `${vip.vipName || vip.name} has been activated successfully.`
    );

}


// ================================
// EXPORT
// ================================

window.loadTransactions = loadTransactions;
window.sendNotification = sendNotification;
window.notifyDepositApproved = notifyDepositApproved;
window.notifyWithdrawApproved = notifyWithdrawApproved;
window.notifyVipApproved = notifyVipApproved;


// ======================================
// PART 9
// BONUS REQUESTS + SYSTEM SETTINGS
// ======================================


// ================================
// LOAD BONUS REQUESTS
// ================================

function loadBonusRequests() {

    if (!adminReady) return;

    const bonusRef = ref(db, "bonusRequests");

    onValue(bonusRef, (snapshot) => {

        const bonusData = snapshot.exists()
            ? snapshot.val()
            : {};

        renderBonusRequests(bonusData);

    });

}



// ================================
// RENDER BONUS REQUESTS
// ================================

function renderBonusRequests(bonusData) {

    const container = $("bonusRequestList");

    if (!container) return;

    container.innerHTML = "";

    Object.entries(bonusData).forEach(([id, bonus]) => {

        const status = bonus.status || "pending";

        const card = document.createElement("div");

        card.className = "request-card";

        card.innerHTML = `

            <p><strong>User:</strong> ${bonus.userEmail || bonus.uid}</p>

            <p><strong>Amount:</strong> ${Number(bonus.amount || 0).toLocaleString()} RWF</p>

            <p><strong>Reason:</strong> ${bonus.reason || "-"}</p>

            <p><strong>Status:</strong> ${status}</p>

            ${
                status === "pending"
                    ? `
                        <button class="approveBonusBtn" data-id="${id}">
                            Approve
                        </button>

                        <button class="rejectBonusBtn" data-id="${id}">
                            Reject
                        </button>
                    `
                    : ""
            }

        `;

        container.appendChild(card);

    });

    attachBonusButtons();

}



// ================================
// BONUS BUTTONS
// ================================

function attachBonusButtons() {

    document.querySelectorAll(".approveBonusBtn")
        .forEach(button => {

            button.onclick = async () => {

                button.disabled = true;

                await approveBonus(
                    button.dataset.id,
                    button
                );

            };

        });


    document.querySelectorAll(".rejectBonusBtn")
        .forEach(button => {

            button.onclick = async () => {

                button.disabled = true;

                await rejectBonus(
                    button.dataset.id,
                    button
                );

            };

        });

}



// ================================
// APPROVE BONUS
// ================================

async function approveBonus(id, button) {

    try {

        const bonusRef = ref(db, "bonusRequests/" + id);

        const snap = await get(bonusRef);

        if (!snap.exists()) return;

        const bonus = snap.val();
                if (bonus.status !== "pending") return;

        const userRef = ref(db, "users/" + bonus.uid);

        const userSnap = await get(userRef);

        if (!userSnap.exists()) {

            throw new Error("User not found");

        }

        const balance =
            Number(userSnap.val().balance || 0);

        const amount =
            Number(bonus.amount || 0);

        await update(userRef, {

            balance: balance + amount

        });

        await update(bonusRef, {

            status: "approved",
            approvedAt: Date.now()

        });

        await push(ref(db, "transactions"), {

            uid: bonus.uid,
            type: "bonus",
            amount: amount,
            status: "approved",
            date: Date.now()

        });

        await sendNotification(

            bonus.uid,

            "Bonus Approved",

            `You received ${amount.toLocaleString()} RWF bonus.`

        );

        button.style.display = "none";

        loadDashboardFinal();

    }

    catch (error) {

        showError(error);

    }

}



// ================================
// REJECT BONUS
// ================================

async function rejectBonus(id, button) {

    try {

        const bonusRef =
            ref(db, "bonusRequests/" + id);

        const snap = await get(bonusRef);

        if (!snap.exists()) return;

        const bonus = snap.val();

        if (bonus.status !== "pending") return;

        await update(bonusRef, {

            status: "rejected",
            rejectedAt: Date.now()

        });

        await sendNotification(

            bonus.uid,

            "Bonus Rejected",

            "Your bonus request was rejected."

        );

        button.style.display = "none";

    }

    catch (error) {

        showError(error);

    }

}



// ================================
// SYSTEM SETTINGS
// ================================

async function saveSystemSettings(settings) {

    try {

        await update(
            ref(db, "systemSettings"),
            settings
        );

        alert("Settings saved successfully.");

    }

    catch (error) {

        showError(error);

    }

}



async function loadSystemSettings() {

    try {

        const snap = await get(
            ref(db, "systemSettings")
        );

        return snap.exists()
            ? snap.val()
            : {};

    }

    catch (error) {

        showError(error);

        return {};

    }

}



// ================================
// EXPORT
// ================================

window.loadBonusRequests = loadBonusRequests;
window.saveSystemSettings = saveSystemSettings;
window.loadSystemSettings = loadSystemSettings


// ======================================
// PART 10
// FINAL STARTUP + GLOBAL EXPORTS
// ======================================


// ================================
// STARTUP CHECK
// ================================

function initializeAdmin() {

    console.log("=================================");
    console.log("Money Vault Admin Initialized");
    console.log("=================================");

    // Irinda gutangira kabiri
    if (window.__ADMIN_INITIALIZED__) {
        return;
    }

    window.__ADMIN_INITIALIZED__ = true;

}


// ================================
// SAFE FUNCTION CHECK
// ================================

const requiredFunctions = [

    "loadDashboardFinal",
    "loadDeposits",
    "loadWithdraws",
    "loadVipRequests",
    "loadVipBuyers",
    "loadBonusRequests",
    "loadUsers",
    "loadTransactions",
    "logoutAdmin"

];

requiredFunctions.forEach(name => {

    if (typeof window[name] !== "function") {

        console.warn(
            `${name} is missing`
        );

    }

});


// ================================
// GLOBAL EXPORTS
// ================================

window.loadDashboardFinal = loadDashboardFinal;

window.loadDeposits = loadDeposits;

window.loadWithdraws = loadWithdraws;

window.loadVipRequests = loadVipRequests;

window.loadVipBuyers = loadVipBuyers;

window.loadBonusRequests = loadBonusRequests;

window.loadUsers = loadUsers;

window.loadTransactions = loadTransactions;

window.logoutAdmin = logoutAdmin;

window.approveDeposit = approveDeposit;

window.rejectDeposit = rejectDeposit;

window.approveWithdraw = approveWithdraw;

window.rejectWithdraw = rejectWithdraw;

window.approveVipRequest = approveVipRequest;

window.rejectVipRequest = rejectVipRequest;

window.deleteUser = deleteUser;

window.sendNotification = sendNotification;

window.saveSystemSettings = saveSystemSettings;

window.loadSystemSettings = loadSystemSettings;


// ================================
// GLOBAL ERROR HANDLER
// ================================

window.addEventListener("error", (event) => {
console.error(
        "JavaScript Error:",
        event.error || event.message
    );

});


window.addEventListener("unhandledrejection", (event) => {

    console.error(
        "Unhandled Promise:",
        event.reason
    );

});


// ================================
// START
// ================================

initializeAdmin();

console.log("Admin.js loaded successfully.");
                        
