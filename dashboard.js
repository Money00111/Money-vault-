import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// aho data iri muri Realtime Database
const usersRef = ref(db, "users");

// gufata data realtime
onValue(usersRef, (snapshot) => {
    const data = snapshot.val();let html = "";
<input type="number" id="amount" placeholder="Amount">

<button onclick="deposit()">Deposit</button>

<button onclick="withdraw()">Withdraw</button>
    for (let id in data) {
        html += `
            <div class="card">
                <h3>${data[id].name}</h3>
                <p>${data[id].email}</p>
                <b>Balance: ${data[id].balance} FRW</b>
            </div>
        `;
    }

    document.getElementById("dashboard").innerHTML = html;
});
