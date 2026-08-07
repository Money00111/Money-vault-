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
    get
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


   
