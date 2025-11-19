// hardcoded restaurant data implemented with a js object
// this data is created for testing only
// todo: change this to a more acceptable way (using a database)
let restaurant_data = {
    1: {
        name: "McDonald's",
        address: "12 Street",
        cuisine: "Fast-food",
        rating: 3.4,
        menu_items: {
            1: {
                name: "Big Mac",
                price: 46,
                description: "Burger with patty",
            },
            2: {
                name: "McChicken",
                price: 35,
                description: "Burger with crispy chicken",
            },
        },
    },
    2: {
        name: "KFC",
        address: "345 Street",
        cuisine: "Fast-food",
        rating: 3.5,
        menu_items: {
            1: {
                name: "Chicken Bucket",
                price: 138,
                description: "6 pieces of crispy chicken",
            },
            2: {
                name: "Chicken Tenders",
                price: 82,
                description: "Chicken strips coated in seasoning",
            },
        },
    },
    3: {
        name: "Pizza Hut",
        address: "67 Street",
        cuisine: "Italian",
        rating: 3.6,
        menu_items: {
            1: {
                name: "Pepperoni Supreme Pizza",
                price: 199,
                description: "Big pepperoni pizza",
            },
        },
    },
    4: {
        name: "Saizeria",
        address: "89 Street",
        cuisine: "Italian",
        rating: 3.7,
        menu_items: {
            1: {
                name: "Pineapple & Bacon Pizza",
                price: 58,
                description: "Pizza with pineapple and bacon toppings",
            },
        },
    },
};

const sqlite3 = require("sqlite3");

// sqlite db connection
// initialized during runtime
let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
}

// todo convert to using sqlite

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

module.exports = {initialize_db, get_restaurant_list, get_menu};
