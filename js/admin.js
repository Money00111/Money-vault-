// ======================================
// ADMIN.JS - PART 1
// FIREBASE + AUTH + GLOBAL SETUP
// MONEY VAULT ADMIN PANEL CLEAN VERSION
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
    update,
    set,
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



    try{


        const adminSnap =
        await get(
            ref(
                db,
                "admins/"+user.uid
            )
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



        currentAdmin = user;



        const adminData =
        adminSnap.val();




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
            "Admin Login Successful"
        );



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


    logoutBtn.onclick =
    async()=>{


        try{


            await signOut(auth);


            window.location.href =
            "login.html";


        }catch(error){


            console.error(error);


        }


    };


}







// ================================
// MOBILE SIDEBAR
// ================================

if(menuBtn && sidebar){


    menuBtn.onclick = ()=>{


        sidebar.classList.toggle(
            "active"
        );


    };


}








// ================================
// PAGE NAVIGATION
// ================================

menuLinks.forEach(link=>{


    link.onclick = (e)=>{


        e.preventDefault();



        const page =
        link.dataset.page;



        openPage(page);



    };


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
// HELPERS
// ================================

function updateText(id,value){


    const element =
    document.getElementById(id);



    if(element){

        element.textContent =
        value;

    }


}





function formatMoney(value){


    return Number(
        value || 0
    )
    .toLocaleString()
    +" RWF";


}





console.log(
"Money Vault Admin CLEAN Part 1 Loaded"
);

