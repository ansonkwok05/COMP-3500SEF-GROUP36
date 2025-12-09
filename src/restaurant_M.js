const sqlite3 = require("sqlite3");
const { generate_uuid } = require("./utils");

let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);

    db.get("PRAGMA table_info(menu_items)", (err, row) => {
        if (err) return console.error(err);
        db.all("PRAGMA table_info(menu_items)", (err, rows) => {
            if (err) return;

            const hasQuantity = rows.some(r => r.name === 'quantity');
            if (!hasQuantity) {
                console.log("Adding missing 'quantity' column to menu_items...");
                db.run("ALTER TABLE menu_items ADD COLUMN quantity INTEGER DEFAULT 0", (err) => {
                    if (err) console.error("Failed to add quantity column:", err);
                    else console.log("Successfully added quantity column!");
                });
            }
        });
    });
}


async function check_dup(name, r_id, dataset) {
    return new Promise((resolve) => {
        if (dataset === "restaurants") {
            db.get(
                'SELECT name FROM restaurants WHERE name = ?',
                [name],
                function(err, row) {
                    if (err) {
                        resolve(false);
                    } else {
                        resolve(!!row);
                    }
                }
            );
        } else if (dataset === "menu_items") {
            db.get(
                'SELECT name FROM menu_items WHERE r_id = ? AND name = ?',
                [r_id, name],
                function(err, row) {
                    if (err) {
                        resolve(false);
                    } else {
                        resolve(!!row);
                    }
                }
            );
        } else {
            resolve(false);
        }
    });
}

async function Add_Restaurant(r_id, name, address, cuisine) {
    return new Promise((resolve) => {
        db.run(
            'INSERT INTO restaurants (r_id, name, address, cuisine, rating) VALUES (?, ?, ?, ?, 0)',
            [r_id, name, address, cuisine],
            function(err) {
                if (err) {
                    console.error("Error adding restaurant:", err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

async function Add_Menu_item(r_id, name, price, description) {
    return new Promise((resolve) => {
        const m_id = generate_uuid(16);
        db.run(
            'INSERT INTO menu_items (m_id, name, price, description, r_id, quantity) VALUES (?, ?, ?, ?, ?, 0)',
            [m_id, name, parseFloat(price), description || "", r_id],
            function(err) {
                if (err) {
                    console.error("Error adding menu item:", err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

async function del_Menu_item(r_id, name) {
    return new Promise((resolve) => {
        db.run(
            'DELETE FROM menu_items WHERE name = ? AND r_id = ?',
            [name, r_id],
            function(err) {
                if (err) {
                    console.error("Error deleting menu item:", err);
                    resolve(false);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

async function updateMenuItem(r_id, m_id, name, price, description, quantity) {
    return new Promise((resolve) => {
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
        }
        if (price !== undefined) {
            updates.push("price = ?");
            values.push(parseFloat(price));
        }
        if (description !== undefined) {
            updates.push("description = ?");
            values.push(description);
        }
        if (quantity !== undefined) {
            updates.push("quantity = ?");
            values.push(parseInt(quantity));
        }

        if (updates.length === 0) {
            resolve(false);
            return;
        }

        values.push(m_id);
        values.push(r_id);

        db.run(
            `UPDATE menu_items SET ${updates.join(", ")} WHERE m_id = ? AND r_id = ?`,
            values,
            function(err) {
                if (err) {
                    console.error("Error updating menu item:", err);
                    resolve(false);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

module.exports = {
    initialize_db,
    Add_Restaurant,
    Add_Menu_item,
    del_Menu_item,
    updateMenuItem,
    check_dup
};
