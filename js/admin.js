// ======================================
// ADMIN.JS - PART 1
// FIREBASE + AUTH + GLOBAL SETUP CLEAN
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
    get
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
// AUTH + ADMIN CHECK
// ================================


onAuthStateChanged(auth, async(user)=>{


    try{


        if(!user){


            window.location.href =
            "login.html";


            return;

        }



        const adminSnap =
        await get(
            ref(db,"admins/"+user.uid)
        );



        if(!adminSnap.exists()){


            alert(
            "Access denied"
            );


            await signOut(auth);


            window.location.href =
            "login.html";


            return;

        }




        currentAdmin = user;



        const admin =
        adminSnap.val();




        if(adminName){


            adminName.textContent =
            admin.name || "Administrator";


        }



        if(adminEmail){


            adminEmail.textContent =
            user.email || "";


        }




        if(loadingScreen){


            loadingScreen.style.display =
            "none";


        }





        // START ONLY AFTER AUTH READY

        if(typeof loadDashboardFinal === "function"){


            loadDashboardFinal();


        }




    }catch(error){


        console.error(
        "Admin Auth Error:",
        error
        );


        alert(
        "System error"
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


        await signOut(auth);


        window.location.href =
        "login.html";


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
        page.charAt(0).toUpperCase()
        +
        page.slice(1);


    }



}






// ================================
// UPDATE TEXT HELPER
// ================================


function updateText(id,value){



    const element =
    document.getElementById(id);



    if(element){


        element.textContent =
        value;


    }


}






// ======================================
// ADMIN.JS - PART 2
// DASHBOARD SYSTEM CLEAN
// ======================================



// ================================
// LOAD DASHBOARD FINAL
// ================================

function loadDashboardFinal(){


    loadUsersCount();


    loadDepositStatistics();


    loadWithdrawStatistics();


    loadSystemBalance();


    loadRecentActivity();


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


function loadDepositStatistics(){


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


function loadSystemBalance(){


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



        box.innerHTML="";





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
item.type ||
"TRANSACTION"

).toUpperCase()}

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


// ======================================
// ADMIN.JS - PART 3
// DEPOSIT MANAGEMENT CLEAN
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

${Number(deposit.amount || 0)
.toLocaleString()} RWF

</p>




<p>
<strong>Method:</strong>
${deposit.method || "-"}
</p>





<div class="action-buttons"
id="depositActions-${id}">



${
status==="pending"

?

`

<button

class="approveBtn"

onclick="approveDeposit('${id}')">

<i class="fa-solid fa-check"></i>

Approve

</button>



<button

class="rejectBtn"

onclick="rejectDeposit('${id}')">

<i class="fa-solid fa-xmark"></i>

Reject

</button>

`

:

`

<p class="processed">

${status.toUpperCase()}

</p>

`

}



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



    const snap =
    await get(depositRef);



    if(!snap.exists())
    return;



    const deposit =
    snap.val();





    // BLOCK DOUBLE ACTION

    if(deposit.status !== "pending"){


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








    // UPDATE BALANCE ONCE

    await update(userRef,{


        balance:
        oldBalance + amount


    });








    // UPDATE STATUS

    await update(
    depositRef,
    {

        status:"approved",

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
    "Deposit Approved"
    );



};








// ================================
// REJECT DEPOSIT ONCE
// ================================


window.rejectDeposit = async function(id){



    const depositRef =
    ref(db,"depositRequests/"+id);



    const snap =
    await get(depositRef);



    if(!snap.exists())
    return;



    const deposit =
    snap.val();






    if(deposit.status !== "pending"){


        alert(
        "Deposit already processed"
        );


        return;


    }







    await update(

        depositRef,

        {

            status:"rejected",


            rejectedAt:
            Date.now()


        }

    );








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
    "Deposit Rejected"
    );



};








// ================================
// START DEPOSIT SYSTEM
// ================================


loadDeposits();


// ======================================
// ADMIN.JS - PART 4
// WITHDRAW MANAGEMENT CLEAN
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


${
status==="pending"

?

`

<button

class="approveBtn"

onclick="approveWithdraw('${id}')">

<i class="fa-solid fa-check"></i>

Approve

</button>




<button

class="rejectBtn"

onclick="rejectWithdraw('${id}')">

<i class="fa-solid fa-xmark"></i>

Reject

</button>

`

:

`

<p class="processed">

${status.toUpperCase()}

</p>

`

}



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



    const snap =
    await get(withdrawRef);



    if(!snap.exists())
    return;



    const withdraw =
    snap.val();





    // BLOCK DOUBLE APPROVE

    if(withdraw.status !== "pending"){


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








    if(balance < amount){


        alert(
        "Insufficient balance"
        );


        return;


    }









    // REMOVE MONEY ONCE

    await update(

        userRef,

        {

            balance:
            balance - amount


        }

    );









    // UPDATE STATUS

    await update(

        withdrawRef,

        {


            status:
            "approved",


            approvedAt:
            Date.now()


        }

    );









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
    "Withdraw Approved"
    );



};








// ================================
// REJECT WITHDRAW ONCE
// ================================


window.rejectWithdraw = async function(id){



    const withdrawRef =
    ref(db,"withdrawRequests/"+id);



    const snap =
    await get(withdrawRef);



    if(!snap.exists())
    return;



    const withdraw =
    snap.val();







    // BLOCK DOUBLE REJECT

    if(withdraw.status !== "pending"){


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


        }


    );








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
    "Withdraw Rejected"
    );



};








