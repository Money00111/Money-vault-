oveWithdraw(
                selectedWithdrawId
            );

            closeWithdrawModal();

        }
    );


$("modalRejectWithdraw")
    ?.addEventListener(
        "click",
        async () => {

            if (!selectedWithdrawId) {
                return;
            }

            await rejectWithdraw(
                selectedWithdrawId
            );

            closeWithdrawModal();

        }
    );


/* =========================================================
   VIP REQUESTS
========================================================= */

function loadVipRequests() {

    onValue(
        ref(db, "vipPurchaseRequests"),
        (snapshot) => {

            allVipRequests = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allVipRequests[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderVipRequests();

        },
        (error) => {

            console.error(
                "VIP request listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER VIP REQUESTS
========================================================= */

function renderVipRequests() {

    const list =
        $("vipRequestList");

    const empty =
        $("emptyVipRequest");

    if (!list) {
        return;
    }


    const requests =
        Object.values(allVipRequests)
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;


    requests.forEach((data) => {

        const status =
            normalizeStatus(
                data.status
            );

        total++;

        if (status === "pending") {
            pending++;
        }

        if (status === "approved") {
            approved++;
        }

        if (status === "rejected") {
            rejected++;
        }

    });


    if ($("vipTotalCount")) {
        $("vipTotalCount").textContent =
            total;
    }

    if ($("vipPendingCount")) {
        $("vipPendingCount").textContent =
            pending;
    }

    if ($("vipApprovedCount")) {
        $("vipApprovedCount").textContent =
            approved;
    }

    if ($("vipRejectedCount")) {
        $("vipRejectedCount").textContent =
            rejected;
    }


    if (requests.length === 0) {

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


    list.innerHTML =
        requests
            .map(renderVipRequestCard)
            .join("");


    activateVipRequestButtons();
}


/* =========================================================
   VIP REQUEST CARD
========================================================= */

function renderVipRequestCard(data) {

    const status =
        normalizeStatus(data.status);

    const price =
        Number(
            data.price ||
            data.amount ||
            0
        );


    return `
        <div class="request-card">

            <div class="request-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            getUserName(data)
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            getEmail(data)
                        )}
                    </p>

                </div>

                <span class="status ${status}">
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>


            <div class="request-details">

                <p>
                    <strong>VIP Plan:</strong>
                    ${escapeHtml(
                        data.vipName ||
                        data.planName ||
                        data.name ||
                        "VIP"
                    )}
                </p>

                <p>
                    <strong>Price:</strong>
                    ${formatMoney(price)}
                </p>

                <p>
                    <strong>Duration:</strong>
                    ${escapeHtml(
                        data.duration ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Request Date:</strong>
                    ${formatDate(
                        data.createdAt
                    )}
                </p>

            </div>


            ${
                status === "pending"
                    ? `
                        <div class="action-buttons">

                            <button
                                class="approveVipBtn"
                                data-id="${escapeHtml(data.id)}">

                                <i class="fa-solid fa-circle-check"></i>
                                Approve

                            </button>

                            <button
                                class="rejectVipBtn"
                                data-id="${escapeHtml(data.id)}">

                                <i class="fa-solid fa-circle-xmark"></i>
                                Reject

                            </button>

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   VIP BUTTONS
========================================================= */

function activateVipRequestButtons() {

    document
        .querySelectorAll(".approveVipBtn")
        .forEach((button) => {

            button.onclick = () => {

                approveVipRequest(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".rejectVipBtn")
        .forEach((button) => {

            button.onclick = () => {

                rejectVipRequest(
                    button.dataset.id
                );

            };

        });

}

/* =========================================================
   FIND REFERRER
   MONEY VAULT - REFERRAL SYSTEM
   CURRENCY: RWF / FRW
========================================================= */

async function findReferrer(user) {

    try {

        if (!user || !user.uid) {
            return null;
        }

        const referralCode =
            user.referredBy ||
            user.referralCodeUsed ||
            "";

        if (!referralCode) {
            console.log("No referral code for user:", user.uid);
            return null;
        }

        const code = String(referralCode).trim();

        if (!code) {
            return null;
        }

        const referralSnap = await get(
            ref(db, "referralCodes/" + code)
        );

        if (!referralSnap.exists()) {
            console.log(
                "Referral code not found:",
                code
            );
            return null;
        }

        const referralData =
            referralSnap.val() || {};

        const referrerUid =
            referralData.uid ||
            referralData.userId ||
            referralData.referrerUid ||
            "";

        if (!referrerUid) {
            console.log(
                "Referrer UID missing for code:",
                code
            );
            return null;
        }

        if (referrerUid === user.uid) {
            console.log(
                "User cannot refer himself."
            );
            return null;
        }

        const referrerSnap = await get(
            ref(db, "users/" + referrerUid)
        );

        if (!referrerSnap.exists()) {
            console.log(
                "Referrer user not found:",
                referrerUid
            );
            return null;
        }

        return {
            uid: referrerUid,
            data: referrerSnap.val() || {}
        };

    } catch (error) {

        console.error(
            "Find referrer error:",
            error
        );

        return null;
    }
}



            // =========================================================
// MONEY VAULT
// APPROVE VIP REQUEST - FINAL FIX
// CURRENCY: RWF / FRW
//
// IMPORTANT:
// 1. DO NOT deduct balance here.
// 2. Buy Now already deducted balance.
// 3. VIP becomes active after approval.
// 4. First income claim is only after 24 hours.
// 5. Referral bonus = 1,000 RWF after approval.
// =========================================================

async function approveVipRequest(id) {

    if (!currentAdmin || !currentAdmin.uid) {
        alert("Admin not logged in.");
        return;
    }

    if (!confirm("Approve this VIP request?")) {
        return;
    }

    try {

        // =================================================
        // 1. GET REQUEST
        // =================================================

        const requestRef = ref(
            db,
            "vipPurchaseRequests/" + id
        );

        const requestSnap = await get(requestRef);

        if (!requestSnap.exists()) {
            throw new Error("VIP request not found.");
        }

        const oldRequest = requestSnap.val() || {};

        const oldStatus =
            String(oldRequest.status || "").toLowerCase();

        if (oldStatus === "approved") {
            alert("This VIP request is already approved.");
            return;
        }

        // =================================================
        // 2. USER ID
        // =================================================

        const uid =
            oldRequest.uid ||
            oldRequest.userId ||
            oldRequest.userUID ||
            "";

        if (!uid) {
            throw new Error("VIP request has no user ID.");
        }

        // =================================================
        // 3. VIP DATA
        // =================================================

        const vipName =
            oldRequest.vipName ||
            oldRequest.planName ||
            oldRequest.name ||
            "VIP Plan";

        const price = Number(
            oldRequest.price ??
            oldRequest.vipPrice ??
            oldRequest.amount ??
            0
        );

        const dailyIncome = Number(
            oldRequest.dailyIncome ??
            oldRequest.daily ??
            oldRequest.dailyProfit ??
            0
        );

        const totalProfitValue = Number(
            oldRequest.totalProfit ??
            oldRequest.profit ??
            oldRequest.total ??
            0
        );

        let duration = Number(
            oldRequest.duration ??
            oldRequest.durationDays ??
            oldRequest.days ??
            0
        );

        // =================================================
        // 4. VALIDATE VIP DATA
        // =================================================

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error("Invalid VIP price.");
        }

        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome <= 0
        ) {
            throw new Error("Invalid daily income.");
        }

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            if (
                totalProfitValue > 0 &&
                dailyIncome > 0
            ) {
                duration = Math.round(
                    totalProfitValue / dailyIncome
                );
            }
        }

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            throw new Error("Invalid VIP duration.");
        }

        const totalProfit =
            totalProfitValue > 0
                ? totalProfitValue
                : dailyIncome * duration;

        // =================================================
        // 5. VIP PLAN ID
        // =================================================

        const planId =
            String(
                oldRequest.vipPlanId ||
                oldRequest.planId ||
                oldRequest.planID ||
                "unknown"
            );

        // =================================================
        // 6. GET USER
        // =================================================

        const userRef = ref(
            db,
            "users/" + uid
        );

        const userSnap = await get(userRef);

        if (!userSnap.exists()) {
            throw new Error("User account not found.");
        }

        const user = userSnap.val() || {};

        // =================================================
        // IMPORTANT
        //
        // DO NOT TOUCH USER BALANCE HERE.
        //
        // Buy Now already deducted the VIP price.
        // =================================================

        // =================================================
        // 7. APPROVAL TIME
        // =================================================

        const approvedAt = Date.now();

        const endDate =
            approvedAt +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );

        // =================================================
        // 8. CREATE IDS
        // =================================================

        const vipBuyerKey =
            push(ref(db, "vipBuyers")).key;

        const userVipKey =
            push(
                ref(
                    db,
                    "users/" +
                    uid +
                    "/vipPlans"
                )
            ).key;

        if (!vipBuyerKey) {
            throw new Error(
                "Could not create VIP buyer ID."
            );
        }

        if (!userVipKey) {
            throw new Error(
                "Could not create user VIP ID."
            );
        }

        // =================================================
        // 9. VIP DATA
        // =================================================

        const vipData = {

            uid: uid,

            requestId: id,

            vipBuyerId: vipBuyerKey,

            vipPlanId: planId,

            planId: planId,

            vipName: vipName,

            price: price,

            dailyIncome: dailyIncome,

            totalProfit: totalProfit,

            duration: duration,

            totalDays: duration,

            remainingDays: duration,

            status: "active",

            purchasedAt:
                Number(
                    oldRequest.createdAt ||
                    approvedAt
                ),

            approvedAt: approvedAt,

            approvedBy:
                currentAdmin.uid,

            // =============================================
            // VERY IMPORTANT
            // NO IMMEDIATE DAILY INCOME
            // =============================================

            lastClaim: approvedAt,

            lastClaimTime: approvedAt,

            lastProfitTime: approvedAt,

            endDate: endDate,

            totalEarned: 0,

            earned: 0,

            claimedAmount: 0,

            claimCount: 0
        };

        // =================================================
        // 10. VIP BUYER
        // =================================================

        const vipBuyerData = {
            ...vipData,
            id: vipBuyerKey
        };

        // =================================================
        // 11. BUILD A COMPLETE REQUEST
        //
        // This is important because Firebase rules
        // validate the COMPLETE resulting request.
        // =================================================

        const approvedRequest = {

            ...oldRequest,

            uid: uid,

            vipPlanId: planId,

            planId: planId,

            vipName: vipName,

            price: price,

            dailyIncome: dailyIncome,

            totalProfit: totalProfit,

            duration: duration,

            currency: "RWF",

            paymentMethod:
                oldRequest.paymentMethod ||
                "Account Balance",

            createdAt:
                Number(
                    oldRequest.createdAt ||
                    approvedAt
                ),

            status: "approved",

            approvedAt: approvedAt,

            approvedBy:
                currentAdmin.uid,

            approvedByEmail:
                currentAdmin.email || "",

            processed: true,

            vipBuyerId: vipBuyerKey,

            userVipId: userVipKey,

            endDate: endDate,

            // Balance was already deducted when Buy Now
            balanceDeducted: true
        };

        // =================================================
        // 12. PREPARE UPDATE
        // =================================================

        const updates = {};

        // -----------------------------------------------
        // USER VIP PLAN
        // -----------------------------------------------

        updates[
            "users/" +
            uid +
            "/vipPlans/" +
            userVipKey
        ] = vipData;

        // -----------------------------------------------
        // VIP BUYER
        // -----------------------------------------------

        updates[
            "vipBuyers/" +
            vipBuyerKey
        ] = vipBuyerData;

        // -----------------------------------------------
        // VIP REQUEST
        // -----------------------------------------------

        updates[
            "vipPurchaseRequests/" +
            id
        ] = approvedRequest;

        // =================================================
        // 13. REFERRAL BONUS
        // =================================================

        let referralPaid = false;
        let referrerUid = "";
        let referralBonusId = "";

        const referralCode =
            user.referredBy ||
            user.referralCodeUsed ||
            "";

        if (referralCode) {

            try {

                const codeSnap = await get(
                    ref(
                        db,
                        "referralCodes/" +
                        referralCode
                    )
                );

                if (codeSnap.exists()) {

                    const codeData =
                        codeSnap.val() || {};

                    referrerUid =
                        codeData.uid || "";

                    // Prevent self referral
                    if (referrerUid === uid) {
                        referrerUid = "";
                    }
                }

                if (referrerUid) {

                    const referrerSnap =
                        await get(
                            ref(
                                db,
                                "users/" +
                                referrerUid
                            )
                        );

                    if (referrerSnap.exists()) {

                        // ---------------------------------
                        // CHECK EXISTING BONUS
                        // ---------------------------------

                        const bonusesSnap =
                            await get(
                                ref(
                                    db,
                                    "vipReferralBonuses"
                                )
                            );

                        let alreadyPaid = false;

                        if (bonusesSnap.exists()) {

                            bonusesSnap.forEach(child => {

                                const bonus =
                                    child.val() || {};

                                if (
                                    String(
                                        bonus.requestId || ""
                                    ) === String(id) &&
                                    String(
                                        bonus.status || ""
                                    ).toLowerCase()
                                    === "paid"
                                ) {
                                    alreadyPaid = true;
                                }
                            });
                        }

                        // ---------------------------------
                        // PAY ONLY ONCE
                        // ---------------------------------

                        if (!alreadyPaid) {

                            const referrer =
                                referrerSnap.val() || {};

                            referralBonusId =
                                push(
                                    ref(
                                        db,
                                        "vipReferralBonuses"
                                    )
                                ).key;

                            if (referralBonusId) {

                                const oldBalance =
                                    Number(
                                        referrer.balance || 0
                                    );

                                const oldBonus =
                                    Number(
                                        referrer.referralBonus || 0
                                    );

                                const oldEarnings =
                                    Number(
                                        referrer.referralEarnings || 0
                                    );

                                const oldCount =
                                    Number(
                                        referrer.referralCount || 0
                                    );

                                // --------------------------------
                                // +1,000 RWF
                                // --------------------------------

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/balance"
                                ] =
                                    oldBalance + 1000;

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/referralBonus"
                                ] =
                                    oldBonus + 1000;

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/referralEarnings"
                                ] =
                                    oldEarnings + 1000;

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/referralCount"
                                ] =
                                    oldCount + 1;

                                updates[
                                    "vipReferralBonuses/" +
                                    referralBonusId
                                ] = {

                                    referrerUid:
                                        referrerUid,

                                    referredUserUid:
                                        uid,

                                    requestId:
                                        id,

                                    amount: 1000,

                                    currency: "RWF",

                                    status: "paid",

                                    createdAt:
                                        approvedAt
                                };

                                referralPaid = true;
                            }
                        }
                    }
                }

            } catch (refError) {

                console.error(
                    "Referral bonus error:",
                    refError
                );

                // VIP approval should not fail just
                // because referral lookup failed.
                referralPaid = false;
                referrerUid = "";
                referralBonusId = "";
            }
        }

        // =================================================
        // 14. ADD REFERRAL STATUS TO REQUEST
        // =================================================

        updates[
            "vipPurchaseRequests/" +
            id +
            "/referralBonusPaid"
        ] = referralPaid;

        if (referrerUid) {

            updates[
                "vipPurchaseRequests/" +
                id +
                "/referrerUid"
            ] = referrerUid;
        }

        if (referralBonusId) {

            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonusId"
            ] = referralBonusId;
        }

        // =================================================
        // 15. SINGLE ATOMIC UPDATE
        // =================================================

        console.log(
            "VIP approval update paths:",
            Object.keys(updates)
        );

        await update(
            ref(db),
            updates
        );

        // =================================================
        // 16. SUCCESS
        // =================================================

        alert(
            referralPaid
                ? "VIP approved successfully. 1,000 RWF referral bonus paid."
                : "VIP approved successfully."
        );

        if (
            typeof loadVipRequests ===
            "function"
        ) {
            loadVipRequests();
        }

        if (
            typeof loadVipBuyers ===
            "function"
        ) {
            loadVipBuyers();
        }

    } catch (error) {

        console.error(
            "VIP APPROVE ERROR:",
            error
        );

        console.error(
            "ERROR CODE:",
            error?.code
        );

        console.error(
            "ERROR MESSAGE:",
            error?.message
        );

        alert(
            "VIP approve failed: " +
            (
                error?.message ||
                "Update failed"
            )
        );
    }
}

        // --------------------------------------
        // APPROVE REQUEST
        // --------------------------------------

        updates[
            "vipPurchaseRequests/" + id
        ] = {
            ...request,

            status: "approved",

            approvedAt: approvedAt,

            approvedBy:
                currentAdmin.uid,

            approvedByEmail:
                currentAdmin.email || "",

            processed: true,

            vipBuyerId: vipBuyerId,

            userVipId: userVipId,

            endDate: endDate,

            // Keep balance untouched.
            balanceDeducted: true
        };

        // ======================================
        // 11. REFERRAL BONUS
        // ======================================

        let referralPaid = false;
        let referrerUid = null;
        let referralBonusId = null;

        const referredBy =
            user.referredBy ||
            user.referralCodeUsed ||
            "";

        if (referredBy) {

            try {

                let referrerCodeSnap =
                    await get(
                        ref(
                            db,
                            "referralCodes/" +
                            referredBy
                        )
                    );

                if (referrerCodeSnap.exists()) {

                    const referralCodeData =
                        referrerCodeSnap.val() || {};

                    referrerUid =
                        referralCodeData.uid ||
                        null;

                    // Prevent self-referral
                    if (referrerUid === uid) {
                        referrerUid = null;
                    }
                }

                // ----------------------------------
                // FIND REFERRER
                // ----------------------------------

                if (referrerUid) {

                    const referrerSnap =
                        await get(
                            ref(
                                db,
                                "users/" +
                                referrerUid
                            )
                        );

                    if (referrerSnap.exists()) {

                        const referrer =
                            referrerSnap.val() || {};

                        // --------------------------------
                        // CHECK IF THIS REQUEST ALREADY
                        // RECEIVED REFERRAL BONUS
                        // --------------------------------

                        const bonusesSnap =
                            await get(
                                ref(
                                    db,
                                    "vipReferralBonuses"
                                )
                            );

                        let alreadyPaid = false;

                        if (bonusesSnap.exists()) {

                            bonusesSnap.forEach(
                                child => {

                                    const bonus =
                                        child.val() || {};

                                    if (
                                        String(
                                            bonus.requestId ||
                                            ""
                                        ) === String(id) &&
                                        String(
                                            bonus.status ||
                                            ""
                                        ).toLowerCase()
                                        === "paid"
                                    ) {
                                        alreadyPaid = true;
                                    }
                                }
                            );
                        }

                        if (!alreadyPaid) {

                            referralBonusId =
                                push(
                                    ref(
                                        db,
                                        "vipReferralBonuses"
                                    )
                                ).key;

                            if (referralBonusId) {

                                const oldBalance =
                                    Number(
                                        referrer.balance || 0
                                    );

                                const oldReferralBonus =
                                    Number(
                                        referrer.referralBonus || 0
                                    );

                                const oldReferralEarnings =
                                    Number(
                                        referrer.referralEarnings || 0
                                    );

                                const oldReferralCount =
                                    Number(
                                        referrer.referralCount || 0
                                    );

                                // --------------------------------
                                // REFERRAL BONUS = 1,000 RWF
                                // --------------------------------

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/balance"
                                ] =
                                    oldBalance + 1000;

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/referralBonus"
                                ] =
                                    oldReferralBonus + 1000;

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/referralEarnings"
                                ] =
                                    oldReferralEarnings + 1000;

                                updates[
                                    "users/" +
                                    referrerUid +
                                    "/referralCount"
                                ] =
                                    oldReferralCount + 1;

                                // --------------------------------
                                // REFERRAL BONUS RECORD
                                // --------------------------------

                                updates[
                                    "vipReferralBonuses/" +
                                    referralBonusId
                                ] = {

                                    referrerUid:
                                        referrerUid,

                                    referredUserUid:
                                        uid,

                                    requestId:
                                        id,

                                    amount: 1000,

                                    currency: "RWF",

                                    status: "paid",

                                    createdAt:
                                        approvedAt
                                };

                                referralPaid = true;
                            }
                        }
                    }
                }

            } catch (referralError) {

                console.error(
                    "Referral bonus check error:",
                    referralError
                );

                // Do not stop VIP approval because
                // referral lookup failed.
                referrerUid = null;
                referralPaid = false;
            }
        }

        // ======================================
        // 12. MARK REFERRAL STATUS ON REQUEST
        // ======================================

        updates[
            "vipPurchaseRequests/" + id +
            "/referralBonusPaid"
        ] = referralPaid;

        if (referrerUid) {

            updates[
                "vipPurchaseRequests/" + id +
                "/referrerUid"
            ] = referrerUid;
        }

        if (referralBonusId) {

            updates[
                "vipPurchaseRequests/" + id +
                "/referralBonusId"
            ] = referralBonusId;
        }

        // ======================================
        // 13. SAVE EVERYTHING AT ONCE
        // ======================================

        await update(
            ref(db),
            updates
        );

        // ======================================
        // 14. SUCCESS
        // ======================================

        alert(
            referralPaid
                ? "VIP approved successfully. Referral bonus of 1,000 RWF was paid."
                : "VIP approved successfully."
        );

        // Reload the VIP request list
        if (typeof loadVipRequests === "function") {
            loadVipRequests();
        }

        // Reload VIP buyers if function exists
        if (typeof loadVipBuyers === "function") {
            loadVipBuyers();
        }

    } catch (error) {

        console.error(
            "VIP approval error:",
            error
        );

        console.error(
            "VIP approval error code:",
            error?.code
        );

        console.error(
            "VIP approval error message:",
            error?.message
        );

        alert(
            "VIP approve failed: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}

            
            


/* =========================================================
   REJECT VIP REQUEST
========================================================= */

async function rejectVipRequest(id) {

    if (!currentAdmin) {
        return;
    }


    if (
        !confirm(
            "Reject this VIP purchase?"
        )
    ) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );

        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "VIP request not found.",
                "error"
            );

            return;
        }


        const data =
            snapshot.val() || {};

        const status =
            normalizeStatus(
                data.status
            );


        if (status !== "pending") {

            showToast(
                `This VIP request is already ${status}.`,
                "warning"
            );

            return;
        }


        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid,

                rejectedByEmail:
                    currentAdmin.email || ""

            }
        );


        showToast(
            "VIP request rejected.",
            "success"
        );


    } catch (error) {

        console.error(
            "Reject VIP:",
            error
        );

        showToast(
            error.message ||
            "Failed to reject VIP request.",
            "error"
        );

    }

}


