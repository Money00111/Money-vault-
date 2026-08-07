// ======================================
// ADMIN.JS - PART 1
// FIREBASE + ADMIN AUTH + GLOBAL SETUP
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
    get,
    set,
    update,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";




// ======================================
// GLOBAL VARIABLES
// ======================================

let currentAdmin = null;

let adminReady = false;



// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen =
document.getElementById("loadingScreen");


const adminName =
document.getElementById("adminName");


const adminEmail =
document.getElementById("adminEmail");


const logoutBtn =
document.getElementById("logoutBtn");


const menuBtn =
document.getElementById("menuBtn");


const sidebar =
document.getElementById("sidebar");


const pageTitle =
document.getElementById("pageTitle");



const menuLinks =
document.querySelectorAll(".menu-link");


const sections =
document.querySelectorAll(".page-section");





// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async(user)=>{


    if(!user){


        window.location.href =
        "login.html";


        return;

    }




    const adminSnapshot =
    await get(
        ref(db,"admins/"+user.uid)
    );





    if(!adminSnapshot.exists()){


        alert(
        "Access denied. Admin only."
        );


        await signOut(auth);


        window.location.href =
        "login.html";


        return;


    }






    currentAdmin = user;

    
    adminReady = true;


loadDashboard();
loadDeposits();
loadWithdraws();
// START ADMIN SYSTEMS AFTER AUTH ONLY

if(window.startAdminSystems){

    window.startAdminSystems();

    }



    const adminData =
    adminSnapshot.val();





    if(adminName){


        adminName.textContent =
        adminData.name ||
        "Administrator";


    }





    if(adminEmail){


        adminEmail.textContent =
        user.email || "";


    }







    if(loadingScreen){


        loadingScreen.style.display =
        "none";


    }






    console.log(
    "Admin authenticated:",
    user.email
    );



});








// ======================================
// LOGOUT
// ======================================


if(logoutBtn){


    logoutBtn.addEventListener(
    "click",
    async()=>{


        await signOut(auth);


        window.location.href =
        "login.html";


    });


}








// ======================================
// MOBILE SIDEBAR
// ======================================


if(menuBtn && sidebar){


    menuBtn.addEventListener(
    "click",
    ()=>{


        sidebar.classList.toggle(
        "active"
        );


    });


}








// ======================================
// PAGE NAVIGATION
// ======================================


menuLinks.forEach(link=>{


    link.addEventListener(
    "click",
    (event)=>{


        event.preventDefault();



        const page =
        link.dataset.page;



        openPage(page);



    });



});









function openPage(page){



    sections.forEach(section=>{


        section.classList.remove(
        "active"
        );


    });





    menuLinks.forEach(link=>{


        link.classList.remove(
        "active"
        );


    });






    const target =
    document.getElementById(
    page+"Section"
    );





    if(target){


        target.classList.add(
        "active"
        );


    }






    const activeLink =
    document.querySelector(
    `[data-page="${page}"]`
    );





    if(activeLink){


        activeLink.classList.add(
        "active"
        );


    }







    if(pageTitle){


        pageTitle.textContent =
        page
        .charAt(0)
        .toUpperCase()
        +
        page.slice(1);


    }




}







// ======================================
// EXPORT FOR OTHER PARTS
// ======================================


window.adminState = {


    get currentAdmin(){


        return currentAdmin;


    },


    get ready(){


        return adminReady;


    }


};



// ======================================
// PART 1 READY
// ======================================

console.log(
"Admin Part 1 Ready"
);

// ======================================
// ADMIN.JS - PART 2
// DASHBOARD SYSTEM FINAL
// ======================================



// ======================================
// NUMBER FORMAT
// ======================================

function formatMoney(amount){

    return Number(amount || 0)
    .toLocaleString()
    + " RWF";

}



// ======================================
// UPDATE TEXT HELPER
// ======================================

function updateText(id,value){

    const element =
    document.getElementById(id);


    if(element){

        element.textContent = value;

    }

}







// ======================================
// TOTAL USERS
// ======================================

function loadDashboardUsers(){


    onValue(
        ref(db,"users"),
        (snapshot)=>{


            let totalUsers = 0;


            if(snapshot.exists()){


                totalUsers =
                Object.keys(
                    snapshot.val()
                ).length;


            }



            updateText(
                "totalUsers",
                totalUsers
            );


        }

    );


}









// ======================================
// DEPOSIT STATISTICS
// ======================================

function loadDashboardDeposits(){



    onValue(
        ref(db,"depositRequests"),
        (snapshot)=>{



            let total = 0;

            let pending = 0;

            let approved = 0;

            let rejected = 0;





            if(snapshot.exists()){



                Object.values(
                    snapshot.val()
                )
                .forEach(deposit=>{


                    total++;



                    if(deposit.status === "pending"){

                        pending++;

                    }



                    else if(
                    deposit.status === "approved"
                    ){

                        approved++;

                    }



                    else if(
                    deposit.status === "rejected"
                    ){

                        rejected++;

                    }



                });



            }







            updateText(
                "dashboardTotalDeposits",
                total
            );


            updateText(
                "dashboardPendingDeposits",
                pending
            );


            updateText(
                "dashboardApprovedDeposits",
                approved
            );





            updateText(
                "depositTotalCount",
                total
            );


            updateText(
                "depositPendingCount",
                pending
            );


            updateText(
                "depositApprovedCount",
                approved
            );


            updateText(
                "depositRejectedCount",
                rejected
            );



        }

    );



}









// ======================================
// WITHDRAW STATISTICS
// ======================================

