/* ==========================================
   CONFIG
========================================== */

const STATIC_CHECKOUT_URL =
  "https://kaltavas-debug.github.io/aces-live-test/?couponCode=NEVERFOLD";


/* ==========================================
   ELEMENTS
========================================== */

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
   TOKEN STORAGE
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
   SYNC AUTH WITH CLEENG
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
      "Cleeng authentication synced"
    );


    return true;


  } catch (error) {

    console.error(
      "Cleeng auth sync failed:",
      error
    );


    return false;

  }

}


/* ==========================================
   CHECKOUT
========================================== */

async function openCheckout() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const coupon =
    params.get("couponCode");


  /*
   Always force checkout to use:

   ?couponCode=NEVERFOLD
  */

  if (coupon !== "NEVERFOLD") {

    sessionStorage.setItem(
      "openCheckoutAfterReload",
      "true"
    );


    window.location.href =
      STATIC_CHECKOUT_URL;


    return;

  }


  /*
   If customer is authenticated,
   sync tokens before checkout opens.
  */

  if (isLoggedIn) {

    await syncCleengAuth();

  }


  openModal(
    checkoutModal
  );

}


/* ==========================================
   START STREAMING BUTTONS
========================================== */

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


    /*
     Logged in:
     open Account widget.
    */

    if (isLoggedIn) {

      await syncCleengAuth();


      openModal(
        accountModal
      );


      return;

    }


    /*
     Logged out:
     open Login widget.
    */

    openModal(
      loginModal
    );

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


    /*
     Clear locally stored tokens.
    */

    saveTokens(
      null,
      null
    );


    isLoggedIn = false;


    updateHeader();


    closeAll();


    console.log(
      "Customer logged out"
    );

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
   CONNECT TO CLEENG
========================================== */

function connectToCleeng() {


  /*
   cleeng.js loads asynchronously.

   Wait until the global API exists.
  */

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


  /*
   Don't register twice.
  */

  if (cleengConnected) {
    return;
  }


  cleengConnected = true;


  console.log(
    "Cleeng connected"
  );


  /* ========================================
     AUTH CHANGE LISTENER
  ======================================== */

  window.cleeng.onAuthTokensUpdate(

    async ({
      jwt,
      refreshToken
    }) => {


      console.log(
        "Cleeng authentication update:",
        {
          jwt: Boolean(jwt),
          refreshToken:
            Boolean(refreshToken)
        }
      );


      /*
       CUSTOMER LOGGED IN
      */

      if (
        jwt &&
        refreshToken
      ) {


        saveTokens(
          jwt,
          refreshToken
        );


        isLoggedIn = true;


        updateHeader();


        /*
         Synchronize all Cleeng widgets.
        */

        await syncCleengAuth();


        /*
         Close login drawer.

         IMPORTANT:
         NO REDIRECT.
        */

        if (
          loginModal.classList.contains(
            "active"
          )
        ) {

          closeAll();

        }


        return;

      }


      /*
       CUSTOMER LOGGED OUT
      */

      saveTokens(
        null,
        null
      );


      isLoggedIn = false;


      updateHeader();

    }

  );


  /* ========================================
     RESTORE EXISTING LOGIN
  ======================================== */

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
     Restore session into
     Cleeng Hosted Widgets.
    */

    syncCleengAuth();

  }

}


/* ==========================================
   AUTO OPEN CHECKOUT AFTER COUPON RELOAD
========================================== */

window.addEventListener(
  "load",
  () => {


    const shouldOpen =
      sessionStorage.getItem(
        "openCheckoutAfterReload"
      );


    if (
      shouldOpen !== "true"
    ) {
      return;
    }


    sessionStorage.removeItem(
      "openCheckoutAfterReload"
    );


    /*
     Give Cleeng time to initialize.
    */

    setTimeout(
      async () => {


        if (isLoggedIn) {

          await syncCleengAuth();

        }


        openModal(
          checkoutModal
        );


      },
      800
    );

  }
);


/* ==========================================
   INITIALIZE
========================================== */

updateHeader();

connectToCleeng();
