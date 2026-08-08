

// ======================================
// ADMIN.JS - PART 6
// VIP BUYERS
// LIST + USER PROFILE + VIP DETAILS
// ======================================

// ======================================
// LOAD VIP BUYERS
// ======================================

function loadVipBuyers(){

const list =
    document.getElementById("vipBuyerList");

const empty =
    document.getElementById("emptyVipBuyer");


if(!list){

    console.error(
        "vipBuyerList not found"
    );

    return;
}


const usersRef =
    ref(db,"users");


onValue(
    usersRef,
    async(snapshot)=>{

        list.innerHTML = "";


        if(!snapshot.exists()){

            if(empty){
                empty.style.display = "block";
            }

            updateText(
                "vipBuyerTotalCount",
                0
            );

            updateText(
                "vipBuyerActiveCount",
                0
            );

            updateText(
                "vipBuyerExpiredCount",
                0
            );

            return;
        }


        const users =
            Object.entries(
                snapshot.val()
            );


        let buyers = [];

        let active = 0;

        let expired = 0;


        // ==================================
        // FIND USERS WITH VIP
        // ==================================

        users.forEach(
            ([uid,user])=>{

                if(!user) return;


                /*
                 * Supported VIP structures:
                 *
                 * user.vip
                 * user.vipPlan
                 * user.vipData
                 * user.vipPurchases
                 * user.vips
                 */

                let vipData =
                    user.vip ||
                    user.vipPlan ||
                    user.vipData ||
                    null;


                // ==============================
                // ARRAY / OBJECT VIP PURCHASES
                // ==============================

                if(
                    !vipData &&
                    user.vipPurchases
                ){

                    const purchases =
                        user.vipPurchases;


                    if(
                        typeof purchases ===
                        "object"
                    ){

                        const entries =
                            Object.values(
                                purchases
                            );


                        if(entries.length){

                            vipData =
                                entries[
                                    entries.length - 1
                                ];

                        }

                    }

                }


                if(
                    !vipData &&
                    user.vips
                ){

                    const purchases =
                        user.vips;


                    if(
                        typeof purchases ===
                        "object"
                    ){

                        const entries =
                            Object.values(
                                purchases
                            );


                        if(entries.length){

                            vipData =
                                entries[
                                    entries.length - 1
                                ];

                        }

                    }

                }


                // ==================================
                // CHECK VIP
                // ==================================

                if(
                    !vipData ||
                    typeof vipData !== "object"
                ){

                    return;

                }


                const status =
                    String(
                        vipData.status ||
                        "active"
                    ).toLowerCase();


                const duration =
                    Number(
                        vipData.duration ||
                        vipData.days ||
                        0
                    );


                const startDate =
                    Number(
                        vipData.startDate ||
                        vipData.startedAt ||
                        vipData.approvedAt ||
                        vipData.createdAt ||
                        0
                    );


                let isExpired = false;


                if(
                    duration > 0 &&
                    startDate > 0
                ){

                    const durationMs =
                        duration *
                        24 *
                        60 *
                        60 *
                        1000;


                    isExpired =
                        Date.now() >
                        startDate +
                        durationMs;

                }


                if(
                    status === "expired" ||
                    isExpired
                ){

                    expired++;

                }
                else{

                    active++;

                }


                buyers.push({

                    uid,
                    user,
                    vip: vipData,
                    expired:
                        isExpired ||
                        status === "expired"

                });

            }
        );


        // ==================================
        // COUNTERS
        // ==================================

        updateText(
            "vipBuyerTotalCount",
            buyers.length
        );


        updateText(
            "vipBuyerActiveCount",
            active
        );


        updateText(
            "vipBuyerExpiredCount",
            expired
        );


        // ==================================
        // NO BUYERS
        // ==================================

        if(!buyers.length){

            if(empty){
                empty.style.display = "block";
            }

            return;

        }


        if(empty){
            empty.style.display = "none";
        }


        // ==================================
        // RENDER BUYERS
        // ==================================

        buyers
        .reverse()
        .forEach(
            ({uid,user,vip,expired})=>{

                const name =
                    user.fullName ||
                    user.name ||
                    user.username ||
                    vip.fullName ||
                    vip.name ||
                    "Unknown User";


                const email =
                    user.email ||
                    vip.email ||
                    "-";


                const phone =
                    user.phone ||
                    user.phoneNumber ||
                    vip.phone ||
                    "-";


                const vipName =
                    vip.vipName ||
                    vip.planName ||
                    vip.name ||
                    vip.plan ||
                    "VIP Plan";


                const price =
                    Number(
                        vip.price ||
                        vip.vipPrice ||
                        vip.amount ||
                        0
                    );


                const dailyIncome =
                    Number(
                        vip.dailyIncome ||
                        vip.daily ||
                        0
                    );


                const duration =
                    Number(
                        vip.duration ||
                        vip.days ||
                        0
                    );


                const totalProfit =
                    Number(
                        vip.totalProfit ||
                        vip.profit ||
                        0
                    );


                const startDate =
                    vip.startDate ||
                    vip.startedAt ||
                    vip.approvedAt ||
                    vip.createdAt ||
                    "-";


                const status =
                    expired
                    ? "expired"
                    : (
                        vip.status ||
                        "active"
                    );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.innerHTML = `

                    <div class="request-top">

                        <h3>

                            <i class="fa-solid fa-crown"></i>

                            VIP Buyer

                        </h3>

                        <span
                            class="status ${escapeHTML(
                                String(status).toLowerCase()
                            )}">

                            ${escapeHTML(
                                String(status)
                            )}

                        </span>

                    </div>


                    <div class="user-profile-box">

                        <h4>

                            <i class="fa-solid fa-user"></i>

                            User Information

                        </h4>


                        <p>

                            <strong>Name:</strong>

                            ${escapeHTML(name)}

                        </p>


                        <p>

                            <strong>Email:</strong>

                            ${escapeHTML(email)}

                        </p>


                        <p>

                            <strong>Phone:</strong>

                            ${escapeHTML(phone)}

                        </p>


                        <p>

                            <strong>User ID:</strong>

                            ${escapeHTML(uid)}

                        </p>

                    </div>


                    <div class="withdraw-info">

                        <p>

                            <strong>VIP Plan:</strong>

                            ${escapeHTML(vipName)}

                        </p>


                        <p>

                            <strong>Price:</strong>

                            ${price.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Daily Income:</strong>

                            ${dailyIncome.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Duration:</strong>

                            ${duration} Days

                        </p>


                        <p>

                            <strong>Total Profit:</strong>

                            ${totalProfit.toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>Start Date:</strong>

                            ${escapeHTML(
                                String(startDate)
                            )}

                        </p>

                    </div>

                `;


                list.appendChild(card);

            }
        );


        console.log(
            "VIP Buyers loaded:",
            buyers.length
        );

    },

    (error)=>{

        console.error(
            "VIP Buyers listener error:",
            error
        );

    }

);

}