function loadDashboardWithdraws(){



    onValue(
        ref(db,"withdrawRequests"),
        (snapshot)=>{



            let total = 0;

            let pending = 0;

            let approved = 0;

            let rejected = 0;







            if(snapshot.exists()){



                Object.values(
                    snapshot.val()
                )
                .forEach(withdraw=>{



                    total++;



                    if(withdraw.status==="pending"){


                        pending++;


                    }



                    else if(
                    withdraw.status==="approved"
                    ){


                        approved++;


                    }



                    else if(
                    withdraw.status==="rejected"
                    ){


                        rejected++;


                    }



                });



            }







            updateText(
                "dashboardTotalWithdraws",
                total
            );



            updateText(
                "withdrawTotalCount",
                total
            );



            updateText(
                "withdrawPendingCount",
                pending
            );



            updateText(
                "withdrawApprovedCount",
                approved
            );



            updateText(
                "withdrawRejectedCount",
                rejected
            );



        }

    );



}









// ======================================
// SYSTEM BALANCE
// ======================================

function loadSystemBalance(){



    onValue(
        ref(db,"users"),
        (snapshot)=>{



            let totalBalance = 0;





            if(snapshot.exists()){



                Object.values(
                    snapshot.val()
                )
                .forEach(user=>{



                    totalBalance +=
                    Number(
                    user.balance || 0
                    );



                });



            }







            updateText(
                "systemBalance",
                formatMoney(totalBalance)
            );




        }

    );



}









// ======================================
// RECENT ACTIVITY
// ======================================

function loadRecentActivity(){



    const box =
    document.getElementById(
        "recentActivity"
    );



    if(!box) return;




onValue(
        ref(db,"transactions"),
        (snapshot)=>{



            box.innerHTML = "";





            if(!snapshot.exists()){


                box.innerHTML = `

                <div class="empty-state">

                <h3>
                No Recent Activity
                </h3>

                </div>

                `;


                return;


            }







            Object.entries(
                snapshot.val()
            )
            .reverse()
            .slice(0,10)
            .forEach(([id,item])=>{





                const date =
                item.date
                ?
                new Date(item.date)
                .toLocaleString()
                :
                "-";







                const activity =
                document.createElement(
                    "div"
                );



                activity.className =
                "activity-item";






                activity.innerHTML = `

                <p>

                <strong>
                ${(item.type || "TRANSACTION")
                .toUpperCase()}
                </strong>

                -
                ${formatMoney(item.amount)}

                </p>


                <span>
                ${item.status || "-"}
                |
                ${date}
                </span>


                `;





                box.appendChild(activity);



            });



        }

    );



}









// ======================================
// START DASHBOARD
// ======================================


function loadDashboard(){


    if(
    !window.adminState ||
    !window.adminState.ready
    ){

        return;

    }



    loadDashboardUsers();


    loadDashboardDeposits();


    loadDashboardWithdraws();


    loadSystemBalance();


    loadRecentActivity();


}






// EXPORT
window.loadDashboard =
loadDashboard;





console.log(
"Admin Part 2 Dashboard Ready"
);



// ======================================
// ADMIN.JS - PART 3
// DEPOSIT MANAGEMENT FINAL
// ======================================


// ================================
// LOAD DEPOSITS
// ================================

function loadDeposits(){

const depositRef = ref(db,"depositRequests");


onValue(depositRef, async(snapshot)=>{


const list =
document.getElementById("depositList");


const empty =
document.getElementById("emptyDeposit");


if(!list) return;


list.innerHTML="";


if(!snapshot.exists()){


if(empty)
empty.style.display="block";


return;

}


if(empty)
empty.style.display="none";



const deposits =
Object.entries(snapshot.val()).reverse();



for(const [id,deposit] of deposits){


let userData={};



if(deposit.uid){

const userSnap =
await get(
ref(db,"users/"+deposit.uid)
);


if(userSnap.exists()){

userData=userSnap.val();

}

}



const status =
deposit.status || "pending";



const card =
document.createElement("div");


card.className="request-card";



card.innerHTML=`

<div class="request-top">

<h3>
Deposit Request
</h3>

<span class="status ${status}">
${status}
</span>

</div>



<p>
<strong>Name:</strong>
${deposit.fullName || userData.name || userData.fullName || "-"}
</p>


<p>
<strong>Email:</strong>
${deposit.email || userData.email || "-"}
</p>


<p>
<strong>Amount:</strong>
${Number(deposit.amount || 0).toLocaleString()} RWF
</p>


<p>
<strong>Phone:</strong>
${deposit.senderPhone || userData.phone || "-"}
</p>


<p>
<strong>Payment Method:</strong>
${deposit.paymentMethod || "-"}
</p>


<p>
<strong>Transaction ID:</strong>
${deposit.transactionId || "-"}
</p>


<p>
<strong>Date:</strong>
${deposit.paymentDate || deposit.createdAt || "-"}
</p>



<div class="action-buttons">


<button
class="approveBtn"
${status!=="pending"?"disabled":""}
onclick="approveDeposit('${id}')">

<i class="fa-solid fa-circle-check"></i>

Approve

</button>



<button
class="rejectBtn"
${status!=="pending"?"disabled":""}
onclick="rejectDeposit('${id}')">

<i class="fa-solid fa-circle-xmark"></i>

Reject

</button>


</div>


`;



list.appendChild(card);


}


});


}







// ================================
// APPROVE DEPOSIT ONCE
// ================================

