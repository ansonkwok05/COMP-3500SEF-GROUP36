// validate email, if theres error then email requirement will pop up
function validate_email(email) {
    if (email.length == 0) {
        document.getElementById("email_input_requirement").textContent = "Email cannot be empty";
        return false;
    }

    let at_count = email.split("@").length - 1;

    if (at_count < 1) {
        document.getElementById("email_input_requirement").textContent = `Missing "@"`;
        return false;
    }

    if (at_count > 1) {
        document.getElementById("email_input_requirement").textContent = `"@" should appear once only`;
        return false;
    }

    if (email.indexOf("@") == email.length - 1) {
        document.getElementById("email_input_requirement").textContent = `Incomplete email`;
        return false;
    }

    document.getElementById("email_input_requirement").textContent = "";
    return true;
}

// validate password, if theres error then password requirement will pop up
function validate_password(password) {
    if (password.length == 0) {
        document.getElementById("password_input_requirement").textContent = "Password cannot be empty";
        return false;
    }

    if (password.length < 8) {
        document.getElementById("password_input_requirement").textContent = "Password length is less than 8";
        return false;
    }

    document.getElementById("password_input_requirement").textContent = "";
    return true;
}

function submit_form() {
    let email = document.getElementById("email_input").value;
    let password = document.getElementById("password_input").value;

    if (!validate_email(email) || !validate_password(password)) return;

    const data = new URLSearchParams();
    data.append("email", email);
    data.append("password", password);

    fetch("/login", { method: "POST", body: data }).then((res) => {
        if (res.redirected) {
            window.location.href = res.url;
            return;
        }

        if (res.status == 401) {
            document.getElementById("email_input_requirement").textContent = "Incorrect email";
            document.getElementById("password_input_requirement").textContent = "Incorrect password";
            return;
        }
    });
}

window.addEventListener("load", () => {
    document.getElementById("email_input").addEventListener("blur", (e) => {
        validate_email(e.target.value);
    });

    document.getElementById("password_input").addEventListener("blur", (e) => {
        validate_password(e.target.value);
    });

    document.getElementById("email_input").addEventListener("keydown", e => {
        if (e.key == "Enter") {
            submit_form();
        }
    });

    document.getElementById("password_input").addEventListener("keydown", e => {
        if (e.key == "Enter") {
            submit_form();
        }
    });

    document.getElementById("login_button").addEventListener("click", submit_form);
})
