import React from 'react';

// Standard GitHub language badge colors
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  TypeScript: '#3178c6',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  PHP: '#4F5D95',
  Go: '#00ADD8',
  Shell: '#89e051',
  Vue: '#41b883'
};

/**
 * RepoList component to render search & filter inputs alongside
 * the list of GitHub repositories.
 */
function RepoList({
  repos,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  expandedRepoId,
  toggleDetails
}) {
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSize = (sizeKB) => {
    if (!sizeKB) return '0 KB';
    if (sizeKB >= 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
    return `${sizeKB} KB`;
  };

  return (
    <div>
      {/* Header & Filter Controls Bar */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>Showcase Projects</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Live repositories fetched dynamically via GitHub REST API (<code>@palgabani65-coder</code>)
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search projects or tech stack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.55rem 1.1rem',
                paddingLeft: '2.2rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                minWidth: '260px'
              }}
            />
            <span style={{ position: 'absolute', left: '0.8rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>🔍</span>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '2px', border: '1px solid var(--border-color)' }}>
            {['all', 'sources', 'forks'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '18px',
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  backgroundColor: filterType === type ? 'var(--accent-color)' : 'transparent',
                  color: filterType === type ? '#0f172a' : 'var(--text-secondary)',
                  fontWeight: filterType === type ? '600' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty Filter State */}
      {repos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No projects match your filter criteria.</p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterType('all'); }} 
            className="btn btn-secondary" 
            style={{ marginTop: '1rem', fontSize: '0.85rem' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Repository Cards Bento Grid */}
      {repos.length > 0 && (
        <div className="bento-grid">
          {repos.map((repo) => (
            <div 
              key={repo.id} 
              className="bento-card span-3" 
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease' }}
            >
              {/* Top Bar: Category & Stars */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="skill-tag" style={{ margin: 0 }}>
                    {repo.fork ? 'Forked Repo' : 'Source Repo'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span title="Stars">⭐ {repo.stargazers_count}</span>
                  <span title="Forks">⑂ {repo.forks_count}</span>
                </div>
              </div>

              {/* Title & URL Link */}
              <h3 style={{ fontSize: '1.35rem', margin: '0.1rem 0' }}>
                <a 
                  href={repo.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {repo.name.replace(/[-_]/g, ' ')}
                </a>
              </h3>

              {/* Description */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {repo.description || 'GitHub repository by palgabani65-coder.'}
              </p>

              {/* Tech Badges */}
              {repo.techList && repo.techList.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: 'auto', paddingTop: '0.2rem' }}>
                  {repo.techList.map((t) => (
                    <span key={t} style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: 'var(--accent-color)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: LANGUAGE_COLORS[t] || 'var(--accent-color)'
                      }}></span>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Collapsible Technical Details */}
              {expandedRepoId === repo.id && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(45, 212, 191, 0.04)',
                  border: '1px dashed rgba(45, 212, 191, 0.2)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  animation: 'fadeIn 0.25s ease'
                }}>
                  <div><strong>Default Branch:</strong> <code>{repo.default_branch}</code></div>
                  <div><strong>Last Updated:</strong> {formatDate(repo.updated_at)}</div>
                  <div><strong>Codebase Size:</strong> {formatSize(repo.size)}</div>
                  <div><strong>Repository URL:</strong> <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>{repo.html_url}</a></div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', textDecoration: 'none' }}
                >
                  View on GitHub ↗
                </a>
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', textDecoration: 'none' }}
                  >
                    Live Demo ↗
                  </a>
                )}
                <button 
                  onClick={() => toggleDetails(repo.id)}
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                >
                  {expandedRepoId === repo.id ? 'Hide Details' : 'Details'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RepoList;
