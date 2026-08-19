/* ==========================================
   CONFIG
========================================== */

const HOME_URL =
  "https://kaltavas-debug.github.io/aces-live-test/";


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
let loginStartedHere = false;


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
   CHECKOUT
========================================== */

function openCheckout() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const coupon =
    params.get("couponCode");

  console.log(
    "Coupon:",
    coupon || "none"
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
  () => {

    if (isLoggedIn) {

      openModal(
        accountModal
      );

    } else {

      /*
       Remember that login was
       initiated from this page.
      */

      loginStartedHere = true;

      sessionStorage.setItem(
        "acesLoginStarted",
        "true"
      );

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

      isLoggedIn = false;

      sessionStorage.removeItem(
        "acesLoginStarted"
      );

      updateHeader();

      closeAll();

      console.log(
        "Logged out"
      );

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }

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
   CLEENG AUTHENTICATION
========================================== */

function connectToCleeng() {

  /*
   Wait for Cleeng JS to load.
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


  if (cleengConnected) {
    return;
  }


  cleengConnected = true;

  console.log(
    "Cleeng connected"
  );


  /*
   Cleeng calls this whenever
   authentication changes.

   Login
   Registration
   Token refresh
   Logout
  */

  window.cleeng.onAuthTokensUpdate(
    ({ jwt, refreshToken }) => {

      const wasLoggedIn =
        isLoggedIn;


      isLoggedIn =
        Boolean(
          jwt &&
          refreshToken
        );


      console.log(
        "Cleeng authentication:",
        isLoggedIn
      );


      updateHeader();


      /* ==================================
         SUCCESSFUL LOGIN
      ================================== */

      const loginWasStarted =
        loginStartedHere ||
        sessionStorage.getItem(
          "acesLoginStarted"
        ) === "true";


      if (
        isLoggedIn &&
        !wasLoggedIn &&
        loginWasStarted
      ) {

        console.log(
          "Login successful"
        );


        /*
         Clear the login marker
         BEFORE redirecting.
        */

        sessionStorage.removeItem(
          "acesLoginStarted"
        );

        loginStartedHere = false;


        /*
         Explicitly return user to:

         https://kaltavas-debug.github.io/
         aces-live-test/
        */

        window.location.replace(
          HOME_URL
        );

        return;

      }


      /* ==================================
         LOGOUT
      ================================== */

      if (!isLoggedIn) {

        sessionStorage.removeItem(
          "acesLoginStarted"
        );

      }

    }
  );

}


/* ==========================================
   INITIALIZE
========================================== */

updateHeader();

connectToCleeng();
