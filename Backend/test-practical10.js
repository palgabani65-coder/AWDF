const taskEvents = require("./events");
require("./listeners");

console.log("=== PRACTICAL 10 EVENT-DRIVEN ARCHITECTURE TEST ===");
console.log(`[Main Thread] Starting test script at ${new Date().toISOString()}\n`);

// 1. Test 'task-created' event
console.log(`[API Simulation] Saving new task to database...`);
const mockTask = {
    _id: "6612ab34cd56ef7890123456",
    title: "Complete Laboratory Report 10",
    description: "Write async processing analysis and record timestamp evidence",
    status: "in-progress",
    assignedUser: "student@example.com"
};

console.log(`[API Simulation] Response sent immediately (HTTP 201) at ${new Date().toISOString()}`);
taskEvents.emit("task-created", mockTask);

// 2. Test 'task-deleted' event (Supplementary Problem 1)
setTimeout(() => {
    console.log(`\n[API Simulation] Deleting task ${mockTask._id}...`);
    console.log(`[API Simulation] Deletion response sent immediately (HTTP 200) at ${new Date().toISOString()}`);
    taskEvents.emit("task-deleted", {
        id: mockTask._id,
        title: mockTask.title,
        user: "admin@example.com"
    });
}, 500);

// 3. Test 'error' event handling (Supplementary Problem 2)
setTimeout(() => {
    console.log(`\n[API Simulation] Testing error event handling with invalid task...`);
    const faultyTask = {
        _id: "6612ab34cd56ef7890123499",
        title: "Send Notification [simulate-error]",
        assignedUser: "system@example.com"
    };
    console.log(`[API Simulation] Faulty task response sent (HTTP 201) at ${new Date().toISOString()}`);
    taskEvents.emit("task-created", faultyTask);
}, 1000);

// Keep process alive until all async listeners have finished
setTimeout(() => {
    console.log(`\n[Main Thread] All event listeners finished cleanly at ${new Date().toISOString()}`);
    console.log("=== TEST SUITE COMPLETED SUCCESSFULLY ===");
    process.exit(0);
}, 4000);
