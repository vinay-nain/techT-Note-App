const express = require("express");
const jwt = require("jsonwebtoken");
const asyncWrap = require("../utils/asyncWrap.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/expressError");

const router = express.Router();

// authentication
router.get("/signup", (req, res) => {
    res.render("./auth/signup.ejs");
});

router.post(
    "/signup",
    asyncWrap(async (req, res) => {
        let { name, email, password } = req.body;
        if (!name || !email || !password)
            throw new ExpressError(400, "all fields are required");
        if (password.length < 6)
            throw new ExpressError(
                400,
                "password must be greater than 6 chars"
            );

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            throw new ExpressError(400, "invalid email format");

        const existingUser = await User.findOne({ email });
        if (existingUser) throw new ExpressError(401, "email already exists");

        const newUser = await User.create({
            name,
            email,
            password,
        });

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000,
        });
        console.log(newUser);
        res.redirect("/notes");
    })
);

router.get("/login", (req, res) => {
    res.render("./auth/login.ejs");
});

router.post(
    "/login",
    asyncWrap(async (req, res) => {
        let { email, password } = req.body;

        if (!email || !password)
            throw new ExpressError(400, "all fields are required");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            throw new ExpressError(400, "enter valid email");

        const user = await User.findOne({ email });
        if (!user) throw new ExpressError(400, "invalid email or password");

        const isPasswordCorrect = await user.matchPassword(password);

        if (!isPasswordCorrect) throw new ExpressError(400, "invalid password");

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.redirect("/notes");
    })
);

router.post("/logout", (req, res) => {
    res.clearCookie("jwt");
    res.redirect("/login");
});

module.exports = router;
