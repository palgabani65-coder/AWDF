import { useState, useEffect, useCallback, useMemo } from 'react';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import RepoList from '../components/RepoList';

const USERNAME = 'palgabani65-coder';
const VALID_GITHUB_API_URL = `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`;
const BROKEN_GITHUB_API_URL = `https://api.github.com/users/${USERNAME}/invalid_endpoint_for_error_test`;

function Projects() {
  // Step 1: Set up 3 state variables for data, loading, and error
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extra features: search, filter, expansion, and error simulation toggle
  const [expandedRepoId, setExpandedRepoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'sources', 'forks'
  const [simulateError, setSimulateError] = useState(false);

  // Step 2: Use useEffect / fetch function to fetch data when component mounts
  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const apiUrl = simulateError ? BROKEN_GITHUB_API_URL : VALID_GITHUB_API_URL;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}: ${res.statusText || 'Failed to fetch repositories'}`);
        }
        return res.json();
      })
      .then(async (data) => {
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from API');
        }

        // Fetch language breakdown for tech badges
        const reposWithLangs = await Promise.all(
          data.map(async (repo) => {
            let langNames = [];
            if (repo.languages_url) {
              try {
                const langRes = await fetch(repo.languages_url);
                if (langRes.ok) {
                  const langData = await langRes.json();
                  langNames = Object.keys(langData);
                }
              } catch (e) {
                console.warn(`Languages fetch failed for ${repo.name}:`, e);
              }
            }
            if (langNames.length === 0 && repo.language) {
              langNames = [repo.language];
            }
            return {
              ...repo,
              techList: langNames
            };
          })
        );

        setRepos(reposWithLangs);
      })
      .catch((err) => {
        console.error('Error fetching GitHub repos:', err);
        setError(err.message || 'Failed to fetch repositories from GitHub REST API');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [simulateError]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const toggleDetails = (id) => {
    setExpandedRepoId(prev => (prev === id ? null : id));
  };

  // Filter repos based on type and search term
  const filteredRepos = useMemo(() => {
    return repos.filter(repo => {
      if (filterType === 'sources' && repo.fork) return false;
      if (filterType === 'forks' && !repo.fork) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const searchables = [
        repo.name,
        repo.description || '',
        repo.language || '',
        ...(repo.techList || []),
        ...(repo.topics || [])
      ].map(s => (s || '').toLowerCase());

      return searchables.some(s => s.includes(term));
    });
  }, [repos, searchTerm, filterType]);

  return (
    <section className="section">
      <div className="container">
        
        {/* Testing Control Bar for Evaluation */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => {
              setSimulateError(prev => !prev);
            }}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              border: '1px solid var(--border-color)',
              backgroundColor: simulateError ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
              color: simulateError ? '#f87171' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Toggle between valid URL and broken API URL to test error & retry state"
          >
            {simulateError ? '⚠️ Simulated API Error Active (Click to Restore)' : '🧪 Test Error State'}
          </button>
        </div>

        {/* Step 3: Conditionally render based on state */}
        {loading ? (
          <Spinner message="Fetching repositories from GitHub REST API..." />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            onRetry={() => {
              // If in simulated error state, restore normal state on retry or re-fetch
              if (simulateError) setSimulateError(false);
              fetchRepos();
            }} 
          />
        ) : (
          <RepoList
            repos={filteredRepos}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            expandedRepoId={expandedRepoId}
            toggleDetails={toggleDetails}
          />
        )}

      </div>
    </section>
  );
}

export default Projects;
