import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/tasks";

// Sticky Note Color Palette matching the physical board drawing
const STICKY_PALETTES = [
  { borderTop: "#f2ca50", tape: "#f2ca50", accent: "rgba(242, 202, 80, 0.15)" }, // Gold Sticky
  { borderTop: "#f472b6", tape: "#f472b6", accent: "rgba(244, 114, 182, 0.15)" }, // Rose Sticky
  { borderTop: "#38bdf8", tape: "#38bdf8", accent: "rgba(56, 189, 248, 0.15)" }, // Sky Sticky
  { borderTop: "#a3e635", tape: "#a3e635", accent: "rgba(163, 230, 53, 0.15)" }, // Lime Sticky
  { borderTop: "#fb923c", tape: "#fb923c", accent: "rgba(251, 146, 60, 0.15)" }, // Orange Sticky
];

const getStickyStyle = (index) => STICKY_PALETTES[index % STICKY_PALETTES.length];

const KANBAN_COLUMNS = [
  { id: "todo", title: "To do", icon: "", hint: "Backlog & upcoming tasks" },
  { id: "in-progress", title: "In progress", icon: "", hint: "Currently being worked on" },
  { id: "done", title: "Done", icon: "", hint: "Completed objectives" },
];

function Todo() {
  const { token, logout } = useAuth();

  // Tasks state
  const [tasks, setTasks] = useState([]);

  // View mode: 'kanban' (default matching user's drawing) or 'list'
  const [viewMode, setViewMode] = useState("kanban");

  // Drag & drop states
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeDropCol, setActiveDropCol] = useState(null);

  // Form state for creating task
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo", // 'todo', 'in-progress', or 'done'
  });

  // State for editing task
  const [editingTask, setEditingTask] = useState(null);

  // Search & Sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Practical 13: AI Assistant State
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  // 401 UNAUTHORIZED / TOKEN EXPIRY HANDLER
  const handleUnauthorized = useCallback((message) => {
    logout();
    setTasks([]);
    setApiError(
      message || "Session expired or unauthorized. Please log in again from the navbar."
    );
  }, [logout]);

  // Helper to normalize task status
  const getTaskStatus = useCallback((task) => {
    if (task.status) return task.status;
    return task.completed ? "done" : "todo";
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
          setTasks(result.data || []);
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

  useEffect(() => {
    if (token) {
      fetchTasks(token);
    } else {
      setTasks([]);
    }
  }, [token, fetchTasks]);

  // TASK FORM CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // PRACTICAL 13: AI DESCRIPTION GENERATOR
  const generateAiDescription = async () => {
    const title = form.title.trim();
    if (!title) {
      alert("Please enter a task title first so the AI can generate a relevant description.");
      return;
    }

    try {
      setGeneratingAi(true);
      setAiNotice(null);

      const response = await fetch("http://localhost:5000/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();

      if (result.success && result.description) {
        setForm((prev) => ({
          ...prev,
          description: result.description
        }));
        setAiNotice({
          provider: result.provider,
          disclaimer: result.disclaimer || "AI-generated content. Please review before saving."
        });
      } else {
        alert(result.message || "Unable to generate AI description.");
      }
    } catch (err) {
      console.error("AI Generation request failed:", err);
      // Client-side graceful degradation fallback
      setForm((prev) => ({
        ...prev,
        description: `Action plan for '${title}': Define deliverables, allocate resources, and track progress.`
      }));
      setAiNotice({
        provider: "offline_fallback",
        disclaimer: "AI service currently offline. Showing local fallback draft."
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  // CREATE TASK (Protected + Validated)
  const addTask = async (e, customStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();

    const taskTitle = form.title.trim();
    if (!taskTitle) {
      alert("Please enter a task title (minimum 3 characters)");
      return;
    }

    const taskStatus = customStatus || form.status || "todo";

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
          title: taskTitle,
          description: form.description.trim(),
          status: taskStatus,
          completed: taskStatus === "done",
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
          status: "todo",
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

  // UPDATE TASK STATUS (Optimistic UI + Server Sync)
  const updateTaskStatus = async (taskId, newStatus) => {
    const isCompleted = newStatus === "done";

    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, status: newStatus, completed: isCompleted } : t
      )
    );

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          completed: isCompleted,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized("Your session has expired. Please log in again.");
        return;
      }

      const result = await response.json();
      if (!result.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error moving task:", error);
      fetchTasks();
    }
  };

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (activeDropCol !== colId) {
      setActiveDropCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (activeDropCol === colId) {
      setActiveDropCol(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setActiveDropCol(null);
    setDraggedTaskId(null);

    if (taskId) {
      updateTaskStatus(taskId, targetStatus);
    }
  };

  // UPDATE TASK IN EDIT MODAL (Protected + Validated)
  const saveEditedTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) {
      alert("Please enter a valid task title (min 3 characters)");
      return;
    }

    const taskStatus = editingTask.status || (editingTask.completed ? "done" : "todo");
    const isCompleted = taskStatus === "done";

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
          status: taskStatus,
          completed: isCompleted,
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

  // CLEAR ALL DONE TASKS (Protected)
  const clearCompleted = async () => {
    const doneTasks = tasks.filter((t) => getTaskStatus(t) === "done");
    if (doneTasks.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${doneTasks.length} done tasks?`
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
        setTasks((prev) => prev.filter((task) => getTaskStatus(task) !== "done"));
      } else {
        alert(result.message || result.error || "Failed to clear done tasks");
      }
    } catch (error) {
      console.error("Error clearing completed tasks:", error);
      alert("Failed to clear completed tasks.");
    }
  };

  // STATS CALCULATIONS
  const totalTasks = tasks.length;
  const todoCount = tasks.filter((t) => getTaskStatus(t) === "todo").length;
  const inProgressCount = tasks.filter((t) => getTaskStatus(t) === "in-progress").length;
  const doneCount = tasks.filter((t) => getTaskStatus(t) === "done").length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // FILTERED & SORTED TASKS
  const processedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const st = getTaskStatus(task);
        if (statusFilter !== "all" && st !== statusFilter) return false;

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
  }, [tasks, statusFilter, searchTerm, sortBy, getTaskStatus]);

  // Tasks partitioned by Kanban column
  const columnTasks = useMemo(() => {
    return {
      todo: processedTasks.filter((t) => getTaskStatus(t) === "todo"),
      "in-progress": processedTasks.filter((t) => getTaskStatus(t) === "in-progress"),
      done: processedTasks.filter((t) => getTaskStatus(t) === "done"),
    };
  }, [processedTasks, getTaskStatus]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="section">
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>

        </div>

        {/* LOCKED STATE BANNER WHEN NOT AUTHENTICATED */}
        {!token && (
          <div
            className="bento-card auth-locked-card"
            style={{
              maxWidth: "540px",
              margin: "1.5rem auto 3rem auto",
              textAlign: "center",
              padding: "3.5rem 2rem",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Authentication Required
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                marginBottom: "2rem",
              }}
            >
              Task operations are protected by JWT authentication. Please use the{" "}
              <strong style={{ color: "var(--text-primary)" }}>Sign In</strong>{" "}
              option in the navigation bar to log in or register your account.
            </p>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                textDecoration: "none",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Go to Login Page</span>
            </Link>
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
            <button
              onClick={() => fetchTasks()}
              className="btn btn-secondary"
              style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* AUTHENTICATED BOARD CONTENT */}
        {token ? (
          <>
            {/* Create Task Form */}
            <div className="bento-card todo-form-card" style={{ marginBottom: "2rem" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Add New Task
              </h3>
              <form onSubmit={addTask}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Task Title (Min 3 characters)</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      placeholder="e.g., Design executive header, Review pull request..."
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Note Details / Description (Optional)</label>
                      <button
                        type="button"
                        onClick={generateAiDescription}
                        disabled={generatingAi || !form.title.trim()}
                        className="btn"
                        style={{
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.78rem",
                          borderRadius: "9999px",
                          background: generatingAi ? "rgba(212, 175, 55, 0.2)" : "rgba(212, 175, 55, 0.12)",
                          color: "#f2ca50",
                          border: "1px solid rgba(212, 175, 55, 0.35)",
                          cursor: generatingAi || !form.title.trim() ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          transition: "all 0.2s ease"
                        }}
                        title="Auto-generate an actionable description draft using AI"
                      >
                        {generatingAi ? (
                          <>
                            <span className="mini-spinner" style={{ width: "12px", height: "12px" }}></span>
                            <span>Generating with AI...</span>
                          </>
                        ) : (
                          <>
                            <span>✨ Generate Description (AI)</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      name="description"
                      className="form-textarea"
                      placeholder="Add supplementary details, notes, or bullet points..."
                      rows="3"
                      value={form.description}
                      onChange={handleChange}
                    />
                    {aiNotice && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.45rem 0.85rem",
                          borderRadius: "8px",
                          background: "rgba(212, 175, 55, 0.08)",
                          border: "1px solid rgba(212, 175, 55, 0.25)",
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem"
                        }}
                      >
                        <span>
                          🤖 <strong>AI Suggestion ({aiNotice.provider}):</strong> {aiNotice.disclaimer}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAiNotice(null)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "0.95rem"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Board Column:
                      </label>
                      <select
                        name="status"
                        className="form-input"
                        value={form.status}
                        onChange={handleChange}
                        style={{ padding: "0.45rem 1rem", fontSize: "0.88rem", width: "160px" }}
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{ padding: "0.65rem 1.75rem" }}
                    >
                      {submitting ? "Adding Task..." : "+ Add Task"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Task Overview Stats */}
            <div className="bento-grid" style={{ marginBottom: "2rem" }}>
              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: "rgba(212, 175, 55, 0.15)", color: "#f2ca50" }}>
                  📋
                </div>
                <div className="metric-content">
                  <span className="metric-label">Total Board Tasks</span>
                  <div className="metric-value">{totalTasks}</div>
                  <span className="metric-hint">Active sticky notes</span>
                </div>
              </div>

              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: "rgba(242, 202, 80, 0.15)", color: "#f2ca50" }}>
                  📌
                </div>
                <div className="metric-content">
                  <span className="metric-label">To Do</span>
                  <div className="metric-value">{todoCount}</div>
                  <span className="metric-hint">Queued backlog</span>
                </div>
              </div>

              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                  ⚡
                </div>
                <div className="metric-content">
                  <span className="metric-label">In Progress</span>
                  <div className="metric-value">{inProgressCount}</div>
                  <span className="metric-hint">Work in flight</span>
                </div>
              </div>

              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: "rgba(199, 199, 186, 0.15)", color: "#e8e1dd" }}>
                  ✓
                </div>
                <div className="metric-content">
                  <span className="metric-label">Done ({completionPercentage}%)</span>
                  <div className="metric-value">{doneCount}</div>
                  <span className="metric-hint">Completed items</span>
                </div>
              </div>
            </div>

            {/* Filter & View Switcher Bar */}
            <div
              className="bento-card"
              style={{
                marginBottom: "2rem",
                padding: "1.25rem 1.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "260px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="🔍 Search sticky notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, padding: "0.55rem 1rem", fontSize: "0.9rem" }}
                />
                {searchTerm && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSearchTerm("")}
                    style={{ padding: "0.5rem 0.85rem", fontSize: "0.8rem" }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <select
                  className="form-input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>

                {/* View Switcher Toggle */}
                <div className="view-toggle-group">
                  <button
                    className={`view-toggle-btn ${viewMode === "kanban" ? "active" : ""}`}
                    onClick={() => setViewMode("kanban")}
                    title="Physical Kanban Board View"
                  >
                    Kanban Board
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title="Classic List View"
                  >
                    ☰ List View
                  </button>
                </div>

                {doneCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="btn btn-secondary"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", color: "#ffb4ab" }}
                  >
                    Clear Done ({doneCount})
                  </button>
                )}
              </div>
            </div>

            {/* MAIN CONTENT: KANBAN BOARD OR LIST */}
            {loading ? (
              <div className="bento-card" style={{ padding: "3.5rem", textAlign: "center" }}>
                <div className="mini-spinner" style={{ width: "24px", height: "24px" }}></div>
                <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
                  Loading sticky notes onto the whiteboard...
                </p>
              </div>
            ) : viewMode === "kanban" ? (
              /* =======================================================
                 PHYSICAL KANBAN BOARD VIEW (Matching User's Drawing)
                 ======================================================= */
              <div className="kanban-board-wrapper">
                <div className="kanban-board-frame">
                  {/* Physical Board Top Header */}
                  <div className="kanban-board-header">
                    <div className="kanban-title-wrap">

                      <div className="kanban-title-underline" />
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      💡 Drag &amp; drop cards between columns or use arrow buttons
                    </div>
                  </div>

                  {/* 3 Columns: To do | In progress | Done */}
                  <div className="kanban-columns-grid">
                    {KANBAN_COLUMNS.map((column) => {
                      const colCards = columnTasks[column.id] || [];

                      return (
                        <div
                          key={column.id}
                          className={`kanban-column ${activeDropCol === column.id ? "drop-zone-active" : ""
                            }`}
                          onDragOver={(e) => handleDragOver(e, column.id)}
                          onDragLeave={(e) => handleDragLeave(e, column.id)}
                          onDrop={(e) => handleDrop(e, column.id)}
                        >
                          {/* Column Header */}
                          <div className="kanban-column-header">
                            <h4 className="kanban-column-title">
                              <span>{column.icon}</span> {column.title}
                            </h4>
                            <span className="column-badge">{colCards.length}</span>
                          </div>

                          {/* Column Cards Container */}
                          <div className="kanban-column-cards">
                            {colCards.length === 0 ? (
                              <div className="kanban-column-empty">
                                <div>📌 Drop sticky notes here</div>
                                <div style={{ fontSize: "0.78rem", marginTop: "0.3rem", opacity: 0.7 }}>
                                  {column.hint}
                                </div>
                              </div>
                            ) : (
                              colCards.map((task, idx) => {
                                const palette = getStickyStyle(idx);
                                const tiltClass = idx % 2 === 0 ? "tilt-left" : "tilt-right";

                                return (
                                  <div
                                    key={task._id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, task._id)}
                                    className={`sticky-note-card ${tiltClass}`}
                                    style={{
                                      borderTop: `5px solid ${palette.borderTop}`,
                                      backgroundColor: "var(--surface-container)",
                                    }}
                                  >
                                    {/* Top Tape Accent */}
                                    <div
                                      className="sticky-tape"
                                      style={{ backgroundColor: palette.tape }}
                                    />

                                    <div className="sticky-note-header">
                                      <h5 className="sticky-note-title">{task.title}</h5>
                                    </div>

                                    {task.description && (
                                      <p className="sticky-note-desc">{task.description}</p>
                                    )}

                                    {/* Card Footer with Quick Move & Actions */}
                                    <div className="sticky-note-footer">
                                      <span>{formatDate(task.createdAt)}</span>

                                      {/* Quick Move Buttons */}
                                      <div className="sticky-move-actions">
                                        {column.id === "todo" && (
                                          <button
                                            className="sticky-move-btn"
                                            onClick={() => updateTaskStatus(task._id, "in-progress")}
                                            title="Move to In progress"
                                          >
                                            In progress →
                                          </button>
                                        )}

                                        {column.id === "in-progress" && (
                                          <>
                                            <button
                                              className="sticky-move-btn"
                                              onClick={() => updateTaskStatus(task._id, "todo")}
                                              title="Move back to To do"
                                            >
                                              ← To do
                                            </button>
                                            <button
                                              className="sticky-move-btn"
                                              onClick={() => updateTaskStatus(task._id, "done")}
                                              title="Move to Done"
                                            >
                                              Done →
                                            </button>
                                          </>
                                        )}

                                        {column.id === "done" && (
                                          <button
                                            className="sticky-move-btn"
                                            onClick={() => updateTaskStatus(task._id, "in-progress")}
                                            title="Move back to In progress"
                                          >
                                            ← In prog
                                          </button>
                                        )}

                                        <button
                                          className="sticky-icon-btn"
                                          onClick={() => setEditingTask(task)}
                                          title="Edit note"
                                        >
                                          ✏️
                                        </button>

                                        <button
                                          className="sticky-icon-btn delete-icon"
                                          onClick={() => deleteTask(task._id)}
                                          title="Delete note"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Quick Add Button per Column */}
                          <button
                            className="kanban-add-card-btn"
                            onClick={() => {
                              const quickTitle = window.prompt(`Quick add note to "${column.title}":`);
                              if (quickTitle && quickTitle.trim().length >= 3) {
                                setForm({ title: quickTitle.trim(), description: "", status: column.id });
                                addTask({ preventDefault: () => { } }, column.id);
                              } else if (quickTitle !== null) {
                                alert("Note title must be at least 3 characters.");
                              }
                            }}
                          >
                            + Add note to {column.title}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* =======================================================
                 CLASSIC LIST VIEW
                 ======================================================= */
              <div className="task-list-section">
                {processedTasks.length === 0 ? (
                  <div className="bento-card" style={{ padding: "3rem", textAlign: "center" }}>
                    <div className="empty-icon">📝</div>
                    <h3>No tasks found</h3>
                    <p style={{ color: "var(--text-muted)" }}>
                      {searchTerm
                        ? "No tasks match your filter criteria."
                        : "You don't have any tasks yet. Pin a sticky note above to get started!"}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {processedTasks.map((task) => {
                      const st = getTaskStatus(task);
                      return (
                        <div
                          key={task._id}
                          className="task-card"
                          style={{
                            borderLeft:
                              st === "done"
                                ? "4px solid #c7c7ba"
                                : st === "in-progress"
                                  ? "4px solid #38bdf8"
                                  : "4px solid #f2ca50",
                          }}
                        >
                          <div className="task-main">
                            <button
                              className={`task-checkbox ${st === "done" ? "checked" : ""}`}
                              onClick={() =>
                                updateTaskStatus(task._id, st === "done" ? "todo" : "done")
                              }
                              title={st === "done" ? "Mark incomplete" : "Mark done"}
                            >
                              {st === "done" ? "✓" : ""}
                            </button>

                            <div className="task-info">
                              <h4
                                style={{
                                  textDecoration: st === "done" ? "line-through" : "none",
                                  color: st === "done" ? "var(--text-muted)" : "var(--text-primary)",
                                }}
                              >
                                {task.title}
                              </h4>
                              {task.description && <p>{task.description}</p>}
                              <div className="task-meta">
                                <span
                                  className="status-badge"
                                  style={{
                                    backgroundColor:
                                      st === "done"
                                        ? "rgba(199, 199, 186, 0.14)"
                                        : st === "in-progress"
                                          ? "rgba(56, 189, 248, 0.15)"
                                          : "rgba(242, 202, 80, 0.12)",
                                    color:
                                      st === "done"
                                        ? "#c7c7ba"
                                        : st === "in-progress"
                                          ? "#38bdf8"
                                          : "#f2ca50",
                                  }}
                                >
                                  {st === "todo" ? "To do" : st === "in-progress" ? "In progress" : "Done"}
                                </span>
                                {task.createdAt && <span>Created: {formatDate(task.createdAt)}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="task-actions">
                            <button
                              className="btn btn-secondary"
                              onClick={() => setEditingTask(task)}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => deleteTask(task._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
              <div className="modal-backdrop" onClick={() => setEditingTask(null)}>
                <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="edit-modal-header">
                    <h3>Edit Sticky Note</h3>
                    <button className="modal-close-btn" onClick={() => setEditingTask(null)}>
                      ✕
                    </button>
                  </div>

                  <form onSubmit={saveEditedTask}>
                    <div className="form-group">
                      <label className="form-label">Note Title (Min 3 characters)</label>
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
                      <label className="form-label">Description / Details</label>
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
                      <label className="form-label">Board Column Status</label>
                      <select
                        className="form-input"
                        value={editingTask.status || (editingTask.completed ? "done" : "todo")}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            status: e.target.value,
                            completed: e.target.value === "done",
                          })
                        }
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
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