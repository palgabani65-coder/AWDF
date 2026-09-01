const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Models
const Task = require("./models/Task");
const User = require("./models/User");

// Middleware
const auth = require("./middleware/auth");
const {
    validateTask,
    validateRegister,
    validateLogin
} = require("./middleware/validate");

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// Global Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url}`
    );
    next();
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// ==========================================
// AUTHENTICATION ROUTES (Practical 7)
// ==========================================

// POST /register - Register a new user with bcrypt password hashing
app.post("/register", validateRegister, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already registered with this email"
            });
        }

        // Hash password before saving with salt cost factor 10
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /login - Authenticate user and issue signed JWT token
app.post("/login", validateLogin, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // Verify user existence
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare plain text password to hashed password using bcrypt.compare
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Sign JWT token with 1-hour expiry
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /me - Return logged-in user profile from decoded JWT (Supplementary)
app.get("/me", auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
});

// ==========================================
// PROTECTED TASK ROUTES (Practical 7 Middleware Pipeline)
// ==========================================

// GET /tasks - Protected: retrieve all tasks for authenticated user
app.get("/tasks", auth, async (req, res, next) => {
    try {
        // Return tasks belonging to user or previously created unassigned tasks
        const tasks = await Task.find({
            $or: [
                { user: req.user.id },
                { user: { $exists: false } },
                { user: null }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        next(err);
    }
});

// POST /tasks - Protected & Validated: create task linked to authenticated user
app.post("/tasks", auth, validateTask, async (req, res, next) => {
    try {
        const task = await Task.create({
            title: req.body.title.trim(),
            description: req.body.description ? req.body.description.trim() : "",
            completed: Boolean(req.body.completed),
            dueDate: req.body.dueDate || null,
            user: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });
    } catch (err) {
        next(err);
    }
});

// PUT /tasks/:id - Protected & Validated: update task
app.put("/tasks/:id", auth, validateTask, async (req, res, next) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /tasks/completed/clear - Protected: delete all completed tasks
app.delete("/tasks/completed/clear", auth, async (req, res, next) => {
    try {
        const result = await Task.deleteMany({
            completed: true,
            $or: [
                { user: req.user.id },
                { user: { $exists: false } },
                { user: null }
            ]
        });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} completed tasks deleted`,
            count: result.deletedCount
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /tasks/:id - Protected: delete task by ID
app.delete("/tasks/:id", auth, async (req, res, next) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (err) {
        next(err);
    }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error("Express Error:", err.stack || err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});