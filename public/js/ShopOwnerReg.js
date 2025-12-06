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
// Double confirm the password
function confirm_pw(password_C,password){
    if (password_C !== password){
        document.getElementById("password_Confirm_requirement").textContent = "Password is unmatched";
        return false;
    }
    document.getElementById("password_Confirm_requirement").textContent = "";
    return true;
}

function validate_name(name) {
    if (name.length == 0) {
        document.getElementById("name_input_requirement").textContent = "Name cannot be empty";
        return false;
    }

    document.getElementById("name_input_requirement").textContent = "";
    return true;
}

function validate_restaurant_name(r_name) {
    if (r_name.length == 0) {
        document.getElementById("r_Name_input_requirement").textContent = "Restaurant name cannot be empty";
        return false;
    }

    document.getElementById("r_Name_input_requirement").textContent = "";
    return true;
}

function validate_restaurant_address(r_address) {
    if (r_address.length == 0) {
        document.getElementById("r_address_input_requirement").textContent = "Restaurant address cannot be empty";
        return false;
    }

    document.getElementById("r_address_input_requirement").textContent = "";
    return true;
}

function submit_form() {
    let email = document.getElementById("email_input").value;
    let password = document.getElementById("password_input").value;
    let password_C = document.getElementById("password_Confirm").value;
    let name = document.getElementById("name_input").value;
    let r_name = document.getElementById("r_Name_input").value;
    let r_address = document.getElementById("r_address_input").value;

    if (!validate_email(email) ||
        !validate_password(password) ||
        !validate_name(name) ||
        !validate_restaurant_name(r_name) ||
        !validate_restaurant_address(r_address) ||
        !confirm_pw(password_C, password)) return;

    const data = new URLSearchParams();
    data.append("email", email);
    data.append("password", password);
    data.append("name", name);
    data.append("r_name", r_name);
    data.append("r_address", r_address);

    fetch("/ShopOwnerReg", { method: "POST", body: data }).then((res) => {
        if (res.redirected) {
            window.location.href = res.url;
            return;
        }

        if (res.status == 401) {
            document.getElementById("email_input_requirement").textContent = "Email already registered";
            return ;
        }
    });
}

window.addEventListener("load", (e) => {
    document.getElementById("email_input").addEventListener("blur", (e) => {
        validate_email(e.target.value);
    });

    document.getElementById("password_input").addEventListener("blur", (e) => {
        validate_password(e.target.value);
    });

    document.getElementById("password_Confirm").addEventListener("blur", (e) => {
        let password = document.getElementById("password_input").value;
        let password_C = e.target.value;
        confirm_pw(password_C, password);
    });

    document.getElementById("name_input").addEventListener("blur", (e) => {
        validate_name(e.target.value);
    });

    document.getElementById("r_Name_input").addEventListener("blur", (e) => {
        validate_restaurant_name(e.target.value);
    });

    document.getElementById("r_address_input").addEventListener("blur", (e) => {
        validate_restaurant_address(e.target.value);
    });

    // Enter key listeners for all fields
    const fields = ["email_input", "password_input", "password_Confirm", "name_input", "r_Name_input", "r_address_input"];
    fields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener("keydown", e => {
            if (e.key == "Enter") {
                submit_form();
            }
        });
    });

    document.getElementById("register_button").addEventListener("click", submit_form);
});