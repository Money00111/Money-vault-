// ======================================
// ADMIN VIP MANAGEMENT - PART 6
// MONEY VAULT PRO
// ======================================


// ======================================
// FIREBASE IMPORT
// ======================================

import { db } from "./firebase.js";


import {
    ref,
    set,
    update,
    remove,
    onValue,
    get
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";




// ======================================
// ELEMENTS
// ======================================

const vipAdminList =
document.getElementById("vipAdminList");


const addVipBtn =
document.getElementById("addVipBtn");




// ======================================
// LOAD VIP PLANS
// ======================================

function loadAdminVip(){


    const vipRef =
    ref(db,"vipPlans");



    onValue(vipRef,(snapshot)=>{


        if(!vipAdminList)
        return;



        vipAdminList.innerHTML = "";



        if(!snapshot.exists()){


            vipAdminList.innerHTML =

            "<p>No VIP Plans Found</p>";


            return;

        }




        snapshot.forEach((child)=>{


            const vip =
            child.val();


            const id =
            child.key;



            vipAdminList.innerHTML += `

           <div class="admin-vip-card" data-id="${id}">

            <div class="admin-vip-card">


                <h3>
                ${vip.name}
                </h3>


                <p>
                Price:
                ${Number(vip.price).toLocaleString()} RWF
                </p>


                <p>
                Daily Income:
                ${Number(vip.dailyIncome).toLocaleString()} RWF
                </p>


                <p>
                Duration:
                ${vip.duration} Days
                </p>


                <p>
                Status:
                ${vip.status ? "Active":"Disabled"}
                </p>



                <button
                onclick="toggleVip('${id}',${vip.status})">

                ${vip.status ? 
                "Disable":"Enable"}

                </button>



                <button
                onclick="deleteVip('${id}')">

                Delete

                </button>


            </div>


            `;



        });



    });



}





// ======================================
// ADD NEW VIP
// ======================================


addVipBtn?.addEventListener(
"click",
async()=>{


    const id =
    prompt("VIP ID (example vip11)");



    const name =
    prompt("VIP Name");



    const price =
    Number(prompt("VIP Price"));



    const daily =
    Number(prompt("Daily Income"));



    const days =
    Number(prompt("Duration Days"));



    if(!id) return;




    await set(

        ref(
            db,
            "vipPlans/"+id
        ),


        {


            name:name,

            price:price,

            dailyIncome:daily,

            duration:days,

            totalProfit:
            daily * days,

            status:true


        }

    );



    alert(
        "VIP Added Successfully"
    );


});






// ======================================
// ENABLE / DISABLE VIP
// ======================================


window.toggleVip = async function(
    id,
    status
){


    await update(

        ref(
            db,
            "vipPlans/"+id
        ),


        {

            status: !status

        }

    );


};






// ======================================
// DELETE VIP
// ======================================


window.deleteVip = async function(id){



    const ok =
    confirm(
        "Delete this VIP?"
    );



    if(!ok)
    return;



    await remove(

        ref(
            db,
            "vipPlans/"+id
        )

    );


};





// ======================================
// START
// ======================================

loadAdminVip();


console.log(
"ADMIN VIP PART 6 READY"
);

          // ======================================
// ADMIN VIP MANAGEMENT - PART 7
// EDIT VIP PLAN
// ======================================



// ======================================
// EDIT VIP FUNCTION
// ======================================

window.editVip = async function(id){


    const vipRef =
    ref(db,"vipPlans/"+id);



    const snapshot =
    await get(vipRef);



    if(!snapshot.exists()){

        alert("VIP not found");

        return;

    }



    const vip =
    snapshot.val();




    const name =

    prompt(
        "VIP Name:",
        vip.name
    );



    const price =

    Number(

        prompt(
            "VIP Price:",
            vip.price
        )

    );



    const daily =

    Number(

        prompt(
            "Daily Income:",
            vip.dailyIncome
        )

    );



    const duration =

    Number(

        prompt(
            "Duration Days:",
            vip.duration
        )

    );




    if(!name) return;




    await update(

        vipRef,

        {


            name:name,


            price:price,


            dailyIncome:daily,


            duration:duration,


            totalProfit:
            daily * duration


        }

    );



    alert(
        "VIP Updated Successfully"
    );


};






// ======================================
// ADD EDIT BUTTON TO CARDS
// ======================================


function addEditButton(){


    const buttons =

    document.querySelectorAll(
        ".admin-vip-card"
    );



    buttons.forEach(card=>{


        const id =
        card.dataset.id;



        card.innerHTML += `


        <button

        onclick="editVip('${id}')">

        Edit

        </button>


        `;


    });


}








console.log(
"ADMIN VIP PART 7 READY"
);
