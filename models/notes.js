const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noteSchema = Schema({
    title: {
        type: String,
        maxLength: [100, "0 characters left"],
    },
    note: {
        type: String,
        maxLength: [1500, "0 characters left"],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    pinned: {
        type: Boolean,
        default: false,
    },
    remind: {
        type: Date,
        default: null,
        validate: {
            validator: function (value) {
                return !value || value >= new Date();
            },
            message: "Remainder can't be past",
        },
    },
    archive: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Note", noteSchema);
