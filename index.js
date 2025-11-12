const EXPRESS = require("express");
const SESSION = require("express-session");
const BODYPARSER = require("body-parser");
const APP = EXPRESS();

const path = require("path");

const UTILS = require("./src/utils.js");
const USER_MANAGER = require("./src/user_manager.js");
const RESTAURANT = require("./src/restaurant.js");

const PORT = process.env.PORT || 8080;
const ERR_MESSAGE = "404 Page not found";

// expose ./auth folder, which both authorized and unauthorized people can access
APP.use(EXPRESS.static("./auth"));

APP.use(BODYPARSER.urlencoded({extended: true}));

// session for authorization after user log in
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

APP.post("/register", (req, res) => {
    const {email, password, name, address} = req.body;

    if (USER_MANAGER.register_user(email, password, name, address)) {
        console.log(
            `Register Success: ${email}, ${password}, ${name}, ${address}`
        );
        res.status(200).send("Registered");
    } else {
        console.log(
            `Register Fail: ${email}, ${password}, ${name}, ${address}`
        );
        res.status(401).send("Register failed");
    }
});

APP.post("/login", (req, res) => {
    const {email, password} = req.body;

    if (USER_MANAGER.login_user(email, password)) {
        console.log(`Login Success: ${email}, ${password}`);

        // set session userID so user only need to sign in once per session
        req.session.userID = USER_MANAGER.get_user_id(email);
        res.status(200).json({success: true});
    } else {
        console.log(`Login Fail: ${email}, ${password}`);
        res.status(401).json({
            success: false,
            reason: "incorrect email or password",
        });
    }
});

// check authentication status, block unauthenticated users
APP.use((req, res, next) => {
    if (req.session && req.session.userID) {
        // userID exists, but still need to validate
        if (USER_MANAGER.validate_user_id(req.session.userID)) return next();
    }
    console.log(`Redirected connection "${req.path}" -> "/login.html"`);
    res.redirect("/login.html");
});

// expose ./public to authorized users only
APP.use(EXPRESS.static("public"));

APP.get("/menu.html", (req, res) => {
    res.status(404).send(ERR_MESSAGE);
});

APP.use("/restaurants/menu/", EXPRESS.static("./public"));

APP.get("/restaurants/menu/:id/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/menu.html"));
});

APP.get("/api/restaurants", (req, res) => {
    // return list of restaurant
    res.status(200).json({
        restaurants: RESTAURANT.get_restaurant_list(),
    });
});

APP.get("/api/restaurants/menu/:id", (req, res) => {
    // return menu by restaurant id
    let menu = RESTAURANT.get_menu(req.params.id);

    if (menu === false)
        return res.status(404).json({
            error: "Restaurant not found",
        });

    res.status(200).json(menu);
});

// send error page to all unknown route
APP.use((req, res) => {
    res.status(404).send(ERR_MESSAGE);
});

APP.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
