const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // Check for token in various places
        const token =
            req.query.token ||
            req.headers.authorization?.split(" ")[1] ||
            req.cookies?.token;

        if (!token) {
            console.log("No token found for path:", req.path);
            if (req.headers["content-type"]?.includes("application/json")) {
                return res
                    .status(401)
                    .json({ error: "Authentication required" });
            }
            return res.redirect("/?error=auth_required");
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "your_super_secret_key_here"
            );

            // Add user info to request
            req.user = decoded;
            req.token = token;

            // Add to response locals for views
            res.locals.user = decoded;
            res.locals.token = token;

            next();
        } catch (err) {
            console.error("Token verification error:", err);
            if (req.headers["content-type"]?.includes("application/json")) {
                return res.status(401).json({ error: "Invalid token" });
            }
            return res.redirect("/?error=invalid_token");
        }
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.redirect("/?error=auth_error");
    }
};
