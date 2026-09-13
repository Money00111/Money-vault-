/* =========================================================
   MONEY VAULT - VIP.JS
   AUTOMATIC VIP PURCHASE + REFERRAL BONUS
   CURRENCY: RWF / FRW

   FEATURES
   ---------------------------------------------------------
   1. Load active VIP plans
   2. User can own multiple DIFFERENT VIP plans
   3. Same VIP plan cannot be purchased twice
   4. VIP purchase is automatic
   5. Balance is deducted by VIP price
   6. VIP becomes active immediately
   7. First daily claim is available after 24 hours
   8. Referral bonus = 1,000 RWF
   9. Referral bonus is paid once only
  10. Referrer gets:
      - balance +1000
      - referralBonus +1000
      - referralEarnings +1000
      - referralCount +1
  11. Purchase transaction is recorded
  12. Referral bonus transaction is recorded
  13. No duplicate VIP purchase
========================================================= */

import {
  auth,
  db
} from "./firebase.js";

import {
  ref,
  get,
  set,
  update,
  push,
  onValue,
  query,
  orderByChild,
  equalTo,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// =========================================================
// GLOBAL STATE
// =========================================================

let currentUser = null;
let vipPlans = {};
let userData = null;
let userVipPlans = {};
let vipPurchaseRequests = {};

let plansLoaded = false;
let userLoaded = false;

const REFERRAL_BONUS = 1000;
const CURRENCY = "RWF";
const DAY_MS = 24 * 60 * 60 * 1000;


// =========================================================
// DOM HELPERS
// =========================================================

function $(id) {
  return document.getElementById(id);
}

function show(id) {
  const el = $(id);
  if (el) el.style.display = "";
}

function hide(id) {
  const el = $(id);
  if (el) el.style.display = "none";
}

function money(value) {
  const n = Number(value || 0);

  return n.toLocaleString("en-US") + " RWF";
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================
// TOAST / MESSAGE
// =========================================================

function showMessage(message, type = "info") {
  console.log(`[VIP ${type}]`, message);

  let box = $("vipMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "vipMessage";

    box.style.position = "fixed";
    box.style.left = "15px";
    box.style.right = "15px";
    box.style.bottom = "20px";
    box.style.zIndex = "99999";
    box.style.padding = "14px";
    box.style.borderRadius = "10px";
    box.style.background = "#222";
    box.style.color = "#fff";
    box.style.textAlign = "center";
    box.style.fontSize = "14px";

    document.body.appendChild(box);
  }

  box.textContent = message;

  if (type === "error") {
    box.style.background = "#b00020";
  } else if (type === "success") {
    box.style.background = "#087f23";
  } else {
    box.style.background = "#222";
  }

  clearTimeout(box._timer);

  box._timer = setTimeout(() => {
    box.remove();
  }, 4500);
}


// =========================================================
// AUTH
// =========================================================

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentUser = null;

    hide("vipLoading");

    console.log("VIP: no authenticated user");

    return;
  }

  currentUser = user;

  console.log("VIP user:", user.uid);

  try {
    await loadUserData();
    await loadVipPlans();
    await loadUserVipPlans();
    await loadVipPurchaseRequests();

    renderEverything();

    hide("vipLoading");

  } catch (error) {
    console.error("VIP initialization error:", error);

    hide("vipLoading");

    showMessage(
      "VIP loading failed: " + (error?.message || "Unknown error"),
      "error"
    );
  }
});


// =========================================================
// LOAD USER
// =========================================================

async function loadUserData() {
  if (!currentUser) return;

  const snap = await get(
    ref(db, `users/${currentUser.uid}`)
  );

  if (!snap.exists()) {
    throw new Error("User account not found.");
  }

  userData = snap.val() || {};

  userLoaded = true;

  console.log("VIP user data loaded:", userData);
}


// =========================================================
// LOAD VIP PLANS
// =========================================================

async function loadVipPlans() {
  const snap = await get(
    ref(db, "vipPlans")
  );

  if (!snap.exists()) {
    vipPlans = {};
    plansLoaded = true;

    renderVipPlans();

    return;
  }

  vipPlans = snap.val() || {};

  plansLoaded = true;

  console.log("VIP plans:", vipPlans);

  renderVipPlans();
}


// =========================================================
// LOAD USER VIP PLANS
// =========================================================

