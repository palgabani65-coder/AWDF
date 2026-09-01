const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        minlength: [3, "Title must be at least 3 characters long"],
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    completed: {
        type: Boolean,
        default: false
    },

    dueDate: {
        type: Date
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true,
    collection: "tasks"
});

module.exports = mongoose.model("Task", taskSchema);

