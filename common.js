const SITE = {
  basePath: "/aces-live-test/",
  home: "./index.html",
  login: "./login.html",
  account: "./account.html",
  checkout: "./checkout.html?couponCode=NEVERFOLD"
};

let authListenerConnected = false;

function waitForCleeng(callback) {
  if (window.cleeng) {
    callback();
    return;
  }
  setTimeout(() => waitForCleeng(callback), 150);
}

function setStatus(jwt, refreshToken) {
  const loggedIn = Boolean(jwt && refreshToken);
  document.querySelectorAll("[data-auth-status]").forEach(el => {
    el.textContent = loggedIn ? "SIGNED IN" : "SIGNED OUT";
    el.closest(".status-pill")?.classList.toggle("logged-in", loggedIn);
  });

  document.querySelectorAll("[data-account-link]").forEach(el => {
    el.textContent = loggedIn ? "MY ACCOUNT" : "LOGIN";
    el.setAttribute("href", loggedIn ? SITE.account : SITE.login);
  });

  document.documentElement.dataset.authenticated = loggedIn ? "true" : "false";
  window.dispatchEvent(new CustomEvent("aces-auth-change", {
    detail: { loggedIn, jwt, refreshToken }
  }));
}

function connectAuthListener() {
  waitForCleeng(() => {
    if (authListenerConnected || typeof window.cleeng.onAuthTokensUpdate !== "function") return;
    authListenerConnected = true;
    window.cleeng.onAuthTokensUpdate(({ jwt, refreshToken }) => {
      setStatus(jwt, refreshToken);
    });
  });
}

function attachLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", async () => {
      waitForCleeng(async () => {
        try {
          if (typeof window.cleeng.logout === "function") {
            await window.cleeng.logout();
          }
        } finally {
          window.location.href = SITE.home;
        }
      });
    });
  });
}

function ensureCheckoutCouponLinks() {
  document.querySelectorAll("[data-checkout-link]").forEach(link => {
    link.setAttribute("href", SITE.checkout);
  });
}

connectAuthListener();
attachLogoutButtons();
ensureCheckoutCouponLinks();