async function loadUserVipPlans() {
  if (!currentUser) return;

  const snap = await get(
    ref(db, `users/${currentUser.uid}/vipPlans`)
  );

  userVipPlans = snap.exists()
    ? snap.val() || {}
    : {};

  console.log("Owned VIP plans:", userVipPlans);
}


// =========================================================
// LOAD PURCHASE REQUESTS
// =========================================================

async function loadVipPurchaseRequests() {
  if (!currentUser) return;

  try {
    const q = query(
      ref(db, "vipPurchaseRequests"),
      orderByChild("uid"),
      equalTo(currentUser.uid)
    );

    const snap = await get(q);

    vipPurchaseRequests = snap.exists()
      ? snap.val() || {}
      : {};

  } catch (error) {
    console.warn(
      "VIP purchase request loading failed:",
      error
    );

    vipPurchaseRequests = {};
  }
}


// =========================================================
// NORMALIZE PLAN ID
// =========================================================

function getPlanId(plan, fallbackId = "") {
  if (!plan) return fallbackId;

  /*
     IMPORTANT:
     Prefer actual Firebase key.

     This prevents problems such as:

     Starter
     starter
     STARTER

     becoming different IDs.
  */

  return String(
    plan.firebaseId ||
    plan.planId ||
    plan.id ||
    fallbackId
  );
}


// =========================================================
// PLAN DATA HELPERS
// =========================================================

function getPlanName(plan) {
  return (
    plan?.name ||
    plan?.vipName ||
    "VIP Plan"
  );
}

function getPlanPrice(plan) {
  return safeNumber(
    plan?.price
  );
}

function getPlanDailyIncome(plan) {
  return safeNumber(
    plan?.dailyIncome
  );
}

function getPlanDuration(plan) {
  return safeNumber(
    plan?.duration ??
    plan?.totalDays
  );
}

function getPlanTotalProfit(plan) {
  const existing = safeNumber(
    plan?.totalProfit
  );

  if (existing > 0) {
    return existing;
  }

  return (
    getPlanDailyIncome(plan) *
    getPlanDuration(plan)
  );
}

function isPlanActive(plan) {
  if (!plan) return false;

  if (
    plan.active === false ||
    plan.status === "inactive" ||
    plan.enabled === false
  ) {
    return false;
  }

  return true;
}


// =========================================================
// CHECK OWNED VIP
// =========================================================

function hasOwnedVip(planId) {
  if (!planId) return false;

  const owned = userVipPlans?.[planId];

  if (!owned) return false;

  return (
    owned.status === "active" ||
    owned.active === true ||
    owned.status === "completed" ||
    owned.status === "pending"
  );
}


// =========================================================
// CHECK PENDING PURCHASE
// =========================================================

function hasPendingPurchase(planId) {
  if (!planId) return false;

  for (const requestId in vipPurchaseRequests) {
    const request = vipPurchaseRequests[requestId];

    if (!request) continue;

    const requestPlanId =
      request.planId ||
      request.vipPlanId;

    if (
      requestPlanId === planId &&
      request.status === "pending"
    ) {
      return true;
    }
  }

  return false;
}


// =========================================================
// RENDER EVERYTHING
// =========================================================

function renderEverything() {
  renderVipPlans();
  renderOwnedVipPlans();
  renderBalance();
  renderClaimButton();
}


// =========================================================
// RENDER BALANCE
// =========================================================

function renderBalance() {
  const balance = safeNumber(
    userData?.balance
  );

  const elements = [
    "vipBalance",
    "balance",
    "userBalance",
    "currentBalance"
  ];

  elements.forEach((id) => {
    const el = $(id);

    if (!el) return;

    el.textContent = money(balance);
  });
}


// =========================================================
// RENDER VIP PLANS
// =========================================================

