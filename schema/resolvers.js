const Room = require("../models/Room");
const Booking = require("../models/Booking");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const resolvers = {
    Query: {
        rooms: async () => await Room.find(),
        bookings: async () => {
            try {
                const bookings = await Booking.find()
                    .populate("userId")
                    .populate("roomId")
                    .sort({ checkInDate: -1 });

                // Map the data to ensure all fields are present
                return bookings.map((booking) => ({
                    id: booking._id,
                    status: booking.status,
                    checkInDate: booking.checkInDate.getTime().toString(),
                    checkOutDate: booking.checkOutDate.getTime().toString(),
                    adhaarProof: booking.adhaarProof, // Make sure this field is included
                    user: booking.userId,
                    room: booking.roomId,
                    userId: booking.userId?._id,
                    roomId: booking.roomId?._id,
                }));
            } catch (error) {
                console.error("Error fetching bookings:", error);
                return [];
            }
        },
        users: async () => await User.find(),
        availableRooms: async () => {
            return await Room.find({ status: "available" });
        },
        myBookings: async (_, __, { user }) => {
            if (!user || !user.id) {
                throw new Error("Authentication required");
            }
            const bookings = await Booking.find({ userId: user.id })
                .populate("roomId")
                .sort({ checkInDate: -1 });

            return bookings.map((booking) => ({
                id: booking._id,
                userId: booking.userId,
                roomId: booking.roomId._id,
                checkInDate: booking.checkInDate.toISOString(),
                checkOutDate: booking.checkOutDate.toISOString(),
                status: booking.status,
                room: booking.roomId,
            }));
        },
    },
    Mutation: {
        addRoom: async (_, { roomNumber, type, price, description }) => {
            if (!roomNumber || !type || !price) {
                throw new Error("Required fields missing");
            }
            if (price < 0) {
                throw new Error("Price cannot be negative");
            }
            const room = new Room({ roomNumber, type, price, description });
            return await room.save();
        },
        updateRoom: async (_, { id, type, price, status, description }) => {
            return await Room.findByIdAndUpdate(
                id,
                { type, price, status, description },
                { new: true }
            );
        },
        deleteRoom: async (_, { id }) => {
            await Room.findByIdAndDelete(id);
            return "Room deleted";
        },
        bookRoom: async (
            _,
            { roomId, checkInDate, checkOutDate, adhaarProof },
            { user }
        ) => {
            if (!user || !user.id) {
                throw new Error("Authentication required");
            }

            // First check if room exists and is available
            const room = await Room.findById(roomId);
            if (!room) {
                throw new Error("Room not found");
            }
            if (room.status !== "available") {
                throw new Error("Room is not available");
            }

            try {
                const booking = new Booking({
                    userId: user.id,
                    roomId: room._id,
                    checkInDate: new Date(checkInDate),
                    checkOutDate: new Date(checkOutDate),
                    status: "confirmed",
                    adhaarProof: adhaarProof, // This will now be the filename
                });

                const savedBooking = await booking.save();
                await Room.findByIdAndUpdate(roomId, { status: "occupied" });

                const populatedBooking = await Booking.findById(
                    savedBooking._id
                )
                    .populate("roomId")
                    .populate("userId");

                return {
                    id: populatedBooking._id.toString(),
                    userId: populatedBooking.userId._id.toString(),
                    roomId: populatedBooking.roomId._id.toString(),
                    checkInDate: populatedBooking.checkInDate.toISOString(),
                    checkOutDate: populatedBooking.checkOutDate.toISOString(),
                    status: populatedBooking.status,
                    adhaarProof: populatedBooking.adhaarProof,
                    room: populatedBooking.roomId,
                    user: populatedBooking.userId,
                };
            } catch (error) {
                console.error("Booking error:", error);
                throw new Error("Failed to create booking: " + error.message);
            }
        },
        cancelBooking: async (_, { id }) => {
            // Find the booking first to get the roomId
            const booking = await Booking.findById(id);
            if (!booking) {
                throw new Error("Booking not found");
            }

            // Update the room status to available
            await Room.findByIdAndUpdate(booking.roomId, {
                status: "available",
            });

            // Delete the booking
            await Booking.findByIdAndDelete(id);

            return "Booking cancelled";
        },
        registerUser: async (_, { name, email, password }) => {
            if (!email.includes("@") || password.length < 6) {
                throw new Error("Invalid email or password too short");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ name, email, password: hashedPassword });
            return await user.save();
        },
        loginUser: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                throw new Error("Invalid credentials");
            }
            return jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET || "your_super_secret_key_here",
                { expiresIn: "1d" }
            );
        },
        registerAdmin: async (_, { name, email, password, adminCode }) => {
            // Verify admin code
            const validAdminCode = process.env.ADMIN_CODE || "admin123";
            if (adminCode !== validAdminCode) {
                throw new Error("Invalid admin code");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                name,
                email,
                password: hashedPassword,
                role: "admin",
            });
            return await user.save();
        },
    },
};

module.exports = resolvers;
