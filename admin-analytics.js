// ======================================
// ADMIN VIP ANALYTICS - PART 10
// MONEY VAULT PRO
// ======================================


import { db } from "./firebase.js";


import {

    ref,
    onValue

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";




// ======================================
// ELEMENTS
// ======================================


const totalUsers =
document.getElementById("totalUsers");


const activeVip =
document.getElementById("activeVip");


const expiredVip =
document.getElementById("expiredVip");


const vipRevenue =
document.getElementById("vipRevenue");





// ======================================
// LOAD ANALYTICS
// ======================================


function loadAnalytics(){



const usersRef =
ref(db,"users");



onValue(usersRef,(snapshot)=>{



    let users = 0;

    let active = 0;

    let expired = 0;

    let revenue = 0;




    snapshot.forEach((user)=>{



        users++;



        const data =
        user.val();



        const plans =
        data.vipPlans || {};



        Object.values(plans)

        .forEach(plan=>{



            if(plan.status === "active"){


                active++;


            }



            if(plan.status === "expired"){


                expired++;


            }



            revenue +=

            Number(plan.price || 0);



        });



    });





    if(totalUsers)

    totalUsers.textContent =
    users;



    if(activeVip)

    activeVip.textContent =
    active;



    if(expiredVip)

    expiredVip.textContent =
    expired;



    if(vipRevenue)

    vipRevenue.textContent =

    revenue.toLocaleString()
    +" RWF";



});



}





loadAnalytics();



console.log(
"ADMIN ANALYTICS PART 10 READY"
);