function renderVipPlans() {
  const grid =
    $("vipGrid") ||
    $("vipPlans") ||
    $("plansGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const entries = Object.entries(
    vipPlans || {}
  );

  if (!entries.length) {
    grid.innerHTML = `
      <div class="vip-empty">
        No VIP plans available.
      </div>
    `;

    return;
  }

  entries.forEach(([firebaseId, rawPlan]) => {
    if (!rawPlan) return;

    const plan = {
      ...rawPlan,
      firebaseId
    };

    if (!isPlanActive(plan)) return;

    const planId = getPlanId(
      plan,
      firebaseId
    );

    const name = getPlanName(plan);
    const price = getPlanPrice(plan);
    const daily = getPlanDailyIncome(plan);
    const duration = getPlanDuration(plan);
    const totalProfit = getPlanTotalProfit(plan);

    const owned = hasOwnedVip(planId);
    const pending = hasPendingPurchase(planId);

    let buttonText = "BUY NOW";
    let disabled = false;

    if (owned) {
      buttonText = "ALREADY OWNED";
      disabled = true;
    } else if (pending) {
      buttonText = "PROCESSING...";
      disabled = true;
    }

    const card = document.createElement("div");

    card.className = "vip-card";

    card.innerHTML = `
      <div class="vip-card-inner">

        <h3>${escapeHTML(name)}</h3>

        <div class="vip-price">
          ${money(price)}
        </div>

        <div class="vip-info">
          <div>
            <span>Daily Income</span>
            <strong>${money(daily)}</strong>
          </div>

          <div>
            <span>Duration</span>
            <strong>${duration} Days</strong>
          </div>

          <div>
            <span>Total Profit</span>
            <strong>${money(totalProfit)}</strong>
          </div>
        </div>

        <button
          class="buy-vip-btn"
          data-plan-id="${escapeHTML(planId)}"
          ${disabled ? "disabled" : ""}
        >
          ${buttonText}
        </button>

      </div>
    `;

    const button =
      card.querySelector(".buy-vip-btn");

    if (button && !disabled) {
      button.addEventListener(
        "click",
        () => buyVip(planId, plan)
      );
    }

    grid.appendChild(card);
  });
}


// =========================================================
// BUY VIP
// =========================================================