window.approveDeposit =
async function(id){


const depositRef =
ref(db,"depositRequests/"+id);


const snap =
await get(depositRef);



if(!snap.exists()) return;



const deposit =
snap.val();

console.log(id);
console.log(deposit);
console.log(currentAdmin);


// BLOCK DOUBLE APPROVE

if(deposit.status !== "pending"){

alert("Deposit already processed");

return;

}



const userRef =
ref(db,"users/"+deposit.uid);



const userSnap =
await get(userRef);



if(!userSnap.exists()){

alert("User not found");

return;

}



const user =
userSnap.val();



const oldBalance =
Number(user.balance || 0);



const amount =
Number(deposit.amount || 0);




// ADD MONEY ONLY ONCE

await update(userRef,{

balance:
oldBalance + amount,


totalDeposit:
Number(user.totalDeposit || 0)
+ amount

});





await update(depositRef,{

status:"approved",

approvedAt:Date.now(),

approvedBy:currentAdmin.uid

});





await set(

push(ref(db,"transactions")),

{

uid:deposit.uid,

type:"deposit",

amount:amount,

status:"approved",

reference:id,

date:Date.now()

}

);



alert(
"Deposit Approved Successfully"
);



loadDeposits();


if(window.loadDashboard){

window.loadDashboard();

}


};








// ================================
// REJECT DEPOSIT ONCE
// ================================

window.rejectDeposit =
async function(id){



const depositRef =
ref(db,"depositRequests/"+id);



const snap =
await get(depositRef);



if(!snap.exists()) return;



const deposit =
snap.val();

    console.log(id);
console.log(deposit);
console.log(currentAdmin);


// BLOCK DOUBLE REJECT

if(deposit.status !== "pending"){

alert("Deposit already processed");

return;

}




await update(depositRef,{

status:"rejected",

rejectedAt:Date.now(),

rejectedBy:currentAdmin.uid

});





await set(

push(ref(db,"transactions")),

{

uid:deposit.uid,

type:"deposit",

amount:Number(deposit.amount || 0),

status:"rejected",

reference:id,

date:Date.now()

}

);





alert(
"Deposit Rejected Successfully"
);



loadDeposits();


if(window.loadDashboard){

window.loadDashboard();

}



};






// ================================
// EXPORT
// ================================


window.loadDeposits =
loadDeposits;


console.log(
"Deposit System Ready"
);


// ======================================
// ADMIN.JS - PART 4
// QUICK ACTIONS
// ======================================

function goToPage(page){
    openPage(page);
}

document.getElementById("refreshDashboard")?.addEventListener("click", () => {
    loadDashboard();
});

document.getElementById("refreshDashboardQuick")?.addEventListener("click", () => {
    loadDashboard();
});

document.getElementById("openDeposits")?.addEventListener("click", () => {
    goToPage("deposits");
});

document.getElementById("openWithdraws")?.addEventListener("click", () => {
    goToPage("withdraws");
});

document.getElementById("openUsers")?.addEventListener("click", () => {
    goToPage("users");
});

document.getElementById("openTransactions")?.addEventListener("click", () => {
    goToPage("transactions");
});

document.getElementById("openSettings")?.addEventListener("click", () => {
    goToPage("settings");
});

document.getElementById("openVipRequests")?.addEventListener("click", () => {
    goToPage("vipRequests");
});

document.getElementById("openUsersBtn")?.addEventListener("click", () => {
    goToPage("users");
});

document.getElementById("openTransactionsBtn")?.addEventListener("click", () => {
    goToPage("transactions");
});

document.getElementById("openSettingsBtn")?.addEventListener("click", () => {
    goToPage("settings");
});

console.log("Quick Actions Ready");

      

// ======================================
// ADMIN.JS - PART 5
// WITHDRAW MANAGEMENT
// LIST + USER PROFILE + APPROVE + REJECT
// SEARCH + FILTER
// ======================================


// ======================================
// HTML ESCAPE
// ======================================

