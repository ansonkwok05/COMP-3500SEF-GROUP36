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

const PORT = process.env.PORT || 8080;
const ERR_MESSAGE = "404 Page not found";

// expose ./public folder, which everyone can access
APP.use(EXPRESS.static("./public"));

APP.use(BODYPARSER.urlencoded({ extended: true }));

APP.use(
    "/success/",
    EXPRESS.static(path.join(__dirname, "/protected/success"))
);

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

        res.redirect("/protected/DeliTakeOrder/TakeOrder.html");

    } else {
        console.log(`Deliveryman Login Failed: ${email}`);
        res.status(401).send("Incorrect password");
    }
});

// check authentication status, block unauthenticated users
APP.use(async (req, res, next) => {
    if (req.session && req.session.userID) {
        // userID exists, but still need to validate
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

// only logged in users can access under this

APP.use(
    "/restaurantList/",
    EXPRESS.static(path.join(__dirname, "/protected/restaurantList"))
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
        db.all('SELECT id, status FROM orders WHERE userid = ?', [userID], (err, rows) => {
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
        let db = new sqlite3.Database(db_path);

        // initialize database tables
        db.serialize(() => {
            db.run(
                "CREATE TABLE IF NOT EXISTS users (id CHAR(16) PRIMARY KEY NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, name VARCHAR(255), address VARCHAR(255))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS restaurants (r_id CHAR(16) PRIMARY KEY NOT NULL, name VARCHAR(255) NOT NULL, address VARCHAR(255), cuisine VARCHAR(30), rating REAL)"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS menu_items (m_id CHAR(16) PRIMARY KEY NOT NULL, name VARCHAR(255), price REAL, description VARCHAR(255), r_id CHAR(16) NOT NULL, FOREIGN KEY (r_id) REFERENCES restaurants (r_id))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS cart_items (c_id CHAR(16) PRIMARY KEY NOT NULL, u_id CHAR(16) NOT NULL, quantity INTEGER, m_id CHAR(16) NOT NULL, FOREIGN KEY (m_id) REFERENCES menu_items (m_id))"
            );
            db.run(
                "CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY NOT NULL, userID CHAR(16) NOT NULL, status VARCHAR(50) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userID) REFERENCES users (id))"
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
                "INSERT OR REPLACE INTO menu_items (m_id, name, price, description, r_id)";
            db.run(
                `${menu_items_prefix} VALUES ("sdfbhdfgert", "Big Mac", 46, "Burger with patty", "id1")`
            );
            db.run(
                `${menu_items_prefix} VALUES ("dfgsfgd", "McChicken", 35, "Burger with crispy chicken", "id1")`
            );
            db.run(
                `${menu_items_prefix} VALUES ("wtw4t", "Chicken Bucket", 138.9, "6 pieces of crispy chicken", "id2")`
            );
            db.run(
                `${menu_items_prefix} VALUES ("34t4ta4ta", "Chicken Tenders", 82.67, "Chicken strips coated in seasoning", "id2")`
            );
            db.run(
                `${menu_items_prefix} VALUES ("w4tw44", "Pepperoni Supreme Pizza", 199, "Big pepperoni pizza", "id3")`
            );
            db.run(
                `${menu_items_prefix} VALUES ("ertetrateratawe", "Chicken Tenders", 58, "Chicken strips coated in seasoning", "id4")`
            );
        });

        await new Promise(resolve => {
            db.close(() => {
                USER_MANAGER.initialize_db(db_path);
                RESTAURANT.initialize_db(db_path);
                CART_MANAGER.initialize_db(db_path);

                resolve();
            });
        })

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
