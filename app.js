/* ==============================
   ELEMENTS
============================== */

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


/* ==============================
   STATE
============================== */

let cleengConnected = false;

let isLoggedIn = false;

let currentJWT = null;

let currentRefreshToken = null;


/* ==============================
   MODALS
============================== */

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


/* ==============================
   HEADER
============================== */

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


/* ==============================
   SHARE AUTH WITH CLEENG WIDGETS
============================== */

async function syncCleengAuth() {

  if (
    !currentJWT ||
    !currentRefreshToken
  ) {
    return false;
  }


  if (
    !window.cleeng ||
    typeof window.cleeng.setAuthTokens !== "function"
  ) {
    return false;
  }


  try {

    await window.cleeng.setAuthTokens({
      jwt: currentJWT,
      refreshToken: currentRefreshToken
    });

    console.log(
      "Cleeng session synced"
    );

    return true;

  } catch (error) {

    console.error(
      "Cleeng auth sync error:",
      error
    );

    return false;
  }
}


/* ==============================
   CHECKOUT
============================== */

async function openCheckout() {

  console.log(
    "Checkout URL:",
    window.location.href
  );


  console.log(
    "Logged in:",
    isLoggedIn
  );


  /*
    If authenticated, make sure
    Checkout receives the same session.
  */

  if (isLoggedIn) {

    await syncCleengAuth();

  }


  /*
    IMPORTANT:

    No URL changes.
    No redirect.
    No reload.

    couponCode=NEVERFOLD was already
    present before cleeng.js loaded.
  */

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


/* ==============================
   LOGIN / ACCOUNT
============================== */

accountBtn.addEventListener(
  "click",
  async () => {

    if (isLoggedIn) {

      await syncCleengAuth();

      openModal(
        accountModal
      );

      return;
    }


    /*
      Logged out:

      Open Cleeng login drawer.

      NO navigation.
    */

    openModal(
      loginModal
    );
  }
);


/* ==============================
   LOGOUT
============================== */

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      if (
        window.cleeng &&
        typeof window.cleeng.logout === "function"
      ) {

        await window.cleeng.logout();

      }

    } catch (error) {

      console.error(
        "Cleeng logout failed:",
        error
      );

    }


    currentJWT = null;

    currentRefreshToken = null;

    isLoggedIn = false;


    updateHeader();

    closeAll();


    console.log(
      "Logged out"
    );
  }
);


/* ==============================
   CLOSE BUTTONS
============================== */

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


/* ==============================
   CLEENG AUTH LISTENER
============================== */

function connectToCleeng() {

  /*
    Cleeng loads asynchronously.

    Wait until its global API
    becomes available.
  */

  if (
    !window.cleeng ||
    typeof window.cleeng.onAuthTokensUpdate !== "function"
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
    auth tokens change.
  */

  window.cleeng.onAuthTokensUpdate(
    async ({
      jwt,
      refreshToken
    }) => {


      console.log(
        "Cleeng auth update:",
        {
          jwt: Boolean(jwt),
          refreshToken: Boolean(refreshToken)
        }
      );


      /* ==========================
         LOGGED IN
      ========================== */

      if (
        jwt &&
        refreshToken
      ) {

        currentJWT =
          jwt;

        currentRefreshToken =
          refreshToken;

        isLoggedIn =
          true;


        updateHeader();


        /*
          Explicitly share login
          with Checkout + Account.
        */

        await syncCleengAuth();


        /*
          After successful login:

          Simply close Login drawer.

          NO redirect.
          NO page navigation.
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


      /* ==========================
         LOGGED OUT
      ========================== */

      currentJWT =
        null;

      currentRefreshToken =
        null;

      isLoggedIn =
        false;


      updateHeader();

    }
  );
}


/* ==============================
   INITIALIZE
============================== */

updateHeader();

connectToCleeng();
