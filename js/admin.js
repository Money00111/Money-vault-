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
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    set,
    update,
    push,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ================================
// GLOBAL VARIABLES
// ================================

let currentAdmin = null;


// ================================
// DOM ELEMENTS
// ================================

const loadingScreen = document.getElementById("loadingScreen");
const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const pageTitle = document.getElementById("pageTitle");

const menuLinks = document.querySelectorAll(".menu-link");
const sections = document.querySelectorAll(".page-section");


// ================================
// AUTH CHECK
// ================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentAdmin = user;

    const adminSnap = await get(ref(db, "admins/" + user.uid));

    if (!adminSnap.exists()) {

        alert("Access denied");

        await signOut(auth);

        window.location.href = "login.html";

        return;
    }

    const admin = adminSnap.val();

    if (adminName) {
        adminName.textContent = admin.name || "Administrator";
    }

    if (adminEmail) {
        adminEmail.textContent = user.email || "";
    }

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    // Start dashboard
    loadDashboardFinal();

});


// ================================
// LOGOUT
// ================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });

}


// ================================
// MOBILE MENU
// ================================

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("active");

    });

}


// ================================
// PAGE NAVIGATION
// ================================

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        openPage(link.dataset.page);

    });

});


function openPage(page) {

    sections.forEach(section =>
        section.classList.remove("active")
    );

    menuLinks.forEach(link =>
        link.classList.remove("active")
    );

    const target = document.getElementById(page + "Section");

    if (target) {
        target.classList.add("active");
    }

    const activeLink = document.querySelector(`[data-page="${page}"]`);

    if (activeLink) {
        activeLink.classList.add("active");
    }

    if (pageTitle) {
        pageTitle.textContent =
            page.charAt(0).toUpperCase() + page.slice(1);
    }

}

// ======================================
// ADMIN.JS - PART 2
// DASHBOARD FUNCTIONS
// ======================================

// ================================
// UPDATE TEXT HELPER
// ================================

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// ================================
// TOTAL USERS
// ================================

function loadUsersCount() {

    onValue(ref(db, "users"), (snapshot) => {

        const total = snapshot.exists()
            ? Object.keys(snapshot.val()).length
            : 0;

        updateText("totalUsers", total);

    });

}


// ================================
// DEPOSIT STATISTICS
// ================================

function loadDepositStatistics() {

    onValue(ref(db, "depositRequests"), (snapshot) => {

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(item => {

                total++;

                if (item.status === "pending") pending++;
                else if (item.status === "approved") approved++;
                else if (item.status === "rejected") rejected++;

            });

        }

        updateText("dashboardTotalDeposits", total);
        updateText("dashboardPendingDeposits", pending);
        updateText("dashboardApprovedDeposits", approved);

        updateText("depositTotalCount", total);
        updateText("depositPendingCount", pending);
        updateText("depositApprovedCount", approved);
        updateText("depositRejectedCount", rejected);

    });

}


// ================================
// WITHDRAW STATISTICS
// ================================

function loadWithdrawStatistics() {

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(item => {

                total++;

                if (item.status === "pending") pending++;
                else if (item.status === "approved") approved++;
                else if (item.status === "rejected") rejected++;

            });

        }

        updateText("dashboardTotalWithdraws", total);

        updateText("withdrawTotalCount", total);
        updateText("withdrawPendingCount", pending);
        updateText("withdrawApprovedCount", approved);
        updateText("withdrawRejectedCount", rejected);

    });

}


// ================================
// SYSTEM BALANCE
// ================================

function loadSystemBalance() {

    onValue(ref(db, "users"), (snapshot) => {

        let totalBalance = 0;

        if (snapshot.exists()) {

            Object.values(snapshot.val()).forEach(user => {

                totalBalance += Number(user.balance || 0);

            });

        }

        updateText(
            "systemBalance",
            totalBalance.toLocaleString() + " RWF"
        );

    });

}


// ================================
// RECENT ACTIVITY
// ================================