async function buyVip(planId, plan) {
  if (!currentUser) {
    showMessage(
      "Please login first.",
      "error"
    );

    return;
  }

  if (!plan) {
    showMessage(
      "VIP plan not found.",
      "error"
    );

    return;
  }

  if (!isPlanActive(plan)) {
    showMessage(
      "This VIP plan is not active.",
      "error"
    );

    return;
  }

  if (hasOwnedVip(planId)) {
    showMessage(
      "You already own this VIP plan.",
      "error"
    );

    return;
  }

  if (hasPendingPurchase(planId)) {
    showMessage(
      "This VIP purchase is already processing.",
      "error"
    );

    return;
  }

  const price = getPlanPrice(plan);

  if (price <= 0) {
    showMessage(
      "Invalid VIP price.",
      "error"
    );

    return;
  }

  const balance = safeNumber(
    userData?.balance
  );

  if (balance < price) {
    showMessage(
      `Insufficient balance. You need ${money(price)}.`,
      "error"
    );

    return;
  }

  const confirmed = confirm(
    `Buy ${getPlanName(plan)} for ${money(price)}?`
  );

  if (!confirmed) {
    return;
  }

  const now = Date.now();

  const requestRef =
    push(ref(db, "vipPurchaseRequests"));

  const requestId =
    requestRef.key;

  if (!requestId) {
    showMessage(
      "Could not create purchase ID.",
      "error"
    );

    return;
  }

  const userVipRef =
    ref(
      db,
      `users/${currentUser.uid}/vipPlans/${planId}`
    );

  try {

    /*
     * ------------------------------------------------------
     * STEP 1
     * Prevent duplicate purchase using a transaction.
     * ------------------------------------------------------
     */

    const vipTransaction =
      await runTransaction(
        userVipRef,
        (current) => {

          if (current) {
            return;
          }

          return {
            planId: planId,
            vipPlanId: planId,

            vipName: getPlanName(plan),

            price: price,

            dailyIncome:
              getPlanDailyIncome(plan),

            duration:
              getPlanDuration(plan),

            totalProfit:
              getPlanTotalProfit(plan),

            currency: CURRENCY,

            status: "active",

            active: true,

            purchasedAt: now,

            approvedAt: now,

            lastClaim: now,

            lastClaimTime: now,

            startDate: now,

            endDate:
              getPlanDuration(plan) > 0
                ? now +
                  getPlanDuration(plan) *
                    DAY_MS
                : null
          };
        }
      );

    if (!vipTransaction.committed) {
      showMessage(
        "This VIP plan is already owned.",
        "error"
      );

      return;
    }

    /*
     * ------------------------------------------------------
     * STEP 2
     * Deduct balance + update user totals + create request
     * + create buyer record in ONE update.
     *
     * NOTE:
     * Firebase Rules must allow the balance deduction.
     * ------------------------------------------------------
     */

    const currentBalance =
      safeNumber(userData?.balance);

    if (currentBalance < price) {

      /*
       * Remove the VIP if balance check fails.
       */

      await set(userVipRef, null);

      showMessage(
        "Insufficient balance.",
        "error"
      );

      return;
    }

    const updates = {};

    const newBalance =
      currentBalance - price;

    updates[
      `users/${currentUser.uid}/balance`
    ] = newBalance;

    updates[
      `users/${currentUser.uid}/totalTransactions`
    ] =
      safeNumber(
        userData?.totalTransactions
      ) + 1;

    updates[
      `users/${currentUser.uid}/totalEarnings`
    ] =
      safeNumber(
        userData?.totalEarnings
      );

    /*
     * Purchase request
     */

    updates[
      `vipPurchaseRequests/${requestId}`
    ] = {

      uid: currentUser.uid,

      planId: planId,

      vipPlanId: planId,

      vipName:
        getPlanName(plan),

      price: price,

      dailyIncome:
        getPlanDailyIncome(plan),

      duration:
        getPlanDuration(plan),

      totalProfit:
        getPlanTotalProfit(plan),

      paymentMethod:
        "Account Balance",

      currency:
        CURRENCY,

      status:
        "approved",

      autoApproved:
        true,

      approvedAt:
        now,

      createdAt:
        now
    };

    /*
     * VIP buyer record
     */

    updates[
      `vipBuyers/${requestId}`
    ] = {

      uid: currentUser.uid,

      requestId: requestId,

      planId: planId,

      vipPlanId: planId,

      vipName:
        getPlanName(plan),

      price: price,

      dailyIncome:
        getPlanDailyIncome(plan),

      duration:
        getPlanDuration(plan),

      totalProfit:
        getPlanTotalProfit(plan),

      currency:
        CURRENCY,

      status:
        "active",

      purchasedAt:
        now,

      approvedAt:
        now
    };

    /*
     * Purchase transaction
     */

    const transactionRef =
      push(ref(db, "transactions"));

    updates[
      `transactions/${transactionRef.key}`
    ] = {

      uid:
        currentUser.uid,

      type:
        "vip_purchase",

      category:
        "VIP",

      planId:
        planId,

      vipPlanId:
        planId,

      vipName:
        getPlanName(plan),

      amount:
        price,

      currency:
        CURRENCY,

      status:
        "approved",

      createdAt:
        now
    };

    await update(
      ref(db),
      updates
    );

    /*
     * Update local state
     */

    userData.balance =
      newBalance;

    userData.totalTransactions =
      safeNumber(
        userData.totalTransactions
      ) + 1;

    userVipPlans[planId] = {
      planId: planId,
      vipPlanId: planId,
      vipName: getPlanName(plan),
      price: price,
      dailyIncome:
        getPlanDailyIncome(plan),
      duration:
        getPlanDuration(plan),
      totalProfit:
        getPlanTotalProfit(plan),
      currency: CURRENCY,
      status: "active",
      active: true,
      purchasedAt: now,
      approvedAt: now,
      lastClaim: now,
      lastClaimTime: now,
      startDate: now,
      endDate:
        getPlanDuration(plan) > 0
          ? now +
            getPlanDuration(plan) *
              DAY_MS
          : null
    };

    vipPurchaseRequests[requestId] = {
      uid: currentUser.uid,
      planId: planId,
      vipPlanId: planId,
      status: "approved",
      createdAt: now
    };

    renderEverything();

    showMessage(
      `${getPlanName(plan)} purchased successfully!`,
      "success"
    );

    /*
     * ------------------------------------------------------
     * REFERRAL BONUS
     * ------------------------------------------------------
     */

    await payReferralBonus(
      currentUser.uid,
      requestId
    );

  } catch (error) {

    console.error(
      "VIP purchase error:",
      error
    );

    /*
     * If the purchase failed, remove the VIP created
     * by STEP 1.
     */

    try {
      await set(
        userVipRef,
        null
      );
    } catch (rollbackError) {
      console.error(
        "VIP rollback failed:",
        rollbackError
      );
    }

    showMessage(
      "VIP purchase failed: " +
      (
        error?.message ||
        "Permission denied"
      ),
      "error"
    );
  }
}


// =========================================================
// FIND REFERRER
// =========================================================

