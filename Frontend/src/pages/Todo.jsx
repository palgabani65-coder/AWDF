import { useEffect, useState, useMemo, useCallback } from "react";

const API_URL = "http://localhost:5000/tasks";
const AUTH_URL = "http://localhost:5000";

function Todo() {
  // Authentication state (Practical 7)
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);

  // Tasks state
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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // LOGOUT HANDLER
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setTasks([]);
    setAuthSuccess("You have been successfully logged out.");
    setAuthError(null);
  }, []);

  // 401 UNAUTHORIZED / TOKEN EXPIRY HANDLER
  const handleUnauthorized = useCallback((message) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setTasks([]);
    setAuthError(
      message || "Session expired or unauthorized. Please log in again to continue."
    );
  }, []);

  // FETCH TASKS (Protected by Bearer Token)
  const fetchTasks = useCallback(
    async (overrideToken = null) => {
      const activeToken = overrideToken || token;
      if (!activeToken) {
        setTasks([]);
        return;
      }

      try {
        setLoading(true);
        setApiError(null);

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });

        if (response.status === 401) {
          const errData = await response.json();
          handleUnauthorized(errData.message);
          return;
        }

        const result = await response.json();

        if (result.success) {
          setTasks(result.data);
        } else {
          setApiError(result.error || result.message || "Failed to fetch tasks from server");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setApiError(
          "Unable to connect to backend server (http://localhost:5000). Please make sure the server is running."
        );
      } finally {
        setLoading(false);
      }
    },
    [token, handleUnauthorized]
  );

  // Load tasks on initial mount if authenticated
  useEffect(() => {
    if (token) {
      fetchTasks(token);
    }
  }, [token, fetchTasks]);

  // AUTH FORM CHANGE
  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // SUBMIT AUTH FORM (LOGIN / REGISTER)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!authForm.email || !authForm.password) {
      setAuthError("Please enter both email and password.");
      return;
    }

    if (authMode === "register" && authForm.password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setAuthLoading(true);
      const endpoint = authMode === "register" ? `${AUTH_URL}/register` : `${AUTH_URL}/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authForm.email.trim(),
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthError(data.message || data.error || "Authentication failed.");
        return;
      }

      if (authMode === "register") {
        setAuthSuccess("Registration successful! Logging you in...");
        // Auto-login after registration
        const loginRes = await fetch(`${AUTH_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authForm.email.trim(),
            password: authForm.password,
          }),
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("user", JSON.stringify(loginData.user));
          setToken(loginData.token);
          setUser(loginData.user);
          setAuthForm({ email: "", password: "" });
          fetchTasks(loginData.token);
        }
      } else {
        // Login success
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setAuthForm({ email: "", password: "" });
        setAuthSuccess("Login successful! Welcome back.");
        fetchTasks(data.token);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError("Failed to reach authentication server. Check backend connection.");
    } finally {
      setAuthLoading(false);
    }
  };

  // TASK FORM CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CREATE TASK (Protected + Validated)
  const addTask = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter a task title (minimum 3 characters)");
      return;
    }

    try {
      setSubmitting(true);
      setApiError(null);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          completed: form.status === "completed",
        }),
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setTasks((prev) => [result.data, ...prev]);
        setForm({
          title: "",
          description: "",
          status: "pending",
        });
      } else {
        alert(result.message || result.error || "Failed to add task");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to connect to backend API server.");
    } finally {
      setSubmitting(false);
    }
  };

  // TOGGLE TASK STATUS (Protected)
  const toggleTask = async (task) => {
    try {
      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setTasks((prev) =>
          prev.map((item) => (item._id === task._id ? result.data : item))
        );
      } else {
        alert(result.error || result.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
    }
  };

  // UPDATE TASK IN EDIT MODAL (Protected + Validated)
  const saveEditedTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) {
      alert("Please enter a valid task title (min 3 characters)");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingTask.title.trim(),
          description: editingTask.description ? editingTask.description.trim() : "",
          completed: editingTask.completed,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setTasks((prev) =>
          prev.map((item) => (item._id === editingTask._id ? result.data : item))
        );
        setEditingTask(null);
      } else {
        alert(result.message || result.error || "Failed to save task edits");
      }
    } catch (error) {
      console.error("Error saving task edit:", error);
      alert("Error saving edits.");
    }
  };

  // DELETE SINGLE TASK (Protected)
  const deleteTask = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setTasks((prev) => prev.filter((task) => task._id !== id));
      } else {
        alert(result.message || result.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  // CLEAR ALL COMPLETED TASKS (Protected)
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setTasks((prev) => prev.filter((task) => !task.completed));
      } else {
        alert(result.message || result.error || "Failed to clear completed tasks");
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
        if (statusFilter === "pending" && task.completed) return false;
        if (statusFilter === "completed" && !task.completed) return false;

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
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
            Task Management System
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Practical 7: JWT Authentication &amp; Express Middleware Pipeline
          </p>
        </div>

        {/* AUTHENTICATION CONTROL CARD / STATUS BANNER */}
        {token && user ? (
          <div
            className="bento-card auth-banner"
            style={{
              marginBottom: "1.75rem",
              padding: "1rem 1.5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              borderLeft: "4px solid #10b981",
              backgroundColor: "rgba(16, 185, 129, 0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <span
                style={{
                  fontSize: "1.3rem",
                  background: "rgba(16, 185, 129, 0.15)",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "8px",
                }}
              >
                🔐
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{user.email}</strong>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      backgroundColor: "#10b981",
                      color: "#fff",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "12px",
                      fontWeight: "600",
                    }}
                  >
                    JWT Verified
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Bearer token active (1-hour expiry) • Route-level middleware protection enabled
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "#ef4444",
                padding: "0.4rem 1rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <div
            className="bento-card auth-card"
            style={{
              marginBottom: "2rem",
              padding: "1.75rem",
              maxWidth: "520px",
              margin: "0 auto 2.5rem auto",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>🛡️</div>
              <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.35rem" }}>
                Authentication Required
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                Log in or register to access your JWT-protected task pipeline.
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div
              style={{
                display: "flex",
                background: "var(--bg-secondary)",
                padding: "0.3rem",
                borderRadius: "10px",
                marginBottom: "1.25rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  border: "none",
                  borderRadius: "7px",
                  background: authMode === "login" ? "var(--bg-primary)" : "transparent",
                  color: authMode === "login" ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: authMode === "login" ? "600" : "400",
                  cursor: "pointer",
                  boxShadow:
                    authMode === "login" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  border: "none",
                  borderRadius: "7px",
                  background: authMode === "register" ? "var(--bg-primary)" : "transparent",
                  color: authMode === "register" ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: authMode === "register" ? "600" : "400",
                  cursor: "pointer",
                  boxShadow:
                    authMode === "register" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                Register
              </button>
            </div>

            {/* Error / Success Notifications */}
            {authError && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                }}
              >
                ⚠️ {authError}
              </div>
            )}

            {authSuccess && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "#10b981",
                  fontSize: "0.85rem",
                }}
              >
                ✓ {authSuccess}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="student@example.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">
                  Password {authMode === "register" && "(min 6 characters)"}
                </label>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.75rem" }}
                disabled={authLoading}
              >
                {authLoading
                  ? "Authenticating..."
                  : authMode === "login"
                  ? "Log In with JWT"
                  : "Create Account (Bcrypt Hashing)"}
              </button>
            </form>
          </div>
        )}

        {/* API / Backend Connection Error Banner */}
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
              ⚠️ <strong>Backend Connection Notice:</strong> {apiError}
            </div>
            {token && (
              <button
                onClick={() => fetchTasks(token)}
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", flexShrink: 0 }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* SHOW TASK DASHBOARD ONLY IF AUTHENTICATED */}
        {token && user ? (
          <>
            {/* Add Task Form Card */}
            <div className="bento-card todo-form-card">
              <h3>Add New Task</h3>

              <form onSubmit={addTask}>
                <div className="form-group">
                  <label className="form-label">Task Title (Min 3 characters)</label>
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
                    className="btn btn-primary submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? "Adding..." : "Add Task"}
                  </button>
                </div>
              </form>
            </div>

            {/* Task Overview Stats */}
            <div className="todo-stats-grid">
              <div className="bento-card stat-card">
                <div className="stat-value">{totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>

              <div className="bento-card stat-card">
                <div className="stat-value pending-color">{pendingTasks}</div>
                <div className="stat-label">Pending</div>
              </div>

              <div className="bento-card stat-card">
                <div className="stat-value completed-color">{completedTasks}</div>
                <div className="stat-label">Completed</div>
              </div>

              <div className="bento-card stat-card">
                <div className="stat-value">{completionPercentage}%</div>
                <div className="stat-label">Progress</div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter & Controls Bar */}
            <div className="bento-card todo-controls-card">
              <div className="search-box">
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchTerm("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls">
                <div className="filter-group">
                  <button
                    className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({totalTasks})
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending ({pendingTasks})
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === "completed" ? "active" : ""}`}
                    onClick={() => setStatusFilter("completed")}
                  >
                    Done ({completedTasks})
                  </button>
                </div>

                <div className="sort-group">
                  <select
                    className="form-input sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>

                {completedTasks > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="btn btn-secondary clear-completed-btn"
                  >
                    Clear Done ({completedTasks})
                  </button>
                )}
              </div>
            </div>

            {/* Task List Rendering */}
            <div className="task-list-section">
              {loading ? (
                <div className="todo-empty-state">
                  <div className="loading-spinner"></div>
                  <p>Loading your tasks securely from MongoDB...</p>
                </div>
              ) : processedTasks.length === 0 ? (
                <div className="bento-card todo-empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No tasks found</h3>
                  <p>
                    {searchTerm || statusFilter !== "all"
                      ? "No tasks match your filter criteria."
                      : "You don't have any tasks yet. Create one above to get started!"}
                  </p>
                </div>
              ) : (
                <div className="task-items-container">
                  {processedTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`bento-card task-item ${
                        task.completed ? "task-completed" : ""
                      }`}
                    >
                      <div className="task-item-left">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task)}
                          title={
                            task.completed
                              ? "Mark as pending"
                              : "Mark as completed"
                          }
                        />
                        <div className="task-content">
                          <h4 className="task-title">{task.title}</h4>
                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}
                          <div className="task-meta">
                            <span
                              className={`status-pill ${
                                task.completed ? "pill-done" : "pill-pending"
                              }`}
                            >
                              {task.completed ? "Completed" : "Pending"}
                            </span>
                            {task.createdAt && (
                              <span className="task-date">
                                Created: {formatDate(task.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          className="edit-btn"
                          onClick={() => setEditingTask(task)}
                          title="Edit task"
                        >
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
                      <label className="form-label">Task Title (Min 3 chars)</label>
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
          </>
        ) : null}
      </div>
    </section>
  );
}

export default Todo;