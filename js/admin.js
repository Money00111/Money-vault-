// ======================================
// ADMIN.JS - PART 1
// FIREBASE + AUTH + GLOBAL SETUP
// MONEY VAULT ADMIN PANEL
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

        window.location.href =
        "login.html";

        return;

    }



    currentAdmin = user;



    try{


        const adminSnap =
        await get(
            ref(db,"admins/"+user.uid)
        );



        if(!adminSnap.exists()){


            alert(
            "Access Denied"
            );


            await signOut(auth);


            window.location.href =
            "login.html";


            return;

        }




        const admin =
        adminSnap.val();




        if(adminName){

            adminName.textContent =
            admin.name ||
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




        // START DASHBOARD

        if(typeof loadDashboardFinal === "function"){

            loadDashboardFinal();

        }



    }catch(error){



        console.error(
        "Admin Auth Error:",
        error
        );


        alert(
        "Authentication Error"
        );

    }



});







// ================================
// LOGOUT
// ================================

if(logoutBtn){


    logoutBtn.addEventListener(
    "click",
    async()=>{


        try{


            await signOut(auth);


            window.location.href =
            "login.html";



        }catch(error){


            console.error(
            error
            );


        }


    });



}







// ================================
// MOBILE MENU
// ================================

if(menuBtn && sidebar){



    menuBtn.addEventListener(
    "click",
    ()=>{


        sidebar.classList.toggle(
        "active"
        );


    });



}







// ================================
// PAGE NAVIGATION
// ================================


