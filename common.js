const STORAGE_JWT = 'acesCleengJWT';
const STORAGE_REFRESH = 'acesCleengRefreshToken';
const HOME_PATH = '/aces-live-test/';

let currentJWT = localStorage.getItem(STORAGE_JWT);
let currentRefreshToken = localStorage.getItem(STORAGE_REFRESH);
let isLoggedIn = Boolean(currentJWT && currentRefreshToken);
let cleengConnected = false;

function updateHeader() {
  const accountBtn = document.getElementById('accountBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (accountBtn) {
    accountBtn.textContent = isLoggedIn ? 'MY ACCOUNT' : 'LOGIN';
  }

  if (logoutBtn && !logoutBtn.classList.contains('page-logout')) {
    logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  }
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function saveTokens(jwt, refreshToken) {
  currentJWT = jwt || null;
  currentRefreshToken = refreshToken || null;
  isLoggedIn = Boolean(currentJWT && currentRefreshToken);

  if (isLoggedIn) {
    localStorage.setItem(STORAGE_JWT, currentJWT);
    localStorage.setItem(STORAGE_REFRESH, currentRefreshToken);
  } else {
    localStorage.removeItem(STORAGE_JWT);
    localStorage.removeItem(STORAGE_REFRESH);
  }

  updateHeader();
}

async function syncCleengAuth() {
  if (!isLoggedIn) return false;
  if (!window.cleeng || typeof window.cleeng.setAuthTokens !== 'function') return false;

  try {
    await window.cleeng.setAuthTokens({
      jwt: currentJWT,
      refreshToken: currentRefreshToken
    });
    return true;
  } catch (error) {
    console.error('Cleeng auth sync failed:', error);
    return false;
  }
}

async function logout() {
  try {
    if (window.cleeng && typeof window.cleeng.logout === 'function') {
      await window.cleeng.logout();
    }
  } catch (error) {
    console.error('Cleeng logout failed:', error);
  }

  saveTokens(null, null);

  if (window.location.pathname.endsWith('/account.html')) {
    window.location.assign(HOME_PATH);
  }
}

function wirePageControls() {
  const accountBtn = document.getElementById('accountBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (accountBtn) {
    accountBtn.addEventListener('click', async () => {
      if (isLoggedIn) {
        await syncCleengAuth();
        window.location.assign('./account.html');
      } else {
        openLoginModal();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeLoginModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLoginModal();
  });
}

function connectToCleeng() {
  if (!window.cleeng || typeof window.cleeng.onAuthTokensUpdate !== 'function') {
    setTimeout(connectToCleeng, 200);
    return;
  }

  if (cleengConnected) return;
  cleengConnected = true;

  window.cleeng.onAuthTokensUpdate(async ({ jwt, refreshToken }) => {
    if (jwt && refreshToken) {
      saveTokens(jwt, refreshToken);
      await syncCleengAuth();
      closeLoginModal();
      return;
    }

    saveTokens(null, null);
  });

  if (isLoggedIn) {
    syncCleengAuth();
  }
}

updateHeader();
wirePageControls();
connectToCleeng();
