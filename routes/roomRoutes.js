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
        // Skip auth check for login and register mutations
        if (!req.body.query) return {};

        const operationType = req.body.query.toLowerCase();
        if (
            operationType.includes("loginuser") ||
            operationType.includes("registeruser") ||
            operationType.includes("registeradmin")
        ) {
            return {};
        }

        // Check auth for other operations
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new Error("Authentication required");
        }

        try {
            const user = jwt.verify(
                token,
                process.env.JWT_SECRET || "your_super_secret_key_here"
            );
            return { user };
        } catch (err) {
            console.error("Token verification error:", err); // Debug log
            throw new Error("Invalid token");
        }
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
