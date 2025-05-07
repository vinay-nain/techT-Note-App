const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const ExpressError = require("./utils/expressError");
const Note = require("./models/notes");
const asyncWrap = require("./utils/asyncWrap");
const { log } = require("console");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride("_method"));

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

// root
app.get("/", (req, res) => {
    res.status(200).send("root working!");
});

// show all notes
app.get(
    "/notes",
    asyncWrap(async (req, res) => {
        const data = await Note.find();
        res.status(200).render("./notes/show", { data });
    })
);

// new
app.post(
    "/notes",
    asyncWrap(async (req, res) => {
        let newNote = new Note(req.body.newNote);
        await newNote.save();
        res.status(200).redirect("/notes");
    })
);

// remainders
app.get(
    "/remainders",
    asyncWrap(async (req, res) => {
        let notes = await Note.find();
        res.status(200).render("./notes/remainders", { notes });
    })
);

// archive
app.get(
    "/archive",
    asyncWrap(async (req, res) => {
        res.status(200).render("./notes/archive");
    })
);

// trash
app.get(
    "/trash",
    asyncWrap(async (req, res) => {
        res.status(200).render("./notes/trash");
    })
);

// note
app.get(
    "/notes/:id",
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let note = await Note.findById(id);

        if (note.remind) {
            const localRemind = new Date(note.remind.getTime() - (note.remind.getTimezoneOffset() * 60000));
            note.localRemind = localRemind.toISOString().slice(0, 16);
        } else {
            note.localRemind = '';
        }
        console.log("get route");
        res.status(200).render("./notes/edit", { note });
    })
);

// pin note
app.patch(
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
);

// update
app.put(
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
);

// delete
app.delete(
    "/notes/:id",
    asyncWrap(async (req, res) => {
        let { id } = req.params;
        let result = await Note.findByIdAndDelete(id);
        console.log(result);
        console.log("delete route");
        res.status(200).redirect("/notes");
    })
);

// 404-notfound
app.all(/.*/, (req, res, next) => {
    console.log("this is all");
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Page not Found!" } = err;
    res.status(statusCode).render("error", { message });
});

app.listen(port, () => {
    console.log(`app is listening to port ${port}`);
});
