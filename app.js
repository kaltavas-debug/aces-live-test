const HOME_URL =
  "https://kaltavas-debug.github.io/aces-live-test/";

const checkoutModal =
  document.getElementById("checkoutModal");

const loginModal =
  document.getElementById("loginModal");

const accountModal =
  document.getElementById("accountModal");

const heroStreamBtn =
  document.getElementById("heroStreamBtn");

const navStreamBtn =
  document.getElementById("navStreamBtn");

const accountBtn =
  document.getElementById("accountBtn");

const logoutBtn =
  document.getElementById("logoutBtn");


/* ==========================================
   STATE
========================================== */

let isLoggedIn = false;
let cleengConnected = false;

let cleengJWT = null;
let cleengRefreshToken = null;


/* ==========================================
   MODALS
========================================== */

function closeAll() {
  document
    .querySelectorAll(".modal")
    .forEach(modal => {
      modal.classList.remove("active");
    });

  document.body.style.overflow = "";
}


function openModal(modal) {
  closeAll();

  modal.classList.add("active");

  document.body.style.overflow = "hidden";
}


/* ==========================================
   HEADER
========================================== */

function updateHeader() {

  if (isLoggedIn) {

    accountBtn.textContent =
      "MY ACCOUNT";

    logoutBtn.style.display =
      "inline-block";

  } else {

    accountBtn.textContent =
      "LOGIN";

    logoutBtn.style.display =
      "none";

  }

}


/* ==========================================
   STORE AUTH TOKENS
========================================== */

function saveTokens(jwt, refreshToken) {

  cleengJWT = jwt;
  cleengRefreshToken = refreshToken;

  if (jwt && refreshToken) {

    localStorage.setItem(
      "acesCleengJWT",
      jwt
    );

    localStorage.setItem(
      "acesCleengRefreshToken",
      refreshToken
    );

  } else {

    localStorage.removeItem(
      "acesCleengJWT"
    );

    localStorage.removeItem(
      "acesCleengRefreshToken"
    );

  }

}


/* ==========================================
   SYNC TOKENS INTO CLEENG
========================================== */

async function syncCleengAuth() {

  if (
    !cleengJWT ||
    !cleengRefreshToken
  ) {
    return false;
  }

  if (
    !window.cleeng ||
    typeof window.cleeng.setAuthTokens !==
      "function"
  ) {
    return false;
  }

  try {

    await window.cleeng.setAuthTokens({
      jwt: cleengJWT,
      refreshToken: cleengRefreshToken
    });

    console.log(
      "Cleeng tokens synced"
    );

    return true;

  } catch (error) {

    console.error(
      "Unable to sync Cleeng tokens:",
      error
    );

    return false;

  }

}


/* ==========================================
   CHECKOUT
========================================== */

async function openCheckout() {

  /*
   IMPORTANT:
   Push the authenticated session
   into every Hosted Widget before
   opening checkout.
  */

  if (isLoggedIn) {
    await syncCleengAuth();
  }


  const params =
    new URLSearchParams(
      window.location.search
    );

  console.log(
    "Coupon:",
    params.get("couponCode")
  );


  openModal(
    checkoutModal
  );

}


heroStreamBtn.addEventListener(
  "click",
  openCheckout
);


navStreamBtn.addEventListener(
  "click",
  openCheckout
);


/* ==========================================
   LOGIN / MY ACCOUNT
========================================== */

accountBtn.addEventListener(
  "click",
  async () => {

    if (isLoggedIn) {

      /*
       Also synchronize before
       opening Account.
      */

      await syncCleengAuth();

      openModal(
        accountModal
      );

    } else {

      openModal(
        loginModal
      );

    }

  }
);


/* ==========================================
   LOGOUT
========================================== */

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      if (
        window.cleeng &&
        typeof window.cleeng.logout ===
          "function"
      ) {

        await window.cleeng.logout();

      }

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }


    cleengJWT = null;
    cleengRefreshToken = null;

    isLoggedIn = false;

    localStorage.removeItem(
      "acesCleengJWT"
    );

    localStorage.removeItem(
      "acesCleengRefreshToken"
    );

    updateHeader();

    closeAll();

  }
);


/* ==========================================
   CLOSE DRAWERS
========================================== */

document
  .querySelectorAll(
    "[data-close-modal]"
  )
  .forEach(element => {

    element.addEventListener(
      "click",
      closeAll
    );

  });


document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {
      closeAll();
    }

  }
);


/* ==========================================
   CLEENG
========================================== */

function connectToCleeng() {

  if (
    !window.cleeng ||
    typeof window.cleeng
      .onAuthTokensUpdate !==
      "function"
  ) {

    setTimeout(
      connectToCleeng,
      200
    );

    return;

  }


  if (cleengConnected) {
    return;
  }


  cleengConnected = true;


  console.log(
    "Cleeng connected"
  );


  window.cleeng.onAuthTokensUpdate(
    async ({ jwt, refreshToken }) => {

      console.log(
        "Cleeng auth update:",
        {
          jwt: Boolean(jwt),
          refreshToken:
            Boolean(refreshToken)
        }
      );


      if (
        jwt &&
        refreshToken
      ) {

        /*
         Save the actual Cleeng session.
        */

        saveTokens(
          jwt,
          refreshToken
        );


        isLoggedIn = true;

        updateHeader();


        /*
         Explicitly synchronize
         authentication across all
         Hosted Widgets.
        */

        await syncCleengAuth();


        /*
         Close Login after success.
        */

        if (
          loginModal.classList.contains(
            "active"
          )
        ) {

          closeAll();

        }


      } else {

        saveTokens(
          null,
          null
        );

        isLoggedIn = false;

        updateHeader();

      }

    }
  );


  /* ======================================
     RESTORE EXISTING SESSION
  ====================================== */

  const storedJWT =
    localStorage.getItem(
      "acesCleengJWT"
    );

  const storedRefreshToken =
    localStorage.getItem(
      "acesCleengRefreshToken"
    );


  if (
    storedJWT &&
    storedRefreshToken
  ) {

    cleengJWT =
      storedJWT;

    cleengRefreshToken =
      storedRefreshToken;

    isLoggedIn = true;

    updateHeader();


    /*
     Restore authentication into
     the Cleeng widgets after reload.
    */

    syncCleengAuth();

  }

}


/* ==========================================
   INITIALIZE
========================================== */

updateHeader();

connectToCleeng();
