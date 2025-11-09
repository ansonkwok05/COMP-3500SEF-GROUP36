const form = document.getElementById("login_form");
const response = document.getElementById("response");

form.addEventListener("submit", async (e) => {
    console.log("submit");
    e.preventDefault(); // prevent normal submit

    const encoded_data = new URLSearchParams();
    for (const pair of new FormData(form)) {
        encoded_data.append(pair[0], pair[1]);
    }

    try {
        const res = await fetch(form.action, {
            method: "POST",
            body: encoded_data,
        });
        const data = await res.text();
        response.textContent = `Status: ${res.status}\n\n${data}`;
    } catch (err) {
        response.textContent = "Error: " + err.message;
    }
});
