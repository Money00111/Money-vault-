// ======================================
// REFERRAL SYSTEM PART 7
// Money Vault
// ======================================


import { auth, db } from "./firebase.js";


import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


const referralCode =
document.getElementById("referralCode");


const referralLink =
document.getElementById("referralLink");


const referralCount =
document.getElementById("referralCount");


const referralEarnings =
document.getElementById("referralEarnings");


const copyBtn =
document.getElementById("copyReferralBtn");



let currentUser = null;



auth.onAuthStateChanged((user)=>{


    if(!user){

        return;

    }


    currentUser = user;


    loadReferralData();


});




// LOAD REFERRAL DATA

function loadReferralData(){


    const userRef =
    ref(db,"users/"+currentUser.uid);



    onValue(userRef,(snapshot)=>{


        if(!snapshot.exists())
        return;



        const user =
        snapshot.val();



        const code =
        user.referralCode || currentUser.uid.substring(0,8);



        referralCode.textContent =
        code;



        referralLink.value =
        window.location.origin +
        "/register.html?ref=" +
        code;



        const count =
        user.referrals
        ?
        Object.keys(user.referrals).length
        :
        0;



        referralCount.textContent =
        count;



        referralEarnings.textContent =
        Number(
        user.referralEarnings || 0
        )
        .toLocaleString()
        +
        " RWF";



    });


}




// COPY LINK

copyBtn?.addEventListener("click",()=>{


    navigator.clipboard.writeText(
        referralLink.value
    );


    alert(
        "Referral link copied"
    );


});
