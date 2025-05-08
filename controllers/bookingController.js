const Booking = require("../models/Booking");

exports.getAllBookings = async (req, res) => {
    const bookings = await Booking.find().populate("userId roomId");
    res.json(bookings);
};

exports.createBooking = async (req, res) => {
    const booking = new Booking(req.body);
    await booking.save();
    res.json(booking);
};

exports.cancelBooking = async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking cancelled" });
};
