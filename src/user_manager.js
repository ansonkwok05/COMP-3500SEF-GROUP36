const {generate_uuid} = require("./utils.js");

// user data implemented with an object
// uses email and password for login, user id for logging / authentication purposes
// todo: change this to a more acceptable way (using a database)
let user_data = {
    // test user
    "test@email": {
        id: "0123456789ABCDEF",
        password: "testtest",
        name: "test name",
        address: "test address",
    },
};

function check_user_exists(email) {
    if (email in user_data) return true;
    return false;
}

function register_user(email, password, name, address) {
    if (check_user_exists(email)) return false;

    // check if email is invalid
    if (email == "" || email.indexOf("@") == -1) return false;

    // restrains for password
    if (password.length < 8) return false;

    // required information
    if (name == "" || address == "") return false;

    user_data[email] = {
        id: generate_uuid(16), // use random 16 digit hex for id
        password: password,
        name: name,
        address: address,
    };

    return true;
}

function login_user(email, password) {
    if (!check_user_exists(email)) return false;

    // check if password matches
    if (user_data[email]?.password != password) return false;

    return true;
}

function get_user_id(email) {
    return user_data[email].id;
}

function validate_user_id(user_id) {
    for (email in user_data) {
        if (user_data[email].id == user_id) return true;
    }
    return false;
}

module.exports = {register_user, login_user, get_user_id, validate_user_id};
