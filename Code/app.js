const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const dotevn = require("dotenv");
dotevn.config();

const ExpressError = require("./utils/expressError");
const userRouter = require("./routes/user.js")
const authRouter = require("./routes/auth.js");
const { log } = require("console");
const cookieParser = require("cookie-parser");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride("_method"));
app.use(cookieParser())
app.engine("ejs", ejsMate);

const port = 8080;
const MONGO_URL = `mongodb://localhost:27017/notes`;

// db connections
async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => console.log("connected to db"))
    .catch((err) => console.log(err));

// ---------routes----------

app.use(userRouter)
app.use(authRouter);

// 404-notfound
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    console.log(err);
    let { statusCode = 500, message = "Page not Found!" } = err;
    res.status(statusCode).render("error", { message });
});

app.listen(port, () => {
    console.log(`app is listening to port ${port}`);
});
