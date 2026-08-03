const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Handle invalid/empty JSON syntax errors from body-parser
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid or empty JSON payload' });
    }
    next(err);
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

const checkContentType = (req, res, next) => {
    if (['POST', 'PUT'].includes(req.method)) {
        if (!req.is('application/json')) {
            return res.status(400).json({ error: 'Content-Type must be application/json' });
        }
    }
    next();
};
app.use(checkContentType);

const validateTaskId = (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid Task ID format. ID must be a positive integer.' });
    }
    req.taskId = id;
    next();
};

let tasks = [
    { id: 1, title: 'GET', completed: true },
    { id: 2, title: 'POST', completed: false },
    { id: 3, title: 'PUT', completed: true },
    { id: 4, title: 'DELETE', completed: true }
];

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Task Manager RESTful API!',
        status: 'Server is running successfully.'
    });
});

// GET /tasks - Retrieve all tasks
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// GET /tasks/:id - Retrieve a specific task by ID
app.get('/tasks/:id', validateTaskId, (req, res) => {
    const task = tasks.find(t => t.id === req.taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
});

// POST /tasks - Create a new task (RMM Level 2: Uses POST verb, returns 201 Created with Location header)
app.post('/tasks', (req, res) => {
    const { title, completed } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = {
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        title: title.trim(),
        completed: Boolean(completed)
    };

    tasks.push(newTask);
    res.location(`/tasks/${newTask.id}`).status(201).json({
        message: 'Task created successfully',
        data: newTask
    });
});

// PUT /tasks/:id - Update an existing task (RMM Level 2: Uses PUT verb on specific resource URI, returns 200 OK / 404 / 400)
app.put('/tasks/:id', validateTaskId, (req, res) => {
    const task = tasks.find(t => t.id === req.taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const { title, completed } = req.body;

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'Task title must be a non-empty string' });
        }
        task.title = title.trim();
    }

    if (completed !== undefined) {
        task.completed = Boolean(completed);
    }

    res.status(200).json({
        message: 'Task updated successfully',
        data: task
    });
});

// DELETE /tasks/:id - Delete a task by ID (RMM Level 2: Uses DELETE verb on specific resource URI, returns 200 OK / 404)
app.delete('/tasks/:id', validateTaskId, (req, res) => {
    const index = tasks.findIndex(t => t.id === req.taskId);
    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(index, 1)[0];
    res.status(200).json({
        message: 'Task deleted successfully',
        data: deletedTask
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