// ================================
// START WITHDRAW SYSTEM
// ================================


loadWithdraws();


// ======================================
// ADMIN.JS - PART 5
// VIP REQUEST + VIP BUYERS CLEAN
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


${
status==="pending"

?

`

<button

class="approveBtn"

onclick="approveVip('${id}')">

<i class="fa-solid fa-check"></i>

Approve

</button>




<button

class="rejectBtn"

onclick="rejectVip('${id}')">

<i class="fa-solid fa-xmark"></i>

Reject

</button>


`

:

`

<p class="processed">

${status.toUpperCase()}

</p>


`

}


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



    const snap =
    await get(vipRef);



    if(!snap.exists())
    return;



    const vip =
    snap.val();






    if(vip.status !== "pending"){


        alert(
        "VIP already processed"
        );


        return;


    }








    await update(

        vipRef,

        {


            status:
            "approved",


            approvedAt:
            Date.now()


        }

    );








    // SAVE BUYER RECORD

    await set(

        push(
        ref(db,"vipBuyers")
        ),


        {


            uid:
            vip.uid,


            name:
            vip.name || "",


            email:
            vip.email || "",


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
            vip.duration || 0,


            status:
            "active",


            date:
            Date.now()


        }


    );








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


            status:
            "approved",


            vipName:
            vip.vipName || "",


            reference:
            id,


            date:
            Date.now()


        }


    );







    alert(
    "VIP Approved"
    );


};









// ================================
// REJECT VIP ONCE
// ================================


window.rejectVip = async function(id){



    const vipRef =
    ref(db,"vipRequests/"+id);



    const snap =
    await get(vipRef);



    if(!snap.exists())
    return;



    const vip =
    snap.val();







    if(vip.status !== "pending"){


        alert(
        "VIP already processed"
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


        }


    );









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


            status:
            "rejected",


            vipName:
            vip.vipName || "",


            reference:
            id,


            date:
            Date.now()


        }


    );







    alert(
    "VIP Rejected"
    );


};








// ================================
// LOAD VIP BUYERS
// ================================


function loadVipBuyers(){



    const buyersRef =
    ref(db,"vipBuyers");



    onValue(buyersRef,(snapshot)=>{



        const list =
        document.getElementById(
        "vipBuyersList"
        );



        if(!list) return;



        list.innerHTML="";






        if(!snapshot.exists()){


            list.innerHTML =
            "<p>No VIP Buyers Found</p>";


            return;


        }







        Object.entries(snapshot.val())

        .reverse()

        .forEach(([id,buyer])=>{



            const card =
            document.createElement("div");



            card.className =
            "user-card";



            card.innerHTML = `


<h3>

${buyer.vipName || "VIP"}

</h3>



<p>

<strong>Name:</strong>

${buyer.name || "-"}

</p>



<p>

<strong>Email:</strong>

${buyer.email || "-"}

</p>



<p>

<strong>Price:</strong>

${Number(buyer.price || 0)
.toLocaleString()} RWF

</p>




<p>

<strong>Daily:</strong>

${Number(buyer.dailyIncome || 0)
.toLocaleString()} RWF

</p>




<p>

<strong>Duration:</strong>

${buyer.duration || 0} Days

</p>



<p>

<strong>Status:</strong>

${buyer.status || "-"}

</p>



`;



            list.appendChild(card);



        });



    });



}







