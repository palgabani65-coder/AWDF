import React from 'react';

/**
 * ErrorMessage component displayed when an API request fails.
 * Includes a Retry button to allow re-triggering the fetch.
 */
function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      margin: '2rem auto',
      maxWidth: '600px',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      borderRadius: '16px',
      textAlign: 'center',
      gap: '1rem',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f87171',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        ⚠️
      </div>
      <div>
        <h4 style={{ color: '#f87171', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: '600' }}>
          Failed to Fetch Repositories
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
          {message || 'An error occurred while communicating with the GitHub REST API.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary"
          style={{
            marginTop: '0.5rem',
            padding: '0.55rem 1.4rem',
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}
        >
          🔄 Retry Request
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
