const Room = require("../models/Room");

exports.getAllRooms = async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
};

exports.createRoom = async (req, res) => {
    const room = new Room(req.body);
    await room.save();
    res.json(room);
};

exports.updateRoom = async (req, res) => {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.json(room);
};

exports.deleteRoom = async (req, res) => {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Room deleted" });
};