menuLinks.forEach(link=>{


    link.addEventListener(
    "click",
    (e)=>{


        e.preventDefault();



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







// ================================
// TEXT UPDATE HELPER
// ================================

function updateText(id,value){


    const el =
    document.getElementById(id);



    if(el){


        el.textContent =
        value;


    }


}




// ================================
// NUMBER FORMAT
// ================================

function formatMoney(value){


    return Number(value || 0)
    .toLocaleString()
    +" RWF";


}




console.log(
"Money Vault Admin Part 1 Loaded"
);

        
// ======================================
// ADMIN.JS - PART 2
// DASHBOARD SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// TOTAL USERS COUNT
// ================================

function loadUsersCountFinal(){


    const usersRef =
    ref(db,"users");



    onValue(usersRef,(snapshot)=>{


        let total = 0;



        if(snapshot.exists()){


            total =
            Object.keys(
            snapshot.val()
            ).length;


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


            Object.values(
            snapshot.val()
            )
            .forEach(deposit=>{


                total++;



                if(
                deposit.status === "pending"
                )
                pending++;



                if(
                deposit.status === "approved"
                )
                approved++;



                if(
                deposit.status === "rejected"
                )
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


            Object.values(
            snapshot.val()
            )
            .forEach(withdraw=>{


                total++;



                if(
                withdraw.status === "pending"
                )
                pending++;



                if(
                withdraw.status === "approved"
                )
                approved++;



                if(
                withdraw.status === "rejected"
                )
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


            Object.values(
            snapshot.val()
            )
            .forEach(user=>{


                balance +=
                Number(
                user.balance || 0
                );


            });


        }





        updateText(
        "systemBalance",
        balance
        .toLocaleString()
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





        Object.entries(
        snapshot.val()
        )
        .reverse()
        .slice(0,10)
        .forEach(([id,item])=>{


            const div =
            document.createElement(
            "div"
            );



            div.className =
            "activity-item";



            div.innerHTML = `

<p>

<strong>
${(
item.type ||
"TRANSACTION"
)
.toUpperCase()}

</strong>

-

${Number(
item.amount || 0
)
.toLocaleString()}
RWF

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
// DASHBOARD START
// ================================

function loadDashboardFinal(){


    loadUsersCountFinal();


    loadDepositStatisticsFinal();


    loadWithdrawStatisticsFinal();


    loadSystemBalanceFinal();


    loadRecentActivity();



}



console.log(
"Money Vault Admin Part 2 Loaded"
);    


// ======================================
// ADMIN.JS - PART 3
// DEPOSIT MANAGEMENT SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// LOAD DEPOSIT REQUESTS
// ================================

function loadDeposits(){


    const depositRef =
    ref(db,"depositRequests");



    onValue(depositRef,(snapshot)=>{


        const list =
        document.getElementById(
        "depositList"
        );


        const empty =
        document.getElementById(
        "emptyDeposit"
        );



        if(!list) return;



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






        Object.entries(
        snapshot.val()
        )
        .reverse()
        .forEach(([id,deposit])=>{



            const status =
            deposit.status ||
            "pending";



            const card =
            document.createElement(
            "div"
            );


            card.className =
            "request-card";



            card.innerHTML = `


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
${deposit.name || "-"}
</p>



<p>
<strong>Email:</strong>
${deposit.email || "-"}
</p>



<p>
<strong>Amount:</strong>
${Number(
deposit.amount || 0
)
.toLocaleString()}
RWF
</p>



<p>
<strong>Phone:</strong>
${deposit.phone || "-"}
</p>



<p>
<strong>Method:</strong>
${deposit.method || "-"}
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

${status === "approved"
?
"Approved"
:
"Approve"}

</button>





<button

class="rejectBtn"

${status !== "pending" ? "disabled" : ""}

onclick="rejectDeposit('${id}')">

<i class="fa-solid fa-circle-xmark"></i>

${status === "rejected"
?
"Rejected"
:
"Reject"}

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

window.approveDeposit =
async function(id){



    const depositRef =
    ref(
    db,
    "depositRequests/"+id
    );



    const snap =
    await get(depositRef);



    if(!snap.exists())
    return;



    const deposit =
    snap.val();





    if(
    deposit.status !== "pending"
    ){


        alert(
        "Deposit already processed"
        );


        return;

    }






    const userRef =
    ref(
    db,
    "users/"+deposit.uid
    );



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
    Number(
    user.balance || 0
    );



    const amount =
    Number(
    deposit.amount || 0
    );






    // ADD BALANCE

    await update(
    userRef,
    {

        balance:
        oldBalance + amount

    });








    // UPDATE STATUS

    await update(
    depositRef,
    {

        status:
        "approved",

        approvedAt:
        Date.now()

    });









    // SAVE TRANSACTION

    await set(

        push(
        ref(db,"transactions")
        ),

        {

            uid:
            deposit.uid,

            type:
            "deposit",

            amount:
            amount,

            status:
            "approved",

            reference:
            id,

            date:
            Date.now()

        }

    );







    alert(
    "Deposit Approved Successfully"
    );



};









// ================================
// REJECT DEPOSIT ONCE
// ================================

window.rejectDeposit =
async function(id){



    const depositRef =
    ref(
    db,
    "depositRequests/"+id
    );



    const snap =
    await get(depositRef);



    if(!snap.exists())
    return;



    const deposit =
    snap.val();






    if(
    deposit.status !== "pending"
    ){


        alert(
        "Deposit already processed"
        );


        return;

    }







    await update(
    depositRef,
    {

        status:
        "rejected",

        rejectedAt:
        Date.now()

    });









    await set(

        push(
        ref(db,"transactions")
        ),

        {

            uid:
            deposit.uid,

            type:
            "deposit",

            amount:
            Number(
            deposit.amount || 0
            ),

            status:
            "rejected",

            reference:
            id,

            date:
            Date.now()

        }

    );








    alert(
    "Deposit Rejected Successfully"
    );



};








// ================================
// SEARCH DEPOSITS
// ================================

const depositSearch =
document.getElementById(
"depositSearch"
);



if(depositSearch){


    depositSearch.addEventListener(
    "input",
    ()=>{


        const value =
        depositSearch.value
        .toLowerCase();




        document
        .querySelectorAll(
        "#depositList .request-card"
        )
        .forEach(card=>{


            card.style.display =
            card.innerText
            .toLowerCase()
            .includes(value)
            ?
            "block"
            :
            "none";



        });



    });


}









// ================================
// START DEPOSIT SYSTEM
// ================================

loadDeposits();



console.log(
"Money Vault Admin Part 3 Loaded"
);


// ======================================
// ADMIN.JS - PART 4
// WITHDRAW MANAGEMENT SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// LOAD WITHDRAW REQUESTS
// ================================

function loadWithdraws(){


    const withdrawRef =
    ref(db,"withdrawRequests");



    onValue(withdrawRef,(snapshot)=>{


        const list =
        document.getElementById(
        "withdrawList"
        );


        const empty =
        document.getElementById(
        "emptyWithdraw"
        );



        if(!list) return;



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







        Object.entries(
        snapshot.val()
        )
        .reverse()
        .forEach(([id,withdraw])=>{



            const status =
            withdraw.status ||
            "pending";



            const card =
            document.createElement(
            "div"
            );



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
.toLocaleString()}
RWF
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

${status !== "pending"
?
"disabled"
:
""}

onclick="approveWithdraw('${id}')">


<i class="fa-solid fa-circle-check"></i>

${status === "approved"
?
"Approved"
:
"Approve"}

</button>






<button

class="rejectBtn"

${status !== "pending"
?
"disabled"
:
""}

onclick="rejectWithdraw('${id}')">


<i class="fa-solid fa-circle-xmark"></i>


${status === "rejected"
?
"Rejected"
:
"Reject"}

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

window.approveWithdraw =
async function(id){



    const withdrawRef =
    ref(
    db,
    "withdrawRequests/"+id
    );



    const snap =
    await get(withdrawRef);



    if(!snap.exists())
    return;



    const withdraw =
    snap.val();





    // BLOCK DOUBLE APPROVE

    if(
    withdraw.status !== "pending"
    ){


        alert(
        "Withdraw already processed"
        );


        return;

    }







    const userRef =
    ref(
    db,
    "users/"+withdraw.uid
    );



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



    const balance =
    Number(
    user.balance || 0
    );



    const amount =
    Number(
    withdraw.amount || 0
    );







    // CHECK BALANCE

    if(balance < amount){


        alert(
        "Insufficient balance"
        );


        return;

    }








    // REMOVE MONEY

    await update(
    userRef,
    {

        balance:
        balance - amount

    });









    // CHANGE STATUS

    await update(
    withdrawRef,
    {

        status:
        "approved",

        approvedAt:
        Date.now()

    });









    // SAVE TRANSACTION

    await set(

        push(
        ref(db,"transactions")
        ),

        {


            uid:
            withdraw.uid,


            type:
            "withdraw",


            amount:
            amount,


            status:
            "approved",


            reference:
            id,


            date:
            Date.now()


        }

    );








    alert(
    "Withdraw Approved Successfully"
    );



};









// ================================
// REJECT WITHDRAW ONCE
// ================================

window.rejectWithdraw =
async function(id){



    const withdrawRef =
    ref(
    db,
    "withdrawRequests/"+id
    );



    const snap =
    await get(withdrawRef);



    if(!snap.exists())
    return;



    const withdraw =
    snap.val();







    // BLOCK DOUBLE REJECT

    if(
    withdraw.status !== "pending"
    ){


        alert(
        "Withdraw already processed"
        );


        return;

    }







    await update(
    withdrawRef,
    {

        status:
        "rejected",

        rejectedAt:
        Date.now()

    });








    await set(

        push(
        ref(db,"transactions")
        ),

        {


            uid:
            withdraw.uid,


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


            date:
            Date.now()


        }

    );







    alert(
    "Withdraw Rejected Successfully"
    );



};










// ================================
// SEARCH WITHDRAW
// ================================

const withdrawSearch =
document.getElementById(
"withdrawSearch"
);



if(withdrawSearch){


    withdrawSearch.addEventListener(
    "input",
    ()=>{


        const value =
        withdrawSearch.value
        .toLowerCase();




        document
        .querySelectorAll(
        "#withdrawList .request-card"
        )
        .forEach(card=>{


            card.style.display =
            card.innerText
            .toLowerCase()
            .includes(value)
            ?
            "block"
            :
            "none";



        });



    });



}









// ================================
// START WITHDRAW SYSTEM
// ================================

loadWithdraws();



console.log(
"Money Vault Admin Part 4 Loaded"
);


// ======================================
// ADMIN.JS - PART 5
// VIP REQUEST MANAGEMENT SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// LOAD VIP REQUESTS
// ================================

function loadVipRequests(){


    const vipRef =
    ref(db,"vipRequests");



    onValue(vipRef,(snapshot)=>{


        const list =
        document.getElementById(
        "vipRequestList"
        );


        const empty =
        document.getElementById(
        "emptyVipRequest"
        );



        if(!list) return;



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







        Object.entries(
        snapshot.val()
        )
        .reverse()
        .forEach(([id,vip])=>{



            const status =
            vip.status ||
            "pending";



            const card =
            document.createElement(
            "div"
            );



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

<strong>Name:</strong>

${vip.name || "-"}

</p>





<p>

<strong>Email:</strong>

${vip.email || "-"}

</p>





<p>

<strong>Price:</strong>

${Number(
vip.price || 0
)
.toLocaleString()}
RWF

</p>






<p>

<strong>Daily Income:</strong>

${Number(
vip.dailyIncome || 0
)
.toLocaleString()}
RWF

</p>






<p>

<strong>Duration:</strong>

${vip.duration || 0}
Days

</p>







<div class="action-buttons">



<button

class="approveBtn"

${status !== "pending"
?
"disabled"
:
""}

onclick="approveVip('${id}')">


<i class="fa-solid fa-circle-check"></i>


${status === "approved"
?
"Approved"
:
"Approve VIP"}

</button>







<button

class="rejectBtn"

${status !== "pending"
?
"disabled"
:
""}

onclick="rejectVip('${id}')">


<i class="fa-solid fa-circle-xmark"></i>


${status === "rejected"
?
"Rejected"
:
"Reject VIP"}

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

window.approveVip =
async function(id){



    const vipRef =
    ref(
    db,
    "vipRequests/"+id
    );



    const snap =
    await get(vipRef);



    if(!snap.exists())
    return;



    const vip =
    snap.val();







    if(
    vip.status !== "pending"
    ){


        alert(
        "VIP request already processed"
        );


        return;

    }









    // ADD VIP TO USER
    // DOES NOT REMOVE OLD VIP

    const userVipRef =
    push(
    ref(
    db,
    "users/"
    +
    vip.uid
    +
    "/vipPlans"
    )
    );





    await set(
    userVipRef,
    {


        vipName:
        vip.vipName || "",



        price:
        Number(
        vip.price || 0
        ),



        dailyIncome:
        Number(
        vip.dailyIncome || 0
        ),



        duration:
        Number(
        vip.duration || 0
        ),



        totalProfit:
        Number(
        vip.totalProfit || 0
        ),



        purchaseDate:
        Date.now(),



        lastClaim:
        0,



        active:
        true


    });









    // UPDATE REQUEST STATUS

    await update(
    vipRef,
    {


        status:
        "approved",


        approvedAt:
        Date.now()


    });









    // SAVE TRANSACTION

    await set(

        push(
        ref(db,"transactions")
        ),

        {


            uid:
            vip.uid,


            type:
            "vip",


            amount:
            Number(
            vip.price || 0
            ),


            vipName:
            vip.vipName || "",


            status:
            "approved",


            reference:
            id,


            date:
            Date.now()


        }

    );








    alert(
    "VIP Approved Successfully"
    );



};









// ================================
// REJECT VIP ONCE
// ================================

window.rejectVip =
async function(id){



    const vipRef =
    ref(
    db,
    "vipRequests/"+id
    );



    const snap =
    await get(vipRef);



    if(!snap.exists())
    return;



    const vip =
    snap.val();







    if(
    vip.status !== "pending"
    ){


        alert(
        "VIP request already processed"
        );


        return;

    }









    await update(
    vipRef,
    {


        status:
        "rejected",



        rejectedAt:
        Date.now()


    });









    await set(

        push(
        ref(db,"transactions")
        ),

        {


            uid:
            vip.uid,


            type:
            "vip",


            amount:
            Number(
            vip.price || 0
            ),


            vipName:
            vip.vipName || "",


            status:
            "rejected",


            reference:
            id,


            date:
            Date.now()


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



console.log(
"Money Vault Admin Part 5 Loaded"
);

// ======================================
// ADMIN.JS - PART 6
// BONUS REQUEST MANAGEMENT SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// LOAD BONUS REQUESTS
// ================================

function loadBonusRequests(){


    const bonusRef =
    ref(db,"bonusRequests");



    onValue(bonusRef,(snapshot)=>{


        const list =
        document.getElementById(
        "bonusRequestList"
        );


        const empty =
        document.getElementById(
        "emptyBonusRequest"
        );



        if(!list) return;



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







        Object.entries(
        snapshot.val()
        )
        .reverse()
        .forEach(([id,bonus])=>{



            const status =
            bonus.status ||
            "pending";



            const card =
            document.createElement(
            "div"
            );



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

${Number(
bonus.amount || 0
)
.toLocaleString()}
RWF

</p>





<p>

<strong>Reason:</strong>

${bonus.reason || "-"}

</p>







<div class="action-buttons">



<button

class="approveBtn"

${status !== "pending"
?
"disabled"
:
""}

onclick="approveBonus('${id}')">


<i class="fa-solid fa-circle-check"></i>


${status === "approved"
?
"Approved"
:
"Approve"}

</button>






<button

class="rejectBtn"

${status !== "pending"
?
"disabled"
:
""}

onclick="rejectBonus('${id}')">


<i class="fa-solid fa-circle-xmark"></i>


${status === "rejected"
?
"Rejected"
:
"Reject"}

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

window.approveBonus =
async function(id){



    const bonusRef =
    ref(
    db,
    "bonusRequests/"+id
    );



    const snap =
    await get(bonusRef);



    if(!snap.exists())
    return;



    const bonus =
    snap.val();







    // BLOCK DOUBLE APPROVE

    if(
    bonus.status !== "pending"
    ){


        alert(
        "Bonus already processed"
        );


        return;

    }







    const userRef =
    ref(
    db,
    "users/"+bonus.uid
    );



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
    Number(
    user.balance || 0
    );



    const amount =
    Number(
    bonus.amount || 0
    );









    // ADD BONUS MONEY

    await update(
    userRef,
    {

        balance:
        oldBalance + amount

    });









    // UPDATE STATUS

    await update(
    bonusRef,
    {

        status:
        "approved",


        approvedAt:
        Date.now()


    });









    // SAVE TRANSACTION

    await set(

        push(
        ref(db,"transactions")
        ),

        {

            uid:
            bonus.uid,


            type:
            "bonus",


            amount:
            amount,


            status:
            "approved",


            reference:
            id,


            date:
            Date.now()


        }

    );








    alert(
    "Bonus Approved Successfully"
    );



};









// ================================
// REJECT BONUS ONCE
// ================================

window.rejectBonus =
async function(id){



    const bonusRef =
    ref(
    db,
    "bonusRequests/"+id
    );



    const snap =
    await get(bonusRef);



    if(!snap.exists())
    return;



    const bonus =
    snap.val();







    // BLOCK DOUBLE REJECT

    if(
    bonus.status !== "pending"
    ){


        alert(
        "Bonus already processed"
        );


        return;

    }








    await update(
    bonusRef,
    {


        status:
        "rejected",


        rejectedAt:
        Date.now()


    });









    await set(

        push(
        ref(db,"transactions")
        ),

        {


            uid:
            bonus.uid,


            type:
            "bonus",


            amount:
            Number(
            bonus.amount || 0
            ),


            status:
            "rejected",


            reference:
            id,


            date:
            Date.now()


        }

    );








    alert(
    "Bonus Rejected Successfully"
    );



};









// ================================
// SEARCH BONUS
// ================================

const bonusSearch =
document.getElementById(
"bonusSearch"
);



if(bonusSearch){


    bonusSearch.addEventListener(
    "input",
    ()=>{


        const value =
        bonusSearch.value
        .toLowerCase();




        document
        .querySelectorAll(
        "#bonusRequestList .request-card"
        )
        .forEach(card=>{


            card.style.display =
            card.innerText
            .toLowerCase()
            .includes(value)
            ?
            "block"
            :
            "none";


        });



    });



}









// ================================
// START BONUS SYSTEM
// ================================

loadBonusRequests();



console.log(
"Money Vault Admin Part 6 Loaded"
);

        
// ======================================
// ADMIN.JS - PART 7
// USERS MANAGEMENT SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// LOAD USERS
// ================================

function loadUsers(){


    const usersRef =
    ref(db,"users");



    onValue(usersRef,(snapshot)=>{


        const list =
        document.getElementById(
        "usersList"
        );


        const empty =
        document.getElementById(
        "emptyUsers"
        );



        if(!list) return;



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







        Object.entries(
        snapshot.val()
        )
        .reverse()
        .forEach(([uid,user])=>{



            const card =
            document.createElement(
            "div"
            );



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

${Number(
user.balance || 0
)
.toLocaleString()}
RWF

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
// VIEW USER DETAILS
// ================================

window.viewUser =
async function(uid){



    const userRef =
    ref(
    db,
    "users/"+uid
    );



    const snap =
    await get(userRef);



    if(!snap.exists())
    return;



    const user =
    snap.val();







    alert(`

Name:
${user.name || "-"}


Email:
${user.email || "-"}


Phone:
${user.phone || "-"}


Balance:
${Number(
user.balance || 0
)
.toLocaleString()}
RWF


VIP:
${user.vip || "None"}


Status:
${user.status || "active"}

`);




};









// ================================
// DELETE USER
// ================================

window.deleteUser =
async function(uid){



    const confirmDelete =
    confirm(
    "Are you sure you want to delete this user?"
    );



    if(!confirmDelete)
    return;








    await remove(
    ref(
    db,
    "users/"+uid
    )
    );







    alert(
    "User deleted successfully"
    );



};









// ================================
// SEARCH USERS
// ================================

const userSearch =
document.getElementById(
"userSearch"
);



if(userSearch){


    userSearch.addEventListener(
    "input",
    ()=>{


        const value =
        userSearch.value
        .toLowerCase();




        document
        .querySelectorAll(
        "#usersList .user-card"
        )
        .forEach(card=>{


            const text =
            card.innerText
            .toLowerCase();




            card.style.display =
            text.includes(value)
            ?
            "block"
            :
            "none";



        });



    });



}









// ================================
// START USERS SYSTEM
// ================================

loadUsers();



console.log(
"Money Vault Admin Part 7 Loaded"
);


// ======================================
// ADMIN.JS - PART 8
// TRANSACTIONS MANAGEMENT SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// LOAD TRANSACTIONS
// ================================

function loadTransactions(){


    const transactionRef =
    ref(db,"transactions");



    onValue(transactionRef,(snapshot)=>{


        const list =
        document.getElementById(
        "transactionList"
        );


        const empty =
        document.getElementById(
        "emptyTransaction"
        );



        if(!list) return;



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







        Object.entries(
        snapshot.val()
        )
        .reverse()
        .forEach(([id,transaction])=>{



            const card =
            document.createElement(
            "div"
            );



            card.className =
            "transaction-card";



            const date =
            transaction.date
            ?
            new Date(
            transaction.date
            )
            .toLocaleString()
            :
            "-";





            card.innerHTML = `



<div class="transaction-header">


<h3>

${(
transaction.type ||
"transaction"
)
.toUpperCase()}

</h3>





<span class="status ${
transaction.status || "pending"
}">

${transaction.status || "pending"}

</span>



</div>








<p>

<strong>User ID:</strong>

${transaction.uid || "-"}

</p>







<p>

<strong>Amount:</strong>

${Number(
transaction.amount || 0
)
.toLocaleString()}
RWF

</p>







<p>

<strong>Date:</strong>

${date}

</p>







${
transaction.vipName
?

`

<p>

<strong>VIP:</strong>

${transaction.vipName}

</p>

`

:

""

}



`;



            list.appendChild(card);



        });



    });



}









// ================================
// SEARCH TRANSACTIONS
// ================================

const transactionSearch =
document.getElementById(
"transactionSearch"
);



if(transactionSearch){



    transactionSearch.addEventListener(
    "input",
    ()=>{



        const value =
        transactionSearch.value
        .toLowerCase();






        document
        .querySelectorAll(
        "#transactionList .transaction-card"
        )
        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();





            card.style.display =
            text.includes(value)
            ?
            "block"
            :
            "none";



        });



    });



}









// ================================
// TRANSACTION FILTER
// ================================

const transactionFilter =
document.getElementById(
"transactionFilter"
);



if(transactionFilter){



    transactionFilter.addEventListener(
    "change",
    ()=>{



        const value =
        transactionFilter.value
        .toLowerCase();






        document
        .querySelectorAll(
        "#transactionList .transaction-card"
        )
        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();






            if(
            value === "all" ||
            text.includes(value)
            ){


                card.style.display =
                "block";


            }else{


                card.style.display =
                "none";


            }



        });



    });



}









// ================================
// START TRANSACTION SYSTEM
// ================================

loadTransactions();



console.log(
"Money Vault Admin Part 8 Loaded"
);

        
// ======================================
// ADMIN.JS - PART 9
// SETTINGS + QUICK ACTIONS SYSTEM
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// SAVE ADMIN SETTINGS
// ================================

const saveSettings =
document.getElementById(
"saveSettings"
);



if(saveSettings){


    saveSettings.addEventListener(
    "click",
    async()=>{



        if(!currentAdmin)
        return;






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



    if(!currentAdmin)
    return;







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
// QUICK OPEN FUNCTION
// ================================

function quickOpen(
button,
page
){



    const element =
    document.getElementById(
    button
    );




    if(element){



        element.addEventListener(
        "click",
        ()=>{


            openPage(page);


        });



    }



}









// ================================
// QUICK BUTTONS
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
"openBonusRequests",
"bonusRequests"
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
// REFRESH DASHBOARD
// ================================

const refreshDashboard =
document.getElementById(
"refreshDashboard"
);



if(refreshDashboard){



    refreshDashboard.addEventListener(
    "click",
    ()=>{



        if(typeof loadDashboardFinal === "function"){

            loadDashboardFinal();

        }



        if(typeof loadDeposits === "function"){

            loadDeposits();

        }



        if(typeof loadWithdraws === "function"){

            loadWithdraws();

        }



        if(typeof loadVipRequests === "function"){

            loadVipRequests();

        }



        if(typeof loadBonusRequests === "function"){

            loadBonusRequests();

        }



        if(typeof loadUsers === "function"){

            loadUsers();

        }



        if(typeof loadTransactions === "function"){

            loadTransactions();

        }





        alert(
        "Dashboard Refreshed"
        );



    });



}









// ================================
// START SETTINGS
// ================================

setTimeout(()=>{


    loadAdminSettings();


},1000);






console.log(
"Money Vault Admin Part 9 Loaded"
);       

// ======================================
// ADMIN.JS - PART 10
// DASHBOARD FINAL SYSTEM
// MONEY VAULT ADMIN PANEL
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
            Object.keys(
            snapshot.val()
            )
            .length;


        }




        updateText(
        "totalUsers",
        total
        );



    });



}









// ================================
// DEPOSIT DASHBOARD STATS
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


            Object.values(
            snapshot.val()
            )
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
// WITHDRAW DASHBOARD STATS
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


            Object.values(
            snapshot.val()
            )
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
        totalBalance
        .toLocaleString()
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



        if(!box)
        return;



        box.innerHTML = "";





        if(!snapshot.exists()){


            box.innerHTML =
            "<p>No activity found</p>";

            return;

        }







        Object.entries(
        snapshot.val()
        )
        .reverse()
        .slice(0,10)
        .forEach(([id,item])=>{



            const div =
            document.createElement(
            "div"
            );



            div.className =
            "activity-item";



            div.innerHTML = `


<p>

<strong>

${(
item.type ||
"transaction"
)
.toUpperCase()}

</strong>


-

${Number(
item.amount || 0
)
.toLocaleString()}
RWF


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





console.log(
"Money Vault Admin Part 10 Loaded"
);


// ======================================
// ADMIN.JS - PART 11
// SMART BUTTON SYSTEM + OPTIMIZATION
// MONEY VAULT ADMIN PANEL
// ======================================



// ================================
// SMART BUTTON STYLE
// ================================

function setButtonLoading(button,text){


    if(!button)
    return;



    button.disabled = true;


    button.classList.add(
    "processing"
    );


    button.innerHTML = `

<i class="fa-solid fa-spinner fa-spin"></i>

${text}

`;



}









function setButtonSuccess(button,text){


    if(!button)
    return;



    button.disabled = true;


    button.classList.remove(
    "processing"
    );


    button.classList.add(
    "success"
    );



    button.innerHTML = `

<i class="fa-solid fa-check"></i>

${text}

`;



}









function setButtonReject(button,text){


    if(!button)
    return;



    button.disabled = true;


    button.classList.remove(
    "processing"
    );


    button.classList.add(
    "rejected"
    );



    button.innerHTML = `

<i class="fa-solid fa-xmark"></i>

${text}

`;



}









// ================================
// PREVENT DOUBLE CLICK
// ================================

document.addEventListener(
"click",
(event)=>{



    const button =
    event.target.closest(
    "button"
    );



    if(!button)
    return;



    if(button.disabled)
    return;





    if(
    button.classList.contains(
    "approveBtn"
    )
    ||
    button.classList.contains(
    "rejectBtn"
    )
    ){



        button.classList.add(
        "clicked"
        );



    }



});









// ================================
// AUTO BUTTON EFFECT
// ================================

window.updateActionButton =
function(
button,
status
){



    if(!button)
    return;





    if(status==="approved"){


        setButtonSuccess(
        button,
        "Approved"
        );


    }







    if(status==="rejected"){


        setButtonReject(
        button,
        "Rejected"
        );


    }



};









// ================================
// DATABASE SAFE UPDATE
// ================================

async function safeUpdate(
path,
data
){


    try{


        await update(
        ref(db,path),
        data
        );


        return true;



    }catch(error){



        console.error(
        "Firebase Error:",
        error
        );



        alert(
        "Database error"
        );



        return false;



    }



}









// ================================
// ADMIN SESSION CHECK
// ================================

function checkAdminSession(){


    if(!currentAdmin){


        alert(
        "Admin session expired"
        );


        return false;

    }



    return true;


}









// ================================
// GLOBAL ERROR HANDLER
// ================================

window.addEventListener(
"error",
(error)=>{


    console.error(
    "Money Vault Admin Error:",
    error.error
    );


});









// ================================
// FINAL READY CHECK
// ================================

setTimeout(()=>{


    if(checkAdminSession()){


        console.log(
        "Admin security check OK"
        );


    }



},2000);









console.log(
"Money Vault Admin Part 11 Loaded"
);


// ======================================
// ADMIN.JS - PART 12
// FINAL VERIFICATION + CLEANUP SYSTEM
// MONEY VAULT ADMIN PANEL
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



    console.log(
    "Firebase connection OK"
    );


    return true;


}









// ================================
// CHECK REQUIRED FUNCTIONS
// ================================

function checkAdminFunctions(){



    const functions = [


        "loadDashboardFinal",

        "loadDeposits",

        "loadWithdraws",

        "loadVipRequests",

        "loadBonusRequests",

        "loadUsers",

        "loadTransactions"


    ];







    functions.forEach(
    (name)=>{



        try{



            if(
            typeof window[name] !== "function"
            &&
            typeof eval(name) !== "function"
            ){


                console.warn(
                "Missing function:",
                name
                );


            }



        }catch(error){


            console.warn(
            "Function check error:",
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
// FORMAT MONEY
// ================================

function formatMoney(value){


    return Number(
    value || 0
    )
    .toLocaleString()
    +" RWF";


}









// ================================
// FINAL ADMIN START CHECK
// ================================

setTimeout(()=>{



    if(
    checkFirebaseConnection()
    ){



        checkAdminFunctions();



        console.log(
        "Money Vault Admin Verification Completed"
        );



    }



},3000);









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
// FINAL MESSAGE
// ================================

console.log(
"================================="
);


console.log(
"Money Vault Admin Panel Ready"
);


console.log(
"All Systems Loaded Successfully"
);


console.log(
"================================="
);
