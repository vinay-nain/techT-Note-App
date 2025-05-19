const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Note = require("../models/notes.js")
const asyncWrap = require("../utils/asyncWrap.js");

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            minlength: [6, "password must be greater than 6 chars"],
        },
        notes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Note",
            },
        ],
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.log("error in salting", error);
        next(error);
    }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    const isPasswordCorrect = await bcrypt.compare(
        enteredPassword,
        this.password
    );

    return isPasswordCorrect;
};

module.exports = mongoose.model("User", userSchema);
