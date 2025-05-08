require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./config/db");
const authMiddleware = require("./middlewares/authMiddleware");
const loggerMiddleware = require("./middlewares/loggerMiddleware");
const errorHandler = require("./middlewares/errorHandlerMiddleware");
const uploadMiddleware = require("./middlewares/uploadMiddleware");
const cors = require("cors");
const graphqlRouter = require("./routes/roomRoutes");
const fs = require("fs");

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === "production" },
    })
);
app.use(loggerMiddleware);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Public routes
app.get("/", (req, res) => res.render("auth/login"));
app.get("/register", (req, res) => res.render("auth/register"));
app.get("/register/admin", (req, res) => res.render("auth/admin-register"));

// Routes
app.use("/graphql", graphqlRouter); // This mounts GraphQL at /graphql

// Protected routes
app.get("/admin/dashboard", authMiddleware, (req, res) => {
    if (req.user.role !== "admin") {
        return res.redirect("/user/dashboard");
    }
    res.render("admin/dashboard", {
        user: req.user,
        token: req.query.token || req.headers.authorization?.split(" ")[1],
    });
});

app.get("/user/dashboard", authMiddleware, (req, res) => {
    res.render("user/dashboard", {
        user: req.user,
        token: req.query.token || req.headers.authorization?.split(" ")[1],
    });
});

// Error handling
app.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        return res.redirect("/");
    }
    next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
