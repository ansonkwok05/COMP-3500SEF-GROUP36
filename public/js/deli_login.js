// js/deli_login.js

let validEmail = true;
let validPassword = true;

const emailInput = document.getElementById("email_input");
const passwordInput = document.getElementById("password_input");
const emailReq = document.getElementById("email_input_requirement");
const passwordReq = document.getElementById("password_input_requirement");
const loginBtn = document.getElementById("login_button");

// instant check email format
emailInput.addEventListener("input", () => {
    const email = emailInput.value.trim();

    if (email === "") {
        emailReq.textContent = "";
        validEmail = true;
        return;
    }

    if (!email.includes("@")) {
        emailReq.textContent = 'Missing "@"';
        emailReq.style.color = "#e74c3c";
        validEmail = false;
    } else if (email.split("@").length > 2) {
        emailReq.textContent = '"@" should appear once only';
        emailReq.style.color = "#e74c3c";
        validEmail = false;
    } else if (!email.endsWith("@delivery")) {
        emailReq.textContent = "Must be a delivery account (@delivery)";
        emailReq.style.color = "#e67e22"; 
        validEmail = false;
    } else {
        emailReq.textContent = "Valid delivery email";
        emailReq.style.color = "#2ecc71";
        validEmail = true;
    }
});

// instant check pw length
passwordInput.addEventListener("input", () => {
    const pass = passwordInput.value;
    if (pass.length === 0) {
        passwordReq.textContent = "";
        validPassword = true;
    } else if (pass.length < 8) {
        passwordReq.textContent = "Password too short (min 8 chars)";
        passwordReq.style.color = "#e74c3c";
        validPassword = false;
    } else {
        passwordReq.textContent = "Password looks good";
        passwordReq.style.color = "#2ecc71";
        validPassword = true;
    }
});

// Login Button Click
loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    emailReq.style.color = "#e74c3c";
    passwordReq.style.color = "#e74c3c";

    if (!email) {
        emailReq.textContent = "Email is required";
        return;
    }
    if (!password) {
        passwordReq.textContent = "Password is required";
        return;
    }
    if (password.length < 8) {
        passwordReq.textContent = "Password must be 8+ characters";
        return;
    }
    if (!email.endsWith("@delivery")) {
        emailReq.textContent = "This is deliveryman login only!";
        emailReq.style.color = "#e67e22";
        emailReq.innerHTML += `<br><small>Customer? → <a href="/login.html" style="color:#3498db">Go to customer login</a></small>`;
        return;
    }

    // show loading
    loginBtn.textContent = "Logging in...";
    loginBtn.style.opacity = "0.7";

    const data = new URLSearchParams();
    data.append("email", email);
    data.append("password", password);

    try {
        const res = await fetch("/deli_login", {
            method: "POST",
            body: data,
            redirect: "follow"
        });

        if (res.redirected) {
            window.location.href = res.url; 
            return;
        }

        const text = await res.text();

        if (res.status === 403) {
            emailReq.innerHTML = `Not a delivery account<br>
                <small style="color:#e67e22">This login is for deliverymen only</small>`;
        } else if (res.status === 401) {
            passwordReq.textContent = "Incorrect password";
        } else {
            emailReq.textContent = text || "Login failed";
        }

    } catch (err) {
        emailReq.textContent = "Network error. Please try again.";
    } finally {
        loginBtn.textContent = "Login";
        loginBtn.style.opacity = "1";
    }
});