function escapeHTML(value){

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



// ======================================
// LOAD WITHDRAW LIST
// ======================================

function loadWithdraws(){

    const list =
        document.getElementById("withdrawList");

    const empty =
        document.getElementById("emptyWithdraw");


    if(!list){

        console.error(
            "withdrawList element not found"
        );

        return;

    }


    const withdrawRef =
        ref(db,"withdrawRequests");


    onValue(
        withdrawRef,
        async(snapshot)=>{

            list.innerHTML = "";


            // ==================================
            // NO DATA
            // ==================================

            if(!snapshot.exists()){

                if(empty){
                    empty.style.display = "block";
                }

                list.innerHTML = `
                    <div class="empty-state">

                        <i class="fa-solid fa-money-bill-transfer"></i>

                        <h3>
                            No Withdraw Requests
                        </h3>

                        <p>
                            Withdraw requests from users
                            will appear here.
                        </p>

                    </div>
                `;

                return;
            }


            if(empty){
                empty.style.display = "none";
            }


            const withdraws =
                Object.entries(
                    snapshot.val()
                ).reverse();


            // ==================================
            // RENDER EACH REQUEST
            // ==================================

            for(
                const [id, withdraw]
                of withdraws
            ){

                const request =
                    withdraw || {};


                // ==================================
                // USER UID
                // ==================================

                const uid =
                    request.uid ||
                    request.userId ||
                    request.userUID ||
                    "";


                // ==================================
                // LOAD USER PROFILE
                // ==================================

                let userData = {};


                if(uid){

                    try{

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" + uid
                                )
                            );


                        if(userSnap.exists()){

                            userData =
                                userSnap.val() || {};

                        }

                    }
                    catch(error){

                        console.error(
                            "User profile error:",
                            error
                        );

                    }

                }


                // ==================================
                // USER INFORMATION
                // ==================================

                const name =
                    request.fullName ||
                    request.name ||
                    userData.fullName ||
                    userData.name ||
                    userData.username ||
                    "Unknown User";


                const email =
                    request.email ||
                    userData.email ||
                    "-";


                const phone =
                    request.phone ||
                    request.phoneNumber ||
                    request.senderPhone ||
                    userData.phone ||
                    userData.phoneNumber ||
                    "-";


                // ==================================
                // WITHDRAW INFORMATION
                // ==================================

                const amount =
                    Number(
                        request.amount || 0
                    );


                const paymentMethod =
                    request.paymentMethod ||
                    request.method ||
                    "-";


                const accountNumber =
                    request.accountNumber ||
                    request.account ||
                    request.destination ||
                    request.phoneNumber ||
                    request.phone ||
                    "-";


                const date =
                    request.createdAt ||
                    request.requestDate ||
                    request.date ||
                    "-";


                const status =
                    String(
                        request.status ||
                        "pending"
                    ).toLowerCase();


                // ==================================
                // CREATE CARD
                // ==================================

                const card =
                    document.createElement("div");


                card.className =
                    "request-card";


                card.dataset.withdrawId =
                    id;


                card.innerHTML = `

                    <div class="request-top">

                        <h3>

                            <i class="fa-solid fa-money-bill-transfer"></i>

                            Withdraw Request

                        </h3>

                        <span class="status ${escapeHTML(status)}">

                            ${escapeHTML(status)}

                        </span>

                    </div>


                    <!-- USER PROFILE -->

                    <div class="user-profile-box">

                        <h4>

                            <i class="fa-solid fa-user"></i>

                            User Information

                        </h4>


                        <p>

                            <strong>Name:</strong>

                            ${escapeHTML(name)}

                        </p>


                        <p>

                            <strong>Email:</strong>

                            ${escapeHTML(email)}

                        </p>


                        <p>

                            <strong>Phone:</strong>

                            ${escapeHTML(phone)}

                        </p>


                        <p>

                            <strong>User ID:</strong>

                            ${escapeHTML(uid || "-")}

                        </p>

                    </div>


                    <!-- WITHDRAW DETAILS -->

                    <div class="withdraw-info">

                        <p>

                            <strong>Amount:</strong>

                            ${amount.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Payment Method:</strong>

                            ${escapeHTML(paymentMethod)}

                        </p>


                        <p>

                            <strong>Account Number:</strong>

                            ${escapeHTML(accountNumber)}

                        </p>


                        <p>

                            <strong>Request Date:</strong>

                            ${escapeHTML(date)}

                        </p>

                    </div>


                    <!-- ACTION BUTTONS -->

                    <div class="action-buttons">

                        <button

                            class="approveBtn withdrawApproveBtn"

                            data-id="${escapeHTML(id)}"

                            ${status !== "pending" ? "disabled" : ""}>

                            <i class="fa-solid fa-circle-check"></i>

                            ${status === "approved"
                                ? "Approved"
                                : "Approve Withdraw"}

                        </button>


                        <button

                            class="rejectBtn withdrawRejectBtn"

                            data-id="${escapeHTML(id)}"

                            ${status !== "pending" ? "disabled" : ""}>

                            <i class="fa-solid fa-circle-xmark"></i>

                            ${status === "rejected"
                                ? "Rejected"
                                : "Reject Withdraw"}

                        </button>

                    </div>

                `;


                list.appendChild(card);

            }


            // ==================================
            // APPROVE BUTTONS
            // ==================================

            list
                .querySelectorAll(
                    ".withdrawApproveBtn"
                )
                .forEach(button=>{

                    button.addEventListener(
                        "click",
                        ()=>{

                            approveWithdraw(
                                button.dataset.id
                            );

                        }
                    );

                });


            // ==================================
            // REJECT BUTTONS
            // ==================================

            list
                .querySelectorAll(
                    ".withdrawRejectBtn"
                )
                .forEach(button=>{

                    button.addEventListener(
                        "click",
                        ()=>{

                            rejectWithdraw(
                                button.dataset.id
                            );

                        }
                    );

                });


            console.log(
                "Withdraw list loaded:",
                withdraws.length
            );

        },

        (error)=>{

            console.error(
                "Withdraw listener error:",
                error
            );

        }

    );

}



// ======================================
// APPROVE WITHDRAW
// ======================================

window.approveWithdraw =
async function(id){

    try{

        if(!id){

            alert(
                "Withdraw ID is missing."
            );

            return;

        }


        if(
            !currentAdmin ||
            !currentAdmin.uid
        ){

            alert(
                "Admin session is not ready."
            );

            return;

        }


        const withdrawRef =
            ref(
                db,
                "withdrawRequests/" + id
            );


        const snap =
            await get(withdrawRef);


        if(!snap.exists()){

            alert(
                "Withdraw request not found."
            );

            return;

        }


        const withdraw =
            snap.val();


        // ==================================
        // ONLY PENDING
        // ==================================

        if(
            String(
                withdraw.status ||
                "pending"
            ).toLowerCase()
            !== "pending"
        ){

            alert(
                "Withdraw already processed."
            );

            return;

        }


        // ==================================
        // GET UID
        // ==================================

        const uid =
            withdraw.uid ||
            withdraw.userId ||
            withdraw.userUID ||
            "";


        if(!uid){

            alert(
                "This withdraw has no user ID."
            );

            return;

        }


        // ==================================
        // GET USER
        // ==================================

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(userRef);


        if(!userSnap.exists()){

            alert(
                "User not found."
            );

            return;

        }


        const user =
            userSnap.val() || {};


        const amount =
            Number(
                withdraw.amount || 0
            );


        if(
            !Number.isFinite(amount) ||
            amount <= 0
        ){

            alert(
                "Invalid withdraw amount."
            );

            return;

        }


        const oldBalance =
            Number(
                user.balance || 0
            );


        // ==================================
        // CHECK BALANCE
        // ==================================

        if(oldBalance < amount){

            alert(
                "Insufficient user balance."
            );

            return;

        }


        const newBalance =
            oldBalance - amount;


        const oldTotalWithdraw =
            Number(
                user.totalWithdraw || 0
            );


        // ==================================
        // UPDATE EVERYTHING TOGETHER
        // ==================================

        await update(
            ref(db),
            {

                ["users/" + uid + "/balance"]:
                    newBalance,

                ["users/" + uid + "/totalWithdraw"]:
                    oldTotalWithdraw + amount,

                ["withdrawRequests/" + id + "/status"]:
                    "approved",

                ["withdrawRequests/" + id + "/approvedAt"]:
                    Date.now(),

                ["withdrawRequests/" + id + "/approvedBy"]:
                    currentAdmin.uid

            }
        );


        // ==================================
        // TRANSACTION
        // ==================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "withdraw",

                amount:
                    amount,

                status:
                    "approved",

                reference:
                    id,

                approvedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        alert(
            "Withdraw Approved Successfully"
        );


        // RELOAD LIST

        loadWithdraws();


        if(window.loadDashboard){

            window.loadDashboard();

        }

    }
    catch(error){

        console.error(
            "Approve withdraw error:",
            error
        );


        alert(
            "Approve withdraw failed: " +
            error.message
        );

    }

};



