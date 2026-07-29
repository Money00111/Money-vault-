// ======================================
// VIP PROFIT ENGINE - PART 11
// MONEY VAULT PRO
// ======================================


import { db } from "./firebase.js";


import {

    ref,
    get,
    update,
    push,
    set

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";




// ======================================
// AUTO DAILY PROFIT
// ======================================


export async function generateDailyProfit(uid){



    if(!uid)
    return;



    const userRef =
    ref(db,"users/"+uid);



    const snapshot =
    await get(userRef);



    if(!snapshot.exists())
    return;



    const user =
    snapshot.val();



    const vipPlans =
    user.vipPlans || {};



    let totalIncome = 0;



    const updates = {};



    Object.entries(vipPlans)

    .forEach(([id,plan])=>{



        if(plan.status !== "active")
        return;



        const lastProfit =
        Number(plan.lastProfit || 0);



        const now =
        Date.now();



        const day =
        24 * 60 * 60 * 1000;



        // Check 24 hours


        if(

            lastProfit !== 0 &&

            (now-lastProfit)<day

        ){

            return;

        }




        totalIncome +=

        Number(plan.dailyIncome || 0);





        updates[

        "vipPlans/"+id+"/lastProfit"

        ]

        = now;



    });





    if(totalIncome <= 0)
    return;




    const newBalance =

    Number(user.balance || 0)

    + totalIncome;




    await update(

        userRef,

        {

            balance:newBalance


        }

    );





    // SAVE PROFIT HISTORY


    const historyRef =

    push(

        ref(

        db,

        "profitHistory/"+uid

        )

    );




    await set(

        historyRef,

        {


            type:"VIP Daily Profit",


            amount:totalIncome,


            createdAt:Date.now()



        }

    );



    console.log(

    "Daily Profit Added:",

    totalIncome

    );



}
