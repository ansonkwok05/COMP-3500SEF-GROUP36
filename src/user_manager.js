// user data implemented with an object
// uses email and password for login, user_id for logging / authentication purposes
// todo: change this to a more acceptable way (using a database)
let user_data = {};

function check_user_exists(email) {
    if (email in user_data) return true;
    return false;
}

function generate_uuid(size) {
    let uuid = "";

    let i = 0;
    while (i < size) {
        const rand = Math.floor(Math.random() * 16);
        uuid += rand.toString(16);
        i++;
    }

    return uuid;
}

function register_user(email, password) {
    if (check_user_exists(email)) return false;

    user_data[email] = {
        password: password,
        id: generate_uuid(16),
    };

    return true;
}

function login_user(email, password) {
    // check if it is an invalid email
    if (email == "" || email.indexOf("@") == -1) return false;

    if (!check_user_exists(email)) return false;

    // check if password matches
    if (user_data[email]?.password != password) return false;

    return true;
}

module.exports = {register_user, login_user};