function loadRecentActivity() {

    const activityBox =
        document.getElementById("recentActivity");

    if (!activityBox) return;

    onValue(ref(db, "transactions"), (snapshot) => {

        activityBox.innerHTML = "";

        if (!snapshot.exists()) {

            activityBox.innerHTML =
                "<p>No recent activity</p>";

            return;

        }

        Object.entries(snapshot.val())
            .reverse()
            .slice(0, 10)
            .forEach(([id, item]) => {

                const div = document.createElement("div");

                div.className = "activity-item";

                div.innerHTML = `
                    <strong>${(item.type || "transaction").toUpperCase()}</strong>
                    - ${Number(item.amount || 0).toLocaleString()} RWF
                    <span class="status ${item.status}">
                        ${item.status}
                    </span>
                `;

                activityBox.appendChild(div);

            });

    });

}

// ======================================
// WITHDRAW MANAGEMENT FINAL
// PART 4
// ======================================


// ================================
// LOAD WITHDRAW REQUESTS
// ================================

function loadWithdraws(){

    const withdrawRef =
    ref(db,"withdrawRequests");


    onValue(withdrawRef,(snapshot)=>{


        const list =
        document.getElementById("withdrawList");


        const empty =
        document.getElementById("emptyWithdraw");


        if(!list) return;


        list.innerHTML="";


        if(!snapshot.exists()){


            if(empty){

                empty.style.display="block";

            }

            return;

        }



        if(empty){

            empty.style.display="none";

        }



        Object.entries(snapshot.val())
        .reverse()
        .forEach(([id,withdraw])=>{


            const status =
            withdraw.status || "pending";


            const card =
            document.createElement("div");


            card.className =
            "request-card";



            card.innerHTML = `


<div class="request-top">

<h3>
Withdraw Request
</h3>


<span class="status ${status}">
${status}
</span>


</div>



<p>
<strong>Name:</strong>
${withdraw.name || "-"}
</p>


<p>
<strong>Email:</strong>
${withdraw.email || "-"}
</p>


<p>
<strong>Amount:</strong>
${Number(withdraw.amount || 0)
.toLocaleString()} RWF
</p>


<p>
<strong>Phone:</strong>
${withdraw.phone || "-"}
</p>


<p>
<strong>Method:</strong>
${withdraw.method || "-"}
</p>



<div class="action-buttons">


<button

class="approveBtn"

${status !== "pending" ? "disabled" : ""}

onclick="approveWithdraw('${id}')">

<i class="fa-solid fa-circle-check"></i>

Approve

</button>



<button

class="rejectBtn"

${status !== "pending" ? "disabled" : ""}

onclick="rejectWithdraw('${id}')">

<i class="fa-solid fa-circle-xmark"></i>

Reject

</button>


</div>


`;



            list.appendChild(card);


        });



    });



}






// ================================
// APPROVE WITHDRAW ONCE
// ================================

window.approveWithdraw = async function(id){


    const withdrawRef =
    ref(db,"withdrawRequests/"+id);



    const snapshot =
    await get(withdrawRef);



    if(!snapshot.exists()) return;



    const withdraw =
    snapshot.val();



    // BLOCK DOUBLE APPROVE

    if(withdraw.status !== "pending"){


        alert(
        "Withdraw already processed"
        );


        return;

    }



    const userRef =
    ref(db,"users/"+withdraw.uid);



    const userSnap =
    await get(userRef);



    if(!userSnap.exists()){


        alert("User not found");


        return;

    }



    const user =
    userSnap.val();



    const balance =
    Number(user.balance || 0);



    const amount =
    Number(withdraw.amount || 0);



    if(balance < amount){


        alert(
        "Insufficient balance"
        );


        return;

    }





    // REMOVE MONEY

    await update(userRef,{

        balance:
        balance - amount

    });






    // CHANGE STATUS

    await update(withdrawRef,{

        status:"approved",

        approvedAt:
        Date.now()

    });







    // SAVE TRANSACTION

    await set(

        push(ref(db,"transactions")),

        {

            uid:withdraw.uid,

            type:"withdraw",

            amount:amount,

            status:"approved",

            reference:id,

            date:Date.now()

        }

    );





    alert(
    "Withdraw Approved Successfully"
    );


};









