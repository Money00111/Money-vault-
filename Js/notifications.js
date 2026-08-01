// ======================================
// NOTIFICATIONS.JS - PART 11B
// Money Vault User Notifications
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// ELEMENTS
// ======================================

const notificationList =
document.getElementById("notificationList");

const notificationCount =
document.getElementById("notificationCount");


// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user)=>{

    if(!user){

        window.location.href="login.html";
        return;

    }


    loadNotifications(user.uid);


});


// ======================================
// LOAD NOTIFICATIONS
// ======================================

function loadNotifications(uid){


    const notifyRef =
    ref(db,"notifications/"+uid);


    onValue(notifyRef,(snapshot)=>{


        notificationList.innerHTML="";


        let count = 0;


        if(!snapshot.exists()){


            notificationList.innerHTML=`

            <div class="empty-card">

                No Notifications

            </div>

            `;


            notificationCount.textContent="0";

            return;

        }



        snapshot.forEach((child)=>{


            const data = child.val();


            count++;



            notificationList.innerHTML += `


            <div class="notification-card">


                <h3>

                    ${data.title || "Notification"}

                </h3>


                <p>

                    ${data.message || ""}

                </p>


                <small>

                    ${new Date(data.createdAt)
                    .toLocaleString()}

                </small>


            </div>


            `;


        });



        notificationCount.textContent =
        count;



    });


}

console.log("Notifications Loaded Successfully");
