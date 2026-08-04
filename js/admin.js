// ======================================
// ADMIN.JS - PART 1
// Money Vault Admin Panel
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

let selectedWithdrawId = null;

let selectedWithdrawData = null;



// ================================
// DOM ELEMENTS
// ================================

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



// ================================
// AUTH CHECK
// ================================

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";

        return;

    }



    currentAdmin = user;



    const adminRef =
    ref(db,"admins/"+user.uid);



    const snapshot =
    await get(adminRef);



    if(!snapshot.exists()){


        alert("Access denied");


        await signOut(auth);


        window.location.href="login.html";


        return;

    }



    const adminData =
    snapshot.val();



    adminName.textContent =
    adminData.name || "Administrator";


    adminEmail.textContent =
    user.email;



    if(loadingScreen){

        loadingScreen.style.display="none";

    }



    loadDashboard();


});



// ================================
// LOGOUT
// ================================


if(logoutBtn){


logoutBtn.addEventListener("click",async()=>{


    await signOut(auth);


    window.location.href="login.html";


});


}



// ================================
// SIDEBAR MOBILE MENU
// ================================


if(menuBtn){


menuBtn.addEventListener("click",()=>{


    sidebar.classList.toggle("active");


});


}




// ================================
// PAGE NAVIGATION
// ================================


menuLinks.forEach(link=>{


    link.addEventListener("click",(e)=>{


        e.preventDefault();



        const page =
        link.dataset.page;



        openPage(page);



    });



});




function openPage(page){


    sections.forEach(section=>{


        section.classList.remove("active");


    });



    menuLinks.forEach(link=>{


        link.classList.remove("active");


    });



    const target =
    document.getElementById(page+"Section");



    if(target){

        target.classList.add("active");

    }



    const activeLink =
    document.querySelector(
        `[data-page="${page}"]`
    );


    if(activeLink){

        activeLink.classList.add("active");

    }



    if(pageTitle){

        pageTitle.textContent =
        page.charAt(0).toUpperCase()+page.slice(1);

    }



}

    // ======================================
// ADMIN DASHBOARD FUNCTIONS
// PART 2
// ======================================



// ================================
// LOAD DASHBOARD
// ================================

function loadDashboard(){


    loadUsersCount();

    loadDepositStatistics();

    loadWithdrawStatistics();

    loadSystemBalance();

}



// ================================
// TOTAL USERS
// ================================

function loadUsersCount(){


    const usersRef =
    ref(db,"users");


    onValue(usersRef,(snapshot)=>{


        let total = 0;


        if(snapshot.exists()){


            total =
            Object.keys(snapshot.val()).length;


        }


        const element =
        document.getElementById("totalUsers");


        if(element){

            element.textContent = total;

        }


    });



}



// ================================
// DEPOSIT STATISTICS
// ================================

function loadDepositStatistics(){


    const depositRef =
    ref(db,"depositRequests");



    onValue(depositRef,(snapshot)=>{


        let total = 0;

        let pending = 0;

        let approved = 0;

        let rejected = 0;



        if(snapshot.exists()){


            const data =
            snapshot.val();



            Object.values(data).forEach(item=>{


                total++;



                if(item.status==="pending"){

                    pending++;

                }


                if(item.status==="approved"){

                    approved++;

                }


                if(item.status==="rejected"){

                    rejected++;

                }



            });



        }




        updateText("dashboardTotalDeposits",total);


        updateText("dashboardPendingDeposits",pending);


        updateText("dashboardApprovedDeposits",approved);



        updateText("depositTotalCount",total);


        updateText("depositPendingCount",pending);


        updateText("depositApprovedCount",approved);


        updateText("depositRejectedCount",rejected);



    });



}




// ================================
// WITHDRAW STATISTICS
// ================================

function loadWithdrawStatistics(){



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



                if(item.status==="pending"){

                    pending++;

                }


                if(item.status==="approved"){

                    approved++;

                }


                if(item.status==="rejected"){

                    rejected++;

                }



            });



        }



        updateText("dashboardTotalWithdraws",total);



        updateText("withdrawTotalCount",total);


        updateText("withdrawPendingCount",pending);


        updateText("withdrawApprovedCount",approved);


        updateText("withdrawRejectedCount",rejected);



    });



}




