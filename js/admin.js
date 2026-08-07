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


// ======================================
// LOAD DEPOSITS
// ======================================

function loadDeposits(){


    const list =
    document.getElementById("depositList");


    const empty =
    document.getElementById("emptyDeposit");


    if(!list) return;



    onValue(
        ref(db,"depositRequests"),
        (snapshot)=>{


            list.innerHTML="";



            if(!snapshot.exists()){


                if(empty)
                empty.style.display="block";


                return;

            }




            if(empty)
            empty.style.display="none";





            Object.entries(snapshot.val())
            .reverse()
            .forEach(([id,deposit])=>{



                const status =
                deposit.status || "pending";



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
<strong>Phone:</strong>
${deposit.phone || "-"}
</p>



<p>
<strong>Amount:</strong>
${formatMoney(deposit.amount)}
</p>



<p>
<strong>Payment Method:</strong>
${deposit.method || "-"}
</p>



<p>
<strong>Transaction ID:</strong>
${deposit.transactionId || "-"}
</p>



<p>
<strong>Date:</strong>
${
deposit.date
?
new Date(deposit.date)
.toLocaleString()
:
"-"
}
</p>



<p>
<strong>Note:</strong>
${deposit.note || "-"}
</p>





<div class="action-buttons">


<button
class="approveBtn"

${status !== "pending" ? "disabled":""}

onclick="approveDeposit('${id}')">

<i class="fa-solid fa-circle-check"></i>

Approve

</button>





<button
class="rejectBtn"

${status !== "pending" ? "disabled":""}

onclick="rejectDeposit('${id}')">

<i class="fa-solid fa-circle-xmark"></i>

Reject

</button>


</div>



`;





                list.appendChild(card);



            });



        }

    );


}









// ======================================
// APPROVE DEPOSIT ONE TIME
// ======================================


window.approveDeposit =
async function(id){



    const depositRef =
    ref(db,"depositRequests/"+id);




    const snapshot =
    await get(depositRef);





    if(!snapshot.exists()) return;





    const deposit =
    snapshot.val();






    // STOP DOUBLE APPROVE

    if(deposit.status !== "pending"){


        alert(
        "This deposit was already processed"
        );


        return;

    }








    const userRef =
    ref(db,"users/"+deposit.uid);





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
    Number(deposit.amount || 0);








    // ADD MONEY ONCE

    await update(
        userRef,
        {

        balance:
        oldBalance + amount

        }
    );








    // CHANGE STATUS

    await update(
        depositRef,
        {

        status:"approved",

        approvedAt:
        Date.now()

        }
    );







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


        }
    );







    alert(
    "Deposit Approved Successfully"
    );


};









// ======================================
// REJECT DEPOSIT ONE TIME
// ======================================


window.rejectDeposit =
async function(id){



    const depositRef =
    ref(db,"depositRequests/"+id);




    const snapshot =
    await get(depositRef);





    if(!snapshot.exists())
    return;





    const deposit =
    snapshot.val();






    // STOP DOUBLE REJECT

    if(deposit.status !== "pending"){


        alert(
        "This deposit was already processed"
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








    // SAVE REJECT HISTORY

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


};









// ======================================
// SEARCH DEPOSITS
// ======================================


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
.querySelectorAll("#depositList .request-card")
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









// ======================================
// FILTER DEPOSITS
// ======================================


const depositFilter =
document.getElementById(
"depositFilter"
);



if(depositFilter){



depositFilter.addEventListener(
"change",
()=>{


const value =
depositFilter.value;



document
.querySelectorAll("#depositList .request-card")
.forEach(card=>{


const status =
card.querySelector(".status")
.innerText
.toLowerCase();



if(
value==="all" ||
status===value
){


card.style.display="block";


}else{


card.style.display="none";


}



});



});


}









// ======================================
// START DEPOSIT SYSTEM
// ======================================


window.loadDeposits =
loadDeposits;


console.log(
"Admin Part 3 Deposit Ready"
);

    
