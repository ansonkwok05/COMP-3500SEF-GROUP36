document.getElementById("login_button").addEventListener("click", () => {
    let email = document.getElementById("email_input").value;
    let password = document.getElementById("password_input").value;

    const data = new URLSearchParams();
    data.append("email", email);
    data.append("password", password);

    fetch("/login", {method: "POST", body: data}).then((res) => {
        if (res.status == 200) location.href = "/menu.html";

        // todo handle 401 error
    });
});

// todo detect < 8 length password
// todo detect email without @
