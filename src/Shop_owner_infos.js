const sqlite3 = require("sqlite3");

const {generate_uuid} = require("./utils.js");

// sqlite db connection
// initialized during runtime
let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
}

function check_user_exists(email) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM R_users WHERE email = ?', [email], (err, row) => {
            if (err) {reject(err)} else {
                resolve(!!row);
            }
        });
    });
}

async function register_owner(email, password, name, r_name, r_address) {
    if (await check_user_exists(email)) return false;

    // check if email is invalid
    if (email == "" || email.indexOf("@") == -1) return false;

    // restrains for password
    if (password.length < 8) return false;

    // required information
    if (name == ""|| r_name =="" || r_address == "") return false;

    const r_id = generate_uuid(16); //**Need to change it to id (n) in further update

    return new Promise((resolve) => {
        db.run(
            `INSERT INTO R_users (id, email, password, name) VALUES (?, ?, ?, ?)`,
            [r_id, email, password, name],
            function(err) {
                if (err) {
                    resolve(false);
                    return;
                }
                db.run( //might need to change the name and address null also
                    `INSERT INTO restaurants (r_id, name, address, cuisine, rating) VALUES (?, ?, ?, null, null)`,
                    [r_id, r_name, r_address],
                    function(err) {
                        if (err) {
                            resolve(false);
                        } else {
                            resolve(true);
                        }});
            }
        );
    });}

async function get_R_users_id(email) {
    return new Promise((resolve) => {
        db.get("SELECT id FROM R_users  WHERE email = ?", [email], (err, row) => {
            resolve(row.id);
        });
    });
}

async function login_R_user(email, password) {
    return new Promise((resolve) => {
        db.get(
            "SELECT * FROM R_users WHERE email = ?",
            [email],
            (err, row) => {
                if (err){
                    resolve(false);
                    return;
                }
                if (!row) {
                    resolve(false);
                    return;
                }
                if (row.password !== password) {
                    resolve(false);
                    return;
                }

                resolve(true);
            }
        );
    });
}
async function validate_r_user_id(email, user_id) {
    return new Promise((resolve) => {
        db.get(
            "SELECT id FROM R_users WHERE email = ? AND id = ?",
            [email, user_id],
            (err, row) => {
                if (err) {
                    resolve(false);
                    return;
                }
                resolve(!!row);
            }
        );
    });
}

module.exports = {
    initialize_db,
    register_owner,
    get_R_users_id,
    login_R_user,
    validate_r_user_id,
};