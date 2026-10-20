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
const { requireAdmin } = require("./middleware/requireRole");
const {
    validateTask,
    validateRegister,
    validateLogin
} = require("./middleware/validate");

// Event-driven background processing (Practical 10)
const taskEvents = require("./events");
require("./listeners");

// In-Memory Caching (Practical 9)
const cache = require("./cache");

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Cache"],
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

// MongoDB connection (Practical 11: Support Docker Compose service name and fallback)
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/taskdb";
mongoose
    .connect(MONGO_URI)
    .then(() => console.log(`MongoDB Connected: ${MONGO_URI}`))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// ==========================================
// AUTHENTICATION ROUTES (Practical 7)
// ==========================================

// POST /register - Register a new user with bcrypt password hashing
app.post("/register", validateRegister, async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const assignedRole = role === "admin" ? "admin" : "user";

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
            password: hashedPassword,
            role: assignedRole
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                email: user.email,
                role: user.role
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
            { id: user._id, email: user.email, role: user.role || "user" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role || "user"
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
            user: {
                id: user._id,
                email: user.email,
                role: user.role || "user"
            }
        });
    } catch (err) {
        next(err);
    }
});

// ==========================================
// PROTECTED TASK ROUTES (Practical 7 Middleware Pipeline)
// ==========================================

