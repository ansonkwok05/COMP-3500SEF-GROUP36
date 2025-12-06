const sqlite3 = require("sqlite3");
const {generate_uuid} = require("./utils");


// sqlite db connection
// initialized during runtime
let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
}

async function check_dup(name, r_id, dataset) {
    return new Promise((resolve, reject) => {
        if (dataset === "restaurants") {
            db.get(
                'SELECT name FROM restaurants WHERE name = ?',
                [name],
                function(err) {
                    if (err) {
                        resolve(false);
                        return false;
                    }}
            );
        } else if (dataset === "menu_items") {
            db.get(
                'SELECT name FROM menu_items WHERE r_id = ? AND name = ?',
                [r_id, name],
                function(err) {
                    if (err) {
                        resolve(false);
                        return false;
                    }}
            );
        }
    });
}



async function Add_Restaurant(r_id, name,address, cuisine) {
    return new Promise(async (resolve) => {
        const isUnique = await check_dup(name, r_id, "restaurants")

        if (isUnique === null) return;

        if (!isUnique) {
            return false;
        }

        db.run(
            'INSERT INTO restaurants (r_id, name, address, cuisine, rating) VALUES (?, ?, ?, ?, null)',
            [r_id, name, address, cuisine],
            function(err) {
                if (err) {
                    resolve(false);
                    return false;
                }
            }
        );
    });}

async function Add_Menu_item(r_id, name,price, description) {
    check_dup(name,r_id,"menu_items");

    const row = await db.get(
        'SELECT COUNT(*) as count FROM menu_items WHERE r_id = ?',
        [r_id]
    );
    await db.run(
        `INSERT INTO menu_items (m_id, name, price, description, r_id)
         VALUES (?, ?, ?, ?, ?)`,
        [row + 1, name, price, description,r_id],
        function (err) {
            if (err) {
                resolve(false);
            } else {
                resolve(true);

            }
        }
    );
}
async function del_Menu_item(r_id, name) {
    await db.run(
        'DELETE FROM menu_items where name = ? and r_id =? VALUES (?,?)' ,
        [name,r_id]
    );
}

async function updateMenuItem(r_id, m_id, name, price, description) {
    await dbRun(
        `UPDATE menu_items SET name = ?, price = ?, description = ? WHERE r_id = ? AND m_id = ?`,
        [name, price, description, r_id, m_id]
    );
}


module.exports = { initialize_db, Add_Restaurant , Add_Menu_item, del_Menu_item, updateMenuItem,check_dup};