// ======================================
// EXPORT
// ======================================

window.loadVipBuyers =
loadVipBuyers;

// ======================================
// START VIP BUYERS
// ======================================

if(
window.adminState &&
window.adminState.ready
){

loadVipBuyers();

}

console.log(
"Admin Part 6 VIP Buyers Ready"
);

       // ======================================
// ADMIN.JS - PART 7
// VIP REQUESTS + VIP BUYERS
// PHOTO + PROFILE + APPROVE + REJECT
// ======================================


// ======================================
// VIP DATA HELPERS
// ======================================

function vipNumber(...values){

    for(const value of values){

        const number = Number(value);

        if(
            Number.isFinite(number) &&
            number > 0
        ){

            return number;

        }

    }

    return 0;

}



// ======================================
// SAFE DATE
// ======================================

function formatVipDate(value){

    if(!value){

        return "-";

    }

    try{

        const date = new Date(value);

        if(
            !Number.isNaN(
                date.getTime()
            )
        ){

            return date.toLocaleString();

        }

    }
    catch(error){

        console.error(
            "VIP date error:",
            error
        );

    }

    return String(value);

}



// ======================================
// VIP PHOTO
// ======================================

function getVipPhoto(vip,userData){

    return (
        vip.photoURL ||
        vip.photoUrl ||
        vip.photo ||
        vip.profilePhoto ||
        vip.avatar ||
        userData.photoURL ||
        userData.photoUrl ||
        userData.photo ||
        userData.profilePhoto ||
        userData.avatar ||
        ""
    );

}



// ======================================
// LOAD VIP REQUESTS
// ======================================