// ================================
// REJECT WITHDRAW ONCE
// ================================

window.rejectWithdraw = async function(id){



    const withdrawRef =
    ref(db,"withdrawRequests/"+id);



    const snapshot =
    await get(withdrawRef);



    if(!snapshot.exists()) return;



    const withdraw =
    snapshot.val();




    // BLOCK DOUBLE REJECT

    if(withdraw.status !== "pending"){


        alert(
        "Withdraw already processed"
        );


        return;

    }






    await update(withdrawRef,{

        status:"rejected",

        rejectedAt:
        Date.now()

    });






    await set(

        push(ref(db,"transactions")),

        {

            uid:withdraw.uid,

            type:"withdraw",

            amount:Number(withdraw.amount || 0),

            status:"rejected",

            reference:id,

            date:Date.now()

        }

    );






    alert(
    "Withdraw Rejected Successfully"
    );


};







// ================================
// START WITHDRAW SYSTEM
// ================================

loadWithdraws();

    // ======================================
// VIP REQUEST MANAGEMENT FINAL
// PART 5
// ======================================


// ================================
// LOAD VIP REQUESTS
// ================================

function loadVipRequests(){


    const vipRef =
    ref(db,"vipRequests");



    onValue(vipRef,(snapshot)=>{


        const list =
        document.getElementById("vipRequestList");


        const empty =
        document.getElementById("emptyVipRequest");



        if(!list) return;



        list.innerHTML = "";



        if(!snapshot.exists()){


            if(empty){

                empty.style.display="block";

            }

            return;

        }



        if(empty){

            empty.style.display="none";

        }




        Object.entries(snapshot.val())
        .reverse()
        .forEach(([id,vip])=>{


            const status =
            vip.status || "pending";



            const card =
            document.createElement("div");



            card.className =
            "request-card";



            card.innerHTML = `


<div class="request-top">


<h3>

${vip.vipName || "VIP Plan"}

</h3>



<span class="status ${status}">

${status}

</span>


</div>




<p>

<strong>User:</strong>

${vip.name || "-"}

</p>



<p>

<strong>Email:</strong>

${vip.email || "-"}

</p>



<p>

<strong>VIP Price:</strong>

${Number(vip.price || 0)
.toLocaleString()} RWF

</p>



<p>

<strong>Daily Income:</strong>

${Number(vip.dailyIncome || 0)
.toLocaleString()} RWF

</p>



<p>

<strong>Duration:</strong>

${vip.duration || 0} Days

</p>




<div class="action-buttons">


<button

class="approveBtn"

${status !== "pending" ? "disabled" : ""}

onclick="approveVip('${id}')">


<i class="fa-solid fa-circle-check"></i>

Approve VIP

</button>




<button

class="rejectBtn"

${status !== "pending" ? "disabled" : ""}

onclick="rejectVip('${id}')">


<i class="fa-solid fa-circle-xmark"></i>

Reject VIP

</button>


</div>


`;



            list.appendChild(card);



        });



    });



}







// ================================
// APPROVE VIP ONCE
// ================================

window.approveVip = async function(id){



    const vipRef =
    ref(db,"vipRequests/"+id);



    const snapshot =
    await get(vipRef);



    if(!snapshot.exists()) return;



    const vip =
    snapshot.val();





    // STOP DOUBLE APPROVE

    if(vip.status !== "pending"){


        alert(
        "VIP request already processed"
        );


        return;

    }






    await update(vipRef,{


        status:"approved",

        approvedAt:
        Date.now()


    });








    await set(

        push(ref(db,"transactions")),

        {


            uid:vip.uid,

            type:"vip",

            amount:Number(vip.price || 0),

            status:"approved",

            vipName:
            vip.vipName || "",

            reference:id,

            date:Date.now()


        }

    );







    alert(
    "VIP Approved Successfully"
    );


};









// ================================
// REJECT VIP ONCE
// ================================

