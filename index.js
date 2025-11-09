const EXPRESS = require("express");
const APP = EXPRESS();

const LOGIN = require("./src/login.js");

const PORT = process.env.PORT || 8080;
const ERR_PAGE = "404";

APP.use("/index.html", (req, res) => res.send(ERR_PAGE));
APP.use("/", EXPRESS.static("./public/index.html"));
APP.use(EXPRESS.static("./public"));

APP.use((req, res) => {
    res.send(ERR_PAGE);
});

APP.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
