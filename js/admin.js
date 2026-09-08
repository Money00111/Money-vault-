   // SUPPORT MULTIPLE FIELD NAMES
    // ==============================

    const vipName =
        request.vipName ||
        request.name ||
        request.planName ||
        "VIP Plan";


    const price =
        numberValue(
            request.price ??
            request.vipPrice ??
            request.amount
        );


    const dailyIncome =
        numberValue(
            request.dailyIncome ??
            request.daily
        );


    const totalProfit =
        numberValue(
            request.totalProfit ??
            request.profit
        );


    const duration =
        request.duration ??
        request.days ??
        "";


    const status =
        normalizeStatus(
            request.status
        );


    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const userEmail =
        user.email ||
        "N/A";


    const createdAt =
        request.createdAt
            ? new Date(
                Number(request.createdAt)
            ).toLocaleString()
            : "N/A";


    const approvedAt =
        request.approvedAt
            ? new Date(
                Number(request.approvedAt)
            ).toLocaleString()
            : "";


    const rejectedAt =
        request.rejectedAt
            ? new Date(
                Number(request.rejectedAt)
            ).toLocaleString()
            : "";


    // ==============================
    // STATUS TEXT
    // ==============================

    let statusText = "Pending";

    if (status === "approved") {
        statusText = "Approved";
    }

    if (status === "rejected") {
        statusText = "Rejected";
    }

    if (status === "processing") {
        statusText = "Processing";
    }

    if (status === "processing_error") {
        statusText = "Processing Error";
    }


    // ==============================
    // ACTIONS
    // ==============================

    let actions = "";

    if (status === "pending") {

        actions = `
            <div class="vip-request-actions">

                <button
                    type="button"
                    class="vipApproveBtn"
                    data-id="${id}">
                    Approve
                </button>

                <button
                    type="button"
                    class="vipRejectBtn"
                    data-id="${id}">
                    Reject
                </button>

            </div>
        `;
    }


    return `
        <div
            class="vip-request-card"
            data-id="${id}"
            data-status="${status}">

            <div class="vip-request-header">

                <div>

                    <h3>
                        ${escapeHTML(vipName)}
                    </h3>

                    <small>
                        Request ID:
                        ${id}
                    </small>

                </div>

                <span
                    class="status-badge status-${status}">
                    ${statusText}
                </span>

            </div>


            <div class="vip-request-user">

                <div class="info-row">

                    <span>User</span>

                    <strong>
                        ${escapeHTML(userName)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Email</span>

                    <strong>
                        ${escapeHTML(userEmail)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>UID</span>

                    <strong>
                        ${uid}
                    </strong>

                </div>

            </div>


            <div class="vip-request-details">

                <div class="info-row">

                    <span>VIP Price</span>

                    <strong>
                        ${formatMoney(price)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Daily Income</span>

                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Total Profit</span>

                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Duration</span>

                    <strong>
                        ${escapeHTML(duration)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Created At</span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>


                ${
                    approvedAt
                        ? `
                            <div class="info-row">

                                <span>
                                    Approved At
                                </span>

                                <strong>
                                    ${approvedAt}
                                </strong>

                            </div>
                          `
                        : ""
                }


                ${
                    rejectedAt
                        ? `
                            <div class="info-row">

                                <span>
                                    Rejected At
                                </span>

                                <strong>
                                    ${rejectedAt}
                                </strong>

                            </div>
                          `
                        : ""
                }

            </div>


            ${actions}

        </div>
    `;
}


// ======================================
// ACTIVATE VIP REQUEST BUTTONS
// ======================================

function activateVipRequestButtons() {

    // ==============================
    // APPROVE
    // ==============================

    document
        .querySelectorAll(".vipApproveBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {

                        alert(
                            "VIP request ID is missing."
                        );

                        return;
                    }


                    if (
                        typeof window.approveVipRequest ===
                        "function"
                    ) {

                        await window.approveVipRequest(
                            id
                        );

                    } else {

                        console.error(
                            "approveVipRequest() is not available yet."
                        );
                    }

                }
            );

        });


    // ==============================
    // REJECT
    // ==============================

    document
        .querySelectorAll(".vipRejectBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {

                        alert(
                            "VIP request ID is missing."
                        );

                        return;
                    }


                    if (
                        typeof window.rejectVipRequest ===
                        "function"
                    ) {

                        await window.rejectVipRequest(
                            id
                        );

                    } else {

                        console.error(
                            "rejectVipRequest() is not available yet."
                        );
                    }

                }
            );

        });
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadVipRequests =
    loadVipRequests;

window.renderVipRequestCard =
    renderVipRequestCard;

window.activateVipRequestButtons =
    activateVipRequestButtons;



 
 // ======================================
// ADMIN.JS - PART 8
// VIP APPROVE / REJECT
// Referral Bonus - FIRST VIP ONLY
// ======================================

const REFERRAL_BONUS_AMOUNT = 1000;


// ======================================
// GET VIP DURATION
// ======================================

function getVipDuration(request) {

    const directDuration =
        request.duration ??
        request.days ??
        request.vipDuration;

    if (
        directDuration !== undefined &&
        directDuration !== null &&
        String(directDuration).trim() !== ""
    ) {
        return numberValue(directDuration);
    }

    const dailyIncome =
        numberValue(
            request.dailyIncome ??
            request.daily
        );

    const totalProfit =
        numberValue(
            request.totalProfit ??
            request.profit
        );

    if (dailyIncome > 0 && totalProfit > 0) {
        return Math.ceil(totalProfit / dailyIncome);
    }

    return 0;
}


