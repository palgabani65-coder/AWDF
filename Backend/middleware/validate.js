/**
 * Request Validation Middleware
 * Rejects malformed requests before they reach database operations or controllers.
 */

// Email regex pattern for RFC compliance
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validate Task creation and update payloads
 */
const validateTask = (req, res, next) => {
    const { title, description } = req.body;

    // For POST (creating), title is strictly required
    if (req.method === "POST") {
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: Task 'title' is required and cannot be empty."
            });
        }

        if (title.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: Task 'title' must be at least 3 characters long."
            });
        }
    }

    // For PUT (updating), if title is supplied, it must satisfy validation
    if (req.method === "PUT" && title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: Task 'title' cannot be empty."
            });
        }

        if (title.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: Task 'title' must be at least 3 characters long."
            });
        }
    }

    if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Task 'description' must be a text string."
        });
    }

    next();
};

/**
 * Validate User Registration payload
 */
const validateRegister = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: A valid email address is required."
        });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Password is required and must be at least 6 characters long."
        });
    }

    next();
};

/**
 * Validate User Login payload
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Both email and password are required to log in."
        });
    }

    next();
};

module.exports = {
    validateTask,
    validateRegister,
    validateLogin
};