// ================================
// SYSTEM BALANCE
// ================================

function loadSystemBalance(){



    const usersRef =
    ref(db,"users");



    onValue(usersRef,(snapshot)=>{


        let balance = 0;



        if(snapshot.exists()){


            Object.values(snapshot.val())
            .forEach(user=>{


                balance +=
                Number(user.balance || 0);



            });



        }



        updateText(
            "systemBalance",
            balance.toLocaleString()+" RWF"
        );



    });



}



// ================================
// UPDATE TEXT HELPER
// ================================

function updateText(id,value){



    const element =
    document.getElementById(id);



    if(element){

        element.textContent = value;

    }



}

// ======================================
// DEPOSIT MANAGEMENT FINAL
// PART 10
// ======================================


// ================================
// LOAD DEPOSIT REQUESTS
// ================================

function loadDeposits(){


    const depositRef =
    ref(db,"depositRequests");



    onValue(depositRef,(snapshot)=>{


        const list =
        document.getElementById("depositList");


        const empty =
        document.getElementById("emptyDeposit");



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
        .forEach(([id,deposit])=>{



            const status =
            deposit.status || "pending";



            const card =
            document.createElement("div");



            card.className =
            "request-card";



            card.innerHTML = `


<div class="request-top">

<h3>

${deposit.name || "User Deposit"}

</h3>


<span class="status ${status}">

${status}

</span>


</div>



<p>

<strong>Email:</strong>

${deposit.email || "-"}

</p>


<p>

<strong>Amount:</strong>

${Number(deposit.amount || 0)
.toLocaleString()} RWF

</p>


<p>

<strong>Phone:</strong>

${deposit.phone || "-"}

</p>



<p>

<strong>Method:</strong>

${deposit.method || "Mobile Money"}

</p>



<p>

<strong>Transaction ID:</strong>

${deposit.transactionId || "-"}

</p>



<div class="action-buttons">


<button

class="approveBtn"

${status !== "pending" ? "disabled" : ""}

onclick="approveDeposit('${id}')">

<i class="fa-solid fa-circle-check"></i>

Approve

</button>



<button

class="rejectBtn"

${status !== "pending" ? "disabled" : ""}

onclick="rejectDeposit('${id}')">

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
// APPROVE DEPOSIT ONCE
// ================================


window.approveDeposit = async function(id){


    const depositRef =
    ref(db,"depositRequests/"+id);



    const snapshot =
    await get(depositRef);



    if(!snapshot.exists()){

        return;

    }



    const deposit =
    snapshot.val();



    // STOP DOUBLE ACTION

    if(deposit.status !== "pending"){


        alert("This deposit was already processed");


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



    const amount =
    Number(deposit.amount || 0);



    const oldBalance =
    Number(user.balance || 0);



    // UPDATE USER BALANCE

    await update(userRef,{

        balance:
        oldBalance + amount

    });




    // CHANGE STATUS

    await update(depositRef,{

        status:"approved",

        approvedAt:Date.now()

    });




    // SAVE TRANSACTION

    await set(
    push(ref(db,"transactions")),

    {


        uid:deposit.uid,

        type:"deposit",

        amount:amount,

        status:"approved",

        reference:id,

        date:Date.now()


    });



    alert("Deposit Approved Successfully");


};






// ================================
// REJECT DEPOSIT ONCE
// ================================


window.rejectDeposit = async function(id){



    const depositRef =
    ref(db,"depositRequests/"+id);



    const snapshot =
    await get(depositRef);



    if(!snapshot.exists()){

        return;

    }



    const deposit =
    snapshot.val();




    // STOP DOUBLE ACTION

    if(deposit.status !== "pending"){


        alert("This deposit was already processed");


        return;

    }





    await update(depositRef,{

        status:"rejected",

        rejectedAt:Date.now()

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


    });





    alert("Deposit Rejected Successfully");


};





// ================================
// START DEPOSIT SYSTEM
// ================================

loadDeposits();


// ======================================
// WITHDRAW MANAGEMENT FINAL
// PART 11
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



    if(!snapshot.exists()){

        return;

    }



    const withdraw =
    snapshot.val();



    // BLOCK DOUBLE APPROVE

    if(withdraw.status !== "pending"){


        alert("This withdraw was already processed");


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


        alert("Insufficient user balance");


        return;

    }






    // REMOVE MONEY

    await update(userRef,{

        balance:
        balance - amount

    });






    // UPDATE STATUS

    await update(withdrawRef,{

        status:"approved",

        approvedAt:Date.now()

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


    });






    alert("Withdraw Approved Successfully");


};








// ================================
// REJECT WITHDRAW ONCE
// ================================


window.rejectWithdraw = async function(id){



    const withdrawRef =
    ref(db,"withdrawRequests/"+id);



    const snapshot =
    await get(withdrawRef);



    if(!snapshot.exists()){

        return;

    }



    const withdraw =
    snapshot.val();






    // BLOCK DOUBLE REJECT

    if(withdraw.status !== "pending"){


        alert("This withdraw was already processed");


        return;

    }





    await update(withdrawRef,{

        status:"rejected",

        rejectedAt:Date.now()

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


    });







    alert("Withdraw Rejected Successfully");


};







// ================================
// START WITHDRAW SYSTEM
// ================================

loadWithdraws();

    
// ======================================
// VIP REQUEST MANAGEMENT FINAL
// PART 12
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
        .forEach(([id,vip])=>{



            const status =
            vip.status || "pending";



            const card =
            document.createElement("div");



            card.className =
            "request-card";



            card.innerHTML=`


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



    if(!snapshot.exists()){

        return;

    }



    const vip =
    snapshot.val();





    // BLOCK DOUBLE ACTION

    if(vip.status !== "pending"){


        alert("This VIP request was already processed");


        return;

    }





    await update(vipRef,{

        status:"approved",

        approvedAt:Date.now()

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


    });







    alert("VIP Approved Successfully");


};










// ================================
// REJECT VIP ONCE
// ================================


window.rejectVip = async function(id){



    const vipRef =
    ref(db,"vipRequests/"+id);



    const snapshot =
    await get(vipRef);



    if(!snapshot.exists()){

        return;

    }



    const vip =
    snapshot.val();







    // BLOCK DOUBLE ACTION

    if(vip.status !== "pending"){


        alert("This VIP request was already processed");


        return;

    }







    await update(vipRef,{

        status:"rejected",

        rejectedAt:Date.now()

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


    });







    alert("VIP Rejected Successfully");


};







// ================================
// START VIP SYSTEM
// ================================

loadVipRequests();


// ======================================
// BONUS REQUEST MANAGEMENT FINAL
// PART 13
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



            card.innerHTML=`


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

<strong>Bonus Amount:</strong>

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



    if(!snapshot.exists()){

        return;

    }



    const bonus =
    snapshot.val();






    // BLOCK DOUBLE ACTION

    if(bonus.status !== "pending"){


        alert("This bonus request was already processed");


        return;

    }






    const userRef =
    ref(db,"users/"+bonus.uid);



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
    Number(bonus.amount || 0);







    // ADD BONUS TO BALANCE

    await update(userRef,{

        balance:
        oldBalance + amount

    });








    // UPDATE BONUS STATUS

    await update(bonusRef,{

        status:"approved",

        approvedAt:Date.now()

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


    });









    alert("Bonus Approved Successfully");


};











// ================================
// REJECT BONUS ONCE
// ================================


window.rejectBonus = async function(id){



    const bonusRef =
    ref(db,"bonusRequests/"+id);



    const snapshot =
    await get(bonusRef);



    if(!snapshot.exists()){

        return;

    }



    const bonus =
    snapshot.val();








    // BLOCK DOUBLE ACTION

    if(bonus.status !== "pending"){


        alert("This bonus request was already processed");


        return

      // ======================================
// USERS MANAGEMENT
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
        .forEach(([uid,user])=>{


            const card =
            document.createElement("div");


            card.className="user-card";



            card.innerHTML=`


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

${Number(user.balance || 0).toLocaleString()} RWF

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

class="rejectBtn"

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

Name: ${user.name || "-"}

Email: ${user.email || "-"}

Phone: ${user.phone || "-"}

Balance: ${user.balance || 0} RWF

VIP: ${user.vip || "None"}

`);



};




// ================================
// DELETE USER DATA
// ================================

window.deleteUser = async function(uid){



    const confirmDelete =
    confirm(
    "Delete this user data?"
    );



    if(!confirmDelete) return;



    await remove(
    ref(db,"users/"+uid)
    );



    alert("User deleted");



};





// ================================
// USER SEARCH
// ================================

const userSearch =
document.getElementById("userSearch");



if(userSearch){



userSearch.addEventListener("input",()=>{


    const value =
    userSearch.value.toLowerCase();



    document
    .querySelectorAll(".user-card")
    .forEach(card=>{


        if(
        card.innerText
        .toLowerCase()
        .includes(value)
        ){


            card.style.display="block";


        }else{


            card.style.display="none";


        }



    });



});



}



// ================================
// AUTO LOAD
// ================================

loadUsers();  

    // ======================================
// TRANSACTIONS MANAGEMENT
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
        .forEach(([id,transaction])=>{


            const card =
            document.createElement("div");



            card.className="transaction-card";



            const date =
            transaction.date
            ?
            new Date(transaction.date)
            .toLocaleString()
            :
            "-";



            card.innerHTML=`


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


transactionSearch.addEventListener("input",()=>{


    const value =
    transactionSearch.value
    .toLowerCase();



    document
    .querySelectorAll(".transaction-card")
    .forEach(card=>{


        if(
        card.innerText
        .toLowerCase()
        .includes(value)
        ){


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



transactionFilter.addEventListener("change",()=>{


    const value =
    transactionFilter.value;



    document
    .querySelectorAll(".transaction-card")
    .forEach(card=>{


        const text =
        card.innerText
        .toLowerCase();



        if(value==="all"){


            card.style.display="block";


        }

        else if(
        text.includes(value)
        ){


            card.style.display="block";


        }

        else{


            card.style.display="none";


        }



    });



});



}





// ================================
// AUTO LOAD
// ================================

loadTransactions();

// ======================================
// SETTINGS + QUICK ACTIONS
// PART 9
// ======================================



// ================================
// SETTINGS
// ================================


const saveSettings =
document.getElementById("saveSettings");



if(saveSettings){



saveSettings.addEventListener("click",async()=>{


    if(!currentAdmin) return;



    const name =
    document.getElementById("adminNameInput")
    .value;



    await update(
    ref(db,"admins/"+currentAdmin.uid),
    {

        name:name

    });



    alert("Settings Saved");



});



}





// ================================
// LOAD ADMIN SETTINGS
// ================================


function loadAdminSettings(){


    if(!currentAdmin) return;



    const adminRef =
    ref(db,"admins/"+currentAdmin.uid);



    onValue(adminRef,(snapshot)=>{


        if(!snapshot.exists()) return;



        const data =
        snapshot.val();



        const nameInput =
        document.getElementById("adminNameInput");



        const emailInput =
        document.getElementById("adminEmailInput");



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
// REFRESH DASHBOARD
// ================================


const refreshDashboard =
document.getElementById("refreshDashboard");



if(refreshDashboard){


refreshDashboard.addEventListener("click",()=>{


    loadDashboard();


    loadDeposits();


    loadWithdraws();


    loadVipRequests();


    loadBonusRequests();


    loadUsers();


    loadTransactions();



    alert("Dashboard refreshed");


});



}





// ================================
// QUICK ACTION BUTTONS
// ================================


function quickOpen(button,page){


    const element =
    document.getElementById(button);



    if(element){


        element.addEventListener("click",()=>{


            openPage(page);


        });


    }


}



quickOpen(
"openDeposits",
"deposits"
);



quickOpen(
"openWithdraws",
"withdraws"
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



quickOpen(
"openVipRequests",
"vipRequests"
);




quickOpen(
"openUsersBtn",
"users"
);



quickOpen(
"openTransactionsBtn",
"transactions"
);



quickOpen(
"openSettingsBtn",
"settings"
);





// ================================
// START ADMIN SYSTEM
// ================================


setTimeout(()=>{


    loadAdminSettings();


},1000);
