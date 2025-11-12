let valid_email = true;
document.getElementById("email_input").addEventListener("input", (e) => {
    let email = e.target.value;

    if (email.length == 0) {
        // ignore. requirement message will be poped if user clicks login
        valid_email = true;
        document.getElementById("email_input_requirement").textContent = "";
        return;
    }

    let at_count = email.split("@").length - 1;

    if (at_count < 1) {
        valid_email = false;
        document.getElementById(
            "email_input_requirement"
        ).textContent = `Missing "@"`;
        return;
    }

    if (at_count > 1) {
        valid_email = false;
        document.getElementById(
            "email_input_requirement"
        ).textContent = `"@" should appear once only`;
        return;
    }

    valid_email = true;
    document.getElementById("email_input_requirement").textContent = "";
});

let valid_password = true;
document.getElementById("password_input").addEventListener("input", (e) => {
    let password = e.target.value;

    if (password.length < 8) {
        // removes requirement message
        valid_password = true;
        document.getElementById("password_input_requirement").textContent = "";
        return;
    }
});

document.getElementById("login_button").addEventListener("click", () => {
    if (!valid_email || !valid_password) return;

    let email_input = document.getElementById("email_input").value;
    let password_input = document.getElementById("password_input").value;

    if (email_input.length == 0) {
        document.getElementById("email_input_requirement").textContent =
            "Email is empty";
    }

    if (password_input.length == 0) {
        document.getElementById("password_input_requirement").textContent =
            "Password is empty";
        return;
    }

    if (password_input.length < 8) {
        document.getElementById("password_input_requirement").textContent =
            "Password length is less than 8";
        return;
    }

    const data = new URLSearchParams();
    data.append("email", email_input);
    data.append("password", password_input);

    fetch("/login", {method: "POST", body: data}).then((res) => {
        if (res.status == 200) {
            location.href = "/restaurantList.html";
            return;
        }

        if (res.status == 401) {
            document.getElementById("email_input_requirement").textContent =
                "Incorrect email";
            document.getElementById("password_input_requirement").textContent =
                "Incorrect password";
            return;
        }
    });
});
