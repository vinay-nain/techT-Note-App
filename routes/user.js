const express = require("express");
const jwt = require("jsonwebtoken");
const asyncWrap = require("../utils/asyncWrap.js");
const Note = require("../models/notes.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/expressError");

const router = express();

// root
router.get("/", (req, res) => {
    res.status(200).send("root working!");
});

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
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
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
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
        });

        res.redirect("/notes");
    })
);

router.post("/logout", (req, res) => {
    res.clearCookie("jwt");
    res.redirect("/login");
});

// show all notes
router.get(
    "/notes",
    asyncWrap(async (req, res) => {
        const data = await Note.find();
        res.status(200).render("./notes/show", { data });
    })
);

// new
router.post(
    "/notes",
    asyncWrap(async (req, res) => {
        let newNote = new Note(req.body.newNote);
        await newNote.save();
        res.status(200).redirect("/notes");
    })
);

// remainders
router.get(
    "/remainders",
    asyncWrap(async (req, res) => {
        let notes = await Note.find();
        res.status(200).render("./notes/remainders", { notes });
    })
);

// archive
router.get(
    "/archive",
    asyncWrap(async (req, res) => {
        res.status(200).render("./notes/archive");
    })
);

// trash
router.get(
    "/trash",
    asyncWrap(async (req, res) => {
        res.status(200).render("./notes/trash");
    })
);

// note
router.get(
    "/notes/:id",
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let note = await Note.findById(id);

        if (note.remind) {
            const localRemind = new Date(
                note.remind.getTime() - note.remind.getTimezoneOffset() * 60000
            );
            note.localRemind = localRemind.toISOString().slice(0, 16);
        } else {
            note.localRemind = "";
        }
        console.log("get route");
        res.status(200).render("./notes/edit", { note });
    })
);

router.patch(
    "/notes/:id",
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findById(id).select({ pinned: 1 });
        result.pinned = !result.pinned ? true : false;
        await Note.findByIdAndUpdate(
            id,
            { pinned: result.pinned },
            { new: true }
        );
        console.log("patch route");
        res.status(200).redirect("/notes");
    })
)

router.put(
    "/notes/:id",
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findByIdAndUpdate(id, {
            ...req.body.newNote,
            remind: req.body.newNote.remind
                ? new Date(req.body.newNote.remind)
                : null,
        });
        console.log("put route");
        res.status(200).redirect(`/notes/${id}`);
    })
)

router.delete(
    "/notes/:id",
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findByIdAndDelete(id);
        console.log(result);
        console.log("delete route");
        res.status(200).redirect("/notes");
    })
)

module.exports = router;