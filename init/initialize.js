const mongoose = require("mongoose");
const data = require("./data");
const Note = require("../models/notes");

const MONGO_URL = `mongodb://localhost:27017/notes`;

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => console.log("connected to DB"))
    .catch((err) => console.log(err));

const initData = async () => {
    await Note.deleteMany({});
    await Note.insertMany(data.data);
    console.log("data initialized");
};

initData();
