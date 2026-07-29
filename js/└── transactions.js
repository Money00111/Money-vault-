// ======================================
// TRANSACTION HISTORY - PART 12
// MONEY VAULT PRO
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
// ELEMENT
// ======================================


const transactionList =

document.getElementById(
"transactionList"
);





// ======================================
// AUTH CHECK
// ======================================


onAuthStateChanged(auth,(user)=>{


    if(!user){


        location.href =
        "login.html";


        return;

    }



    loadTransactions(user.uid);


});






// ======================================
// LOAD TRANSACTIONS
// ======================================


function loadTransactions(uid){



const txRef =

ref(

db,

"transactions/"+uid

);




onValue(txRef,(snapshot)=>{



    transactionList.innerHTML="";




    if(!snapshot.exists()){


        transactionList.innerHTML =

        `

        <p>
        No transactions found
        </p>

        `;


        return;

    }






    snapshot.forEach((child)=>{



        const tx =
        child.val();




        const date =

        new Date(

        tx.createdAt

        )

        .toLocaleString();





        transactionList.innerHTML +=

        `


        <div class="transaction-card">


            <h3>

            ${tx.type}

            </h3>



            <p>

            Amount:

            <b>
            ${Number(tx.amount)
            .toLocaleString()}
            RWF
            </b>

            </p>



            <p>

            Status:

            ${tx.status}

            </p>



            <small>

            ${date}

            </small>


        </div>



        `;



    });



});



}




console.log(
"TRANSACTION PART 12 READY"
);
