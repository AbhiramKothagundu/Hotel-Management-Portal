const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ["confirmed", "cancelled", "completed"],
        default: "confirmed",
    },
    adhaarProof: {
        type: String, // This will store the image path
        required: true,
    },
});

module.exports = mongoose.model("Booking", BookingSchema);
