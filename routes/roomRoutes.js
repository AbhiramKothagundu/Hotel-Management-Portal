const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("../schema/typeDefs");
const resolvers = require("../schema/resolvers");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads/"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

// File upload endpoint
router.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filename: req.file.filename });
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        if (!req.body.query) return {};

        // Skip auth check for login and register operations
        const operationType = req.body.query.toLowerCase();
        if (
            operationType.includes("loginuser") ||
            operationType.includes("registeruser") ||
            operationType.includes("registeradmin")
        ) {
            return {};
        }

        // Ensure user is authenticated for all other operations
        if (!req.user) {
            throw new Error("Authentication required");
        }

        // For admin-only operations, check role
        if (
            (operationType.includes("addroom") ||
                operationType.includes("updateroom") ||
                operationType.includes("deleteroom")) &&
            req.user.role !== "admin"
        ) {
            throw new Error("Admin access required");
        }

        return { user: req.user };
    },
    formatError: (error) => {
        console.error("GraphQL Error:", error);
        return {
            message: error.message,
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
        };
    },
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    },
});

async function startApolloServer() {
    await server.start();
    server.applyMiddleware({
        app: router,
        path: "/", // This ensures GraphQL is available at the root of the router
    });
}

startApolloServer();

module.exports = router;