function loadVipRequests(){

    const list =
        document.getElementById(
            "vipRequestList"
        );


    const empty =
        document.getElementById(
            "emptyVipRequest"
        );


    if(!list){

        console.error(
            "VIP request list not found: #vipRequestList"
        );

        return;

    }


    const vipRef =
        ref(
            db,
            "vipPurchaseRequests"
        );


    onValue(
        vipRef,
        async(snapshot)=>{

            try{

                list.innerHTML = "";


                // ==================================
                // NO DATA
                // ==================================

                if(!snapshot.exists()){

                    if(empty){

                        empty.style.display =
                            "block";

                    }

                    updateText(
                        "vipTotalCount",
                        0
                    );

                    updateText(
                        "vipPendingCount",
                        0
                    );

                    updateText(
                        "vipApprovedCount",
                        0
                    );

                    updateText(
                        "vipRejectedCount",
                        0
                    );

                    return;

                }


                if(empty){

                    empty.style.display =
                        "none";

                }


                const requests =
                    Object.entries(
                        snapshot.val()
                    ).reverse();



                // ==================================
                // COUNTERS
                // ==================================

                let total = 0;

                let pending = 0;

                let approved = 0;

                let rejected = 0;



                requests.forEach(
                    ([id,request])=>{

                        total++;


                        const status =
                            String(
                                request?.status ||
                                "pending"
                            )
                            .toLowerCase();


                        if(status === "pending"){

                            pending++;

                        }

                        else if(
                            status === "approved"
                        ){

                            approved++;

                        }

                        else if(
                            status === "rejected"
                        ){

                            rejected++;

                        }

                    }
                );



                updateText(
                    "vipTotalCount",
                    total
                );


                updateText(
                    "vipPendingCount",
                    pending
                );


                updateText(
                    "vipApprovedCount",
                    approved
                );


                updateText(
                    "vipRejectedCount",
                    rejected
                );



                // ==================================
                // RENDER
                // ==================================

                for(
                    const [id,rawRequest]
                    of requests
                ){

                    const vip =
                        rawRequest || {};


                    // ==============================
                    // UID
                    // ==============================

                    const uid =
                        vip.uid ||
                        vip.userId ||
                        vip.userUID ||
                        "";



                    // ==============================
                    // USER PROFILE
                    // ==============================

                    let userData = {};


                    if(uid){

                        try{

                            const userSnap =
                                await get(
                                    ref(
                                        db,
                                        "users/" + uid
                                    )
                                );


                            if(
                                userSnap.exists()
                            ){

                                userData =
                                    userSnap.val() || {};

                            }

                        }
                        catch(error){

                            console.error(
                                "VIP user error:",
                                error
                            );

                        }

                    }



                    // ==============================
                    // USER DETAILS
                    // ==============================

                    const name =
                        vip.fullName ||
                        vip.name ||
                        vip.username ||
                        userData.fullName ||
                        userData.name ||
                        userData.username ||
                        "Unknown User";


                    const email =
                        vip.email ||
                        userData.email ||
                        "-";


                    const phone =
                        vip.phone ||
                        vip.phoneNumber ||
                        userData.phone ||
                        userData.phoneNumber ||
                        "-";


                    const photo =
                        getVipPhoto(
                            vip,
                            userData
                        );



                    // ==============================
                    // VIP DETAILS
                    // ==============================

                    const vipName =
                        vip.vipName ||
                        vip.planName ||
                        vip.namePlan ||
                        vip.plan ||
                        vip.vip ||
                        "VIP Plan";


                    const price =
                        vipNumber(
                            vip.price,
                            vip.vipPrice,
                            vip.amount
                        );


                    const dailyIncome =
                        vipNumber(
                            vip.dailyIncome,
                            vip.daily,
                            vip.dailyProfit
                        );


                    const duration =
                        vipNumber(
                            vip.duration,
                            vip.days,
                            vip.durationDays
                        );


                    const totalProfit =
                        vipNumber(
                            vip.totalProfit,
                            vip.profit,
                            vip.total
                        );


                    const date =
                        vip.createdAt ||
                        vip.requestDate ||
                        vip.date ||
                        vip.timestamp ||
                        "-";


                    const status =
                        String(
                            vip.status ||
                            "pending"
                        )
                        .toLowerCase();



                    // ==============================
                    // PHOTO HTML
                    // ==============================

                    let photoHTML;


                    if(photo){

                        photoHTML = `

                            <img
                                src="${escapeHTML(photo)}"
                                alt="User Photo"
                                class="vip-user-photo"
                                onerror="
                                    this.style.display='none';
                                    this.nextElementSibling.style.display='flex';
                                "
                            >

                            <div
                                class="vip-user-avatar"
                                style="display:none;"
                            >

                                <i class="fa-solid fa-user"></i>

                            </div>

                        `;

                    }
                    else{

                        photoHTML = `

                            <div class="vip-user-avatar">

                                <i class="fa-solid fa-user"></i>

                            </div>

                        `;

                    }



                    // ==============================
                    // CARD
                    // ==============================

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "request-card vip-request-card";


                    card.dataset.vipId =
                        id;


                    card.innerHTML = `

                        <div class="request-top">

                            <h3>

                                <i class="fa-solid fa-crown"></i>

                                VIP Purchase

                            </h3>


                            <span
                                class="status ${escapeHTML(status)}"
                            >

                                ${escapeHTML(status)}

                            </span>

                        </div>



                        <!-- =====================
                             USER PROFILE
                        ====================== -->

                        <div class="user-profile-box vip-user-profile">

                            <div class="vip-profile-header">

                                <div class="vip-photo-wrapper">

                                    ${photoHTML}

                                </div>


                                <div class="vip-profile-name">

                                    <h4>

                                        ${escapeHTML(name)}

                                    </h4>


                                    <span>

                                        VIP Buyer

                                    </span>

                                </div>

                            </div>



                            <p>

                                <strong>
                                    Name:
                                </strong>

                                ${escapeHTML(name)}

                            </p>


                            <p>

                                <strong>
                                    Email:
                                </strong>

                                ${escapeHTML(email)}

                            </p>


                            <p>

                                <strong>
                                    Phone:
                                </strong>

                                ${escapeHTML(phone)}

                            </p>


                            <p>

                                <strong>
                                    User ID:
                                </strong>

                                ${escapeHTML(uid || "-")}

                            </p>

                        </div>



                        <!-- =====================
                             VIP DETAILS
                        ====================== -->

                        <div class="withdraw-info">

                            <p>

                                <strong>
                                    VIP Plan:
                                </strong>

                                ${escapeHTML(vipName)}

                            </p>


                            <p>

                                <strong>
                                    Price:
                                </strong>

                                ${price.toLocaleString()} RWF

                            </p>


                            <p>

                                <strong>
                                    Daily Income:
                                </strong>

                                ${dailyIncome.toLocaleString()} RWF

                            </p>


                            <p>

                                <strong>
                                    Duration:
                                </strong>

                                ${duration} Days

                            </p>


                            <p>

                                <strong>
                                    Total Profit:
                                </strong>

                                ${totalProfit.toLocaleString()} RWF

                            </p>


                            <p>

                                <strong>
                                    Request Date:
                                </strong>

                                ${escapeHTML(
                                    formatVipDate(date)
                                )}

                            </p>


                            ${
                                status === "approved"
                                ?
                                `
                                <p>

                                    <strong>
                                        Buyer Status:
                                    </strong>

                                    <span
                                        class="status approved"
                                    >
                                        VIP Buyer
                                    </span>

                                </p>
                                `
                                :
                                ""
                            }

                        </div>



                        <!-- =====================
                             ACTION BUTTONS
                        ====================== -->

                        <div class="action-buttons">

                            <button

                                type="button"

                                class="approveBtn vipApproveBtn"

                                data-id="${escapeHTML(id)}"

                                ${
                                    status !== "pending"
                                    ? "disabled"
                                    : ""
                                }

                            >

                                <i class="fa-solid fa-circle-check"></i>

                                ${
                                    status === "approved"
                                    ? "Approved"
                                    : "Approve VIP"
                                }

                            </button>



                            <button

                                type="button"

                                class="rejectBtn vipRejectBtn"

                                data-id="${escapeHTML(id)}"

                                ${
                                    status !== "pending"
                                    ? "disabled"
                                    : ""
                                }

                            >

                                <i class="fa-solid fa-circle-xmark"></i>

                                ${
                                    status === "rejected"
                                    ? "Rejected"
                                    : "Reject VIP"
                                }

                            </button>

                        </div>

                    `;


                    list.appendChild(card);

                }



                // ==================================
                // APPROVE BUTTONS
                // ==================================

                list
                    .querySelectorAll(
                        ".vipApproveBtn"
                    )
                    .forEach(button=>{

                        button.addEventListener(
                            "click",
                            async()=>{

                                const id =
                                    button.dataset.id;


                                if(!id){

                                    return;

                                }


                                // Prevent double click

                                if(
                                    button.disabled
                                ){

                                    return;

                                }


                                button.disabled =
                                    true;


                                button.innerHTML = `

                                    <i class="fa-solid fa-spinner fa-spin"></i>

                                    Processing...

                                `;


                                await approveVipRequest(
                                    id
                                );

                            }
                        );

                    });



                // ==================================
                // REJECT BUTTONS
                // ==================================

                list
                    .querySelectorAll(
                        ".vipRejectBtn"
                    )
                    .forEach(button=>{

                        button.addEventListener(
                            "click",
                            async()=>{

                                const id =
                                    button.dataset.id;


                                if(!id){

                                    return;

                                }


                                if(
                                    button.disabled
                                ){

                                    return;

                                }


                                button.disabled =
                                    true;


                                button.innerHTML = `

                                    <i class="fa-solid fa-spinner fa-spin"></i>

                                    Processing...

                                `;


                                await rejectVipRequest(
                                    id
                                );

                            }
                        );

                    });


            }
            catch(error){

                console.error(
                    "VIP render error:",
                    error
                );

            }

        },

        (error)=>{

            console.error(
                "VIP request listener error:",
                error
            );

        }

    );

}



