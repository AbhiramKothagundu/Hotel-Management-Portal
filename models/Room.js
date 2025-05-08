const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
        type: String,
        enum: ["available", "occupied", "maintenance"],
        default: "available",
    },
    description: { type: String },
});

module.exports = mongoose.model("Room", RoomSchema);