window.rejectVip = async function(id){



    const vipRef =
    ref(db,"vipRequests/"+id);



    const snapshot =
    await get(vipRef);



    if(!snapshot.exists()) return;



    const vip =
    snapshot.val();







    // STOP DOUBLE REJECT

    if(vip.status !== "pending"){


        alert(
        "VIP request already processed"
        );


        return;

    }






    await update(vipRef,{


        status:"rejected",

        rejectedAt:
        Date.now()


    });








    await set(

        push(ref(db,"transactions")),

        {


            uid:vip.uid,

            type:"vip",

            amount:Number(vip.price || 0),

            status:"rejected",

            vipName:
            vip.vipName || "",

            reference:id,

            date:Date.now()


        }

    );








    alert(
    "VIP Rejected Successfully"
    );


};







// ================================
// START VIP SYSTEM
// ================================

loadVipRequests();

      // ======================================
// BONUS REQUEST MANAGEMENT FINAL
// PART 6
// ======================================



// ================================
// LOAD BONUS REQUESTS
// ================================

function loadBonusRequests(){


    const bonusRef =
    ref(db,"bonusRequests");



    onValue(bonusRef,(snapshot)=>{


        const list =
        document.getElementById("bonusRequestList");


        const empty =
        document.getElementById("emptyBonusRequest");



        if(!list) return;



        list.innerHTML="";



        if(!snapshot.exists()){


            if(empty){

                empty.style.display="block";

            }

            return;

        }



        if(empty){

            empty.style.display="none";

        }



        Object.entries(snapshot.val())
        .reverse()
        .forEach(([id,bonus])=>{


            const status =
            bonus.status || "pending";



            const card =
            document.createElement("div");



            card.className =
            "request-card";



            card.innerHTML = `


<div class="request-top">


<h3>
Bonus Request
</h3>



<span class="status ${status}">

${status}

</span>


</div>




<p>

<strong>Name:</strong>

${bonus.name || "-"}

</p>




<p>

<strong>Email:</strong>

${bonus.email || "-"}

</p>




<p>

<strong>Amount:</strong>

${Number(bonus.amount || 0)
.toLocaleString()} RWF

</p>




<p>

<strong>Reason:</strong>

${bonus.reason || "-"}

</p>





<div class="action-buttons">


<button

class="approveBtn"

${status !== "pending" ? "disabled" : ""}

onclick="approveBonus('${id}')">


<i class="fa-solid fa-circle-check"></i>

Approve

</button>




<button

class="rejectBtn"

${status !== "pending" ? "disabled" : ""}

onclick="rejectBonus('${id}')">


<i class="fa-solid fa-circle-xmark"></i>

Reject

</button>


</div>



`;



            list.appendChild(card);



        });



    });



}








// ================================
// APPROVE BONUS ONCE
// ================================

window.approveBonus = async function(id){



    const bonusRef =
    ref(db,"bonusRequests/"+id);



    const snapshot =
    await get(bonusRef);



    if(!snapshot.exists()) return;



    const bonus =
    snapshot.val();





    // STOP DOUBLE APPROVE

    if(bonus.status !== "pending"){


        alert(
        "Bonus request already processed"
        );


        return;

    }






    const userRef =
    ref(db,"users/"+bonus.uid);



    const userSnap =
    await get(userRef);



    if(!userSnap.exists()){


        alert(
        "User not found"
        );


        return;

    }






    const user =
    userSnap.val();



    const oldBalance =
    Number(user.balance || 0);



    const amount =
    Number(bonus.amount || 0);






    // ADD BONUS

    await update(userRef,{


        balance:
        oldBalance + amount


    });







    // UPDATE STATUS

    await update(bonusRef,{


        status:"approved",

        approvedAt:
        Date.now()


    });








    // SAVE TRANSACTION

    await set(

        push(ref(db,"transactions")),

        {


            uid:bonus.uid,

            type:"bonus",

            amount:amount,

            status:"approved",

            reference:id,

            date:Date.now()


        }

    );







    alert(
    "Bonus Approved Successfully"
    );


};









// ================================
// REJECT BONUS ONCE
// ================================

