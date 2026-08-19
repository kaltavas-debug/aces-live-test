Upload these files to the ROOT of your GitHub Pages repo:
- index.html
- checkout.html
- account.html
- styles.css
- common.js

Delete the old login.html and app.js if they still exist.

Flow:
- Login stays embedded on index.html (no separate login page)
- Start Streaming goes to checkout.html?couponCode=NEVERFOLD
- My Account goes to account.html after auth is detected
- Logout clears Cleeng session and local auth storage