// ======================================
// APPROVE VIP REQUEST
// ======================================

window.approveVipRequest =
async function(id){

    try{

        if(!id){

            alert(
                "VIP request ID is missing."
            );

            return;

        }


        if(
            !currentAdmin ||
            !currentAdmin.uid
        ){

            alert(
                "Admin session is not ready."
            );

            return;

        }



        const requestRef =
            ref(
                db,
                "vipPurchaseRequests/" + id
            );


        const snap =
            await get(requestRef);


        if(!snap.exists()){

            alert(
                "VIP request not found."
            );

            return;

        }


        const request =
            snap.val() || {};



        // ==================================
        // ONLY PENDING
        // ==================================

        const status =
            String(
                request.status ||
                "pending"
            ).toLowerCase();


        if(status !== "pending"){

            alert(
                "VIP request already processed."
            );

            loadVipRequests();

            return;

        }



        // ==================================
        // UID
        // ==================================

        const uid =
            request.uid ||
            request.userId ||
            request.userUID ||
            "";


        if(!uid){

            alert(
                "VIP request has no user ID."
            );

            return;

        }



        // ==================================
        // USER CHECK
        // ==================================

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(userRef);


        if(!userSnap.exists()){

            alert(
                "User not found."
            );

            return;

        }



        // ==================================
        // VIP AMOUNT
        // ==================================

        const amount =
            vipNumber(
                request.price,
                request.vipPrice,
                request.amount
            );



        // ==================================
        // APPROVE REQUEST
        // ==================================

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );



        // ==================================
        // SAVE VIP BUYER INFORMATION
        // ==================================

        const buyerRef =
            push(
                ref(
                    db,
                    "vipBuyers"
                )
            );


        await set(
            buyerRef,
            {

                uid:
                    uid,

                name:
                    request.fullName ||
                    request.name ||
                    "",

                email:
                    request.email ||
                    "",

                phone:
                    request.phone ||
                    request.phoneNumber ||
                    "",

                photoURL:
                    request.photoURL ||
                    request.photoUrl ||
                    request.photo ||
                    "",

                vipName:
                    request.vipName ||
                    request.planName ||
                    request.namePlan ||
                    request.plan ||
                    request.vip ||
                    "VIP Plan",

                price:
                    amount,

                dailyIncome:
                    vipNumber(
                        request.dailyIncome,
                        request.daily
                    ),

                duration:
                    vipNumber(
                        request.duration,
                        request.days
                    ),

                totalProfit:
                    vipNumber(
                        request.totalProfit,
                        request.profit
                    ),

                requestId:
                    id,

                status:
                    "active",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );



        // ==================================
        // TRANSACTION
        // ==================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "vip_purchase",

                amount:
                    amount,

                status:
                    "approved",

                reference:
                    id,

                approvedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );



        alert(
            "VIP Approved Successfully"
        );


        loadVipRequests();


        if(window.loadDashboard){

            window.loadDashboard();

        }

    }
    catch(error){

        console.error(
            "Approve VIP error:",
            error
        );


        alert(
            "Approve VIP failed: " +
            error.message
        );


        loadVipRequests();

    }

};



