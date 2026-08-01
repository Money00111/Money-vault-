// ======================================
// NOTIFICATIONS.JS - PART 12
// LOAD USER NOTIFICATIONS
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const notificationList =
document.getElementById("notificationList");

const notificationCount =
document.getElementById("notificationCount");

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadNotifications(user.uid);

});

function loadNotifications(uid) {

    const notifyRef =
    ref(db, "notifications/" + uid);

    onValue(notifyRef, (snapshot) => {

        notificationList.innerHTML = "";

        let count = 0;

        if (!snapshot.exists()) {

            notificationList.innerHTML = `

            <div class="empty-card">

                No Notifications

            </div>

            `;

            notificationCount.textContent = "0";

            return;

        }

        const notifications = [];

        snapshot.forEach((child) => {

            notifications.push(child.val());

        });

        notifications.sort((a, b) =>
            (b.createdAt || 0) - (a.createdAt || 0)
        );

        notifications.forEach((item) => {

            count++;

            notificationList.innerHTML += `

            <div class="notification-card">

                <h3>${item.title}</h3>

                <p>${item.message}</p>

                <small>

                    ${new Date(item.createdAt).toLocaleString()}

                </small>

            </div>

            `;

        });

        notificationCount.textContent = count;

    });

}

console.log("Notifications Loaded Successfully");

