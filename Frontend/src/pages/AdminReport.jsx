import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingFallback from '../components/LoadingFallback';

// Supplementary Problem 1: Lazy-loaded heavy chart component
const AnalyticsChart = lazy(() => import('../components/AnalyticsChart'));

const API_URL = 'http://localhost:5000/admin/reports';

export default function AdminReport() {
  const { token, user, isAuthenticated, isAdmin } = useAuth();

  // Helper to format Date as YYYY-MM-DD
  const formatDateForInput = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date range state: default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });

  const [endDate, setEndDate] = useState(() => {
    return formatDateForInput(new Date());
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Table filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Quick preset handlers
  const applyPreset = (preset) => {
    const today = new Date();
    const endStr = formatDateForInput(today);
    let startD = new Date();

    if (preset === 'today') {
      // today only
    } else if (preset === '7days') {
      startD.setDate(today.getDate() - 7);
    } else if (preset === '30days') {
      startD.setDate(today.getDate() - 30);
    } else if (preset === 'month') {
      startD = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'all') {
      startD = new Date(2020, 0, 1);
    }

    setStartDate(formatDateForInput(startD));
    setEndDate(endStr);
  };

  // Fetch report data
  const generateReport = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to generate administrative report');
      }

      setReportData(result.data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message || 'Unable to load report from server.');
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, startDate, endDate]);

  // Load report initially if admin
  useEffect(() => {
    if (token && isAdmin) {
      generateReport();
    }
  }, [token, isAdmin, generateReport]);

  // Filtered task records in report
  const filteredTasks = useMemo(() => {
    if (!reportData || !reportData.tasks) return [];
    return reportData.tasks.filter((task) => {
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'pending' && task.completed) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(term);
        const emailMatch = task.userEmail?.toLowerCase().includes(term);
        const descMatch = task.description?.toLowerCase().includes(term);
        if (!titleMatch && !emailMatch && !descMatch) return false;
      }

      return true;
    });
  }, [reportData, searchTerm, statusFilter]);

  // Export to CSV
  const exportCSV = () => {
    if (!reportData || !reportData.tasks || reportData.tasks.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Task ID', 'Title', 'Description', 'Status', 'Creator Email', 'Creator Role', 'Created At'];
    const rows = reportData.tasks.map((t) => [
      `"${t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.completed ? 'Completed' : 'Pending',
      `"${t.userEmail || ''}"`,
      `"${t.userRole || ''}"`,
      `"${new Date(t.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Task_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ACCESS GUARDS
  if (!isAuthenticated) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: '540px', textAlign: 'center' }}>
          <div className="bento-card" style={{ padding: '3.5rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Authentication Required</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
              Please sign in with an administrator account to view and generate system reports.
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: '580px', textAlign: 'center' }}>
          <div className="bento-card" style={{ padding: '3.5rem 2rem', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '3.2rem', marginBottom: '1rem' }}>⛔</div>
            <h2 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>403 Forbidden: Admin Only</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Your account (<strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>) has role{' '}
              <span className="user-badge">{user?.role || 'user'}</span>. Report generation and system aggregation are strictly restricted to <strong>Administrator</strong> accounts.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/todo" className="btn btn-primary">
                Back to My Tasks
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Switch Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const summary = reportData?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    totalRegisteredUsers: 0,
    totalAdmins: 0,
    activeUsersInRange: 0,
  };

  return (
    <section className="section report-section">
      <div className="container">
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>

          <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Date-Range Task Report Generator
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            System-wide task metrics, creator activity breakdowns, and record logs for any specified date set.
          </p>
        </div>

        {/* DATE RANGE FILTER CONTROLS CARD */}
        <div className="bento-card report-filter-card" style={{ marginBottom: '2rem', padding: '1.75rem 2rem' }}>
          <div className="report-filter-header">
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>Set Report Date Range</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Filter tasks created between the selected start and end dates.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="preset-buttons">
              <button type="button" className="preset-btn" onClick={() => applyPreset('today')}>
                Today
              </button>
              <button type="button" className="preset-btn" onClick={() => applyPreset('7days')}>
                Last 7 Days
              </button>
              <button type="button" className="preset-btn" onClick={() => applyPreset('30days')}>
                Last 30 Days
              </button>
              <button type="button" className="preset-btn" onClick={() => applyPreset('month')}>
                This Month
              </button>
              <button type="button" className="preset-btn" onClick={() => applyPreset('all')}>
                All Time
              </button>
            </div>
          </div>

          <div className="report-dates-grid" style={{ marginTop: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={generateReport}
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1, height: '45px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <span className="mini-spinner"></span> Generating...
                  </>
                ) : (
                  <>
                    <span>⚡ Generate Report</span>
                  </>
                )}
              </button>

              {reportData && (
                <button
                  type="button"
                  onClick={exportCSV}
                  className="btn btn-secondary"
                  title="Export to CSV Spreadsheet"
                  style={{ height: '45px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  📥 Export CSV
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="auth-feedback-banner error-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}
        </div>

        {/* REPORT RESULTS */}
        {reportData && (
          <>
            {/* EXECUTIVE METRICS SUMMARY */}
            <div className="bento-grid" style={{ marginBottom: '2rem' }}>
              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#f2ca50' }}>
                  📋
                </div>
                <div className="metric-content">
                  <span className="metric-label">Total Tasks in Range</span>
                  <div className="metric-value">{summary.totalTasks}</div>
                  <span className="metric-hint">Across all system users</span>
                </div>
              </div>

              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: 'rgba(199, 199, 186, 0.15)', color: '#e8e1dd' }}>
                  ✓
                </div>
                <div className="metric-content">
                  <span className="metric-label">Completed Tasks</span>
                  <div className="metric-value">
                    {summary.completedTasks}{' '}
                    <span style={{ fontSize: '1rem', color: '#c7c7ba', fontWeight: '600' }}>
                      ({summary.completionRate}%)
                    </span>
                  </div>
                  <span className="metric-hint">Resolution rate</span>
                </div>
              </div>

              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: 'rgba(242, 202, 80, 0.15)', color: '#f2ca50' }}>
                  ⏳
                </div>
                <div className="metric-content">
                  <span className="metric-label">Pending Tasks</span>
                  <div className="metric-value">{summary.pendingTasks}</div>
                  <span className="metric-hint">Active backlog</span>
                </div>
              </div>

              <div className="bento-card metric-card">
                <div className="metric-icon" style={{ background: 'rgba(212, 175, 55, 0.25)', color: '#d4af37' }}>
                  👥
                </div>
                <div className="metric-content">
                  <span className="metric-label">Active Users in Set</span>
                  <div className="metric-value">{summary.activeUsersInRange}</div>
                  <span className="metric-hint">Total registered: {summary.totalRegisteredUsers}</span>
                </div>
              </div>
            </div>

            {/* Supplementary Problem 1: Code-split Lazy-Loaded Visualizer Chart */}
            <Suspense fallback={<LoadingFallback message="Loading analytics visualizer module..." delay={150} />}>
              <AnalyticsChart summary={summary} userBreakdown={reportData.userBreakdown} />
            </Suspense>

            {/* USER BREAKDOWN TABLE */}
            {reportData.userBreakdown && reportData.userBreakdown.length > 0 && (
              <div className="bento-card" style={{ marginBottom: '2rem', padding: '1.75rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>User Activity Breakdown</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {reportData.userBreakdown.length} active contributors
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>User Email</th>
                        <th>Role</th>
                        <th>Total Tasks</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.userBreakdown.map((ub, idx) => {
                        const rate = ub.total > 0 ? Math.round((ub.completed / ub.total) * 100) : 0;
                        return (
                          <tr key={idx}>
                            <td>
                              <strong style={{ color: 'var(--text-primary)' }}>{ub.email}</strong>
                            </td>
                            <td>
                              <span className={ub.role === 'admin' ? 'admin-badge' : 'user-badge'}>
                                {ub.role ? ub.role.toUpperCase() : 'USER'}
                              </span>
                            </td>
                            <td>{ub.total}</td>
                            <td style={{ color: '#10b981', fontWeight: '600' }}>{ub.completed}</td>
                            <td style={{ color: '#f59e0b', fontWeight: '600' }}>{ub.pending}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div className="progress-bar-bg">
                                  <div className="progress-bar-fill" style={{ width: `${rate}%` }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '35px' }}>
                                  {rate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DETAILED TASKS LOG */}
            <div className="bento-card" style={{ padding: '1.75rem 2rem' }}>
              <div className="task-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>Detailed Task Records</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Showing {filteredTasks.length} of {reportData.tasks.length} matching tasks
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by title, user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '220px', padding: '0.45rem 0.85rem', height: '38px', fontSize: '0.85rem' }}
                  />
                  <select
                    className="form-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: '130px', padding: '0.45rem 0.85rem', height: '38px', fontSize: '0.85rem' }}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No tasks found matching your filters for this date range.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Creator Email</th>
                        <th>Status</th>
                        <th>Created Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.title}</div>
                            {t.description && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {t.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{t.userEmail}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.userRole}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: t.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: t.completed ? '#10b981' : '#f59e0b',
                              }}
                            >
                              {t.completed ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(t.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