// ======================================
// REJECT WITHDRAW
// ======================================

window.rejectWithdraw =
async function(id){

    try{

        if(!id){

            alert(
                "Withdraw ID is missing."
            );

            return;

        }


        if(
            !currentAdmin ||
            !currentAdmin.uid
        ){

            alert(
                "Admin session is not ready."
            );

            return;

        }


        const withdrawRef =
            ref(
                db,
                "withdrawRequests/" + id
            );


        const snap =
            await get(withdrawRef);


        if(!snap.exists()){

            alert(
                "Withdraw request not found."
            );

            return;

        }


        const withdraw =
            snap.val();


        // ==================================
        // ONLY PENDING
        // ==================================

        if(
            String(
                withdraw.status ||
                "pending"
            ).toLowerCase()
            !== "pending"
        ){

            alert(
                "Withdraw already processed."
            );

            return;

        }


        // ==================================
        // REJECT REQUEST
        // ==================================

        await update(
            withdrawRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        // ==================================
        // SAVE TRANSACTION
        // ==================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    withdraw.uid ||
                    withdraw.userId ||
                    withdraw.userUID ||
                    "",

                type:
                    "withdraw",

                amount:
                    Number(
                        withdraw.amount || 0
                    ),

                status:
                    "rejected",

                reference:
                    id,

                rejectedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        alert(
            "Withdraw Rejected Successfully"
        );


        // RELOAD

        loadWithdraws();


        if(window.loadDashboard){

            window.loadDashboard();

        }

    }
    catch(error){

        console.error(
            "Reject withdraw error:",
            error
        );


        alert(
            "Reject withdraw failed: " +
            error.message
        );

    }

};



// ======================================
// SEARCH + FILTER
// ======================================

function setupWithdrawSearch(){

    const search =
        document.getElementById(
            "withdrawSearch"
        );


    const filter =
        document.getElementById(
            "withdrawFilter"
        );


    if(!search && !filter){

        return;

    }


    function applyFilter(){

        const cards =
            document.querySelectorAll(
                "#withdrawList .request-card"
            );


        const searchText =
            (
                search?.value || ""
            )
            .toLowerCase()
            .trim();


        const selected =
            filter?.value ||
            "all";


        cards.forEach(card=>{

            const text =
                card.textContent
                .toLowerCase();


            const statusElement =
                card.querySelector(
                    ".status"
                );


            const status =
                statusElement
                ?.textContent
                .toLowerCase()
                .trim() || "";


            const matchesSearch =
                !searchText ||
                text.includes(searchText);


            const matchesStatus =
                selected === "all" ||
                status === selected;


            card.style.display =
                matchesSearch &&
                matchesStatus
                ? ""
                : "none";

        });

    }


    search?.addEventListener(
        "input",
        applyFilter
    );


    filter?.addEventListener(
        "change",
        applyFilter
    );

}



// ======================================
// EXPORT
// ======================================

window.loadWithdraws =
    loadWithdraws;


// ======================================
// PART 5 READY
// ======================================

console.log(
    "Admin Part 5 Withdraw System Ready"
);


// ======================================
// START AFTER ADMIN AUTH
// ======================================

if(
    window.adminState &&
    window.adminState.ready
){

    loadWithdraws();

}


setupWithdrawSearch();

// ======================================
// ADMIN.JS - PART 7
// VIP PURCHASE REQUESTS
// LIST + USER PROFILE + APPROVE + REJECT
// ======================================


// ======================================
// LOAD VIP REQUESTS
// ======================================

function loadVipRequests(){

    const list =
        document.getElementById("vipRequestList");

    const empty =
        document.getElementById("emptyVipRequest");


    if(!list){

        console.error(
            "vipRequestList not found"
        );

        return;
    }


    const vipRef =
        ref(
            db,
            "vipPurchaseRequests"
        );


    onValue(
        vipRef,
        async(snapshot)=>{

            list.innerHTML = "";


            // ================================
            // NO REQUESTS
            // ================================

            if(!snapshot.exists()){

                if(empty){
                    empty.style.display = "block";
                }

                return;
            }


            if(empty){
                empty.style.display = "none";
            }


            const requests =
                Object.entries(
                    snapshot.val()
                ).reverse();


            // ================================
            // COUNTERS
            // ================================

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            requests.forEach(([id,request])=>{

                total++;

                const status =
                    String(
                        request.status ||
                        "pending"
                    ).toLowerCase();


                if(status === "pending"){
                    pending++;
                }

                else if(status === "approved"){
                    approved++;
                }

                else if(status === "rejected"){
                    rejected++;
                }

            });


            updateText(
                "vipTotalCount",
                total
            );

            updateText(
                "vipPendingCount",
                pending
            );

            updateText(
                "vipApprovedCount",
                approved
            );

            updateText(
                "vipRejectedCount",
                rejected
            );


            // ================================
            // RENDER REQUESTS
            // ================================

            for(
                const [id,request]
                of requests
            ){

                const vip =
                    request || {};


                const uid =
                    vip.uid ||
                    vip.userId ||
                    vip.userUID ||
                    "";


                // ================================
                // USER PROFILE
                // ================================

                let userData = {};


                if(uid){

                    try{

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" + uid
                                )
                            );


                        if(userSnap.exists()){

                            userData =
                                userSnap.val() || {};

                        }

                    }catch(error){

                        console.error(
                            "VIP user profile error:",
                            error
                        );

                    }

                }


                // ================================
                // USER DETAILS
                // ================================

                const name =
                    vip.fullName ||
                    vip.name ||
                    userData.fullName ||
                    userData.name ||
                    userData.username ||
                    "Unknown User";


                const email =
                    vip.email ||
                    userData.email ||
                    "-";


                const phone =
                    vip.phone ||
                    vip.phoneNumber ||
                    userData.phone ||
                    userData.phoneNumber ||
                    "-";


                // ================================
                // VIP DETAILS
                // ================================

                const vipName =
                    vip.vipName ||
                    vip.planName ||
                    vip.namePlan ||
                    vip.plan ||
                    vip.vip ||
                    "VIP Plan";


                const price =
                    Number(
                        vip.price ||
                        vip.vipPrice ||
                        vip.amount ||
                        0
                    );


                const dailyIncome =
                    Number(
                        vip.dailyIncome ||
                        vip.daily ||
                        0
                    );


                const duration =
                    Number(
                        vip.duration ||
                        vip.days ||
                        0
                    );


                const totalProfit =
                    Number(
                        vip.totalProfit ||
                        vip.profit ||
                        0
                    );


                const date =
                    vip.createdAt ||
                    vip.requestDate ||
                    vip.date ||
                    "-";


                const status =
                    String(
                        vip.status ||
                        "pending"
                    ).toLowerCase();


                // ================================
                // CARD
                // ================================

                const card =
                    document.createElement("div");


                card.className =
                    "request-card";


                card.dataset.vipId =
                    id;


                card.innerHTML = `

                    <div class="request-top">

                        <h3>

                            <i class="fa-solid fa-crown"></i>

                            VIP Purchase Request

                        </h3>


                        <span class="status ${status}">

                            ${escapeHTML(status)}

                        </span>

                    </div>


                    <div class="user-profile-box">

                        <h4>

                            <i class="fa-solid fa-user"></i>

                            User Information

                        </h4>


                        <p>

                            <strong>Name:</strong>

                            ${escapeHTML(name)}

                        </p>


                        <p>

                            <strong>Email:</strong>

                            ${escapeHTML(email)}

                        </p>


                        <p>

                            <strong>Phone:</strong>

                            ${escapeHTML(phone)}

                        </p>


                        <p>

                            <strong>User ID:</strong>

                            ${escapeHTML(uid || "-")}

                        </p>

                    </div>


                    <div class="withdraw-info">

                        <p>

                            <strong>VIP Plan:</strong>

                            ${escapeHTML(vipName)}

                        </p>


                        <p>

                            <strong>Price:</strong>

                            ${price.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Daily Income:</strong>

                            ${dailyIncome.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Duration:</strong>

                            ${duration} Days

                        </p>


                        <p>

                            <strong>Total Profit:</strong>

                            ${totalProfit.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Request Date:</strong>

                            ${escapeHTML(date)}

                        </p>

                    </div>


                    <div class="action-buttons">

                        <button

                            class="approveBtn vipApproveBtn"

                            data-id="${escapeHTML(id)}"

                            ${status !== "pending"
                                ? "disabled"
                                : ""}>

                            <i class="fa-solid fa-circle-check"></i>

                            ${status === "approved"
                                ? "Approved"
                                : "Approve VIP"}

                        </button>


                        <button

                            class="rejectBtn vipRejectBtn"

                            data-id="${escapeHTML(id)}"

                            ${status !== "pending"
                                ? "disabled"
                                : ""}>

                            <i class="fa-solid fa-circle-xmark"></i>

                            ${status === "rejected"
                                ? "Rejected"
                                : "Reject VIP"}

                        </button>

                    </div>

                `;


                list.appendChild(card);

            }


            // ================================
            // APPROVE BUTTONS
            // ================================

            list
                .querySelectorAll(
                    ".vipApproveBtn"
                )
                .forEach(button=>{

                    button.addEventListener(
                        "click",
                        ()=>{

                            approveVipRequest(
                                button.dataset.id
                            );

                        }
                    );

                });


            // ================================
            // REJECT BUTTONS
            // ================================

            list
                .querySelectorAll(
                    ".vipRejectBtn"
                )
                .forEach(button=>{

                    button.addEventListener(
                        "click",
                        ()=>{

                            rejectVipRequest(
                                button.dataset.id
                            );

                        }
                    );

                });

        },

        (error)=>{

            console.error(
                "VIP request listener error:",
                error
            );

        }
    );

}


