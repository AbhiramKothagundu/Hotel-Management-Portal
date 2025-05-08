const { gql } = require("apollo-server-express");

const typeDefs = gql`
    enum RoomStatus {
        available
        occupied
        maintenance
    }

    enum BookingStatus {
        confirmed
        cancelled
        completed
    }

    type Room {
        id: ID!
        roomNumber: String!
        type: String!
        price: Float!
        status: RoomStatus!
        description: String
    }

    type Booking {
        id: ID!
        userId: ID!
        roomId: ID!
        checkInDate: String!
        checkOutDate: String!
        status: BookingStatus!
        adhaarProof: String
        user: User
        room: Room
    }

    type User {
        id: ID!
        name: String!
        email: String!
        role: String!
    }

    type Query {
        rooms: [Room]!
        bookings: [Booking]!
        users: [User]!
        availableRooms: [Room]!
        myBookings: [Booking]!
        roomDetails(id: ID!): Room
    }

    type Mutation {
        # Auth
        loginUser(email: String!, password: String!): String
        registerUser(name: String!, email: String!, password: String!): User
        registerAdmin(
            name: String!
            email: String!
            password: String!
            adminCode: String!
        ): User

        # Room Management
        addRoom(
            roomNumber: String!
            type: String!
            price: Float!
            description: String
        ): Room!

        updateRoom(
            id: ID!
            type: String
            price: Float
            status: RoomStatus
            description: String
        ): Room!

        deleteRoom(id: ID!): String!

        # Bookings
        bookRoom(
            roomId: ID!
            checkInDate: String!
            checkOutDate: String!
            adhaarProof: String!
        ): Booking!

        cancelBooking(id: ID!): String!
    }
`;

module.exports = typeDefs;
