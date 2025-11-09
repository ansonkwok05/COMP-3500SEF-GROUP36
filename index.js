const EXPRESS = require("express");
const APP = EXPRESS();

const USER_MANAGER = require("./src/user_manager.js");

const PORT = process.env.PORT || 8080;
const ERR_PAGE = "404";

// expose ./public folder
// "/index.html" is replaced with "/"
APP.use("/index.html", (req, res) => res.send(ERR_PAGE));
APP.use("/", EXPRESS.static("./public/index.html"));
APP.use(EXPRESS.static("./public"));

APP.use(EXPRESS.urlencoded({extended: true}));
APP.use(EXPRESS.json());

APP.post("/register", (req, res) => {
    const {email, password} = req.body;

    console.log(`Register attempt: ${email}, ${password}}`);

    USER_MANAGER.register_user(email, password);
});

APP.post("/login", (req, res) => {
    const {email, password} = req.body;

    console.log(`Login attempt: ${email}, ${password}}`);

    USER_MANAGER.login_user(email, password);
});

// send error page to all unknown route
APP.use((req, res) => {
    res.send(ERR_PAGE);
});

APP.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