async function findReferrer(
  referredUserUid
) {
  if (!referredUserUid) {
    return null;
  }

  const referredUserSnap =
    await get(
      ref(
        db,
        `users/${referredUserUid}`
      )
    );

  if (!referredUserSnap.exists()) {
    return null;
  }

  const referredUser =
    referredUserSnap.val() || {};

  const referralCode =
    referredUser.referredBy;

  if (!referralCode) {
    return null;
  }

  /*
   * First try referralCodes.
   */

  const codeSnap =
    await get(
      ref(
        db,
        `referralCodes/${referralCode}`
      )
    );

  if (codeSnap.exists()) {

    const codeData =
      codeSnap.val() || {};

    if (
      codeData.uid &&
      codeData.uid !== referredUserUid
    ) {
      return {
        uid: codeData.uid,
        code: referralCode
      };
    }
  }

  /*
   * Fallback:
   * Search users by referralCode.
   */

  const usersQuery =
    query(
      ref(db, "users"),
      orderByChild("referralCode"),
      equalTo(referralCode)
    );

  const usersSnap =
    await get(usersQuery);

  if (!usersSnap.exists()) {
    return null;
  }

  let result = null;

  usersSnap.forEach((child) => {

    if (
      child.key !== referredUserUid &&
      !result
    ) {
      result = {
        uid: child.key,
        code: referralCode
      };
    }
  });

  return result;
}


// =========================================================
// PAY REFERRAL BONUS
// =========================================================

async function payReferralBonus(
  referredUserUid,
  purchaseRequestId
) {
  if (
    !referredUserUid ||
    !purchaseRequestId
  ) {
    return false;
  }

  try {

    /*
     * Find referrer
     */

    const referrer =
      await findReferrer(
        referredUserUid
      );

    if (!referrer) {

      console.log(
        "No referrer found."
      );

      return false;
    }

    const referrerUid =
      referrer.uid;

    if (
      referrerUid ===
      referredUserUid
    ) {
      console.warn(
        "Self referral blocked."
      );

      return false;
    }

    /*
     * ------------------------------------------------------
     * ONCE-ONLY CHECK
     * ------------------------------------------------------
     */

    const bonusRef =
      ref(
        db,
        `vipReferralBonuses/${referredUserUid}`
      );

    const existingBonus =
      await get(bonusRef);

    if (existingBonus.exists()) {

      console.log(
        "Referral bonus already paid."
      );

      return false;
    }

    /*
     * ------------------------------------------------------
     * Read referrer
     * ------------------------------------------------------
     */

    const referrerSnap =
      await get(
        ref(
          db,
          `users/${referrerUid}`
        )
      );

    if (!referrerSnap.exists()) {
      return false;
    }

    const referrerData =
      referrerSnap.val() || {};

    const oldBalance =
      safeNumber(
        referrerData.balance
      );

    const oldReferralBonus =
      safeNumber(
        referrerData.referralBonus
      );

    const oldReferralEarnings =
      safeNumber(
        referrerData.referralEarnings
      );

    const oldReferralCount =
      safeNumber(
        referrerData.referralCount
      );

    const now = Date.now();

    /*
     * ------------------------------------------------------
     * Atomic referral update
     * ------------------------------------------------------
     */

    const updates = {};

    updates[
      `users/${referrerUid}/balance`
    ] =
      oldBalance +
      REFERRAL_BONUS;

    updates[
      `users/${referrerUid}/referralBonus`
    ] =
      oldReferralBonus +
      REFERRAL_BONUS;

    updates[
      `users/${referrerUid}/referralEarnings`
    ] =
      oldReferralEarnings +
      REFERRAL_BONUS;

    updates[
      `users/${referrerUid}/referralCount`
    ] =
      oldReferralCount + 1;

    /*
     * Bonus marker.
     *
     * One referred user = one referral bonus.
     */

    updates[
      `vipReferralBonuses/${referredUserUid}`
    ] = {

      referredUserUid:
        referredUserUid,

      referrerUid:
        referrerUid,

      purchaseRequestId:
        purchaseRequestId,

      amount:
        REFERRAL_BONUS,

      currency:
        CURRENCY,

      status:
        "paid",

      createdAt:
        now
    };

    /*
     * Referral transaction
     */

    const transactionRef =
      push(ref(db, "transactions"));

    updates[
      `transactions/${transactionRef.key}`
    ] = {

      uid:
        referrerUid,

      type:
        "referral_bonus",

      category:
        "Referral",

      referredUserUid:
        referredUserUid,

      purchaseRequestId:
        purchaseRequestId,

      amount:
        REFERRAL_BONUS,

      currency:
        CURRENCY,

      status:
        "approved",

      createdAt:
        now
    };

    await update(
      ref(db),
      updates
    );

    console.log(
      "Referral bonus paid:",
      REFERRAL_BONUS,
      "to:",
      referrerUid
    );

    return true;

  } catch (error) {

    console.error(
      "Referral bonus failed:",
      error
    );

    return false;
  }
}