window.rejectBonus = async function(id){



    const bonusRef =
    ref(db,"bonusRequests/"+id);



    const snapshot =
    await get(bonusRef);



    if(!snapshot.exists()) return;



    const bonus =
    snapshot.val();







    // STOP DOUBLE REJECT

    if(bonus.status !== "pending"){


        alert(
        "Bonus request already processed"
        );


        return;

    }








    await update(bonusRef,{


        status:"rejected",

        rejectedAt:
        Date.now()


    });








    await set(

        push(ref(db,"transactions")),

        {


            uid:bonus.uid,

            type:"bonus",

            amount:Number(bonus.amount || 0),

            status:"rejected",

            reference:id,

            date:Date.now()


        }

    );







    alert(
    "Bonus Rejected Successfully"
    );


};







// ================================
// START BONUS SYSTEM
// ================================

loadBonusRequests();    

// ======================================
// USERS MANAGEMENT FINAL
// PART 7
// ======================================



// ================================
// LOAD USERS
// ================================

function loadUsers(){


    const usersRef =
    ref(db,"users");



    onValue(usersRef,(snapshot)=>{


        const list =
        document.getElementById("usersList");


        const empty =
        document.getElementById("emptyUsers");



        if(!list) return;



        list.innerHTML = "";



        if(!snapshot.exists()){


            if(empty){

                empty.style.display="block";

            }

            return;

        }




        if(empty){

            empty.style.display="none";

        }






        Object.entries(snapshot.val())
        .reverse()
        .forEach(([uid,user])=>{



            const card =
            document.createElement("div");



            card.className =
            "user-card";



            card.innerHTML = `


<div class="user-header">


<i class="fa-solid fa-user"></i>


<h3>

${user.name || "User"}

</h3>


</div>




<p>

<strong>Email:</strong>

${user.email || "-"}

</p>




<p>

<strong>Phone:</strong>

${user.phone || "-"}

</p>




<p>

<strong>Balance:</strong>

${Number(user.balance || 0)
.toLocaleString()} RWF

</p>




<p>

<strong>VIP:</strong>

${user.vip || "None"}

</p>




<p>

<strong>Status:</strong>

${user.status || "active"}

</p>






<div class="action-buttons">


<button

class="viewBtn"

onclick="viewUser('${uid}')">


<i class="fa-solid fa-eye"></i>

View

</button>





<button

class="deleteBtn"

onclick="deleteUser('${uid}')">


<i class="fa-solid fa-trash"></i>

Delete

</button>


</div>



`;



            list.appendChild(card);



        });



    });



}








// ================================
// VIEW USER
// ================================

window.viewUser = async function(uid){



    const userRef =
    ref(db,"users/"+uid);



    const snapshot =
    await get(userRef);



    if(!snapshot.exists()) return;



    const user =
    snapshot.val();






    alert(`

Name:
${user.name || "-"}


Email:
${user.email || "-"}


Phone:
${user.phone || "-"}


Balance:
${Number(user.balance || 0)
.toLocaleString()} RWF


VIP:
${user.vip || "None"}


Status:
${user.status || "active"}

`);




};









// ================================
// DELETE USER
// ================================

window.deleteUser = async function(uid){



    const confirmDelete =
    confirm(
    "Are you sure you want to delete this user?"
    );



    if(!confirmDelete) return;






    await remove(
        ref(db,"users/"+uid)
    );






    alert(
    "User deleted successfully"
    );



};









// ================================
// USER SEARCH
// ================================

const userSearch =
document.getElementById("userSearch");



if(userSearch){



    userSearch.addEventListener(
    "input",
    ()=>{


        const value =
        userSearch.value
        .toLowerCase();




        document
        .querySelectorAll(".user-card")
        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();




            if(text.includes(value)){


                card.style.display="block";


            }else{


                card.style.display="none";


            }



        });



    });



}








// ================================
// START USERS SYSTEM
// ================================

loadUsers();


// ======================================
// TRANSACTIONS MANAGEMENT FINAL
// PART 8
// ======================================



// ================================
// LOAD TRANSACTIONS
// ================================

