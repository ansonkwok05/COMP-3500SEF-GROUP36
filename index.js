const EXPRESS = require("express");
const SESSION = require("express-session");
const BODYPARSER = require("body-parser");
const APP = EXPRESS();

const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");

const UTILS = require("./src/utils.js");
const USER_MANAGER = require("./src/user_manager.js");
const RESTAURANT = require("./src/restaurant.js");
const CART_MANAGER = require("./src/cart_manager.js");
const SHOP_OWNER_INFO = require("./src/Shop_owner_infos.js");
const RESTAURANT_M = require("./src/restaurant_M.js");

const PORT = process.env.PORT || 8080;
const ERR_MESSAGE = "404 Page not found";

let db;

// expose ./public folder, which everyone can access
APP.use(EXPRESS.static("./public"));

APP.use(BODYPARSER.json());
APP.use(BODYPARSER.urlencoded({ extended: true }));

// session for authentication after user log in
APP.use(
    SESSION({
        secret: process.env.SESSION_SECRET || UTILS.generate_uuid(16),
        resave: false,
        saveUninitialized: true,
        cookie: {
            path: "/",
            httpOnly: false,
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

APP.post("/register", async (req, res) => {
    const { email, password, name, address } = req.body;

    if (await USER_MANAGER.register_user(email, password, name, address)) {
        console.log(
            `Register Success: ${email}, ${password}, ${name}, ${address}`
        );

        // login automatically after register success
        req.session.email = email;
        req.session.userID = await USER_MANAGER.get_user_id(email);
        res.redirect("/restaurantList/restaurantList.html");
    } else {
        console.log(
            `Register Fail: ${email}, ${password}, ${name}, ${address}`
        );
        res.status(401).send("Register failed");
    }
});

APP.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (await USER_MANAGER.login_user(email, password)) {
        console.log(`Login Success: ${email}, ${password}`);

        // set session email and userID so user only need to sign in once per session
        req.session.email = email;
        req.session.userID = await USER_MANAGER.get_user_id(email);
        res.redirect("/restaurantList/restaurantList.html");
    } else {
        console.log(`Login Fail: ${email}, ${password}`);
        res.status(401).json({
            success: false,
            reason: "incorrect email or password",
        });
    }
});

//Deliveryman register
APP.post("/deli_register", async (req, res) => {
    const { email, password, name, address } = req.body;

    // forcely check end
    if (!email || !email.endsWith("@delivery")) {
        return res.status(400).send("Email must end with @delivery");
    }

    if (!password || password.length < 8) {
        return res.status(400).send("Password must be at least 8 characters");
    }

    const success = await USER_MANAGER.register_user(email, password, name, address);

    if (success) {
        res.status(200).send("Deliveryman account created successfully!");
    } else {
        // check for different error
        const existingUser = await USER_MANAGER.get_user_by_email(email);
        if (existingUser) {
            res.status(400).send("This email is already registered");
        } else {
            res.status(500).send("Registration failed. Please try again later.");
        }
    }
});

//Deliveryman Login
APP.post("/deli_login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !email.endsWith("@delivery")) {
        return res.status(403).send("This login is for deliverymen only");
    }

    if (await USER_MANAGER.login_user(email, password)) {
        console.log(`Deliveryman Login Success: ${email}`);

        req.session.email = email;
        req.session.userID = await USER_MANAGER.get_user_id(email);
        req.session.isDelivery = true;

        res.redirect("/DeliTakeOrder/TakeOrder.html");

    } else {
        console.log(`Deliveryman Login Failed: ${email}`);
        res.status(401).send("Incorrect password");
    }
});

