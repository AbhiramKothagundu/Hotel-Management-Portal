const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // Check for token in query params first, then header
        const token =
            req.query.token ||
            req.headers.authorization?.split(" ")[1] ||
            req.cookies?.token;

        if (!token) {
            return res.redirect("/?error=no_token");
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your_super_secret_key_here"
        );

        // Add user info and token to request
        req.user = decoded;
        req.token = token;

        // Add to response locals for views
        res.locals.user = decoded;
        res.locals.token = token;

        next();
    } catch (err) {
        console.error("Auth error:", err);
        return res.redirect("/?error=invalid_token");
    }
};