// ======================================
// APPROVE VIP REQUEST
// ONCE ONLY
// ======================================

window.approveVipRequest =
async function(id){

    try{

        if(!id){

            alert(
                "VIP request ID is missing."
            );

            return;
        }


        if(
            !currentAdmin ||
            !currentAdmin.uid
        ){

            alert(
                "Admin session is not ready."
            );

            return;
        }


        const requestRef =
            ref(
                db,
                "vipPurchaseRequests/" + id
            );


        const snap =
            await get(requestRef);


        if(!snap.exists()){

            alert(
                "VIP request not found."
            );

            return;
        }


        const request =
            snap.val();


        // ================================
        // ONLY PENDING
        // ================================

        if(
            String(
                request.status ||
                "pending"
            ).toLowerCase()
            !== "pending"
        ){

            alert(
                "VIP request already processed."
            );

            return;
        }


        const uid =
            request.uid ||
            request.userId ||
            request.userUID ||
            "";


        if(!uid){

            alert(
                "VIP request has no user ID."
            );

            return;
        }


        // ================================
        // USER MUST EXIST
        // ================================

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(userRef);


        if(!userSnap.exists()){

            alert(
                "User not found."
            );

            return;
        }


        // ================================
        // MARK APPROVED
        // ================================

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        // ================================
        // TRANSACTION
        // ================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "vip_purchase",

                amount:
                    Number(
                        request.price ||
                        request.vipPrice ||
                        request.amount ||
                        0
                    ),

                status:
                    "approved",

                reference:
                    id,

                approvedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        alert(
            "VIP Request Approved Successfully"
        );


        if(window.loadDashboard){

            window.loadDashboard();

        }

    }

    catch(error){

        console.error(
            "Approve VIP error:",
            error
        );


        alert(
            "Approve VIP failed: " +
            error.message
        );

    }

};