function loadTransactions(){


    const transactionRef =
    ref(db,"transactions");



    onValue(transactionRef,(snapshot)=>{


        const list =
        document.getElementById("transactionList");


        const empty =
        document.getElementById("emptyTransaction");



        if(!list) return;



        list.innerHTML = "";



        if(!snapshot.exists()){


            if(empty){

                empty.style.display="block";

            }

            return;

        }




        if(empty){

            empty.style.display="none";

        }






        Object.entries(snapshot.val())
        .reverse()
        .forEach(([id,transaction])=>{



            const card =
            document.createElement("div");



            card.className =
            "transaction-card";




            const date =
            transaction.date
            ?
            new Date(transaction.date)
            .toLocaleString()
            :
            "-";






            card.innerHTML = `


<div class="transaction-header">


<h3>

${(transaction.type || "transaction")
.toUpperCase()}

</h3>




<span class="status ${transaction.status || "pending"}">

${transaction.status || "pending"}

</span>



</div>





<p>

<strong>User ID:</strong>

${transaction.uid || "-"}

</p>





<p>

<strong>Amount:</strong>

${Number(transaction.amount || 0)
.toLocaleString()} RWF

</p>





<p>

<strong>Date:</strong>

${date}

</p>





${transaction.vipName ? `

<p>

<strong>VIP:</strong>

${transaction.vipName}

</p>

` : ""}



`;



            list.appendChild(card);



        });



    });



}








// ================================
// TRANSACTION SEARCH
// ================================

const transactionSearch =
document.getElementById("transactionSearch");



if(transactionSearch){



    transactionSearch.addEventListener(
    "input",
    ()=>{



        const value =
        transactionSearch.value
        .toLowerCase();





        document
        .querySelectorAll(".transaction-card")
        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();




            if(text.includes(value)){


                card.style.display="block";


            }else{


                card.style.display="none";


            }



        });



    });



}








// ================================
// TRANSACTION FILTER
// ================================

const transactionFilter =
document.getElementById("transactionFilter");



if(transactionFilter){



    transactionFilter.addEventListener(
    "change",
    ()=>{



        const value =
        transactionFilter.value
        .toLowerCase();





        document
        .querySelectorAll(".transaction-card")
        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();





            if(
            value==="all" ||
            text.includes(value)
            ){


                card.style.display="block";


            }else{


                card.style.display="none";


            }



        });



    });



}








// ================================
// START TRANSACTIONS SYSTEM
// ================================
 
loadTransactions();


// ======================================
// SETTINGS + QUICK ACTIONS FINAL
// PART 9
// ======================================



// ================================
// SAVE ADMIN SETTINGS
// ================================


const saveSettings =
document.getElementById("saveSettings");



if(saveSettings){



    saveSettings.addEventListener(
    "click",
    async()=>{


        if(!currentAdmin) return;




        const nameInput =
        document.getElementById(
        "adminNameInput"
        );



        const name =
        nameInput
        ?
        nameInput.value.trim()
        :
        "";





        await update(

            ref(
            db,
            "admins/"+currentAdmin.uid
            ),

            {

                name:name

            }

        );





        alert(
        "Settings Saved Successfully"
        );



    });



}









// ================================
// LOAD ADMIN SETTINGS
// ================================


function loadAdminSettings(){



    if(!currentAdmin) return;





    const adminRef =
    ref(
    db,
    "admins/"+currentAdmin.uid
    );





    onValue(adminRef,(snapshot)=>{



        if(!snapshot.exists())
        return;





        const data =
        snapshot.val();






        const nameInput =
        document.getElementById(
        "adminNameInput"
        );



        const emailInput =
        document.getElementById(
        "adminEmailInput"
        );







        if(nameInput){


            nameInput.value =
            data.name || "";


        }





        if(emailInput){


            emailInput.value =
            currentAdmin.email || "";


        }




    });



}









// ================================
// REFRESH ALL DATA
// ================================


const refreshDashboard =
document.getElementById(
"refreshDashboard"
);





