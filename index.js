const EXPRESS = require("express");
const BODYPARSER = require("body-parser");
const APP = EXPRESS();

const USER_MANAGER = require("./src/user_manager.js");

const PORT = process.env.PORT || 8080;
const ERR_PAGE = "404";

// expose ./public folder
// "/index.html" is replaced with "/"
APP.use("/index.html", (req, res) => res.send(ERR_PAGE));
APP.use("/", EXPRESS.static("./public/index.html"));
APP.use(EXPRESS.static("./public"));

APP.use(BODYPARSER.urlencoded({extended: true}));

APP.post("/register", (req, res) => {
    const {email, password, name, address} = req.body;

    if (USER_MANAGER.register_user(email, password, name, address)) {
        console.log(`Register Success: ${email}, ${password}`);
        res.status(200).send("Registered");
    } else {
        console.log(`Register Fail: ${email}, ${password}`);
        res.status(401).send("Register failed");
    }
});

APP.post("/login", (req, res) => {
    const {email, password} = req.body;

    if (USER_MANAGER.login_user(email, password)) {
        console.log(`Login Success: ${email}, ${password}`);
        res.status(200).send("Logged in");
    } else {
        console.log(`Login Fail: ${email}, ${password}`);
        res.status(401).send("Log in failed");
    }
});

// send error page to all unknown route
APP.use((req, res) => {
    res.send(ERR_PAGE);
});

APP.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
