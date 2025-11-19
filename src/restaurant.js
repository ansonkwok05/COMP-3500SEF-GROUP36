const sqlite3 = require("sqlite3");

// sqlite db connection
// initialized during runtime
let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
}

async function get_restaurant_list() {
    return new Promise((resolve) => {
        db.all("SELECT r_id AS id, name, cuisine FROM restaurants", [], (err, rows) => {
            resolve(rows);
        });
    });
}

async function get_menu(restaurant_id) {
    let r_data = await new Promise((resolve) => {
        db.get(
            "SELECT name, address, cuisine, rating FROM restaurants WHERE r_id = ?",
            [restaurant_id],
            (err, row) => {
                resolve(row);
            }
        );
    });

    // return false if restaurant is not found
    if (r_data === undefined) {
        return false;
    }

    let m_items = await new Promise((resolve) => {
        db.all(
            "SELECT m_id AS id, name, price, description FROM menu_items WHERE r_id = ?",
            [restaurant_id],
            (err, rows) => {
                resolve(rows);
            }
        );
    });

    r_data.menu_items = m_items;

    return r_data;
}

function update_menu_item(restaurant_id, menu_item_id, new_menu_item) {
    // todo, will be used by admins
    return true;
}

module.exports = { initialize_db, get_restaurant_list, get_menu };