// ======================================
// APPROVE VIP REQUEST
// ======================================

async function approveVipRequest(id) {

    try {

        await window.waitForAdmin();

        if (!id) {
            alert("VIP request ID is missing.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to approve this VIP purchase?"
        );

        if (!confirmed) return;


        // ======================================
        // GET REQUEST
        // ======================================

        const requestRef =
            ref(db, `vipPurchaseRequests/${id}`);

        const requestSnapshot =
            await get(requestRef);

        if (!requestSnapshot.exists()) {

            alert("VIP request not found.");
            return;
        }

        const request =
            requestSnapshot.val();

        const status =
            normalizeStatus(request.status);


        if (status !== "pending") {

            alert(
                `This VIP request is already ${status}.`
            );

            return;
        }


        // ======================================
        // VALIDATE USER
        // ======================================

        const uid = request.uid;

        if (!uid) {

            alert(
                "This VIP request has no user UID."
            );

            return;
        }


        // ======================================
        // VIP DATA
        // ======================================

        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            "VIP Plan";

        const price =
            numberValue(
                request.price ??
                request.vipPrice ??
                request.amount
            );

        const dailyIncome =
            numberValue(
                request.dailyIncome ??
                request.daily
            );

        const totalProfit =
            numberValue(
                request.totalProfit ??
                request.profit
            );

        const duration =
            getVipDuration(request);


        if (!Number.isFinite(price) || price <= 0) {

            alert("Invalid VIP price.");
            return;
        }

        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome <= 0
        ) {

            alert("Invalid VIP daily income.");
            return;
        }

        if (
            !Number.isFinite(totalProfit) ||
            totalProfit <= 0
        ) {

            alert("Invalid VIP total profit.");
            return;
        }

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            alert("Invalid VIP duration.");
            return;
        }


        // ======================================
        // LOCK REQUEST
        // ======================================

        const lockResult =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) return;

                    if (
                        normalizeStatus(
                            currentData.status
                        ) !== "pending"
                    ) {
                        return;
                    }

                    return {
                        ...currentData,

                        status: "processing",

                        processingAt: Date.now(),

                        processingBy:
                            currentAdmin?.uid ||
                            auth.currentUser?.uid ||
                            null
                    };
                }
            );


        if (!lockResult.committed) {

            alert(
                "This VIP request is already being processed."
            );

            return;
        }


        // ======================================
        // GET USER
        // ======================================

        const userRef =
            ref(db, `users/${uid}`);

        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            await update(
                requestRef,
                {
                    status: "rejected",

                    rejectedAt: Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null,

                    rejectionReason:
                        "User account not found.",

                    processingAt: null,

                    processingBy: null
                }
            );

            alert("User account not found.");

            return;
        }


        const user =
            userSnapshot.val();


        // ======================================
        // CHECK REFERRER
        // ======================================

        const referredBy =
            user.referredBy || null;


        // ======================================
        // CHECK WHETHER THIS IS FIRST VIP
        // ======================================
        //
        // IMPORTANT:
        // Turareba VIP zari zisanzwe zemejwe
        // n'uyu user mbere yo gukora VIP nshya.
        //
        // Ibi bifasha no ku ba users bari basanzwe
        // bafite VIP mbere y'uko iyi referral system
        // nshya ishyirwaho.
        // ======================================

        let hasPreviousVip = false;

        try {

            const vipBuyersSnapshot =
                await get(
                    ref(db, "vipBuyers")
                );

            if (vipBuyersSnapshot.exists()) {

                const allVipBuyers =
                    vipBuyersSnapshot.val();

                hasPreviousVip =
                    Object.values(
                        allVipBuyers
                    ).some(
                        buyer =>
                            buyer &&
                            buyer.uid === uid
                    );
            }

        } catch (vipCheckError) {

            console.error(
                "Could not check previous VIP:",
                vipCheckError
            );

            // Ntidukomeza gutanga referral
            // niba tudashoboye kumenya history.
            hasPreviousVip = true;
        }


        // ======================================
        // CREATE VIP BUYER
        // ======================================

        const now = Date.now();

        const vipBuyerRef =
            push(
                ref(db, "vipBuyers")
            );

        const vipBuyerId =
            vipBuyerRef.key;


        await set(
            vipBuyerRef,
            {

                uid: uid,

                vipName: vipName,

                price: price,

                dailyIncome: dailyIncome,

                totalProfit: totalProfit,

                duration: duration,

                startDate: now,

                // ==================================
                // CLAIM AFTER 24 HOURS
                // ==================================

                lastClaim: now,

                claimedAmount: 0,

                status: "active",

                purchaseRequestId: id,

                createdAt: now,

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            }
        );


        // ======================================
        // IMPORTANT
        // ======================================
        //
        // NTITWONGERAMO dailyIncome KURI BALANCE.
        //
        // User azabona dailyIncome nyuma y'amasaha
        // 24 akoresheje Claim Daily Income.
        // ======================================


        // ======================================
        // CREATE VIP TRANSACTION
        // ======================================

        const transactionRef =
            push(
                ref(db, "transactions")
            );

        const transactionKey =
            transactionRef.key;


        await set(
            transactionRef,
            {

                uid: uid,

                type: "vip",

                amount: price,

                status: "approved",

                vipName: vipName,

                vipBuyerId: vipBuyerId,

                vipPurchaseRequestId: id,

                createdAt: now,

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            }
        );


        // ======================================
        // REFERRAL BONUS
        // FIRST VIP ONLY
        // ======================================

        if (
            referredBy &&
            referredBy !== uid &&
            !hasPreviousVip
        ) {

            try {

                const referralUserRef =
                    ref(
                        db,
                        `users/${referredBy}`
                    );


                const referralResult =
                    await runTransaction(
                        referralUserRef,
                        currentData => {

                            if (!currentData) {
                                return;
                            }


                            // ==================================
                            // CHECK IF BONUS WAS ALREADY GIVEN
                            // ==================================

                            const bonusGiven =
                                currentData
                                    .referralBonusGiven
                                    ?. [uid];


                            if (bonusGiven === true) {

                                // ==================================
                                // BONUS YARATANZWE
                                // NTIYONGERE
                                // ==================================

                                return;
                            }


                            // ==================================
                            // CURRENT VALUES
                            // ==================================

                            const currentBalance =
                                numberValue(
                                    currentData.balance
                                );

                            const currentReferralEarnings =
                                numberValue(
                                    currentData.referralEarnings
                                );


                            // ==================================
                            // ADD BONUS
                            // ==================================

                            return {

                                ...currentData,

                                // 💰 MONEY IBONYE KURI BALANCE
                                balance:
                                    currentBalance +
                                    REFERRAL_BONUS_AMOUNT,

                                // 📊 REFERRAL EARNINGS
                                referralEarnings:
                                    currentReferralEarnings +
                                    REFERRAL_BONUS_AMOUNT,

                                // 🔒 MARK AS ALREADY PAID
                                referralBonusGiven: {

                                    ...(currentData.referralBonusGiven || {}),

                                    [uid]: true
                                }
                            };
                        }
                    );


                if (referralResult.committed) {

                    // ==================================
                    // CREATE REFERRAL TRANSACTION
                    // ==================================

                    const referralTransactionRef =
                        push(
                            ref(db, "transactions")
                        );


                    await set(
                        referralTransactionRef,
                        {

                            uid: referredBy,

                            type: "referral",

                            amount:
                                REFERRAL_BONUS_AMOUNT,

                            status: "approved",

                            referredUserUid:
                                uid,

                            vipPurchaseRequestId:
                                id,

                            description:
                                "First VIP referral bonus",

                            createdAt: now,

                            approvedAt: now,

                            approvedBy:
                                currentAdmin?.uid ||
                                auth.currentUser?.uid ||
                                null
                        }
                    );


                    console.log(
                        `FIRST VIP referral bonus of ${REFERRAL_BONUS_AMOUNT} RWF added to ${referredBy}`
                    );

                } else {

                    console.log(
                        "Referral bonus was already given or referrer was not found."
                    );
                }


            } catch (referralError) {

                console.error(
                    "Referral bonus error:",
                    referralError
                );

                // ==================================
                // VIP APPROVAL NTIHAGARARA
                // ==================================

            }

        } else {

            if (hasPreviousVip) {

                console.log(
                    "No referral bonus: this is not the user's first VIP."
                );

            } else {

                console.log(
                    "No valid referrer found."
                );
            }
        }


        // ======================================
        // FINALIZE REQUEST
        // ======================================

        await update(
            requestRef,
            {

                status: "approved",

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null,

                vipBuyerId:
                    vipBuyerId,

                transactionKey:
                    transactionKey,

                processingAt: null,

                processingBy: null
            }
        );


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            "VIP purchase approved successfully."
        );


        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


        if (
            typeof window.loadVipRequests ===
            "function"
        ) {
            window.loadVipRequests();
        }


        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {
            window.loadVipBuyers();
        }


    } catch (error) {

        console.error(
            "approveVipRequest error:",
            error
        );


        // ======================================
        // MARK PROCESSING ERROR
        // ======================================

        try {

            await update(
                ref(
                    db,
                    `vipPurchaseRequests/${id}`
                ),
                {

                    status:
                        "processing_error",

                    processingError:
                        error?.message ||
                        String(error),

                    errorAt:
                        Date.now()
                }
            );

        } catch (updateError) {

            console.error(
                "Could not update VIP request error:",
                updateError
            );
        }


        alert(
            "Failed to approve VIP request: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}


// ======================================
// REJECT VIP REQUEST
// ======================================

async function rejectVipRequest(id) {

    try {

        await window.waitForAdmin();

        if (!id) {

            alert(
                "VIP request ID is missing."
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to reject this VIP purchase?"
            );


        if (!confirmed) return;


        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        const result =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) return;

                    if (
                        normalizeStatus(
                            currentData.status
                        ) !== "pending"
                    ) {
                        return;
                    }


                    return {

                        ...currentData,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            auth.currentUser?.uid ||
                            null
                    };
                }
            );


        if (!result.committed) {

            alert(
                "This VIP request is no longer pending."
            );

            return;
        }


        alert(
            "VIP purchase rejected successfully."
        );


        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


        if (
            typeof window.loadVipRequests ===
            "function"
        ) {
            window.loadVipRequests();
        }


    } catch (error) {

        console.error(
            "rejectVipRequest error:",
            error
        );


        alert(
            "Failed to reject VIP request: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.REFERRAL_BONUS_AMOUNT =
    REFERRAL_BONUS_AMOUNT;

window.getVipDuration =
    getVipDuration;

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;



// ======================================
// ADMIN.JS - PART 9
// VIP BUYERS
// ======================================

async function loadVipBuyers() {

    try {

        await window.waitForAdmin();

        const vipBuyersRef =
            ref(db, "vipBuyers");


        onValue(
            vipBuyersRef,
            async (snapshot) => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT OBJECT TO ARRAY
                // --------------------------------------

                const buyers =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST FIRST
                // --------------------------------------

                buyers.sort(
                    (a, b) =>
                        (Number(b.approvedAt) || Number(b.createdAt) || 0) -
                        (Number(a.approvedAt) || Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // CHECK ACTIVE / EXPIRED
                // --------------------------------------

                const now = Date.now();


                const processedBuyers =
                    buyers.map(buyer => {

                        const startDate =
                            Number(
                                buyer.startDate ??
                                buyer.approvedAt ??
                                buyer.createdAt ??
                                0
                            );


                        const duration =
                            numberValue(
                                buyer.duration ??
                                buyer.days
                            );


                        const durationMs =
                            duration *
                            24 *
                            60 *
                            60 *
                            1000;


                        let calculatedStatus =
                            normalizeStatus(
                                buyer.status
                            );


                        // If duration exists, calculate expiration
                        if (
                            startDate > 0 &&
                            duration > 0
                        ) {

                            const expirationDate =
                                startDate + durationMs;


                            if (now >= expirationDate) {

                                calculatedStatus =
                                    "expired";

                            } else {

                                calculatedStatus =
                                    "active";
                            }
                        }


                        return {
                            ...buyer,
                            calculatedStatus
                        };

                    });


                // --------------------------------------
                // COUNTERS
                // --------------------------------------

                const total =
                    processedBuyers.length;


                const active =
                    processedBuyers.filter(
                        buyer =>
                            buyer.calculatedStatus ===
                            "active"
                    ).length;


                const expired =
                    processedBuyers.filter(
                        buyer =>
                            buyer.calculatedStatus ===
                            "expired"
                    ).length;


                updateText(
                    "vipBuyerTotalCount",
                    total
                );


                updateText(
                    "vipBuyerActiveCount",
                    active
                );


                updateText(
                    "vipBuyerExpiredCount",
                    expired
                );


                // --------------------------------------
                // HTML CONTAINER
                // --------------------------------------

                const container =
                    document.getElementById(
                        "vipBuyerList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyVipBuyer"
                    );


                if (!container) {

                    console.error(
                        "vipBuyerList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY STATE
                // --------------------------------------

                if (processedBuyers.length === 0) {

                    if (emptyState) {
                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // LOAD USERS
                // --------------------------------------

                let users = {};

                try {

                    const usersSnapshot =
                        await get(
                            ref(db, "users")
                        );


                    if (usersSnapshot.exists()) {

                        users =
                            usersSnapshot.val() || {};
                    }

                } catch (userError) {

                    console.error(
                        "Failed to load users:",
                        userError
                    );
                }


                // --------------------------------------
                // RENDER VIP BUYERS
                // --------------------------------------

                processedBuyers.forEach(
                    buyer => {

                        const user =
                            users[buyer.uid] || {};


                        container.insertAdjacentHTML(
                            "beforeend",
                            renderVipBuyerCard(
                                buyer,
                                user
                            )
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Error loading VIP buyers:",
                    error
                );


                const container =
                    document.getElementById(
                        "vipBuyerList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load VIP buyers.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadVipBuyers error:",
            error
        );
    }
}



// ======================================
// RENDER VIP BUYER CARD
// ======================================

function renderVipBuyerCard(
    buyer,
    user = {}
) {

    const id =
        escapeHTML(
            buyer.id
        );


    const uid =
        escapeHTML(
            buyer.uid || "N/A"
        );


    const vipName =
        escapeHTML(
            buyer.vipName ||
            buyer.name ||
            buyer.planName ||
            "VIP Plan"
        );


    const price =
        numberValue(
            buyer.price ??
            buyer.vipPrice ??
            buyer.amount
        );


    const dailyIncome =
        numberValue(
            buyer.dailyIncome ??
            buyer.daily
        );


    const totalProfit =
        numberValue(
            buyer.totalProfit ??
            buyer.profit
        );


    const duration =
        numberValue(
            buyer.duration ??
            buyer.days
        );


    const claimedAmount =
        numberValue(
            buyer.claimedAmount
        );


    const startDate =
        Number(
            buyer.startDate ??
            buyer.approvedAt ??
            buyer.createdAt ??
            0
        );


    const lastClaim =
        Number(
            buyer.lastClaim || 0
        );


    const approvedAt =
        Number(
            buyer.approvedAt ||
            buyer.createdAt ||
            0
        );


    // --------------------------------------
    // EXPIRATION DATE
    // --------------------------------------

    let expirationDate = 0;

    if (
        startDate > 0 &&
        duration > 0
    ) {

        expirationDate =
            startDate +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );
    }


    // --------------------------------------
    // STATUS
    // --------------------------------------

    let status =
        buyer.calculatedStatus ||
        normalizeStatus(
            buyer.status
        );


    if (
        expirationDate > 0 &&
        Date.now() >= expirationDate
    ) {

        status = "expired";

    } else if (
        expirationDate > 0 &&
        Date.now() < expirationDate
    ) {

        status = "active";
    }


    let statusText = "Active";


    if (status === "expired") {

        statusText = "Expired";

    } else if (status === "active") {

        statusText = "Active";

    } else if (status === "pending") {

        statusText = "Pending";

    } else if (status === "processing") {

        statusText = "Processing";

    } else {

        statusText =
            escapeHTML(status);
    }


    // --------------------------------------
    // USER INFORMATION
    // --------------------------------------

    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const userEmail =
        user.email ||
        "N/A";


    // --------------------------------------
    // DATE FORMATTER
    // --------------------------------------

    const formatDate =
        timestamp => {

            if (
                !timestamp ||
                !Number.isFinite(
                    Number(timestamp)
                )
            ) {

                return "N/A";
            }


            return new Date(
                Number(timestamp)
            ).toLocaleString();
        };


    // --------------------------------------
    // EXPIRATION DISPLAY
    // --------------------------------------

    const expirationText =
        expirationDate > 0
            ? formatDate(expirationDate)
            : "N/A";


    // --------------------------------------
    // RETURN CARD
    // --------------------------------------

    return `
        <div
            class="vip-buyer-card"
            data-id="${id}"
            data-status="${escapeHTML(status)}"
        >

            <div class="vip-buyer-header">

                <div>

                    <h3>
                        ${vipName}
                    </h3>

                    <small>
                        Buyer ID: ${id}
                    </small>

                </div>


                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="vip-buyer-user">

                <div class="info-row">
                    <span>User</span>
                    <strong>
                        ${escapeHTML(userName)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(userEmail)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>UID</span>
                    <strong>
                        ${uid}
                    </strong>
                </div>

            </div>


            <div class="vip-buyer-details">

                <div class="info-row">
                    <span>VIP Price</span>
                    <strong>
                        ${formatMoney(price)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Daily Income</span>
                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Total Profit</span>
                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Duration</span>
                    <strong>
                        ${escapeHTML(duration)} Days
                    </strong>
                </div>


                <div class="info-row">
                    <span>Claimed Amount</span>
                    <strong>
                        ${formatMoney(claimedAmount)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Start Date</span>
                    <strong>
                        ${formatDate(startDate)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Last Claim</span>
                    <strong>
                        ${formatDate(lastClaim)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Expiration Date</span>
                    <strong>
                        ${expirationText}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Approved At</span>
                    <strong>
                        ${formatDate(approvedAt)}
                    </strong>
                </div>

            </div>

        </div>
    `;
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadVipBuyers =
    loadVipBuyers;

window.renderVipBuyerCard =
    renderVipBuyerCard;
// ======================================
// PART 10 - USERS
// Money Vault Admin
// ======================================

let allUsers = {};


/* ======================================
   LOAD USERS
====================================== */

async function loadUsers() {

    try {

        await waitForAdmin();

        const usersRef =
            ref(db, "users");

        onValue(
            usersRef,
            (snapshot) => {

                allUsers =
                    snapshot.val() || {};

                renderUsers();

            },
            (error) => {

                console.error(
                    "Users listener error:",
                    error
                );

                const list =
                    document.getElementById(
                        "usersList"
                    );

                if (list) {

                    list.innerHTML = `
                        <div class="error-state">

                            <i class="fas fa-exclamation-triangle"></i>

                            <h3>
                                Failed to load users
                            </h3>

                            <p>
                                ${escapeHTML(
                                    error.message
                                )}
                            </p>

                        </div>
                    `;
                }
            }
        );

    } catch (error) {

        console.error(
            "loadUsers error:",
            error
        );
    }
}


/* ======================================
   RENDER USERS
====================================== */

function renderUsers() {

    const list =
        document.getElementById(
            "usersList"
        );

    const empty =
        document.getElementById(
            "emptyUsers"
        );

    if (!list) return;


    // ==============================
    // SEARCH
    // ==============================

    const searchInput =
        document.getElementById(
            "userSearch"
        );

    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    // ==============================
    // USER ARRAY
    // ==============================

    const users =
        Object.entries(allUsers)
            .map(([uid, user]) => ({
                uid,
                ...(user || {})
            }))
            .sort((a, b) => {

                const dateA =
                    Number(
                        a.createdAt || 0
                    );

                const dateB =
                    Number(
                        b.createdAt || 0
                    );

                return dateB - dateA;
            });


    // ==============================
    // SEARCH FILTER
    // ==============================

    const filtered =
        users.filter(user => {

            const name =
                String(
                    user.name ||
                    user.fullName ||
                    user.username ||
                    ""
                )
                .toLowerCase();


            const email =
                String(
                    user.email || ""
                )
                .toLowerCase();


            const phone =
                String(
                    user.phone ||
                    user.phoneNumber ||
                    ""
                )
                .toLowerCase();


            const uid =
                String(
                    user.uid || ""
                )
                .toLowerCase();


            const referralCode =
                String(
                    user.referralCode || ""
                )
                .toLowerCase();


            const referredBy =
                String(
                    user.referredBy || ""
                )
                .toLowerCase();


            return (
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                phone.includes(search) ||
                uid.includes(search) ||
                referralCode.includes(search) ||
                referredBy.includes(search)
            );

        });


    // ==============================
    // EMPTY
    // ==============================

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {

        empty.style.display =
            "none";
    }


    // ==============================
    // RENDER
    // ==============================

    list.innerHTML =
        filtered
            .map(user =>
                renderUserCard(user)
            )
            .join("");
}


/* ======================================
   USER CARD
====================================== */

function renderUserCard(user) {

    const uid =
        user.uid || "";


    // ==============================
    // BASIC PROFILE
    // ==============================

    const name =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const email =
        user.email ||
        "No email";


    const phone =
        user.phone ||
        user.phoneNumber ||
        "No phone";


    // ==============================
    // FINANCIAL DATA
    // ==============================

    const balance =
        numberValue(
            user.balance
        );


    const totalDeposits =
        numberValue(
            user.totalDeposits
        );


    const totalWithdrawals =
        numberValue(
            user.totalWithdrawals
        );


    const referralEarnings =
        numberValue(
            user.referralEarnings
        );


    const totalProfits =
        numberValue(
            user.totalProfits
        );


    const totalTransactions =
        numberValue(
            user.totalTransactions
        );


    // ==============================
    // REFERRAL DATA
    // ==============================

    const referralCode =
        user.referralCode ||
        "N/A";


    const referredBy =
        user.referredBy ||
        "None";


    // ==============================
    // CREATED DATE
    // ==============================

    const createdAt =
        user.createdAt
            ? formatDate(
                user.createdAt
            )
            : "N/A";


    // ==============================
    // PROFILE PHOTO
    // ==============================

    const photo =
        user.photoURL ||
        user.photo ||
        user.profileImage ||
        "";


    const avatarHTML =
        photo
            ? `
                <img
                    src="${escapeHTML(
                        photo
                    )}"
                    alt="User"
                    class="user-profile-image"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="user-avatar-fallback"
                    style="display:none;"
                >
                    <i class="fas fa-user"></i>
                </div>
              `
            : `
                <div class="user-avatar-fallback">
                    <i class="fas fa-user"></i>
                </div>
              `;


    // ==============================
    // CARD
    // ==============================

    return `

        <div
            class="user-card"
            data-uid="${escapeHTML(
                uid
            )}"
        >


            <!-- ==========================
                 PROFILE HEADER
            =========================== -->

            <div class="user-card-header">


                <div class="user-main-profile">


                    <div class="user-avatar">

                        ${avatarHTML}

                    </div>


                    <div
                        class="user-main-info"
                    >

                        <h3>
                            ${escapeHTML(
                                name
                            )}
                        </h3>


                        <p>

                            <i
                                class="fas fa-envelope"
                            ></i>

                            ${escapeHTML(
                                email
                            )}

                        </p>


                        <p>

                            <i
                                class="fas fa-phone"
                            ></i>

                            ${escapeHTML(
                                phone
                            )}

                        </p>

                    </div>

                </div>


                <div
                    class="user-account-status"
                >

                    <span class="active-badge">

                        <i
                            class="fas fa-circle"
                        ></i>

                        Active

                    </span>

                </div>

            </div>


            <!-- ==========================
                 USER INFORMATION
            =========================== -->

            <div class="user-section">


                <div class="section-title">

                    <i
                        class="fas fa-id-card"
                    ></i>

                    User Information

                </div>


                <div class="user-info-grid">


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-user"
                            ></i>

                            Full Name

                        </span>


                        <strong>
                            ${escapeHTML(
                                name
                            )}
                        </strong>

                    </div>


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-envelope"
                            ></i>

                            Email

                        </span>


                        <strong>
                            ${escapeHTML(
                                email
                            )}
                        </strong>

                    </div>


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-mobile-alt"
                            ></i>

                            Phone

                        </span>


                        <strong>
                            ${escapeHTML(
                                phone
                            )}
                        </strong>

                    </div>


                    <div
                        class="user-info-item uid-item"
                    >

                        <span class="label">

                            <i
                                class="fas fa-fingerprint"
                            ></i>

                            UID

                        </span>


                        <strong
                            title="${escapeHTML(
                                uid
                            )}"
                        >
                            ${escapeHTML(
                                uid
                            )}
                        </strong>

                    </div>


                    <div class="user-info-item">

                        <span class="label">

                            <i
                                class="fas fa-calendar-alt"
                            ></i>

                            Created

                        </span>


                        <strong>
                            ${escapeHTML(
                                createdAt
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 BALANCE
            =========================== -->

            <div class="user-balance-box">


                <div class="balance-icon">

                    <i
                        class="fas fa-wallet"
                    ></i>

                </div>


                <div>

                    <span>
                        Current Balance
                    </span>


                    <strong>
                        ${formatMoney(
                            balance
                        )}
                    </strong>

                </div>

            </div>


            <!-- ==========================
                 FINANCIAL STATISTICS
            =========================== -->

            <div class="user-section">


                <div class="section-title">

                    <i
                        class="fas fa-chart-line"
                    ></i>

                    Financial Statistics

                </div>


                <div class="user-stats-grid">


                    <div class="user-stat deposit-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-arrow-down"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Total Deposits
                            </span>

                            <strong>
                                ${formatMoney(
                                    totalDeposits
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat withdraw-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-arrow-up"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Total Withdrawals
                            </span>

                            <strong>
                                ${formatMoney(
                                    totalWithdrawals
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat profit-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-chart-line"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Total Profits
                            </span>

                            <strong>
                                ${formatMoney(
                                    totalProfits
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat referral-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-users"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Referral Earnings
                            </span>

                            <strong>
                                ${formatMoney(
                                    referralEarnings
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="user-stat transaction-stat">

                        <div class="stat-icon">

                            <i
                                class="fas fa-receipt"
                            ></i>

                        </div>


                        <div>

                            <span>
                                Transactions
                            </span>

                            <strong>
                                ${totalTransactions}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 REFERRAL INFORMATION
            =========================== -->

            <div class="user-section">


                <div class="section-title">

                    <i
                        class="fas fa-share-alt"
                    ></i>

                    Referral Information

                </div>


                <div class="referral-grid">


                    <div class="referral-item">

                        <span class="label">

                            <i
                                class="fas fa-link"
                            ></i>

                            Referral Code

                        </span>


                        <strong>
                            ${escapeHTML(
                                referralCode
                            )}
                        </strong>

                    </div>


                    <div class="referral-item">

                        <span class="label">

                            <i
                                class="fas fa-user-plus"
                            ></i>

                            Referred By

                        </span>


                        <strong>
                            ${escapeHTML(
                                referredBy
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 UID FOOTER
            =========================== -->

            <div class="user-card-footer">


                <div class="user-uid">

                    <span>
                        User UID
                    </span>


                    <code>
                        ${escapeHTML(
                            uid
                        )}
                    </code>

                </div>


                <button
                    type="button"
                    class="copy-uid-btn"
                    data-uid="${escapeHTML(
                        uid
                    )}"
                    title="Copy UID"
                >

                    <i
                        class="fas fa-copy"
                    ></i>

                </button>

            </div>


        </div>

    `;
}


/* ======================================
   USER SEARCH
====================================== */

const userSearchInput =
    document.getElementById(
        "userSearch"
    );


if (userSearchInput) {

    userSearchInput.addEventListener(
        "input",
        () => {

            renderUsers();

        }
    );
}


/* ======================================
   COPY USER UID
====================================== */

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".copy-uid-btn"
            );

        if (!button) return;


        const uid =
            button.dataset.uid;


        if (!uid) return;


        try {

            await navigator.clipboard.writeText(
                uid
            );


            const oldHTML =
                button.innerHTML;


            button.innerHTML = `
                <i class="fas fa-check"></i>
            `;


            setTimeout(() => {

                button.innerHTML =
                    oldHTML;

            }, 1500);


        } catch (error) {

            console.error(
                "Copy UID failed:",
                error
            );

        }

    }
);


/* ======================================
   GLOBAL FUNCTIONS
====================================== */

window.loadUsers =
    loadUsers;

window.renderUsers =
    renderUsers;

window.renderUserCard =
    renderUserCard;

// ======================================
// ADMIN.JS - PART 11
// TRANSACTIONS
// ======================================

async function loadTransactions() {

    try {

        await window.waitForAdmin();

        const transactionsRef =
            ref(db, "transactions");


        onValue(
            transactionsRef,
            snapshot => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT OBJECT TO ARRAY
                // --------------------------------------

                const transactions =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST FIRST
                // --------------------------------------

                transactions.sort(
                    (a, b) =>
                        (Number(b.createdAt) || 0) -
                        (Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // HTML ELEMENTS
                // --------------------------------------

                const container =
                    document.getElementById(
                        "transactionList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyTransaction"
                    );


                if (!container) {

                    console.error(
                        "transactionList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY STATE
                // --------------------------------------

                if (transactions.length === 0) {

                    if (emptyState) {

                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // RENDER TRANSACTIONS
                // --------------------------------------

                transactions.forEach(
                    transaction => {

                        container.insertAdjacentHTML(
                            "beforeend",
                            renderTransactionCard(
                                transaction
                            )
                        );

                    }
                );


                // --------------------------------------
                // ACTIVATE SEARCH / FILTER
                // --------------------------------------

                activateTransactionSearch();

            },

            error => {

                console.error(
                    "Error loading transactions:",
                    error
                );


                const container =
                    document.getElementById(
                        "transactionList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load transactions.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadTransactions error:",
            error
        );
    }
}



// ======================================
// RENDER TRANSACTION CARD
// ======================================

function renderTransactionCard(
    transaction
) {

    const id =
        escapeHTML(
            transaction.id || "N/A"
        );


    const uid =
        escapeHTML(
            transaction.uid || "N/A"
        );


    const type =
        normalizeStatus(
            transaction.type ||
            "unknown"
        );


    const status =
        normalizeStatus(
            transaction.status ||
            "pending"
        );


    const amount =
        numberValue(
            transaction.amount
        );


    const paymentMethod =
        escapeHTML(
            transaction.paymentMethod ||
            transaction.method ||
            "N/A"
        );


    const phone =
        escapeHTML(
            transaction.phone ||
            transaction.senderPhone ||
            transaction.receiverPhone ||
            transaction.withdrawPhone ||
            "N/A"
        );


    const transactionId =
        escapeHTML(
            transaction.transactionId ||
            "N/A"
        );


    const createdAt =
        transaction.createdAt
            ? new Date(
                Number(transaction.createdAt)
              ).toLocaleString()
            : "N/A";


    const approvedAt =
        transaction.approvedAt
            ? new Date(
                Number(transaction.approvedAt)
              ).toLocaleString()
            : "";


    const rejectedAt =
        transaction.rejectedAt
            ? new Date(
                Number(transaction.rejectedAt)
              ).toLocaleString()
            : "";


    // --------------------------------------
    // TRANSACTION TYPE TEXT
    // --------------------------------------

    let typeText = "Transaction";


    if (type === "deposit") {

        typeText = "Deposit";

    } else if (type === "withdraw") {

        typeText = "Withdraw";

    } else if (type === "vip") {

        typeText = "VIP Purchase";

    } else if (type === "profit") {

        typeText = "Profit";

    } else if (type === "bonus") {

        typeText = "Bonus";

    } else if (type === "referral") {

        typeText = "Referral Bonus";

    } else {

        typeText =
            escapeHTML(
                transaction.type ||
                "Transaction"
            );
    }


    // --------------------------------------
    // STATUS TEXT
    // --------------------------------------

    let statusText = "Pending";


    if (status === "approved") {

        statusText = "Approved";

    } else if (status === "rejected") {

        statusText = "Rejected";

    } else if (status === "pending") {

        statusText = "Pending";

    } else if (status === "processing") {

        statusText = "Processing";

    } else if (
        status === "processing_error"
    ) {

        statusText = "Processing Error";

    } else {

        statusText =
            escapeHTML(
                transaction.status ||
                "Pending"
            );
    }


    // --------------------------------------
    // EXTRA DATA
    // --------------------------------------

    const vipName =
        escapeHTML(
            transaction.vipName ||
            ""
        );


    const withdrawRequestId =
        escapeHTML(
            transaction.withdrawRequestId ||
            ""
        );


    const depositRequestId =
        escapeHTML(
            transaction.depositRequestId ||
            ""
        );


    // --------------------------------------
    // RETURN CARD
    // --------------------------------------

    return `
        <div
            class="transaction-card"
            data-id="${id}"
            data-uid="${uid.toLowerCase()}"
            data-type="${escapeHTML(type)}"
            data-status="${escapeHTML(status)}"
            data-search="${escapeHTML(
                (
                    (
                        transaction.uid || ""
                    ) +
                    " " +
                    (
                        transaction.transactionId || ""
                    ) +
                    " " +
                    (
                        transaction.type || ""
                    ) +
                    " " +
                    (
                        transaction.vipName || ""
                    )
                ).toLowerCase()
            )}"
        >

            <div class="transaction-card-header">

                <div>

                    <h3>
                        ${escapeHTML(typeText)}
                    </h3>

                    <small>
                        ID: ${id}
                    </small>

                </div>


                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="transaction-amount">

                <span>
                    Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <div class="transaction-info">

                <div class="info-row">

                    <span>
                        User UID
                    </span>

                    <strong>
                        ${uid}
                    </strong>

                </div>


                <div class="info-row">

                    <span>
                        Type
                    </span>

                    <strong>
                        ${escapeHTML(typeText)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${statusText}
                    </strong>

                </div>


                ${
                    transaction.transactionId
                    ? `
                    <div class="info-row">

                        <span>
                            Transaction ID
                        </span>

                        <strong>
                            ${transactionId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    transaction.paymentMethod ||
                    transaction.method
                    ? `
                    <div class="info-row">

                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${paymentMethod}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    transaction.phone ||
                    transaction.senderPhone ||
                    transaction.receiverPhone ||
                    transaction.withdrawPhone
                    ? `
                    <div class="info-row">

                        <span>
                            Phone
                        </span>

                        <strong>
                            ${phone}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    vipName
                    ? `
                    <div class="info-row">

                        <span>
                            VIP Plan
                        </span>

                        <strong>
                            ${vipName}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    withdrawRequestId
                    ? `
                    <div class="info-row">

                        <span>
                            Withdraw Request
                        </span>

                        <strong>
                            ${withdrawRequestId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    depositRequestId
                    ? `
                    <div class="info-row">

                        <span>
                            Deposit Request
                        </span>

                        <strong>
                            ${depositRequestId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                <div class="info-row">

                    <span>
                        Created At
                    </span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>


                ${
                    approvedAt
                    ? `
                    <div class="info-row">

                        <span>
                            Approved At
                        </span>

                        <strong>
                            ${approvedAt}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    rejectedAt
                    ? `
                    <div class="info-row">

                        <span>
                            Rejected At
                        </span>

                        <strong>
                            ${rejectedAt}
                        </strong>

                    </div>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}



// ======================================
// TRANSACTION SEARCH + FILTER
// ======================================

function activateTransactionSearch() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    if (
        !searchInput &&
        !filterSelect
    ) {
        return;
    }


    // --------------------------------------
    // PREVENT DUPLICATE LISTENERS
    // --------------------------------------

    if (
        searchInput &&
        searchInput.dataset.searchActive !== "true"
    ) {

        searchInput.dataset.searchActive =
            "true";


        searchInput.addEventListener(
            "input",
            applyTransactionFilters
        );
    }


    if (
        filterSelect &&
        filterSelect.dataset.filterActive !== "true"
    ) {

        filterSelect.dataset.filterActive =
            "true";


        filterSelect.addEventListener(
            "change",
            applyTransactionFilters
        );
    }
}



// ======================================
// APPLY TRANSACTION FILTERS
// ======================================

function applyTransactionFilters() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedFilter =
        normalizeStatus(
            filterSelect?.value ||
            "all"
        );


    const cards =
        document.querySelectorAll(
            "#transactionList .transaction-card"
        );


    cards.forEach(card => {

        const cardSearch =
            (
                card.dataset.search ||
                ""
            ).toLowerCase();


        const cardType =
            normalizeStatus(
                card.dataset.type ||
                ""
            );


        const cardStatus =
            normalizeStatus(
                card.dataset.status ||
                ""
            );


        // --------------------------------------
        // SEARCH MATCH
        // --------------------------------------

        const searchMatch =
            !search ||
            cardSearch.includes(search);


        // --------------------------------------
        // FILTER MATCH
        // --------------------------------------

        let filterMatch = true;


        if (
            selectedFilter &&
            selectedFilter !== "all"
        ) {

            if (
                selectedFilter === "approved" ||
                selectedFilter === "rejected" ||
                selectedFilter === "pending" ||
                selectedFilter === "processing"
            ) {

                filterMatch =
                    cardStatus ===
                    selectedFilter;

            } else {

                filterMatch =
                    cardType ===
                    selectedFilter;
            }
        }


        // --------------------------------------
        // DISPLAY
        // --------------------------------------

        card.style.display =
            searchMatch &&
            filterMatch
                ? ""
                : "none";

    });
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadTransactions =
    loadTransactions;

window.renderTransactionCard =
    renderTransactionCard;

window.activateTransactionSearch =
    activateTransactionSearch;

window.applyTransactionFilters =
    applyTransactionFilters;