/* =========================================================
   VIP BUYERS
========================================================= */

function loadVipBuyers() {

    onValue(
        ref(db, "vipBuyers"),
        (snapshot) => {

            allVipBuyers = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allVipBuyers[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderVipBuyers();

        },
        (error) => {

            console.error(
                "VIP buyers listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER VIP BUYERS
========================================================= */

function renderVipBuyers() {

    const list =
        $("vipBuyerList");

    const empty =
        $("emptyVipBuyer");

    if (!list) {
        return;
    }


    const buyers =
        Object.values(allVipBuyers);


    let active = 0;
    let expired = 0;


    buyers.forEach((data) => {

        const endDate =
            Number(
                data.endDate ||
                data.vipEndDate ||
                0
            );


        const isActive =
            (
                data.active === true ||
                data.status === "active"
            ) &&
            (
                !endDate ||
                endDate > Date.now()
            );


        if (isActive) {
            active++;
        } else {
            expired++;
        }

    });


    if ($("vipBuyerTotalCount")) {
        $("vipBuyerTotalCount").textContent =
            buyers.length;
    }

    if ($("vipBuyerActiveCount")) {
        $("vipBuyerActiveCount").textContent =
            active;
    }

    if ($("vipBuyerExpiredCount")) {
        $("vipBuyerExpiredCount").textContent =
            expired;
    }


    if (buyers.length === 0) {

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


    list.innerHTML =
        buyers
            .sort(
                (a, b) =>
                    Number(
                        b.startDate || 0
                    ) -
                    Number(
                        a.startDate || 0
                    )
            )
            .map((data) => {

                const endDate =
                    Number(
                        data.endDate ||
                        data.vipEndDate ||
                        0
                    );

                const isActive =
                    (
                        data.active === true ||
                        data.status === "active"
                    ) &&
                    (
                        !endDate ||
                        endDate > Date.now()
                    );


                return `
                    <div class="request-card">

                        <div class="request-header">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        data.fullName ||
                                        data.name ||
                                        data.email ||
                                        "VIP User"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        data.email ||
                                        data.userEmail ||
                                        "-"
                                    )}
                                </p>

                            </div>

                            <span class="status ${
                                isActive
                                    ? "approved"
                                    : "rejected"
                            }">

                                ${
                                    isActive
                                        ? "ACTIVE"
                                        : "EXPIRED"
                                }

                            </span>

                        </div>


                        <div class="request-details">

                            <p>
                                <strong>VIP:</strong>
                                ${escapeHtml(
                                    data.vipPlan ||
                                    data.vipName ||
                                    "VIP"
                                )}
                            </p>

                            <p>
                                <strong>Daily Income:</strong>
                                ${formatMoney(
                                    data.dailyIncome || 0
                                )}
                            </p>

                            <p>
                                <strong>Start:</strong>
                                ${formatDate(
                                    data.startDate
                                )}
                            </p>

                            <p>
                                <strong>End:</strong>
                                ${formatDate(
                                    data.endDate
                                )}
                            </p>

                            <p>
                                <strong>Total Earned:</strong>
                                ${formatMoney(
                                    data.totalEarned || 0
                                )}
                            </p>

                        </div>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   BONUS REQUESTS
========================================================= */

function loadBonusRequests() {

    onValue(
        ref(db, "bonusRequests"),
        (snapshot) => {

            allBonusRequests = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allBonusRequests[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderBonusRequests();

        },
        (error) => {

            console.error(
                "Bonus request listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER BONUS REQUESTS
========================================================= */

function renderBonusRequests() {

    const list =
        $("bonusRequestList");

    const empty =
        $("emptyBonusRequest");

    if (!list) {
        return;
    }


    const requests =
        Object.values(allBonusRequests)
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (requests.length === 0) {

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


    list.innerHTML =
        requests
            .map((data) => {

                const status =
                    normalizeStatus(
                        data.status
                    );


                return `
                    <div class="request-card">

                        <div class="request-header">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        getUserName(data)
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        getEmail(data)
                                    )}
                                </p>

                            </div>

                            <span class="status ${status}">
                                ${escapeHtml(
                                    status.toUpperCase()
                                )}
                            </span>

                        </div>


                        <div class="request-details">

                            <p>
                                <strong>Amount:</strong>
                                ${formatMoney(
                                    data.amount || 0
                                )}
                            </p>

                            <p>
                                <strong>Type:</strong>
                                ${escapeHtml(
                                    data.type ||
                                    "Bonus"
                                )}
                            </p>

                            <p>
                                <strong>Date:</strong>
                                ${formatDate(
                                    data.createdAt
                                )}
                            </p>

                        </div>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   USERS
========================================================= */

function loadUsers() {

    onValue(
        ref(db, "users"),
        (snapshot) => {

            allUsers = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allUsers[child.key] =
                        {
                            uid: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderUsers();

        },
        (error) => {

            console.error(
                "Users listener:",
                error
            );

            showToast(
                "Unable to load users.",
                "error"
            );

        }
    );

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    const list =
        $("usersList");

    const empty =
        $("emptyUsers");

    if (!list) {
        return;
    }


    const search =
        (
            $("userSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const users =
        Object.values(allUsers)
            .filter((user) => {

                if (!search) {
                    return true;
                }

                const text =
                    [
                        user.fullName,
                        user.name,
                        user.email,
                        user.phone,
                        user.country,
                        user.vip,
                        user.vipPlan
                    ]
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);

            })
            .sort(
                (a, b) =>
                    String(
                        a.fullName ||
                        a.name ||
                        ""
                    )
                    .localeCompare(
                        String(
                            b.fullName ||
                            b.name ||
                            ""
                        )
                    )
            );


    if (users.length === 0) {

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


    list.innerHTML =
        users
            .map(renderUserCard)
            .join("");

}


/* =========================================================
   USER CARD
========================================================= */

function renderUserCard(user) {

    const vip =
        user.vipPlan ||
        user.vip ||
        "VIP 0";


    return `
        <div class="user-card">

            <div class="user-header">

                <div class="user-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>

                <div>

                    <h3>
                        ${escapeHtml(
                            getUserName(user)
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            getEmail(user)
                        )}
                    </p>

                </div>

            </div>


            <div class="user-details">

                <p>
                    <strong>Phone:</strong>
                    ${escapeHtml(
                        user.phone ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Balance:</strong>
                    ${formatMoney(
                        user.balance || 0
                    )}
                </p>

                <p>
                    <strong>VIP:</strong>
                    ${escapeHtml(
                        vip
                    )}
                </p>

                <p>
                    <strong>Deposits:</strong>
                    ${formatMoney(
                        user.totalDeposit ||
                        user.totalDeposits ||
                        0
                    )}
                </p>

                <p>
                    <strong>Withdraws:</strong>
                    ${formatMoney(
                        user.totalWithdraw ||
                        user.totalWithdraws ||
                        0
                    )}
                </p>

                <p>
                    <strong>Referral Earnings:</strong>
                    ${formatMoney(
                        user.referralEarnings ||
                        0
                    )}
                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   TRANSACTIONS
========================================================= */

function loadTransactions() {

    onValue(
        ref(db, "transactions"),
        (snapshot) => {

            allTransactions = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allTransactions[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderTransactions();

        },
        (error) => {

            console.error(
                "Transactions listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

    const list =
        $("transactionList");

    const empty =
        $("emptyTransaction");

    if (!list) {
        return;
    }


    const search =
        (
            $("transactionSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();

    const filter =
        $("transactionFilter")?.value ||
        "all";


    const transactions =
        Object.values(allTransactions)
            .filter((data) => {

                const status =
                    normalizeStatus(
                        data.status
                    );

                const type =
                    String(
                        data.type ||
                        data.category ||
                        ""
                    )
                    .toLowerCase();


                if (filter !== "all") {

                    const filterValue =
                        filter.toLowerCase();


                    const typeMatches =
                        type === filterValue;


                    const statusMatches =
                        status === filterValue;


                    if (
                        !typeMatches &&
                        !statusMatches
                    ) {
                        return false;
                    }

                }


                if (!search) {
                    return true;
                }


                const text =
                    [
                        data.uid,
                        data.email,
                        data.type,
                        data.category,
                        data.description,
                        data.requestId,
                        data.vipPlan
                    ]
                    .join(" ")
                    .toLowerCase();


                return text.includes(
                    search
                );

            })
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (transactions.length === 0) {

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


    list.innerHTML =
        transactions
            .map(renderTransactionCard)
            .join("");

}


/* =========================================================
   TRANSACTION CARD
========================================================= */

function renderTransactionCard(data) {

    const status =
        normalizeStatus(
            data.status
        );


    const type =
        data.type ||
        data.category ||
        "transaction";


    const amount =
        Number(
            data.amount || 0
        );


    return `
        <div class="request-card">

            <div class="request-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            String(type)
                                .toUpperCase()
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            data.email ||
                            data.uid ||
                            "-"
                        )}
                    </p>

                </div>

                <span class="status ${status}">
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>


            <div class="request-details">

                <p>
                    <strong>Amount:</strong>
                    ${formatMoney(amount)}
                </p>

                <p>
                    <strong>Type:</strong>
                    ${escapeHtml(
                        type
                    )}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${escapeHtml(
                        data.description ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formatDate(
                        data.createdAt
                    )}
                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   SEARCH + FILTERS
========================================================= */

function initializeSearchFilters() {

    $("depositSearch")
        ?.addEventListener(
            "input",
            renderDeposits
        );

    $("depositFilter")
        ?.addEventListener(
            "change",
            renderDeposits
        );


    $("withdrawSearch")
        ?.addEventListener(
            "input",
            renderWithdraws
        );

    $("withdrawFilter")
        ?.addEventListener(
            "change",
            renderWithdraws
        );


    $("userSearch")
        ?.addEventListener(
            "input",
            renderUsers
        );


    $("transactionSearch")
        ?.addEventListener(
            "input",
            renderTransactions
        );

    $("transactionFilter")
        ?.addEventListener(
            "change",
            renderTransactions
        );

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function initializeQuickActions() {

    $("refreshDashboard")
        ?.addEventListener(
            "click",
            () => {

                loadDashboardData();

                showToast(
                    "Dashboard refreshed.",
                    "success"
                );

            }
        );


    $("refreshDashboardQuick")
        ?.addEventListener(
            "click",
            () => {

                loadDashboardData();

                showToast(
                    "Dashboard refreshed.",
                    "success"
                );

            }
        );


    $("openDeposits")
        ?.addEventListener(
            "click",
            () => openPage("deposits")
        );


    $("openWithdraws")
        ?.addEventListener(
            "click",
            () => openPage("withdraws")
        );


    $("openUsers")
        ?.addEventListener(
            "click",
            () => openPage("users")
        );


    $("openTransactions")
        ?.addEventListener(
            "click",
            () => openPage("transactions")
        );


    $("openSettings")
        ?.addEventListener(
            "click",
            () => openPage("settings")
        );


    $("openVipRequests")
        ?.addEventListener(
            "click",
            () => openPage("vipRequests")
        );


    $("openUsersBtn")
        ?.addEventListener(
            "click",
            () => openPage("users")
        );


    $("openTransactionsBtn")
        ?.addEventListener(
            "click",
            () => openPage("transactions")
        );


    $("openSettingsBtn")
        ?.addEventListener(
            "click",
            () => openPage("settings")
        );


    $("approveAllDeposits")
        ?.addEventListener(
            "click",
            approveAllPendingDeposits
        );


    $("approveAllWithdraws")
        ?.addEventListener(
            "click",
            approveAllPendingWithdraws
        );

}


/* =========================================================
   APPROVE ALL DEPOSITS
========================================================= */

async function approveAllPendingDeposits() {

    const pending =
        Object.values(allDeposits)
            .filter(
                (data) =>
                    normalizeStatus(
                        data.status
                    ) === "pending"
            );


    if (pending.length === 0) {

        showToast(
            "No pending deposits.",
            "info"
        );

        return;
    }


    if (
        !confirm(
            `Approve ${pending.length} pending deposit(s)?`
        )
    ) {
        return;
    }


    let success = 0;


    for (const deposit of pending) {

        try {

            await approveDeposit(
                deposit.id
            );

            success++;

        } catch (error) {

            console.error(error);

        }

    }


    showToast(
        `${success} deposit(s) processed.`,
        "success"
    );

}


/* =========================================================
   APPROVE ALL WITHDRAWS
========================================================= */

async function approveAllPendingWithdraws() {

    const pending =
        Object.values(allWithdraws)
            .filter(
                (data) =>
                    normalizeStatus(
                        data.status
                    ) === "pending"
            );


    if (pending.length === 0) {

        showToast(
            "No pending withdraws.",
            "info"
        );

        return;
    }


    if (
        !confirm(
            `Approve ${pending.length} pending withdraw(s)?`
        )
    ) {
        return;
    }


    let success = 0;


    for (const withdraw of pending) {

        try {

            await approveWithdraw(
                withdraw.id
            );

            success++;

        } catch (error) {

            console.error(error);

        }

    }


    showToast(
        `${success} withdraw(s) processed.`,
        "success"
    );

}


/* =========================================================
   SETTINGS
========================================================= */

function initializeSettings() {

    $("saveSettings")
        ?.addEventListener(
            "click",
            saveAdminSettings
        );

}


/* =========================================================
   SAVE ADMIN SETTINGS
========================================================= */

async function saveAdminSettings() {

    if (!currentAdmin) {
        return;
    }


    const input =
        $("adminNameInput");

    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (!name) {

        showToast(
            "Admin name cannot be empty.",
            "warning"
        );

        return;
    }


    try {

        await update(
            ref(
                db,
                `admins/${currentAdmin.uid}`
            ),
            {

                name:
                    name,

                updatedAt:
                    Date.now()

            }
        );


        adminData =
            {
                ...(adminData || {}),
                name:
                    name
            };


        loadAdminInformation();


        showToast(
            "Admin settings saved.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save admin settings:",
            error
        );

        showToast(
            error.message ||
            "Could not save settings.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

$("withdrawModal")
    ?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                $("withdrawModal")
            ) {

                closeWithdrawModal();

            }

        }
    );


/* =========================================================
   WINDOW EVENTS
========================================================= */

window.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeWithdrawModal();

        }

    }
);


/* =========================================================
   INITIAL CONSOLE
========================================================= */

console.log(
    "=========================================="
);

console.log(
    "💰 MONEY VAULT ADMIN.JS"
);

console.log(
    "Firebase Realtime Database"
);

console.log(
    "Admin verification: admins/{uid}"
);

console.log(
    "Currency: RWF / FRW"
);

console.log(
    "Status: pending / approved / rejected"
);

console.log(
    "=========================================="
);
