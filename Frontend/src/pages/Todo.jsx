import { useEffect, useState, useMemo } from "react";

const API_URL = "http://localhost:5000/tasks";

function Todo() {
  const [tasks, setTasks] = useState([]);

  // Form state for creating task
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending", // 'pending' or 'completed'
  });

  // State for editing task
  const [editingTask, setEditingTask] = useState(null);

  // Search, Filter, & Sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'completed'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'alphabetical'

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // FETCH TASKS
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
      } else {
        setApiError(result.error || "Failed to fetch tasks from server");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setApiError(
        "Unable to connect to MongoDB backend server (http://localhost:5000). Please make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // HANDLE FORM CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CREATE TASK
  const addTask = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      setSubmitting(true);
      setApiError(null);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          completed: form.status === "completed",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTasks((prev) => [result.data, ...prev]);
        setForm({
          title: "",
          description: "",
          status: "pending",
        });
      } else {
        alert(result.error || result.message || "Failed to add task");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to connect to backend API server.");
    } finally {
      setSubmitting(false);
    }
  };

  // TOGGLE TASK STATUS
  const toggleTask = async (task) => {
    try {
      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTasks((prev) =>
          prev.map((item) => (item._id === task._id ? result.data : item))
        );
      } else {
        alert(result.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
    }
  };

  // UPDATE TASK IN EDIT MODAL
  const saveEditedTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) {
      alert("Please enter a valid task title");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTask.title.trim(),
          description: editingTask.description ? editingTask.description.trim() : "",
          completed: editingTask.completed,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTasks((prev) =>
          prev.map((item) => (item._id === editingTask._id ? result.data : item))
        );
        setEditingTask(null);
      } else {
        alert(result.error || "Failed to save task edits");
      }
    } catch (error) {
      console.error("Error saving task edit:", error);
      alert("Error saving edits.");
    }
  };

  // DELETE SINGLE TASK
  const deleteTask = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTasks((prev) => prev.filter((task) => task._id !== id));
      } else {
        alert(result.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  // CLEAR ALL COMPLETED TASKS
  const clearCompleted = async () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${completedCount} completed tasks?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/completed/clear`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTasks((prev) => prev.filter((task) => !task.completed));
      } else {
        alert(result.error || "Failed to clear completed tasks");
      }
    } catch (error) {
      console.error("Error clearing completed tasks:", error);
      alert("Failed to clear completed tasks.");
    }
  };

  // STATS CALCULATIONS
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // FILTERED & SORTED TASKS
  const processedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status Filter
        if (statusFilter === "pending" && task.completed) return false;
        if (statusFilter === "completed" && !task.completed) return false;

        // Search Term Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const titleMatch = task.title.toLowerCase().includes(term);
          const descMatch = task.description
            ? task.description.toLowerCase().includes(term)
            : false;
          if (!titleMatch && !descMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        // Default: newest first
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [tasks, statusFilter, searchTerm, sortBy]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <section className="section">
      <div className="container">
        {/* Section Header */}
        <h2 className="section-title">My Todo List</h2>

        {/* API / MongoDB Error Banner */}
        {apiError && (
          <div
            style={{
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div>
              ⚠️ <strong>Backend / MongoDB Connection Notice:</strong> {apiError}
            </div>
            <button
              onClick={fetchTasks}
              className="btn btn-secondary"
              style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", flexShrink: 0 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Add Task Form Card */}
        <div className="bento-card todo-form-card">
          <h3>Add New Task</h3>

          <form onSubmit={addTask}>
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input
                className="form-input"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add details, notes, or sub-tasks..."
                rows="3"
              />
            </div>

            <div className="form-bottom">
              <div className="form-group priority-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1, height: "44px" }}
              >
                {submitting ? "Adding..." : "+ Add Task"}
              </button>
            </div>
          </form>
        </div>

        {/* Statistics Cards */}
        <div className="todo-stats">
          <div className="bento-card stat-card">
            <div className="stat-number">{totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>

          <div className="bento-card stat-card completed-stat">
            <div className="stat-number">{completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>

          <div className="bento-card stat-card pending-stat">
            <div className="stat-number">{pendingTasks}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        {/* Progress Card */}
        {totalTasks > 0 && (
          <div className="bento-card todo-progress-card">
            <div className="todo-progress-header">
              <span>Task Completion Progress</span>
              <span>
                {completedTasks} of {totalTasks} ({completionPercentage}%)
              </span>
            </div>
            <div className="todo-progress-bar-bg">
              <div
                className="todo-progress-bar-fill"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="todo-controls">
          {/* Search Row */}
          <div className="todo-search-row">
            <div className="search-input-wrapper">
              <span className="search-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                className="form-input search-input"
                type="text"
                placeholder="Search tasks by title or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter & Sort Controls Row */}
          <div className="todo-filter-row">
            {/* Status Filter Tabs */}
            <div className="filter-tabs">
              <button
                className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All <span className="filter-badge">{totalTasks}</span>
              </button>
              <button
                className={`filter-btn ${
                  statusFilter === "pending" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending <span className="filter-badge">{pendingTasks}</span>
              </button>
              <button
                className={`filter-btn ${
                  statusFilter === "completed" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("completed")}
              >
                Completed <span className="filter-badge">{completedTasks}</span>
              </button>
            </div>

            {/* Actions & Sorting */}
            <div className="todo-filter-actions">
              {/* Sort Select */}
              <select
                className="form-input select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
              </select>

              {/* Clear Completed Button */}
              {completedTasks > 0 && (
                <button
                  className="btn-action btn-clear-completed"
                  onClick={clearCompleted}
                  title="Remove all completed tasks"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Clear Completed ({completedTasks})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks List Section */}
        <div className="tasks-section">
          <div className="tasks-header">
            <h3>
              {statusFilter === "all"
                ? "All Tasks"
                : statusFilter === "pending"
                ? "Pending Tasks"
                : "Completed Tasks"}
            </h3>
            <span>
              Showing {processedTasks.length} of {tasks.length} tasks
            </span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="empty-state">
              <div className="spinner"></div>
              <p>Loading tasks from MongoDB...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && processedTasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h4>No tasks found</h4>
              <p>
                {searchTerm || statusFilter !== "all"
                  ? "Try clearing filters or search query to see more tasks."
                  : "Add your first task above to get started!"}
              </p>
            </div>
          )}

          {/* Task Items List */}
          {!loading && processedTasks.length > 0 && (
            <div className="task-list">
              {processedTasks.map((task) => (
                <div
                  key={task._id}
                  className={`bento-card task-card ${
                    task.completed ? "task-completed" : ""
                  }`}
                >
                  <div className="task-main">
                    {/* Task Info */}
                    <div className="task-info">
                      <h4>{task.title}</h4>
                      {task.description && <p>{task.description}</p>}

                      <div className="task-meta">
                        {/* Clickable Status Badge */}
                        <button
                          className={`status-badge ${
                            task.completed ? "status-completed" : "status-pending"
                          }`}
                          onClick={() => toggleTask(task)}
                          title="Click to toggle status"
                        >
                          {task.completed ? "Completed" : "Pending"}
                        </button>
                        {task.createdAt && (
                          <span>Created {formatDate(task.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Action Buttons */}
                  <div className="task-actions">
                    <button
                      className="btn-action"
                      onClick={() => setEditingTask(task)}
                      title="Edit task details"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteTask(task._id)}
                      title="Delete task"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Task Modal Overlay */}
        {editingTask && (
          <div className="modal-backdrop" onClick={() => setEditingTask(null)}>
            <div
              className="edit-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="edit-modal-header">
                <h3>Edit Task</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setEditingTask(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveEditedTask}>
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    className="form-input"
                    type="text"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={editingTask.completed ? "completed" : "pending"}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        completed: e.target.value === "completed",
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Todo;

