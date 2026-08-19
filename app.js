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
    accountBtn.textContent = "MY ACCOUNT";
    logoutBtn.style.display = "inline-block";
  } else {
    accountBtn.textContent = "LOGIN";
    logoutBtn.style.display = "none";
  }
}


/* ==========================================
   AUTH TOKEN STORAGE
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
   SYNC CLEENG SESSION
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

    return true;

  } catch (error) {
    console.error(
      "Cleeng token sync failed:",
      error
    );

    return false;
  }
}


/* ==========================================
   CHECKOUT
========================================== */

async function openCheckout() {
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

    saveTokens(
      null,
      null
    );

    isLoggedIn = false;

    updateHeader();

    closeAll();
  }
);


/* ==========================================
   CLOSE MODALS
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
   CLEENG AUTH
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

        saveTokens(
          jwt,
          refreshToken
        );

        isLoggedIn = true;

        updateHeader();

        /*
         Keep all Hosted Widgets
         on the same auth session.
        */
        await syncCleengAuth();


        /*
         IMPORTANT:
         NO REDIRECT.

         Just close Login and
         remain on this exact page.
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
     RESTORE SAVED SESSION
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

    syncCleengAuth();

  }
}


/* ==========================================
   INITIALIZE
========================================== */

updateHeader();

connectToCleeng();
