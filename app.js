const checkoutModal=document.getElementById("checkoutModal");
const loginModal=document.getElementById("loginModal");
const accountModal=document.getElementById("accountModal");
const heroStreamBtn=document.getElementById("heroStreamBtn");
const navStreamBtn=document.getElementById("navStreamBtn");
const accountBtn=document.getElementById("accountBtn");
const logoutBtn=document.getElementById("logoutBtn");
let isLoggedIn=false;
let cleengConnected=false;

function closeAll(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("active"));document.body.style.overflow=""}
function openModal(modal){closeAll();modal.classList.add("active");document.body.style.overflow="hidden"}
function closeModal(modal){modal.classList.remove("active");document.body.style.overflow=""}
function updateHeader(){accountBtn.textContent=isLoggedIn?"MY ACCOUNT":"LOGIN";logoutBtn.style.display=isLoggedIn?"inline-block":"none"}
function openCheckout(){const coupon=new URLSearchParams(window.location.search).get("couponCode");console.log("Checkout opened. Coupon:",coupon||"none");openModal(checkoutModal)}

heroStreamBtn.addEventListener("click",openCheckout);
navStreamBtn.addEventListener("click",openCheckout);
accountBtn.addEventListener("click",()=>openModal(isLoggedIn?accountModal:loginModal));
logoutBtn.addEventListener("click",async()=>{try{if(window.cleeng&&typeof window.cleeng.logout==="function")await window.cleeng.logout();isLoggedIn=false;updateHeader();closeAll()}catch(e){console.error("Cleeng logout error:",e)}});
document.querySelectorAll("[data-close-modal]").forEach(el=>el.addEventListener("click",closeAll));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAll()});

function connectToCleeng(){
  if(!window.cleeng||typeof window.cleeng.onAuthTokensUpdate!=="function"){setTimeout(connectToCleeng,200);return}
  if(cleengConnected)return;
  cleengConnected=true;
  window.cleeng.onAuthTokensUpdate(tokens=>{
    const jwt=tokens?.jwt;
    const refreshToken=tokens?.refreshToken;
    isLoggedIn=Boolean(jwt||refreshToken);
    updateHeader();
    if(isLoggedIn)closeModal(loginModal);
  });
}

updateHeader();
connectToCleeng();
