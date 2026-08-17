const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Task = require("./models/Task");

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    console.log(
        `${req.method} ${req.url} - ${new Date().toISOString()}`
    );
    next();
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// GET all tasks
app.get("/tasks", async (req, res, next) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        next(err);
    }
});

// CREATE task
app.post("/tasks", async (req, res, next) => {
    try {
        const task = await Task.create(req.body);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });
    } catch (err) {
        next(err);
    }
});

// UPDATE task (supports full update: title, description, priority, completed, dueDate)
app.put("/tasks/:id", async (req, res, next) => {
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

// DELETE ALL COMPLETED TASKS
app.delete("/tasks/completed/clear", async (req, res, next) => {
    try {
        const result = await Task.deleteMany({ completed: true });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} completed tasks deleted`,
            count: result.deletedCount
        });
    } catch (err) {
        next(err);
    }
});

// DELETE single task by ID
app.delete("/tasks/:id", async (req, res, next) => {
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


// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        error: err.message || "Something went wrong"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});