//Shop Owner Login
APP.post("/ShopOwnerReg", async (req, res) => {
    const {name, email, password, r_name, r_address} = req.body;

    if (await SHOP_OWNER_INFO.register_owner(email, password, name, r_name, r_address)) {
        console.log(
            `Register Success: ${name},${email} ,${password}, ${r_name}, ${r_address}`
        );

        // login automatically after register success
        req.session.email = email;
        req.session.userID = await SHOP_OWNER_INFO.get_R_users_id(email);
        req.session.isShopOwner = true;

        res.redirect("/protected/MenuModify/Dashboard.html");
    } else {
        console.log(
            `Register Fail: ${name},${email} ,${password}, ${r_name}, ${r_address}`
        );
        res.status(401).send("Register failed");
    }
});

APP.post("/ShopOwnerLogin", async (req, res) => {
    const {email, password } = req.body;

    if (await SHOP_OWNER_INFO.login_R_user(email, password)) {
        console.log(`Login Success: ${email}, ${password}`);

        // set session email and userID so user only need to sign in once per session
        req.session.email = email;
        req.session.userID = await SHOP_OWNER_INFO.get_R_users_id(email);
        req.session.isShopOwner = true;

        res.redirect("/protected/MenuModify/Dashboard.html");
    } else {
        console.log(`Login Fail: ${email}, ${password}`);
        res.status(401).json({
            success: false,
            reason: "incorrect email or password",
        });
    }
});

// check authentication status, block unauthenticated users
APP.use(async (req, res, next) => {
    if (req.session && req.session.userID && req.session.email) {
        // userID exists, but still need to validate
        if (await SHOP_OWNER_INFO.validate_r_user_id(
            req.session.email,
            req.session.userID
        )){
            return next();
        }

        if (
            await USER_MANAGER.validate_user_id(
                req.session.email,
                req.session.userID
            )
        )
            return next();
    }
    console.log(`Redirected connection "${req.path}" -> "/login.html"`);
    res.redirect("/login.html");
});

// logged owner section
// Shop Owner section//
APP.use(
    "/protected/MenuModify/",
    EXPRESS.static(path.join(__dirname, "/protected/MenuModify"))
);

APP.use(
    "/protected/MenuModify/settings/",
    EXPRESS.static(path.join(__dirname, "/protected/MenuModify/setting"))
);

APP.get("/protected/MenuModify/settings.html", (req, res) => {
    if (!req.session.isShopOwner) {
        return res.redirect("/login.html");
    }
    res.sendFile(path.join(__dirname, "/protected/MenuModify/setting.html"));
});

// Route for the settings JavaScript file