// ======================================
// REJECT VIP REQUEST
// ======================================

window.rejectVipRequest =
async function(id){

    try{

        if(!id){

            alert(
                "VIP request ID is missing."
            );

            return;

        }


        if(
            !currentAdmin ||
            !currentAdmin.uid
        ){

            alert(
                "Admin session is not ready."
            );

            return;

        }



        const requestRef =
            ref(
                db,
                "vipPurchaseRequests/" + id
            );


        const snap =
            await get(requestRef);


        if(!snap.exists()){

            alert(
                "VIP request not found."
            );

            return;

        }


        const request =
            snap.val() || {};



        // ==================================
        // ONLY PENDING
        // ==================================

        const status =
            String(
                request.status ||
                "pending"
            ).toLowerCase();


        if(status !== "pending"){

            alert(
                "VIP request already processed."
            );

            loadVipRequests();

            return;

        }



        // ==================================
        // REJECT
        // ==================================

        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );



        // ==================================
        // TRANSACTION
        // ==================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    request.uid ||
                    request.userId ||
                    request.userUID ||
                    "",

                type:
                    "vip_purchase",

                amount:
                    vipNumber(
                        request.price,
                        request.vipPrice,
                        request.amount
                    ),

                status:
                    "rejected",

                reference:
                    id,

                rejectedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );



        alert(
            "VIP Request Rejected Successfully"
        );


        loadVipRequests();


        if(window.loadDashboard){

            window.loadDashboard();

        }

    }
    catch(error){

        console.error(
            "Reject VIP error:",
            error
        );


        alert(
            "Reject VIP failed: " +
            error.message
        );


        loadVipRequests();

    }

};



