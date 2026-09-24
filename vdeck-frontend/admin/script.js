/* =========================================
   VDECK ADMIN LOGIN
   Prototype Version
========================================= */


// =========================================
// ELEMENTS
// =========================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const errorMessage =
    document.getElementById("errorMessage");

const loginBtn =
    document.getElementById("loginBtn");


// =========================================
// PROTOTYPE ADMIN CREDENTIALS
// =========================================
//
// TEMPORARY ONLY.
//
// We will replace this with proper
// backend authentication later.
//

const ADMIN_EMAIL =
    "admin@vdeck.com";

const ADMIN_PASSWORD =
    "VDeckAdmin123";


// =========================================
// PASSWORD VISIBILITY
// =========================================

togglePassword.addEventListener(
    "click",
    function () {

        if (
            passwordInput.type === "password"
        ) {

            passwordInput.type = "text";

            togglePassword.textContent =
                "Hide";

            togglePassword.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type =
                "password";

            togglePassword.textContent =
                "Show";

            togglePassword.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    }
);


// =========================================
// LOGIN
// =========================================

loginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        // Clear previous error

        errorMessage.textContent = "";


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // =====================================
        // EMPTY EMAIL
        // =====================================

        if (email === "") {

            errorMessage.textContent =
                "Please enter your admin email.";

            emailInput.focus();

            return;

        }


        // =====================================
        // INVALID EMAIL
        // =====================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            errorMessage.textContent =
                "Please enter a valid email address.";

            emailInput.focus();

            return;

        }


        // =====================================
        // EMPTY PASSWORD
        // =====================================

        if (password === "") {

            errorMessage.textContent =
                "Please enter your password.";

            passwordInput.focus();

            return;

        }


        // =====================================
        // PREVENT DOUBLE CLICK
        // =====================================

        loginBtn.disabled = true;

        loginBtn.textContent =
            "Signing in...";


        // =====================================
        // PROTOTYPE LOGIN CHECK
        // =====================================

        setTimeout(function () {

            if (
                email === ADMIN_EMAIL &&
                password === ADMIN_PASSWORD
            ) {

                console.log(
                    "VDeck Admin Login Successful"
                );


                // Temporary prototype session

                localStorage.setItem(
                    "vdeckAdminLoggedIn",
                    "true"
                );


                localStorage.setItem(
                    "vdeckAdminEmail",
                    email
                );


                /*
                    Later:

                    Login
                      ↓
                    Backend authentication
                      ↓
                    Session / JWT
                      ↓
                    Admin dashboard
                */


                window.location.href =
                    "dashboard.html";


            } else {

                errorMessage.textContent =
                    "Invalid admin email or password.";

                loginBtn.disabled = false;

                loginBtn.textContent =
                    "Sign In";

            }

        }, 500);

    }
);