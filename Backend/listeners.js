const taskEvents = require("./events");

/**
 * =====================================================================
 * PRACTICAL 10: Event Listeners for Asynchronous Processing
 * Decouples background notification side-effects from the main HTTP flow.
 * =====================================================================
 */

/**
 * 1. 'task-created' Event Listener
 * Triggered asynchronously after POST /tasks saves the task and responds (201).
 * Demonstrates non-blocking background execution with simulated processing delay.
 */
taskEvents.on("task-created", (task) => {
    const assignedUser = task.assignedUser || (task.user && task.user.email) || task.user || "Unassigned";
    const eventReceivedAt = new Date().toISOString();

    console.log(
        `[Notification Listener] Event 'task-created' received at ${eventReceivedAt} for task: "${task.title}"`
    );

    // Simulate an asynchronous slow notification handler (e.g., 2000ms delay for sending email / SMS push)
    // Runs on the Node.js event loop timer phase without blocking the HTTP response
    setTimeout(() => {
        try {
            // Trigger simulated error if task title contains [simulate-error] (Supplementary Problem)
            if (task.title && task.title.toLowerCase().includes("simulate-error")) {
                throw new Error(
                    `Simulated notification delivery failure for task: "${task.title}"`
                );
            }

            const completedAt = new Date().toISOString();
            console.log(
                `[Notification Listener] [ASYNC COMPLETED] Notification dispatched at ${completedAt} | Title: "${task.title}" | Assigned User: ${assignedUser}`
            );
        } catch (err) {
            // Forward error to the dedicated error listener
            taskEvents.emit("error", err);
        }
    }, 2000); // 2-second artificial delay
});

/**
 * 2. 'task-deleted' Event Listener (Supplementary Problem 1)
 * Triggered asynchronously after DELETE /tasks/:id completes and responds (200).
 */
taskEvents.on("task-deleted", (task) => {
    const user = task.user || "Unknown User";
    const eventReceivedAt = new Date().toISOString();

    console.log(
        `[Notification Listener] Event 'task-deleted' received at ${eventReceivedAt} for task ID: ${task.id || task._id}`
    );

    // Simulate asynchronous audit logging / cleanup delay
    setTimeout(() => {
        try {
            const completedAt = new Date().toISOString();
            console.log(
                `[Notification Listener] [ASYNC COMPLETED] Task deletion audit recorded at ${completedAt} | Title: "${task.title}" | User: ${user}`
            );
        } catch (err) {
            taskEvents.emit("error", err);
        }
    }, 1500); // 1.5-second artificial delay
});

/**
 * 3. 'error' Event Listener (Supplementary Problem 2)
 * Catches and logs errors thrown inside event handlers without crashing the process.
 * Node.js EventEmitter throws unhandled 'error' events if no listener is registered.
 */
taskEvents.on("error", (err) => {
    const errorTimestamp = new Date().toISOString();
    console.error(
        `[TaskEvents Error Listener] [CAUGHT AT ${errorTimestamp}] Background processing error: ${err.message}`
    );
});

module.exports = taskEvents;
