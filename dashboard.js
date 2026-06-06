import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const usersRef = ref(db, "users");

onValue(usersRef, (snapshot) => {
    const data = snapshot.val();

    console.log(data);

    if (!data) return;

    const firstUser = Object.values(data)[0];

    const balanceEl = document.getElementById("balanceValue");

    if (balanceEl) {
        balanceEl.textContent = `${firstUser.balance || 0} RWF`;
    }
});