// =========================================================
// RENDER OWNED VIP PLANS
// =========================================================

function renderOwnedVipPlans() {

  const container =
    $("ownedVipList") ||
    $("ownedVipPlans");

  if (!container) return;

  container.innerHTML = "";

  const entries =
    Object.entries(
      userVipPlans || {}
    );

  if (!entries.length) {

    container.innerHTML = `
      <div class="vip-empty">
        You do not own any VIP plan yet.
      </div>
    `;

    return;
  }

  entries.forEach(
    ([planId, vip]) => {

      if (!vip) return;

      const name =
        vip.vipName ||
        vip.name ||
        "VIP Plan";

      const daily =
        safeNumber(
          vip.dailyIncome
        );

      const status =
        vip.status ||
        (
          vip.active
            ? "active"
            : "inactive"
        );

      const endDate =
        vip.endDate;

      let statusText =
        status;

      if (
        endDate &&
        Date.now() >= Number(endDate)
      ) {
        statusText = "expired";
      }

      const card =
        document.createElement("div");

      card.className =
        "owned-vip-card";

      card.innerHTML = `
        <div>
          <strong>
            ${escapeHTML(name)}
          </strong>

          <div>
            Daily:
            ${money(daily)}
          </div>

          <div>
            Status:
            ${escapeHTML(statusText)}
          </div>
        </div>
      `;

      container.appendChild(card);
    }
  );
}


// =========================================================
// CLAIM BUTTON
// =========================================================

function renderClaimButton() {

  const button =
    $("claimDailyIncome") ||
    $("claimIncomeBtn");

  if (!button) return;

  const activePlans =
    getActiveUserVipPlans();

  if (!activePlans.length) {

    button.disabled = true;

    button.textContent =
      "NO ACTIVE VIP";

    return;
  }

  const claimable =
    activePlans.some(
      ({ vip }) =>
        canClaimVip(vip)
    );

  button.disabled =
    !claimable;

  button.textContent =
    claimable
      ? "CLAIM DAILY INCOME"
      : "WAIT 24 HOURS";
}


// =========================================================
// GET ACTIVE USER VIP PLANS
// =========================================================

function getActiveUserVipPlans() {

  const result = [];

  Object.entries(
    userVipPlans || {}
  ).forEach(
    ([planId, vip]) => {

      if (!vip) return;

      const active =
        vip.status === "active" ||
        vip.active === true;

      if (!active) return;

      if (
        vip.endDate &&
        Date.now() >=
          Number(vip.endDate)
      ) {
        return;
      }

      result.push({
        planId,
        vip
      });
    }
  );

  return result;
}


// =========================================================
// CLAIM TIME
// =========================================================

function getLastClaim(vip) {

  return safeNumber(
    vip.lastClaim ||
    vip.lastClaimTime ||
    vip.approvedAt ||
    vip.purchasedAt
  );
}


// =========================================================
// CAN CLAIM
// =========================================================

function canClaimVip(vip) {

  const lastClaim =
    getLastClaim(vip);

  if (!lastClaim) {
    return true;
  }

  return (
    Date.now() -
      lastClaim >=
    DAY_MS
  );
}


// =========================================================
// CLAIM DAILY INCOME
// =========================================================

