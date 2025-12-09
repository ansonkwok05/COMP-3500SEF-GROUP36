const sqlite3 = require("sqlite3");

const {generate_uuid} = require("./utils.js");

// sqlite db connection
// initialized during runtime
let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
}

async function check_user_exists(email) {
    return new Promise((resolve) => {
        db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
            if (row === undefined) {
                resolve(false);
                return;
            }

            resolve(true);
            return;
        });
    });
}

async function register_user(email, password, name, address) {
    if (await check_user_exists(email)) return false;

    // check if email is invalid
    if (email == "" || email.indexOf("@") == -1) return false;

    // restrains for password
    if (password.length < 8) return false;

    // required information
    if (name == "" || address == "") return false;

    return new Promise((resolve) => {
        db.run(
            `INSERT INTO users (id, email, password, name, address) VALUES (?, ?, ?, ?, ?)`,
            [generate_uuid(16), email, password, name, address],
            () => {
                resolve(true);
            }
        );
    });
}

async function login_user(email, password) {
    return new Promise((resolve) => {
        db.get(
            "SELECT password FROM users WHERE email = ?",
            [email],
            (err, row) => {
                if (row === undefined) {
                    resolve(false);
                    return;
                }

                if (row.password != password) {
                    resolve(false);
                    return;
                }

                resolve(true);
            }
        );
    });
}

async function get_user_id(email) {
    return new Promise((resolve, reject) => {
        if (!email) {
            reject(new Error("Email is required"));
            return;
        }

        db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
            if (err) {
                console.error('Database error in get_user_id:', err);
                reject(err);
            } else if (!row) {
                console.warn(`No user found with email: ${email}`);
                resolve(null); // Return null instead of throwing
            } else {
                resolve(row.id);
            }
        });
    });
}

async function get_user_by_email(email) {
    return new Promise((resolve) => {
        db.get(
        "SELECT id, email, name, address FROM users WHERE email = ?",
        [email],
        (err, row) => resolve(row || null)
        )}
    );
}

async function validate_user_id(email, user_id) {
    return new Promise((resolve) => {
        db.get(
            "SELECT email FROM users WHERE id = ?",
            [user_id],
            (err, row) => {
                if (row === undefined) {
                    resolve(false);
                    return;
                }

                if (row.email != email) {
                    resolve(false);
                    return;
                }

                resolve(true);
            }
        );
    });
}

module.exports = {
    initialize_db,
    register_user,
    login_user,
    get_user_id,
    validate_user_id,
    get_user_by_email,
};
