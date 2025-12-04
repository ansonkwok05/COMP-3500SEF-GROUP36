const emailInput = document.getElementById("email_input");
const passwordInput = document.getElementById("password_input");
const nameInput = document.getElementById("name_input");
const addressInput = document.getElementById("address_input");
const registerBtn = document.getElementById("register_button");
const responseDiv = document.getElementById("response");

function validateEmail() {
    const email = emailInput.value.trim();
    const req = document.getElementById("email_requirement");
    if (email && !email.endsWith("@delivery")) {
        req.textContent = "Email must end with @delivery";
        req.style.color = "#e74c3c";
        return false;
    } else {
        req.textContent = email ? "Valid Email" : "";
        req.style.color = email ? "#2ecc71" : "";
        return true;
    }
}

function validatePassword() {
    const pass = passwordInput.value;
    const req = document.getElementById("password_requirement");
    if (pass && pass.length < 8) {
        req.textContent = "At least 8 characters";
        req.style.color = "#e74c3c";
        return false;
    } else {
        req.textContent = pass ? "Valid password" : "";
        req.style.color = pass ? "#2ecc71" : "";
        return true;
    }
}

function validateName() {
    const name = nameInput.value.trim();
    const req = document.getElementById("name_requirement");
    req.textContent = name ? "" : "Name is required";
    req.style.color = "#e74c3c";
    return name.length > 0;
}


emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);
nameInput.addEventListener("input", validateName);

registerBtn.addEventListener("click", async () => {
    const isEmailOk = validateEmail();
    const isPassOk = validatePassword();
    const isNameOk = validateName();

    if (!isEmailOk || !isPassOk || !isNameOk) {
        responseDiv.textContent = "Please fix the errors above";
        responseDiv.style.color = "#e74c3c";
        return;
    }

    registerBtn.textContent = "Registering...";
    registerBtn.style.opacity = "0.7";
    registerBtn.style.pointerEvents = "none";
    responseDiv.textContent = "";

    const data = new URLSearchParams();
    data.append("email", emailInput.value.trim());
    data.append("password", passwordInput.value);
    data.append("name", nameInput.value.trim());

    try {
        const res = await fetch("/deli_register", {
            method: "POST",
            body: data
        });

        const text = await res.text();

        if (res.ok) {
            responseDiv.style.color = "#2ecc71";
            responseDiv.innerHTML = `
                <strong>Success!</strong> Deliveryman account created.<br>
                Redirecting to login in <span id="countdown">3</span> seconds...
            `;

            let seconds = 3;
            const countdown = document.getElementById("countdown");
            const timer = setInterval(() => {
                seconds--;
                countdown.textContent = seconds;
                if (seconds <= 0) {
                    clearInterval(timer);
                    window.location.href = "/deli_login.html";
                }
            }, 1000);

        } else {
            responseDiv.style.color = "#e74c3c";
            responseDiv.textContent = text || "Registration failed. Please try again.";
        }
    } catch (err) {
        responseDiv.style.color = "#e74c3c";
        responseDiv.textContent = "Network error. Please check your connection.";
    } finally {
        registerBtn.textContent = "Register as Deliveryman";
        registerBtn.style.opacity = "1";
        registerBtn.style.pointerEvents = "auto";
    }

});