APP.get("/api/shopowner/restaurant", async (req, res) => {
    if (!req.session.isShopOwner) {
        return res.status(403).json({ error: "Access denied. Shop owners only." });
    }

    try {
        const restaurant = await new Promise((resolve) => {
            db.get(
                "SELECT r_id AS id, name, address, cuisine FROM restaurants WHERE r_id = ?",
                [req.session.userID],
                (err, row) => {
                    if (err) {
                        console.error("Database error:", err);
                        resolve(null);
                    } else {
                        resolve(row);
                    }
                }
            );
        });

        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found. Please create one in settings." });
        }

        res.status(200).json(restaurant);
    } catch (error) {
        console.error("Error getting restaurant:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create or update restaurant
APP.post("/api/shopowner/restaurant", async (req, res) => {
    if (!req.session.isShopOwner) {
        return res.status(403).json({ error: "Access denied" });
    }

    const { name, address, cuisine } = req.body;

    if (!name || !address || !cuisine) {
        return res.status(400).json({ error: "All fields are required: name, address, cuisine" });
    }

    try {
        // Check if restaurant already exists for this shop owner
        const existing = await new Promise((resolve) => {
            db.get(
                "SELECT r_id FROM restaurants WHERE r_id = ?",
                [req.session.userID],
                (err, row) => {
                    resolve(!!row);
                }
            );
        });

        if (existing) {
            // Update existing restaurant
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE restaurants SET name = ?, address = ?, cuisine = ? WHERE r_id = ?",
                    [name, address, cuisine, req.session.userID],
                    function(err) {
                        if (err) {
                            console.error("Update error:", err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        } else {
            // Create new restaurant
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO restaurants (r_id, name, address, cuisine, rating) VALUES (?, ?, ?, ?, 0)",
                    [req.session.userID, name, address, cuisine],
                    function(err) {
                        if (err) {
                            console.error("Insert error:", err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant saved successfully",
            redirect: "/protected/MenuModify/Dashboard.html"
        });
    } catch (error) {
        console.error("Error saving restaurant:", error);
        res.status(500).json({ error: "Failed to save restaurant. Please try again." });
    }
});

// Get menu items for shop owner
APP.get("/api/shopowner/menu", async (req, res) => {
    if (!req.session.isShopOwner) {
        return res.status(403).json({ error: "Access denied" });
    }

    try {
        const menuItems = await new Promise((resolve) => {
            db.all(
                "SELECT m_id AS id, name, price, description, quantity FROM menu_items WHERE r_id = ? ORDER BY name",
                [req.session.userID],
                (err, rows) => {
                    if (err) {
                        console.error("Database error:", err);
                        resolve([]);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });

        res.status(200).json({ menu_items: menuItems });
    } catch (error) {
        console.error("Error getting menu:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add new menu item
APP.post("/api/shopowner/menu", async (req, res) => {
    if (!req.session.isShopOwner) {
        return res.status(403).json({ error: "Access denied" });
    }

    const { name, price, description } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
    }

    try {
        const m_id = UTILS.generate_uuid(16);

        await new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO menu_items (m_id, name, price, description, r_id, quantity) VALUES (?, ?, ?, ?, ?, 0)",
                [m_id, name, parseFloat(price), description || "", req.session.userID],
                function(err) {
                    if (err) {
                        console.error("Insert error:", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });

        res.status(201).json({
            success: true,
            id: m_id,
            message: "Menu item added successfully"
        });
    } catch (error) {
        console.error("Error adding menu item:", error);
        res.status(500).json({ error: "Failed to add menu item" });
    }
});

// Update menu item (including quantity)
APP.put("/api/shopowner/menu/:id", async (req, res) => {
    if (!req.session.isShopOwner) {
        return res.status(403).json({ error: "Access denied" });
    }

    const { name, price, description, quantity } = req.body;
    const m_id = req.params.id;

    try {
        // Check if menu item belongs to this restaurant
        const belongs = await new Promise((resolve) => {
            db.get(
                "SELECT m_id FROM menu_items WHERE m_id = ? AND r_id = ?",
                [m_id, req.session.userID],
                (err, row) => {
                    resolve(!!row);
                }
            );
        });

        if (!belongs) {
            return res.status(404).json({ error: "Menu item not found or access denied" });
        }

        // Build update query based on provided fields
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
            return res.status(400).json({ error: "No updates provided" });
        }

        values.push(m_id);
        values.push(req.session.userID);

        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE menu_items SET ${updates.join(", ")} WHERE m_id = ? AND r_id = ?`,
                values,
                function(err) {
                    if (err) {
                        console.error("Update error:", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully"
        });
    } catch (error) {
        console.error("Error updating menu item:", error);
        res.status(500).json({ error: "Failed to update menu item" });
    }
});

// Delete menu item
APP.delete("/api/shopowner/menu/:id", async (req, res) => {
    if (!req.session.isShopOwner) {
        return res.status(403).json({ error: "Access denied" });
    }

    const m_id = req.params.id;

    try {
        // Check if menu item belongs to this restaurant
        const belongs = await new Promise((resolve) => {
            db.get(
                "SELECT m_id FROM menu_items WHERE m_id = ? AND r_id = ?",
                [m_id, req.session.userID],
                (err, row) => {
                    resolve(!!row);
                }
            );
        });

        if (!belongs) {
            return res.status(404).json({ error: "Menu item not found or access denied" });
        }

        // Delete the menu item
        await new Promise((resolve, reject) => {
            db.run(
                "DELETE FROM menu_items WHERE m_id = ? AND r_id = ?",
                [m_id, req.session.userID],
                function(err) {
                    if (err) {
                        console.error("Delete error:", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).json({ error: "Failed to delete menu item" });
    }
});

// only logged in users can access under this

APP.use(
    "/restaurantList/",
    EXPRESS.static(path.join(__dirname, "/protected/restaurantList"))
);

APP.use(
    "/DeliTakeOrder",
    EXPRESS.static(path.join(__dirname, "/protected/DeliTakeOrder"))
);

APP.use(
    "/restaurants/menu/",
    EXPRESS.static(path.join(__dirname, "/protected/menu"))
);

APP.get("/restaurants/menu/:id/", (req, res) => {
    res.sendFile(path.join(__dirname, "/protected/menu/menu.html"));
});

APP.get("/api/restaurants", async (req, res) => {
    // return list of restaurant
    res.status(200).json({
        restaurants: await RESTAURANT.get_restaurant_list(),
    });
});

APP.get("/api/restaurants/menu/:id", async (req, res) => {
    // return menu by restaurant id
    let menu = await RESTAURANT.get_menu(req.params.id);

    if (menu === false)
        return res.status(404).json({
            error: "Restaurant not found",
        });

    res.status(200).json(menu);
});

APP.get("/api/cart", async (req, res) => {
    // return an array containing all the cart items
    // contains: menu item id, quantity, name, price, description
    res.status(200).json({
        items: await CART_MANAGER.get_cart(await USER_MANAGER.get_user_id(req.session.email))
    })
})

APP.post("/api/cart/add/:id", async (req, res) => {
    // add 1 of the menu item to cart
    // takes menu item id as argument, return the new quantity of that menu item in cart
    res.status(200).json({
        quantity: await CART_MANAGER.add_to_cart(await USER_MANAGER.get_user_id(req.session.email), req.params.id)
    });
})

APP.put("/api/cart/change/:id/:quantity", async (req, res) => {
    // change the quantity of one of the cart items
    // takes menu item id as argument, return the new quantity of that menu item in cart
    res.status(200).json({
        quantity: await CART_MANAGER.change_item_amount(await USER_MANAGER.get_user_id(req.session.email), req.params.id, req.params.quantity)
    });
})

APP.delete("/api/cart/remove/:id", async (req, res) => {
    // remove a specific menu item from cart
    // takes menu item id as argument, return true
    res.status(200).json({
        removed: await CART_MANAGER.remove_from_cart(await USER_MANAGER.get_user_id(req.session.email), req.params.id)
    });
})

APP.delete("/api/cart/clear", async (req, res) => {
    // remove a specific menu item from cart
    // takes menu item id as argument, return true
    res.status(200).json({
        cleared: await CART_MANAGER.clear_cart(await USER_MANAGER.get_user_id(req.session.email))
    });
})

APP.use(BODYPARSER.json());
APP.use(BODYPARSER.urlencoded({ extended: true }));


APP.get("/api/get_user_id", (req, res) => {
    if (req.session && req.session.userID) {
        res.status(200).json({ userID: req.session.userID });
    } else {
        res.status(404).json({ error: "User not logged in" });
    }
});

APP.get("/api/orders", async (req, res) => {
    const userID = req.query.user_id;

    if (!userID) {
        return res.status(400).json({ error: "Missing user ID" });
    }

    const orders = await getOrdersForUser(userID);

    if (!orders) {
        return res.status(404).json({ orders: [] });
    }

    res.status(200).json({ orders });
});

async function getOrdersForUser(userID) {
    const db = new sqlite3.Database('./db/data.db');

    return new Promise((resolve, reject) => {
        db.all('SELECT id, status FROM orders WHERE userid = ? OR deliverymanID = ?', [userID, userID], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

APP.post("/api/create_order", async (req, res) => {
    const { orderID, userID, status } = req.body;

    if (!orderID || !userID || !status)  {
        return res.status(400).json({ error: "Missing necessary order information" });
    }

    const db = new sqlite3.Database('./db/data.db');

    db.run('INSERT INTO orders (id, userID, status) VALUES (?, ?, ?)', [orderID, userID, status], function(err) {
        if (err) {
            console.error("Error inserting order:", err);
            return res.status(500).json({ error: "Unable to create an order" });
        }
        res.status(201).json({ message: "Order created successfully" });
    });
});

APP.get("/api/all_orders", async (req, res) => {
    const db = new sqlite3.Database('./db/data.db');

    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM orders WHERE deliverymanID IS NULL', [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    }).then(orders => {
        res.status(200).json({ orders });
    }).catch(err => {
        console.error("Error fetching all orders:", err);
        res.status(500).json({ error: "Unable to fetch orders" });
    });
});

// Assign order to deliveryman
APP.put("/api/order/:orderId/assign", async (req, res) => {
    const orderId = req.params.orderId;
    const deliverymanId = req.session.userID;
    const db = new sqlite3.Database('./db/data.db');

    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE orders SET deliverymanID = ? WHERE id = ?',
            [deliverymanId, orderId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            }
        );
    }).then(result => {
        res.status(200).json(result);
    }).catch(err => {
        console.error("Error assigning order:", err);
        res.status(500).json({ error: "Unable to assign order" });
    }).finally(() => {
        db.close();
    });
});

// Get deliveryman's orders
APP.get("/api/my_delivery_orders", async (req, res) => {
    if (!req.session?.userID || !req.session?.isDelivery) {
        return res.status(403).json({ error: "Permission denied" });
    }

    const deliverymanID = req.query.deliverymanID || req.session.userID;

    const db = new sqlite3.Database('./db/data.db');
    
    db.all(
        `SELECT * FROM orders WHERE deliverymanID = ? ORDER BY created_at DESC`,
        [deliverymanID],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json({ orders: rows });
        }
    );
});

// Display all columns of the orders table
APP.get("/api/debug/orders/columns", (req, res) => {
    const db = new sqlite3.Database('./db/data.db');

    db.all("PRAGMA table_info(orders)", (err, rows) => {
        if (err) {
            console.error("Error getting table info:", err);
            res.status(500).json({ error: "Unable to get table info" });
        } else {
            console.log("Orders table columns:");
            rows.forEach(row => {
                console.log(`  ${row.name} (${row.type})`);
            });
            res.status(200).json({ columns: rows });
        }
        db.close();
    });
});

APP.use(
    "/order_tracking/",
    EXPRESS.static(path.join(__dirname, "/protected/order_tracking"))
);

APP.use(
    "/payment/",
    EXPRESS.static(path.join(__dirname, "/protected/payment"))
);

APP.get("/logout", (req, res) => {
    req.session.email = null;
    req.session.userID = null;
    res.redirect("/login.html");
});

// send error page to all unknown route
APP.use((req, res) => {
    res.status(404).send(ERR_MESSAGE);
});

async function start_app() {
    // create db folder for storing database files
    {
        let db_folder_path = path.join(__dirname, "/db");
        if (!fs.existsSync(db_folder_path)) {
            fs.mkdirSync(db_folder_path);
            console.log("Created db folder");
        }
    }

    // initialize sqlite database
    {
        let db_path = path.join(__dirname, "/db/data.db");
        db = new sqlite3.Database(db_path);

        // initialize database tables
        db.serialize(() => {
            db.run(
                "CREATE TABLE IF NOT EXISTS users (id CHAR(16) PRIMARY KEY NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, name VARCHAR(255), address VARCHAR(255))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS R_users (id CHAR(16) PRIMARY KEY NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, name VARCHAR(255))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS restaurants (r_id CHAR(16) PRIMARY KEY NOT NULL, name VARCHAR(255) NOT NULL, address VARCHAR(255), cuisine VARCHAR(30), rating REAL, FOREIGN KEY (r_id) REFERENCES R_users (id))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS menu_items (m_id CHAR(16) PRIMARY KEY NOT NULL, name VARCHAR(255), price REAL, description VARCHAR(255), r_id CHAR(16) NOT NULL, quantity INTEGER, FOREIGN KEY (r_id) REFERENCES R_users (id))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS cart_items (c_id CHAR(16) PRIMARY KEY NOT NULL, u_id CHAR(16) NOT NULL, quantity INTEGER, m_id CHAR(16) NOT NULL, FOREIGN KEY (m_id) REFERENCES menu_items (m_id))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY NOT NULL, userID CHAR(16) NOT NULL, deliverymanID CHAR(16), status VARCHAR(50) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userID) REFERENCES users (id), FOREIGN KEY (deliverymanID) REFERENCES users (id))"
            );
        });

        // initialize example data
        db.serialize(() => {
            // load test user
            db.run(
                `INSERT OR REPLACE INTO users (id, email, password, name, address) VALUES ("AAAAAAAAAAAAAAAA", "test@email", "testtest", "test name", "test address")`
            );

            // load restaurants
            let restaurant_prefix =
                "INSERT OR REPLACE INTO restaurants (r_id, name, address, cuisine, rating)";
            db.run(
                `${restaurant_prefix} VALUES ("id1", "McDonald's", "12 Street", "Fast-food", 3.4)`
            );
            db.run(
                `${restaurant_prefix} VALUES ("id2", "KFC", "345 Street", "Fast-food", 3.5)`
            );
            db.run(
                `${restaurant_prefix} VALUES ("id3", "Pizza Hut", "67 Street", "Italian", 3.6)`
            );
            db.run(
                `${restaurant_prefix} VALUES ("id4", "Saizeria", "89 Street", "Italian", 3.7)`
            );

            // load menu items
            let menu_items_prefix =
                "INSERT OR REPLACE INTO menu_items (m_id, name, price, description, r_id, quantity)";
            db.run(
                `${menu_items_prefix} VALUES ("sdfbhdfgert", "Big Mac", 46, "Burger with patty", "id1", 10)`
            );
            db.run(
                `${menu_items_prefix} VALUES ("dfgsfgd", "McChicken", 35, "Burger with crispy chicken", "id1", 10)`
            );
            db.run(
                `${menu_items_prefix} VALUES ("wtw4t", "Chicken Bucket", 138.9, "6 pieces of crispy chicken", "id2", 10)`
            );
            db.run(
                `${menu_items_prefix} VALUES ("34t4ta4ta", "Chicken Tenders", 82.67, "Chicken strips coated in seasoning", "id2", 10)`
            );
            db.run(
                `${menu_items_prefix} VALUES ("w4tw44", "Pepperoni Supreme Pizza", 199, "Big pepperoni pizza", "id3", 10)`
            );
            db.run(
                `${menu_items_prefix} VALUES ("ertetrateratawe", "Chicken Tenders", 58, "Chicken strips coated in seasoning", "id4", 10)`
            );
        });

        USER_MANAGER.initialize_db(db_path);
        RESTAURANT.initialize_db(db_path);
        CART_MANAGER.initialize_db(db_path);
        SHOP_OWNER_INFO.initialize_db(db_path);
        RESTAURANT_M.initialize_db(db_path);

        console.log("SQLite database initialized");
    }

    // start listening with express
    APP.listen(PORT, async (err) => {
        if (err) {
            console.error(
                `Failed to listen to port -> ${PORT}\n Reason: ${err}`
            );
            return;
        }

        console.log(`Start listening at port ${PORT}`);
        console.log();
    });
}

start_app();
