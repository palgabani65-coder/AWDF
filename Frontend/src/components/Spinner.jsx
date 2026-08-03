import React from 'react';

/**
 * Spinner component used to display loading state during asynchronous API calls.
 */
function Spinner({ message = 'Loading repositories...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '1.25rem',
      width: '100%',
      minHeight: '260px'
    }}>
      <div 
        className="spinner-ring"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(45, 212, 191, 0.15)',
          borderTopColor: 'var(--accent-color)',
          borderRightColor: 'var(--accent-color)',
          animation: 'spin 0.8s linear infinite',
          boxShadow: '0 0 15px rgba(45, 212, 191, 0.2)'
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        fontWeight: '500',
        letterSpacing: '0.02em'
      }}>
        {message}
      </p>
    </div>
  );
}

export default Spinner;