// ================================
// START VIP SYSTEM
// ================================


loadVipRequests();

loadVipBuyers();

// ======================================
// ADMIN.JS - PART 6
// BONUS REQUEST MANAGEMENT CLEAN
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


${
status==="pending"

?

`

<button

class="approveBtn"

onclick="approveBonus('${id}')">


<i class="fa-solid fa-check"></i>

Approve

</button>




<button

class="rejectBtn"

onclick="rejectBonus('${id}')">


<i class="fa-solid fa-xmark"></i>

Reject

</button>


`

:

`

<p class="processed">

${status.toUpperCase()}

</p>


`

}


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



    const snap =
    await get(bonusRef);



    if(!snap.exists())
    return;



    const bonus =
    snap.val();






    // STOP DOUBLE APPROVE

    if(bonus.status !== "pending"){


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








    // ADD BONUS ONCE

    await update(

        userRef,

        {

            balance:
            oldBalance + amount

        }

    );








    // UPDATE STATUS

    await update(

        bonusRef,

        {


            status:
            "approved",


            approvedAt:
            Date.now()


        }


    );








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
    "Bonus Approved"
    );



};








// ================================
// REJECT BONUS ONCE
// ================================


window.rejectBonus = async function(id){



    const bonusRef =
    ref(db,"bonusRequests/"+id);



    const snap =
    await get(bonusRef);



    if(!snap.exists())
    return;



    const bonus =
    snap.val();







    if(bonus.status !== "pending"){


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


        }


    );









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
    "Bonus Rejected"
    );



};








// ================================
// START BONUS SYSTEM
// ================================


loadBonusRequests();



// ======================================
// ADMIN.JS - PART 6
// BONUS REQUEST MANAGEMENT CLEAN
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


${
status==="pending"

?

`

<button

class="approveBtn"

onclick="approveBonus('${id}')">


<i class="fa-solid fa-check"></i>

Approve

</button>




<button

class="rejectBtn"

onclick="rejectBonus('${id}')">


<i class="fa-solid fa-xmark"></i>

Reject

</button>


`

:

`

<p class="processed">

${status.toUpperCase()}

</p>


`

}


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



    const snap =
    await get(bonusRef);



    if(!snap.exists())
    return;



    const bonus =
    snap.val();






    // STOP DOUBLE APPROVE

    if(bonus.status !== "pending"){


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








    // ADD BONUS ONCE

    await update(

        userRef,

        {

            balance:
            oldBalance + amount

        }

    );








    // UPDATE STATUS

    await update(

        bonusRef,

        {


            status:
            "approved",


            approvedAt:
            Date.now()


        }


    );








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
    "Bonus Approved"
    );



};








// ================================
// REJECT BONUS ONCE
// ================================


window.rejectBonus = async function(id){



    const bonusRef =
    ref(db,"bonusRequests/"+id);



    const snap =
    await get(bonusRef);



    if(!snap.exists())
    return;



    const bonus =
    snap.val();







    if(bonus.status !== "pending"){


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


        }


    );









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
    "Bonus Rejected"
    );



};








// ================================
// START BONUS SYSTEM
// ================================


loadBonusRequests();


// ======================================
// ADMIN.JS - PART 7
// USERS MANAGEMENT CLEAN
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
// VIEW USER DETAILS
// ================================


