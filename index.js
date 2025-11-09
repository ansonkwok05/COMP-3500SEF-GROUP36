const EXPRESS = require("express");
const APP = EXPRESS();
const PORT = process.env.PORT || 8080;

const login = require("src/login.js");

APP.use(EXPRESS.static("public"));
APP.use("/", EXPRESS.static("public/index.html"));

APP.get("/", (req, res) => {
    res.send("public/index.html");
});

APP.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
