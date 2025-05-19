const express = require("express");
const asyncWrap = require("../utils/asyncWrap.js");
const Note = require("../models/notes.js");
const User = require("../models/user.js");
const protectRoute = require("../middleware/auth.js");

const router = express();

// root
router.get("/", protectRoute, (req, res) => {
    res.status(200).send("root working!");
});

// show all notes
router.get(
    "/notes",
    protectRoute,
    asyncWrap(async (req, res) => {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .select("-password")
            .populate("notes");
        res.status(200).render("./notes/show", { user });
    })
);

// new
router.post(
    "/notes",
    protectRoute,
    asyncWrap(async (req, res) => {
        let newNote = new Note(req.body.newNote);
        await newNote.save();
        let newNoteId = newNote._id;
        const userId = req.user.id;
        const user = req.user;
        user.notes.push(newNoteId);
        const result = await User.findByIdAndUpdate(userId, user);
        res.status(200).redirect("/notes");
    })
);

// remainders
router.get(
    "/remainders",
    protectRoute,
    asyncWrap(async (req, res) => {
        let notes = await Note.find();
        res.status(200).render("./notes/remainders", { notes });
    })
);

// archive
router.get(
    "/archive",
    protectRoute,
    asyncWrap(async (req, res) => {
        res.status(200).render("./notes/archive");
    })
);

// trash
router.get(
    "/trash",
    protectRoute,
    asyncWrap(async (req, res) => {
        res.status(200).render("./notes/trash");
    })
);

// note
router.get(
    "/notes/:id",
    protectRoute,
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
        res.status(200).render("./notes/edit", { note });
    })
);

router.patch(
    "/notes/:id",
    protectRoute,
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findById(id).select({ pinned: 1 });
        result.pinned = !result.pinned ? true : false;
        await Note.findByIdAndUpdate(
            id,
            { pinned: result.pinned },
            { new: true }
        );
        res.status(200).redirect("/notes");
    })
);

router.put(
    "/notes/:id",
    protectRoute,
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findByIdAndUpdate(id, {
            ...req.body.newNote,
            remind: req.body.newNote.remind
                ? new Date(req.body.newNote.remind)
                : null,
        });
        res.status(200).redirect(`/notes/${id}`);
    })
);

router.delete(
    "/notes/:id",
    protectRoute,
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findByIdAndDelete(id);
        console.log(result);
        res.status(200).redirect("/notes");
    })
);

module.exports = router;