// ======================================
// VIP BUYERS LIST
// APPROVED VIP USERS
// ======================================

function loadVipBuyers(){

    const list =
        document.getElementById(
            "vipBuyerList"
        );


    if(!list){

        console.log(
            "vipBuyerList not found - using VIP requests list."
        );

        return;

    }


    onValue(
        ref(db,"vipBuyers"),
        (snapshot)=>{

            list.innerHTML = "";


            if(!snapshot.exists()){

                list.innerHTML = `

                    <div class="empty-state">

                        <i class="fa-solid fa-crown"></i>

                        <h3>
                            No VIP Buyers
                        </h3>

                        <p>
                            Approved VIP buyers will appear here.
                        </p>

                    </div>

                `;

                return;

            }


            const buyers =
                Object.entries(
                    snapshot.val()
                ).reverse();


            buyers.forEach(
                ([id,buyer])=>{

                    const item =
                        buyer || {};


                    const card =
                        document.createElement(
                            "div"
                        );


                    const photo =
                        item.photoURL ||
                        item.photoUrl ||
                        item.photo ||
                        "";


                    const photoHTML =
                        photo
                        ?

                        `

                        <img
                            src="${escapeHTML(photo)}"
                            alt="VIP Buyer"
                            class="vip-user-photo"
                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >

                        <div
                            class="vip-user-avatar"
                            style="display:none;"
                        >

                            <i class="fa-solid fa-user"></i>

                        </div>

                        `

                        :

                        `

                        <div class="vip-user-avatar">

                            <i class="fa-solid fa-user"></i>

                        </div>

                        `;


                    card.className =
                        "request-card vip-buyer-card";


                    card.innerHTML = `

                        <div class="request-top">

                            <h3>

                                <i class="fa-solid fa-crown"></i>

                                VIP Buyer

                            </h3>


                            <span class="status approved">

                                Active

                            </span>

                        </div>


                        <div class="vip-profile-header">

                            <div class="vip-photo-wrapper">

                                ${photoHTML}

                            </div>


                            <div class="vip-profile-name">

                                <h4>

                                    ${escapeHTML(
                                        item.name ||
                                        "Unknown User"
                                    )}

                                </h4>

                                <span>
                                    VIP Buyer
                                </span>

                            </div>

                        </div>


                        <p>

                            <strong>
                                Email:
                            </strong>

                            ${escapeHTML(
                                item.email || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Phone:
                            </strong>

                            ${escapeHTML(
                                item.phone || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                VIP Plan:
                            </strong>

                            ${escapeHTML(
                                item.vipName ||
                                "VIP Plan"
                            )}

                        </p>


                        <p>

                            <strong>
                                Price:
                            </strong>

                            ${Number(
                                item.price || 0
                            ).toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>
                                Daily Income:
                            </strong>

                            ${Number(
                                item.dailyIncome || 0
                            ).toLocaleString()} RWF

                        </p>


                        <p>

                            <strong>
                                Duration:
                            </strong>

                            ${Number(
                                item.duration || 0
                            )} Days

                        </p>

                    `;


                    list.appendChild(card);

                }
            );

        },

        (error)=>{

            console.error(
                "VIP buyers error:",
                error
            );

        }

    );

}



