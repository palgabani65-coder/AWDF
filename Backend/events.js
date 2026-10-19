const EventEmitter = require("events");

/**
 * TaskEvents
 * Custom event emitter class extending Node.js native EventEmitter.
 * Handles domain events such as 'task-created', 'task-deleted', and 'error'
 * to decouple asynchronous background side-effects from the main HTTP cycle.
 */
class TaskEvents extends EventEmitter {}

// Export singleton instance of TaskEvents
module.exports = new TaskEvents();
