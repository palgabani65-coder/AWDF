const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * Validates JWT token from the HTTP Authorization header (Bearer schema)
 * and attaches decoded payload (e.g. { id, email }) to req.user.
 */
const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if Authorization header is present and follows Bearer pattern
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Authorization header must be in format: Bearer <token>"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token missing after Bearer keyword."
            });
        }

        // Verify token with JWT_SECRET from environment variables
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("FATAL: JWT_SECRET is not defined in environment variables!");
            return res.status(500).json({
                success: false,
                message: "Server misconfiguration: JWT_SECRET missing"
            });
        }

        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Contains id, email, iat, exp
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please log in again.",
                expired: true
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid token. Authorization failed.",
            error: err.message
        });
    }
};

module.exports = auth;