// ======================================
// EXPORTS
// ======================================

window.loadVipRequests =
    loadVipRequests;


window.loadVipBuyers =
    loadVipBuyers;



// ======================================
// START
// ======================================

console.log(
    "Admin Part 7 VIP Requests + VIP Buyers Ready"
);



// ======================================
// START AFTER ADMIN AUTH
// ======================================

if(
    window.adminState &&
    window.adminState.ready
){

    loadVipRequests();

    loadVipBuyers();

}             


// ======================================
// ADMIN.JS - PART 8
// VIP BUYERS / APPROVED VIP LIST
// USER PROFILE + VIP DETAILS
// SEARCH + FILTER
// ======================================




            // ==================================
            // ONLY APPROVED VIP REQUESTS
            // ==================================

            const approvedRequests =
                allRequests.filter(
                    ([id,request]) => {

                        return String(
                            request?.status ||
                            ""
                        ).toLowerCase()
                        === "approved";

                    }
                );


            // ==================================
            // COUNTERS
            // ==================================

            updateText(
                "vipBuyerTotalCount",
                approvedRequests.length
            );


            // ==================================
            // NO APPROVED VIP
            // ==================================

            if(
                approvedRequests.length === 0
            ){

                if(empty){

                    empty.style.display =
                        "block";

                }

                list.innerHTML = `

                    <div class="empty-state">

                        <i class="fa-solid fa-crown"></i>

                        <h3>
                            No Approved VIP Buyers
                        </h3>

                        <p>
                            Approved VIP purchases
                            will appear here.
                        </p>

                    </div>

                `;

                return;

            }


            // ==================================
            // RENDER APPROVED VIP BUYERS
            // ==================================

            for(
                const [id,request]
                of approvedRequests
            ){

                const vip =
                    request || {};


                // ==================================
                // UID
                // ==================================

                const uid =
                    vip.uid ||
                    vip.userId ||
                    vip.userUID ||
                    "";


                // ==================================
                // USER PROFILE
                // ==================================

                let userData = {};


                if(uid){

                    try{

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" + uid
                                )
                            );


                        if(
                            userSnap.exists()
                        ){

                            userData =
                                userSnap.val() || {};

                        }

                    }
                    catch(error){

                        console.error(
                            "VIP buyer user error:",
                            error
                        );

                    }

                }


                // ==================================
                // USER DETAILS
                // ==================================

                const name =
                    vip.fullName ||
                    vip.name ||
                    userData.fullName ||
                    userData.name ||
                    userData.username ||
                    "Unknown User";


                const email =
                    vip.email ||
                    userData.email ||
                    "-";


                const phone =
                    vip.phone ||
                    vip.phoneNumber ||
                    userData.phone ||
                    userData.phoneNumber ||
                    "-";


                // ==================================
                // VIP DETAILS
                // ==================================

                const vipName =
                    vip.vipName ||
                    vip.planName ||
                    vip.namePlan ||
                    vip.plan ||
                    vip.vip ||
                    "VIP Plan";


                const price =
                    Number(
                        vip.price ||
                        vip.vipPrice ||
                        vip.amount ||
                        0
                    );


                const dailyIncome =
                    Number(
                        vip.dailyIncome ||
                        vip.daily ||
                        0
                    );


                const duration =
                    Number(
                        vip.duration ||
                        vip.days ||
                        0
                    );


                const totalProfit =
                    Number(
                        vip.totalProfit ||
                        vip.profit ||
                        0
                    );


                const approvedAt =
                    vip.approvedAt ||
                    vip.createdAt ||
                    vip.requestDate ||
                    vip.date ||
                    "-";


                // ==================================
                // CARD
                // ==================================

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.dataset.vipBuyerId =
                    id;


                card.innerHTML = `

                    <div class="request-top">

                        <h3>

                            <i class="fa-solid fa-crown"></i>

                            VIP Buyer

                        </h3>


                        <span class="status approved">

                            approved

                        </span>

                    </div>


                    <!-- USER PROFILE -->

                    <div class="user-profile-box">

                        <h4>

                            <i class="fa-solid fa-user"></i>

                            User Information

                        </h4>


                        <p>

                            <strong>Name:</strong>

                            ${escapeHTML(name)}

                        </p>


                        <p>

                            <strong>Email:</strong>

                            ${escapeHTML(email)}

                        </p>


                        <p>

                            <strong>Phone:</strong>

                            ${escapeHTML(phone)}

                        </p>


                        <p>

                            <strong>User ID:</strong>

                            ${escapeHTML(
                                uid || "-"
                            )}

                        </p>

                    </div>


                    <!-- VIP INFORMATION -->

                    <div class="withdraw-info">

                        <p>

                            <strong>VIP Plan:</strong>

                            ${escapeHTML(vipName)}

                        </p>


                        <p>

                            <strong>Price:</strong>

                            ${price.toLocaleString()}
                            RWF

                        </p>


                        <p>

                            <strong>Daily Income:</strong>

                            ${dailyIncome.toLocaleString()}
                            RWF

                        </p>


                        <p>

                            <strong>Duration:</strong>

                            ${duration}
                            Days

                        </p>


                        <p>

                            <strong>Total Profit:</strong>

                            ${totalProfit.toLocaleString()}
                            RWF

                        </p>


                        <p>

                            <strong>Approved Date:</strong>

                            ${escapeHTML(
                                String(approvedAt)
                            )}

                        </p>

                    </div>


                    <!-- NO ACTION BUTTONS -->

                    <div class="action-buttons">

                        <span class="status approved">

                            <i class="fa-solid fa-circle-check"></i>

                            VIP Approved

                        </span>

                    </div>

                `;


                list.appendChild(card);

            }


            console.log(
                "VIP buyers loaded:",
                approvedRequests.length
            );

        },

        (error)=>{

            console.error(
                "VIP buyers listener error:",
                error
            );

        }

    );

}



