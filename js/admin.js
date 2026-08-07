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