window.viewUser = async function(uid){



    const userRef =
    ref(db,"users/"+uid);



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
${Number(user.balance || 0)
.toLocaleString()} RWF


VIP:
${user.vip || "None"}


Status:
${user.status || "active"}

`);




};








// ================================
// DELETE USER SAFELY
// ================================


window.deleteUser = async function(uid){



    const confirmDelete =
    confirm(
    "Delete this user?"
    );



    if(!confirmDelete)
    return;






    try{


        await remove(

            ref(db,"users/"+uid)

        );



        alert(
        "User deleted successfully"
        );



    }catch(error){



        console.error(
        "Delete error:",
        error
        );



        alert(
        "Failed to delete user"
        );


    }



};









// ================================
// USER SEARCH
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
        ".user-card"
        )

        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();





            if(text.includes(value)){


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
// START USERS SYSTEM
// ================================


loadUsers();



// ======================================
// ADMIN.JS - PART 8
// TRANSACTIONS MANAGEMENT CLEAN
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

).toUpperCase()}

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
// TRANSACTION SEARCH
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
        ".transaction-card"
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
        ".transaction-card"
        )

        .forEach(card=>{



            const text =
            card.innerText
            .toLowerCase();







            if(
            value==="all"
            ||
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
// START TRANSACTIONS SYSTEM
// ================================


loadTransactions();


// ======================================
// ADMIN.JS - PART 9
// SETTINGS + QUICK ACTIONS CLEAN
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







        if(adminName){


            adminName.textContent =
            name || "Administrator";


        }







        alert(
        "Settings Saved"
        );



    });


}









// ================================
// LOAD ADMIN SETTINGS
// ================================


function loadAdminSettings(){



    if(!currentAdmin)
    return;






    onValue(

        ref(
        db,
        "admins/"+currentAdmin.uid
        ),

        (snapshot)=>{



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





        }


    );



}









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






        console.log(
        "Dashboard refreshed"
        );



    });


}









// ================================
// QUICK OPEN FUNCTION
// ================================


function quickOpen(
buttonId,
page
){



    const button =
    document.getElementById(
    buttonId
    );



    if(button){



        button.addEventListener(
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
// LOAD SETTINGS AFTER LOGIN
// ================================


setTimeout(()=>{


    loadAdminSettings();


},1000);









// ================================
// SESSION CHECK
// ================================


function checkAdminSession(){



    if(!currentAdmin){


        console.warn(
        "Admin session missing"
        );


        return false;


    }



    return true;



}


// ======================================
// ADMIN.JS - PART 10
// FINAL CLEANUP + SECURITY
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
// PREVENT DOUBLE ACTION CLICK
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




    if(
    button.classList.contains(
    "approveBtn"
    )
    ||
    button.classList.contains(
    "rejectBtn"
    )
    ){



        if(button.dataset.clicked==="true"){

            event.preventDefault();

            return;

        }






        button.dataset.clicked =
        "true";





        setTimeout(()=>{


            button.dataset.clicked =
            "false";



        },2000);



    }



});









// ================================
// SAFE DATABASE UPDATE
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
        "Database Update Error:",
        error
        );



        alert(
        "Database error"
        );



        return false;


    }


}









// ================================
// FIREBASE CONNECTION CHECK
// ================================


function checkFirebase(){



    if(!db){



        console.error(
        "Firebase not connected"
        );



        return false;


    }



    return true;



}









// ================================
// REQUIRED FUNCTIONS CHECK
// ================================


function verifyAdminSystem(){



    const functions = [


        "loadDashboardFinal",

        "loadDeposits",

        "loadWithdraws",

        "loadVipRequests",

        "loadVipBuyers",

        "loadBonusRequests",

        "loadUsers",

        "loadTransactions"


    ];






    functions.forEach(
    (name)=>{



        if(
        typeof window[name] !== "function"
        &&
        typeof eval(name) !== "function"
        ){



            console.warn(
            "Missing:",
            name
            );



        }



    });



}









// ================================
// MONEY FORMAT HELPER
// ================================


function formatMoney(
value
){


    return Number(
    value || 0
    )
    .toLocaleString()
    +
    " RWF";


}









// ================================
// FINAL SYSTEM CHECK
// ================================


setTimeout(()=>{



    if(checkFirebase()){



        verifyAdminSystem();



        console.log(
        "Money Vault Admin Panel Ready"
        );



    }



},2000);



// ======================================
// ADMIN.JS CLEAN VERSION COMPLETE
// ======================================