// ======================================
// REJECT VIP REQUEST
// ONCE ONLY
// ======================================

window.rejectVipRequest =
async function(id){

    try{

        if(!id){

            alert(
                "VIP request ID is missing."
            );

            return;
        }


        if(
            !currentAdmin ||
            !currentAdmin.uid
        ){

            alert(
                "Admin session is not ready."
            );

            return;
        }


        const requestRef =
            ref(
                db,
                "vipPurchaseRequests/" + id
            );


        const snap =
            await get(requestRef);


        if(!snap.exists()){

            alert(
                "VIP request not found."
            );

            return;
        }


        const request =
            snap.val();


        // ================================
        // ONLY PENDING
        // ================================

        if(
            String(
                request.status ||
                "pending"
            ).toLowerCase()
            !== "pending"
        ){

            alert(
                "VIP request already processed."
            );

            return;
        }


        // ================================
        // REJECT
        // ================================

        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        // ================================
        // TRANSACTION
        // ================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    request.uid ||
                    request.userId ||
                    request.userUID ||
                    "",

                type:
                    "vip_purchase",

                amount:
                    Number(
                        request.price ||
                        request.vipPrice ||
                        request.amount ||
                        0
                    ),

                status:
                    "rejected",

                reference:
                    id,

                rejectedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        alert(
            "VIP Request Rejected Successfully"
        );


        if(window.loadDashboard){

            window.loadDashboard();

        }

    }

    catch(error){

        console.error(
            "Reject VIP error:",
            error
        );


        alert(
            "Reject VIP failed: " +
            error.message
        );

    }

};


// ======================================
// EXPORT
// ======================================

window.loadVipRequests =
    loadVipRequests;


console.log(
    "Admin Part 7 VIP Requests Ready"
);

// ======================================
// ADMIN.JS - PART 8
// VIP BUYERS / APPROVED VIP LIST
// USER PROFILE + VIP DETAILS
// SEARCH + FILTER
// ======================================


// ======================================
// LOAD VIP BUYERS
// ======================================

