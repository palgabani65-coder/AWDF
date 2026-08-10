const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        minlength: [3, "Title must be at least 3 characters long"],
        trim: true
    },

    description: {
        type: String
    },

    completed: {
        type: Boolean,
        default: false
    },

    priority: {
        type: String,
        enum: {
            values: ["low", "medium", "high"],
            message: "Priority must be either low, medium, or high"
        },
        default: "medium"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Task", taskSchema);