async function claimDailyIncome() {

  if (!currentUser) {
    showMessage(
      "Please login first.",
      "error"
    );

    return;
  }

  const activePlans =
    getActiveUserVipPlans();

  if (!activePlans.length) {
    showMessage(
      "You have no active VIP.",
      "error"
    );

    return;
  }

  const claimablePlans =
    activePlans.filter(
      ({ vip }) =>
        canClaimVip(vip)
    );

  if (!claimablePlans.length) {

    showMessage(
      "You must wait 24 hours before claiming again.",
      "error"
    );

    return;
  }

  const now =
    Date.now();

  let totalIncome = 0;

  const updates = {};

  claimablePlans.forEach(
    ({ planId, vip }) => {

      const income =
        safeNumber(
          vip.dailyIncome
        );

      if (income <= 0) {
        return;
      }

      totalIncome += income;

      updates[
        `users/${currentUser.uid}/vipPlans/${planId}/lastClaim`
      ] = now;

      updates[
        `users/${currentUser.uid}/vipPlans/${planId}/lastClaimTime`
      ] = now;
    }
  );

  if (totalIncome <= 0) {
    showMessage(
      "No income available.",
      "error"
    );

    return;
  }

  /*
   * NOTE:
   * This requires rules to permit the user's
   * daily income update.
   */

  const oldBalance =
    safeNumber(
      userData?.balance
    );

  const oldTotalEarnings =
    safeNumber(
      userData?.totalEarnings
    );

  const oldTransactions =
    safeNumber(
      userData?.totalTransactions
    );

  updates[
    `users/${currentUser.uid}/balance`
  ] =
    oldBalance +
    totalIncome;

  updates[
    `users/${currentUser.uid}/totalEarnings`
  ] =
    oldTotalEarnings +
    totalIncome;

  updates[
    `users/${currentUser.uid}/totalTransactions`
  ] =
    oldTransactions + 1;

  const transactionRef =
    push(ref(db, "transactions"));

  updates[
    `transactions/${transactionRef.key}`
  ] = {

    uid:
      currentUser.uid,

    type:
      "vip_daily_income",

    category:
      "VIP",

    amount:
      totalIncome,

    currency:
      CURRENCY,

    status:
      "approved",

    createdAt:
      now
  };

  try {

    await update(
      ref(db),
      updates
    );

    /*
     * Local state
     */

    userData.balance =
      oldBalance +
      totalIncome;

    userData.totalEarnings =
      oldTotalEarnings +
      totalIncome;

    userData.totalTransactions =
      oldTransactions + 1;

    claimablePlans.forEach(
      ({ planId }) => {

        if (
          userVipPlans[planId]
        ) {
          userVipPlans[
            planId
          ].lastClaim = now;

          userVipPlans[
            planId
          ].lastClaimTime = now;
        }
      }
    );

    renderEverything();

    showMessage(
      `You received ${money(totalIncome)}!`,
      "success"
    );

  } catch (error) {

    console.error(
      "Daily income claim failed:",
      error
    );

    showMessage(
      "Claim failed: " +
      (
        error?.message ||
        "Permission denied"
      ),
      "error"
    );
  }
}


// =========================================================
// CLAIM BUTTON EVENTS
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const buttons = [
      $("claimDailyIncome"),
      $("claimIncomeBtn")
    ];

    buttons.forEach(
      (button) => {

        if (!button) return;

        button.addEventListener(
          "click",
          claimDailyIncome
        );
      }
    );

  }
);


// =========================================================
// REALTIME USER VIP LISTENER
// =========================================================

function startVipListener() {

  if (!currentUser) return;

  onValue(
    ref(
      db,
      `users/${currentUser.uid}/vipPlans`
    ),
    (snap) => {

      userVipPlans =
        snap.exists()
          ? snap.val() || {}
          : {};

      renderOwnedVipPlans();
      renderClaimButton();
    },
    (error) => {

      console.error(
        "VIP listener error:",
        error
      );
    }
  );
}


// =========================================================
// REALTIME USER BALANCE LISTENER
// =========================================================

function startUserListener() {

  if (!currentUser) return;

  onValue(
    ref(
      db,
      `users/${currentUser.uid}`
    ),
    (snap) => {

      if (!snap.exists()) return;

      userData =
        snap.val() || {};

      renderBalance();
      renderClaimButton();
    },
    (error) => {

      console.error(
        "User listener error:",
        error
      );
    }
  );
}


// =========================================================
// START REALTIME LISTENERS
// =========================================================

auth.onAuthStateChanged(
  (user) => {

    if (!user) return;

    currentUser = user;

    startVipListener();
    startUserListener();
  }
);


// =========================================================
// EXPORTS
// =========================================================

window.buyVip =
  buyVip;

window.claimDailyIncome =
  claimDailyIncome;

window.payReferralBonus =
  payReferralBonus;

window.loadVipPlans =
  loadVipPlans;

window.renderVipPlans =
  renderVipPlans;

window.renderOwnedVipPlans =
  renderOwnedVipPlans;

console.log(
  "Money Vault VIP JS loaded - Automatic VIP + Referral Bonus"
);