// GET /tasks - Protected: retrieve all tasks for authenticated user (Practical 9: In-Memory Caching)
app.get("/tasks", auth, async (req, res, next) => {
    try {
        const cacheKey = `tasks_${req.user.id}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            res.setHeader("X-Cache", "HIT");
            return res.status(200).json(cachedData);
        }

        // Cache MISS: Query MongoDB
        const tasks = await Task.find({
            $or: [
                { user: req.user.id },
                { user: { $exists: false } },
                { user: null }
            ]
        }).sort({ createdAt: -1 });

        const normalizedTasks = tasks.map(t => {
            const obj = t.toObject();
            if (!obj.status) {
                obj.status = obj.completed ? "done" : "todo";
            }
            return obj;
        });

        const responsePayload = {
            success: true,
            count: normalizedTasks.length,
            data: normalizedTasks
        };

        // Cache response with 60-second TTL
        cache.set(cacheKey, responsePayload, 60);

        res.setHeader("X-Cache", "MISS");
        res.status(200).json(responsePayload);
    } catch (err) {
        next(err);
    }
});

// POST /tasks - Protected & Validated: create task linked to authenticated user
app.post("/tasks", auth, validateTask, async (req, res, next) => {
    try {
        const status = req.body.status || (req.body.completed ? "done" : "todo");
        const completed = status === "done" || Boolean(req.body.completed);

        const task = await Task.create({
            title: req.body.title.trim(),
            description: req.body.description ? req.body.description.trim() : "",
            completed,
            status,
            dueDate: req.body.dueDate || null,
            user: req.user.id
        });

        // Practical 9: Invalidate cache for this user on write
        cache.del(`tasks_${req.user.id}`);
        cache.del("all_tasks");

        // Practical 10: Respond immediately before event handler finishes
        console.log(`[API] Response sent at ${new Date().toISOString()}`);
        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });

        // Emit 'task-created' event asynchronously after response is sent
        taskEvents.emit("task-created", {
            ...task.toObject(),
            assignedUser: req.user.email || req.user.id
        });
    } catch (err) {
        next(err);
    }
});

// PUT /tasks/:id - Protected & Validated: update task
app.put("/tasks/:id", auth, validateTask, async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        if (updateData.status) {
            updateData.completed = updateData.status === "done";
        } else if (updateData.completed !== undefined) {
            updateData.status = updateData.completed ? "done" : "todo";
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
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

        // Practical 9: Invalidate single-task cache and list cache
        cache.del(`task_${req.params.id}`);
        cache.del(`tasks_${req.user.id}`);
        cache.del("all_tasks");

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

        // Practical 9: Invalidate user tasks cache
        cache.del(`tasks_${req.user.id}`);
        cache.del("all_tasks");

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

        // Practical 9: Invalidate single-task cache and list cache
        cache.del(`task_${req.params.id}`);
        cache.del(`tasks_${req.user.id}`);
        cache.del("all_tasks");

        // Practical 10: Supplementary Problem 1 - Respond immediately and emit 'task-deleted'
        console.log(`[API] Task deletion response sent at ${new Date().toISOString()}`);
        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

        taskEvents.emit("task-deleted", {
            id: task._id,
            title: task.title,
            user: req.user ? (req.user.email || req.user.id) : "Unknown"
        });
    } catch (err) {
        next(err);
    }
});

// GET /tasks/:id - Protected: retrieve single task with per-task caching (Practical 9 Supplementary 1)
app.get("/tasks/:id", auth, async (req, res, next) => {
    try {
        const cacheKey = `task_${req.params.id}`;
        const cachedTask = cache.get(cacheKey);

        if (cachedTask) {
            res.setHeader("X-Cache", "HIT");
            return res.status(200).json(cachedTask);
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const responsePayload = {
            success: true,
            data: task
        };

        // Cache single task with 60-second TTL
        cache.set(cacheKey, responsePayload, 60);

        res.setHeader("X-Cache", "MISS");
        res.status(200).json(responsePayload);
    } catch (err) {
        next(err);
    }
});

// ==========================================
// CACHE MONITORING & DEBUG ENDPOINTS (Practical 9 Supplementary 2)
// ==========================================
app.get("/cache/stats", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Cache statistics retrieved successfully",
        data: cache.getStats()
    });
});

app.post("/cache/clear", (req, res) => {
    cache.flushAll();
    cache.resetStats();
    res.status(200).json({
        success: true,
        message: "In-memory cache flushed and statistics reset successfully."
    });
});

// ==========================================
// ADMIN REPORT GENERATION ROUTE (Date-Range & Aggregations)
// ==========================================
app.get("/admin/reports", auth, requireAdmin, async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateFilter.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
            }
        }

        // Retrieve tasks within date range, populating creator user details
        const tasks = await Task.find(dateFilter)
            .populate("user", "email role")
            .sort({ createdAt: -1 });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Group activity breakdown by user
        const userMap = {};
        tasks.forEach((task) => {
            const userKey = task.user ? task.user.email : "Unassigned / Legacy";
            const userRole = task.user ? task.user.role : "N/A";
            if (!userMap[userKey]) {
                userMap[userKey] = {
                    email: userKey,
                    role: userRole,
                    total: 0,
                    completed: 0,
                    pending: 0
                };
            }
            userMap[userKey].total += 1;
            if (task.completed) {
                userMap[userKey].completed += 1;
            } else {
                userMap[userKey].pending += 1;
            }
        });

        const userBreakdown = Object.values(userMap);
        const totalRegisteredUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: "admin" });

        res.status(200).json({
            success: true,
            data: {
                range: {
                    startDate: startDate || null,
                    endDate: endDate || null
                },
                summary: {
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    completionRate,
                    totalRegisteredUsers,
                    totalAdmins,
                    activeUsersInRange: userBreakdown.length
                },
                userBreakdown,
                tasks: tasks.map((t) => ({
                    id: t._id,
                    title: t.title,
                    description: t.description,
                    completed: t.completed,
                    createdAt: t.createdAt,
                    updatedAt: t.updatedAt,
                    userEmail: t.user ? t.user.email : "Unassigned",
                    userRole: t.user ? t.user.role : "N/A"
                }))
            }
        });
    } catch (err) {
        next(err);
    }
});

// ==========================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ==========================================

// GET /admin/users - List all users with task counts and summary
app.get("/admin/users", auth, requireAdmin, async (req, res, next) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        // Retrieve task counts grouped by user ID
        const taskCounts = await Task.aggregate([
            { $group: { _id: "$user", count: { $sum: 1 } } }
        ]);

        const taskCountMap = {};
        taskCounts.forEach((tc) => {
            if (tc._id) {
                taskCountMap[tc._id.toString()] = tc.count;
            }
        });

        const enrichedUsers = users.map((u) => ({
            id: u._id,
            email: u.email,
            role: u.role || "user",
            createdAt: u.createdAt,
            taskCount: taskCountMap[u._id.toString()] || 0
        }));

        res.status(200).json({
            success: true,
            data: enrichedUsers,
            summary: {
                totalUsers: users.length,
                totalAdmins: users.filter((u) => u.role === "admin").length,
                totalStandardUsers: users.filter((u) => u.role !== "admin").length
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /admin/users - Admin directly creates a new account
app.post("/admin/users", auth, requireAdmin, validateRegister, async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const assignedRole = role === "admin" ? "admin" : "user";

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "A user with this email address already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            role: assignedRole
        });

        res.status(201).json({
            success: true,
            message: `User created successfully with role '${assignedRole}'.`,
            data: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt,
                taskCount: 0
            }
        });
    } catch (err) {
        next(err);
    }
});

// PUT /admin/users/:id/role - Promote or Demote a user
app.put("/admin/users/:id/role", auth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'user' or 'admin'."
            });
        }

        // Prevent admin self-demotion
        if (req.user.id === id && role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "Security Error: You cannot demote your own administrator account."
            });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        targetUser.role = role;
        await targetUser.save();

        res.status(200).json({
            success: true,
            message: `User '${targetUser.email}' role updated to '${role}'.`,
            data: {
                id: targetUser._id,
                email: targetUser.email,
                role: targetUser.role
            }
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /admin/users/:id - Delete a user and clean up their tasks
app.delete("/admin/users/:id", auth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent admin self-deletion
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                message: "Security Error: You cannot delete your own logged-in account."
            });
        }

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Clean up tasks associated with this user
        const deletedTasksResult = await Task.deleteMany({ user: id });

        res.status(200).json({
            success: true,
            message: `User '${deletedUser.email}' and ${deletedTasksResult.deletedCount} associated task(s) deleted successfully.`
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