// ======================================
// VIP BUYER SEARCH + FILTER
// ======================================

function setupVipBuyerSearch(){

    const search =
        document.getElementById(
            "vipBuyerSearch"
        );


    const filter =
        document.getElementById(
            "vipBuyerFilter"
        );


    if(!search && !filter){

        return;

    }


    function applyVipBuyerFilter(){

        const cards =
            document.querySelectorAll(
                "#vipBuyerList .request-card"
            );


        const searchText =
            (
                search?.value || ""
            )
            .toLowerCase()
            .trim();


        const selected =
            filter?.value ||
            "all";


        cards.forEach(card=>{

            const text =
                card.textContent
                .toLowerCase();


            const statusElement =
                card.querySelector(
                    ".status"
                );


            const status =
                statusElement
                ?.textContent
                .toLowerCase()
                .trim() || "";


            const matchesSearch =
                !searchText ||
                text.includes(
                    searchText
                );


            const matchesStatus =
                selected === "all" ||
                status === selected;


            card.style.display =
                matchesSearch &&
                matchesStatus
                ? ""
                : "none";

        });

    }


    search?.addEventListener(
        "input",
        applyVipBuyerFilter
    );


    filter?.addEventListener(
        "change",
        applyVipBuyerFilter
    );

}



// ======================================
// EXPORT
// ======================================

window.loadVipBuyers =
    loadVipBuyers;


// ======================================
// START AFTER ADMIN AUTH
// ======================================

if(
    window.adminState &&
    window.adminState.ready
){

    loadVipBuyers();

}


setupVipBuyerSearch();


// ======================================
// PART 8 READY
// ======================================

console.log(
    "Admin Part 8 VIP Buyers Ready"
);


