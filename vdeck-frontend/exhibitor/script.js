// =====================================================
// VDECK EXHIBITOR LOGIN
// =====================================================


// =====================================================
// API
// =====================================================

const API_BASE_URL =
    "http://localhost:3000/api";


// =====================================================
// ELEMENTS
// =====================================================

const loginForm =
    document.getElementById("loginForm");

const exhibitorCodeInput =
    document.getElementById("exhibitorCode");

const loginBtn =
    document.getElementById("loginBtn");

const loginMessage =
    document.getElementById("loginMessage");


// =====================================================
// MESSAGE
// =====================================================

function showMessage(message, type) {

    loginMessage.textContent =
        message;

    loginMessage.className =
        "login-message";

    if (type) {

        loginMessage.classList.add(
            type
        );
    }
}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // -------------------------------------------------
        // GET CODE
        // -------------------------------------------------

        const exi_code =
            exhibitorCodeInput
                .value
                .trim()
                .toUpperCase();


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!exi_code) {

            showMessage(
                "Please enter your exhibitor code.",
                "error"
            );

            return;
        }


        // -------------------------------------------------
        // BUTTON STATE
        // -------------------------------------------------

        loginBtn.disabled =
            true;

        loginBtn.textContent =
            "Signing in...";

        showMessage(
            "",
            ""
        );


        try {

            // -------------------------------------------------
            // LOGIN REQUEST
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/exhibitors/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            exi_code
                        })
                    }
                );


            const data =
                await response.json();


            // -------------------------------------------------
            // LOGIN ERROR
            // -------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to login."
                );
            }


            // -------------------------------------------------
            // STORE LOGIN
            // -------------------------------------------------

            localStorage.setItem(
                "vdeckExhibitorLoggedIn",
                "true"
            );


            localStorage.setItem(
                "vdeckExhibitor",
                JSON.stringify(
                    data.exhibitor
                )
            );


            // -------------------------------------------------
            // CHECK PROFILE COMPLETION
            // -------------------------------------------------

            const profileCompleted =
                localStorage.getItem(
                    "vdeckExhibitorProfileCompleted"
                );


            // -------------------------------------------------
            // FIRST TIME
            // -------------------------------------------------

            if (
                profileCompleted !==
                "true"
            ) {

                showMessage(
                    "Login successful. Let's complete your profile...",
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "complete-profile.html";

                    },
                    700
                );


                return;
            }


            // -------------------------------------------------
            // RETURNING EXHIBITOR
            // -------------------------------------------------

            showMessage(
                "Login successful. Opening your profile...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "home.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Exhibitor login error:",
                error
            );


            showMessage(
                error.message ||
                "Something went wrong. Please try again.",
                "error"
            );


            loginBtn.disabled =
                false;

            loginBtn.textContent =
                "Sign In";
        }

    }
);


// =====================================================
// CODE INPUT
// =====================================================

exhibitorCodeInput.addEventListener(
    "input",
    function () {

        this.value =
            this.value
                .toUpperCase()
                .replace(/\s/g, "");

    }
);