function loadVipBuyers(){

    const list =
        document.getElementById(
            "vipBuyerList"
        );

    const empty =
        document.getElementById(
            "emptyVipBuyer"
        );


    if(!list){

        console.error(
            "vipBuyerList not found"
        );

        return;

    }


    const vipRef =
        ref(
            db,
            "vipPurchaseRequests"
        );


    onValue(
        vipRef,
        async(snapshot)=>{

            list.innerHTML = "";


            if(!snapshot.exists()){

                if(empty){
                    empty.style.display =
                        "block";
                }

                return;

            }


            if(empty){
                empty.style.display =
                    "none";
            }


            const allRequests =
                Object.entries(
                    snapshot.val()
                ).reverse();


            // ==================================
            // ONLY APPROVED VIP REQUESTS
            // ==================================

            const approvedRequests =
                allRequests.filter(
                    ([id,request]) => {

                        return String(
                            request?.status ||
                            ""
                        ).toLowerCase()
                        === "approved";

                    }
                );


            // ==================================
            // COUNTERS
            // ==================================

            updateText(
                "vipBuyerTotalCount",
                approvedRequests.length
            );


            // ==================================
            // NO APPROVED VIP
            // ==================================

            if(
                approvedRequests.length === 0
            ){

                if(empty){

                    empty.style.display =
                        "block";

                }

                list.innerHTML = `

                    <div class="empty-state">

                        <i class="fa-solid fa-crown"></i>

                        <h3>
                            No Approved VIP Buyers
                        </h3>

                        <p>
                            Approved VIP purchases
                            will appear here.
                        </p>

                    </div>

                `;

                return;

            }


            // ==================================
            // RENDER APPROVED VIP BUYERS
            // ==================================

            for(
                const [id,request]
                of approvedRequests
            ){

                const vip =
                    request || {};


                // ==================================
                // UID
                // ==================================

                const uid =
                    vip.uid ||
                    vip.userId ||
                    vip.userUID ||
                    "";


                // ==================================
                // USER PROFILE
                // ==================================

                let userData = {};


                if(uid){

                    try{

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" + uid
                                )
                            );


                        if(
                            userSnap.exists()
                        ){

                            userData =
                                userSnap.val() || {};

                        }

                    }
                    catch(error){

                        console.error(
                            "VIP buyer user error:",
                            error
                        );

                    }

                }


                // ==================================
                // USER DETAILS
                // ==================================

                const name =
                    vip.fullName ||
                    vip.name ||
                    userData.fullName ||
                    userData.name ||
                    userData.username ||
                    "Unknown User";


                const email =
                    vip.email ||
                    userData.email ||
                    "-";


                const phone =
                    vip.phone ||
                    vip.phoneNumber ||
                    userData.phone ||
                    userData.phoneNumber ||
                    "-";


                // ==================================
                // VIP DETAILS
                // ==================================

                const vipName =
                    vip.vipName ||
                    vip.planName ||
                    vip.namePlan ||
                    vip.plan ||
                    vip.vip ||
                    "VIP Plan";


                const price =
                    Number(
                        vip.price ||
                        vip.vipPrice ||
                        vip.amount ||
                        0
                    );


                const dailyIncome =
                    Number(
                        vip.dailyIncome ||
                        vip.daily ||
                        0
                    );


                const duration =
                    Number(
                        vip.duration ||
                        vip.days ||
                        0
                    );


                const totalProfit =
                    Number(
                        vip.totalProfit ||
                        vip.profit ||
                        0
                    );


                const approvedAt =
                    vip.approvedAt ||
                    vip.createdAt ||
                    vip.requestDate ||
                    vip.date ||
                    "-";


                // ==================================
                // CARD
                // ==================================

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.dataset.vipBuyerId =
                    id;


                card.innerHTML = `

                    <div class="request-top">

                        <h3>

                            <i class="fa-solid fa-crown"></i>

                            VIP Buyer

                        </h3>


                        <span class="status approved">

                            approved

                        </span>

                    </div>


                    <!-- USER PROFILE -->

                    <div class="user-profile-box">

                        <h4>

                            <i class="fa-solid fa-user"></i>

                            User Information

                        </h4>


                        <p>

                            <strong>Name:</strong>

                            ${escapeHTML(name)}

                        </p>


                        <p>

                            <strong>Email:</strong>

                            ${escapeHTML(email)}

                        </p>


                        <p>

                            <strong>Phone:</strong>

                            ${escapeHTML(phone)}

                        </p>


                        <p>

                            <strong>User ID:</strong>

                            ${escapeHTML(
                                uid || "-"
                            )}

                        </p>

                    </div>


                    <!-- VIP INFORMATION -->

                    <div class="withdraw-info">

                        <p>

                            <strong>VIP Plan:</strong>

                            ${escapeHTML(vipName)}

                        </p>


                        <p>

                            <strong>Price:</strong>

                            ${price.toLocaleString()}
                            RWF

                        </p>


                        <p>

                            <strong>Daily Income:</strong>

                            ${dailyIncome.toLocaleString()}
                            RWF

                        </p>


                        <p>

                            <strong>Duration:</strong>

                            ${duration}
                            Days

                        </p>


                        <p>

                            <strong>Total Profit:</strong>

                            ${totalProfit.toLocaleString()}
                            RWF

                        </p>


                        <p>

                            <strong>Approved Date:</strong>

                            ${escapeHTML(
                                String(approvedAt)
                            )}

                        </p>

                    </div>


                    <!-- NO ACTION BUTTONS -->

                    <div class="action-buttons">

                        <span class="status approved">

                            <i class="fa-solid fa-circle-check"></i>

                            VIP Approved

                        </span>

                    </div>

                `;


                list.appendChild(card);

            }


            console.log(
                "VIP buyers loaded:",
                approvedRequests.length
            );

        },

        (error)=>{

            console.error(
                "VIP buyers listener error:",
                error
            );

        }

    );

}



// ======================================
// VIP BUYER SEARCH + FILTER
// ======================================

function setupVipBuyerSearch(){

    const search =
        document.getElementById(
            "vipBuyerSearch"
        );


    const filter =
        document.getElementById(
            "vipBuyerFilter"
        );


    if(!search && !filter){

        return;

    }


    function applyVipBuyerFilter(){

        const cards =
            document.querySelectorAll(
                "#vipBuyerList .request-card"
            );


        const searchText =
            (
                search?.value || ""
            )
            .toLowerCase()
            .trim();


        const selected =
            filter?.value ||
            "all";


        cards.forEach(card=>{

            const text =
                card.textContent
                .toLowerCase();


            const statusElement =
                card.querySelector(
                    ".status"
                );


            const status =
                statusElement
                ?.textContent
                .toLowerCase()
                .trim() || "";


            const matchesSearch =
                !searchText ||
                text.includes(
                    searchText
                );


            const matchesStatus =
                selected === "all" ||
                status === selected;


            card.style.display =
                matchesSearch &&
                matchesStatus
                ? ""
                : "none";

        });

    }


    search?.addEventListener(
        "input",
        applyVipBuyerFilter
    );


    filter?.addEventListener(
        "change",
        applyVipBuyerFilter
    );

}



// ======================================
// EXPORT
// ======================================

window.loadVipBuyers =
    loadVipBuyers;


// ======================================
// START AFTER ADMIN AUTH
// ======================================

if(
    window.adminState &&
    window.adminState.ready
){

    loadVipBuyers();

}


setupVipBuyerSearch();


// ======================================
// PART 8 READY
// ======================================

console.log(
    "Admin Part 8 VIP Buyers Ready"
);


