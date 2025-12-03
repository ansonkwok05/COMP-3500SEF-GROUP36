const sqlite3 = require("sqlite3");

const { generate_uuid } = require("./utils.js");

// sqlite db connection
// initialized during runtime
let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
}

async function get_cart(user_id) {
    let cart_list = await new Promise(resolve => {
        db.all("SELECT m_id, quantity FROM cart_items WHERE u_id = ?", [user_id], (err, rows) => {
            resolve(rows);
        })
    });

    let cart_items = [];

    return new Promise(resolve => {
        if (cart_list.length == 0) {
            resolve(cart_items);
            return;
        }

        cart_list.forEach(async item => {
            let item_description = await new Promise(resolve => {
                db.get("SELECT name, price, description FROM menu_items WHERE m_id = ?", [item.m_id], (err, row) => {
                    resolve(row);
                });
            });

            cart_items.push({
                id: item.m_id,
                quantity: item.quantity,
                name: item_description.name,
                price: item_description.price,
                description: item_description.description,
            })

            if (cart_items.length == cart_list.length) {
                resolve(cart_items);
            }
        });
    });
}

async function add_to_cart(user_id, menu_item_id) {
    let current_cart_item_quantity = await new Promise(resolve => {
        db.get("SELECT quantity FROM cart_items WHERE u_id = ? AND m_id = ?", [user_id, menu_item_id], (err, row) => {
            resolve(row);
        });
    })

    // check if cart item doesnt exists in db
    if (current_cart_item_quantity === undefined) {
        return new Promise(resolve => {
            db.run("INSERT INTO cart_items (c_id, u_id, quantity, m_id) VALUES (?, ?, ?, ?)", [generate_uuid(16), user_id, 1, menu_item_id], (err) => {
                if (err) {
                    // probably database data misinput e.g. unknown menu_item_id, contraints
                    console.log(err);
                    resolve(0);
                    return;
                }
                resolve(1);
            })
        });
    }

    let new_quantity = current_cart_item_quantity.quantity + 1;

    // cart item already exists, update to + 1 quantity
    return new Promise(resolve => {
        db.run("UPDATE cart_items SET quantity = ? WHERE u_id = ? AND m_id = ?", [new_quantity, user_id, menu_item_id], () => {
            resolve(new_quantity);
        })
    });
}

async function change_item_amount(user_id, menu_item_id, quantity) {
    let current_quantity = await new Promise(resolve => {
        db.get("SELECT quantity FROM cart_items WHERE u_id = ? AND m_id = ?", [user_id, menu_item_id], (err, row) => {
            resolve(row);
        });
    });

    if (current_quantity === undefined) {
        return 0;
    }

    return new Promise(resolve => {
        db.run("UPDATE cart_items SET quantity = ? WHERE u_id = ? AND m_id = ?", [quantity, user_id, menu_item_id], (err) => {
            resolve(quantity);
        })
    });
}

async function remove_from_cart(user_id, menu_item_id) {
    return new Promise(resolve => {
        db.run("DELETE FROM cart_items WHERE u_id = ? AND m_id = ?", [user_id, menu_item_id], () => {
            resolve(true);
        })
    })
}

async function clear_cart(user_id) {
    return new Promise(resolve => {
        db.run("DELETE FROM cart_items WHERE u_id = ?", [user_id], () => {
            resolve(true);
        })
    })
}

module.exports = {
    initialize_db,
    get_cart,
    add_to_cart,
    change_item_amount,
    remove_from_cart,
    clear_cart,
};