if(refreshDashboard){


refreshDashboard.addEventListener(
    "click",
    ()=>{

        loadDashboardFinal();

        if (typeof loadDeposits === "function") loadDeposits();

        if (typeof loadWithdraws === "function") loadWithdraws();

        if (typeof loadVipRequests === "function") loadVipRequests();

        if (typeof loadBonusRequests === "function") loadBonusRequests();

        if (typeof loadUsers === "function") loadUsers();

        if (typeof loadTransactions === "function") loadTransactions();

        alert("Dashboard Refreshed");

    }
);
    

// ================================
// QUICK OPEN BUTTON
// ================================


function quickOpen(button,page){



    const element =
    document.getElementById(button);




    if(element){



        element.addEventListener(
        "click",
        ()=>{


            openPage(page);



        });



    }



}









// ================================
// QUICK BUTTON LINKS
// ================================


quickOpen(
"openDeposits",
"deposits"
);



quickOpen(
"openWithdraws",
"withdraws"
);



quickOpen(
"openVipRequests",
"vipRequests"
);



quickOpen(
"openUsers",
"users"
);



quickOpen(
"openTransactions",
"transactions"
);



quickOpen(
"openSettings",
"settings"
);








// ================================
// START SETTINGS SYSTEM
// ================================


setTimeout(()=>{


    loadAdminSettings();



},1000);

// ======================================
// DASHBOARD FINAL SYSTEM
// PART 10
// ======================================



// ================================
// LOAD DASHBOARD FINAL
// ================================


function loadDashboardFinal(){


    loadUsersCountFinal();


    loadDepositStatisticsFinal();


    loadWithdrawStatisticsFinal();


    loadSystemBalanceFinal();


    loadRecentActivity();


}








// ================================
// TOTAL USERS
// ================================


function loadUsersCountFinal(){



    const usersRef =
    ref(db,"users");



    onValue(usersRef,(snapshot)=>{


        let total = 0;



        if(snapshot.exists()){


            total =
            Object.keys(snapshot.val())
            .length;


        }





        updateText(
        "totalUsers",
        total
        );



    });



}








// ================================
// DEPOSIT STATISTICS
// ================================


function loadDepositStatisticsFinal(){



    const depositRef =
    ref(db,"depositRequests");



    onValue(depositRef,(snapshot)=>{



        let total = 0;

        let pending = 0;

        let approved = 0;

        let rejected = 0;





        if(snapshot.exists()){


            Object.values(snapshot.val())
            .forEach(item=>{



                total++;



                if(item.status==="pending")
                pending++;



                if(item.status==="approved")
                approved++;



                if(item.status==="rejected")
                rejected++;




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



    });



}









// ================================
// WITHDRAW STATISTICS
// ================================


function loadWithdrawStatisticsFinal(){



    const withdrawRef =
    ref(db,"withdrawRequests");



    onValue(withdrawRef,(snapshot)=>{



        let total = 0;

        let pending = 0;

        let approved = 0;

        let rejected = 0;





        if(snapshot.exists()){


            Object.values(snapshot.val())
            .forEach(item=>{



                total++;



                if(item.status==="pending")
                pending++;



                if(item.status==="approved")
                approved++;



                if(item.status==="rejected")
                rejected++;




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



    });



}









// ================================
// SYSTEM BALANCE
// ================================


function loadSystemBalanceFinal(){



    const usersRef =
    ref(db,"users");



    onValue(usersRef,(snapshot)=>{



        let balance = 0;



        if(snapshot.exists()){


            Object.values(snapshot.val())
            .forEach(user=>{



                balance +=
                Number(
                user.balance || 0
                );



            });



        }






        updateText(

        "systemBalance",

        balance.toLocaleString()
        +" RWF"

        );



    });



}









// ================================
// RECENT ACTIVITY
// ================================


function loadRecentActivity(){



    const transactionRef =
    ref(db,"transactions");



    onValue(transactionRef,(snapshot)=>{



        const box =
        document.getElementById(
        "recentActivity"
        );



        if(!box) return;





        box.innerHTML = "";






        if(!snapshot.exists()){


            box.innerHTML =
            "<p>No activity found</p>";


            return;

        }






        Object.entries(snapshot.val())
        .reverse()
        .slice(0,10)
        .forEach(([id,item])=>{



            const div =
            document.createElement("div");



            div.className =
            "activity-item";



            div.innerHTML = `


<p>

<strong>
${(
item.type || "transaction"
)
.toUpperCase()}

</strong>


-

${Number(item.amount || 0)
.toLocaleString()} RWF

</p>



<span>

${item.status || "-"}

</span>



`;



            box.appendChild(div);



        });



    });



}








// ================================
// START DASHBOARD
// ================================


loadDashboardFinal();

// ======================================
// FINAL CLEANUP & OPTIMIZATION
// PART 11
// ======================================



// ================================
// GLOBAL ERROR HANDLER
// ================================


window.addEventListener(
"error",
(event)=>{


    console.error(
    "Money Vault Admin Error:",
    event.error
    );


});








// ================================
// CHECK ADMIN SESSION
// ================================


function checkAdminSession(){


    if(!currentAdmin){


        console.warn(
        "Admin session expired"
        );


        return false;

    }



    return true;


}









// ================================
// PREVENT DOUBLE CLICK
// ================================


document.addEventListener(
"click",
(event)=>{



    const button =
    event.target.closest("button");



    if(!button)
    return;



    if(button.disabled)
    return;



    if(
    button.classList.contains("approveBtn")
    ||
    button.classList.contains("rejectBtn")
    ){



        button.disabled = true;



        setTimeout(()=>{


            button.disabled = false;


        },2000);



    }



});









// ================================
// SAFE DATABASE UPDATE
// ================================


async function safeUpdate(path,data){


    try{


        await update(
        ref(db,path),
        data
        );



        return true;



    }catch(error){



        console.error(
        "Firebase update error:",
        error
        );



        alert(
        "Database error occurred"
        );



        return false;


    }


}









// ================================
// FINAL REFRESH
// ================================


const finalRefresh =
document.getElementById(
"refreshDashboard"
);




if(finalRefresh){



    finalRefresh.onclick = ()=>{



        if(!checkAdminSession())
        return;





        loadDashboardFinal();



        loadDeposits();



        loadWithdraws();



        loadVipRequests();



        loadBonusRequests();



        loadUsers();



        loadTransactions();






        console.log(
        "Admin data refreshed"
        );



    };



}









// ================================
// SESSION MONITOR
// ================================


setInterval(()=>{



    if(!currentAdmin){



        console.warn(
        "No active admin session"
        );



    }



},60000);








// ================================
// FINAL READY
// ================================


console.log(
"Money Vault Admin Panel Ready"
);


// ======================================
// FINAL VERIFICATION SYSTEM
// PART 12
// ======================================



// ================================
// FIREBASE CONNECTION CHECK
// ================================


function checkFirebaseConnection(){


    if(!db){


        console.error(
        "Firebase database not connected"
        );


        return false;

    }



    return true;


}









// ================================
// REQUIRED FUNCTIONS CHECK
// ================================


function checkAdminFunctions(){



    const requiredFunctions = [


        "loadDashboardFinal",

        "loadDeposits",

        "loadWithdraws",

        "loadVipRequests",

        "loadBonusRequests",

        "loadUsers",

        "loadTransactions"


    ];





    requiredFunctions.forEach(name=>{



        if(typeof window[name] === "undefined"
        &&
        typeof eval(name) !== "function"){



            console.warn(
            "Missing function:",
            name
            );



        }



    });



}









// ================================
// CLEAN EMPTY VALUES
// ================================


function cleanValue(value){


    if(
    value === null ||
    value === undefined ||
    value === ""
    ){


        return "-";


    }



    return value;


}









// ================================
// NUMBER FORMAT HELPER
// ================================


function formatMoney(value){


    return Number(value || 0)
    .toLocaleString()
    +" RWF";


}









// ================================
// FINAL START CHECK
// ================================


setTimeout(()=>{



    if(checkFirebaseConnection()){


        checkAdminFunctions();



        console.log(
        "Money Vault Admin verification completed"
        );



    }



},2000);



 
