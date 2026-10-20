import React from 'react';

/**
 * AnalyticsChart (Heavy Visualizer Component)
 * 
 * Demonstrates component-level code splitting (Supplementary Problem 1).
 * Dynamically imported and lazy-loaded only when the Administrator Report page is viewed.
 */
function AnalyticsChart({ summary, userBreakdown }) {
  const completionRate = summary?.completionRate || 0;
  const totalTasks = summary?.totalTasks || 0;
  const completedTasks = summary?.completedTasks || 0;
  const pendingTasks = summary?.pendingTasks || 0;

  // Donut chart stroke circumference calculations (r = 40, circ = 2 * PI * 40 = 251.32)
  const circ = 2 * Math.PI * 40;
  const completedStroke = (completionRate / 100) * circ;
  const pendingStroke = circ - completedStroke;

  return (
    <div className="bento-card" style={{ marginBottom: '2rem', padding: '1.75rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>
            📊 Interactive Task Velocity & Completion Analytics
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Lazy-loaded visualizer module loaded on-demand via React.lazy() & Suspense
          </p>
        </div>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.3rem 0.75rem',
          borderRadius: '9999px',
          background: 'rgba(212, 175, 55, 0.15)',
          color: '#f2ca50',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          fontWeight: 600
        }}>
          Code-Split Visualizer
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
        {/* Radial Donut Visualizer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg viewBox="0 0 100 100" width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="12"
              />
              {/* Completed tasks arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#a3e635"
                strokeWidth="12"
                strokeDasharray={`${completedStroke} ${circ}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {completionRate}%
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Resolved
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#a3e635', display: 'inline-block' }}></span>
              <span>Completed: <strong>{completedTasks}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.2)', display: 'inline-block' }}></span>
              <span>Pending: <strong>{pendingTasks}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f2ca50', display: 'inline-block' }}></span>
              <span>Total Volume: <strong>{totalTasks}</strong></span>
            </div>
          </div>
        </div>

        {/* User Breakdown Progress Bars */}
        <div>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            User Task Distribution ({userBreakdown?.length || 0} active creators)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {userBreakdown && userBreakdown.length > 0 ? (
              userBreakdown.map((u, idx) => {
                const userPct = totalTasks > 0 ? Math.round((u.total / totalTasks) * 100) : 0;
                return (
                  <div key={idx} style={{ fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.email}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{u.total} tasks ({userPct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${userPct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #d4af37, #f2ca50)',
                        borderRadius: '9999px',
                        transition: 'width 0.6s ease'
                      }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No task distribution data in range.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsChart;
